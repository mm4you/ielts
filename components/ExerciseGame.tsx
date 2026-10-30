'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, Field, Input, MessageBar, ProgressBar, Radio, RadioGroup } from '@fluentui/react-components';
import ChoiceSelect from './ChoiceSelect';
import PracticeSetup from './PracticeSetup';
import WordSourceFields, { initialPracticeSource } from './WordSourceFields';
import ExerciseFeedback from './ExerciseFeedback';
import ExerciseResults from './ExerciseResults';
import LoadingState from './LoadingState';
import { EXERCISE_INFO, type ExerciseAnswer, type ExerciseMode, type ExerciseResult, type PublicExercise } from '@/lib/exercises';
import type { PracticeSource } from '@/lib/study';

export type ExerciseRun={id:string;mode:ExerciseMode;difficulty:string;questions:PublicExercise[];results:ExerciseResult[];completed:boolean};
export default function ExerciseGame({mode,initialQuery=''}:{mode:ExerciseMode;initialQuery?:string}) {
  const params=new URLSearchParams(initialQuery);
  const [source,setSource]=useState<PracticeSource>(()=>({...initialPracticeSource(initialQuery),limit:10}));
  const [difficulty,setDifficulty]=useState(params.get('difficulty')==='advanced'?'advanced':'basic');
  const [run,setRun]=useState<ExerciseRun|null>(null),[screen,setScreen]=useState<'setup'|'play'|'results'>('setup');
  const [answer,setAnswer]=useState(''),[selection,setSelection]=useState<number|undefined>(),[feedback,setFeedback]=useState<ExerciseResult|null>(null);
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[pending,setPending]=useState(false);
  const [resuming,setResuming]=useState(!!params.get('runId'));
  const latch=useRef(false),composing=useRef(false),attempt=useRef<ExerciseAnswer|null>(null),input=useRef<HTMLInputElement>(null),nextButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const id=new URLSearchParams(initialQuery).get('runId');if(!id)return;
    const c=new AbortController();
    fetch('/api/exercises/'+encodeURIComponent(id),{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);if(d.mode!==mode)throw new Error('Lượt luyện này thuộc cách học khác.');setRun(d);setDifficulty(d.difficulty);if(d.source)setSource(d.source);setScreen(d.completed?'results':'play');}).catch(e=>{if(!c.signal.aborted)setError(e.message);}).finally(()=>{if(!c.signal.aborted)setResuming(false);});
    return()=>c.abort();
  },[initialQuery,mode]);
  useEffect(()=>{if(feedback)nextButton.current?.focus();else input.current?.focus();},[feedback,run?.id,run?.results.length]);
  async function start(nextSource=source,questionIds?:string[]) {
    if(latch.current)return;latch.current=true;setLoading(true);setError('');
    try {
      const ids=questionIds??new URLSearchParams(initialQuery).get('questions')?.split('|');
      const response=await fetch('/api/exercises',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,difficulty,source:{...nextSource,questionIds:ids}}),signal:AbortSignal.timeout(15000)});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      window.history.replaceState(null,'',window.location.pathname+'?runId='+encodeURIComponent(data.id));
      setSource(nextSource);setRun(data);setAnswer('');setSelection(undefined);setFeedback(null);setPending(false);attempt.current=null;setScreen('play');
    } catch(e){setError(e instanceof Error?e.message:'Chưa tải được câu hỏi.');}
    finally{latch.current=false;setLoading(false);}
  }
  async function submit() {
    if(latch.current||composing.current||!run||feedback)return;
    const question=run.questions[run.results.length];
    if(!question||(!attempt.current&&(!answer.trim()||(mode==='spelling-hunt'&&selection===undefined))))return;
    attempt.current??={questionId:question.id,requestId:crypto.randomUUID(),answer,selection};
    latch.current=true;setLoading(true);setPending(true);setError('');
    try {
      const response=await fetch('/api/exercises/'+run.id+'/answer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt.current),signal:AbortSignal.timeout(15000)});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setFeedback(data.result);setRun(previous=>previous?{...previous,results:[...previous.results,data.result],completed:data.completed}:previous);attempt.current=null;setPending(false);
    } catch(e){setError((e instanceof Error?e.message:'Chưa lưu được câu trả lời.')+' Nội dung bạn nhập vẫn được giữ.');}
    finally{latch.current=false;setLoading(false);}
  }
  function next() {
    if(!run)return;
    if(run.completed){setScreen('results');return;}
    setFeedback(null);setAnswer('');setSelection(undefined);setPending(false);attempt.current=null;
  }
  const info=EXERCISE_INFO[mode];
  if(resuming)return <LoadingState label="Đang mở lại lượt luyện"/>;
  if(screen==='setup')return <PracticeSetup mode={mode} title={info.name} level={source.level||'all'} onLevelChange={level=>setSource({...source,level})} hideLevel={source.kind==='replay'} exitRoute="/" loading={loading} error={error} onStart={()=>start()} rules={[mode==='collocations'?'Chọn từ để ghép thành một cụm tự nhiên.':mode==='context'?'Đọc cả câu trước khi chọn hoặc gõ từ còn thiếu.':'Mỗi câu có một từ viết sai. Chọn từ đó rồi gõ cách viết đúng.','Xem nghĩa và ví dụ sau mỗi câu.','Câu trả lời được lưu trước khi chuyển tiếp; bạn có thể luyện lại đúng những câu sai.','Điểm luyện tập không tự đổi lịch ôn hoặc đánh dấu từ đã thành thạo.']}><WordSourceFields value={source} onChange={setSource} limits={[10,20]} itemLabel="câu"/>{mode==='context'&&<Field label="Bạn muốn luyện thế nào?"><ChoiceSelect value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="basic">Cơ bản — chọn đáp án</option><option value="advanced">Nâng cao — tự gõ</option></ChoiceSelect></Field>}</PracticeSetup>;
  if(!run)return null;
  if(screen==='results')return <ExerciseResults id={run.id} results={run.results} loading={loading} error={error} onRestart={()=>start()} onRetry={ids=>start({kind:'replay',sessionId:run.id,limit:10},ids)}/>;
  const question=run.questions[Math.max(0,run.results.length-(feedback?1:0))];
  if(!question)return <MessageBar intent="error">Chưa mở được câu tiếp theo. Bạn thử tải lại lượt luyện nhé.</MessageBar>;
  return <section className="study-panel exercise-game"><div className="study-toolbar"><h1>{info.name}</h1><span>Câu {run.results.length+(feedback?0:1)}/{run.questions.length}</span><Button as="a" href={'/exercise-history/'+run.id}>Lưu và nghỉ</Button></div><ProgressBar value={run.results.length/run.questions.length} aria-label="Tiến độ lượt luyện"/>{error&&<MessageBar intent="error">{error}{pending&&<Button disabled={loading} onClick={submit}>Thử gửi lại</Button>}</MessageBar>}
    {feedback?<section className="panel study-card"><ExerciseFeedback result={feedback}/><Button ref={nextButton} appearance="primary" onClick={next}>{run.completed?'Xem kết quả':'Câu tiếp theo'}</Button></section>:<form className="panel exercise-question" onSubmit={e=>{e.preventDefault();void submit();}} onKeyDown={e=>{if(e.key==='Enter'&&e.target instanceof HTMLElement&&(e.target.getAttribute('role')==='radio'||e.target instanceof HTMLInputElement&&e.target.type==='radio')&&!e.nativeEvent.isComposing){e.preventDefault();void submit();}}}>
      {question.kind==='spelling-hunt'?<><h2>Từ nào đang viết sai?</h2><p>Chọn một từ trong câu rồi sửa lại bên dưới. Khác biệt Anh–Mỹ không được tính là lỗi.</p><p className="exercise-sentence">{question.words?.map((word,i)=>{const before=question.prompt.slice(i?question.words![i-1].end:0,word.start);return <span key={word.start}>{before}<Button type="button" appearance="subtle" aria-pressed={selection===i} disabled={pending||loading} onClick={()=>setSelection(i)}>{word.text}</Button></span>;})}{question.prompt.slice(question.words?.at(-1)?.end??0)}</p></>:<><h2 className="exercise-cloze">{question.prompt}</h2>{question.clueVi&&<p>Ý cần điền: {question.clueVi}</p>}</>}
      {question.options?<Field label="Cách điền phù hợp"><RadioGroup value={answer} onChange={(_,d)=>setAnswer(d.value)} disabled={loading||pending}>{question.options.map((option,i)=><Radio ref={i===0?input:undefined} key={option} value={option} label={option}/>)}</RadioGroup></Field>:<Field label={mode==='spelling-hunt'?'Viết đúng từ bạn đã chọn':'Từ hoặc cụm từ còn thiếu'}><Input ref={input} value={answer} disabled={loading||pending} onChange={(_,d)=>setAnswer(d.value)} onCompositionStart={()=>{composing.current=true;}} onCompositionEnd={()=>{composing.current=false;}} onKeyDown={e=>{if(e.key==='Enter'&&(e.nativeEvent.isComposing||composing.current))e.preventDefault();}} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={100}/></Field>}
      <Button type="submit" appearance="primary" disabled={loading||pending||!answer.trim()||(mode==='spelling-hunt'&&selection===undefined)}>{loading?'Đang lưu…':'Kiểm tra'}</Button>
    </form>}
  </section>;
}
