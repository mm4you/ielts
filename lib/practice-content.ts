import { z } from 'zod';
import { normalizeAnswer } from './study';
import { senseSchema } from './content-quality';
type Review={status:string;sourceUrl:string|null;reviewedBy:string|null;reviewedAt:Date|null;acceptedAnswers:string[];senses:unknown};
export function contentIsReviewed(review:Review|null|undefined):review is Review {
  return !!review&&review.status==='reviewed'&&!!review.sourceUrl&&!!review.reviewedBy&&!!review.reviewedAt;
}
const senses=z.array(z.object({recallAnswers:z.array(z.string().min(1).max(100)).max(30).default([])}));
export function reviewedPracticeSense(review:Review|null|undefined){
  if(!contentIsReviewed(review))return null;
  const parsed=z.array(senseSchema).min(1).safeParse(review.senses);
  return parsed.success?parsed.data[0]:null;
}
export function practiceAnswers(word:string,mode:string,review:Review|null|undefined) {
  if(!contentIsReviewed(review))return [word];
  const parsed=senses.safeParse(review.senses);
  const variants=mode==='word-rain'?(parsed.success?parsed.data.flatMap(s=>s.recallAnswers):[]):review.acceptedAnswers;
  return [...new Set([word,...variants].map(normalizeAnswer))];
}
export function maskPracticeText(text:string,answers:string[]) {
  const candidates=[...new Set(answers.map(normalizeAnswer))].filter(Boolean).sort((a,b)=>b.length-a.length);
  if(!candidates.length)return text;
  const escaped=candidates.map(a=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/ +/g,'\\s+'));
  return text.replace(/[‘’ʼ]/g,"'").replace(new RegExp('\\b(?:'+escaped.join('|')+')\\b','gi'),'___');
}
export function storedPracticeKey(source:unknown) {
  const parsed=z.object({answerKey:z.record(z.string(),z.array(z.string()))}).safeParse(source);
  return parsed.success?parsed.data.answerKey:null;
}
