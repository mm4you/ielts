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

    const words = await prisma.word.findMany(queryArgs);
    
    if (!words || words.length < 6) {
      return NextResponse.json({ error: 'Not enough words to play match game' }, { status: 404 });
    }

    // Shuffle words to pick 6
    const shuffledWords = words.sort(() => 0.5 - Math.random()).slice(0, 6);
    
    return NextResponse.json(shuffledWords);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words for match game' }, { status: 500 });
  }
}
