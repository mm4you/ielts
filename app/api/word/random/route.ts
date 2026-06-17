import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const count = await prisma.word.count();
    
    if (count === 0) {
      return NextResponse.json({ error: 'Database is empty' }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    
    const randomWord = await prisma.word.findFirst({
      skip: skip
    });

    if (!randomWord) {
      return NextResponse.json({ error: 'Failed to fetch random word' }, { status: 500 });
    }

    return NextResponse.json(randomWord);
  } catch (error: any) {
    console.error('Random Word API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
