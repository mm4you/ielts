import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;

  const userId = session.user.id;
  const today = new Date();

  const progressList = await prisma.userProgress.findMany({
    where: {
      userId,
      next_review_date: { lte: today },
      repetition_count: { gt: 0 },
      ...(level && level !== 'all' ? { word: { level } } : {})
    },
    orderBy: { next_review_date: 'asc' },
    take: limit,
    include: { word: true },
  });

  let words = progressList.map(p => ({
    ...p.word,
    ease_factor: p.ease_factor,
    interval_days: p.interval_days,
    repetition_count: p.repetition_count,
    next_review_date: p.next_review_date,
  }));

  // Fallback if no words due, just for testing/demo purposes
  if (words.length === 0) {
    const rawWords = await prisma.word.findMany({
      where: {
        ...(level && level !== 'all' ? { level } : {})
      },
      take: limit,
    });
    words = rawWords.map(w => ({
      ...w,
      ease_factor: 2.5,
      interval_days: 0,
      repetition_count: 0,
      next_review_date: today,
    }));
  }

  return NextResponse.json(words);
}