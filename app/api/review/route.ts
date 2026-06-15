import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const today = new Date();

  const words = await prisma.word.findMany({
    where: {
      next_review_date: { lte: today },
    },
    orderBy: { next_review_date: 'asc' },
    take: 20,
  });

  return NextResponse.json(words);
}