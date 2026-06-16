import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy ngẫu nhiên 100 từ vựng chưa từng học (repetition_count === 0)
  const words = await prisma.word.findMany({
    where: {
      repetition_count: 0
    },
    take: 100,
  });

  // Shuffle and pick 50
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  
  return NextResponse.json(shuffled.slice(0, 50));
}
