import { RoomError } from './error';
import type { RoomGameAction, RoomGameProgress, RoomGameView, RoomState } from './types';

export const ROOM_SHAPES = [
  [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]],
  [[1, 1], [1, 1]], [[1, 0], [1, 1]], [[0, 1], [1, 1]],
];
export const gameMode = (state: RoomState) => state.settings.mode || 'quiz';
export const gameDeadline = (state: RoomState) => (state.startedAt || 0) + (state.settings.durationSeconds || 90) * 1000;
const piecesAt = (cursor: number) => [cursor % 8, (cursor * 3 + 1) % 8, (cursor * 5 + 2) % 8];

export function initializeGames(state: RoomState) {
  state.games = Object.fromEntries(state.players.map(player => [player.id, {
    revision: 0, cursor: 0, score: 0, correct: 0, combo: 0, lives: 3,
    changedAt: state.startedAt!, finished: false, flipped: [], matched: [], lockUntil: 0,
    moves: 0, board: Array.from({ length: 8 }, () => Array<number>(8).fill(0)), pieces: piecesAt(0), used: [],
  } satisfies RoomGameProgress]));
}

function advance(state: RoomState, progress: RoomGameProgress, now: number) {
  progress.cursor++;
  progress.changedAt = now;
  progress.finished = progress.cursor >= state.questions.length || progress.lives <= 0;
}

/** Advance missed flying targets using server time, including after a disconnect. */
export function expireGames(state: RoomState, now: number) {
  if (!state.startedAt || now < state.startedAt || gameMode(state) === 'quiz') return false;
  let changed = false;
  for (const progress of Object.values(state.games || {})) {
    if (progress.finished) continue;
    if (now >= gameDeadline(state)) { progress.finished = true; progress.revision++; changed = true; continue; }
    if (!['sniper', 'typing'].includes(gameMode(state))) continue;
    const duration = state.settings.secondsPerQuestion * 1000;
    while (!progress.finished && now >= progress.changedAt + duration) {
      const at = progress.changedAt + duration;
      progress.lastResult = { correct: false, answer: state.questions[progress.cursor].word };
      progress.lives--; progress.combo = 0; progress.revision++;
      advance(state, progress, at); changed = true;
    }
  }
  return changed;
}

export function canPlaceRoomShape(board: number[][], shape: number[][], row: number, column: number) {
  return shape.every((line, r) => line.every((cell, c) => !cell || board[row + r]?.[column + c] === 0));
}

function hasPlacement(progress: RoomGameProgress) {
  return progress.pieces.some((id, index) => !progress.used.includes(index) &&
    progress.board.some((line, r) => line.some((_, c) => canPlaceRoomShape(progress.board, ROOM_SHAPES[id], r, c))));
}

export function playGame(state: RoomState, userId: string, action: RoomGameAction, now: number) {
  if (!state.players.some(p => p.id === userId && !p.left)) throw new RoomError('Bạn chưa tham gia phòng.', 403);
  if (state.closed || !state.startedAt || now < state.startedAt || now >= gameDeadline(state)) throw new RoomError('Trận đấu chưa bắt đầu hoặc đã kết thúc.', 409);
  const progress = state.games?.[userId];
  if (!progress || progress.finished) throw new RoomError('Bạn đã hoàn thành lượt chơi.', 409);
  if (progress.revision !== action.revision) throw new RoomError('Lượt chơi đã thay đổi. Đang cập nhật lại.', 409);
  const mode = gameMode(state), question = state.questions[progress.cursor];
  if (!question) throw new RoomError('Không còn câu hỏi.', 409);
  if (mode === 'match' && action.kind === 'flip') {
    const deck = state.decks?.[Math.floor(progress.cursor / 6)];
    if (!deck || !Number.isInteger(action.card) || action.card < 0 || action.card >= deck.length) throw new RoomError('Thẻ không hợp lệ.');
    if (now < progress.lockUntil) throw new RoomError('Chờ hai thẻ úp lại.', 409);
    if (progress.flipped.length === 2) progress.flipped = [];
    if (progress.matched.includes(action.card) || progress.flipped.includes(action.card)) throw new RoomError('Thẻ đã được lật.', 409);
    progress.flipped.push(action.card);
    if (progress.flipped.length === 2) {
      progress.moves++;
      const [a, b] = progress.flipped.map(index => Math.floor(deck[index] / 2));
      if (a === b) {
        progress.matched.push(...progress.flipped); progress.correct++;
        const elapsed = now - progress.changedAt;
        progress.score += 100 + Math.max(0, 50 - Math.floor(elapsed / 1000));
        progress.lastResult = { correct: true, answer: state.questions[progress.cursor + a].word };
        progress.changedAt = now;
        progress.flipped = [];
        if (progress.matched.length === deck.length) {
          progress.cursor += deck.length / 2;
          progress.matched = [];
          progress.finished = progress.cursor >= state.questions.length;
        }
      } else {
        progress.lastResult = { correct: false, answer: 'Chưa khớp, thử cặp khác.' };
        progress.lockUntil = now + 900;
      }
    }
  } else if (mode === 'blockblast' && action.kind === 'place') {
    if (!Number.isInteger(action.piece) || action.piece < 0 || action.piece > 2 || progress.used.includes(action.piece)) throw new RoomError('Khối đã được dùng.', 409);
    if (!Number.isInteger(action.row) || !Number.isInteger(action.column) || action.row < 0 || action.row > 7 || action.column < 0 || action.column > 7) throw new RoomError('Ô đặt không hợp lệ.');
    const shape = ROOM_SHAPES[progress.pieces[action.piece]];
    if (!canPlaceRoomShape(progress.board, shape, action.row, action.column)) throw new RoomError('Khối không vừa vị trí này.');
    shape.forEach((line, r) => line.forEach((cell, c) => { if (cell) { progress.board[action.row + r][action.column + c] = 1; progress.score += 5; } }));
    const rows = progress.board.flatMap((line, r) => line.every(Boolean) ? [r] : []);
    const columns = Array.from({ length: 8 }, (_, c) => c).filter(c => progress.board.every(line => !!line[c]));
    progress.board = progress.board.map((line, r) => line.map((cell, c) => rows.includes(r) || columns.includes(c) ? 0 : cell));
    progress.score += (rows.length + columns.length) * 100;
    progress.used.push(action.piece);
    if (progress.used.length < 3 && !hasPlacement(progress)) progress.finished = true;
  } else if ((mode === 'typing' && action.kind === 'type') || (['speedrun', 'sniper', 'blockblast'].includes(mode) && action.kind === 'choice')) {
    if (mode === 'blockblast' && progress.used.length !== 3) throw new RoomError('Xếp hết 3 khối trước khi trả lời.', 409);
    const correct = action.kind === 'type'
      ? action.text.trim().toLowerCase() === question.word.trim().toLowerCase()
      : Number.isInteger(action.choice) && action.choice >= 0 && action.choice < 4 && action.choice === question.correctIndex;
    if (action.kind === 'type' && !correct) throw new RoomError('Từ chưa đúng. Kiểm tra lại ký tự.');
    if (action.kind === 'choice' && (!Number.isInteger(action.choice) || action.choice < 0 || action.choice > 3)) throw new RoomError('Đáp án không hợp lệ.');
    if (correct) {
      progress.combo++; progress.correct++;
      progress.score += 100 + Math.min(50, (progress.combo - 1) * 10);
    } else { progress.combo = 0; if (mode === 'sniper') progress.lives--; }
    progress.lastResult = { correct, answer: mode === 'sniper' || mode === 'typing' ? question.word : question.choices[question.correctIndex] };
    advance(state, progress, now);
    if (mode === 'blockblast' && !progress.finished) {
      if (!correct) {
        const empty = progress.board.flatMap((line, r) => line.flatMap((cell, c) => cell ? [] : [{ r, c }]));
        if (empty.length) { const { r, c } = empty[(progress.cursor * 17) % empty.length]; progress.board[r][c] = 2; }
      }
      progress.pieces = piecesAt(progress.cursor); progress.used = [];
      if (!hasPlacement(progress)) progress.finished = true;
    }
  } else throw new RoomError('Thao tác không thuộc chế độ của phòng.');
  progress.revision++;
}

export function gameView(state: RoomState, userId: string, now: number): RoomGameView | undefined {
  const progress = state.games?.[userId];
  if (!progress) return undefined;
  const mode = gameMode(state), finished = progress.finished || now >= gameDeadline(state);
  const q = finished ? undefined : state.questions[progress.cursor];
  const deck = mode === 'match' && !finished ? state.decks?.[Math.floor(progress.cursor / 6)] || [] : [];
  return {
    revision: progress.revision, cursor: progress.cursor, total: state.questions.length,
    score: progress.score, correct: progress.correct, combo: progress.combo, lives: progress.lives,
    finished, deadline: gameDeadline(state), targetDeadline: q && ['sniper', 'typing'].includes(mode) ? progress.changedAt + state.settings.secondsPerQuestion * 1000 : null,
    prompt: q ? mode === 'sniper' ? q.prompt || '' : mode === 'match' ? null : q.word : null,
    choices: q && ['speedrun', 'sniper', 'blockblast'].includes(mode) && (mode !== 'blockblast' || progress.used.length === 3) ? q.choices : [],
    lastResult: progress.lastResult, moves: progress.moves, lockUntil: progress.lockUntil,
    cards: deck.map((value, index) => {
      const matched = progress.matched.includes(index);
      const open = matched || (progress.flipped.includes(index) && (progress.flipped.length < 2 || now < progress.lockUntil));
      const pair = state.questions[progress.cursor + Math.floor(value / 2)];
      return { index, matched, text: open ? value % 2 ? pair.choices[pair.correctIndex] : pair.word : null };
    }),
    board: mode === 'blockblast' ? progress.board : [],
    pieces: mode === 'blockblast' ? progress.pieces.map((id, index) => progress.used.includes(index) ? null : ROOM_SHAPES[id]) : [],
  };
}
