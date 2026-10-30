import { exerciseFixtures } from './exercise-questions';
import { exerciseContentSchema } from '../lib/exercises';

/**
 * Explicit language review ledger for ORIGINAL local/test material.
 * This is not an approval to import these records into the user's database.
 */
const reviewNotes: Record<number,string> = {
  1:'make/take a decision are both accepted; do is not used as the collocation.',
  2:'take/accept/assume responsibility; context also accepts blame/accountability.',
  3:'raise/increase/build awareness; no grammar error introduced in the spelling sentence.',
  4:'do/conduct/carry out research; do is accepted, make research is rejected.',
  5:'gain/get/acquire experience; contextual knowledge/training/skills are allowed.',
  6:'play/have a role; the contextual alternative part is accepted.',
  7:'reach/make/sign an agreement; the article an also permits accord.',
  8:'draw/reach a conclusion; contextual judgement/judgment are both allowed.',
  9:'pose/present a threat; risk and danger fit the contextual sentence.',
  10:'reduce/cut/lower/decrease/curb emissions; carbon pollution fits the context.',
  11:'meet/hit a deadline; due date and cut-off/cutoff forms are accepted in context.',
  12:'make progress; improvement/improvements/headway fit the contextual sentence.',
  13:'pay/give attention; heed is an approved contextual alternative.',
  14:'keep/honour/honor/fulfil/fulfill a promise; no regional spelling is marked as an error.',
  15:'have/make an impact; effect/influence are accepted in context.',
  16:'address/tackle/resolve/handle an issue; related contextual nouns are accepted.',
  17:'tackle/solve/address/handle a problem; challenge/issue/difficulty fit the context.',
  18:'deliver/give/make/do a presentation; do was removed from the distractors during review.',
  19:'provide/present/supply/offer evidence; research/findings/data fit the context.',
  20:'set/establish a goal; target/aim/objective are accepted. The typo is gola, not the legitimate British word gaol.',
  21:'goverment is corrected to government; theatre/theater are explicitly legitimate variants.',
};
export const localReviewedExercises=exerciseFixtures.map(q=>{
  const ordinal=Number(q.id.match(/-q(\d+)-v1$/)?.[1]);
  if(!reviewNotes[ordinal])throw new Error('Missing explicit local content review: '+q.id);
  exerciseContentSchema.parse(q.content);
  return { ...q,status:'reviewed' as const,reviewedBy:'Codex local fixture review; editorial approval still required for publication',reviewedAt:'2026-10-30T00:00:00.000Z',reviewNote:reviewNotes[ordinal] };
});
export const localWordContent=[
  ['decision','/dɪˈsɪʒ.ən/','an act of choosing what to do'],
  ['responsibility','/rɪˌspɒn.səˈbɪl.ə.ti/','a duty to take care of something or answer for it'],
  ['awareness','/əˈweə.nəs/','knowledge that something exists or is happening'],
  ['research','/rɪˈsɜːtʃ/','careful study to discover new information'],
  ['experience','/ɪkˈspɪə.ri.əns/','knowledge or skill gained by doing something'],
  ['role','/rəʊl/','the function someone or something has'],
  ['agreement','/əˈɡriː.mənt/','an arrangement accepted by two or more sides'],
  ['conclusion','/kənˈkluː.ʒən/','an opinion reached after examining information'],
  ['threat','/θret/','a possible cause of harm'],
  ['emissions','/ɪˈmɪʃ.ənz/','gases or other substances released into the air'],
  ['deadline','/ˈded.laɪn/','the latest time something must be finished'],
  ['progress','/ˈprəʊ.ɡres/','movement towards an improved result'],
  ['attention','/əˈten.ʃən/','careful listening, watching, or thinking'],
  ['promise','/ˈprɒm.ɪs/','a statement that you will do something'],
  ['impact','/ˈɪm.pækt/','a strong effect on someone or something'],
  ['issue','/ˈɪʃ.uː/','a subject or problem that needs discussion'],
  ['problem','/ˈprɒb.ləm/','a difficulty that needs to be dealt with'],
  ['presentation','/ˌprez.ənˈteɪ.ʃən/','a talk that explains information to an audience'],
  ['evidence','/ˈev.ɪ.dəns/','information that supports a belief or claim'],
  ['goal','/ɡəʊl/','a result that someone aims to achieve'],
  ['government','/ˈɡʌv.ən.mənt/','the group that governs a country'],
].map(([word,ipa,definition],index)=>{
  const question=localReviewedExercises.find(q=>q.wordId===500001+index)!;
  const context=localReviewedExercises.find(q=>q.wordId===question.wordId&&q.mode==='context')??question;
  return {id:question.wordId,word,pos:'noun',ipa,meaning_vi:definition+' /// '+question.content.meaningVi,example:context.content.exampleEn+' /// '+context.content.exampleVi,topic:question.topic,level:question.level,review:{sourceUrl:question.sourceUrl,reviewedBy:question.reviewedBy,reviewedAt:question.reviewedAt,senses:[{definitionEn:definition,meaningVi:question.content.meaningVi,exampleEn:context.content.exampleEn,exampleVi:context.content.exampleVi,collocations:localReviewedExercises.filter(q=>q.wordId===question.wordId&&q.content.kind==='collocations').map(q=>q.content.kind==='collocations'?q.content.fullPhrase:''),wordFamily:[],recallAnswers:context.content.acceptedAnswers,commonErrors:localReviewedExercises.filter(q=>q.wordId===question.wordId&&q.content.kind==='spelling-hunt').map(q=>q.content.kind==='spelling-hunt'?q.content.typo+' → '+q.content.answer:'')}]}};
});
