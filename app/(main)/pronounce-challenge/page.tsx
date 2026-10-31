'use client';
import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button, Field, MessageBar, Spinner } from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons/svg/arrow-left';
import { ArrowSwapRegular } from '@fluentui/react-icons/svg/arrow-swap';
import ChoiceSelect from '@/components/ChoiceSelect';
import PageHeader from '@/components/PageHeader';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
const Recorder=dynamic(()=>import('./PronounceRoast'),{ssr:false,loading:()=> <LoadingState label="Đang chuẩn bị micro"/>});
type Word={id:number;word:string;ipa?:string|null;meaning_vi?:string|null;example?:string|null};
export default function PronunciationPage(){return <Suspense fallback={<AppLoading contained/>}><PronunciationContent/></Suspense>;}
function PronunciationContent(){
  const params=useSearchParams(),collectionId=params.get('collectionId');
  const [word,setWord]=useState<Word|null>(null),[level,setLevel]=useState('ALL'),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const active=useRef<AbortController|null>(null);
  const load=useCallback(async()=>{
    active.current?.abort();const controller=new AbortController();active.current=controller;
    setLoading(true);setError('');
    try{
      const query=new URLSearchParams({level});if(collectionId)query.set('collectionId',collectionId);
      const res=await fetch('/api/word/random?'+query,{signal:controller.signal});const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Chưa tải được từ vựng.');
      if(!controller.signal.aborted)setWord(data);
    }catch(e){if(!controller.signal.aborted){setWord(null);setError(e instanceof Error?e.message:'Không thể tải từ. Bạn thử lại nhé.');}}
    finally{if(!controller.signal.aborted)setLoading(false);}
  },[level,collectionId]);
  useEffect(()=>{const initial=setTimeout(()=>void load(),0);return()=>{clearTimeout(initial);active.current?.abort();};},[load]);
  return <div className="pronunciation-page">
    <PageHeader title="Luyện phát âm" description="Nghe một chút, đọc một từ. Tự tin hơn sau mỗi lần thử." actions={<Button as="a" href={collectionId?'/collections':'/'} appearance="subtle" icon={<ArrowLeftRegular/>}>Quay lại</Button>}/>
    <div className="pronunciation-intro"><ol aria-label="Ba bước luyện tập"><li><span>1</span>Nghe mẫu</li><li><span>2</span>Thu giọng của bạn</li><li><span>3</span>Nghe lại và đối chiếu</li></ol></div>
    <section className="pronunciation-toolbar" aria-label="Chọn từ luyện đọc"><Field label="Cấp độ"><ChoiceSelect value={level} onChange={e=>setLevel(e.target.value)}>{['ALL','A1','A2','B1','B2','C1','C2'].map(l=><option value={l} key={l}>{l==='ALL'?'Tất cả cấp độ':l}</option>)}</ChoiceSelect></Field><p>{collectionId?'Đang luyện trong bộ sưu tập đã chọn':'Khám phá từ trong thư viện của bạn'}</p><Button onClick={()=>void load()} disabled={loading} icon={loading?<Spinner size="tiny"/>:<ArrowSwapRegular/>}>{loading?'Đang tải…':'Từ tiếp theo'}</Button></section>
    {error&&<MessageBar intent="error">{error} <Button appearance="subtle" onClick={()=>void load()}>Thử lại</Button></MessageBar>}
    {loading?<LoadingState label="Đang chọn từ cho bạn"/>:word&&<Recorder key={word.id} wordId={word.id} wordText={word.word} ipa={word.ipa} meaning={word.meaning_vi} example={word.example}/>}
  </div>;
}
