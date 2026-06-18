import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    
    const collectionId = searchParams.get('collectionId');
    
    // Fetch random words
    const queryArgs: any = { where: {} };
    if (level !== 'all') {
      queryArgs.where.level = level;
    }
    if (collectionId) {
      queryArgs.where.collections = {
        some: { collectionId }
      };
    }

    const allWords = await prisma.word.findMany({
      where: queryArgs.where,
      select: { id: true }
    });

    if (allWords.length < 6) {
      return NextResponse.json({ error: 'Not enough words to play match game' }, { status: 404 });
    }

    const take = 6;
    const shuffledIds = allWords.map(w => w.id).sort(() => 0.5 - Math.random()).slice(0, take);

    const words = await prisma.word.findMany({
      where: {
        id: { in: shuffledIds }
      }
    });

    // Shuffle words to pick 6
    const shuffledWords = words.sort(() => 0.5 - Math.random());
    
    return NextResponse.json(shuffledWords);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words for match game' }, { status: 500 });
  }
}
