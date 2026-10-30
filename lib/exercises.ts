import { z } from 'zod';
import { normalizeAnswer } from './study';

export const EXERCISE_MODES = ['collocations', 'context', 'spelling-hunt'] as const;
export type ExerciseMode = typeof EXERCISE_MODES[number];
export const EXERCISE_INFO = {
  collocations: { name: 'Ghép cụm từ', description: 'Tìm những từ thường đi cùng nhau' },
  context: { name: 'Điền từ theo ngữ cảnh', description: 'Hiểu câu chuyện, chọn đúng từ' },
  'spelling-hunt': { name: 'Săn lỗi chính tả', description: 'Tìm một từ viết sai và sửa lại' },
} as const;

const text = z.string().trim().min(1).max(1500);
const answer = z.string().trim().min(1).max(100);
const shared = {
  answer: answer,
  acceptedAnswers: z.array(answer).min(1).max(30),
  meaningVi: text,
  explanation: text,
  exampleEn: text,
  exampleVi: text,
};
const cloze = {
  ...shared,
  prompt: text,
  options: z.array(answer).length(4),
  rejectedAnswers: z.array(answer).max(30).default([]),
};
export const exerciseContentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('collocations'), ...cloze, fullPhrase: text }),
  z.object({ kind: z.literal('context'), ...cloze, fullSentence: text }),
  z.object({ kind: z.literal('spelling-hunt'), ...shared, sentence: text, typo: answer, errorStart: z.number().int().nonnegative(), errorType: z.literal('spelling') }),
]).superRefine((q, ctx) => {
  const accepted = q.acceptedAnswers.map(normalizeAnswer);
  if (!accepted.includes(normalizeAnswer(q.answer))) ctx.addIssue({ code: 'custom', message: 'The model answer must be explicitly accepted.' });
  if (q.kind !== 'spelling-hunt') {
    if (q.prompt.split('___').length !== 2 || q.prompt.match(/_+/g)?.length!==1 || q.prompt.match(/_+/)?.[0]!=='___') ctx.addIssue({ code: 'custom', message: 'Exactly one blank is required.' });
    const options = q.options.map(normalizeAnswer);
    if (new Set(options).size !== 4 || !options.some(o => accepted.includes(o))) ctx.addIssue({ code: 'custom', message: 'Four distinct options must contain an accepted answer.' });
    if (q.rejectedAnswers.some(a => accepted.includes(normalizeAnswer(a)))) ctx.addIssue({ code: 'custom', message: 'Accepted and rejected answers cannot overlap.' });
  } else {
    if (q.sentence.slice(q.errorStart, q.errorStart + q.typo.length) !== q.typo) ctx.addIssue({ code: 'custom', message: 'The identified typo must match the sentence.' });
    if (!sentenceWords(q.sentence).some(t => t.start === q.errorStart && t.text === q.typo)) ctx.addIssue({ code: 'custom', message: 'The typo must identify one complete word.' });
    if (![q.typo,q.answer,...q.acceptedAnswers].every(w=>/^[a-z]+(?:['’][a-z]+)*$/i.test(w))) ctx.addIssue({code:'custom',message:'Spelling questions correct a single word only.'});
    if (sentenceWords(q.sentence).filter(w=>normalizeAnswer(w.text)===normalizeAnswer(q.typo)).length!==1) ctx.addIssue({code:'custom',message:'Only one occurrence of the identified spelling error is allowed.'});
    const grammarGroups=[["its","it's"],["your","you're"],["their","there","they're"],["than","then"],["to","too","two"],["whose","who's"]];
    if(grammarGroups.some(g=>g.includes(normalizeAnswer(q.typo))&&g.includes(normalizeAnswer(q.answer))))ctx.addIssue({code:'custom',message:'Grammar or homophone choice is outside spelling-only practice.'});
    if (sameRegionalSpelling(q.typo, q.answer) || accepted.includes(normalizeAnswer(q.typo))) ctx.addIssue({ code: 'custom', message: 'A legitimate spelling variant cannot be a spelling error.' });
  }
});
export type ExerciseContent = z.infer<typeof exerciseContentSchema>;
export type ExerciseSnapshot = { id: string; version: number; wordId: number; content: ExerciseContent };
export type SentenceWord = { text: string; start: number; end: number };
export function sentenceWords(sentence: string): SentenceWord[] {
  return [...sentence.matchAll(/[A-Za-z]+(?:['’][A-Za-z]+)*/g)].map(m => ({ text: m[0], start: m.index!, end: m.index! + m[0].length }));
}
const REGIONAL_GROUPS = [
  ['colour', 'color'], ['colours', 'colors'], ['favourite', 'favorite'], ['centre', 'center'],
  ['organise', 'organize'], ['organised', 'organized'], ['organising', 'organizing'],
  ['behaviour', 'behavior'], ['labour', 'labor'], ['travelling', 'traveling'], ['travelled', 'traveled'],
  ['analyse', 'analyze'], ['analysed', 'analyzed'], ['programme', 'program'], ['defence', 'defense'],
  ['licence', 'license'], ['grey', 'gray'], ['theatre', 'theater'], ['neighbour', 'neighbor'],
];
export function sameRegionalSpelling(a: string, b: string) {
  const left = normalizeAnswer(a), right = normalizeAnswer(b);
  return left === right || REGIONAL_GROUPS.some(g => g.includes(left) && g.includes(right));
}
export type PublicExercise = { id: string; kind: ExerciseMode; prompt: string; options?: string[]; words?: SentenceWord[]; clueVi?: string };
export function publicExercise(q: ExerciseSnapshot, difficulty: string): PublicExercise {
  const c = q.content;
  if (c.kind === 'spelling-hunt') return { id: q.id, kind: c.kind, prompt: c.sentence, words: sentenceWords(c.sentence) };
  return { id: q.id, kind: c.kind, prompt: c.prompt, options: c.kind === 'collocations' || difficulty === 'basic' ? c.options : undefined, clueVi: c.kind === 'context' ? c.meaningVi : undefined };
}
export type ExerciseAnswer = { questionId: string; requestId: string; answer: string; selection?: number };
export type ExerciseResult = ExerciseAnswer & {
  wordId: number; outcome: 'correct'|'wrong'|'review'; correctAnswer: string;
  completedText: string; meaningVi: string; explanation: string; exampleEn: string; exampleVi: string;
  typo?: string; errorStart?: number;
};
export function gradeExercise(q: ExerciseSnapshot, input: ExerciseAnswer, difficulty: string): ExerciseResult {
  const c = q.content, normalized = normalizeAnswer(input.answer);
  const accepted = c.acceptedAnswers.some(a => normalizeAnswer(a) === normalized);
  let outcome: ExerciseResult['outcome'] = accepted ? 'correct' : 'wrong';
  if (c.kind === 'spelling-hunt') {
    const chosen = sentenceWords(c.sentence)[input.selection ?? -1];
    if (chosen?.start !== c.errorStart) outcome = 'wrong';
  } else if (c.kind === 'context' && difficulty === 'advanced' && !accepted && !c.rejectedAnswers.some(a => normalizeAnswer(a) === normalized) && !c.options.some(a => normalizeAnswer(a) === normalized)) {
    // An unreviewed alternative is not evidence of an incorrect contextual answer.
    outcome = 'review';
  }
  const displayedAnswer = outcome==='correct' ? c.acceptedAnswers.find(a=>normalizeAnswer(a)===normalized)! : c.answer;
  return {
    ...input, wordId: q.wordId, outcome, correctAnswer: displayedAnswer,
    completedText: c.kind === 'spelling-hunt' ? c.sentence.slice(0, c.errorStart) + displayedAnswer + c.sentence.slice(c.errorStart + c.typo.length) : outcome==='correct' ? c.prompt.replace('___',displayedAnswer) : c.kind === 'context' ? c.fullSentence : c.fullPhrase,
    meaningVi: c.meaningVi, explanation: c.explanation, exampleEn: c.exampleEn, exampleVi: c.exampleVi,
    ...(c.kind === 'spelling-hunt' ? { typo: c.typo, errorStart: c.errorStart } : {}),
  };
}
export function spellingDifference(before: string, after: string) {
  let prefix = 0, suffix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix++;
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - suffix - 1] === after[after.length - suffix - 1]) suffix++;
  return { prefix: after.slice(0, prefix), removed: before.slice(prefix, before.length - suffix), added: after.slice(prefix, after.length - suffix), suffix: suffix ? after.slice(-suffix) : '' };
}
