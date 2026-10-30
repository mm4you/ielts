import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để xem lộ trình.' }, { status: 401 });
  try {
    const decks = await prisma.studyDeck.findMany({ orderBy: [{ topic: 'asc' }, { version: 'desc' }], include: { stages: { orderBy: { position: 'asc' }, include: { _count: { select: { words: true } }, checkpoints: { where: { userId: session.user.id } } } } } });
    return NextResponse.json(decks, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Chưa tải được bộ từ. Bạn thử lại sau nhé.' }, { status: 503 }); }
}
