'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, Badge, Button, MessageBar, ProgressBar, Spinner } from '@fluentui/react-components';
import { CopyRegular } from '@fluentui/react-icons/svg/copy';
import { CheckmarkRegular } from '@fluentui/react-icons/svg/checkmark';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { ArrowExitRegular } from '@fluentui/react-icons/svg/arrow-exit';
import { TrophyRegular } from '@fluentui/react-icons/svg/trophy';
import PageHeader from '@/components/PageHeader';
import AppLoading from '@/components/AppLoading';
import type { RoomView } from '@/lib/rooms/types';
import { ROOM_MODE_INFO } from '@/lib/rooms/settings';
import RoomModeGame from './RoomModeGame';

export default function RoomClient({ code }: { code: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomView | null>(null);
  const [error, setError] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(0);
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(0);
  const clockOffset = useRef(0), lastTime = useRef(0), mounted = useRef(true);
  const actionPending = useRef(false);
  const accept = useCallback((data: RoomView) => {
    if (data.serverNow < lastTime.current || !mounted.current) return;
    lastTime.current = data.serverNow; clockOffset.current = data.serverNow - Date.now();
    setNow(data.serverNow); setRoom(data); setCanJoin(false); setError('');
  }, []);
  useEffect(() => {
    mounted.current = true;
    let disposed = false, inFlight = false, timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      if (disposed || inFlight) return;
      inFlight = true;
      let delay = 3000;
      try {
        const response = await fetch(`/api/rooms/${code}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]), cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          if (!disposed) { setCanJoin(response.status === 403); setError(data.error || 'Chưa tải được phòng.'); }
          if ([401,403,404,410].includes(response.status)) return;
        } else {
          if (!disposed) accept(data);
          if (['finished','closed'].includes(data.phase)) return;
          delay = data.phase === 'waiting' ? 3000 : 1500;
        }
      } catch { if (!disposed) setError('Mất kết nối tạm thời. Đang thử lại…'); delay = 5000; }
      finally { inFlight = false; }
      if (!disposed) timer = setTimeout(poll, document.hidden ? 12000 : delay);
    }
    void poll();
    const resume = () => { if (!document.hidden) { clearTimeout(timer); void poll(); } };
    document.addEventListener('visibilitychange', resume);
    return () => { disposed = true; mounted.current = false; controller.abort(); clearTimeout(timer); document.removeEventListener('visibilitychange', resume); };
  }, [code, retry, accept]);
  useEffect(() => {
    if (!room?.nextAt) return;
    const timer = setInterval(() => setNow(Date.now() + clockOffset.current), 250);
    return () => clearInterval(timer);
  }, [room?.nextAt]);
  async function act(action: Record<string, unknown>) {
    if (actionPending.current) return false;
    actionPending.current = true;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/rooms/${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(action), signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) { if (response.status === 409) setRetry(n => n + 1); throw new Error(data.error || 'Thao tác chưa hoàn tất.'); }
      if (data.left) router.push('/rooms');
      else { accept(data); if (action.action === 'join') setRetry(n => n + 1); }
      return true;
    } catch (e) { if (mounted.current) setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Kết nối chậm. Thử lại sau.'); return false; }
    finally { actionPending.current = false; if (mounted.current) setBusy(false); }
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setError(`Không sao chép được. Mã phòng: ${code}`); }
  }
  if (!room) return error ? <section className="panel empty-state"><h1>{canJoin ? 'Tham gia phòng thi đấu' : 'Chưa vào được phòng'}</h1><p>{error}</p>{canJoin ? <Button appearance="primary" disabled={busy} onClick={() => act({ action: 'join' })}>Tham gia phòng {code}</Button> : <Button onClick={() => setRetry(n => n + 1)}>Thử lại</Button>}<Link href="/rooms">Về danh sách phòng</Link></section> : <AppLoading contained label="Đang kết nối phòng" />;
  const me = room.players.find(p => p.id === room.meId)!;
  const host = room.hostId === room.meId;
  const waiting = room.phase === 'waiting', finished = room.phase === 'finished', reveal = room.phase === 'reveal';
  const seconds = Math.max(0, Math.ceil(((room.nextAt || now) - now) / 1000));
  const question = room.question;
  const mode = room.settings.mode || 'quiz';
  const modeInfo = ROOM_MODE_INFO[mode];
  const answered = question?.myChoice !== undefined;
  const startAllowed = room.players.length >= 2 && room.players.every(p => p.ready && !p.left);
  if (room.phase === 'closed') return <section className="panel empty-state"><h1>Phòng đã đóng</h1><p>Bạn có thể tạo hoặc tham gia một phòng khác.</p><Link className="btn-primary" href="/rooms">Về phòng thi đấu</Link></section>;

  return <div className="battle-room">
    <PageHeader title={finished ? 'Kết quả thi đấu' : room.title} description={`${modeInfo.name} · ${room.settings.level === 'all' ? 'Tất cả cấp độ' : room.settings.level} · ${room.settings.questionCount} ${mode === 'match' ? 'cặp' : 'từ'} · ${mode === 'quiz' ? `${room.settings.secondsPerQuestion} giây/câu` : `${room.settings.durationSeconds || 90} giây/trận`}`} actions={<Button appearance="subtle" icon={<ArrowExitRegular />} onClick={() => act({ action: 'leave' })} disabled={busy}>Rời phòng</Button>} />
    {error && <MessageBar intent="error">{error}</MessageBar>}
    <div className="battle-columns">
      <section className="battle-main">
        {waiting ? <div className="panel room-lobby"><h2>Sảnh chờ · {modeInfo.name}</h2><p>{modeInfo.rules}</p><p>Chia sẻ mã để bạn bè tham gia.</p><div className="room-share"><strong>{code}</strong><Button appearance="subtle" aria-label="Sao chép mã phòng" onClick={copyCode} icon={copied ? <CheckmarkRegular /> : <CopyRegular />} /></div><p className="room-status" role="status">{room.players.length}/8 người · {room.players.filter(p => p.ready).length} sẵn sàng</p>{host ? <><Button appearance="primary" size="large" icon={busy ? <Spinner size="tiny" /> : <PlayRegular />} disabled={busy || !startAllowed} onClick={() => act({ action: 'start' })}>Bắt đầu thi đấu</Button><p className="room-hint">Cần ít nhất 2 người và tất cả đã sẵn sàng.</p></> : <><Button appearance={me.ready ? 'secondary' : 'primary'} size="large" disabled={busy} icon={<CheckmarkRegular />} onClick={() => act({ action: 'ready', ready: !me.ready })}>{me.ready ? 'Hủy sẵn sàng' : 'Sẵn sàng'}</Button><p className="room-hint">Chủ phòng sẽ bắt đầu trận đấu.</p></>}</div>
        : room.phase === 'countdown' ? <div className="panel room-countdown"><h2>Chuẩn bị bắt đầu</h2><strong>{seconds}</strong><p>{mode === 'quiz' ? 'Mọi người sẽ nhận cùng một câu hỏi.' : 'Cùng bộ từ, mỗi người chơi theo tốc độ riêng.'}</p></div>
        : finished ? <div className="panel room-finish"><TrophyRegular aria-hidden="true" /><h2>Hoàn thành trận đấu</h2><p>{me.score.toLocaleString('vi-VN')} điểm · đúng {me.correct}/{room.settings.questionCount} câu</p><Link href="/rooms" className="btn-primary">Tạo trận mới</Link></div>
        : room.game ? <RoomModeGame mode={mode} game={room.game} now={now} busy={busy} secondsPerTarget={room.settings.secondsPerQuestion} act={act} /> : question ? <div className="panel battle-question"><div className="battle-question-meta"><span>Câu {room.questionNumber}/{room.settings.questionCount}</span><span className={seconds <= 5 ? 'room-time is-low' : 'room-time'}>{reveal ? 'Câu tiếp theo' : 'Còn'} {seconds}s</span></div><ProgressBar value={Math.min(1, seconds / (reveal ? 3 : room.settings.secondsPerQuestion))} color={reveal ? 'success' : 'brand'} /><h2>{question.word}</h2><p className="room-hint">Chọn nghĩa phù hợp</p><div className="battle-choices">{question.choices.map((choice, index) => <button key={index} type="button" disabled={busy || answered || room.phase !== 'question' || seconds === 0} aria-pressed={question.myChoice === index} className={`battle-choice ${reveal && question.correctIndex === index ? 'is-correct' : reveal && question.myChoice === index ? 'is-wrong' : question.myChoice === index ? 'is-selected' : ''}`} onClick={() => act({ action: 'answer', question: room.questionNumber - 1, choice: index })}><span>{String.fromCharCode(65 + index)}</span><span>{choice}</span>{reveal && question.correctIndex === index && <CheckmarkRegular aria-label="Đáp án đúng" />}</button>)}</div><p className="room-answer-status" role="status">{reveal ? question.myChoice === undefined ? 'Bạn chưa trả lời câu này.' : question.myChoice === question.correctIndex ? 'Chính xác.' : 'Đáp án đúng được đánh dấu phía trên.' : answered ? 'Đã ghi nhận. Chờ hết giờ để xem đáp án.' : 'Trả lời đúng và nhanh để có thêm điểm.'}</p></div> : null}
      </section>
      <aside className="panel room-scoreboard"><h2>{waiting ? 'Người chơi' : 'Bảng điểm'}</h2>{!waiting && !finished && <p>{mode === 'quiz' ? 'Điểm cập nhật khi công bố đáp án.' : 'Điểm được máy chủ cập nhật trong trận.'}</p>}<ol>{room.players.map((p, index) => { const rank = room.players.findIndex(other => other.score === p.score) + 1; return <li key={p.id}><span className="room-rank">{waiting ? index + 1 : rank}</span><Avatar name={p.name} size={28} color="neutral" /><div className="room-player-name"><strong>{p.name}{p.id === room.meId ? ' (Bạn)' : ''}</strong><span>{p.left ? 'Đã rời phòng' : waiting ? p.id === room.hostId ? 'Chủ phòng' : p.ready ? 'Sẵn sàng' : 'Chưa sẵn sàng' : finished ? `Đúng ${p.correct} câu` : p.answered ? mode === 'quiz' ? 'Đã trả lời' : 'Hoàn thành lượt chơi' : 'Đang thi đấu'}</span></div>{waiting ? p.ready && <CheckmarkRegular aria-label="Sẵn sàng" /> : <Badge appearance="tint" color="brand">{p.score}</Badge>}</li>; })}</ol></aside>
    </div>
  </div>;
}
