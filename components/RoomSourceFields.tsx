'use client';
import { useEffect, useState } from 'react';
import { Field, MessageBar } from '@fluentui/react-components';
import ChoiceSelect from './ChoiceSelect';
import { TOPICS, TOPIC_LABELS } from '@/types';
type Source={sourceKind?:'all'|'collection';topic?:string;collectionId?:string};
export default function RoomSourceFields({value,onChange}:{value:Source;onChange:(value:Source)=>void}){
 const [collections,setCollections]=useState<{id:string;name:string}[]>([]),[error,setError]=useState('');
 useEffect(()=>{const c=new AbortController();fetch('/api/collections',{signal:c.signal}).then(async r=>{if(!r.ok)throw new Error('Chưa tải được bộ từ của bạn.');return r.json();}).then(setCollections).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[]);
 return <><Field label="Cả phòng học từ đâu?"><ChoiceSelect value={value.sourceKind??'all'} onChange={e=>onChange({...value,sourceKind:e.target.value as Source['sourceKind'],collectionId:undefined})}><option value="all">Thư viện từ vựng</option><option value="collection">Bộ sưu tập</option></ChoiceSelect></Field>{value.sourceKind==='collection'&&<><Field label="Bộ từ chia sẻ với phòng"><ChoiceSelect value={value.collectionId??''} onChange={e=>onChange({...value,collectionId:e.target.value})}><option value="">Chọn bộ từ</option>{value.collectionId&&!collections.some(c=>c.id===value.collectionId)&&<option value={value.collectionId}>Bộ từ đang chọn</option>}{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</ChoiceSelect></Field><p className="room-hint">Các từ trong bộ này sẽ được dùng chung cho người tham gia phòng.</p>{error&&<MessageBar intent="warning">{error}</MessageBar>}</>}<Field label="Chủ đề"><ChoiceSelect value={value.topic??'all'} onChange={e=>onChange({...value,topic:e.target.value})}><option value="all">Tất cả chủ đề</option>{TOPICS.map(t=><option key={t} value={t}>{TOPIC_LABELS[t]||t}</option>)}</ChoiceSelect></Field></>;
}
