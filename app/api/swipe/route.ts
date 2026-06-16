import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy ngẫu nhiên 50 từ vựng chưa được đánh giá là "quá dễ" (repetition_count < 5)
  const words = await prisma.word.findMany({
    where: {
      repetition_count: { lt: 5 }
    },
    take: 100,
  });

  // Shuffle and pick 50
  const shuffled = [...words].sort(() => 0.5 - Math.random());
  
  return NextResponse.json(shuffled.slice(0, 50));
}
