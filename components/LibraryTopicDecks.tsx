'use client';
import { useEffect, useState } from 'react';
import { Button, Field, Input, MessageBar } from '@fluentui/react-components';
import ChoiceSelect from './ChoiceSelect';
import LoadingState from './LoadingState';
import { LEVELS, TOPICS, TOPIC_LABELS } from '@/types';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
import { HeadphonesRegular } from '@fluentui/react-icons/svg/headphones';
type Topic={topic:string;count:number;levels:Record<string,number>};
const label=(topic:string)=>TOPIC_LABELS[topic as typeof TOPICS[number]]||topic;
export default function LibraryTopicDecks(){
 const [data,setData]=useState<{total:number;topics:Topic[]}|null>(null),[error,setError]=useState(''),[level,setLevel]=useState('all'),[search,setSearch]=useState('');
 useEffect(()=>{const c=new AbortController();fetch('/api/library-topics',{signal:c.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error);return d;}).then(setData).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[]);
 if(error)return <MessageBar intent="error">{error}</MessageBar>;
 if(!data)return <LoadingState label="Đang tìm các bộ từ của bạn"/>;
 const normalized=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
 const topics=data.topics.filter(t=>(level==='all'?t.count:t.levels[level])&&normalized(label(t.topic)+' '+t.topic).includes(normalized(search))).sort((a,b)=>label(a.topic).localeCompare(label(b.topic),'vi'));
 return <section className="library-topic-section"><h2>Chọn chủ đề bạn thích</h2><p>{data.total.toLocaleString('vi-VN')} mục từ trong thư viện đang sẵn sàng cho bạn khám phá. Chọn cấp độ rồi luyện 10 hoặc 20 từ mỗi lượt.</p><div className="study-topic-filters"><Field label="Tìm chủ đề"><Input value={search} onChange={(_,d)=>setSearch(d.value)} placeholder="Ví dụ: giáo dục, công việc…"/></Field><Field label="Cấp độ"><ChoiceSelect value={level} onChange={e=>setLevel(e.target.value)}><option value="all">Tất cả cấp độ</option>{LEVELS.map(l=><option key={l} value={l}>{l}</option>)}</ChoiceSelect></Field></div>{!topics.length?<MessageBar intent="info">Chưa có bộ từ phù hợp. Bạn thử cấp độ hoặc chủ đề khác nhé.</MessageBar>:<div className="study-deck-grid">{topics.map(t=>{const query='?topic='+encodeURIComponent(t.topic)+'&level='+encodeURIComponent(level);return <article className="panel study-deck" key={t.topic}><h3>{label(t.topic)}</h3><p>{(level==='all'?t.count:t.levels[level]).toLocaleString('vi-VN')} mục từ{level!=='all'?' · '+level:''}</p><div className="study-actions"><Button as="a" href={'/typing'+query} appearance="primary" icon={<KeyboardRegular/>}>Luyện gõ</Button><Button as="a" href={'/spelling-bee'+query} icon={<HeadphonesRegular/>}>Nghe và viết</Button></div><Button as="a" href={'/library'+query} appearance="subtle">Xem từ trong bộ</Button></article>;})}</div>}<p className="study-source-note">Ghép cụm từ, Điền từ theo ngữ cảnh và Săn lỗi chính tả dùng bộ câu hỏi đi kèm; số câu có thể khác số từ trong thư viện.</p></section>;
}
