import { Prisma, PrismaClient } from '@prisma/client';
import { randomInt, randomUUID } from 'node:crypto';
import { answerQuestion, phaseAt, RoomError, roomView, joinRoomPlayer, rankedPlayers, settleRoom, assertRoomMember, isRoomObserver } from './engine';
import { pollRoom } from './poll';
import { MAX_ROOM_PLAYERS } from './settings';
import type { RoomSettings, RoomState } from './types';
import type { RoomGameAction } from './types';
import { gameMode, initializeGames, playGame } from './games';

import { roomSource, selectRoomQuestions } from './questions';
import { roomSettingsSchema } from './validation';
import { manageRoom, resetRoom } from './lifecycle';
import { archiveRoomResult, archiveRoomRound, recordRoomActivity } from './results';

const shared = globalThis as unknown as { roomDb?: PrismaClient };
const db = shared.roomDb ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') shared.roomDb = db;
type Identity = { id: string; name?: string | null };
type Row = { state: RoomState; now: number };
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function code() { return Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(''); }
function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = randomInt(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

async function transaction<T>(user: Identity, roomCode: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${user.id}, true), set_config('app.room_code', ${roomCode}, true)`;
    return run(tx);
  }, { maxWait: 5000, timeout: 30000 });
}
async function throttle(tx: Prisma.TransactionClient, id: string) {
  const rows = await tx.$queryRaw<{ count: number }[]>`INSERT INTO "BattleRoomRate" ("userId") VALUES (${id})
    ON CONFLICT ("userId") DO UPDATE SET "count" = CASE WHEN "BattleRoomRate"."windowStart" < now() - interval '1 minute' THEN 1 ELSE "BattleRoomRate"."count" + 1 END,
    "windowStart" = CASE WHEN "BattleRoomRate"."windowStart" < now() - interval '1 minute' THEN now() ELSE "BattleRoomRate"."windowStart" END RETURNING "count"`;
  if (rows[0].count > 180) throw new RoomError('Bạn thao tác quá nhanh. Thử lại sau một phút.', 429);
}
async function read(tx: Prisma.TransactionClient, roomCode: string, lock: boolean) {
  const rows = lock
    ? await tx.$queryRaw<Row[]>`SELECT "state", (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now" FROM "BattleRoom" WHERE "code" = ${roomCode} AND "expiresAt" > now() FOR UPDATE`
    : await tx.$queryRaw<Row[]>`SELECT "state", (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now" FROM "BattleRoom" WHERE "code" = ${roomCode} AND "expiresAt" > now()`;
  if (!rows[0]) throw new RoomError('Không tìm thấy phòng hoặc phòng đã hết hạn.', 404);
  return rows[0];
}
export async function createRoom(user: Identity, title: string, settings: RoomSettings) {
  if(settings.maxPlayers !== undefined && (!Number.isInteger(settings.maxPlayers)||settings.maxPlayers<2||settings.maxPlayers>MAX_ROOM_PLAYERS))throw new RoomError('Chọn sức chứa từ 2 đến 40 người.');
  for (let attempt = 0; attempt < 3; attempt++) {
    const roomCode = code();
    try {
      return await transaction(user, '__create__', async tx => {
        await throttle(tx, user.id);
        const count = await tx.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS "count" FROM "BattleRoom" WHERE "hostUserId" = ${user.id} AND "createdAt" > now() - interval '1 hour'`;
        if (count[0].count >= 10) throw new RoomError('Bạn đã tạo nhiều phòng. Thử lại sau.', 429);
        const source=await roomSource(tx,user.id,settings);
        const state: RoomState = { roundId:randomUUID(),sourceLabel:source.label,version: 1, title, hostId: user.id, settings, hostOnly:true,hostName:user.name?.trim().slice(0,60)||'Chủ phòng',observers:[],players: [], questions: [], startedAt: null, closed: false, answers: {} };
        const rows = await tx.$queryRaw<{ now: number }[]>`INSERT INTO "BattleRoom" ("code", "hostUserId", "state") VALUES (${roomCode}, ${user.id}, ${JSON.stringify(state)}::jsonb) RETURNING (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now"`;
        return roomView(roomCode, state, user.id, rows[0].now);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2002' || (error.code === 'P2010' && error.meta?.code === '23505'))) continue;
      throw error;
    }
  }
  throw new RoomError('Chưa tạo được mã phòng. Thử lại.', 503);
}

export async function getRoom(user: Identity, roomCode: string) {
  return transaction(user, roomCode, async tx => {
    const row = await pollRoom(user.id, lock => read(tx, roomCode, lock), state => tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(state)}::jsonb WHERE "code" = ${roomCode}`);
    const view=roomView(roomCode, row.state, user.id, row.now);
    if(view.previousReviewSessionId)await recordRoomActivity(tx,user.id,view.previousReviewSessionId);
    if(view.phase==='finished')view.reviewSessionId=await archiveRoomResult(tx,roomCode,row.state,user.id,true);
    return view;
  });
}

export type RoomAction = ({ action: 'join' | 'ready' | 'start' | 'leave' | 'answer' | 'settings' | 'rematch' | 'kick' | 'transfer'; ready?: boolean; question?: number; choice?: number; targetId?:string; settings?:RoomSettings } | RoomGameAction)&{roundId?:string};
export async function actOnRoom(user: Identity, roomCode: string, action: RoomAction) {
  return transaction(user, roomCode, async tx => {
    await throttle(tx, user.id);
    const row = await read(tx, roomCode, true);
    const clock = await tx.$queryRaw<{ now: number }[]>`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now"`;
    row.now = clock[0].now;
    const state = row.state;
    // Synchronize elapsed flying targets before validating the requested move.
    if (settleRoom(state, row.now)) {
      await tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(state)}::jsonb WHERE "code" = ${roomCode}`;
    }
    const phase = phaseAt(state, row.now).phase;
    if(action.action!=='join' && state.roundId && action.roundId!==state.roundId){
      if(action.action==='rematch'&&action.roundId===state.previousRoundId&&phase==='waiting'&&user.id===state.hostId)return roomView(roomCode,state,user.id,row.now);
      throw new RoomError('Phòng đã chuyển sang lượt mới. Đang cập nhật lại.',409);
    }
    const before=rankedPlayers(state,row.now);
    const me = state.players.find(p => p.id === user.id);
    if (phase === 'closed') throw new RoomError('Chủ phòng đã đóng phòng.', 410);
    if (action.action === 'join') {
      joinRoomPlayer(state,user,row.now);
    } else {
      assertRoomMember(state,user.id);
      if(action.action==='settings'||action.action==='rematch'){
        if(user.id!==state.hostId)throw new RoomError('Chỉ chủ phòng được chuẩn bị trận mới.',403);
        if(action.action==='settings'&&phase!=='waiting'||action.action==='rematch'&&phase!=='finished')throw new RoomError('Trạng thái phòng đã thay đổi.',409);
        const parsed=roomSettingsSchema.safeParse(action.settings??state.settings);if(!parsed.success)throw new RoomError('Bạn kiểm tra lại cài đặt nhé.');
        const source=await roomSource(tx,user.id,parsed.data);
        if(phase==='finished')await archiveRoomRound(tx,roomCode,state,user.id);
        resetRoom(state,user.id,parsed.data,randomUUID(),source.label,row.now);
      }else if(action.action==='kick'||action.action==='transfer'){
        if(phase==='finished'&&user.id===state.hostId)await archiveRoomRound(tx,roomCode,state,user.id);
        manageRoom(state,user.id,action.action,action.targetId??'',row.now);
      }else if (action.action === 'ready') {
        if (phase !== 'waiting') throw new RoomError('Trận đấu đã bắt đầu.', 409);
        if (!me || isRoomObserver(state,user.id)) throw new RoomError('Chủ phòng chỉ điều hành, không tham gia thi đấu.',403);
        if (me.id !== state.hostId) me.ready = !!action.ready;
      } else if (action.action === 'start') {
        if (state.hostId !== user.id) throw new RoomError('Chỉ chủ phòng được bắt đầu.', 403);
        if (phase !== 'waiting') throw new RoomError('Trận đấu đã bắt đầu.', 409);
        if (state.players.filter(p=>!p.left).length < 2 || state.players.some(p => !p.left&&!p.ready)) throw new RoomError('Cần ít nhất 2 người và tất cả đã sẵn sàng.', 409);
        const selected=await selectRoomQuestions(tx,state.hostId,state.settings);state.questions=selected.questions;state.sourceLabel=selected.label;state.learning={};
        const now = await tx.$queryRaw<{ now: number }[]>`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now"`;
        state.startedAt = now[0].now + 3000;
        if (gameMode(state) !== 'quiz') {
          initializeGames(state);
          if (gameMode(state) === 'match') state.decks = Array.from({ length: Math.ceil(state.questions.length / 6) }, (_, batch) => shuffle(Array.from({ length: Math.min(6, state.questions.length - batch * 6) * 2 }, (_, index) => index)));
        }
        row.now = now[0].now;
      } else if (action.action === 'leave') {
        if (phase === 'waiting') {
          state.players=state.players.filter(p=>p.id!==user.id);
        } else {if(phase==='finished')await archiveRoomResult(tx,roomCode,state,user.id,true);if(me)me.left=true;}
        state.observers=state.observers?.filter(p=>p.id!==user.id);
        if(state.hostId===user.id){const next=state.players.find(p=>!p.left);if(next){
          if(state.hostOnly){
            if(!['waiting','finished'].includes(phase)){state.closed=true;}
            else{state.players=state.players.filter(p=>p.id!==next.id);state.hostName=next.name;state.hostId=next.id;}
          }else{state.hostId=next.id;next.ready=true;}
        }else state.closed=true;}
      } else if (action.action === 'answer') {
        answerQuestion(state, user.id, action.question!, action.choice!, row.now);
      } else if (action.action === 'play') {
        playGame(state, user.id, action, row.now);
      }
    }
    const after=rankedPlayers(state,row.now);
    if(!['settings','rematch'].includes(action.action)&&gameMode(state)!=='quiz'&&after.some(p=>p.score!==before.find(b=>b.id===p.id)?.score)){state.previousRanks=Object.fromEntries(before.map(p=>[p.id,p.rank]));state.rankRevision=(state.rankRevision??0)+1;}
    settleRoom(state,row.now);
    await tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(state)}::jsonb, "hostUserId"=${state.hostId},
      "expiresAt" = CASE WHEN ${action.action} = 'start' THEN now() + interval '2 hours' ELSE "expiresAt" END
      WHERE "code" = ${roomCode}`;
    // A leaving player no longer receives room contents after leaving the lobby.
    if(action.action==='leave')return {left:true as const};
    const view=roomView(roomCode,state,user.id,row.now);if(view.phase==='finished')view.reviewSessionId=await archiveRoomResult(tx,roomCode,state,user.id,true);return view;
  });
}
