import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { exerciseFixtures } from '../fixtures/exercise-questions';
import { exerciseContentSchema, gradeExercise, publicExercise, sameRegionalSpelling, sentenceWords, spellingDifference, type ExerciseSnapshot, type ExerciseResult } from '../lib/exercises';
import { exerciseSourceSchema, selectExercises } from '../lib/exercise-source';
import { answerExercise } from '../lib/exercise-session';
import { StudyError } from '../lib/practice-source';

const cast=(value:unknown)=>value as Prisma.TransactionClient;
const q=(id:string)=>exerciseFixtures.find(q=>q.id===id)!;
const input=(id:string,answer:string,selection?:number)=>({questionId:id,requestId:randomUUID(),answer,selection});
const collocation=q('collocations-q001-v1');
assert.equal(gradeExercise(collocation,input(collocation.id,' MAKE '),'basic').outcome,'correct');
assert.equal(gradeExercise(collocation,input(collocation.id,'take'),'basic').outcome,'correct','British take a decision must not be rejected');
assert.equal(gradeExercise(collocation,input(collocation.id,'do'),'basic').outcome,'wrong');
const context=q('context-q001-v1');
assert.equal(gradeExercise(context,input(context.id,'choice'),'advanced').outcome,'correct');
assert(gradeExercise(context,input(context.id,'choice'),'advanced').completedText.includes('a choice'));
assert.equal(gradeExercise(context,input(context.id,'location'),'advanced').outcome,'wrong');
assert.equal(gradeExercise(context,input(context.id,'determination'),'advanced').outcome,'review','Unreviewed plausible wording is not automatically marked wrong');
const spelling=q('spelling-hunt-q021-v1'),words=sentenceWords(spelling.content.kind==='spelling-hunt'?spelling.content.sentence:'');
const badIndex=words.findIndex(w=>w.text==='goverment'),theatreIndex=words.findIndex(w=>w.text==='theatre');
assert.equal(gradeExercise(spelling,input(spelling.id,'government',badIndex),'advanced').outcome,'correct');
assert.equal(gradeExercise(spelling,input(spelling.id,'goverment',badIndex),'advanced').outcome,'wrong');
assert.equal(gradeExercise(spelling,input(spelling.id,'theater',theatreIndex),'advanced').outcome,'wrong');
assert(sameRegionalSpelling('colour','color'));assert(sameRegionalSpelling('organise','organize'));
assert(!sameRegionalSpelling('goverment','government'));
const invalid={...spelling.content,kind:'spelling-hunt',sentence:'We like the colour.',typo:'colour',errorStart:12,answer:'color',acceptedAnswers:['color'],errorType:'spelling'};
assert(!exerciseContentSchema.safeParse(invalid).success,'A legitimate British spelling cannot be authored as an error');
assert(!exerciseContentSchema.safeParse({...invalid,errorType:'grammar'}).success);
assert(!exerciseContentSchema.safeParse({...invalid,sentence:"Your welcome.",typo:'Your',errorStart:0,answer:"you're",acceptedAnswers:["you're"]}).success);
assert(!exerciseContentSchema.safeParse({...spelling.content,kind:'spelling-hunt',sentence:'The goverment and goverment agree.',typo:'goverment',errorStart:4}).success);
assert.deepEqual(spellingDifference('goverment','government'),{prefix:'gover',removed:'',added:'n',suffix:'ment'});
const publicSpelling=JSON.stringify(publicExercise(spelling,'advanced'));
assert(!publicSpelling.includes('government'));assert(!publicSpelling.includes('errorStart'));assert(!publicSpelling.includes('acceptedAnswers'));
const publicContext=publicExercise(context,'advanced');assert.equal(publicContext.options,undefined);assert(!JSON.stringify(publicContext).includes('acceptedAnswers'));
assert(exerciseFixtures.every(f=>exerciseContentSchema.safeParse(f.content).success));
for(const mode of ['collocations','context','spelling-hunt'])assert(exerciseFixtures.filter(f=>f.mode===mode).length>=20);

async function sourceTests(){
  let read=false;
  await assert.rejects(()=>selectExercises(cast({collection:{findFirst:async()=>null},exerciseQuestion:{findMany:async()=>{read=true;return [];}}}),'u','context',exerciseSourceSchema.parse({kind:'collection',collectionId:'private'})),StudyError);
  assert.equal(read,false);
  let filter:unknown;
  const rows=exerciseFixtures.filter(f=>f.mode==='context').map(f=>({...f,status:'reviewed',reviewedBy:'Local reviewer',reviewedAt:new Date()}));
  const tx=cast({exerciseQuestion:{findMany:async(args:unknown)=>{filter=args;return rows.slice(0,10);}},collection:{findFirst:async()=>({id:'public'})}});
  assert.equal((await selectExercises(tx,'u','context',exerciseSourceSchema.parse({kind:'collection',collectionId:'public',limit:10}))).length,10);
  assert.deepEqual((filter as {where:{word:unknown}}).where.word,{collections:{some:{collectionId:'public'}}});
  await assert.rejects(()=>selectExercises(tx,'u','context',exerciseSourceSchema.parse({kind:'all',limit:20})),e=>e instanceof StudyError&&e.status===409&&e.message.includes('10'));
  await selectExercises(tx,'u','context',exerciseSourceSchema.parse({kind:'all',level:'B1',topic:'Work',limit:10}));
  assert.deepEqual((filter as {where:{level:string;topic:string}}).where.level,'B1');
  const empty=cast({exerciseQuestion:{findMany:async()=>[]}});
  await assert.rejects(()=>selectExercises(empty,'u','context',exerciseSourceSchema.parse({})),e=>e instanceof StudyError&&e.message.includes('0'));
  const results:ExerciseResult[]=[gradeExercise(rows[0],input(rows[0].id,'location'),'advanced'),gradeExercise(rows[1],input(rows[1].id,'location'),'advanced'),gradeExercise(rows[2],input(rows[2].id,rows[2].content.answer),'advanced')];
  const replay=cast({exerciseSession:{findFirst:async({where}:{where:{userId:string}})=>where.userId==='u'?{results,snapshots:rows}:null},exerciseQuestion:{findMany:async({where}:{where:{id:{in:string[]}}})=>rows.filter(r=>where.id.in.includes(r.id))}});
  const ids=[rows[1].id,rows[0].id];
  assert.deepEqual((await selectExercises(replay,'u','context',exerciseSourceSchema.parse({kind:'replay',sessionId:'s',questionIds:ids}))).map(q=>q.id),ids);
  await assert.rejects(()=>selectExercises(replay,'u','context',exerciseSourceSchema.parse({kind:'replay',sessionId:'s',questionIds:[rows[2].id]})),StudyError);
  await assert.rejects(()=>selectExercises(replay,'other','context',exerciseSourceSchema.parse({kind:'replay',sessionId:'s'})),StudyError);
}
async function duplicateTests(){
  const run={id:'run',userId:'u',difficulty:'basic',snapshots:[collocation] as ExerciseSnapshot[],results:[] as ExerciseResult[],completedAt:null as Date|null};
  let activity=0,mistakes=0;
  const tx=cast({
    exerciseSession:{findFirst:async({where}:{where:{userId:string}})=>where.userId==='u'?run:null,update:async({data}:{data:{results:ExerciseResult[];completedAt?:Date}})=>{run.results=data.results;if(data.completedAt)run.completedAt=data.completedAt;}},
    exerciseMistake:{upsert:async()=>{mistakes++;},updateMany:async()=>{}},
    studyPreference:{findUnique:async()=>null},studyWordDay:{createMany:async()=>({count:1})},dailyActivity:{upsert:async()=>{activity++;}},
  });
  const submitted=input(collocation.id,'do');
  assert.equal((await answerExercise(tx,'u','run',submitted)).result.outcome,'wrong');
  assert(run.completedAt);assert.equal(activity,1);assert.equal(mistakes,1);
  assert.equal((await answerExercise(tx,'u','run',submitted)).result.outcome,'wrong');
  assert.equal(activity,1);assert.equal(mistakes,1);
  await assert.rejects(()=>answerExercise(tx,'u','run',{...submitted,answer:'make'}),StudyError);
  await assert.rejects(()=>answerExercise(tx,'other','run',submitted),StudyError);
}
(async()=>{await sourceTests();await duplicateTests();console.log('Exercises: reviewed alternatives, contextual uncertainty, regional spelling, hidden answers, exact retry, collection permissions, scarce/empty sources and duplicate saves passed.');})().catch(e=>{console.error(e);process.exitCode=1;});
