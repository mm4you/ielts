import { readFileSync, writeFileSync } from 'node:fs';
import { buildDeckPlan, contentTemplateSchema } from '../lib/content-quality';
// File-only dry run. No database client, SQL execution or seed is used.
const input=process.argv[2],output=process.argv[3];
if(!input||!output)throw new Error('Usage: tsx scripts/prepare-study-decks.ts reviewed-manifest.json plan.json');
const manifest=JSON.parse(readFileSync(input,'utf8')) as {topic:string;version:number;level:string;stageSize?:number;contents:unknown[]}[];
const plans=manifest.map(d=>{
  const contents=d.contents.map(c=>contentTemplateSchema.parse(c));
  if(contents.some(c=>c.status!=='reviewed'))throw new Error('Only reviewed content may enter a system deck.');
  return {...buildDeckPlan({topic:d.topic,version:d.version,stageSize:d.stageSize,wordIds:contents.map(c=>c.wordId)}),level:d.level,contents};
});
writeFileSync(output,JSON.stringify({dryRun:true,policy:'New immutable version only. Retain old decks, stages and checkpoints. Never overwrite an active version.',plans},null,2));
console.log('Dry-run plan written; database unchanged.');
