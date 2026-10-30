import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { assertQaConfig, type QaConfig } from './qa-local-database';
const base='http://127.0.0.1:3002';
async function main(){
 const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8'));
 const config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8')) as QaConfig;assertQaConfig(config);
 const cookies=new Map<string,string>();
 async function request(path:string,method='GET',body?:unknown){
  const response=await fetch(base+path,{method,headers:{Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(20000)});
  for(const c of response.headers.getSetCookie()){const [pair]=c.split(';'),pos=pair.indexOf('=');cookies.set(pair.slice(0,pos),pair.slice(pos+1));}
  const data=await response.json().catch(()=>null);return {status:response.status,data};
 }
 assert.equal((await request('/api/exercises','POST',{mode:'context',source:{}})).status,401);
 const csrf=await request('/api/auth/csrf');assert(csrf.data.csrfToken);
 const signed=await fetch(base+'/api/auth/callback/credentials',{method:'POST',headers:{Cookie:[...cookies].map(([k,v])=>k+'='+v).join('; '),'Content-Type':'application/x-www-form-urlencoded','X-Auth-Return-Redirect':'1'},body:new URLSearchParams({csrfToken:csrf.data.csrfToken,email:config.accounts.browser.email,password:config.accounts.browser.password,callbackUrl:base}),redirect:'manual'});
 for(const c of signed.headers.getSetCookie()){const [pair]=c.split(';'),p=pair.indexOf('=');cookies.set(pair.slice(0,p),pair.slice(p+1));}
 const session=await request('/api/auth/session');assert.equal(session.data.user.id,'qa_browser');
 assert.equal((await request('/api/exercises','POST',{mode:'context',source:{kind:'collection',collectionId:'qa_foreign',limit:10}})).status,404);
 const empty=await request('/api/exercises','POST',{mode:'context',source:{level:'C2',limit:10}});assert.equal(empty.status,409);assert(empty.data.error.includes('0'));
 for(const mode of ['collocations','context','spelling-hunt']){
  const run=await request('/api/exercises','POST',{mode,source:{kind:'all',limit:20}});assert.equal(run.status,200);assert.equal(run.data.questions.length,20);
  const raw=JSON.stringify(run.data.questions);assert(!raw.includes('acceptedAnswers'));assert(!raw.includes('errorStart'));
  const reload=await request('/api/exercises/'+run.data.id);assert.equal(reload.status,200);assert.deepEqual(reload.data.questions,run.data.questions);
 }
 const reviewRequest={rating:'forgot',requestId:randomUUID()};
 const [a,b]=await Promise.all([request('/api/words/500001','PATCH',reviewRequest),request('/api/words/500001','PATCH',reviewRequest)]);
 assert.equal(a.status,200);assert.deepEqual(a.data,b.data);assert.equal(a.data.interval_days,1);assert.equal(a.data.repetition_count,0);
 assert.equal((await request('/api/words/500001','PATCH',{...reviewRequest,rating:'easy'})).status,409);
 assert.equal((await request('/api/words/500001','PATCH',{interval_days:999})).status,400);
 const due=await request('/api/review');assert.equal(due.status,200);
 const recommendations=await request('/api/study-next');assert.equal(recommendations.status,200);assert.equal(typeof recommendations.data.due,'number');
 const bee=await request('/api/practice','POST',{mode:'spelling-bee',source:{kind:'collection',collectionId:'qa_single',limit:10}});assert.equal(bee.status,200);assert.equal(bee.data.words.length,1);
 const body={results:[{wordId:500021,answer:'government',outcome:'correct',hinted:false,corrected:false}]};
 assert.equal((await request('/api/practice/'+bee.data.id,'POST',body)).status,200);assert.equal((await request('/api/practice/'+bee.data.id,'POST',body)).status,200);
 const history=await request('/api/practice/'+bee.data.id);assert.equal(history.status,200);assert.equal(history.data.words[0].meaning,bee.data.words[0].meaning);
 if(process.argv.includes('--audio'))console.log('External TTS HTTP status:',(await request('/api/tts?lang=en&text=government')).status);
 console.log('Local HTTP passed: normal credentials auth, 401/ACL/empty handling, all three 20-question modes, hidden answer keys, reload snapshots, idempotent SRS, server validation, recommendations and persisted practice history.');
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Local HTTP failed');process.exitCode=1;});
