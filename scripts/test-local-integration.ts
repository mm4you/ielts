import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { PrismaClient, type Prisma } from '@prisma/client';
import { assertQaConfig, qaUrl, type QaConfig } from './qa-local-database';
import { exerciseSourceSchema, selectExercises } from '../lib/exercise-source';
import { answerExercise } from '../lib/exercise-session';
import { completePractice } from '../lib/practice-results';
import { practiceSourceSchema, selectPracticeWords } from '../lib/practice-source';
import type { PracticeResult } from '../lib/study';

async function main(){
 const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8'));
 const config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8')) as QaConfig;
 assertQaConfig(config);
 process.env.DATABASE_URL=qaUrl(config);process.env.IS_SCRIPT='false';delete process.env.MOCK_USER_ID;
 const db=new PrismaClient({datasources:{db:{url:qaUrl(config)}}});
 const tx=<T>(user:string,run:(t:Prisma.TransactionClient)=>Promise<T>)=>db.$transaction(async t=>{
   await t.$executeRaw`SELECT set_config('app.current_user_id', ${user}, true)`;
   await t.$queryRaw`SELECT "id" FROM "User" WHERE "id"=${user} FOR UPDATE`;
   return run(t);
 },{maxWait:15000,timeout:20000});
 try{
  const roles=await db.$queryRaw<{rolsuper:boolean;rolbypassrls:boolean}[]>`SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user`;
  assert.equal(roles[0].rolsuper,false);assert.equal(roles[0].rolbypassrls,false);
  assert.equal(await tx('qa_browser',t=>t.collection.count({where:{id:'qa_foreign'}})),0);
  const source=(collectionId:string)=>exerciseSourceSchema.parse({kind:'collection',collectionId,limit:10});
  await assert.rejects(()=>tx('qa_browser',t=>selectExercises(t,'qa_browser','context',source('qa_foreign'))));
  for(const collection of ['qa_private','qa_public'])assert.equal((await tx('qa_browser',t=>selectExercises(t,'qa_browser','context',source(collection)))).length,10);
  await assert.rejects(()=>tx('qa_browser',t=>selectExercises(t,'qa_browser','context',source('qa_single'))));
  await assert.rejects(()=>tx('qa_browser',t=>selectExercises(t,'qa_browser','context',exerciseSourceSchema.parse({level:'C2'}))));
  const snapshots=await tx('qa_browser',t=>selectExercises(t,'qa_browser','context',exerciseSourceSchema.parse({limit:10})));
  assert(!snapshots.some(q=>q.id==='qa-draft-hidden'));
  const run=await tx('qa_browser',t=>t.exerciseSession.create({data:{userId:'qa_browser',mode:'context',difficulty:'advanced',source:{kind:'all'},questionIds:snapshots.map(q=>q.id),snapshots}}));
  const first=snapshots[0],request={questionId:first.id,requestId:randomUUID(),answer:first.content.kind==='context'?first.content.acceptedAnswers[0]:'',selection:undefined};
  const before=await tx('qa_browser',t=>t.dailyActivity.findMany());
  const duplicate=await Promise.all([tx('qa_browser',t=>answerExercise(t,'qa_browser',run.id,request)),tx('qa_browser',t=>answerExercise(t,'qa_browser',run.id,request))]);
  assert.deepEqual(JSON.parse(JSON.stringify(duplicate[0])),JSON.parse(JSON.stringify(duplicate[1])));
  const saved=await tx('qa_browser',t=>t.exerciseSession.findUniqueOrThrow({where:{id:run.id}}));assert.equal((saved.results as unknown[]).length,1);
  assert.equal(await tx('qa_other',t=>t.exerciseSession.count({where:{id:run.id}})),0);
  await assert.rejects(()=>tx('qa_other',t=>answerExercise(t,'qa_other',run.id,request)));
  await assert.rejects(()=>tx('qa_browser',t=>answerExercise(t,'qa_browser',run.id,{...request,requestId:randomUUID()})));
  for(const [i,q] of snapshots.slice(1).entries()){
   assert(q.content.kind==='context');
   const answer=i===0?q.content.rejectedAnswers[0]:q.content.acceptedAnswers[0];
   await tx('qa_browser',t=>answerExercise(t,'qa_browser',run.id,{questionId:q.id,requestId:randomUUID(),answer}));
  }
  const replay=await tx('qa_browser',t=>selectExercises(t,'qa_browser','context',exerciseSourceSchema.parse({kind:'replay',sessionId:run.id})));
  assert.deepEqual(replay.map(q=>q.id),[snapshots[1].id]);
  const activity=await tx('qa_browser',t=>t.dailyActivity.findMany());
  assert.equal(activity.reduce((n,d)=>n+d.practiceCount,0)-before.reduce((n,d)=>n+d.practiceCount,0),10);
  const progress=await tx('qa_browser',t=>t.userProgress.findMany());assert(progress.every(p=>p.interval_days===1&&p.repetition_count===0));
  const words=await tx('qa_browser',t=>selectPracticeWords(t,'qa_browser','word-rain',practiceSourceSchema.parse({kind:'collection',collectionId:'qa_single'})));
  assert.equal(words.words.length,1);assert(words.words[0].context?.includes('___'));
  const practice=await tx('qa_browser',t=>t.practiceSession.create({data:{userId:'qa_browser',mode:'word-rain',source:{kind:'all',answerKey:{'500021':['government','administration']}},wordIds:[500021]}}));
  const outcome=await tx('qa_browser',t=>completePractice(t,'qa_browser',practice.id,[{wordId:500021,answer:'administration',outcome:'correct',hinted:false,corrected:false}]));
  assert.equal((outcome.results as PracticeResult[])[0].outcome,'correct');
  for(let position=1;position<=3;position++){
   const stageId='qa-cumulative-stage-'+position;
   const source=practiceSourceSchema.parse({kind:'stage',stageId});
   const selected=await tx('qa_browser',t=>selectPracticeWords(t,'qa_browser','typing',source));
   assert.equal(selected.words.length,position===3?1:10);
   const staged=await tx('qa_browser',async t=>{
    await t.studyCheckpoint.upsert({where:{userId_stageId_mode:{userId:'qa_browser',stageId,mode:'typing'}},create:{userId:'qa_browser',stageId,mode:'typing'},update:{}});
    return t.practiceSession.create({data:{userId:'qa_browser',mode:'typing',source,wordIds:selected.words.map(w=>w.id)}});
   });
   const results=selected.words.map(w=>({wordId:w.id,answer:w.word,outcome:'correct' as const,hinted:false,corrected:false}));
   assert.equal((await tx('qa_browser',t=>completePractice(t,'qa_browser',staged.id,results))).passed,true);
   assert.equal((await tx('qa_browser',t=>completePractice(t,'qa_browser',staged.id,results))).passed,true);
   const persisted=await tx('qa_browser',t=>t.studyCheckpoint.findUniqueOrThrow({where:{userId_stageId_mode:{userId:'qa_browser',stageId,mode:'typing'}}}));
   assert(persisted.completedAt);assert.equal(persisted.lastSessionId,staged.id);
  }
  const room=await import('../lib/rooms/store');
  const settings={mode:'quiz' as const,level:'all',questionCount:10,secondsPerQuestion:10,maxPlayers:40};
  const created=await room.createRoom({id:'qa_room_0'},'QA capacity',settings);
  for(let i=1;i<39;i++)await room.actOnRoom({id:'qa_room_'+i},created.code,{action:'join'});
  const last=await Promise.allSettled([39,40].map(i=>room.actOnRoom({id:'qa_room_'+i},created.code,{action:'join'})));
  assert.equal(last.filter(r=>r.status==='fulfilled').length,1);
  const state=await room.getRoom({id:'qa_room_0'},created.code);assert.equal(state.players.length,40);
  await Promise.all(Array.from({length:40},(_,i)=>room.getRoom({id:'qa_room_'+(i===39?(last[0].status==='fulfilled'?39:40):i)},created.code)));
  const small=await room.createRoom({id:'qa_room_0'},'QA two players',settings);
  await room.actOnRoom({id:'qa_room_1'},small.code,{action:'join'});await room.actOnRoom({id:'qa_room_1'},small.code,{action:'ready',ready:true,roundId:small.roundId});
  const started=await room.actOnRoom({id:'qa_room_0'},small.code,{action:'start',roundId:small.roundId});assert(!('left' in started));
  console.log('Isolated PostgreSQL integration passed: migrations, RLS/ACL, sparse sources, duplicate transactions, exact replay, unchanged SRS, saved variants, last-seat race (40) and 40 concurrent polls.');
 }finally{await db.$disconnect();await (globalThis as unknown as {roomDb?:PrismaClient}).roomDb?.$disconnect();}
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Local integration failed');process.exitCode=1;});
