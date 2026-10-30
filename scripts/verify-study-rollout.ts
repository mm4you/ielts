import { config } from 'dotenv';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { selectExercises, exerciseSourceSchema } from '../lib/exercise-source';
import { selectPracticeWords, practiceSourceSchema } from '../lib/practice-source';
import { readFileSync, writeFileSync } from 'node:fs';
import { gradeExercise, sentenceWords } from '../lib/exercises';
import { randomUUID } from 'node:crypto';
async function main(){
 const url=new URL(process.env.DATABASE_URL||'');if(!url.hostname.startsWith('ep-plain-sunset-ao8bb4jy-')||url.pathname!=='/neondb')throw new Error('Production identity mismatch.');
 const db=new PrismaClient();
 try{
  const result=await db.$transaction(async t=>{
   await t.$executeRawUnsafe('SET TRANSACTION READ ONLY');
   const roles=await t.$queryRaw<{role:string;super:boolean;bypass:boolean}[]>`SELECT current_user AS role,rolsuper AS super,rolbypassrls AS bypass FROM pg_roles WHERE rolname=current_user`;
   assert.equal(roles[0].role,'ielts_app');assert(!roles[0].super&&!roles[0].bypass);
   assert.equal(await t.exerciseSession.count(),0);assert.equal(await t.studyCheckpoint.count(),0);
   const questions=await t.exerciseQuestion.findMany({where:{id:{startsWith:'starter-20261030-'}}});assert.equal(questions.length,61);
   for(const mode of ['collocations','context','spelling-hunt'] as const){
    const selected=await selectExercises(t,'',mode,exerciseSourceSchema.parse({limit:20}));assert.equal(selected.length,20);
    for(const q of selected){const content=q.content;const selection=content.kind==='spelling-hunt'?sentenceWords(content.sentence).findIndex(w=>w.start===content.errorStart):undefined;const graded=gradeExercise(q,{questionId:q.id,requestId:randomUUID(),answer:content.answer,selection},'advanced');assert.equal(graded.outcome,'correct');}
   }
   for(const mode of ['word-rain','spelling-bee','typing']){
    const selected=await selectPracticeWords(t,'',mode,practiceSourceSchema.parse({limit:20}));assert.equal(selected.words.length,20);
   }
   const decks=await t.studyDeck.findMany({include:{stages:{include:{words:true}}}});assert.equal(decks.length,5);
   for(const deck of decks)for(const stage of deck.stages){for(const mode of ['word-rain','spelling-bee','typing']){const selected=await selectPracticeWords(t,'',mode,practiceSourceSchema.parse({kind:'stage',stageId:stage.id}));assert.equal(selected.words.length,stage.words.length);}}
   const words=await t.word.count();assert.equal(words,6174);
   return {role:roles[0].role,questions:questions.length,decks:decks.map(d=>({topic:d.topic,words:d.stages.reduce((n,s)=>n+s.words.length,0)})),totalWords:words,publicSourcesAndAllStagesPassed:true,privateSessionsHidden:true};
  },{maxWait:10000,timeout:60000});
  const admin=new PrismaClient({datasources:{db:{url:process.env.ADMIN_DATABASE_URL}}});
  try{const counts=await admin.$transaction(async t=>{await t.$executeRawUnsafe('SET TRANSACTION READ ONLY');await t.$executeRaw`SELECT set_config('app.bypass_rls','true',true)`;return t.$queryRaw<{unique:bigint;practice:bigint;legacy:bigint}[]>`SELECT coalesce(sum("wordsLearned"),0)::bigint AS unique,coalesce(sum("practiceCount"),0)::bigint AS practice,coalesce(sum("legacyInteractionCount"),0)::bigint AS legacy FROM "DailyActivity"`;});assert(Number(counts[0].legacy)>=989);console.log(JSON.stringify({archivedLegacyInteractions:String(counts[0].legacy),practiceAttempts:String(counts[0].practice),uniqueWordsSinceMigration:String(counts[0].unique)}));}finally{await admin.$disconnect();}
  const manifest=JSON.parse(readFileSync('.drafts/production-starter-v1.json','utf8'));assert.equal(manifest.questions.length,61);
  writeFileSync('.drafts/production-verification.json',JSON.stringify({verifiedAt:new Date().toISOString(),...result},null,2));console.log(JSON.stringify(result));
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(e instanceof Error&&e.name.startsWith('Prisma')?'Production read-only verification failed.':e instanceof Error?e.message:'Verification failed.');process.exitCode=1;});
