import type { Prisma } from '@prisma/client';
import type { RoomState } from './types';
import type { PracticeResult } from '../study';
import { roomLearningResult } from './learning';
import { roomRoundId } from './round';
import { recordStudy } from '../study-server';
import { Prisma as SQL } from '@prisma/client';
export async function archiveRoomResult(tx:Prisma.TransactionClient,code:string,state:RoomState,userId:string,recordActivity=false){
 if(state.hostOnly&&!state.finishedParticipants?.includes(userId)&&!state.players.some(p=>p.id===userId))return undefined;
 const {id,words,results}=roomLearningResult(code,state,userId);if(!words.length)return undefined;
 await tx.$executeRaw`SELECT set_config('app.current_user_id',${userId},true)`;
 const existing=await tx.practiceSession.findUnique({where:{id}});
 if(existing&&(!recordActivity||(existing.source as Record<string,SQL.JsonValue>).activityRecorded))return id;
 const members=await tx.$queryRaw<{id:string}[]>`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
 if(!members.length)return undefined;
 await tx.practiceSession.createMany({data:[{id,userId,mode:'rooms',wordIds:words.map(w=>w.id),results:JSON.parse(JSON.stringify(results)),source:JSON.parse(JSON.stringify({kind:'all',roomCode:code,roundId:roomRoundId(state),roomMode:state.settings.mode||'quiz',wordsSnapshot:words,activityRecorded:false})),completedAt:new Date(state.finishedAt??Date.now())}],skipDuplicates:true});
 if(recordActivity)await recordRoomActivity(tx,userId,id);
 return id;
}
export async function archiveRoomRound(tx:Prisma.TransactionClient,code:string,state:RoomState,callerId:string){
 for(const player of [...state.players].sort((a,b)=>a.id.localeCompare(b.id)))await archiveRoomResult(tx,code,state,player.id,false);
 await tx.$executeRaw`SELECT set_config('app.current_user_id',${callerId},true)`;
}

/** Called only with an authenticated member identity in this transaction. */
export async function recordRoomActivity(tx:Prisma.TransactionClient,userId:string,id:string){
 const flags=await tx.$queryRaw<{recorded:boolean}[]>`SELECT coalesce(("source"->>'activityRecorded')::boolean,false) AS recorded FROM "PracticeSession" WHERE "id"=${id} AND "userId"=${userId} AND "mode"='rooms' AND "completedAt" IS NOT NULL`;
 if(!flags.length||flags[0].recorded)return;
 await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${userId} FOR UPDATE`;
 const run=await tx.practiceSession.findUniqueOrThrow({where:{id}}),source=run.source as Record<string,SQL.JsonValue>;
 if(source.activityRecorded)return;
 const results=run.results as PracticeResult[],eventTime=run.completedAt!;
 const practiced=results.filter(r=>(r.attempts??0)>0);await recordStudy(tx,userId,practiced.map(r=>r.wordId),practiced.reduce((n,r)=>n+(r.attempts??0),0),eventTime);
 const wrong=practiced.filter(r=>r.outcome!=='correct');
 if(wrong.length)await tx.$executeRaw(SQL.sql`INSERT INTO "WordMistake" ("userId","wordId","mode","wrongCount","lastWrongAt") VALUES ${SQL.join(wrong.map(r=>SQL.sql`(${userId},${r.wordId},'rooms',${Math.max(1,r.failedAttempts??1)},${eventTime})`))} ON CONFLICT ("userId","wordId","mode") DO UPDATE SET "wrongCount"="WordMistake"."wrongCount"+EXCLUDED."wrongCount","lastWrongAt"=greatest("WordMistake"."lastWrongAt",EXCLUDED."lastWrongAt"),"resolvedAt"=CASE WHEN "WordMistake"."resolvedAt">EXCLUDED."lastWrongAt" THEN "WordMistake"."resolvedAt" ELSE NULL END`);
 const correct=practiced.filter(r=>r.outcome==='correct').map(r=>r.wordId);if(correct.length)await tx.wordMistake.updateMany({where:{userId,mode:'rooms',wordId:{in:correct},lastWrongAt:{lte:eventTime},OR:[{resolvedAt:null},{resolvedAt:{lt:eventTime}}]},data:{resolvedAt:eventTime}});
 await tx.practiceSession.update({where:{id},data:{source:JSON.parse(JSON.stringify({...source,activityRecorded:true}))}});
}
