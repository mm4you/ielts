import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const topic = searchParams.get('topic') || '';
  const level = searchParams.get('level') || '';

  const where: any = {};
  if (search) where.word = { contains: search, mode: 'insensitive' };
  if (topic) where.topic = topic;
  if (level) where.level = level;

  // Pagination parameters
  const pageParam = searchParams.get('page');
  const limitParam = searchParams.get('limit');

  let page = 1;
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  let limit = 30; // Default limit 30
  if (limitParam) {
    const parsedLimit = parseInt(limitParam, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 100); // Max limit 100
    }
  }

  const skip = (page - 1) * limit;

  // Run total count query and items query in parallel
  const [totalCount, words] = await Promise.all([
    prisma.word.count({ where }),
    prisma.word.findMany({
      where,
      orderBy: { word: 'asc' },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return NextResponse.json({
    words,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
  });
}