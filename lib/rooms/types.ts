import type { RoomMode } from './settings';
export type RoomSettings = { level: string; questionCount: number; secondsPerQuestion: number; mode?: RoomMode; durationSeconds?: number; maxPlayers?: number; topic?:string; sourceKind?:'all'|'collection'; collectionId?:string };
export type RoomPlayer = { id: string; name: string; ready: boolean; left: boolean };
export type RoomQuestion = { word: string; choices: string[]; correctIndex: number; prompt?: string; wordId?:number; meaning?:string; ipa?:string|null; example?:string|null };
export type RoomWordAttempt={outcome:'correct'|'wrong'|'missed';answer:string;attempts:number;wrongAttempts:number};
export type RoomAnswer = { choice: number; points: number };
export type RoomState = {
  version: 1; title: string; hostId: string; settings: RoomSettings;
  hostOnly?:boolean; hostName?:string; observers?:{id:string;name:string}[];
  players: RoomPlayer[]; questions: RoomQuestion[]; startedAt: number | null; closed: boolean;
  answers: Record<string, Record<string, RoomAnswer>>;
  games?: Record<string, RoomGameProgress>;
  decks?: number[][];
  roundId?:string; previousRoundId?:string; finishedAt?:number; removedIds?:string[]; sourceLabel?:string;
  learning?:Record<string,Record<string,RoomWordAttempt>>;
  previousRanks?:Record<string,number>; rankRevision?:number;
  lastFinishedRoundId?:string;lastFinishedParticipants?:string[];finishedParticipants?:string[];
};
export type RoomPhase = 'waiting' | 'countdown' | 'question' | 'reveal' | 'finished' | 'closed';
export type RoomView = {
  code: string; title: string; hostId: string; meId: string; settings: RoomSettings;
  hostName?:string; isObserver?:boolean; observers?:{id:string;name:string}[];
  phase: RoomPhase; serverNow: number; nextAt: number | null; questionNumber: number;
  players: (RoomPlayer & { score: number; correct: number; answered: boolean; rank:number; rankDelta:number })[];
  question: { word: string; choices: string[]; correctIndex?: number; myChoice?: number } | null;
  game?: RoomGameView;
  roundId:string; sourceLabel:string; reviewSessionId?:string;
  previousReviewSessionId?:string;
  rankingEvent:string;
};

export type RoomGameProgress = {
  revision: number; cursor: number; score: number; correct: number; combo: number; lives: number;
  changedAt: number; finished: boolean;
  lastResult?: { correct: boolean; answer: string };
  flipped: number[]; matched: number[]; lockUntil: number; moves: number;
  board: number[][]; pieces: number[]; used: number[];
};
export type RoomGameView = {
  revision: number; cursor: number; total: number; score: number; correct: number; combo: number;
  lives: number; finished: boolean; deadline: number; targetDeadline: number | null;
  prompt: string | null; choices: string[]; lastResult?: { correct: boolean; answer: string };
  cards: { index: number; text: string | null; matched: boolean }[];
  moves: number; lockUntil: number; board: number[][]; pieces: (number[][] | null)[];
};
export type RoomGameAction =
  | { action: 'play'; revision: number; kind: 'choice'; choice: number }
  | { action: 'play'; revision: number; kind: 'type'; text: string }
  | { action: 'play'; revision: number; kind: 'flip'; card: number }
  | { action: 'play'; revision: number; kind: 'place'; piece: number; row: number; column: number };
