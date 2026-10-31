import type { Prisma } from '@prisma/client';
import type { RoomQuestion, RoomSettings } from './types';
import { RoomError } from './error';
import { parseMeaning } from '../parse';
import { reviewedPracticeSense } from '../practice-content';
import { shuffle, normalizeAnswer } from '../study';
import { TOPIC_LABELS } from '@/types';
export async function roomSource(tx:Prisma.TransactionClient,hostId:string,settings:RoomSettings){
 const where:Prisma.WordWhereInput={...(settings.level!=='all'?{level:settings.level}:{}),...(settings.topic&&settings.topic!=='all'?{topic:settings.topic}:{})};
 let label='Kho từ vựng';
 if(settings.sourceKind==='collection'){
  const collection=settings.collectionId&&await tx.collection.findFirst({where:{id:settings.collectionId,OR:[{userId:hostId},{isPublic:true}]},select:{id:true,name:true}});
  if(!collection)throw new RoomError('Không truy cập được bộ từ đã chọn. Chủ phòng chọn lại bộ khác nhé.',404);
  where.collections={some:{collectionId:collection.id}};label=collection.name;
 }
 if(settings.topic&&settings.topic!=='all')label+=' · '+(TOPIC_LABELS[settings.topic]||settings.topic);
 return {where,label};
}
export async function selectRoomQuestions(tx:Prisma.TransactionClient,hostId:string,settings:RoomSettings):Promise<{questions:RoomQuestion[];label:string}>{
 const {where,label}=await roomSource(tx,hostId,settings);
 const count=await tx.word.count({where}),take=Math.min(count,1000),skip=Math.max(0,Math.floor(Math.random()*(count-take+1)));
 const words=await tx.word.findMany({where,orderBy:{id:'asc'},take,skip,include:{contentReview:true}});
 const seen=new Set<string>(),meanings=new Set<string>();
 const pool=words.flatMap(w=>{const sense=reviewedPracticeSense(w.contentReview);const meaning=sense?.meaningVi||parseMeaning(w.meaning_vi,w.pos).vi||parseMeaning(w.meaning_vi,w.pos).en;const key=normalizeAnswer(w.word),mk=normalizeAnswer(meaning);
  if(!key||!mk||seen.has(key)||meanings.has(mk)||(settings.mode==='typing'&&!/^[a-z][a-z '\-]{1,19}$/i.test(w.word)))return [];
  seen.add(key);meanings.add(mk);return [{wordId:w.id,word:w.word,meaning,ipa:sense?.ipa??w.ipa,example:sense?sense.exampleEn+' /// '+sense.exampleVi:w.example}];});
 if(pool.length<settings.questionCount||pool.length<4)throw new RoomError('Nguồn này có '+pool.length+' từ phù hợp, chưa đủ '+settings.questionCount+' '+(settings.mode==='match'?'cặp':'câu')+'. Bạn giảm số câu hoặc chọn bộ khác nhé.',409);
 const questions=shuffle(pool).slice(0,settings.questionCount).map(w=>{const sniper=settings.mode==='sniper';const answer=sniper?w.word:w.meaning;const others=shuffle(pool.filter(p=>p.wordId!==w.wordId)).slice(0,3).map(p=>sniper?p.word:p.meaning);const choices=shuffle([answer,...others]);return {...w,choices,correctIndex:choices.indexOf(answer),...(sniper?{prompt:w.meaning}:{})};});
 return {questions,label};
}
