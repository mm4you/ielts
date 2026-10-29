import { Prisma, PrismaClient } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { parseMeaning } from '@/lib/parse';
import { answerQuestion, phaseAt, RoomError, roomView } from './engine';
import type { RoomQuestion, RoomSettings, RoomState } from './types';
import type { RoomGameAction } from './types';
import { expireGames, gameMode, initializeGames, playGame } from './games';

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
function player(user: Identity, ready = false) { return { id: user.id, name: user.name?.trim().slice(0, 60) || 'Người chơi', ready, left: false }; }

async function transaction<T>(user: Identity, roomCode: string, run: (tx: Prisma.TransactionClient) => Promise<T>) {
  return db.$transaction(async tx => {
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${user.id}, true), set_config('app.room_code', ${roomCode}, true)`;
    return run(tx);
  }, { maxWait: 5000, timeout: 10000 });
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
async function questions(tx: Prisma.TransactionClient, settings: RoomSettings): Promise<RoomQuestion[]> {
  const words = await tx.$queryRaw<{ word: string; meaning_vi: string; pos: string | null }[]>`SELECT "word", "meaning_vi", "pos" FROM "Word" WHERE (${settings.level} = 'all' OR "level" = ${settings.level}) ORDER BY random() LIMIT 120`;
  const seen = new Set<string>();
  const seenMeanings = new Set<string>();
  const pool = words.flatMap(w => {
    const meaning = parseMeaning(w.meaning_vi, w.pos);
    const text = (meaning.vi || meaning.en).trim();
    const normalized = w.word.toLocaleLowerCase();
    if (settings.mode === 'typing' && !/^[a-z][a-z '\-]{1,19}$/i.test(w.word)) return [];
    if (!text || seen.has(normalized) || (settings.mode === 'match' && seenMeanings.has(text.toLocaleLowerCase()))) return [];
    seen.add(normalized); seenMeanings.add(text.toLocaleLowerCase()); return [{ word: w.word, text }];
  });
  const result = shuffle(pool).flatMap(w => {
    if (settings.mode === 'sniper') {
      const other = shuffle(pool.filter(p => p.word !== w.word && p.text !== w.text)).slice(0, 3).map(p => p.word);
      if (other.length < 3) return [];
      const choices = shuffle([w.word, ...other]);
      // Keep the meaning as a separate, non-answer choice field for the sniper prompt.
      return [{ word: w.word, choices, correctIndex: choices.indexOf(w.word), prompt: w.text }];
    }
    const other = shuffle([...new Set(pool.filter(p => p.text !== w.text && p.word.toLocaleLowerCase() !== w.word.toLocaleLowerCase()).map(p => p.text))]).slice(0, 3);
    if (other.length < 3) return [];
    const choices = shuffle([w.text, ...other]);
    return [{ word: w.word, choices, correctIndex: choices.indexOf(w.text) }];
  }).slice(0, settings.questionCount);
  if (result.length < settings.questionCount) throw new RoomError('Cấp độ này chưa đủ từ. Chọn cấp độ khác.', 409);
  return result;
}

export async function createRoom(user: Identity, title: string, settings: RoomSettings) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const roomCode = code();
    try {
      return await transaction(user, '__create__', async tx => {
        await throttle(tx, user.id);
        const count = await tx.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS "count" FROM "BattleRoom" WHERE "hostUserId" = ${user.id} AND "createdAt" > now() - interval '1 hour'`;
        if (count[0].count >= 10) throw new RoomError('Bạn đã tạo nhiều phòng. Thử lại sau.', 429);
        const state: RoomState = { version: 1, title, hostId: user.id, settings, players: [player(user, true)], questions: [], startedAt: null, closed: false, answers: {} };
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
    const row = await read(tx, roomCode, true);
    if (expireGames(row.state, row.now)) await tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(row.state)}::jsonb WHERE "code" = ${roomCode}`;
    return roomView(roomCode, row.state, user.id, row.now);
  });
}

export type RoomAction = { action: 'join' | 'ready' | 'start' | 'leave' | 'answer'; ready?: boolean; question?: number; choice?: number } | RoomGameAction;
export async function actOnRoom(user: Identity, roomCode: string, action: RoomAction) {
  return transaction(user, roomCode, async tx => {
    await throttle(tx, user.id);
    const row = await read(tx, roomCode, true);
    const clock = await tx.$queryRaw<{ now: number }[]>`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now"`;
    row.now = clock[0].now;
    const state = row.state;
    // Synchronize elapsed flying targets before validating the requested move.
    if (expireGames(state, row.now)) {
      await tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(state)}::jsonb WHERE "code" = ${roomCode}`;
    }
    const phase = phaseAt(state, row.now).phase;
    const me = state.players.find(p => p.id === user.id);
    if (phase === 'closed') throw new RoomError('Chủ phòng đã đóng phòng.', 410);
    if (action.action === 'join') {
      if (me) me.left = false;
      else {
        if (phase !== 'waiting') throw new RoomError('Trận đấu đã bắt đầu.', 409);
        if (state.players.length >= 8) throw new RoomError('Phòng đã đủ 8 người.', 409);
        state.players.push(player(user));
      }
    } else {
      if (!me || me.left) throw new RoomError('Bạn chưa tham gia phòng.', 403);
      if (action.action === 'ready') {
        if (phase !== 'waiting') throw new RoomError('Trận đấu đã bắt đầu.', 409);
        if (me.id !== state.hostId) me.ready = !!action.ready;
      } else if (action.action === 'start') {
        if (state.hostId !== user.id) throw new RoomError('Chỉ chủ phòng được bắt đầu.', 403);
        if (phase !== 'waiting') throw new RoomError('Trận đấu đã bắt đầu.', 409);
        if (state.players.length < 2 || state.players.some(p => !p.ready)) throw new RoomError('Cần ít nhất 2 người và tất cả đã sẵn sàng.', 409);
        state.questions = await questions(tx, state.settings);
        const now = await tx.$queryRaw<{ now: number }[]>`SELECT (extract(epoch FROM clock_timestamp()) * 1000)::float8 AS "now"`;
        state.startedAt = now[0].now + 3000;
        if (gameMode(state) !== 'quiz') {
          initializeGames(state);
          if (gameMode(state) === 'match') state.decks = Array.from({ length: Math.ceil(state.questions.length / 6) }, (_, batch) => shuffle(Array.from({ length: Math.min(6, state.questions.length - batch * 6) * 2 }, (_, index) => index)));
        }
        row.now = now[0].now;
      } else if (action.action === 'leave') {
        if (phase === 'waiting') {
          if (state.hostId === user.id) state.closed = true;
          else state.players = state.players.filter(p => p.id !== user.id);
        } else me.left = true;
      } else if (action.action === 'answer') {
        answerQuestion(state, user.id, action.question!, action.choice!, row.now);
      } else if (action.action === 'play') {
        playGame(state, user.id, action, row.now);
      }
    }
    await tx.$executeRaw`UPDATE "BattleRoom" SET "state" = ${JSON.stringify(state)}::jsonb,
      "expiresAt" = CASE WHEN ${action.action} = 'start' THEN now() + interval '2 hours' ELSE "expiresAt" END
      WHERE "code" = ${roomCode}`;
    // A leaving player no longer receives room contents after leaving the lobby.
    return action.action === 'leave' ? { left: true as const } : roomView(roomCode, state, user.id, row.now);
  });
}
