import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDeckPlan } from '../lib/content-quality';
// Synthetic local/test records, never verified learning content and never inserted.
const directory=process.argv[2]||'.drafts/study-fixtures';mkdirSync(directory,{recursive:true});
const words=[];const decks=[];
for(const [i,topic]of ['Education','Environment','Technology','Health','Work'].entries()){
  const wordIds=[];
  for(let n=0;n<21;n++){
    const id=i*100+n+1;wordIds.push(id);
    words.push({id,word:topic.toLowerCase()+' '+String.fromCharCode(97+n),pos:'noun',ipa:null,meaning_vi:'Synthetic test term /// Từ kiểm thử '+topic+' '+(n+1),example:'This is a test. /// Đây là dữ liệu thử.',topic,level:'B1',status:'draft',synthetic:true});
  }
  decks.push(buildDeckPlan({topic,version:1,wordIds,stageSize:10}));
}
writeFileSync(join(directory,'words.json'),JSON.stringify(words,null,2));
writeFileSync(join(directory,'decks.json'),JSON.stringify({synthetic:true,importable:false,decks},null,2));
console.log('Wrote synthetic fixtures for five topics with 10/10/1-word stages. Database unchanged.');
