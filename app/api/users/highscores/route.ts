import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({
        blockblast: 0,
        speedrun: 0,
        sniper: 0,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        blockblastHighScore: true,
        speedrunHighScore: true,
        sniperHighScore: true,
      },
    });

    return NextResponse.json({
      blockblast: user?.blockblastHighScore ?? 0,
      speedrun: user?.speedrunHighScore ?? 0,
      sniper: user?.sniperHighScore ?? 0,
    });
  } catch (error) {
    console.error('Failed to fetch highscores:', error);
    return NextResponse.json({ error: 'Failed to fetch highscores' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { gameType, score } = body;

    if (!gameType || typeof score !== 'number' || score < 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let updatedHighScore = score;
    let fieldToUpdate = '';

    if (gameType === 'blockblast') {
      fieldToUpdate = 'blockblastHighScore';
      updatedHighScore = Math.max(user.blockblastHighScore, score);
    } else if (gameType === 'speedrun') {
      fieldToUpdate = 'speedrunHighScore';
      updatedHighScore = Math.max(user.speedrunHighScore, score);
    } else if (gameType === 'sniper') {
      fieldToUpdate = 'sniperHighScore';
      updatedHighScore = Math.max(user.sniperHighScore, score);
    } else {
      return NextResponse.json({ error: 'Invalid game type' }, { status: 400 });
    }

    // Only save if it's higher
    if (updatedHighScore > (user as any)[fieldToUpdate]) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          [fieldToUpdate]: updatedHighScore,
        },
      });
    }

    return NextResponse.json({ success: true, highScore: updatedHighScore });
  } catch (error) {
    console.error('Failed to update highscore:', error);
    return NextResponse.json({ error: 'Failed to update highscore' }, { status: 500 });
  }
}
