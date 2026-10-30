import { config } from 'dotenv';
config({path:'.env.local',quiet:true});config({path:'.env',quiet:true});
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient, Prisma } from '@prisma/client';
import { auditVocabulary } from '../lib/content-quality';
async function main(){
  const input=process.argv.indexOf('--input'),out=process.argv.indexOf('--out');
  let words;
  if(input>=0)words=JSON.parse(readFileSync(process.argv[input+1],'utf8'));
  else {
    const db=new PrismaClient();
    try{words=await db.$transaction(async tx=>{await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');const metadata=await tx.$queryRaw<{present:boolean}[]>`SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='WordContentReview') AS present`;return tx.word.findMany({select:{id:true,word:true,pos:true,ipa:true,meaning_vi:true,example:true,topic:true,level:true,...(metadata[0]?.present?{contentReview:{select:{status:true,sourceUrl:true,reviewedBy:true,reviewedAt:true}}}:{})},orderBy:{id:'asc'}});},{maxWait:10000,timeout:30000});}
    finally{await db.$disconnect();}
  }
  const report=auditVocabulary(words);
  if(out>=0)writeFileSync(process.argv[out+1],JSON.stringify(report,null,2));
  console.log(JSON.stringify({total:report.total,needsReview:report.findings.length,duplicateGroups:report.duplicateCandidates.length,mode:'read-only'}));
}
main().catch((e:unknown)=>{console.error('Audit failed. Check the input or read-only database connection.', e instanceof Prisma.PrismaClientKnownRequestError ? {type:e.name,code:e.code,sqlState:typeof e.meta?.code==='string'?e.meta.code:undefined} : e instanceof Error ? e.name : 'UnknownError');process.exitCode=1;});
