import type { RoomState, RoomView, RoomPhase } from './types';
import { RoomError } from './error';
import { gameDeadline, gameMode, gameView } from './games';
export { RoomError } from './error';

export function phaseAt(state: RoomState, now: number): { phase: RoomPhase; index: number; nextAt: number | null } {
  if (state.closed) return { phase: 'closed', index: 0, nextAt: null };
  if (state.startedAt === null) return { phase: 'waiting', index: 0, nextAt: null };
  if (now < state.startedAt) return { phase: 'countdown', index: 0, nextAt: state.startedAt };
  if (gameMode(state) !== 'quiz') {
    const finished = now >= gameDeadline(state) || state.players.filter(p => !p.left).every(p => state.games?.[p.id]?.finished);
    return { phase: finished ? 'finished' : 'question', index: 0, nextAt: finished ? null : gameDeadline(state) };
  }
  const round = state.settings.secondsPerQuestion * 1000 + 3000;
  const index = Math.floor((now - state.startedAt) / round);
  if (index >= state.questions.length) return { phase: 'finished', index: state.questions.length - 1, nextAt: null };
  const deadline = state.startedAt + index * round + state.settings.secondsPerQuestion * 1000;
  return { phase: now < deadline ? 'question' : 'reveal', index, nextAt: now < deadline ? deadline : state.startedAt + (index + 1) * round };
}

export function answerQuestion(state: RoomState, userId: string, index: number, choice: number, now: number) {
  if (gameMode(state) !== 'quiz') throw new RoomError('Phòng này không dùng trả lời trắc nghiệm theo vòng.');
  if (!Number.isInteger(choice) || choice < 0 || choice > 3) throw new RoomError('Đáp án không hợp lệ.');
  const player = state.players.find(p => p.id === userId && !p.left);
  if (!player) throw new RoomError('Bạn chưa tham gia phòng.', 403);
  const current = phaseAt(state, now);
  if (current.phase !== 'question' || current.index !== index) throw new RoomError('Câu hỏi đã kết thúc.', 409);
  const answers = state.answers[index] ??= {};
  if (answers[userId]) throw new RoomError('Bạn đã trả lời câu này.', 409);
  const duration = state.settings.secondsPerQuestion * 1000;
  const remaining = Math.max(0, (current.nextAt! - now) / duration);
  answers[userId] = { choice, points: choice === state.questions[index].correctIndex ? 100 + Math.floor(remaining * 50) : 0 };
}

export function roomView(code: string, state: RoomState, meId: string, now: number): RoomView {
  if (!state.players.some(p => p.id === meId)) throw new RoomError('Bạn chưa tham gia phòng.', 403);
  const { phase, index, nextAt } = phaseAt(state, now);
  const publishedThrough = phase === 'reveal' || phase === 'finished' ? index : index - 1;
  const players = state.players.map(p => {
    if (gameMode(state) !== 'quiz') {
      const progress = state.games?.[p.id];
      return { ...p, score: progress?.score || 0, correct: progress?.correct || 0, answered: !!progress?.finished };
    }
    let score = 0, correct = 0;
    for (let i = 0; i <= publishedThrough; i++) {
      const answer = state.answers[i]?.[p.id];
      if (answer) { score += answer.points; if (answer.points > 0) correct++; }
    }
    return { ...p, score, correct, answered: !!state.answers[index]?.[p.id] };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const q = gameMode(state) === 'quiz' && (phase === 'question' || phase === 'reveal') ? state.questions[index] : null;
  return {
    code, title: state.title, hostId: state.hostId, meId, settings: state.settings,
    phase, serverNow: now, nextAt, questionNumber: state.startedAt === null ? 0 : index + 1, players,
    question: q ? { word: q.word, choices: q.choices, ...(phase === 'reveal' ? { correctIndex: q.correctIndex } : {}), ...(state.answers[index]?.[meId] ? { myChoice: state.answers[index][meId].choice } : {}) } : null,
    ...(gameMode(state) !== 'quiz' ? { game: gameView(state, meId, now) } : {}),
  };
}
