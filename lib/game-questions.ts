import { parseMeaning } from './parse';
import { normalizeAnswer, shuffle } from './study';
export type QuestionWord={id:number;word:string;pos:string|null;meaning_vi:string;ipa?:string|null};
export function meaningKey(word:QuestionWord){const meaning=parseMeaning(word.meaning_vi,word.pos);return normalizeAnswer(meaning.vi||meaning.en);}
export function meaningQuestions(words:QuestionWord[]){
  const pool=shuffle(words).filter(w=>meaningKey(w));
  return pool.flatMap(w=>{
    const seen=new Set([meaningKey(w)]);
    const other=shuffle(pool).filter(p=>{const key=meaningKey(p);if(normalizeAnswer(p.word)===normalizeAnswer(w.word)||seen.has(key))return false;seen.add(key);return true;}).slice(0,3).map(p=>p.meaning_vi);
    if(other.length<3)return [];
    const choices=shuffle([w.meaning_vi,...other]);
    return [{id:w.id,word:w.word,pos:w.pos,ipa:w.ipa??null,choices,correctIndex:choices.indexOf(w.meaning_vi)}];
  });
}
export function englishQuestions(words:QuestionWord[]){
  return shuffle(words).flatMap(w=>{
    if(!meaningKey(w)||!normalizeAnswer(w.word))return [];
    const seen=new Set([normalizeAnswer(w.word)]);
    const other=shuffle(words).filter(p=>{const key=normalizeAnswer(p.word);if(seen.has(key)||meaningKey(p)===meaningKey(w))return false;seen.add(key);return true;}).slice(0,3).map(p=>p.word);
    if(other.length<3)return [];
    const choices=shuffle([w.word,...other]);
    return [{id:w.id,targetMeaning:w.meaning_vi,pos:w.pos,choices,correctIndex:choices.indexOf(w.word)}];
  });
}
export function matchingWords<T extends QuestionWord>(words:T[],count=6){
  const seenWords=new Set<string>(),seenMeanings=new Set<string>();
  return shuffle(words).filter(w=>{const word=normalizeAnswer(w.word),meaning=meaningKey(w);if(!meaning||seenWords.has(word)||seenMeanings.has(meaning))return false;seenWords.add(word);seenMeanings.add(meaning);return true;}).slice(0,count);
}
