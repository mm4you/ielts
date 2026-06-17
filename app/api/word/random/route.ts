import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');

    // Nếu có truyền level, lọc theo level. Nếu không (hoặc level là "ALL"), lấy tất cả
    const whereClause = level && level !== 'ALL' ? { level: level.toUpperCase() } : {};

    const count = await prisma.word.count({ where: whereClause });
    
    if (count === 0) {
      return NextResponse.json({ error: 'Không tìm thấy từ vựng nào ở cấp độ này!' }, { status: 404 });
    }

    const skip = Math.floor(Math.random() * count);
    
    const randomWord = await prisma.word.findFirst({
      where: whereClause,
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
