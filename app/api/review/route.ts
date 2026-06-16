import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date();

  let words = await prisma.word.findMany({
    where: {
      next_review_date: { lte: today },
    },
    orderBy: { next_review_date: 'asc' },
    take: 50,
  });

  // Fallback if no words due, just for testing/demo purposes
  if (words.length === 0) {
    words = await prisma.word.findMany({
      orderBy: { next_review_date: 'asc' },
      take: 20,
    });
  }

  return NextResponse.json(words);
}