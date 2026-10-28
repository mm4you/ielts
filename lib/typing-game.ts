export type TypingWord = { id: number; word: string; meaning: string };
export type TypingTarget = TypingWord & { key: number; lane: number; y: number };
export type TypingState = {
  phase: 'playing' | 'paused' | 'finished'; elapsed: number; spawnIn: number; serial: number;
  targets: TypingTarget[]; input: string; locked: number | null; score: number; combo: number;
  bestCombo: number; lives: number; hits: number; hitCharacters: number; typed: number; correct: number;
  lastHit: TypingTarget | null; lastHitAt: number;
  lastShot: TypingTarget | null; lastShotAt: number;
};
export const TYPING_DURATION = 60_000;
export function normalizeTyping(value: string) { return value.toLowerCase().replace(/[’‘]/g, "'"); }
export function newTypingGame(): TypingState {
  return { phase: 'playing', elapsed: 0, spawnIn: 0, serial: 0, targets: [], input: '', locked: null, score: 0, combo: 0, bestCombo: 0, lives: 3, hits: 0, hitCharacters: 0, typed: 0, correct: 0, lastHit: null, lastHitAt: 0, lastShot: null, lastShotAt: 0 };
}
export function typingTick(state: TypingState, delta: number, pool: TypingWord[]): TypingState {
  if (state.phase !== 'playing' || !pool.length) return state;
  const dt = Math.max(0, Math.min(250, delta));
  const elapsed = Math.min(TYPING_DURATION, state.elapsed + dt);
  const speed = 7 + Math.min(5, elapsed / 12_000);
  const moved = state.targets.map(target => ({ ...target, y: target.y + dt * speed / 1000 }));
  const missed = moved.filter(target => target.y >= 93);
  let targets = moved.filter(target => target.y < 93);
  const lives = Math.max(0, state.lives - missed.length);
  const lostLock = missed.some(target => target.key === state.locked);
  let spawnIn = state.spawnIn - dt;
  let serial = state.serial;
  if (spawnIn <= 0 && targets.length < 5 && lives > 0 && elapsed < TYPING_DURATION) {
    const word = Array.from({ length: pool.length }, (_, offset) => pool[(serial + offset) % pool.length]).find(candidate => !targets.some(target => target.word === candidate.word));
    if (word) {
      const counts = [0, 1, 2].map(lane => targets.filter(target => target.lane === lane).length);
      const preferred = serial % 3;
      const lane = [preferred, (preferred + 1) % 3, (preferred + 2) % 3].find(l => counts[l] === Math.min(...counts))!;
      targets = [...targets, { ...word, key: serial, lane, y: 0 }]; serial++;
    }
    spawnIn = Math.max(1250, 2600 - elapsed / 40);
  }
  return { ...state, elapsed, targets, lives, serial, spawnIn, combo: missed.length ? 0 : state.combo,
    input: lostLock ? '' : state.input, locked: lostLock ? null : state.locked,
    phase: lives === 0 || elapsed >= TYPING_DURATION ? 'finished' : 'playing' };
}
export function typeIntoGame(state: TypingState, value: string): TypingState {
  if (state.phase !== 'playing') return state;
  const input = normalizeTyping(value).slice(0, 24);
  const target = state.targets.find(t => t.key === state.locked) || [...state.targets].sort((a, b) => b.y - a.y).find(t => t.word.startsWith(input) && input.length > 0);
  let prefix = 0;
  while (prefix < input.length && prefix < state.input.length && input[prefix] === state.input[prefix]) prefix++;
  const added = input.length - prefix;
  const correct = state.correct + (target?.word.startsWith(input) ? added : 0);
  const next = { ...state, input, locked: input ? target?.key ?? null : null, typed: state.typed + added, correct,
    lastShot: correct > state.correct && target ? target : state.lastShot, lastShotAt: correct > state.correct ? state.elapsed : state.lastShotAt };
  if (!target || input !== target.word) return next;
  const combo = state.combo + 1;
  return { ...next, input: '', locked: null, targets: state.targets.filter(t => t.key !== target.key), hits: state.hits + 1,
    hitCharacters: state.hitCharacters + target.word.length, combo, bestCombo: Math.max(state.bestCombo, combo),
    score: state.score + target.word.length * 10 + Math.min(100, (combo - 1) * 10), lastHit: target, lastHitAt: state.elapsed };
}
