import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || 'all';
    
    // Fetch random words
    const queryArgs: any = {};
    if (level !== 'all') {
      queryArgs.where = { level };
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
