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

    const totalCount = await prisma.word.count({
      where: queryArgs.where
    });

    if (totalCount < 6) {
      return NextResponse.json({ error: 'Not enough words to play match game' }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * (totalCount - 6 + 1));

    const words = await prisma.word.findMany({
      where: queryArgs.where,
      skip: skip,
      take: 6
    });

    // Shuffle words to pick 6 randomly ordered
    const shuffledWords = words.sort(() => 0.5 - Math.random());
    
    return NextResponse.json(shuffledWords);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch words for match game' }, { status: 500 });
  }
}
