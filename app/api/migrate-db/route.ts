import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const words = await prisma.word.findMany({ take: 5 });
    return NextResponse.json(words);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
