import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { calculateSRS, dueProgressWhere, getReviewStatus, MASTERY_INTERVAL_DAYS } from '../lib/srs';
import { normalizeAnswer, shuffle, stagePassed, studyDay, type PracticeResult } from '../lib/study';
import { auditVocabulary, buildDeckPlan } from '../lib/content-quality';
import { practiceSourceSchema, selectPracticeWords, StudyError } from '../lib/practice-source';
import { completePractice } from '../lib/practice-results';
import { joinRoomPlayer, roomView, RoomError } from '../lib/rooms/engine';
import type { RoomState } from '../lib/rooms/types';
import { createRoomSchema } from '../lib/rooms/validation';
import { meaningQuestions, englishQuestions, meaningKey, matchingWords } from '../lib/game-questions';
import { roomCapacity } from '../lib/rooms/settings';

function cast(tx:unknown){return tx as Prisma.TransactionClient;}
const forgot=calculateSRS('forgot',2.5,30,4);
assert.equal(forgot.repetition_count,0);assert.equal(forgot.interval_days,1);
assert.equal(getReviewStatus(0,1),'learning');
assert.equal(getReviewStatus(0,0),'new');
assert.equal(getReviewStatus(3,MASTERY_INTERVAL_DAYS),'known');
assert.deepEqual(dueProgressWhere('u',new Date(0)).OR,[{interval_days:{gt:0}},{repetition_count:{gt:0}}]);
assert.equal(studyDay(new Date('2026-10-29T18:00:00Z')).toISOString(),'2026-10-30T00:00:00.000Z');
assert.equal(studyDay(new Date('2026-10-29T18:00:00Z'),'America/New_York').toISOString(),'2026-10-29T00:00:00.000Z');
assert.equal(normalizeAnswer("  LEARNER’S   BOOK "),"learner's book");
assert.notEqual(normalizeAnswer('enviroment'),normalizeAnswer('environment'));
const original=[1,2,3,4];assert.deepEqual([...shuffle(original,()=>0)].sort(),original);assert.deepEqual(original,[1,2,3,4]);
const manifest=buildDeckPlan({topic:'Education',version:1,wordIds:Array.from({length:21},(_,i)=>i+1)});
assert.deepEqual(manifest.stages.map(s=>s.wordIds.length),[10,10,1]);
assert.deepEqual(manifest,buildDeckPlan({topic:'Education',version:1,wordIds:Array.from({length:21},(_,i)=>i+1)}));
assert.notEqual(manifest.id,buildDeckPlan({topic:'Education',version:2,wordIds:[1]}).id);
assert.throws(()=>buildDeckPlan({topic:'Education',version:1,wordIds:[1,1]}));
const r=(wordId:number,outcome:PracticeResult['outcome']='correct',hinted=false):PracticeResult=>({wordId,answer:'learn',outcome,hinted,corrected:false});
assert(stagePassed([1],[r(1)]));assert(!stagePassed([1,2],[r(1)]));assert(!stagePassed([1],[r(1,'correct',true)]));assert(!stagePassed([1],[r(1,'missed')]));
const word=(id:number,text='learn',meaning='to gain knowledge /// học')=>({id,word:text,meaning_vi:meaning,pos:'verb',ipa:'/lɜːn/',example:'We learn. /// Chúng tôi học.',topic:'Education',level:'B1',contentReview:null});
const audit=auditVocabulary([word(1),word(2,' LEARN ')]);
assert.equal(audit.duplicateCandidates.length,1);
assert(audit.findings.every(f=>f.issues.includes('review_source_required')));
assert(!practiceSourceSchema.safeParse({kind:'all',limit:0}).success);
assert(!practiceSourceSchema.safeParse({kind:'all',level:'invalid'}).success);

const questionPool=[word(1),word(2,'teach','to instruct /// dạy'),word(3,'read','read /// đọc'),word(4,'write','write /// viết'),word(5,'study','study /// học')];
assert(meaningQuestions(questionPool).every(q=>new Set(q.choices.map(c=>meaningKey({...word(99),meaning_vi:c}))).size===4));
assert.equal(meaningQuestions(questionPool.slice(0,3)).length,0);
assert(englishQuestions(questionPool).every(q=>q.choices.length===4&&new Set(q.choices).size===4));
assert.equal(matchingWords(questionPool).length,4);
async function sources(){
  let counted=false;
  await assert.rejects(()=>selectPracticeWords(cast({collection:{findFirst:async()=>null},word:{count:async()=>{counted=true;return 2;}}}),'u','typing',practiceSourceSchema.parse({kind:'collection',collectionId:'private'})),StudyError);
  assert.equal(counted,false,'Private collections cannot reach word loading');
  const empty=cast({word:{count:async()=>0,findMany:async()=>[]}});
  await assert.rejects(()=>selectPracticeWords(empty,'u','typing',practiceSourceSchema.parse({kind:'due'})),StudyError);
  let received:unknown;
  const tx=cast({word:{count:async(args:unknown)=>{received=args;return 2;},findMany:async({where}:{where:{id?:{in:number[]}}})=>[word(1),word(2,'teach','to instruct /// dạy')].filter(w=>!where.id||where.id.in.includes(w.id))},practiceSession:{findFirst:async({where}:{where:{userId:string}})=>where.userId==='u'?{results:[r(2,'wrong')]}:null}});
  const replay=await selectPracticeWords(tx,'u','spelling-bee',practiceSourceSchema.parse({kind:'replay',sessionId:'previous'}));
  assert.deepEqual(replay.words.map(w=>w.id),[2]);
  await assert.rejects(()=>selectPracticeWords(tx,'u','typing',practiceSourceSchema.parse({kind:'replay',sessionId:'previous',replayIds:[1]})),StudyError);
  await assert.rejects(()=>selectPracticeWords(tx,'other','typing',practiceSourceSchema.parse({kind:'replay',sessionId:'previous'})),StudyError);
  await selectPracticeWords(tx,'u','typing',practiceSourceSchema.parse({kind:'all',level:'B1',topic:'Education'}));
  assert.deepEqual(received,{where:{level:'B1',topic:'Education'}});
  const ambiguous=cast({word:{count:async()=>2,findMany:async()=>[word(1,'learn'),word(2,'study')]}});
  await assert.rejects(()=>selectPracticeWords(ambiguous,'u','word-rain',practiceSourceSchema.parse({kind:'all'})),StudyError);
  const stage=cast({studyStage:{findUnique:async()=>({id:'s2',deckId:'d',position:2,words:[{wordId:2},{wordId:1}]}),findMany:async()=>[{id:'s1'}]},studyCheckpoint:{count:async()=>1},word:{count:async()=>2,findMany:async()=>[word(1),word(2,'teach','to instruct /// dạy')].map(w=>({...w,contentReview:{status:'reviewed',acceptedAnswers:[],sourceUrl:'https://example.org/review',reviewedBy:'Test',reviewedAt:new Date()}}))}});
  const ordered=await selectPracticeWords(stage,'u','typing',practiceSourceSchema.parse({kind:'stage',stageId:'s2',limit:1}));
  assert.deepEqual(ordered.words.map(w=>w.id),[2,1],'Stages ignore sample limit and retain stable order');
}
async function persistence(){
  let writes=0,mistakes=0,resolved=0,completed=false,stored:PracticeResult[]=[],lastCheckpoint:unknown;
  const tx=cast({
    practiceSession:{findFirst:async({where}:{where:{userId:string}})=>where.userId==='u'?{id:'s',mode:'spelling-bee',wordIds:[1],source:{kind:'stage',stageId:'stage1'},completedAt:completed?new Date():null,results:stored}:null,update:async({data}:{data:{results:PracticeResult[]}})=>{stored=data.results;completed=true;writes++;}},
    word:{findMany:async()=>[word(1)]},
    wordMistake:{upsert:async()=>{mistakes++;},updateMany:async()=>{resolved++;}},
    studyPreference:{findUnique:async()=>null},studyWordDay:{createMany:async()=>({count:1})},dailyActivity:{upsert:async()=>{writes++;}},
    studyCheckpoint:{update:async(args:unknown)=>{lastCheckpoint=args;}},
  });
  const first=await completePractice(tx,'u','s',[{...r(1),answer:'LEARN'}]);
  assert.equal(first.passed,true);assert.equal(resolved,1);assert.equal(mistakes,0);
  const before=writes;
  assert.equal((await completePractice(tx,'u','s',[r(1,'wrong')])).passed,true);
  assert.equal(writes,before,'Duplicate completion must not write activity, mistakes or checkpoints again');
  assert(lastCheckpoint);
  await assert.rejects(()=>completePractice(tx,'other','s',[r(1)]),StudyError);
  completed=false;
  await assert.rejects(()=>completePractice(tx,'u','s',[r(2)]),StudyError);
  await assert.rejects(()=>completePractice(tx,'u','s',[r(1),r(1)]),StudyError);
  const wrong=await completePractice(tx,'u','s',[{...r(1),answer:'lern'}]);
  assert.equal(wrong.passed,false);assert.equal((wrong.results as PracticeResult[])[0].outcome,'wrong');assert.equal(mistakes,1);
}
function room(){
  const settings={title:'Test',level:'all',questionCount:5,secondsPerQuestion:10};
  assert.equal(createRoomSchema.parse(settings).maxPlayers,8);
  for(const n of [2,40])assert.equal(createRoomSchema.parse({...settings,maxPlayers:n}).maxPlayers,n);
  for(const n of [1,41,2.5,'40',null])assert(!createRoomSchema.safeParse({...settings,maxPlayers:n}).success);
  const state:RoomState={version:1,title:'40-player test',hostId:'host',settings:{level:'all',questionCount:5,secondsPerQuestion:10,maxPlayers:40},players:[{id:'host',name:'Host',ready:true,left:false}],questions:[],startedAt:null,closed:false,answers:{}};
  for(let i=1;i<40;i++)joinRoomPlayer(state,{id:'p'+i},0);
  assert.equal(state.players.length,40);
  assert.throws(()=>joinRoomPlayer(state,{id:'overflow'},0),RoomError);
  joinRoomPlayer(state,{id:'p1'},0);assert.equal(state.players.length,40);
  state.players=state.players.filter(p=>p.id!=='p2');
  // Two requests entering the row-locked critical section sequentially compete for one seat.
  const outcomes=['last-a','last-b'].map(id=>{try{joinRoomPlayer(state,{id},0);return true;}catch{return false;}});
  assert.deepEqual(outcomes,[true,false]);assert.equal(state.players.length,40);
  const legacy={...state,settings:{level:'all',questionCount:5,secondsPerQuestion:10}};
  assert.equal(roomView('ABC234',legacy,'host',0).settings.maxPlayers,8);
  assert.equal(roomCapacity({maxPlayers:2}),2);assert.equal(roomCapacity({maxPlayers:41}),8);assert.equal(roomCapacity({maxPlayers:2.5}),8);
  state.startedAt=1;
  assert.throws(()=>joinRoomPlayer(state,{id:'late'},2),RoomError);
  state.players[1].left=true;joinRoomPlayer(state,{id:state.players[1].id},2);assert.equal(state.players[1].left,false);
}
(async()=>{await sources();await persistence();room();console.log('Study tests passed: SRS, time zones, grading, source authorization, stable stages, exact replay, idempotency, mistakes and 40-player room logic. Database locking/load and browser interaction still require integration verification.');})().catch(e=>{console.error(e);process.exitCode=1;});
