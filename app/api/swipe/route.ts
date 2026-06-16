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

  const userId = session.user.id;

  // Get words that user has already learned
  const learnedProgress = await prisma.userProgress.findMany({
    where: {
      userId: userId,
      repetition_count: { gt: 0 }
    },
    select: { wordId: true }
  });
  
  const learnedWordIds = learnedProgress.map(p => p.wordId);

  // Get random 100 words not learned yet
  const words = await prisma.word.findMany({
    where: {
      id: { notIn: learnedWordIds },
      ...(level && level !== 'all' ? { level } : {})
    },
    take: 100,
  });

  // Shuffle and pick 50
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  
  return NextResponse.json(shuffled.slice(0, 50));
}
