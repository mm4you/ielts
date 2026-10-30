import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LEVELS, TOPICS } from '@/types';
import { dueProgressWhere } from './srs';
import { shuffle } from './study';
import { StudyError } from './practice-source';
import { exerciseContentSchema, type ExerciseMode, type ExerciseSnapshot, type ExerciseResult } from './exercises';

export const exerciseSourceSchema = z.object({
  kind: z.enum(['all','collection','due','mistakes','replay']).default('all'),
  level: z.enum(['all', ...LEVELS]).default('all'),
  topic: z.enum(['all', ...TOPICS]).default('all'),
  limit: z.union([z.literal(10),z.literal(20)]).default(10),
  collectionId: z.string().min(1).max(100).optional(),
  sessionId: z.string().min(1).max(100).optional(),
  questionIds: z.array(z.string().min(1).max(150)).min(1).max(20).optional(),
});
export type ExerciseSource = z.infer<typeof exerciseSourceSchema>;
export async function selectExercises(tx: Prisma.TransactionClient, userId: string, mode: ExerciseMode, source: ExerciseSource, random = Math.random) {
  const where: Prisma.ExerciseQuestionWhereInput = { mode, status: 'reviewed', reviewedBy: { not: null }, reviewedAt: { not: null } };
  const word: Prisma.WordWhereInput = {};
  if (source.level !== 'all') where.level = source.level;
  if (source.topic !== 'all') where.topic = source.topic;
  let exact: string[] | undefined;
  let previousSnapshots: ExerciseSnapshot[] | undefined;
  if (source.kind === 'collection') {
    if (!source.collectionId || !await tx.collection.findFirst({ where: { id: source.collectionId, OR: [{ userId },{ isPublic: true }] }, select: { id: true } })) throw new StudyError('Không truy cập được bộ từ này.',404);
    word.collections = { some: { collectionId: source.collectionId } };
  } else if (source.kind === 'due') {
    word.progress = { some: dueProgressWhere(userId) };
  } else if (source.kind === 'mistakes') {
    where.mistakes = { some: { userId, resolvedAt: null } };
  } else if (source.kind === 'replay') {
    const run = source.sessionId && await tx.exerciseSession.findFirst({ where: { id: source.sessionId, userId, mode, completedAt: { not: null } } });
    if (!run) throw new StudyError('Không tìm thấy lượt luyện của bạn.',404);
    const eligible = (run.results as ExerciseResult[]).filter(r=>r.outcome==='wrong').map(r=>r.questionId);
    exact = source.questionIds ?? eligible;
    if (!exact.length || new Set(exact).size!==exact.length || exact.some(id=>!eligible.includes(id))) throw new StudyError('Chọn đúng những câu sai trong lượt trước nhé.');
    previousSnapshots = run.snapshots as ExerciseSnapshot[];
    where.id = { in: exact };
    delete where.level; delete where.topic;
  }
  if (Object.keys(word).length) where.word = word;
  const rows = await tx.exerciseQuestion.findMany({ where, orderBy: { id: 'asc' }, take: exact ? exact.length : 1000 });
  const snapshots = rows.flatMap(row=>{
    const content = exerciseContentSchema.safeParse(row.content);
    if (!content.success || content.data.kind!==mode || !row.sourceUrl || !row.usageRights) return [];
    const old = previousSnapshots?.find(q=>q.id===row.id && q.version===row.version);
    if (previousSnapshots && !old) return [];
    return [old ?? { id: row.id, version: row.version, wordId: row.wordId, content: content.data.kind==='spelling-hunt'?content.data:{...content.data,options:shuffle(content.data.options,random)} }];
  });
  if (exact) {
    if (snapshots.length!==exact.length) throw new StudyError('Một câu hỏi đang được cập nhật. Bạn quay lại sau nhé.',409);
    return exact.map(id=>snapshots.find(q=>q.id===id)!);
  }
  if(source.kind==='mistakes'&&snapshots.length)return shuffle(snapshots,random).slice(0,source.limit);
  if (snapshots.length < source.limit) throw new StudyError('Nguồn này hiện có '+snapshots.length+' câu phù hợp. '+(snapshots.length>=10?'Bạn chọn lượt 10 câu để bắt đầu nhé.':'Bạn thử bộ từ hoặc chủ đề khác nhé.'),409);
  return shuffle(snapshots,random).slice(0,source.limit);
}
