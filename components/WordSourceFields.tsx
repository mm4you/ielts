'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import { useEffect, useState } from 'react';
import { Button, Field, MessageBar } from '@fluentui/react-components';
import { TOPICS, TOPIC_LABELS } from '@/types';
import type { PracticeSource } from '@/lib/study';
export function initialPracticeSource(query?: string): PracticeSource {
  if (query === undefined && typeof window === 'undefined') return { kind: 'all', level: 'all', topic: 'all', limit: 20 };
  const p = new URLSearchParams(query ?? window.location.search);
  return { kind: p.has('stageId') ? 'stage' : p.has('sessionId') ? 'replay' : p.has('collectionId') ? 'collection' : p.get('source') === 'due' ? 'due' : p.get('source') === 'mistakes' ? 'mistakes' : 'all', stageId: p.get('stageId') || undefined, sessionId: p.get('sessionId') || undefined, replayIds:p.get('replayIds')?.split(',').map(Number), collectionId: p.get('collectionId') || undefined, level: p.get('level') || 'all', topic: p.get('topic') || 'all', limit: 20,mistakeMode:p.get('mistakeMode')==='rooms'?'rooms':undefined };
}
function SourceAvailability({ mode, value, itemLabel, onChange }: { mode: string; value: PracticeSource; itemLabel: string; onChange: (value: PracticeSource) => void }) {
  const endpoint = itemLabel === 'câu' ? '/api/exercises' : '/api/practice';
  const body = JSON.stringify({ mode, preview: true, source: { ...value, limit: 10 } });
  const [attempt, setAttempt] = useState(0);
  const key = body + attempt;
  const [result, setResult] = useState<{ key: string; available?: number; error?: string }>();
  const needsCollection = value.kind === 'collection' && !value.collectionId;
  useEffect(() => {
    if (needsCollection) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Chưa xem được nguồn này.');
        if (!controller.signal.aborted) setResult({ key, available: data.available });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, error: error instanceof Error && error.name === 'Error' ? error.message : 'Chưa xem được nguồn này.' });
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [body, endpoint, key, needsCollection]);

  const available = result?.key === key ? result.available : undefined;
  const error = result?.key === key ? result.error : undefined;
  const filtered = value.level !== 'all' || value.topic !== 'all';
  const limit = value.limit ?? 20;
  const useTen = itemLabel === 'câu' && value.kind !== 'mistakes' && available !== undefined && available >= 10 && available < limit;
  return <div className="source-availability">
    <p role="status">{needsCollection ? 'Chọn một bộ sưu tập để xem số mục phù hợp.'
      : error || (available === undefined ? 'Đang kiểm tra nguồn…'
      : available === 0 ? 'Nguồn đã chọn chưa có ' + itemLabel + ' phù hợp.'
      : available.toLocaleString('vi-VN')+' '+itemLabel+' phù hợp. '+(useTen ? 'Bạn có thể bắt đầu lượt 10 câu.' : itemLabel === 'câu' && value.kind !== 'mistakes' && available < 10 ? 'Cần ít nhất 10 câu để bắt đầu.' : 'Lượt này có '+Math.min(available,limit)+' '+itemLabel+'.'))}</p>
    {error && <Button appearance="subtle" onClick={() => setAttempt(n => n+1)}>Kiểm tra lại</Button>}
    {useTen && <Button appearance="subtle" onClick={() => onChange({ ...value, limit: 10 })}>Chọn 10 câu</Button>}
    {!needsCollection && (error || available === 0 || (itemLabel === 'câu' && !useTen && available !== undefined && available < 10 && value.kind !== 'mistakes')) &&
      (filtered ? <Button appearance="subtle" onClick={() => onChange({ ...value, level: 'all', topic: 'all' })}>Bỏ lọc cấp độ và chủ đề</Button>
        : value.kind !== 'all' && <Button appearance="subtle" onClick={() => onChange({ ...value, kind: 'all' })}>Mở {itemLabel === 'câu' ? 'kho câu hỏi' : 'kho từ vựng'}</Button>)}
  </div>;
}

export default function WordSourceFields({ value, onChange, mode, limits=[10,20,160], itemLabel="từ" }: { value: PracticeSource; onChange: (v: PracticeSource)=>void; mode: string; limits?:number[]; itemLabel?:string }) {
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState('');
  useEffect(()=>{const c=new AbortController(); fetch('/api/collections',{signal:c.signal}).then(async r=>{if(!r.ok)throw new Error('Chưa thấy bộ từ của bạn. Bạn thử tải lại trang nhé.'); return r.json();}).then(setCollections).catch(e=>{if(!c.signal.aborted)setError(e.message);}); return ()=>c.abort();},[]);
  if (value.kind === 'stage' || value.kind === 'replay') return <MessageBar intent="info">{value.kind === 'stage' ? 'Chinh phục từng chặng nhỏ. Tự trả lời đúng tất cả từ để mở chặng tiếp theo.' : 'Luyện lại đúng những '+itemLabel+' sai từ lượt trước.'}</MessageBar>;
  return <>{error && value.kind === 'collection' && <MessageBar intent="warning">{error}</MessageBar>}<Field label={itemLabel==='câu'?'Nguồn câu hỏi':'Nguồn từ'}><ChoiceSelect value={value.kind} onChange={e=>onChange({...value,kind:e.target.value as PracticeSource['kind']})}><option value="all">{itemLabel==='câu'?'Kho câu hỏi':'Kho từ vựng'}</option><option value="collection">Bộ sưu tập</option><option value="due">Từ đến hạn</option><option value="mistakes">{itemLabel==='câu'?'Câu sai cần luyện lại':'Từ sai cần luyện lại'}</option></ChoiceSelect></Field>{value.kind === 'collection' && <><Field label="Bộ của tôi"><ChoiceSelect value={value.collectionId || ''} onChange={e=>onChange({...value,collectionId:e.target.value})}><option value="">Chọn bộ sưu tập</option>{value.collectionId&&!collections.some(c=>c.id===value.collectionId)&&<option value={value.collectionId}>Bộ từ đang chọn</option>}{collections.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</ChoiceSelect></Field><p>Bạn cũng có thể mở bộ từ từ liên kết bạn bè gửi.</p></>}<Field label="Chủ đề"><ChoiceSelect value={value.topic || 'all'} onChange={e=>onChange({...value,topic:e.target.value})}><option value="all">Tất cả chủ đề</option>{TOPICS.map(t=><option key={t} value={t}>{TOPIC_LABELS[t] || t}</option>)}</ChoiceSelect></Field>{(itemLabel!=='câu'||value.kind!=='mistakes')&&<Field label={"Số "+itemLabel}><ChoiceSelect value={value.limit || 20} onChange={e=>onChange({...value,limit:Number(e.target.value)})}>{limits.map(n=><option key={n} value={n}>{n === 160 ? 'Toàn bộ (tối đa 160)' : n}</option>)}</ChoiceSelect></Field>}{itemLabel==='câu'&&value.kind==='mistakes'&&<MessageBar intent="info">Lượt ôn này dùng các câu bạn còn cần luyện lại, nên có thể ít hơn 10 câu.</MessageBar>}<SourceAvailability mode={mode} value={value} itemLabel={itemLabel} onChange={onChange}/></>;
}
