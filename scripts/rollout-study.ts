import { config } from 'dotenv';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
import { PrismaClient } from '@prisma/client';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
const exec=promisify(execFile);
const tables=['ReviewEvent','StudyPreference','StudyWordDay','PracticeSession','WordMistake','StudyDeck','StudyStage','StudyStageWord','StudyCheckpoint','WordContentReview','ExerciseQuestion','ExerciseSession','ExerciseMistake'];
async function main(){
 const app=new URL(process.env.DATABASE_URL||''),admin=new URL(process.env.ADMIN_DATABASE_URL||'');
 if(!app.hostname.startsWith('ep-plain-sunset-ao8bb4jy-')||app.hostname!==admin.hostname||app.pathname!==admin.pathname||app.pathname!=='/neondb')throw new Error('Production target identity check failed.');
 const db=new PrismaClient({datasources:{db:{url:admin.toString()}}});
 const inspect=()=>db.$transaction(async t=>{
  await t.$executeRawUnsafe('SET TRANSACTION READ ONLY');
  await t.$executeRaw`SELECT set_config('app.bypass_rls','true',true)`;
  const roles=await t.$queryRaw<{role:string;owner:boolean}[]>`SELECT current_user AS role, pg_has_role(current_user,(SELECT datdba FROM pg_database WHERE datname=current_database()),'MEMBER') AS owner`;
  const present=await t.$queryRaw<{name:string;rls:boolean;forced:boolean}[]>`SELECT relname AS name,relrowsecurity AS rls,relforcerowsecurity AS forced FROM pg_class WHERE relnamespace='public'::regnamespace AND relname=ANY(${tables}::text[])`;
  const counts=await t.$queryRaw<{words:number;users:number;activities:number;legacyTotal:bigint}[]>`SELECT (SELECT count(*)::int FROM "Word") AS words,(SELECT count(*)::int FROM "User") AS users,count(*)::int AS activities,coalesce(sum("wordsLearned"),0)::bigint AS "legacyTotal" FROM "DailyActivity"`;
  return {roles,present,counts:counts.map(c=>({...c,legacyTotal:String(c.legacyTotal)}))};
 },{timeout:30000});
 try{
  const before=await inspect();
  console.log(JSON.stringify({phase:'preflight',targetFingerprint:createHash('sha256').update(app.hostname+app.pathname).digest('hex').slice(0,12),...before}));
  if(!process.argv.includes('--apply'))return;
  if(before.present.length!==0&&before.present.length!==tables.length)throw new Error('Partial upgrade detected; inspect before applying.');
  if(!before.roles[0].owner)throw new Error('Configured administration connection does not own the database.');
  const directory=resolve('.drafts','production-rollout-'+new Date().toISOString().replace(/[:.]/g,'-'));mkdirSync(directory,{recursive:true});
  const bin='C:/Program Files/PostgreSQL/18/bin';
  const pgEnv={...process.env,PGHOST:admin.hostname.replace('-pooler.','.'),PGPORT:admin.port||'5432',PGUSER:decodeURIComponent(admin.username),PGPASSWORD:decodeURIComponent(admin.password),PGDATABASE:admin.pathname.slice(1),PGSSLMODE:'require',PGCHANNELBINDING:'require',PGOPTIONS:'-c app.bypass_rls=true',PGCLIENTENCODING:'UTF8'};
  async function command(name:string,args:string[]){try{return await exec(join(bin,name+'.exe'),args,{env:pgEnv,windowsHide:true,maxBuffer:4*1024*1024});}catch(e){const error=e as {stderr?:string};const diagnostic=(error.stderr||'').split(/\r?\n/).filter(l=>/error:|fatal:|DETAIL:|HINT:/i.test(l)).join('\n').replaceAll(decodeURIComponent(admin.password),'[redacted]').replaceAll(decodeURIComponent(app.password),'[redacted]').replace(/postgres(?:ql)?:\/\/\S+/g,'[connection redacted]');throw new Error(name+' failed: '+diagnostic.slice(0,1200));}}
  const backup=join(directory,'before.dump');
  await command('pg_dump',['--format=custom','--no-owner','--no-privileges','--enable-row-security','--file',backup]);
  if(statSync(backup).size<1024)throw new Error('Backup is unexpectedly small.');
  const listing=await command('pg_restore',['--list',backup]);if(!listing.stdout.includes('DailyActivity')||!listing.stdout.includes('UserProgress'))throw new Error('Backup catalog validation failed.');
  writeFileSync(join(directory,'before.json'),JSON.stringify(before,null,2));
  console.log('Validated full database backup stored in ignored '+directory+'.');
  if(before.present.length===0){
   const body=['prisma/study-upgrade.sql','prisma/exercises-upgrade.sql'].map(p=>readFileSync(p,'utf8').replace(/^BEGIN;\s*$/gm,'').replace(/^COMMIT;\s*$/gm,'')).join('\n');
   const role='"'+decodeURIComponent(app.username).replaceAll('"','""')+'"';
   const sql=`BEGIN; SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='90s'; SELECT pg_advisory_xact_lock(72810934); SELECT set_config('app.bypass_rls','true',true);\n${body}\nGRANT USAGE ON SCHEMA public TO ${role}; GRANT SELECT,INSERT,UPDATE,DELETE ON ${tables.map(n=>'"'+n+'"').join(',')} TO ${role}; COMMIT;`;
   const path=join(directory,'applied.sql');writeFileSync(path,sql);
   await command('psql',['-X','-v','ON_ERROR_STOP=1','-f',path]);
  }
  const after=await inspect();if(after.present.length!==tables.length||after.present.some(t=>!t.rls||!t.forced))throw new Error('New tables/RLS verification failed.');
  const client=new PrismaClient({datasources:{db:{url:app.toString()}}});
  try{assertZero(await client.exerciseSession.count());await client.exerciseQuestion.count();await client.studyDeck.count();}finally{await client.$disconnect();}
  writeFileSync(join(directory,'after.json'),JSON.stringify(after,null,2));
  console.log(JSON.stringify({phase:'migrated',tables:after.present.length,rlsVerified:true,applicationRoleAccess:true,existingWordsPreserved:after.counts[0].words===before.counts[0].words}));
 }finally{await db.$disconnect();}
}
function assertZero(n:number){if(n!==0)throw new Error('Anonymous application query exposed private sessions.');}
main().catch(e=>{console.error(e instanceof Error&&!(e instanceof Error&&e.name.startsWith('Prisma'))?e.message:'Database operation failed; inspect schema and connection without exposing secrets.');process.exitCode=1;});
