'use client';
import { BeeMascot, RecallLandscape } from './RecallScene';
import ChoiceSelect from '@/components/ChoiceSelect';
import { useEffect, useRef, useState } from 'react';
import { Button, Field, Input, MessageBar, ProgressBar } from '@fluentui/react-components';
import PracticeSetup from './PracticeSetup';
import PracticeResults from './PracticeResults';
import WordSourceFields, { initialPracticeSource } from './WordSourceFields';
import { normalizeAnswer, type PracticeResult, type PracticeSource, type PracticeWord } from '@/lib/study';
import { HeadphonesRegular } from '@fluentui/react-icons/svg/headphones';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { LightbulbRegular } from '@fluentui/react-icons/svg/lightbulb';
import { PauseRegular } from '@fluentui/react-icons/svg/pause';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { boundedGameDelta, fallingPosition } from '@/lib/typing-game';

export default function RecallGame({ mode, initialQuery='' }: { mode: 'word-rain'|'spelling-bee'|'typing'; initialQuery?:string }) {
  const [source,setSource]=useState<PracticeSource>(()=>initialPracticeSource(initialQuery));
  const [screen,setScreen]=useState<'setup'|'play'|'result'>('setup');
  const [pool,setPool]=useState<PracticeWord[]>([]),[sessionId,setSessionId]=useState('');
  const [index,setIndex]=useState(0),[results,setResults]=useState<PracticeResult[]>([]);
  const [answer,setAnswer]=useState(''),[hinted,setHinted]=useState(false),[paused,setPaused]=useState(false);
  const [feedback,setFeedback]=useState<PracticeResult|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false),[pressure,setPressure]=useState('quick');
  const [stagePosition,setStagePosition]=useState(1);
  const [y,setY]=useState(0),[elapsed,setElapsed]=useState(0),[lives,setLives]=useState(3);
  const arenaRef=useRef<HTMLDivElement>(null),targetRef=useRef<HTMLDivElement>(null),dockRef=useRef<HTMLFormElement>(null);
  const [travel,setTravel]=useState(200);
  const audio=useRef<HTMLAudioElement|null>(null),field=useRef<HTMLInputElement>(null),nextField=useRef<HTMLButtonElement>(null),submitted=useRef(false),starting=useRef(false),transitioning=useRef(false),composing=useRef(false);
  const title=mode==='word-rain'?'Mưa Từ Vựng':mode==='spelling-bee'?'Ong Chính Tả':'Luyện Gõ — Vượt màn';
  const current=pool[index];
  const deadline=source.kind==='stage'?Math.max(8000,16000-(stagePosition-1)*1000-index*150):15000;
  const timed=pressure==='quick'||source.kind==='stage';
  const [speaking,setSpeaking]=useState(false);
  useEffect(()=>()=>audio.current?.pause(),[]);
  useEffect(()=>{
    const arena=arenaRef.current,target=targetRef.current,dock=dockRef.current;
    if(!arena||!target||!dock||typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(()=>{
      const dockHeight=dock.offsetHeight+24;
      arena.style.setProperty('--recall-dock-height',dockHeight+'px');
      const top=parseFloat(getComputedStyle(arena).getPropertyValue('--recall-target-top'))||104;
      setTravel(Math.max(0,arena.clientHeight-dockHeight-24-target.offsetHeight-top));
    });
    observer.observe(arena);observer.observe(target);observer.observe(dock);
    return()=>observer.disconnect();
  },[screen,paused,feedback,current?.id]);
  useEffect(()=>{transitioning.current=false;},[index,sessionId,screen]);
  useEffect(()=>{if(feedback)nextField.current?.focus({preventScroll:true});else field.current?.focus({preventScroll:true});},[index,sessionId,feedback,paused]);
  useEffect(()=>{
    if(screen!=='play')return;
    const visibility=()=>{if(document.hidden){setPaused(true);audio.current?.pause();}};
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!e.isComposing){setPaused(p=>!p);audio.current?.pause();}};
    document.addEventListener('visibilitychange',visibility);window.addEventListener('keydown',key);
    return()=>{document.removeEventListener('visibilitychange',visibility);window.removeEventListener('keydown',key);};
  },[screen]);
  useEffect(()=>{
    if(screen!=='play'||paused||feedback||!timed)return;
    let previous=performance.now();
    const t=setInterval(()=>{const now=performance.now(),dt=boundedGameDelta(now-previous);previous=now;setY(p=>fallingPosition(p,dt,93/(deadline/1000)));setElapsed(p=>p+dt);},100);
    return()=>clearInterval(t);
  },[screen,paused,feedback,timed,deadline]);
  useEffect(()=>{
    if(screen==='play'&&!paused&&!feedback&&timed&&(y>=93||(pressure==='quick'&&source.kind!=='stage'&&elapsed>=60000))) submit(true);
  // submit reads the current question; ticking stops as soon as feedback is set.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[y,elapsed]);
  async function start(nextSource=source){
    if(starting.current)return;starting.current=true;setLoading(true);setError('');audio.current?.pause();
    try{
      const r=await fetch('/api/practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,source:nextSource}),signal:AbortSignal.timeout(15000)});
      const data=await r.json();if(!r.ok)throw new Error(data.error);
      setSource(nextSource);setStagePosition(data.stagePosition||1);setPool(data.words);setSessionId(data.id);setIndex(0);setResults([]);setAnswer('');setFeedback(null);setHinted(false);setY(0);setElapsed(0);setLives(3);setPaused(false);submitted.current=false;setScreen('play');
      setNotice(data.excluded?data.excluded+' từ trong mẫu nguồn không đủ điều kiện đã được loại.':'');
    }catch(e){setError(e instanceof Error?e.message:'Chưa tải được từ.');}finally{starting.current=false;setLoading(false);}
  }
  async function speak(slow=false){
    if(!current)return;audio.current?.pause();setError('');
    const a=new Audio('/api/tts?lang=en&text='+encodeURIComponent(current.word));audio.current=a;a.playbackRate=slow?.75:1;
    a.onended=()=>{if(audio.current===a)setSpeaking(false);};
    a.onerror=()=>{setSpeaking(false);if(audio.current===a)setError('Không phát được âm thanh. Nhấn Nghe lại để thử lại.');};
    try{await a.play();}catch{setSpeaking(false);setError('Trình duyệt chưa phát được âm thanh. Nhấn Nghe lại để thử lại.');}
  }
  useEffect(()=>{
    const timer=setTimeout(()=>{if(screen==='play'&&mode==='spelling-bee'&&!paused&&!feedback)void speak();},0);
    return()=>{clearTimeout(timer);audio.current?.pause();};
  // The new target is spoken once. Replay is always an explicit user action.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen,mode,index,sessionId,paused]);
  function submit(missed=false){
    if(!current||submitted.current||paused||composing.current)return;
    submitted.current=true;audio.current?.pause();
    const correct=[current.word,...(current.acceptedAnswers||[])].some(w=>normalizeAnswer(w)===normalizeAnswer(answer));
    const result:PracticeResult={wordId:current.id,answer,outcome:missed?'missed':correct?'correct':'wrong',hinted,corrected:false};
    setFeedback(result);setResults(r=>[...r,result]);if(result.outcome!=='correct')setLives(n=>Math.max(0,n-1));
  }
  function next(){
    if(transitioning.current)return;transitioning.current=true;
    if(index===pool.length-1||(timed&&lives===0)||(pressure==='quick'&&source.kind!=='stage'&&elapsed>=60000)){
      // Stage failure records all unplayed words as missed, so it cannot pass.
      if(source.kind==='stage'&&index<pool.length-1)setResults(r=>[...r,...pool.slice(index+1).map(w=>({wordId:w.id,answer:'',outcome:'missed' as const,hinted:false,corrected:false,attempts:0,failedAttempts:0}))]);
      setScreen('result');audio.current?.pause();
    }else {audio.current?.pause();setAnswer('');setHinted(false);setY(0);setFeedback(null);submitted.current=false;setIndex(i=>i+1);}
  }
  if(screen==='result')return <>{error&&<MessageBar intent="error">{error}</MessageBar>}<PracticeResults key={sessionId} sessionId={sessionId} mode={mode} words={pool} results={results} stageId={source.kind==='stage'?source.stageId:undefined} onRestart={()=>start()} onReplay={ids=>{void start({kind:'replay',sessionId,replayIds:ids} as PracticeSource);}} /></>;
  if(screen==='setup')return <>{error&&<MessageBar intent="error">{error}</MessageBar>}<PracticeSetup mode={mode} hideLevel={source.kind==='stage'||source.kind==='replay'} title={title} level={source.level||'all'} onLevelChange={level=>setSource({...source,level})} exitRoute="/" loading={loading} onStart={()=>start()} rules={[mode==='spelling-bee'?'Nhấn Nghe từ, tự gõ từ tiếng Anh. Có thể nghe lại hoặc nghe chậm.':mode==='typing'?'Gõ từ đang rơi, nhấn Enter để kiểm tra.':'Một nghĩa tiếng Việt mỗi lượt. Tự nhớ và gõ từ tiếng Anh; không khóa bằng ký tự đầu.','Không phân biệt hoa thường, khoảng trắng và dấu nháy cong. Lỗi chính tả không được chấp nhận.','Gợi ý được ghi riêng. Xem phản hồi rồi nhấn Tiếp theo; mục tiêu mới không che phản hồi.','Chặng: đúng toàn bộ từ không gợi ý để qua màn; luyện thêm bằng thẻ học để ghi nhớ lâu hơn.']}>{mode==='spelling-bee'&&<div className="recall-setup-preview"><BeeMascot/><p>Ong mang đến một từ. Bạn nghe rồi gõ lại nhé.</p></div>}<WordSourceFields value={source} onChange={setSource}/>{source.kind!=='stage'&&<Field label="Cách chơi"><ChoiceSelect value={pressure} onChange={e=>setPressure(e.target.value)}><option value="calm">Luyện không áp lực</option><option value="quick">Chơi nhanh · 60 giây · 3 mạng</option></ChoiceSelect></Field>}<Button as="a" href="/decks">Chọn bộ IELTS / Vượt màn</Button></PracticeSetup></>;
  return <section className={'study-panel recall-game recall-'+mode}><h1>{title}</h1>{notice&&<MessageBar intent="info">{notice}</MessageBar>}{error&&<MessageBar intent="error">{error}</MessageBar>}<div className="study-toolbar"><span>Từ {index+1}/{pool.length}{timed?' · '+lives+' mạng':''}</span><Button icon={paused?<PlayRegular/>:<PauseRegular/>} onClick={()=>{setPaused(p=>!p);audio.current?.pause();}}>{paused?'Tiếp tục':'Tạm dừng'}</Button><Button onClick={()=>{audio.current?.pause();setScreen('setup');}}>Thoát</Button></div><ProgressBar value={index/pool.length} aria-label="Tiến độ lượt luyện"/>
    {paused?<section className="panel study-card"><h2>Đã tạm dừng</h2><Button appearance="primary" onClick={()=>setPaused(false)}>Tiếp tục</Button></section>:<>
    {!feedback&&<><div ref={arenaRef} className={'recall-arena '+(mode==='spelling-bee'?'recall-meadow':'recall-rain')}>
      <div className="recall-arena-caption"><span>{mode==='spelling-bee'?'Lắng nghe · Nhớ âm · Gõ từ':'Nhìn nghĩa · Nhớ từ · Gõ đáp án'}</span><strong>{timed?'Còn '+lives+' lượt':'Luyện không áp lực'}</strong></div>
      <div ref={targetRef} className="recall-falling-target" style={{top:timed?'var(--recall-target-top)':'24%',transform:'translate(-50%, '+(timed?Math.min(y,93)/93*travel:0)+'px)'}}>
        {mode==='spelling-bee'?<><Button className="bee-listen-button" appearance="primary" icon={<HeadphonesRegular/>} onClick={()=>void speak()}>{speaking?'Ong đang đọc…':'Nghe từ / Nghe lại'}</Button><p>{current.promptMeaning??current.meaning}</p><Button appearance="subtle" icon={<Speaker2Regular/>} onClick={()=>void speak(true)}>Nghe chậm</Button></>:<><h2>{mode==='typing'?current.word:current.meaning}</h2>{current.pos&&<p>{current.pos}</p>}{current.context&&<p className="recall-context" lang="en">{current.context}</p>}</>}
        <div className="recall-letter-slots" aria-label={answer?'Bạn đã gõ '+answer.length+' ký tự':'Gõ đáp án ở ô bên dưới'}>{Array.from({length:Math.min(22,Math.max(current.word.length,answer.length))},(_,i)=><span className={answer[i]?'is-filled':''} key={i}>{answer[i]??(hinted&&i===0?current.word[0]:'')}</span>)}</div>
        {hinted&&<p>Chữ đầu: {current.word[0]} · {current.word.length} ký tự</p>}
      </div>
      <RecallLandscape bee={mode==='spelling-bee'}/>{mode==='spelling-bee'&&<div className="recall-bee-home"><BeeMascot mood={speaking?'listening':'idle'}/></div>}
      {timed&&<div className="recall-floor" aria-hidden="true"/>}
    </div><form ref={dockRef} className="study-answer recall-answer-dock" onSubmit={e=>{e.preventDefault();submit();}}><Field label="Gõ từ tiếng Anh rồi nhấn Enter"><Input ref={field} aria-label="Từ tiếng Anh" value={answer} onChange={(_,d)=>setAnswer(d.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Enter'&&(e.nativeEvent.isComposing||composing.current))e.preventDefault();}} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={100}/></Field><div className="study-actions"><Button type="submit" appearance="primary" disabled={!answer.trim()}>Kiểm tra</Button><Button type="button" icon={<LightbulbRegular/>} onClick={()=>setHinted(true)}>Gợi ý chữ đầu</Button><Button type="button" onClick={()=>submit(true)}>Bỏ qua</Button></div></form></>}
    {feedback&&<section className="panel study-card recall-feedback" aria-live="polite">{mode==='spelling-bee'&&<BeeMascot mood={feedback.outcome==='correct'?'correct':'wrong'}/>}<h2>{feedback.outcome==='correct'?'Đúng'+(hinted?' (có gợi ý)':''):feedback.outcome==='missed'?'Đã bỏ lỡ':'Chưa đúng'}: {current.word}</h2><p>{current.ipa} · {current.pos}</p><p>{current.meaning}</p><p>{current.example?.replace(/\/\/\/|\|\|\|/g,' — ')}</p><div className="study-actions"><Button icon={<Speaker2Regular/>} onClick={()=>speak()}>Phát âm</Button><Button ref={nextField} appearance="primary" onClick={next}>{index===pool.length-1?'Xem kết quả':'Tiếp theo'}</Button></div></section>}</>}
  </section>;
}
