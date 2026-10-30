import { mkdirSync, writeFileSync } from 'node:fs';
import { exerciseFixtures } from '../fixtures/exercise-questions';
import { localWordContent } from '../fixtures/local-exercise-review';
import { exerciseContentSchema } from '../lib/exercises';
// Separate publication decision: a bounded original starter bank, never the
// synthetic deck fixtures or an automatic promotion of every local question.
const levels:Record<string,string>={decision:'B1',responsibility:'B2',awareness:'B2',research:'B1',experience:'B1',role:'B1',agreement:'B1',conclusion:'B1',threat:'B2',emissions:'B2',deadline:'B2',progress:'B1',attention:'B1',promise:'B1',impact:'B2',issue:'B1',problem:'A2',presentation:'B1',evidence:'B2',goal:'B1',government:'B1'};
const review={reviewedBy:'Codex — starter bank linguistic review, 2026-10-30',reviewedAt:'2026-10-30T15:00:00.000Z',reviewMethod:'All 21 word families checked for sentence grammar, Vietnamese meaning, distractors, permitted alternatives, one identified typo and regional spellings. Reference links retained; original explanations and translations. CEFR labels are working vocabulary levels, not IELTS band guarantees.'};
const words=localWordContent.map(w=>({key:w.word,word:w.word,pos:w.pos,ipa:w.ipa,meaning_vi:w.word==='emissions'?w.meaning_vi.split(' /// ')[0]+' /// khí thải':w.meaning_vi,example:w.example,topic:w.topic,level:levels[w.word],senses:w.review.senses.map(s=>({...s,...(w.word==='emissions'?{meaningVi:'khí thải'}:{})})),acceptedAnswers:[],sourceUrl:w.review.sourceUrl}));
const questions=exerciseFixtures.map(q=>{
 const word=localWordContent.find(w=>w.id===q.wordId)!;
 const content=structuredClone(q.content);
 if(word.word==='emissions')content.meaningVi='khí thải';
 if(content.kind==='collocations'&&word.word==='promise'){
  content.acceptedAnswers=[...content.acceptedAnswers,'make','break'];
  content.explanation='Keep a promise là giữ lời hứa. Make a promise là đưa ra lời hứa; break a promise là thất hứa. Các cụm này đều tự nhiên nhưng khác nghĩa. Đáp án trong lựa chọn ở đây là keep.';
 }
 return {id:'starter-20261030-'+q.id,version:1,mode:q.mode,wordKey:word.word,topic:q.topic,level:levels[word.word],status:'reviewed',content:exerciseContentSchema.parse(content),sourceUrl:q.sourceUrl,usageRights:'Original app practice sentences, explanations and Vietnamese translations, authorized by the project owner for publication. Dictionary links are references; dictionary entries are not reproduced.',...review};
});
if(words.length!==21||questions.length!==61||words.some(w=>!w.level))throw new Error('Unexpected starter manifest.');
mkdirSync('.drafts',{recursive:true});
writeFileSync('.drafts/production-starter-v1.json',JSON.stringify({id:'starter-20261030-v1',policy:'Additive only. New word records preserve the entire existing vocabulary. No user/SRS data imported. Exact record IDs make retries immutable.',...review,words,questions},null,2));
console.log('Publication plan prepared: 21 reviewed word records, 61 questions, five short starter decks; database unchanged.');
