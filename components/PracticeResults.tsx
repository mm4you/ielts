'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Checkbox, MessageBar } from '@fluentui/react-components';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import GameResult from './GameResult';
import { stagePassed, type PracticeResult, type PracticeWord } from '@/lib/study';

export default function PracticeResults({ sessionId, mode, words, results, onReplay, onRestart, stageId, saved = false }: { sessionId: string; mode: string; words: PracticeWord[]; results: PracticeResult[]; onReplay: (ids: number[])=>void; onRestart: ()=>void; stageId?: string; saved?: boolean }) {
  const [status, setStatus] = useState<'saving'|'saved'|'error'>(saved ? 'saved' : 'saving');
  const [verified, setVerified] = useState(results), [passed, setPassed] = useState(saved && !!stageId && stagePassed(words.map(w=>w.id),results));
  const [includeCorrected, setIncludeCorrected] = useState(false);
  const [message, setMessage] = useState('');
  const inFlight = useRef(false), audio = useRef<HTMLAudioElement | null>(null);
  const save = useCallback(async()=>{
    if (inFlight.current) return;
    inFlight.current=true; setStatus('saving');
    try {
      const r=await fetch('/api/practice/'+sessionId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({results}),signal:AbortSignal.timeout(15000)});
      const data=await r.json();
      if(!r.ok)throw new Error(data.error);
      setVerified(data.results);setPassed(!!data.passed);setStatus('saved');
    } catch(e){setMessage(e instanceof Error?e.message:'Chưa lưu được.');setStatus('error');}
    finally{inFlight.current=false;}
  },[sessionId,results]);
  useEffect(()=>{if(saved)return;const controller=new AbortController();async function persist(){try{const r=await fetch('/api/practice/'+sessionId,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({results}),signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});const data=await r.json();if(!r.ok)throw new Error(data.error);setVerified(data.results);setPassed(!!data.passed);setStatus('saved');}catch(e){if(!controller.signal.aborted){setMessage(e instanceof Error?e.message:'Chưa lưu được.');setStatus('error');}}}void persist();return()=>controller.abort();},[sessionId,results,saved]);
  useEffect(()=>()=>audio.current?.pause(),[]);
  const missed=verified.filter(r=>r.outcome!=='correct'||r.hinted||(includeCorrected&&r.corrected));
  const practiced=verified.filter(r=>r.attempts!==0);
  const correct=verified.filter(r=>r.outcome==='correct'&&!r.hinted).length;
  return <GameResult replayLabel={mode==='rooms'?'Về phòng thi đấu':undefined} title={mode==='rooms'?'Từ vựng sau trận':stageId ? passed ? 'Bạn đã qua chặng!' : 'Kết quả luyện chặng' : 'Kết quả luyện tập'} value={practiced.length ? Math.round(correct/(mode==='rooms'?verified.length:practiced.length)*100) : 0} label="Độ chính xác (%)" onReplay={onRestart} exitRoute={stageId?'/decks':mode==='rooms'?'/rooms':'/'} loading={status==='saving'} replayDisabled={status!=='saved'} busyLabel="Đang lưu kết quả">
    <p>{practiced.length} từ đã luyện ({verified.reduce((n,r)=>n+(r.attempts??1),0)} lượt) · {correct} tự trả lời đúng · {verified.filter(r=>r.outcome==='wrong').length} sai · {practiced.filter(r=>r.outcome==='missed').length} bỏ lỡ · {verified.filter(r=>r.hinted).length} có gợi ý</p>
    {status==='saving'&&<p role="status">Đang lưu kết quả…</p>}
    {status==='error'&&<MessageBar intent="error">{message} Kết quả chưa được lưu.<Button onClick={save}>Thử lưu lại</Button></MessageBar>}
    {status==='saved'&&<p role="status">Đã lưu. <Link href={'/practice-history/'+sessionId}>Mở lại kết quả này</Link></p>}
    {stageId&&<p>{passed?'Chặng tiếp theo đã mở.':'Thêm một lượt nữa nhé! Trả lời đúng mọi từ mà không cần gợi ý để qua chặng.'} <Link href="/decks">Xem lộ trình</Link></p>}
    <Checkbox label="Luyện thêm từ từng gõ sai rồi sửa được" checked={includeCorrected} onChange={(_,d)=>setIncludeCorrected(!!d.checked)} />
    {missed.length?<Button appearance="primary" disabled={status!=='saved'} onClick={()=>onReplay(missed.map(r=>r.wordId))}>Luyện lại các từ này ({missed.length})</Button>:<p>Không còn từ sai cần luyện lại trong lượt này.</p>}
    <ul className="study-result-list">{verified.map(r=>{const w=words.find(w=>w.id===r.wordId);if(!w)return null;return <li key={r.wordId}><div><Link href={'/word/'+w.id}><strong>{w.word}</strong></Link><p>{w.meaning}</p><small>{r.attempts===0?'Chưa luyện':r.outcome==='missed'?'Bỏ lỡ':r.outcome==='wrong'?'Sai':r.hinted?'Đúng có gợi ý':'Đúng'}{r.corrected?' · Đã sửa lỗi gõ':''}{r.answer?' · Bạn gõ: '+r.answer:''}</small></div><Button icon={<Speaker2Regular/>} aria-label={'Phát âm '+w.word} onClick={async()=>{audio.current?.pause(); const a=new Audio('/api/tts?lang=en&text='+encodeURIComponent(w.word));audio.current=a;try{await a.play();}catch{setMessage('Không phát được âm thanh.');}}}>Nghe</Button></li>;})}</ul>
    {message&&status==='saved'&&<MessageBar intent="warning">{message}</MessageBar>}
    <p>Bạn có thể ôn lại bằng thẻ học để ghi nhớ lâu hơn.</p>
  </GameResult>;
}
