export const DEFAULT_STUDY_TIMEZONE = 'Asia/Ho_Chi_Minh';
export function studyDay(now = new Date(), timeZone = DEFAULT_STUDY_TIMEZONE) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  return new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00.000Z`);
}
export function normalizeAnswer(value: string) {
  return value.normalize('NFC').toLowerCase().replace(/[‘’ʼ]/g, "'").trim().replace(/\s+/g, ' ');
}
export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function stagePassed(ids: number[], results: { wordId: number; outcome: string; hinted: boolean }[]) {
  return ids.length > 0 && ids.every(id => results.some(r => r.wordId === id && r.outcome === 'correct' && !r.hinted));
}
export type PracticeWord = { id: number; word: string; meaning: string; pos: string | null; ipa: string | null; example: string | null; acceptedAnswers?: string[]; context?:string; promptMeaning?:string };
export type PracticeResult = { wordId: number; answer: string; outcome: 'correct' | 'wrong' | 'missed'; hinted: boolean; corrected: boolean; attempts?: number; failedAttempts?: number };
export type PracticeSource = { kind: 'all' | 'collection' | 'due' | 'mistakes' | 'stage' | 'replay'; collectionId?: string; stageId?: string; sessionId?: string; replayIds?: number[]; level?: string; topic?: string; limit?: number; mistakeMode?:'rooms' };
