import { z } from 'zod';
import { LEVELS, TOPICS } from '@/types';
import { normalizeAnswer } from './study';
import { parseMeaning } from './parse';
export const senseSchema=z.object({definitionEn:z.string().min(1),meaningVi:z.string().min(1),exampleEn:z.string().min(1),exampleVi:z.string().min(1),collocations:z.array(z.string()),wordFamily:z.array(z.string()),commonErrors:z.array(z.string()),recallAnswers:z.array(z.string().min(1).max(100)).max(30).default([])});
export const contentTemplateSchema=z.object({wordId:z.number().int().positive(),word:z.string().min(1),pos:z.string().min(1),ipa:z.string().min(1),audioText:z.string().min(1),senses:z.array(senseSchema).min(1),sourceUrl:z.url(),usageRights:z.string().min(1),status:z.enum(['draft','reviewed']),reviewedBy:z.string().optional(),reviewedAt:z.iso.datetime().optional(),acceptedAnswers:z.array(z.string().trim().min(1).max(100)).max(20)}).refine(v=>v.status!=='reviewed'||!!(v.reviewedBy&&v.reviewedAt),{message:'Reviewed content requires reviewer and date.'});
type AuditWord={id:number;word:string;pos:string|null;ipa:string|null;meaning_vi:string;example:string|null;topic:string;level:string;contentReview?:{status:string;sourceUrl:string|null;reviewedBy:string|null;reviewedAt:Date|string|null}|null};
export function auditVocabulary(words:AuditWord[]){
  const normalized=new Map<string,number[]>(),findings:{wordId:number;issues:string[]}[]=[];
  for(const w of words){
    const key=normalizeAnswer(w.word),ids=normalized.get(key)||[];ids.push(w.id);normalized.set(key,ids);
    const issues:string[]=[];
    if(!key)issues.push('missing_word');
    if(!w.pos)issues.push('missing_pos');
    if(!w.ipa)issues.push('missing_ipa');else if(!/^\/.+\/$/.test(w.ipa))issues.push('malformed_ipa');
    if((w.word+w.meaning_vi).includes('�'))issues.push('encoding_error');
    const m=parseMeaning(w.meaning_vi,w.pos);
    if(!m.en)issues.push('missing_definition');
    if(!m.vi)issues.push('missing_vi_or_legacy_plain_text');
    if((w.meaning_vi.match(/\/\/\/|\|\|\|/g)||[]).length>1)issues.push('meaning_format');
    if(!w.example)issues.push('missing_example');else if(!w.example.split(/\/\/\/|\|\|\|/)[1]?.trim())issues.push('missing_example_translation');
    if(!TOPICS.some(t=>t===w.topic))issues.push('invalid_topic');
    if(!LEVELS.some(l=>l===w.level))issues.push('invalid_level');
    if(w.contentReview?.status!=='reviewed'||!w.contentReview.sourceUrl||!w.contentReview.reviewedBy||!w.contentReview.reviewedAt)issues.push('review_source_required');
    if(issues.length)findings.push({wordId:w.id,issues});
  }
  return {total:words.length,findings,duplicateCandidates:[...normalized.entries()].filter(([,ids])=>ids.length>1).map(([word,wordIds])=>({word,wordIds,note:'Review part of speech and senses; do not auto-delete.'}))};
}
export function buildDeckPlan(input:{topic:string;version:number;wordIds:number[];stageSize?:number}){
  const size=input.stageSize??10;
  if(!['Education','Environment','Technology','Health','Work'].includes(input.topic)||!Number.isInteger(input.version)||input.version<1||!Number.isInteger(size)||size<10||size>20||!input.wordIds.length||input.wordIds.some(id=>!Number.isSafeInteger(id)||id<1)||new Set(input.wordIds).size!==input.wordIds.length)throw new Error('Invalid deck manifest');
  const id=input.topic.toLowerCase()+'-v'+input.version;
  return {id,topic:input.topic,version:input.version,stages:Array.from({length:Math.ceil(input.wordIds.length/size)},(_,i)=>({id:id+'-stage-'+(i+1),position:i+1,wordIds:input.wordIds.slice(i*size,(i+1)*size)}))};
}
