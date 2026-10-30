'use client';
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBar } from '@fluentui/react-components';
import PracticeResults from '@/components/PracticeResults';
import LoadingState from '@/components/LoadingState';
import type { PracticeResult, PracticeWord } from '@/lib/study';
type Run={id:string;mode:string;results:PracticeResult[];source:{kind:string;stageId?:string};words:PracticeWord[]};
export default function PracticeHistoryPage({params}:{params:Promise<{id:string}>}){
  const {id}=use(params),router=useRouter();
  const [run,setRun]=useState<Run|null>(null),[error,setError]=useState('');
  useEffect(()=>{const c=new AbortController();fetch('/api/practice/'+encodeURIComponent(id),{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}).then(setRun).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[id]);
  if(error)return <MessageBar intent="error">{error}</MessageBar>;
  if(!run)return <LoadingState/>;
  const words=run.words;
  return <PracticeResults saved sessionId={id} mode={run.mode} words={words} results={run.results} stageId={run.source.kind==='stage'?run.source.stageId:undefined} onRestart={()=>router.push('/'+run.mode+(run.source.stageId?'?stageId='+encodeURIComponent(run.source.stageId):''))} onReplay={ids=>router.push('/'+run.mode+'?sessionId='+encodeURIComponent(id)+'&replayIds='+ids.join(','))}/>;
}
