import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { parseMeaning } from '@/lib/parse';
import { normalizeTyping } from '@/lib/typing-game';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để chơi.' }, { status: 401 });
  const level = new URL(request.url).searchParams.get('level') || 'all';
  if (!['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) return NextResponse.json({ error: 'Cấp độ không hợp lệ.' }, { status: 400 });
  try {
    const where = level === 'all' ? {} : { level };
    const total = await prisma.word.count({ where });
    const take = Math.min(160, total);
    const skip = Math.max(0, Math.floor(Math.random() * (total - take + 1)));
    const words: { id: number; word: string; meaning_vi: string }[] = await prisma.word.findMany({ where, take, skip, orderBy: { id: 'asc' }, select: { id: true, word: true, meaning_vi: true } });
    const seen = new Set<string>();
    const pool = words.flatMap(word => {
      const text = normalizeTyping(word.word.trim());
      if (!/^[a-z]+(?:[ '-][a-z]+)*$/.test(text) || text.length < 2 || text.length > 20 || seen.has(text)) return [];
      seen.add(text);
      const meaning = parseMeaning(word.meaning_vi);
      return [{ id: word.id, word: text, meaning: (meaning.vi || meaning.en).slice(0, 140) }];
    });
    if (pool.length < 5) return NextResponse.json({ error: 'Chưa đủ từ ở cấp độ này. Chọn cấp độ khác.' }, { status: 409 });
    return NextResponse.json(pool, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Chưa tải được từ vựng. Vui lòng thử lại.' }, { status: 503 });
  }
}
