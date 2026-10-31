import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { LEVELS, TOPICS } from '@/types';
import { dueProgressWhere } from './srs';
import { normalizeAnswer, shuffle, type PracticeResult, type PracticeWord } from './study';
import { contentIsReviewed, practiceAnswers, maskPracticeText, reviewedPracticeSense } from './practice-content';
import { parseMeaning } from './parse';

export const practiceSourceSchema = z.object({
  kind: z.enum(['all','collection','due','mistakes','stage','replay']).default('all'),
  collectionId: z.string().min(1).max(100).optional(), stageId: z.string().min(1).max(100).optional(),
  sessionId: z.string().min(1).max(100).optional(), level: z.enum(['all', ...LEVELS]).default('all'),
  topic: z.enum(['all', ...TOPICS]).default('all'), limit: z.number().int().min(1).max(160).default(20),
  replayIds: z.array(z.number().int().positive()).min(1).max(160).optional(),
  mistakeMode:z.literal('rooms').optional(),
});
export class StudyError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function selectPracticeWords(tx: Prisma.TransactionClient, userId: string, mode: string, source: z.infer<typeof practiceSourceSchema>) {
  const where: Prisma.WordWhereInput = { ...(source.level !== 'all' ? { level: source.level } : {}), ...(source.topic !== 'all' ? { topic: source.topic } : {}) };
  let orderedIds: number[] | undefined;let stagePosition=1;
  if (source.kind === 'collection') {
    if (!source.collectionId || !await tx.collection.findFirst({ where: { id: source.collectionId, OR: [{ userId }, { isPublic: true }] }, select: { id: true } })) throw new StudyError('Không truy cập được bộ sưu tập.', 404);
    where.collections = { some: { collectionId: source.collectionId } };
  } else if (source.kind === 'due') {
    where.progress = { some: dueProgressWhere(userId) };
  } else if (source.kind === 'mistakes') {
    where.mistakes = { some: { userId, mode:source.mistakeMode??mode, resolvedAt: null } };
  } else if (source.kind === 'replay') {
    const previous = source.sessionId && await tx.practiceSession.findFirst({ where: { id: source.sessionId, userId, completedAt: { not: null } } });
    if (!previous) throw new StudyError('Không tìm thấy lượt luyện của bạn.', 404);
    const results = previous.results as PracticeResult[];
    const eligible = results.filter(r => r.outcome !== 'correct' || r.hinted || r.corrected).map(r=>r.wordId);
    orderedIds = source.replayIds ?? eligible;
    if (orderedIds.some(id=>!eligible.includes(id))) throw new StudyError('Tập luyện lại không hợp lệ.');
    // Replays preserve the exact selected IDs; level/topic never replace this set.
    delete where.level; delete where.topic;
    where.id = { in: orderedIds };
  } else if (source.kind === 'stage') {
    const stage = source.stageId && await tx.studyStage.findUnique({ where: { id: source.stageId }, include: { words: { orderBy: { position: 'asc' } } } });
    if (!stage) throw new StudyError('Không tìm thấy chặng.', 404);
    const earlier = await tx.studyStage.findMany({ where: { deckId: stage.deckId, position: { lt: stage.position } }, select: { id: true } });
    const done = await tx.studyCheckpoint.count({ where: { userId, mode, stageId: { in: earlier.map(s=>s.id) }, completedAt: { not: null } } });
    if (done !== earlier.length) throw new StudyError('Hoàn thành chặng trước để mở chặng này.', 409);
    stagePosition=stage.position;orderedIds = stage.words.map(w=>w.wordId);
    delete where.level; delete where.topic;
    where.id = { in: orderedIds };
  }
  if (orderedIds?.length === 0) throw new StudyError('Không có từ cần luyện lại.', 409);
  // Filter reviewed content before sampling: a small approved bank must not be
  // lost inside a random 500-row sample of the entire legacy vocabulary.
  if(mode==='word-rain'||source.kind==='stage')where.contentReview={is:{status:'reviewed',sourceUrl:{not:null},reviewedBy:{not:null},reviewedAt:{not:null}}};
  const count = await tx.word.count({ where });
  const take = orderedIds ? orderedIds.length : Math.min(count, 500);
  const skip = orderedIds ? 0 : Math.max(0, Math.floor(Math.random() * (count - take + 1)));
  const rows = await tx.word.findMany({ where, orderBy: { id: 'asc' }, take, skip, include: { contentReview: true } });
  const meanings = rows.map(w=>{const sense=reviewedPracticeSense(w.contentReview);return {row:w,sense,meaning:parseMeaning(sense?sense.definitionEn+' /// '+sense.meaningVi:w.meaning_vi,sense?.pos??w.pos)};});
  const seen = new Set<string>();
  const words: PracticeWord[] = meanings.flatMap(({ row: w, meaning, sense }) => {
    const reviewed=contentIsReviewed(w.contentReview);
    if((source.kind==='stage'||mode==='word-rain') && !reviewed)return [];
    const answer = normalizeAnswer(w.word);
    const vi = meaning.vi || (/[à-ỹđ]/i.test(meaning.en) ? meaning.en : '');
    const pos=sense?.pos??w.pos;
    const label = normalizeAnswer(vi + '|' + (pos || ''));
    const ambiguous = mode === 'word-rain' && meanings.filter(m => normalizeAnswer((m.meaning.vi || m.meaning.en) + '|' + (m.sense?.pos??m.row.pos??'')) === label).length > 1;
    if (!/^[a-z]+(?:[ '-][a-z]+)*$/.test(answer) || answer.length > (mode === 'typing' ? 20 : 40) || seen.has(answer) || (mode === 'word-rain' && (!vi || vi.length>180 || ambiguous || normalizeAnswer(vi).includes(answer)))) return [];
    seen.add(answer);
    const acceptedAnswers=practiceAnswers(w.word,mode,w.contentReview).filter(a=>normalizeAnswer(a)!==answer);
    const example=sense?sense.exampleEn+' /// '+sense.exampleVi:w.example;
    const context=mode==='word-rain'&&example?maskPracticeText(example.split(/\/\/\/|\|\|\|/)[0],[w.word,...acceptedAnswers]):undefined;
    return [{ id: w.id, word: w.word.trim().replace(/\s+/g,' '), meaning: vi || meaning.en, pos, ipa: sense?.ipa??w.ipa, example, acceptedAnswers,context,promptMeaning:maskPracticeText(vi||meaning.en,[w.word,...acceptedAnswers]) }];
  });
  if (orderedIds && words.length !== orderedIds.length) throw new StudyError('Bộ từ này đang được cập nhật. Bạn chọn bộ khác hoặc quay lại sau nhé.', 409);
  const selected = orderedIds ? orderedIds.map(id=>words.find(w=>w.id===id)!) : shuffle(words).slice(0, source.limit);
  if (!selected.length) throw new StudyError('Nguồn đã chọn không có từ đủ điều kiện. Hãy đổi bộ lọc hoặc duyệt nội dung.', 409);
  return { words: selected, stagePosition, excluded: rows.length - words.length };
}
