'use client';
import { useEffect, useRef, useState } from 'react';
import { Button, ProgressBar } from '@fluentui/react-components';
import { KeyboardRegular } from '@fluentui/react-icons/svg/keyboard';
import { TargetArrowRegular } from '@fluentui/react-icons/svg/target-arrow';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { SpeakerOffRegular } from '@fluentui/react-icons/svg/speaker-off';
import { CheckmarkRegular } from '@fluentui/react-icons/svg/checkmark';
import { TypingAudio } from '@/lib/typing-audio';
import { ROOM_MODE_INFO, type RoomMode } from '@/lib/rooms/settings';
import type { RoomGameView } from '@/lib/rooms/types';

type Props = { mode: RoomMode; game: RoomGameView; now: number; busy: boolean; secondsPerTarget: number; act: (action: Record<string, unknown>) => Promise<boolean> };
export default function RoomModeGame({ mode, game, now, busy, secondsPerTarget, act }: Props) {
  const [entry, setEntry] = useState({ cursor: -1, value: '' });
  const typed = entry.cursor === game.cursor ? entry.value : '';
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [muted, setMuted] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const audio = useRef<TypingAudio | null>(null);
  const pendingWord = useRef<number | null>(null);
  const seconds = Math.max(0, Math.ceil((game.deadline - now) / 1000));
  const targetRemaining = game.targetDeadline ? Math.max(0, Math.min(1, (game.targetDeadline - now) / (secondsPerTarget * 1000))) : 1;
  useEffect(() => {
    if (mode !== 'typing') return;
    const sound = new TypingAudio(); audio.current = sound;
    return () => { sound.dispose(); audio.current = null; };
  }, [mode]);
  useEffect(() => { if (mode === 'typing' && !game.finished) input.current?.focus({ preventScroll: true }); }, [mode, game.cursor, game.finished]);
  function play(fields: Record<string, unknown>) { return act({ action: 'play', revision: game.revision, ...fields }); }
  async function typeWord(value: string) {
    setEntry({ cursor: game.cursor, value });
    const sound = audio.current;
    if (sound) { await sound.unlock(); sound.play('key'); }
    if (!game.prompt || value.trim().toLowerCase() !== game.prompt.trim().toLowerCase() || busy || pendingWord.current === game.cursor) return;
    pendingWord.current = game.cursor;
    const okay = await play({ kind: 'type', text: value });
    if (okay) { sound?.play('destroy'); setEntry({ cursor: game.cursor, value: '' }); }
    pendingWord.current = null;
  }
  const wrong = !!typed && !!game.prompt && !game.prompt.toLowerCase().startsWith(typed.toLowerCase());
  const info = ROOM_MODE_INFO[mode];
  if (game.finished) return <section className="panel room-own-finish"><CheckmarkRegular aria-hidden="true" /><h2>Lượt chơi của bạn đã kết thúc</h2><p>{game.score.toLocaleString('vi-VN')} điểm · hoàn thành {game.correct}/{game.total} {mode === 'match' ? 'cặp' : 'từ'}</p><p className="room-hint">Chờ những người còn lại hoặc hết giờ để xem kết quả chung.</p></section>;
  return <section className={`panel room-mode-game room-mode-${mode}`} aria-label={info.name}>
    <div className="room-game-hud"><div><span>{info.name}</span><strong>{game.score.toLocaleString('vi-VN')} <small>điểm</small></strong></div><div><span>{mode === 'match' ? 'Đã ghép' : 'Hoàn thành'}</span><strong>{game.correct}/{game.total}</strong></div><div><span>Còn lại</span><strong className={seconds <= 10 ? 'is-low' : ''}>{seconds}<small>s</small></strong></div></div>
    <p className="room-game-rule">{info.rules}</p>
    {['typing', 'sniper'].includes(mode) && <div className="room-game-lives"><span>Còn {game.lives}/3 {mode === 'typing' ? 'lá chắn' : 'lượt'}</span><ProgressBar aria-label="Thời gian mục tiêu" value={targetRemaining} /></div>}
    {mode === 'typing' ? <>
      <div className="room-typing-arena"><div className={`room-falling-word ${wrong ? 'is-wrong' : ''}`} style={{ top: `${10 + (1 - targetRemaining) * 58}%` }}><span aria-live="polite">{wrong ? 'Sai ký tự' : 'Gõ đủ từ để bắn'}</span><TargetArrowRegular aria-hidden="true" /><strong><b>{!wrong ? game.prompt?.slice(0, typed.length) : ''}</b>{wrong ? game.prompt : game.prompt?.slice(typed.length)}</strong></div><svg className="room-typing-ship" viewBox="0 0 64 56" fill="none" aria-hidden="true"><path d="M32 4 43 26l15 14v8L38 40H26L6 48v-8l15-14L32 4Z" stroke="currentColor" strokeWidth="2" /><path d="m32 14 5 16H27l5-16Z" fill="currentColor" /><path d="M27 45v8m10-8v8" stroke="currentColor" strokeWidth="3" /></svg></div>
      <div className="room-typing-command"><KeyboardRegular aria-hidden="true" /><input key={game.cursor} ref={input} aria-label="Gõ từ để bắn" placeholder="Gõ ở đây để bắn…" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={busy || seconds === 0} onChange={e => void typeWord(e.currentTarget.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void typeWord(e.currentTarget.value); } }} /><Button appearance="subtle" aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'} icon={muted ? <SpeakerOffRegular /> : <Speaker2Regular />} onClick={() => { setMuted(!muted); audio.current?.setEnabled(muted); }} /></div>
    </> : mode === 'match' ? <><div className="room-memory-meta"><span>{game.moves} lượt lật</span><span>Ghép từ và nghĩa</span></div><div className="room-memory-grid">{game.cards.map(card => <button key={`${game.cursor}-${card.index}`} type="button" className={`room-memory-card ${card.text ? 'is-open' : ''} ${card.matched ? 'is-matched' : ''}`} aria-label={card.text || `Lật thẻ ${card.index + 1}`} aria-pressed={!!card.text} disabled={busy || card.matched || !!card.text || now < game.lockUntil || seconds === 0} onClick={() => void play({ kind: 'flip', card: card.index })}>{card.text || <span aria-hidden="true">{card.index + 1}</span>}{card.matched && <CheckmarkRegular aria-hidden="true" />}</button>)}</div></>
    : mode === 'blockblast' && game.pieces.some(Boolean) ? <><p className="room-hint">Chọn một khối, rồi chọn ô trên bàn để đặt.</p><div className="room-block-board" role="group" aria-label="Bàn xếp hình">{game.board.flatMap((line, row) => line.map((cell, column) => <button key={`${row}-${column}`} type="button" aria-label={`Hàng ${row + 1}, cột ${column + 1}${cell === 2 ? ', ô chặn' : cell ? ', đã có khối' : ', ô trống'}`} className={`room-block-cell ${cell === 2 ? 'is-blocked' : cell ? 'is-filled' : ''}`} disabled={busy || !!cell || selectedPiece === null || !game.pieces[selectedPiece] || seconds === 0} onClick={async () => { if (await play({ kind: 'place', piece: selectedPiece, row, column })) setSelectedPiece(null); }}>{cell === 2 ? '×' : ''}</button>))}</div><div className="room-block-pieces" aria-label="Chọn khối">{game.pieces.map((shape, index) => <button key={index} type="button" aria-label={`Khối ${index + 1}${shape ? '' : ', đã dùng'}`} aria-pressed={selectedPiece === index} disabled={busy || !shape || seconds === 0} onClick={() => setSelectedPiece(index)}>{shape ? <span className="room-block-shape" style={{ gridTemplateColumns: `repeat(${shape[0].length}, 16px)` }}>{shape.flatMap((line, r) => line.map((cell, c) => <i key={`${r}-${c}`} style={{ visibility: cell ? 'visible' : 'hidden' }} />))}</span> : <CheckmarkRegular aria-hidden="true" />}</button>)}</div></>
    : <><h2 className="room-game-prompt">{game.prompt}</h2><p className="room-hint">{mode === 'sniper' ? 'Bắn từ tiếng Anh phù hợp với nghĩa trên' : 'Chọn nghĩa phù hợp'}</p><div className={mode === 'sniper' ? 'room-sniper-arena' : 'battle-choices'}>{game.choices.map((choice, index) => <button key={`${game.cursor}-${index}`} type="button" className={mode === 'sniper' ? 'room-sniper-target' : 'battle-choice'} disabled={busy || seconds === 0 || (mode === 'sniper' && targetRemaining <= 0)} onClick={() => void play({ kind: 'choice', choice: index })}>{mode === 'sniper' ? <TargetArrowRegular aria-hidden="true" /> : <span>{String.fromCharCode(65 + index)}</span>}<span>{choice}</span></button>)}</div>{mode === 'speedrun' && <p className="room-hint room-combo">Combo ×{game.combo}</p>}</>}
    <p className={`room-game-feedback ${game.lastResult ? game.lastResult.correct ? 'is-correct' : 'is-wrong' : ''}`} role="status">{game.lastResult ? `${game.lastResult.correct ? 'Chính xác' : 'Chưa đúng'} · ${game.lastResult.answer}` : 'Sẵn sàng ghi điểm.'}</p>
    <p className="room-hint">Trận nhiều người tiếp tục chạy khi bạn chuyển tab.</p>
  </section>;
}
