import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const words = await prisma.word.findMany({ take: 5 });
    return NextResponse.json(words);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
