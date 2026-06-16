import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const word = await prisma.word.findUnique({
    where: { id: parseInt(id) },
  });

  if (!word) {
    return NextResponse.json({ error: 'Word not found' }, { status: 404 });
  }

  return NextResponse.json(word);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const wordId = parseInt(id);
  const body = await request.json();

  const progress = await prisma.userProgress.upsert({
    where: {
      userId_wordId: {
        userId: session.user.id,
        wordId: wordId,
      }
    },
    update: {
      ease_factor: body.ease_factor,
      interval_days: body.interval_days,
      repetition_count: body.repetition_count,
      next_review_date: body.next_review_date ? new Date(body.next_review_date) : undefined,
    },
    create: {
      userId: session.user.id,
      wordId: wordId,
      ease_factor: body.ease_factor ?? 2.5,
      interval_days: body.interval_days ?? 0,
      repetition_count: body.repetition_count ?? 0,
      next_review_date: body.next_review_date ? new Date(body.next_review_date) : new Date(),
    }
  });

  return NextResponse.json(progress);
}