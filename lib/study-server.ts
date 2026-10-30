import { Prisma } from '@prisma/client';
import { studyDay } from './study';

export async function recordStudy(tx: Prisma.TransactionClient, userId: string, wordIds: number[], practiceCount = wordIds.length) {
  if (!wordIds.length) return;
  const preference = await tx.studyPreference.findUnique({ where: { userId } });
  const date = studyDay(new Date(), preference?.timeZone);
  const unique = [...new Set(wordIds)];
  const added = await tx.studyWordDay.createMany({ data: unique.map(wordId => ({ userId, wordId, date })), skipDuplicates: true });
  await tx.dailyActivity.upsert({ where: { userId_date: { userId, date } },
    create: { userId, date, wordsLearned: added.count, practiceCount },
    update: { wordsLearned: { increment: added.count }, practiceCount: { increment: practiceCount } } });
}
