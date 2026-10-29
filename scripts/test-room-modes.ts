import assert from 'node:assert/strict';
import { answerQuestion, phaseAt, roomView, RoomError } from '../lib/rooms/engine';
import { initializeGames, expireGames, playGame, gameView, ROOM_SHAPES, canPlaceRoomShape } from '../lib/rooms/games';
import type { RoomMode } from '../lib/rooms/settings';
import type { RoomGameAction, RoomState } from '../lib/rooms/types';

function create(mode: RoomMode, count = 10): RoomState {
  const state: RoomState = {
    version: 1, title: mode, hostId: 'a', settings: { mode, level: 'all', questionCount: count, secondsPerQuestion: 10, durationSeconds: 90 },
    players: [{ id: 'a', name: 'A', ready: true, left: false }, { id: 'b', name: 'B', ready: true, left: false }],
    startedAt: 1000, closed: false, answers: {},
    questions: Array.from({ length: count }, (_, i) => ({ word: `word${i}`, prompt: `meaning${i}`, choices: [`wrong${i}a`, `answer${i}`, `wrong${i}b`, `wrong${i}c`], correctIndex: 1 })),
  };
  initializeGames(state);
  state.decks = Array.from({ length: Math.ceil(count / 6) }, (_, batch) => Array.from({ length: Math.min(6, count - batch * 6) * 2 }, (_, i) => i));
  return state;
}
type Move = RoomGameAction extends infer A ? A extends RoomGameAction ? Omit<A, 'action' | 'revision'> : never : never;
function play(state: RoomState, move: Move, now = 2000, id = 'a') {
  playGame(state, id, { ...move, action: 'play', revision: state.games![id].revision } as RoomGameAction, now);
}

for (const mode of ['speedrun', 'match', 'sniper', 'blockblast', 'typing'] as RoomMode[]) {
  const state = create(mode);
  assert.equal(phaseAt(state, 500).phase, 'countdown');
  assert.equal(phaseAt(state, 1000).phase, 'question');
  assert.throws(() => roomView('ABC234', state, 'outsider', 2000), RoomError);
  assert.throws(() => play(state, { kind: 'choice', choice: 1 }, 2000, 'outsider'));
  assert.throws(() => answerQuestion(state, 'a', 0, 1, 2000), RoomError);
  const view = roomView('ABC234', state, 'a', 2000);
  assert.equal(view.question, null);
  assert(!JSON.stringify(view).includes('correctIndex'));
  assert(!JSON.stringify(view).includes('word9'), 'Do not expose future questions');
  assert(!JSON.stringify(view).includes('answer9'), 'Do not expose future answers');
  assert.throws(() => play(state, { kind: 'choice', choice: 1 }, 500), RoomError);
  assert.throws(() => play(state, { kind: 'choice', choice: 1 }, 91000), RoomError);
  assert.equal(expireGames(state, 91000), true);
  assert.equal(phaseAt(state, 91000).phase, 'finished');
  assert.equal(gameView(state, 'a', 91000)!.finished, true);
}

const speedrun = create('speedrun');
play(speedrun, { kind: 'choice', choice: 1 });
assert.equal(speedrun.games!.a.score, 100);
assert.equal(speedrun.games!.a.cursor, 1);
assert.equal(speedrun.games!.b.cursor, 0, 'Players advance independently');
assert.throws(() => playGame(speedrun, 'a', { action: 'play', revision: 0, kind: 'choice', choice: 1 }, 2100), RoomError);
play(speedrun, { kind: 'choice', choice: 1 }, 2200);
assert.equal(speedrun.games!.a.score, 210);
play(speedrun, { kind: 'choice', choice: 0 }, 2300);
assert.equal(speedrun.games!.a.combo, 0);
assert.throws(() => play(speedrun, { kind: 'choice', choice: -1 }), RoomError);
assert.throws(() => play(speedrun, { kind: 'type', text: 'word3' }), RoomError);
assert.equal(roomView('ABC234', speedrun, 'b', 2400).players.find(p => p.id === 'a')!.score, 210);

const typing = create('typing');
assert.throws(() => play(typing, { kind: 'type', text: 'wrong' }), RoomError);
assert.equal(typing.games!.a.revision, 0, 'Invalid words cannot advance a player');
play(typing, { kind: 'type', text: 'WORD0' });
assert.equal(typing.games!.a.cursor, 1);
expireGames(typing, 32000);
assert.equal(typing.games!.a.lives, 0);
assert.equal(typing.games!.a.finished, true);
assert.equal(phaseAt(typing, 32000).phase, 'finished', 'Everyone has exhausted three targets');
assert.equal(gameView(typing, 'a', 32000)!.prompt, null);

const sniper = create('sniper');
assert.equal(gameView(sniper, 'a', 2000)!.prompt, 'meaning0');
play(sniper, { kind: 'choice', choice: 0 });
assert.equal(sniper.games!.a.lives, 2);
play(sniper, { kind: 'choice', choice: 1 }, 2100);
assert.equal(sniper.games!.a.correct, 1);
assert.equal(sniper.games!.a.lives, 2);

const match = create('match', 10);
assert(gameView(match, 'a', 2000)!.cards.every(card => card.text === null));
play(match, { kind: 'flip', card: 0 });
assert.equal(gameView(match, 'a', 2000)!.cards[0].text, 'word0');
assert.equal(gameView(match, 'b', 2000)!.cards[0].text, null, 'An opponent cannot see your flipped cards');
play(match, { kind: 'flip', card: 3 }, 2100);
assert.throws(() => play(match, { kind: 'flip', card: 1 }, 2200), RoomError);
assert.equal(gameView(match, 'a', 3100)!.cards[0].text, null);
for (let pair = 0; pair < 6; pair++) {
  play(match, { kind: 'flip', card: pair * 2 }, 4000 + pair * 200);
  play(match, { kind: 'flip', card: pair * 2 + 1 }, 4100 + pair * 200);
}
assert.equal(match.games!.a.cursor, 6);
assert.equal(gameView(match, 'a', 6000)!.cards.length, 8);
for (let pair = 0; pair < 4; pair++) {
  play(match, { kind: 'flip', card: pair * 2 }, 6000 + pair * 200);
  play(match, { kind: 'flip', card: pair * 2 + 1 }, 6100 + pair * 200);
}
assert.equal(match.games!.a.correct, 10);
assert.equal(match.games!.a.finished, true);
assert.equal(phaseAt(match, 8000).phase, 'question', 'Other players can finish their own boards');

const blocks = create('blockblast');
assert.throws(() => play(blocks, { kind: 'choice', choice: 1 }), RoomError);
play(blocks, { kind: 'place', piece: 0, row: 0, column: 0 });
assert.equal(blocks.games!.a.score, 5);
assert.throws(() => play(blocks, { kind: 'place', piece: 0, row: 1, column: 1 }), RoomError);
assert.throws(() => play(blocks, { kind: 'place', piece: 1, row: 0, column: 0 }), RoomError);
assert.throws(() => play(blocks, { kind: 'place', piece: 1, row: 0, column: 8 }), RoomError);
play(blocks, { kind: 'place', piece: 1, row: 1, column: 0 });
play(blocks, { kind: 'place', piece: 2, row: 2, column: 0 });
assert.equal(gameView(blocks, 'a', 2000)!.pieces.filter(Boolean).length, 0);
assert.equal(gameView(blocks, 'a', 2000)!.choices.length, 4);
play(blocks, { kind: 'choice', choice: 0 });
assert.equal(blocks.games!.a.board.flat().filter(cell => cell === 2).length, 1);
assert.equal(blocks.games!.a.cursor, 1);
assert.equal(gameView(blocks, 'a', 2000)!.choices.length, 0);
const line = create('blockblast');
line.games!.a.board[0] = [1,1,1,1,1,1,1,0];
play(line, { kind: 'place', piece: 0, row: 0, column: 7 });
assert(line.games!.a.board[0].every(cell => cell === 0));
assert.equal(line.games!.a.score, 105);
assert(!canPlaceRoomShape(line.games!.a.board, ROOM_SHAPES[5], 7, 7));

const legacy = create('quiz');
delete legacy.settings.mode;
answerQuestion(legacy, 'a', 0, 1, 2000);
assert(legacy.answers[0].a.points > 0, 'Existing rooms keep their quiz behavior');
console.log('Room modes: five games, private views, independent progress, revision replay guards, deadlines, lives, matching and block placement passed.');
