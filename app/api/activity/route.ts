import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incrementBy = 1 } = await request.json().catch(() => ({ incrementBy: 1 }));
    const userId = session.user.id;

    // Normalize date to YYYY-MM-DD string to avoid timezone shifts affecting unique constraint
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activity = await prisma.dailyActivity.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
      update: {
        wordsLearned: { increment: incrementBy },
      },
      create: {
        userId: userId,
        date: today,
        wordsLearned: incrementBy,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Failed to log activity:', error);
    return NextResponse.json({ error: 'Failed to log activity' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await prisma.dailyActivity.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
