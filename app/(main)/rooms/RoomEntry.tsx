'use client';
import PageHeader from '@/components/PageHeader';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, MessageBar, Select, Spinner } from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons/svg/add';
import { ArrowRightRegular } from '@fluentui/react-icons/svg/arrow-right';
import type { RoomView } from '@/lib/rooms/types';
import { ROOM_QUESTION_COUNTS, ROOM_MODES, ROOM_MODE_INFO, ROOM_DURATIONS, type RoomMode } from '@/lib/rooms/settings';
import { FlashRegular } from '@fluentui/react-icons/svg/flash';
import { GamesRegular } from '@fluentui/react-icons/svg/games';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
import { TextBulletListRegular } from '@fluentui/react-icons/svg/text-bullet-list';

const modeIcons = { quiz: TextBulletListRegular, speedrun: FlashRegular, match: GamesRegular, sniper: TargetArrowRegular, blockblast: GridRegular, typing: KeyboardRegular };

export default function RoomEntry() {
  const router = useRouter();
  const [title, setTitle] = useState('Phòng từ vựng');
  const [level, setLevel] = useState('all');
  const [questionCount, setQuestionCount] = useState('10');
  const [seconds, setSeconds] = useState('15');
  const [gameMode, setGameMode] = useState<RoomMode>('quiz');
  const [duration, setDuration] = useState('90');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  async function enter(mode: 'create' | 'join', event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(mode); setError('');
    try {
      const response = await fetch(mode === 'create' ? '/api/rooms' : `/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify(mode === 'create' ? { title, mode: gameMode, durationSeconds: Number(duration), level, questionCount: Number(questionCount), secondsPerQuestion: Number(seconds) } : { action: 'join' }),
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
        <fieldset className="room-mode-picker"><legend>Chế độ thi đấu</legend><div>{ROOM_MODES.map(mode => { const Icon = modeIcons[mode]; return <label key={mode} className={gameMode === mode ? 'room-mode-option is-selected' : 'room-mode-option'}><input type="radio" name="room-mode" value={mode} checked={gameMode === mode} onChange={() => setGameMode(mode)} /><Icon aria-hidden="true" /><span><strong>{ROOM_MODE_INFO[mode].name}</strong><small>{ROOM_MODE_INFO[mode].description}</small></span></label>; })}</div></fieldset>
        <Field label="Tên phòng" required><Input value={title} onChange={(_, d) => setTitle(d.value)} maxLength={60} required /></Field>
        <Field label="Cấp độ"><Select value={level} onChange={e => setLevel(e.target.value)}><option value="all">Tất cả cấp độ</option>{['A1','A2','B1','B2','C1','C2'].map(l => <option key={l}>{l}</option>)}</Select></Field>
        <div className="room-form-pair"><Field label={gameMode === 'match' ? 'Số cặp từ' : gameMode === 'typing' ? 'Số từ' : 'Số câu'}><Select value={questionCount} onChange={e => setQuestionCount(e.target.value)}>{ROOM_QUESTION_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}</Select></Field>{gameMode === 'quiz' ? <Field label="Thời gian mỗi câu"><Select value={seconds} onChange={e => setSeconds(e.target.value)}>{[10,15,20].map(n => <option key={n} value={n}>{n} giây</option>)}</Select></Field> : <Field label="Thời gian trận"><Select value={duration} onChange={e => setDuration(e.target.value)}>{ROOM_DURATIONS.map(n => <option key={n} value={n}>{n} giây</option>)}</Select></Field>}</div>
        {['typing', 'sniper'].includes(gameMode) && <Field label="Thời gian mỗi mục tiêu"><Select value={seconds} onChange={e => setSeconds(e.target.value)}>{[10,15,20].map(n => <option key={n} value={n}>{n} giây</option>)}</Select></Field>}
        <Button type="submit" appearance="primary" size="large" disabled={!!busy || !title.trim()} icon={busy === 'create' ? <Spinner size="tiny" /> : <AddRegular />}>Tạo phòng</Button>
      </form>
      <div className="room-join-column"><form className="panel room-form" onSubmit={e => enter('join', e)}><h2>Tham gia phòng</h2><Field label="Mã phòng" hint="Nhập mã 6 ký tự do bạn bè chia sẻ." required><Input value={code} onChange={(_, d) => setCode(d.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} required maxLength={6} className="room-code-input" placeholder="ABC234" autoComplete="off" /></Field><Button type="submit" appearance="primary" size="large" disabled={!!busy || code.length !== 6} icon={busy === 'join' ? <Spinner size="tiny" /> : <ArrowRightRegular />}>Vào phòng</Button></form>
        <section className="room-how"><h2>{ROOM_MODE_INFO[gameMode].name}</h2><p className="room-hint">{ROOM_MODE_INFO[gameMode].rules}</p><ol><li>Chia sẻ mã phòng, chờ mọi người sẵn sàng rồi bắt đầu.</li><li>{gameMode === 'quiz' ? 'Mọi người trả lời cùng câu hỏi.' : 'Cùng bộ từ, cùng thời điểm bắt đầu. Mỗi người chơi theo tốc độ riêng.'}</li><li>{gameMode === 'quiz' ? 'Bảng điểm cập nhật sau mỗi câu.' : 'Hoàn thành bộ từ hoặc chơi đến hết giờ. Điểm được cập nhật trong trận.'}</li></ol></section>
      </div>
    </div>
  </div>;
}
