export type RoomSettings = { level: string; questionCount: number; secondsPerQuestion: number };
export type RoomPlayer = { id: string; name: string; ready: boolean; left: boolean };
export type RoomQuestion = { word: string; choices: string[]; correctIndex: number };
export type RoomAnswer = { choice: number; points: number };
export type RoomState = {
  version: 1; title: string; hostId: string; settings: RoomSettings;
  players: RoomPlayer[]; questions: RoomQuestion[]; startedAt: number | null; closed: boolean;
  answers: Record<string, Record<string, RoomAnswer>>;
};
export type RoomPhase = 'waiting' | 'countdown' | 'question' | 'reveal' | 'finished' | 'closed';
export type RoomView = {
  code: string; title: string; hostId: string; meId: string; settings: RoomSettings;
  phase: RoomPhase; serverNow: number; nextAt: number | null; questionNumber: number;
  players: (RoomPlayer & { score: number; correct: number; answered: boolean })[];
  question: { word: string; choices: string[]; correctIndex?: number; myChoice?: number } | null;
};
