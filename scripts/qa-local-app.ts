import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { assertQaConfig, qaUrl, type QaConfig } from './qa-local-database';
const pointer=JSON.parse(readFileSync('.drafts/qa-current.json','utf8')) as {directory:string};
const config=JSON.parse(readFileSync(join(pointer.directory,'qa-config.json'),'utf8')) as QaConfig;
assertQaConfig(config);
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3002'],{
  cwd:process.cwd(),windowsHide:true,stdio:'inherit',env:{...process.env,NODE_ENV:'production',DATABASE_URL:qaUrl(config),AUTH_SECRET:config.authSecret,AUTH_URL:'http://127.0.0.1:3002',NEXTAUTH_URL:'http://127.0.0.1:3002',AUTH_GOOGLE_ID:'qa-local-disabled',AUTH_GOOGLE_SECRET:'qa-local-disabled',IS_SCRIPT:'false',MOCK_USER_ID:''},
});
child.on('exit',code=>{process.exitCode=code??1;});
process.on('SIGINT',()=>child.kill());
process.on('SIGTERM',()=>child.kill());
