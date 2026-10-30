'use client';
import { useEffect, useState } from 'react';
import { Button, MessageBar } from '@fluentui/react-components';
type NextStudy={due:number|null;mistakes:number|null;continuation:{name:string;position:number;href:string}|null;unavailable:boolean};
export default function ContinueLearning(){
  const [data,setData]=useState<NextStudy|null>(null),[error,setError]=useState('');
  useEffect(()=>{const c=new AbortController();fetch('/api/study-next',{signal:c.signal}).then(async r=>{if(!r.ok)throw new Error('Chưa tải được đề xuất.');return r.json();}).then(setData).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[]);
  if(error)return <MessageBar intent="warning">{error}</MessageBar>;
  if(!data)return <p role="status">Đang tìm bài học tiếp theo…</p>;
  const choices=[...(data.due?[{label:'Ôn '+data.due+' từ đến hạn',href:'/review?source=due'}]:[]),...(data.mistakes?[{label:'Luyện lại '+data.mistakes+' từ sai chưa xử lý',href:'/mistakes'}]:[]),...(data.continuation?[{label:'Tiếp tục '+data.continuation.name+' — chặng '+data.continuation.position,href:data.continuation.href}]:[])];
  return <section className="panel study-next"><h2>Học tiếp</h2>{data.unavailable&&<MessageBar intent="warning">Một vài gợi ý chưa tải xong. Bạn vẫn có thể học tiếp bên dưới.</MessageBar>}<div className="study-actions">{choices.length?choices.map((c,i)=><Button key={c.href} as="a" href={c.href} appearance={i===0?'primary':'secondary'}>{c.label}</Button>):<Button appearance="primary" as="a" href="/decks">Bắt đầu một bộ IELTS theo chủ đề</Button>}</div></section>;
}
