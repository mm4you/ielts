'use client';
import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, MessageBar } from '@fluentui/react-components';
import LoadingState from '@/components/LoadingState';
import ExerciseResults from '@/components/ExerciseResults';
import { EXERCISE_INFO } from '@/lib/exercises';
import type { ExerciseRun } from '@/components/ExerciseGame';

export default function ExerciseHistoryPage({params}:{params:Promise<{id:string}>}) {
  const {id}=use(params),router=useRouter();
  const [run,setRun]=useState<ExerciseRun|null>(null),[error,setError]=useState('');
  useEffect(()=>{const c=new AbortController();fetch('/api/exercises/'+encodeURIComponent(id),{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}).then(setRun).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[id]);
  if(error)return <MessageBar intent="error">{error}</MessageBar>;
  if(!run)return <LoadingState/>;
  const href=run.mode==='context'?'/context-practice':'/'+run.mode;
  if(!run.completed)return <section className="panel study-panel"><h1>{EXERCISE_INFO[run.mode].name}</h1><p>Bạn đã làm {run.results.length}/{run.questions.length} câu. Phần đã trả lời được giữ nguyên.</p><Button as="a" appearance="primary" href={href+'?runId='+encodeURIComponent(id)}>Học tiếp lượt này</Button></section>;
  return <ExerciseResults id={id} results={run.results} onRestart={()=>router.push(href)} onRetry={ids=>router.push(href+'?sessionId='+encodeURIComponent(id)+'&questions='+encodeURIComponent(ids.join('|'))+'&difficulty='+run.difficulty)}/>;
}
