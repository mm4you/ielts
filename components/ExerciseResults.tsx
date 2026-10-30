'use client';
import Link from 'next/link';
import { Accordion, AccordionHeader, AccordionItem, AccordionPanel, Button } from '@fluentui/react-components';
import GameResult from './GameResult';
import ExerciseFeedback from './ExerciseFeedback';
import type { ExerciseResult } from '@/lib/exercises';

export default function ExerciseResults({id,results,onRestart,onRetry,loading=false,error}:{id:string;results:ExerciseResult[];onRestart:()=>void;onRetry:(ids:string[])=>void;loading?:boolean;error?:string}) {
  const correct=results.filter(r=>r.outcome==='correct'),wrong=results.filter(r=>r.outcome==='wrong'),review=results.filter(r=>r.outcome==='review');
  return <GameResult title="Bạn vừa học thêm một chút" value={correct.length*10} onReplay={onRestart} exitRoute="/" loading={loading} error={error}>
    <p>{correct.length} đúng · {wrong.length} sai{review.length?' · '+review.length+' cần xem lại':''}</p>
    <p>Mỗi câu đúng được 10 điểm. Lịch ôn và mức độ thành thạo được theo dõi riêng.</p>
    {wrong.length?<Button appearance="primary" onClick={()=>onRetry(wrong.map(r=>r.questionId))} disabled={loading}>Luyện lại câu sai ({wrong.length})</Button>:<p>Không có câu sai cần luyện lại trong lượt này.</p>}
    <p><Link href={'/exercise-history/'+id}>Mở lại kết quả này</Link></p>
    <Accordion collapsible multiple>{results.map((r,i)=><AccordionItem key={r.questionId} value={r.questionId}><AccordionHeader>Câu {i+1} · {r.outcome==='correct'?'Đúng':r.outcome==='wrong'?'Cần luyện lại':'Cần xem lại'}</AccordionHeader><AccordionPanel><p>Bạn trả lời: {r.answer}</p><ExerciseFeedback result={r}/></AccordionPanel></AccordionItem>)}</Accordion>
  </GameResult>;
}
