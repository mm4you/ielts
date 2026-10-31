'use client';
import ChoiceSelect from '@/components/ChoiceSelect';
import RoomSourceFields from '@/components/RoomSourceFields';
import type { RoomSettings } from '@/lib/rooms/types';
import { useRef } from 'react';
import PageHeader from '@/components/PageHeader';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, MessageBar, Radio, RadioGroup, Spinner } from '@fluentui/react-components';
import { SubtractRegular } from '@fluentui/react-icons/svg/subtract';
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
  const [source,setSource]=useState<Pick<RoomSettings,'sourceKind'|'topic'|'collectionId'>>({sourceKind:'all',topic:'all'});
  const pending=useRef(false);
  const [title, setTitle] = useState('Phòng từ vựng');
  const [level, setLevel] = useState('all');
  const [questionCount, setQuestionCount] = useState('10');
  const [seconds, setSeconds] = useState('15');
  const [gameMode, setGameMode] = useState<RoomMode>('quiz');
  const [duration, setDuration] = useState('90');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  async function enter(mode: 'create' | 'join', event: React.FormEvent) {
    event.preventDefault(); if (pending.current) return;pending.current=true;
    setBusy(mode); setError('');
    try {
      const response = await fetch(mode === 'create' ? '/api/rooms' : `/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify(mode === 'create' ? { title,...source, maxPlayers: Number(maxPlayers), mode: gameMode, durationSeconds: Number(duration), level, questionCount: Number(questionCount), secondsPerQuestion: Number(seconds) } : { action: 'join' }),
      });
      const data: RoomView & { error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa vào được phòng.');
      router.push(`/rooms/${data.code}`);
    } catch (e) { setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Kết nối chậm. Vui lòng thử lại.'); }
    finally {pending.current=false; setBusy(null); }
  }
  return <div className="rooms-entry">
    <PageHeader title="Phòng thi đấu" description="Thi từ vựng cùng bạn bè, từ 2 đến 40 người." />
    {error && <MessageBar intent="error">{error}</MessageBar>}
    <div className="rooms-entry-grid">
      <form className="panel room-form" onSubmit={e => enter('create', e)}><h2>Tạo phòng</h2>
        <Field label="Bạn muốn chơi gì?"><RadioGroup className="room-mode-options" value={gameMode} onChange={(_,d)=>setGameMode(d.value as RoomMode)}>{ROOM_MODES.map(mode=>{const Icon=modeIcons[mode];return <Radio key={mode} value={mode} className={`room-mode-radio ${gameMode===mode?'is-selected':''}`} label={<span className="room-mode-label"><Icon aria-hidden="true"/><span><strong>{ROOM_MODE_INFO[mode].name}</strong><small>{ROOM_MODE_INFO[mode].description}</small></span></span>}/>;})}</RadioGroup></Field>
        <Field label="Số người tối đa" hint="Tính cả bạn. Chỉ cần 2 người sẵn sàng là có thể bắt đầu." validationState={Number.isInteger(Number(maxPlayers))&&Number(maxPlayers)>=2&&Number(maxPlayers)<=40?'none':'error'} validationMessage={Number.isInteger(Number(maxPlayers))&&Number(maxPlayers)>=2&&Number(maxPlayers)<=40?undefined:'Chọn từ 2 đến 40 người nhé.'}><div className="room-capacity"><Button type="button" icon={<SubtractRegular/>} aria-label="Giảm số người tối đa" disabled={Number(maxPlayers)<=2} onClick={()=>setMaxPlayers(String(Math.max(2,(Number(maxPlayers)||8)-1)))}/><Input type="number" aria-label="Số người tối đa" min={2} max={40} step={1} value={maxPlayers} onChange={(_,d)=>setMaxPlayers(d.value)} contentAfter="người"/><Button type="button" icon={<AddRegular/>} aria-label="Tăng số người tối đa" disabled={Number(maxPlayers)>=40} onClick={()=>setMaxPlayers(String(Math.min(40,(Number(maxPlayers)||8)+1)))}/></div><div className="room-capacity-presets">{[2,8,20,40].map(n=><Button key={n} type="button" aria-pressed={Number(maxPlayers)===n} onClick={()=>setMaxPlayers(String(n))}>{n} người</Button>)}</div></Field>
        <Field label="Tên phòng" required><Input value={title} onChange={(_, d) => setTitle(d.value)} maxLength={60} required /></Field>
        <RoomSourceFields value={source} onChange={setSource}/>
        <Field label="Cấp độ"><ChoiceSelect value={level} onChange={e => setLevel(e.target.value)}><option value="all">Tất cả cấp độ</option>{['A1','A2','B1','B2','C1','C2'].map(l => <option key={l}>{l}</option>)}</ChoiceSelect></Field>
        <div className="room-form-pair"><Field label={gameMode === 'match' ? 'Số cặp từ' : gameMode === 'typing' ? 'Số từ' : 'Số câu'}><ChoiceSelect value={questionCount} onChange={e => setQuestionCount(e.target.value)}>{ROOM_QUESTION_COUNTS.map(n => <option key={n} value={n}>{n}</option>)}</ChoiceSelect></Field>{gameMode === 'quiz' ? <Field label="Thời gian mỗi câu"><ChoiceSelect value={seconds} onChange={e => setSeconds(e.target.value)}>{[10,15,20].map(n => <option key={n} value={n}>{n} giây</option>)}</ChoiceSelect></Field> : <Field label="Thời gian trận"><ChoiceSelect value={duration} onChange={e => setDuration(e.target.value)}>{ROOM_DURATIONS.map(n => <option key={n} value={n}>{n} giây</option>)}</ChoiceSelect></Field>}</div>
        {['typing', 'sniper'].includes(gameMode) && <Field label="Thời gian mỗi mục tiêu"><ChoiceSelect value={seconds} onChange={e => setSeconds(e.target.value)}>{[10,15,20].map(n => <option key={n} value={n}>{n} giây</option>)}</ChoiceSelect></Field>}
        <Button type="submit" appearance="primary" size="large" disabled={!!busy || source.sourceKind==='collection'&&!source.collectionId || !title.trim() || !Number.isInteger(Number(maxPlayers)) || Number(maxPlayers)<2 || Number(maxPlayers)>40} icon={busy === 'create' ? <Spinner size="tiny" /> : <AddRegular />}>Tạo phòng</Button>
      </form>
      <div className="room-join-column"><form className="panel room-form" onSubmit={e => enter('join', e)}><h2>Tham gia phòng</h2><Field label="Mã phòng" hint="Nhập mã 6 ký tự do bạn bè chia sẻ." required><Input value={code} onChange={(_, d) => setCode(d.value.toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6))} required maxLength={6} className="room-code-input" placeholder="ABC234" autoComplete="off" /></Field><Button type="submit" appearance="primary" size="large" disabled={!!busy || code.length !== 6} icon={busy === 'join' ? <Spinner size="tiny" /> : <ArrowRightRegular />}>Vào phòng</Button></form>
        <section className="room-how"><h2>{ROOM_MODE_INFO[gameMode].name}</h2><p className="room-hint">{ROOM_MODE_INFO[gameMode].rules}</p><ol><li>Chia sẻ mã phòng, chờ mọi người sẵn sàng rồi bắt đầu.</li><li>{gameMode === 'quiz' ? 'Mọi người trả lời cùng câu hỏi.' : 'Cùng bộ từ, cùng thời điểm bắt đầu. Mỗi người chơi theo tốc độ riêng.'}</li><li>{gameMode === 'quiz' ? 'Bảng điểm cập nhật sau mỗi câu.' : 'Hoàn thành bộ từ hoặc chơi đến hết giờ. Điểm được cập nhật trong trận.'}</li></ol></section>
      </div>
    </div>
  </div>;
}
