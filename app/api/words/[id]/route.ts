import { prisma, studyTransaction } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { calculateSRS } from '@/lib/srs';
import { recordStudy } from '@/lib/study-server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const wordId = Number((await params).id);
  if (!Number.isSafeInteger(wordId) || wordId < 1) return NextResponse.json({ error: 'ID không hợp lệ.' }, { status: 400 });
  const word = await prisma.word.findUnique({ where: { id: wordId } });
  return word ? NextResponse.json(word) : NextResponse.json({ error: 'Không tìm thấy từ.' }, { status: 404 });
}
const schema = z.object({ rating: z.enum(['forgot', 'hard', 'good', 'easy']), requestId: z.uuid() }).strict();
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để lưu tiến độ.' }, { status: 401 });
  const wordId = Number((await params).id);
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!Number.isSafeInteger(wordId) || wordId < 1 || !input.success) return NextResponse.json({ error: 'Đánh giá không hợp lệ.' }, { status: 400 });
  const userId = session.user.id;
  try {
    const result = await studyTransaction(userId, async tx => {
      const previous = await tx.reviewEvent.findUnique({ where: { id: input.data.requestId } });
      if (previous) {
        if (previous.userId !== userId || previous.wordId !== wordId || previous.rating !== input.data.rating) throw new Error('CONFLICT');
        return previous.result;
      }
      if (!await tx.word.findUnique({ where: { id: wordId }, select: { id: true } })) throw new Error('NOT_FOUND');
      const old = await tx.userProgress.findUnique({ where: { userId_wordId: { userId, wordId } } });
      const next = calculateSRS(input.data.rating, old?.ease_factor ?? 2.5, old?.interval_days ?? 0, old?.repetition_count ?? 0);
      const data = { ...next, next_review_date: new Date(Date.now() + next.interval_days * 86400000) };
      const progress = await tx.userProgress.upsert({ where: { userId_wordId: { userId, wordId } }, create: { userId, wordId, ...data }, update: data });
      const response = { ...next, next_review_date: progress.next_review_date.toISOString() };
      await recordStudy(tx, userId, [wordId]);
      await tx.reviewEvent.create({ data: { id: input.data.requestId, userId, wordId, rating: input.data.rating, result: response } });
      return response;
    });
    return NextResponse.json(result);
  } catch (error) {
    const reason = error instanceof Error ? error.message : '';
    return NextResponse.json({ error: reason === 'CONFLICT' ? 'Lượt lưu đã được dùng.' : reason === 'NOT_FOUND' ? 'Không tìm thấy từ.' : 'Chưa lưu được. Vui lòng thử lại.' }, { status: reason === 'CONFLICT' ? 409 : reason === 'NOT_FOUND' ? 404 : 503 });
  }
}
