'use client';
import PageHeader from '@/components/PageHeader';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, MessageBar, Select, Spinner } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons/svg/add';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import type { RoomView } from '@/lib/rooms/types';

export default function RoomEntry() {
  const router = useRouter();
  const [title, setTitle] = useState('Phòng từ vựng');
  const [level, setLevel] = useState('all');
  const [questionCount, setQuestionCount] = useState('10');
  const [seconds, setSeconds] = useState('15');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  async function enter(mode: 'create' | 'join', event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(mode); setError('');
    try {
      const response = await fetch(mode === 'create' ? '/api/rooms' : `/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify(mode === 'create' ? { title, level, questionCount: Number(questionCount), secondsPerQuestion: Number(seconds) } : { action: 'join' }),
      });
      const data: RoomView & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa vào được phòng.');
      router.push(`/rooms/${data.code}`);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Kết nối chậm. Vui lòng thử lại.'); }
    finally { setBusy(null); }
  }
  return <div className="rooms-entry">
    <PageHeader title="Phòng thi đấu" description="Thi từ vựng cùng bạn bè, từ 2 đến 8 người." />
    {error && <MessageBar intent="error">{error}</MessageBar>}
    <div className="rooms-entry-grid">
      <form className="panel room-form" onSubmit={e => enter('create', e)}><h2>Tạo phòng</h2>
        <Field label="Tên phòng" required><Input value={title} onChange={(_, d) => setTitle(d.value)} maxLength={60} required /></Field>
        <Field label="Cấp độ"><Select value={level} onChange={e => setLevel(e.target.value)}><option value="all">Tất cả cấp độ</option>{['A1','A2','B1','B2','C1','C2'].map(l => <option key={l}>{l}</option>)}</Select></Field>
        <div className="room-form-pair"><Field label="Số câu"><Select value={questionCount} onChange={e => setQuestionCount(e.target.value)}>{[5,10,15].map(n => <option key={n} value={n}>{n} câu</option>)}</Select></Field><Field label="Thời gian mỗi câu"><Select value={seconds} onChange={e => setSeconds(e.target.value)}>{[10,15,20].map(n => <option key={n} value={n}>{n} giây</option>)}</Select></Field></div>
        <Button type="submit" appearance="primary" size="large" disabled={!!busy || !title.trim()} icon={busy === 'create' ? <Spinner size="tiny" /> : <AddRegular />}>Tạo phòng</Button>
      </form>
      <div className="room-join-column"><form className="panel room-form" onSubmit={e => enter('join', e)}><h2>Tham gia phòng</h2><Field label="Mã phòng" hint="Nhập mã 6 ký tự do bạn bè chia sẻ." required><Input value={code} onChange={(_, d) => setCode(d.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} required maxLength={6} className="room-code-input" placeholder="ABC234" autoComplete="off" /></Field><Button type="submit" appearance="primary" size="large" disabled={!!busy || code.length !== 6} icon={busy === 'join' ? <Spinner size="tiny" /> : <ArrowRightRegular />}>Vào phòng</Button></form>
        <section className="room-how"><h2>Cách thi đấu</h2><ol><li>Chia sẻ mã phòng và chờ mọi người sẵn sàng.</li><li>Cùng trả lời các câu hỏi trong thời gian quy định.</li><li>Đúng được 100 điểm, trả lời nhanh được thêm tối đa 50 điểm.</li></ol></section>
      </div>
    </div>
  </div>;
}
