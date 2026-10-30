import { config } from 'dotenv';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { exerciseContentSchema } from '../lib/exercises';
import { senseSchema, buildDeckPlan } from '../lib/content-quality';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
const metadata={reviewedBy:z.string().min(1),reviewedAt:z.iso.datetime(),reviewMethod:z.string().min(1)};
const wordSchema=z.object({key:z.string(),word:z.string(),pos:z.string(),ipa:z.string(),meaning_vi:z.string(),example:z.string(),topic:z.enum(['Education','Environment','Technology','Health','Work']),level:z.enum(['A2','B1','B2']),senses:z.array(senseSchema),acceptedAnswers:z.array(z.string()),sourceUrl:z.url()});
const manifestSchema=z.object({id:z.literal('starter-20261030-v1'),...metadata,words:z.array(wordSchema).length(21),questions:z.array(z.object({id:z.string().startsWith('starter-20261030-'),version:z.literal(1),mode:z.enum(['collocations','context','spelling-hunt']),wordKey:z.string(),topic:z.string(),level:z.string(),status:z.literal('reviewed'),content:exerciseContentSchema,sourceUrl:z.url(),usageRights:z.string().min(1),...metadata})).length(61)});
async function main(){
 const app=new URL(process.env.DATABASE_URL||''),admin=new URL(process.env.ADMIN_DATABASE_URL||'');
 if(!app.hostname.startsWith('ep-plain-sunset-ao8bb4jy-')||app.hostname!==admin.hostname||app.pathname!==admin.pathname)throw new Error('Production target identity check failed.');
 const raw=readFileSync('.drafts/production-starter-v1.json','utf8'),manifest=manifestSchema.parse(JSON.parse(raw));
 const hash=createHash('sha256').update(raw).digest('hex');
 if(new Set(manifest.words.map(w=>w.key)).size!==21||new Set(manifest.questions.map(q=>q.id)).size!==61||manifest.questions.some(q=>!manifest.words.some(w=>w.key===q.wordKey)))throw new Error('Invalid word/question bindings.');
 for(const q of manifest.questions)if(q.content.kind!=='spelling-hunt'&&q.content.options.filter(a=>q.content.acceptedAnswers.includes(a)).length!==1)throw new Error('Ambiguous options.');
 console.log(JSON.stringify({phase:'content-plan',manifest:manifest.id,sha256:hash,words:21,questions:61,apply:process.argv.includes('--apply')}));
 if(!process.argv.includes('--apply'))return;
 const db=new PrismaClient({datasources:{db:{url:admin.toString()}}});
 try{
  const result=await db.$transaction(async t=>{
   await t.$executeRaw`SELECT set_config('app.bypass_rls','true',true)`;
   await t.$executeRaw`SELECT pg_advisory_xact_lock(72810934)`;
   const existing=await t.exerciseQuestion.findMany({where:{id:{in:manifest.questions.map(q=>q.id)}}});
   if(existing.length){
    if(existing.length!==61)throw new Error('Partial bank detected.');
    for(const q of manifest.questions){const stored=existing.find(row=>row.id===q.id)!;if(stored.version!==q.version||stored.mode!==q.mode||stored.status!==q.status||stored.topic!==q.topic||stored.level!==q.level||!isDeepStrictEqual(stored.content,q.content))throw new Error('Published version differs; create a new version instead of overwriting.');}
    return {alreadyPublished:true,questions:61};
   }
   if(await t.studyDeck.count())throw new Error('Existing deck versions require an explicit merged plan.');
   const bound=new Map<string,number>();
   for(const w of manifest.words){
    const {key,senses,acceptedAnswers,sourceUrl,...data}=w;
    const row=await t.word.create({data});bound.set(key,row.id);
    await t.wordContentReview.create({data:{wordId:row.id,status:'reviewed',sourceUrl,reviewedBy:manifest.reviewedBy,reviewedAt:new Date(manifest.reviewedAt),senses,acceptedAnswers}});
   }
   for(const q of manifest.questions){
    const {wordKey,reviewMethod,...data}=q;void reviewMethod;
    await t.exerciseQuestion.create({data:{...data,wordId:bound.get(wordKey)!,reviewedAt:new Date(q.reviewedAt)}});
   }
   const decks=[];
   for(const topic of ['Education','Environment','Technology','Health','Work']){
    const ids=manifest.words.filter(w=>w.topic===topic).map(w=>bound.get(w.key)!);
    const plan=buildDeckPlan({topic,version:1,wordIds:ids});
    const stages=plan.stages.map(s=>({id:s.id,position:s.position,words:{create:s.wordIds.map((wordId,position)=>({wordId,position}))}}));
    await t.studyDeck.create({data:{id:plan.id,name:topic+' — Khởi đầu',description:'Bộ khởi đầu '+ids.length+' từ có nghĩa, ví dụ và câu luyện đi kèm. Sẽ được bổ sung bằng phiên bản mới.',topic,level:'A2–B2',version:1,stages:{create:stages}}});
    decks.push({topic,words:ids.length});
   }
   return {alreadyPublished:false,words:bound.size,questions:61,decks};
  },{maxWait:15000,timeout:60000});
  writeFileSync('.drafts/production-starter-result.json',JSON.stringify({manifest:manifest.id,sha256:hash,...result,publishedAt:new Date().toISOString()},null,2));
  console.log(JSON.stringify({phase:'content-published',...result}));
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(e instanceof Prisma.PrismaClientKnownRequestError?'Database content transaction failed (code '+e.code+'); transaction rolled back.':e instanceof Error?e.message:'Publication failed.');process.exitCode=1;});
