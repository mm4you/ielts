import { practiceAnswers, storedPracticeKey } from './practice-content';
import { Prisma } from '@prisma/client';
import { recordStudy } from './study-server';
import { normalizeAnswer, stagePassed, type PracticeResult } from './study';
import { practiceSourceSchema, StudyError } from './practice-source';
export async function completePractice(tx:Prisma.TransactionClient,userId:string,id:string,submitted:PracticeResult[]){
      const run = await tx.practiceSession.findFirst({ where: { id, userId } });
      if (!run) throw new StudyError('Không tìm thấy lượt chơi.', 404);
      if (run.completedAt) return { results: run.results, saved: true, passed: practiceSourceSchema.parse(run.source).kind === 'stage' && stagePassed(run.wordIds, run.results as PracticeResult[]) };
      if (submitted.some(r=>!run.wordIds.includes(r.wordId)) || new Set(submitted.map(r=>r.wordId)).size !== submitted.length) throw new StudyError('Tập từ không khớp lượt chơi.');
      const words = await tx.word.findMany({ where: { id: { in: run.wordIds } }, include: { contentReview: true } });
      const results: PracticeResult[] = submitted.map(r=>{
        const w = words.find(w=>w.id===r.wordId)!;
        if(!w)throw new StudyError('Một từ trong lượt học đã được cập nhật. Bạn bắt đầu lượt mới nhé.',409);
        const accepted = (storedPracticeKey(run.source)?.[String(w.id)] ?? practiceAnswers(w.word,run.mode,w.contentReview)).map(normalizeAnswer);
        const outcome = r.outcome === 'missed' ? 'missed' : accepted.includes(normalizeAnswer(r.answer)) ? 'correct' : 'wrong';
        const attempts = r.attempts ?? 1;
        return { ...r, outcome, attempts, failedAttempts: outcome === 'correct' || attempts === 0 ? 0 : Math.min(attempts, Math.max(1, r.failedAttempts ?? 1)) };
      });
      const source = practiceSourceSchema.parse(run.source);
      for (const r of results) {
        if (r.attempts === 0) continue;
        const key = { userId, wordId: r.wordId, mode: run.mode };
        if (r.outcome !== 'correct') {
          const errors = r.failedAttempts ?? 1;
          await tx.wordMistake.upsert({ where: { userId_wordId_mode: key }, create: { ...key, wrongCount: errors }, update: { wrongCount: { increment: errors }, lastWrongAt: new Date(), resolvedAt: null } });
        } else if (!r.hinted) {
          await tx.wordMistake.updateMany({ where: key, data: { resolvedAt: new Date() } });
        }
      }
      await recordStudy(tx, userId, results.filter(r=>r.attempts !== 0).map(r=>r.wordId), results.reduce((total,r)=>total+(r.attempts ?? 1),0));
      const passed = source.kind === 'stage' && stagePassed(run.wordIds, results);
      if (source.kind === 'stage') await tx.studyCheckpoint.update({ where: { userId_stageId_mode: { userId, stageId: source.stageId!, mode: run.mode } }, data: { lastSessionId: id, ...(passed ? { completedAt: new Date() } : {}) } });
      await tx.practiceSession.update({ where: { id }, data: { results, completedAt: new Date() } });
      return { results, saved: true, passed };
}
