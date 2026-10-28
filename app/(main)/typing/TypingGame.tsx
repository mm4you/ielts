'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Input, MessageBar, ProgressBar } from '@fluentui/react-components';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
import { PauseRegular } from '@fluentui/react-icons/svg/pause';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { ShieldRegular } from '@fluentui/react-icons/svg/shield';
import PageHeader from '@/components/PageHeader';
import PracticeSetup from '@/components/PracticeSetup';
import GameResult from '@/components/GameResult';
import { newTypingGame, typeIntoGame, typingTick, TYPING_DURATION, type TypingState, type TypingWord } from '@/lib/typing-game';

type Action = { type: 'start' } | { type: 'tick'; delta: number; pool: TypingWord[] } | { type: 'input'; value: string } | { type: 'pause' } | { type: 'resume' };
function reducer(state: TypingState, action: Action): TypingState {
  switch (action.type) {
    case 'start': return newTypingGame();
    case 'tick': return typingTick(state, action.delta, action.pool);
    case 'input': return typeIntoGame(state, action.value);
    case 'pause': return state.phase === 'playing' ? { ...state, phase: 'paused' } : state;
    case 'resume': return state.phase === 'paused' ? { ...state, phase: 'playing' } : state;
  }
}
export default function TypingGame() {
  const [screen, setScreen] = useState<'setup' | 'game'>('setup');
  const [state, dispatch] = useReducer(reducer, undefined, newTypingGame);
  const [pool, setPool] = useState<TypingWord[]>([]);
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (screen !== 'game' || state.phase !== 'playing') return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', delta: now - previous, pool }); previous = now;
    }, 100);
    const visibility = () => { if (document.hidden) dispatch({ type: 'pause' }); };
    document.addEventListener('visibilitychange', visibility);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [screen, state.phase, pool]);
  useEffect(() => {
    if (screen === 'game' && state.phase === 'playing') input.current?.focus({ preventScroll: true });
  }, [screen, state.phase]);
  async function start() {
    if (loading) return;
    setLoading(true); setError('');
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch(`/api/typing?level=${encodeURIComponent(level)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa tải được từ vựng.');
      const words = [...data] as TypingWord[];
      for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
      setPool(words); dispatch({ type: 'start' }); setScreen('game');
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Kết nối chậm. Vui lòng thử lại.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const wpm = state.elapsed ? Math.round(state.hitCharacters / 5 / (state.elapsed / 60_000)) : 0;
  const accuracy = state.typed ? Math.round(state.correct / state.typed * 100) : 100;
  const locked = state.targets.find(target => target.key === state.locked);
  const wrong = !!state.input && !locked?.word.startsWith(state.input);
  if (screen === 'setup') return <>{error && <MessageBar intent="error">{error}</MessageBar>}<PracticeSetup mode="typing" title="Bắn từ luyện gõ" level={level} onLevelChange={setLevel} onStart={start} exitRoute="/" loading={loading} rules={['Gõ từ đang rơi để khóa mục tiêu. Gõ đủ từ sẽ tự động bắn.', 'Xóa bằng Backspace để sửa; xóa hết để chọn mục tiêu khác.', 'Giữ combo để cộng điểm. Bỏ lỡ 3 từ hoặc hết 60 giây là kết thúc.', 'Chuyển sang tab khác sẽ tạm dừng. Có thể chơi bằng bàn phím điện thoại.']} /></>;
  if (state.phase === 'finished') return <><GameResult title="Hoàn thành lượt luyện gõ" value={state.score} onReplay={start} exitRoute="/" loading={loading}><dl className="typing-results"><div><dt>Từ đã bắn</dt><dd>{state.hits}</dd></div><div><dt>Tốc độ</dt><dd>{wpm} WPM</dd></div><div><dt>Độ chính xác</dt><dd>{accuracy}%</dd></div><div><dt>Combo cao nhất</dt><dd>{state.bestCombo}</dd></div></dl></GameResult>{error && <MessageBar intent="error">{error}</MessageBar>}</>;
  return <section className="typing-game">
    <PageHeader title="Bắn từ luyện gõ" icon={<KeyboardRegular />} actions={<><Button icon={state.phase === 'paused' ? <PlayRegular /> : <PauseRegular />} onClick={() => dispatch({ type: state.phase === 'paused' ? 'resume' : 'pause' })}>{state.phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng'}</Button><Link href="/" className="back-link">Thoát</Link></>} />
    <div className="typing-stats"><div><span>Điểm</span><strong>{state.score}</strong></div><div><span>Combo</span><strong>×{state.combo}</strong></div><div><span>Thời gian</span><strong>{Math.ceil((TYPING_DURATION - state.elapsed) / 1000)}s</strong></div><div><span>Lá chắn</span><strong className={state.lives === 1 ? 'typing-low' : ''}><ShieldRegular aria-hidden="true" />{state.lives}/3</strong></div></div>
    <ProgressBar value={1 - state.elapsed / TYPING_DURATION} aria-label="Thời gian còn lại" />
    <div className="typing-arena" aria-label="Mục tiêu luyện gõ" onClick={() => input.current?.focus({ preventScroll: true })}>
      <div className="typing-lanes" aria-hidden="true"><span /><span /><span /></div>
      {state.lastHit && state.elapsed - state.lastHitAt < 250 && <svg className="typing-shot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="97" x2={state.lastHit.lane * 33.333 + 16.667} y2={state.lastHit.y} /></svg>}
      {state.targets.map(target => <div key={target.key} className={`typing-target ${locked?.key === target.key ? 'is-locked' : ''}`} style={{ left: `${target.lane * 33.333 + 16.667}%`, top: `${target.y}%` }}><span className="typing-target-marker" aria-hidden="true" /><span><b>{locked?.key === target.key ? target.word.slice(0, Math.min(state.input.length, target.word.length)) : ''}</b>{locked?.key === target.key ? target.word.slice(state.input.length) : target.word}</span></div>)}
      {state.lastHit && state.elapsed - state.lastHitAt < 2200 && <div className="typing-hit" role="status"><strong>{state.lastHit.word}</strong><span>{state.lastHit.meaning}</span></div>}
      <div className={`typing-turret ${state.lastHit && state.elapsed - state.lastHitAt < 250 ? 'is-firing' : ''}`} aria-hidden="true"><span /><KeyboardRegular /></div>
      <div className="typing-defense" aria-hidden="true" />
      {state.phase === 'paused' && <div className="typing-pause"><h2>Đã tạm dừng</h2><p>Tiếp tục khi bạn sẵn sàng.</p><Button appearance="primary" icon={<PlayRegular />} onClick={() => dispatch({ type: 'resume' })}>Tiếp tục</Button></div>}
    </div>
    <div className="typing-input-area"><Input ref={input} size="large" value={state.input} disabled={state.phase !== 'playing'} aria-label="Gõ từ để bắn" aria-invalid={wrong} placeholder="Gõ từ để bắn…" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={24} onChange={(_, data) => { if (!composing.current) dispatch({ type: 'input', value: data.value }); }} onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => { composing.current = false; dispatch({ type: 'input', value: event.currentTarget.value }); }} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); dispatch({ type: 'pause' }); } }} /><p className={wrong ? 'typing-low' : ''}>{wrong ? 'Chưa khớp với mục tiêu. Dùng Backspace để sửa.' : locked ? `Đang nhắm: ${locked.word}` : 'Gõ đúng cả từ để tự động bắn.'}</p><span className="typing-metrics">{wpm} WPM · {accuracy}% chính xác</span></div>
  </section>;
}
