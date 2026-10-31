import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { assertQaConfig,qaUrl,type QaConfig } from './qa-local-database';
import type { RoomState } from '../lib/rooms/types';
const base='http://127.0.0.1:3002';
async function main(){
 const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8'));const config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8')) as QaConfig;assertQaConfig(config);
 const db=new PrismaClient({datasources:{db:{url:qaUrl(config,true)}}});
 async function login(account:{email:string;password:string}){
  const cookies=new Map<string,string>();const cookie=()=>[...cookies].map(([k,v])=>k+'='+v).join('; ');
  async function request(path:string,body?:unknown){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie(),...(body?{'Content-Type':'application/json',Origin:base}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(30000)});for(const c of response.headers.getSetCookie()){const [pair]=c.split(';'),p=pair.indexOf('=');cookies.set(pair.slice(0,p),pair.slice(p+1));}return {status:response.status,data:await response.json().catch(()=>null)};}
  const csrf=await request('/api/auth/csrf');const signed=await fetch(base+'/api/auth/callback/credentials',{method:'POST',headers:{Cookie:cookie(),'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({...account,csrfToken:csrf.data.csrfToken,callbackUrl:base}),redirect:'manual'});for(const c of signed.headers.getSetCookie()){const [pair]=c.split(';'),p=pair.indexOf('=');cookies.set(pair.slice(0,p),pair.slice(p+1));}assert((await request('/api/auth/session')).data.user);return request;
 }
 try{
  const host=await login(config.accounts.browser),guest=await login(config.accounts.other),third=await login(config.accounts.admin);
  const settings={title:'HTTP QA room',level:'all',mode:'quiz',questionCount:5,secondsPerQuestion:10,maxPlayers:40,sourceKind:'collection',collectionId:'qa_private',topic:'all'};
  const created=await host('/api/rooms',settings);assert.equal(created.status,200);const code=created.data.code,path='/api/rooms/'+code,roundId=created.data.roundId;
  assert.equal(created.data.players.length,0);assert(created.data.isObserver);assert.equal((await host(path,{action:'ready',roundId,ready:true})).status,403);
  assert.equal((await guest(path,{action:'join'})).status,200);assert.equal((await third(path,{action:'join'})).status,200);assert.equal((await third(path,{action:'ready',ready:true,roundId})).status,200);
  assert.equal((await guest(path,{action:'settings',settings,roundId})).status,403);
  assert.equal((await guest(path,{action:'ready',ready:true})).status,409);
  assert.equal((await guest(path,{action:'ready',ready:true,roundId})).status,200);
  assert.equal((await host(path,{action:'start',roundId})).status,200);
  const rows=await db.$queryRaw<{state:RoomState}[]>`SELECT "state" FROM "BattleRoom" WHERE "code"=${code}`;const state=rows[0].state;state.startedAt=Date.now()-3200;
  await db.$executeRaw`UPDATE "BattleRoom" SET "state"=${JSON.stringify(state)}::jsonb WHERE "code"=${code}`;
  const wrong=(state.questions[0].correctIndex+1)%4;
  assert.equal((await host(path,{action:'answer',roundId,question:0,choice:wrong})).status,403);assert.equal((await third(path,{action:'answer',roundId,question:0,choice:wrong})).status,200);
  assert.equal((await guest(path,{action:'answer',roundId,question:0,choice:state.questions[0].correctIndex})).status,200);
  const hidden=await guest(path);assert.equal(hidden.data.question.correctIndex,undefined);assert(!('learning' in hidden.data));
  const current=(await db.$queryRaw<{state:RoomState}[]>`SELECT "state" FROM "BattleRoom" WHERE "code"=${code}`)[0].state;current.startedAt=Date.now()-70000;await db.$executeRaw`UPDATE "BattleRoom" SET "state"=${JSON.stringify(current)}::jsonb WHERE "code"=${code}`;
  const hostFinish=await host(path);assert.equal(hostFinish.status,200);assert.equal(hostFinish.data.phase,'finished');assert(!hostFinish.data.reviewSessionId);assert(!hostFinish.data.players.some((p:{id:string})=>p.id==='qa_browser'));
  const finish=await third(path);assert(finish.data.reviewSessionId);
  const history='/api/practice/'+encodeURIComponent(finish.data.reviewSessionId);assert.equal((await third(history)).status,200);assert.equal((await host(history)).status,404);assert.equal((await guest(history)).status,404);
  const guestFinish=await guest(path);const guestReplay=await guest('/api/practice',{mode:'spelling-bee',source:{kind:'replay',sessionId:guestFinish.data.reviewSessionId}});assert.equal(guestReplay.status,200);assert.deepEqual(guestReplay.data.words.map((w:{id:number})=>w.id).sort(),state.questions.slice(1).map(q=>q.wordId).sort());
  const replay=await third('/api/practice',{mode:'spelling-bee',source:{kind:'replay',sessionId:finish.data.reviewSessionId}});assert.equal(replay.status,200);assert.deepEqual(replay.data.words.map((w:{id:number})=>w.id).sort(),state.questions.map(q=>q.wordId).sort());
  const next=await host(path,{action:'rematch',roundId,settings:{...settings,mode:'speedrun'}});assert.equal(next.status,200);assert.equal(next.data.code,code);assert.equal(next.data.players.length,2);assert.equal(next.data.phase,'waiting');
  assert.equal((await guest(path)).data.phase,'waiting','A member polling after results sees the next lobby');
  const duplicate=await host(path,{action:'rematch',roundId});assert.equal(duplicate.data.roundId,next.data.roundId);
  assert.equal((await guest(path,{action:'play',roundId,kind:'choice',revision:0,choice:0})).status,409);
  assert.equal((await host(path,{action:'transfer',roundId:next.data.roundId,targetId:'qa_other'})).status,200);
  assert.equal((await host(path,{action:'kick',roundId:next.data.roundId,targetId:'qa_other'})).status,403);
  assert.equal((await guest(path,{action:'kick',roundId:next.data.roundId,targetId:'qa_browser'})).status,200);
  assert.equal((await host(path)).status,410);assert.equal((await host(path,{action:'join'})).status,410);
  console.log('Room HTTP passed with normal three-user credentials login: collection source, source/host permissions, round validation, hidden answers, saved private results, exact review replay, member polling through rematch, idempotence, stale plays, ownership transfer and kick/rejoin denial.');
 }finally{await db.$disconnect();}
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Room HTTP failed.');process.exitCode=1;});
