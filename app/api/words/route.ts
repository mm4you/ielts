import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const topic = searchParams.get('topic') || '';
  const level = searchParams.get('level') || '';

  const where: Record<string, string> = {};
  if (search) where.word = { contains: search, mode: 'insensitive' } as unknown as string;
  if (topic) where.topic = topic;
  if (level) where.level = level;

  const limitParam = searchParams.get('limit');
  let limit = 100;
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 100);
    }
  }

  const words = await prisma.word.findMany({
    where,
    orderBy: { word: 'asc' },
    take: limit,
  });

  return NextResponse.json(words);
}