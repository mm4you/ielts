'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import { useEffect, useState } from 'react';
import { Button, Field, MessageBar } from '@fluentui/react-components';
export default function StudyPreferences(){
  const [zone,setZone]=useState('Asia/Ho_Chi_Minh'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  useEffect(()=>{const c=new AbortController();fetch('/api/study-preferences',{signal:c.signal}).then(async r=>{if(!r.ok)return;const d=await r.json();setZone(d.timeZone);}).catch(()=>{});return()=>c.abort();},[]);
  async function save(){setBusy(true);setError('');setSaved(false);try{const r=await fetch('/api/study-preferences',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({timeZone:zone})});if(!r.ok)throw new Error('Chưa lưu được. Bạn thử lại nhé.');setSaved(true);}catch(e){setError(e instanceof Error?e.message:'Chưa lưu được.');}finally{setBusy(false);}}
  return <section className="panel study-panel"><h2>Ngày học của bạn</h2><p>Chọn nơi bạn sống để chuỗi ngày học được tính đúng. Lịch sử cũ vẫn được giữ nguyên.</p><Field label="Múi giờ"><ChoiceSelect value={zone} onChange={e=>{setZone(e.target.value);setSaved(false);}}>{[zone,...['Asia/Ho_Chi_Minh','Asia/Bangkok','Asia/Tokyo','Australia/Sydney','Europe/London','America/New_York','America/Los_Angeles','UTC'].filter(z=>z!==zone)].map(z=><option key={z} value={z}>{z==='Asia/Ho_Chi_Minh'?'Việt Nam (UTC+7)':z}</option>)}</ChoiceSelect></Field><Button appearance="primary" disabled={busy} onClick={save}>{busy?'Đang lưu…':'Lưu múi giờ'}</Button>{error&&<MessageBar intent="error">{error}</MessageBar>}{saved&&<p role="status">Đã lưu múi giờ của bạn.</p>}</section>;
}
