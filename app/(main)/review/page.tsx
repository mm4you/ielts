'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Field, MessageBar, ProgressBar } from '@fluentui/react-components';
import PracticeSetup from '@/components/PracticeSetup';
import LoadingState from '@/components/LoadingState';
import { calculateSRS } from '@/lib/srs';
import { parseMeaning } from '@/lib/parse';
import { RATING_LABELS, type ReviewRating, type ReviewWord } from '@/types';

export default function ReviewPage() { return <Suspense fallback={<LoadingState />}><ReviewContent /></Suspense>; }
function ReviewContent() {
  const params = useSearchParams(), router = useRouter();
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [index, setIndex] = useState(0), [flipped, setFlipped] = useState(false);
  const [screen, setScreen] = useState<'setup'|'playing'|'done'>('setup');
  const [level, setLevel] = useState('all'), [limit, setLimit] = useState('20');
  const [source, setSource] = useState(params.get('source') === 'new' ? 'new' : 'due');
  const [saveFailed,setSaveFailed]=useState(false);
  const [loading, setLoading] = useState(false), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const pending = useRef<{ id: string; rating: ReviewRating } | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => audio.current?.pause(), []);
  useEffect(() => { audio.current?.pause(); }, [index]);
  async function start() {
    if (lock.current) return;
    lock.current = true; setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ level, limit, source });
      if (params.get('collectionId')) p.set('collectionId', params.get('collectionId')!);
      const res = await fetch('/api/review?' + p, { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWords(data); setIndex(0); setFlipped(false); setScreen('playing'); pending.current = null;
    } catch (e) { setError(e instanceof Error ? e.message : 'Không tải được thẻ.'); }
    finally { lock.current = false; setLoading(false); }
  }
  async function rate(rating: ReviewRating) {
    if (lock.current || !words[index]) return;
    lock.current = true; setSaving(true); setError('');
    pending.current ??= { id: crypto.randomUUID(), rating };
    const attempt = pending.current;
    try {
      const res = await fetch('/api/words/' + words[index].id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: attempt.id, rating: attempt.rating }), signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      pending.current = null; setSaveFailed(false);
      if (attempt.rating === 'forgot') setWords(old => [...old, { ...words[index], ...data }]);
      if (attempt.rating !== 'forgot' && index === words.length - 1) setScreen('done');
      else { setIndex(i => i + 1); setFlipped(false); }
    } catch (e) { setSaveFailed(true); setError((e instanceof Error ? e.message : 'Chưa lưu được.') + ' Thẻ vẫn được giữ; nhấn Thử lưu lại.'); }
    finally { lock.current = false; setSaving(false); }
  }
  const notice = error && <MessageBar intent="error">{error}{saveFailed && <Button disabled={saving} onClick={() => rate(pending.current!.rating)}>Thử lưu lại</Button>}</MessageBar>;
  if (screen === 'setup') return <>{notice}<PracticeSetup mode="review" title="Ôn tập từ vựng" rules={['Lật thẻ rồi tự đánh giá trí nhớ.','Lịch ôn sẽ giúp bạn gặp lại từ đúng lúc.','Quên sẽ đưa thẻ về cuối lượt; ngày mai vẫn đến hạn.']} level={level} onLevelChange={setLevel} onStart={start} exitRoute="/" loading={loading}><Field label="Nguồn thẻ"><ChoiceSelect value={source} onChange={e=>setSource(e.target.value)}><option value="due">Thẻ đến hạn</option><option value="new">Từ chưa học</option></ChoiceSelect></Field><Field label="Số từ"><ChoiceSelect value={limit} onChange={e=>setLimit(e.target.value)}>{[10,20,50,100,200].map(n=><option key={n}>{n}</option>)}</ChoiceSelect></Field></PracticeSetup></>;
  if (screen === 'done' || !words.length) return <section className="panel study-panel"><h1>{screen === 'done' ? 'Đã lưu toàn bộ lượt ôn' : source === 'due' ? 'Không có thẻ đến hạn' : 'Không có từ mới trong bộ lọc này'}</h1><Button onClick={()=>setScreen('setup')}>Chọn nguồn thẻ</Button><Button as="a" href="/library">Thư viện</Button></section>;
  const word = words[index], meaning = parseMeaning(word.meaning_vi, word.pos);
  return <section className="study-panel">{notice}<div className="study-toolbar"><span>Thẻ {index + 1}/{words.length}</span><Button disabled={saving} onClick={()=>router.push('/')}>Thoát</Button></div><ProgressBar value={index / words.length} aria-label="Tiến độ ôn" /><article className="panel study-card"><p>{word.level} · {word.topic}</p><h1>{word.word}</h1><p>{word.ipa}</p><Button onClick={async()=>{audio.current?.pause(); const a=new Audio('/api/tts?lang=en&text='+encodeURIComponent(word.word)); audio.current=a; try { await a.play(); } catch {setError('Không phát được âm thanh. Vui lòng thử lại.');}}}>Phát âm</Button>{!flipped ? <Button appearance="primary" onClick={()=>setFlipped(true)}>Lật thẻ — xem nghĩa</Button> : <><p>{meaning.en}</p><p>{meaning.vi}</p><p>{word.example?.replace(/\/\/\/|\|\|\|/g,' — ')}</p></>}</article>{flipped && <div className="study-actions">{(['forgot','hard','good','easy'] as ReviewRating[]).map(r=><Button key={r} disabled={saving || saveFailed} onClick={()=>rate(r)}>{RATING_LABELS[r]} · {calculateSRS(r,word.ease_factor,word.interval_days,word.repetition_count).interval_days} ngày</Button>)}</div>}{saving && <p role="status">Đang lưu…</p>}</section>;
}
