import { execFile, spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import ts from 'typescript';
import { localReviewedExercises, localWordContent } from '../fixtures/local-exercise-review';
import { buildDeckPlan } from '../lib/content-quality';

const exec=promisify(execFile);
export type QaConfig={marker:'ielts-vocab-isolated-qa';directory:string;port:number;database:string;adminPassword:string;appPassword:string;authSecret:string;accounts:{browser:{email:string;password:string};other:{email:string;password:string};admin:{email:string;password:string}}};
export function assertQaConfig(config:QaConfig) {
  const root=resolve('.drafts');
  if(config.marker!=='ielts-vocab-isolated-qa'||!resolve(config.directory).startsWith(root+'\\')||!config.database.startsWith('ielts_vocab_qa_')||config.port<1024||config.port>65535)throw new Error('Not an owned isolated QA cluster.');
}
export function qaUrl(config:QaConfig,admin=false) {
  assertQaConfig(config);
  return 'postgresql://'+(admin?'qa_admin':'qa_app')+':'+(admin?config.adminPassword:config.appPassword)+'@127.0.0.1:'+config.port+'/'+config.database+'?connection_limit=50';
}
async function main() {
  const resume=process.argv[2]==='--resume';
  if((process.argv[2]!=='--init'&&!resume)||process.env.NODE_ENV==='production')throw new Error('Use --init to create a NEW isolated local/test cluster.');
  const bin='C:/Program Files/PostgreSQL/18/bin';
  if(!existsSync(join(bin,'initdb.exe')))throw new Error('PostgreSQL 18 tools are not available.');
  let config:QaConfig,directory:string,port:number,password:string;
  if(resume){const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8'));config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8'));directory=config.directory;port=config.port;password=config.accounts.browser.password;}else{
  mkdirSync('.drafts',{recursive:true});
  directory=mkdtempSync(resolve('.drafts','study-qa-'));
  const listener=createServer();
  await new Promise<void>((done,reject)=>{listener.once('error',reject);listener.listen(0,'127.0.0.1',done);});
  const address=listener.address();if(!address||typeof address==='string')throw new Error('No local test port.');
  port=address.port;await new Promise<void>((done,reject)=>listener.close(e=>e?reject(e):done()));
  const secret=()=>randomBytes(24).toString('base64url');
  password=secret();
  config={marker:'ielts-vocab-isolated-qa',directory,port,database:'ielts_vocab_qa_'+randomBytes(5).toString('hex'),adminPassword:secret(),appPassword:secret(),authSecret:secret(),accounts:{browser:{email:'qa.browser@example.invalid',password},other:{email:'qa.other@example.invalid',password},admin:{email:'qa.editor@example.invalid',password}}};
  assertQaConfig(config);
  writeFileSync(join(directory,'qa-config.json'),JSON.stringify(config));
  writeFileSync('.drafts/qa-current.json',JSON.stringify({directory}));
  }
  assertQaConfig(config);
  const passwordFile=join(directory,'init-password.txt');writeFileSync(passwordFile,config.adminPassword+'\n');
  const pgData=join(directory,'cluster');
  const pgEnv:NodeJS.ProcessEnv={...process.env,PGPASSWORD:config.adminPassword,PGCLIENTENCODING:'UTF8'};
  const pgArgs=['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p',String(port),'-U','qa_admin','-d',config.database];
  async function command(file:string,args:string[],env=pgEnv){return exec(file,args,{cwd:process.cwd(),env,windowsHide:true,maxBuffer:4*1024*1024});}
  async function sqlFile(name:string,sql:string){const path=join(directory,name);writeFileSync(path,sql);await command(join(bin,'psql.exe'),[...pgArgs,'-f',path]);}
  if(!resume){
  console.log('Creating a new loopback-only PostgreSQL QA cluster.');
  await command(join(bin,'initdb.exe'),['-D',pgData,'-U','qa_admin','--auth=scram-sha-256','--pwfile='+passwordFile,'--encoding=UTF8','--locale=C']);
  await new Promise<void>((done,reject)=>{const child=spawn(join(bin,'pg_ctl.exe'),['-D',pgData,'-l',join(directory,'postgres.log'),'-o','-p '+port+' -h 127.0.0.1','-w','start'],{env:pgEnv,windowsHide:true,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?done():reject(new Error('QA cluster start failed.')));});
  }else console.log('Continuing setup on the existing owned QA cluster.');
  const actual=await command(join(bin,'psql.exe'),[...pgArgs.slice(0,-1),'postgres','-At','-c','SHOW data_directory']);
  if(resolve(actual.stdout.trim())!==resolve(pgData))throw new Error('Local cluster ownership check failed.');
  await command(join(bin,'createdb.exe'),['-h','127.0.0.1','-p',String(port),'-U','qa_admin',config.database]);
  const baseline=(await command('git',['show','82f8aa6:prisma/schema.prisma'])).stdout;
  const schemaFile=join(directory,'baseline.prisma'),sqlPath=join(directory,'baseline.sql');
  writeFileSync(schemaFile,baseline);
  await command(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel',schemaFile,'--script','--output',sqlPath],{...pgEnv,DATABASE_URL:qaUrl(config,true)});
  await command(join(bin,'psql.exe'),[...pgArgs,'-f',sqlPath]);
  await sqlFile('legacy-counter.sql',`INSERT INTO "User" ("id","email","role","createdAt","updatedAt") VALUES ('qa_legacy','qa.legacy@example.invalid','user',now(),now()); INSERT INTO "DailyActivity" ("id","userId","date","wordsLearned") VALUES ('qa_legacy_day','qa_legacy',DATE '2026-10-29',7);`);
  const rlsSource=ts.createSourceFile('setup_rls.ts',readFileSync('scripts/setup_rls.ts','utf8'),ts.ScriptTarget.Latest,true);
  const policies:string[]=[];
  function visit(node:ts.Node){if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='$executeRawUnsafe'){const a=node.arguments[0];if(a&&(ts.isNoSubstitutionTemplateLiteral(a)||ts.isStringLiteral(a)))policies.push(a.text);}ts.forEachChild(node,visit);}
  visit(rlsSource);
  if(policies.length<20)throw new Error('Could not extract the existing baseline RLS policies.');
  await sqlFile('baseline-rls.sql',policies.join('\n'));
  await command(join(bin,'psql.exe'),[...pgArgs,'-f',resolve('prisma/rooms.sql')]);
  await command(join(bin,'psql.exe'),[...pgArgs,'-f',resolve('prisma/study-upgrade.sql')]);
  await command(join(bin,'psql.exe'),[...pgArgs,'-f',resolve('prisma/exercises-upgrade.sql')]);
  await sqlFile('application-role.sql',`CREATE ROLE qa_app WITH LOGIN PASSWORD '${config.appPassword}' NOSUPERUSER NOBYPASSRLS; GRANT CONNECT ON DATABASE "${config.database}" TO qa_app; GRANT USAGE ON SCHEMA public TO qa_app; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO qa_app; GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO qa_app;`);
  const db=new PrismaClient({datasources:{db:{url:qaUrl(config,true)}}});
  try {
    const counter=await db.dailyActivity.findUniqueOrThrow({where:{id:'qa_legacy_day'}});
    if(counter.wordsLearned!==0||counter.legacyInteractionCount!==7||counter.practiceCount!==7)throw new Error('Historical counts were not preserved by the migration.');
    const hash=await bcrypt.hash(password,10);
    const users=[{id:'qa_browser',name:'Bạn học thử',email:config.accounts.browser.email,role:'user'},{id:'qa_other',name:'Bạn học khác',email:config.accounts.other.email,role:'user'},{id:'qa_editor',name:'Biên tập thử',email:config.accounts.admin.email,role:'admin'},...Array.from({length:41},(_,i)=>({id:'qa_room_'+i,name:'Player '+i,email:'qa.room.'+i+'@example.invalid',role:'user'}))];
    await db.user.createMany({data:users.map(u=>({...u,password:hash}))});
    await db.word.createMany({data:localWordContent.map(({review,...word})=>word)});
    await db.wordContentReview.createMany({data:localWordContent.map(w=>({wordId:w.id,status:'reviewed',sourceUrl:w.review.sourceUrl,reviewedBy:w.review.reviewedBy,reviewedAt:new Date(w.review.reviewedAt),senses:w.review.senses,acceptedAnswers:[]}))});
    await db.exerciseQuestion.createMany({data:localReviewedExercises.map(({scope,reviewNote,...q})=>({...q,reviewedAt:new Date(q.reviewedAt!)}))});
    await db.collection.createMany({data:[{id:'qa_private',userId:'qa_browser',name:'Bộ riêng để thử',isPublic:false},{id:'qa_public',userId:'qa_other',name:'Bộ chia sẻ để thử',isPublic:true},{id:'qa_foreign',userId:'qa_other',name:'Bộ riêng của bạn khác',isPublic:false},{id:'qa_single',userId:'qa_browser',name:'Một từ để luyện',isPublic:false}]});
    for(const collectionId of ['qa_private','qa_public','qa_foreign'])await db.collectionWord.createMany({data:localWordContent.slice(0,10).map(w=>({collectionId,wordId:w.id}))});
    await db.collectionWord.create({data:{collectionId:'qa_single',wordId:500021}});
    for(const topic of ['Education','Environment','Technology','Health','Work']){
      const ids=localWordContent.filter(w=>w.topic===topic).map(w=>w.id),plan=buildDeckPlan({topic,version:1,wordIds:ids});
      await db.studyDeck.create({data:{id:plan.id,name:topic+' — bộ thử',description:'Nội dung riêng cho kiểm thử local, chưa được duyệt xuất bản.',topic,level:'B1–B2',version:1,stages:{create:plan.stages.map(s=>({id:s.id,position:s.position,words:{create:s.wordIds.map((wordId,position)=>({wordId,position}))}}))}}});
    }
    const ids=localWordContent.map(w=>w.id);
    await db.studyDeck.create({data:{id:'qa-cumulative-v1',name:'QA — ôn tổng hợp',description:'Local/test checkpoint fixture',topic:'Academic',level:'B1–B2',version:1,stages:{create:Array.from({length:3},(_,i)=>({id:'qa-cumulative-stage-'+(i+1),position:i+1,words:{create:ids.slice(i*10,(i+1)*10).map((wordId,position)=>({wordId,position}))}}))}}});
    await db.userProgress.createMany({data:ids.slice(0,12).map(wordId=>({userId:'qa_browser',wordId,interval_days:1,repetition_count:0,next_review_date:new Date('2026-01-01T00:00:00Z')}))});
    await db.exerciseQuestion.create({data:{id:'qa-draft-hidden',version:1,mode:'context',wordId:500001,topic:'Work',level:'B1',status:'draft',content:localReviewedExercises.find(q=>q.mode==='context')!.content}});
    writeFileSync(join(directory,'setup-result.json'),JSON.stringify({migrationPassed:true,baselinePolicies:policies.length,words:localWordContent.length,questions:localReviewedExercises.length,roleBypassesRls:false,legacyCounterPreserved:true},null,2));
    console.log('Isolated QA database ready: '+config.database+' on 127.0.0.1:'+port+'. Existing databases were not used.');
  } finally { await db.$disconnect(); }
}
if(process.argv.includes('--init')||process.argv.includes('--resume'))main().catch(e=>{console.error('QA setup failed:',e instanceof Error?e.name:'UnknownError');process.exitCode=1;});
