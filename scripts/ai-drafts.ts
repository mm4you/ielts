import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
export async function writeAiDraft(wordId:number,before:object,after:object){
  const directory=join(process.cwd(),'.drafts');mkdirSync(directory,{recursive:true});
  appendFileSync(join(directory,'vocabulary.jsonl'),JSON.stringify({wordId,status:'draft',generatedAt:new Date().toISOString(),before,after,sourceUrl:null,reviewedBy:null})+'\n');
}
