import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dueProgressWhere } from '@/lib/srs';
import { LEVELS } from '@/types';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để ôn tập.' }, { status: 401 });
  const p = new URL(request.url).searchParams;
  const level = p.get('level') || 'all', collectionId = p.get('collectionId');
  const limit = Number(p.get('limit') || 50);
  if (!Number.isInteger(limit) || limit < 1 || limit > 200 || (level !== 'all' && !LEVELS.some(l => l === level))) return NextResponse.json({ error: 'Bộ lọc không hợp lệ.' }, { status: 400 });
  try {
    if (collectionId && !await prisma.collection.findFirst({ where: { id: collectionId, OR: [{ userId: session.user.id }, { isPublic: true }] }, select: { id: true } })) return NextResponse.json({ error: 'Không truy cập được bộ sưu tập.' }, { status: 404 });
    const wordFilter = { ...(level !== 'all' ? { level } : {}), ...(collectionId ? { collections: { some: { collectionId } } } : {}) };
    if (p.get('source') === 'new') {
      const words = await prisma.word.findMany({ where: { ...wordFilter, progress: { none: { userId: session.user.id } } }, take: limit, orderBy: { id: 'asc' } });
      return NextResponse.json(words.map((w: { id: number }) => ({ ...w, ease_factor: 2.5, interval_days: 0, repetition_count: 0 })));
    }
    const rows = await prisma.userProgress.findMany({ where: { ...dueProgressWhere(session.user.id), word: wordFilter }, orderBy: { next_review_date: 'asc' }, take: limit, include: { word: true } });
    return NextResponse.json(rows.map((p: { word: object; ease_factor: number; interval_days: number; repetition_count: number; next_review_date: Date }) => ({ ...p.word, ease_factor: p.ease_factor, interval_days: p.interval_days, repetition_count: p.repetition_count, next_review_date: p.next_review_date })), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Không tải được thẻ. Vui lòng thử lại.' }, { status: 503 }); }
}
