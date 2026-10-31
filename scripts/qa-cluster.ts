import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { assertQaConfig, type QaConfig } from './qa-local-database';
async function main(){
 const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8'));const config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8')) as QaConfig;assertQaConfig(config);
 const action=process.argv[2];if(action!=='--start'&&action!=='--stop')throw new Error('Use --start or --stop for the owned isolated QA cluster.');
 const args=['-D',join(config.directory,'cluster'),...(action==='--start'?['-l',join(config.directory,'postgres.log'),'-o','-p '+config.port+' -h 127.0.0.1','-w','start']:['-m','fast','-w','stop'])];
 await new Promise<void>((done,reject)=>{const child=spawn('C:/Program Files/PostgreSQL/18/bin/pg_ctl.exe',args,{windowsHide:true,stdio:'ignore'});child.once('error',reject);child.once('exit',code=>code===0?done():reject(new Error('Owned QA cluster operation failed.')));});console.log('Owned loopback-only QA cluster '+(action==='--start'?'started.':'stopped.'));
}main().catch(e=>{console.error(e instanceof Error?e.message:'QA cluster failed.');process.exitCode=1;});
