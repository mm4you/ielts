import { config } from 'dotenv';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
import { PrismaClient, Prisma } from '@prisma/client';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { libraryReview, recallAlternatives } from '../fixtures/library-practice-review';
import { buildDeckPlan, senseSchema } from '../lib/content-quality';
type Snapshot={id:number;word:string;pos:string|null;ipa:string|null;meaning_vi:string;example:string|null;topic:string;level:string};
async function main(){
 const app=new URL(process.env.DATABASE_URL||''),admin=new URL(process.env.ADMIN_DATABASE_URL||'');
 if(!app.hostname.startsWith('ep-plain-sunset-ao8bb4jy-')||app.hostname!==admin.hostname||app.pathname!==admin.pathname)throw new Error('Production identity mismatch.');
 const candidates=JSON.parse(readFileSync('.drafts/library-deck-candidates.json','utf8')).words as Snapshot[];
 const reviewedAt=new Date('2026-10-30T15:40:00.000Z'),reviewedBy='Codex — existing library practice sense review, 2026-10-30';
 const words=Object.entries(libraryReview).flatMap(([topic,entries])=>entries.map(([word,ipa,meaningVi,definitionEn,exampleEn,exampleVi])=>{
  const rows=candidates.filter(w=>w.word.toLowerCase()===word);if(rows.length!==1)throw new Error('Explicit sense binding required: '+word);
  const {id,word:canonical,pos,ipa:originalIpa,meaning_vi,example,topic:originalTopic,level}=rows[0];
  return {topic,wordId:id,word,snapshot:{id,word:canonical,pos,ipa:originalIpa,meaning_vi,example,topic:originalTopic,level},sense:senseSchema.parse({definitionEn,meaningVi,exampleEn,exampleVi,ipa,pos:'noun',collocations:[],wordFamily:[],commonErrors:[],recallAnswers:recallAlternatives[word]??[]}),sourceUrl:'https://dictionary.cambridge.org/dictionary/english/'+word};
 }));
 if(words.length!==50||new Set(words.map(w=>w.wordId)).size!==50)throw new Error('Expected exactly 50 existing library bindings.');
 const sha256=createHash('sha256').update(JSON.stringify(words)).digest('hex');
 writeFileSync('.drafts/library-deck-expansion-plan.json',JSON.stringify({sha256,reviewedBy,reviewedAt,words},null,2));
 console.log(JSON.stringify({phase:'library-plan',existingWords:50,newWordRecords:0,deckVersion:2,sha256,apply:process.argv.includes('--apply')}));
 if(!process.argv.includes('--apply'))return;
 const db=new PrismaClient({datasources:{db:{url:admin.toString()}}});
 try{
  const result=await db.$transaction(async t=>{
   await t.$executeRaw`SELECT set_config('app.bypass_rls','true',true)`;await t.$executeRaw`SELECT pg_advisory_xact_lock(72810934)`;
   const versions=await t.studyDeck.findMany({where:{version:2,topic:{in:Object.keys(libraryReview)}},include:{stages:{orderBy:{position:'asc'},include:{words:{orderBy:{position:'asc'}}}}}});
   if(versions.length){if(versions.length!==5)throw new Error('Partial version detected.');for(const w of words){const metadata=await t.wordContentReview.findUniqueOrThrow({where:{wordId:w.wordId}});if(!isDeepStrictEqual(metadata.senses,[w.sense]))throw new Error('Existing version has different review content.');}return {alreadyPublished:true,decks:versions.map(d=>({topic:d.topic,words:d.stages.reduce((n,s)=>n+s.words.length,0)}))};}
   for(const w of words){
    const current=await t.word.findUniqueOrThrow({where:{id:w.wordId},select:{id:true,word:true,pos:true,ipa:true,meaning_vi:true,example:true,topic:true,level:true}});
    if(!isDeepStrictEqual(current,w.snapshot))throw new Error('Library entry changed after review: '+w.word);
    if(await t.wordContentReview.findUnique({where:{wordId:w.wordId}}))throw new Error('Existing review must not be overwritten: '+w.word);
    await t.wordContentReview.create({data:{wordId:w.wordId,status:'reviewed',sourceUrl:w.sourceUrl,reviewedBy,reviewedAt,senses:[w.sense],acceptedAnswers:[]}});
   }
   const decks=[];
   for(const topic of Object.keys(libraryReview)){
    const prior=await t.studyStageWord.findMany({where:{stage:{deck:{topic,version:1}}},orderBy:[{stage:{position:'asc'}},{position:'asc'}]});
    if(!prior.length)throw new Error('Original starter version is missing.');
    const ids=[...words.filter(w=>w.topic===topic).map(w=>w.wordId),...prior.map(w=>w.wordId)];
    const plan=buildDeckPlan({topic,version:2,wordIds:ids});
    await t.studyDeck.create({data:{id:plan.id,name:topic+' — Nền tảng',description:'Bắt đầu với 10 từ quen thuộc từ thư viện, rồi luyện thêm các cụm từ thường gặp. Nghĩa và phát âm dùng trong bài đã được rà soát.',topic,level:'Nền tảng',version:2,stages:{create:plan.stages.map(s=>({id:s.id,position:s.position,words:{create:s.wordIds.map((wordId,position)=>({wordId,position}))}}))}}});
    decks.push({topic,words:ids.length,stages:plan.stages.length});
   }
   return {alreadyPublished:false,decks};
  },{maxWait:15000,timeout:60000});
  writeFileSync('.drafts/library-deck-expansion-result.json',JSON.stringify({sha256,...result},null,2));console.log(JSON.stringify({phase:'library-published',...result}));
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(e instanceof Prisma.PrismaClientKnownRequestError?'Expansion transaction failed ('+e.code+'); no partial version was published.':e instanceof Error?e.message:'Expansion failed.');process.exitCode=1;});
