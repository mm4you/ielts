'use client';
import { useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Dialog, DialogSurface, MessageBar } from '@fluentui/react-components';
import { ArrowMaximizeRegular } from '@fluentui/react-icons/svg/arrow-maximize';
import { ArrowMinimizeRegular } from '@fluentui/react-icons/svg/arrow-minimize';
import { ArrowExitRegular } from '@fluentui/react-icons/svg/arrow-exit';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
import { PauseRegular } from '@fluentui/react-icons/svg/pause';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { ShieldRegular } from '@fluentui/react-icons/svg/shield';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { SpeakerOffRegular } from '@fluentui/react-icons/svg/speaker-off';
import { TypingAudio } from '@/lib/typing-audio';
import PageHeader from '@/components/PageHeader';
import PracticeSetup from '@/components/PracticeSetup';
import GameResult from '@/components/GameResult';
import { newTypingGame, normalizeTyping, typeIntoGame, typingTick, typingWordFeedback, TYPING_DURATION, type TypingState, type TypingWord } from '@/lib/typing-game';

function Ship({ enemy = false }: { enemy?: boolean }) {
  return <svg viewBox="0 0 64 56" fill="none" aria-hidden="true">{enemy ? <><path d="m32 46-9-15H8l9-22 10 12h10L47 9l9 22H41L32 46Z" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2" /><path d="M25 29h14l-7 10-7-10Z" fill="currentColor" /><path d="M17 15v9m30-9v9" stroke="currentColor" strokeWidth="3" /></> : <><path d="M32 4 43 26l15 14v8L38 40H26L6 48v-8l15-14L32 4Z" fill="currentColor" fillOpacity=".16" stroke="currentColor" strokeWidth="2" /><path d="m32 14 5 16H27l5-16Z" fill="currentColor" /><path d="M27 45v8m10-8v8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></>}</svg>;
}

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
  const [expanded, setExpanded] = useState(false);
  const fullscreenSurface = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const completedComposition = useRef<string | null>(null);
  const skipCompositionEnd = useRef(false);
  const audio = useRef<TypingAudio | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousSound = useRef({ hits: 0, lives: 3, correct: 0 });
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    if (!expanded || screen !== 'game' || state.phase === 'finished') return;
    const viewport = window.visualViewport;
    const resize = () => {
      fullscreenSurface.current?.style.setProperty('--typing-height', `${viewport?.height ?? window.innerHeight}px`);
      fullscreenSurface.current?.style.setProperty('--typing-top', `${viewport?.offsetTop ?? 0}px`);
      fullscreenSurface.current?.classList.toggle('is-keyboard-compact', (viewport?.height ?? window.innerHeight) < 520);
    };
    resize();
    viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); window.removeEventListener('resize', resize); };
  }, [expanded, screen, state.phase]);
  useEffect(() => () => { audio.current?.dispose(); audio.current = null; }, []);
  useEffect(() => { if (state.phase === 'paused') audio.current?.silence(); }, [state.phase]);
  useEffect(() => {
    const previous = previousSound.current;
    if (state.hits > previous.hits) audio.current?.play('destroy');
    else if (state.lives < previous.lives) audio.current?.play('damage');
    else if (state.correct > previous.correct) audio.current?.play('key');
    previousSound.current = { hits: state.hits, lives: state.lives, correct: state.correct };
  }, [state.hits, state.lives, state.correct]);
  function unlockAudio() {
    audio.current ??= new TypingAudio();
    audio.current.setEnabled(soundEnabled);
    void audio.current.unlock();
  }
  function changeSound() {
    const enabled = !soundEnabled;
    setSoundEnabled(enabled);
    audio.current ??= new TypingAudio();
    audio.current.setEnabled(enabled);
    if (enabled) void audio.current.unlock();
  }
  function changeInput(value: string) {
    if (state.phase !== 'playing') return;
    const normalized = normalizeTyping(value);
    if (completedComposition.current === normalized) { if (input.current) input.current.value = ''; return; }
    dispatch({ type: 'input', value });
    const complete = state.targets.some(target => target.word === normalized && (state.locked === null || target.key === state.locked));
    if (complete && input.current) {
      completedComposition.current = normalized;
      skipCompositionEnd.current = true;
      composing.current = false;
      input.current.value = '';
      // The input is keyed by hits below: a fresh native node drops the OS IME's
      // committed-word buffer, so it cannot reinsert the previous target.
    }
  }
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
  }, [screen, state.phase, expanded, state.hits]);
  // Keep in-progress IME text native; matching the final character commits a
  // target immediately, without waiting for the IME's Space/Enter confirmation.
  useEffect(() => {
    if (!composing.current && input.current && input.current.value !== state.input) input.current.value = state.input;
  }, [state.input, state.hits, expanded]);
  useEffect(() => {
    if (screen !== 'game' || state.phase !== 'playing') return;
    const keydown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return;
      if (event.key === 'Escape') { dispatch({ type: 'pause' }); return; }
      if (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable="true"]')) return;
      const field = input.current;
      if (!field || !(event.key.length === 1 || event.key === 'Backspace')) return;
      event.preventDefault(); field.focus({ preventScroll: true });
      field.value = event.key === 'Backspace' ? field.value.slice(0, -1) : (field.value + event.key).slice(0, 24);
      completedComposition.current = null;
      dispatch({ type: 'input', value: field.value });
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [screen, state.phase]);
  async function start() {
    if (loading) return;
    unlockAudio();
    setLoading(true); setError('');
    const controller = new AbortController(); request.current = controller;
    try {
      const response = await fetch(`/api/typing?level=${encodeURIComponent(level)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Chưa tải được từ vựng.');
      const words = [...data] as TypingWord[];
      for (let i = words.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [words[i], words[j]] = [words[j], words[i]]; }
      setPool(words); dispatch({ type: 'start' }); setExpanded(true); setScreen('game');
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error && e.name !== 'TimeoutError' ? e.message : 'Kết nối chậm. Vui lòng thử lại.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const wpm = Math.round(state.hitCharacters / 5 / (Math.max(3000, state.elapsed) / 60_000));
  const accuracy = state.typed ? Math.round(state.correct / state.typed * 100) : 100;
  const locked = state.targets.find(target => target.key === state.locked);
  const wrong = !!state.input && !locked?.word.startsWith(state.input);
  const feedbackTarget = locked || (wrong ? [...state.targets].sort((a,b)=>b.y-a.y)[0] : undefined);
  if (screen === 'setup') return <>{error && <MessageBar intent="error">{error}</MessageBar>}<PracticeSetup mode="typing" title="Chíu chíu luyện gõ" level={level} onLevelChange={setLevel} onStart={start} exitRoute="/" loading={loading} rules={['Gõ đúng từ đang rơi để bắn tự động, không cần nhấn cách.', 'Dùng Backspace để sửa. Xóa hết để đổi mục tiêu.', 'Bắn liên tiếp để tăng combo. Mỗi lượt có 60 giây và 3 lá chắn.', 'Rời tab sẽ tạm dừng. Trên điện thoại, chạm ô gõ để mở bàn phím.']} /></>;
  if (state.phase === 'finished') return <><GameResult title="Hoàn thành lượt luyện gõ" value={state.score} onReplay={start} exitRoute="/" loading={loading}><dl className="typing-results"><div><dt>Từ đã bắn</dt><dd>{state.hits}</dd></div><div><dt>Tốc độ</dt><dd>{wpm} WPM</dd></div><div><dt>Độ chính xác</dt><dd>{accuracy}%</dd></div><div><dt>Combo cao nhất</dt><dd>{state.bestCombo}</dd></div></dl></GameResult>{error && <MessageBar intent="error">{error}</MessageBar>}</>;
  const consoleView = <div className="typing-console">
      <div className="typing-hud">
        {expanded && <span className="typing-fullscreen-title">Chíu chíu luyện gõ</span>}
        <div className="typing-hud-score"><span>ĐIỂM</span><strong>{state.score.toLocaleString('vi-VN')}</strong></div>
        <div><span>COMBO</span><strong className={state.combo > 1 ? 'is-combo' : ''}>×{state.combo}</strong></div>
        <div><span>CÒN LẠI</span><strong>{Math.ceil((TYPING_DURATION - state.elapsed) / 1000)}<small>s</small></strong></div>
        <div className="typing-shields" aria-label={`Còn ${state.lives} lá chắn`}><span>LÁ CHẮN</span><strong>{[0,1,2].map(i => <ShieldRegular key={i} className={i < state.lives ? 'is-alive' : ''} aria-hidden="true" />)}</strong></div>
        <div className="typing-hud-actions"><button type="button" className="typing-pause-button" aria-label={soundEnabled?'Tắt âm thanh':'Bật âm thanh'} aria-pressed={soundEnabled} title={soundEnabled?'Tắt âm thanh':'Bật âm thanh'} onClick={changeSound}>{soundEnabled?<Speaker2Regular />:<SpeakerOffRegular />}</button><button type="button" className="typing-pause-button" aria-label={state.phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng'} title={state.phase === 'paused' ? 'Tiếp tục' : 'Tạm dừng (Esc)'} onClick={() => {unlockAudio(); dispatch({type:state.phase === 'paused' ? 'resume' : 'pause'});}}>{state.phase === 'paused' ? <PlayRegular /> : <PauseRegular />}</button><button type="button" className="typing-pause-button" aria-label={expanded?'Thu nhỏ màn chơi':'Mở rộng màn chơi'} title={expanded?'Thu nhỏ màn chơi':'Mở rộng màn chơi'} onClick={()=>setExpanded(value=>!value)}>{expanded?<ArrowMinimizeRegular />:<ArrowMaximizeRegular />}</button>{expanded&&<button type="button" className="typing-pause-button" aria-label="Thoát lượt chơi" title="Thoát lượt chơi" onClick={()=>{dispatch({type:'pause'});setExpanded(false);setScreen('setup');}}><ArrowExitRegular /></button>}</div>
      </div>
      <div className="typing-time-track" role="progressbar" aria-label="Thời gian còn lại" aria-valuenow={Math.ceil((TYPING_DURATION-state.elapsed)/1000)} aria-valuemin={0} aria-valuemax={60}><span style={{transform:`scaleX(${1-state.elapsed/TYPING_DURATION})`}} /></div>
      <div className="typing-arena" aria-label="Mục tiêu luyện gõ" onClick={() => input.current?.focus({preventScroll:true})}>
        <div className="typing-starfield" aria-hidden="true" /><div className="typing-orbit" aria-hidden="true" />
        <div className="typing-sector-label" aria-hidden="true">VOCAB DEFENSE <span>01 / ORBIT</span></div>
        {state.lastShot && state.elapsed-state.lastShotAt<180 && <svg className="typing-shot" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="50" y1="88" x2={state.lastShot.lane*33.333+16.667} y2={state.lastShot.y*.78+7} /></svg>}
        {state.targets.map(target => {
          const active = feedbackTarget?.key === target.key;
          const feedback = typingWordFeedback(target.word, active ? state.input : '');
          return <div key={target.key} className={`typing-enemy ${active?'is-locked':''} ${target.y>70?'is-danger':''} ${active&&feedback.wrong?'is-mistyped':''}`} style={{left:`${target.lane*33.333+16.667}%`,top:`${target.y*.78+7}%`}}><span className={`typing-target-notice ${active?'is-visible':''}`} aria-live="polite">{active ? feedback.wrong ? 'Sai ký tự' : 'Đang nhắm' : ''}</span><Ship enemy /><div className="typing-word"><b>{target.word.slice(0,feedback.matched)}</b>{feedback.wrong?<><span className="typing-mismatch">{target.word[feedback.matched]||'+'}</span>{target.word.slice(feedback.matched+1)}</>:target.word.slice(feedback.matched)}</div></div>;
        })}
        {!state.targets.length && !state.lastHit && state.phase==='playing' && <p className="typing-ready-hint">Sẵn sàng bàn phím. Mục tiêu đang đến.</p>}
        <div className={`typing-player ${state.lastShot&&state.elapsed-state.lastShotAt<180?'is-firing':''}`} aria-hidden="true"><Ship /><span className="typing-engine" /></div>
        <div className="typing-horizon" aria-hidden="true" />
        {state.phase==='paused'&&<div className="typing-pause"><PauseRegular aria-hidden="true" /><h2>Đã tạm dừng</h2><p>Nhấn Tiếp tục để bật ô gõ.</p><Button appearance="primary" size="large" icon={<PlayRegular />} onClick={()=>{unlockAudio();dispatch({type:'resume'});}}>Tiếp tục chơi</Button></div>}
      </div>
      <div className="typing-command-dock">
        <div className="typing-target-status"><span className={wrong?'is-error':''}>{state.phase==='paused'?'Đang tạm dừng':wrong?'Sai ký tự — Backspace để sửa':locked?`Mục tiêu: ${locked.word}`:'Gõ một từ trên màn hình để nhắm bắn'}</span><span>{wpm} WPM <i />{accuracy}% chính xác</span></div>
        <label className={`typing-native-field ${wrong?'is-error':''}`}><KeyboardRegular aria-hidden="true" /><input key={state.hits} ref={input} aria-label="Gõ từ để bắn" aria-invalid={wrong} readOnly={state.phase!=='playing'} placeholder={state.phase==='paused'?'Nhấn Tiếp tục chơi để gõ':'Gõ ở đây để bắn…'} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={24} onChange={event=>changeInput(event.currentTarget.value)} onKeyDown={event=>{if(!event.nativeEvent.isComposing&&event.key!=='Process')completedComposition.current=null;}} onCompositionStart={()=>{composing.current=true;skipCompositionEnd.current=false;}} onCompositionEnd={event=>{composing.current=false;if(skipCompositionEnd.current){skipCompositionEnd.current=false;event.currentTarget.value='';return;}changeInput(event.currentTarget.value);}} /><span className="typing-auto-fire">TỰ BẮN</span></label>
        <div className="typing-dock-footer"><span>Gõ đủ từ để bắn <kbd>Backspace</kbd> sửa chữ</span><span><kbd>Esc</kbd> tạm dừng</span></div>
        {expanded&&state.lastHit&&<p className="typing-dock-receipt" role="status"><strong>{state.lastHit.word}</strong><span>{state.lastHit.meaning}</span></p>}
      </div>
    </div>;
  return <section className="typing-game typing-game-v2">
    {!expanded&&<PageHeader title="Chíu chíu luyện gõ" actions={<Link href="/" className="back-link">Thoát lượt chơi</Link>} />}
    {expanded?<Dialog open onOpenChange={(_,data)=>{if(!data.open)dispatch({type:'pause'});}}><DialogSurface ref={fullscreenSurface} className="typing-fullscreen" aria-label="Chíu chíu luyện gõ — màn chơi mở rộng">{consoleView}</DialogSurface></Dialog>:consoleView}
    {!expanded&&<div className="typing-word-receipt" role="status">{state.lastHit?<><span>Đã bắn</span><strong>{state.lastHit.word}</strong><p>{state.lastHit.meaning}</p></>:<><span>Sau mỗi lần bắn</span><p>Nghĩa của từ sẽ xuất hiện ở đây.</p></>}</div>}
  </section>;
}
