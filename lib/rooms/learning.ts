import type { RoomState, RoomWordAttempt } from './types';
import { roomRoundId } from './round';
import type { PracticeResult, PracticeWord } from '../study';
export function logRoomWord(state:RoomState,userId:string,index:number,outcome:RoomWordAttempt['outcome'],answer=''){
 if(!state.questions[index])return;
 const words=(state.learning??={})[userId]??={};const previous=words[index];
 words[index]={outcome,answer,attempts:(previous?.attempts??0)+1,wrongAttempts:(previous?.wrongAttempts??0)+(outcome==='correct'?0:1)};
}
export function roomLearningResult(code:string,state:RoomState,userId:string){
 const words:PracticeWord[]=state.questions.filter(q=>q.wordId).map(q=>({id:q.wordId!,word:q.word,meaning:q.meaning??((state.settings.mode??'quiz')==='sniper'?q.prompt:q.choices[q.correctIndex])??'',pos:null,ipa:q.ipa??null,example:q.example??null}));
 const results:PracticeResult[]=state.questions.flatMap((q,index)=>{
  if(!q.wordId)return [];
  const a=state.learning?.[userId]?.[index],quiz=(state.settings.mode??'quiz')==='quiz'?state.answers[index]?.[userId]:undefined;
  return [{wordId:q.wordId,answer:a?.answer??(quiz?q.choices[quiz.choice]:''),outcome:a?.outcome??(quiz?quiz.points>0?'correct':'wrong':'missed'),hinted:false,corrected:!!a&&a.outcome==='correct'&&a.wrongAttempts>0,attempts:a?.attempts??(quiz?1:0),failedAttempts:a?.wrongAttempts??(quiz&&quiz.points===0?1:0)}];
 });
 return {id:'room:'+code+':'+roomRoundId(state)+':'+userId,words,results};
}
