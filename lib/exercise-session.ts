import type { Prisma } from '@prisma/client';
import { gradeExercise, publicExercise, type ExerciseAnswer, type ExerciseResult, type ExerciseSnapshot } from './exercises';
import { StudyError } from './practice-source';
import { recordStudy } from './study-server';

export async function answerExercise(tx: Prisma.TransactionClient, userId: string, id: string, input: ExerciseAnswer) {
  const run = await tx.exerciseSession.findFirst({ where: { id, userId } });
  if (!run) throw new StudyError('Không tìm thấy lượt luyện.',404);
  const results = run.results as ExerciseResult[];
  const previous = results.find(r=>r.questionId===input.questionId);
  if (previous) {
    if (previous.requestId!==input.requestId || previous.answer!==input.answer || previous.selection!==input.selection) throw new StudyError('Câu này đã được trả lời. Bạn xem phản hồi rồi tiếp tục nhé.',409);
    return { result: previous, completed: !!run.completedAt };
  }
  if (run.completedAt || results.some(r=>r.requestId===input.requestId)) throw new StudyError('Lượt trả lời đã được ghi nhận.',409);
  const snapshots = run.snapshots as ExerciseSnapshot[];
  const question = snapshots[results.length];
  if (!question || question.id!==input.questionId) throw new StudyError('Câu hỏi đã thay đổi. Bạn tải lại lượt luyện nhé.',409);
  const result = gradeExercise(question,input,run.difficulty);
  const key = { userId, questionId: question.id };
  if (result.outcome==='wrong') await tx.exerciseMistake.upsert({ where: { userId_questionId: key }, create: { ...key, wordId:question.wordId, mode:run.mode, wrongCount: 1 }, update: { wrongCount: { increment: 1 }, lastWrongAt: new Date(), resolvedAt: null } });
  else if (result.outcome==='correct') await tx.exerciseMistake.updateMany({ where: key, data: { resolvedAt: new Date() } });
  await recordStudy(tx,userId,[question.wordId]);
  const completed = results.length + 1 === snapshots.length;
  await tx.exerciseSession.update({ where: { id }, data: { results: [...results,result], ...(completed ? { completedAt: new Date() } : {}) } });
  return { result, completed };
}
export function exerciseView(run: { id: string; mode: string; difficulty: string; source:unknown; snapshots: unknown; results: unknown; completedAt: Date|null }) {
  return { id: run.id, mode: run.mode, difficulty: run.difficulty, source:run.source, questions: (run.snapshots as ExerciseSnapshot[]).map(q=>publicExercise(q,run.difficulty)), results: run.results as ExerciseResult[], completed: !!run.completedAt };
}
