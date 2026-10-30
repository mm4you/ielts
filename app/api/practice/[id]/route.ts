import { auth } from '@/auth';
import { prisma, studyTransaction } from '@/lib/prisma';
import { completePractice } from '@/lib/practice-results';
import { StudyError } from '@/lib/practice-source';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseMeaning } from '@/lib/parse';
import type { Word } from '@prisma/client';
const schema = z.object({ results: z.array(z.object({ wordId: z.number().int().positive(), answer: z.string().max(100), outcome: z.enum(['correct','wrong','missed']), hinted: z.boolean(), corrected: z.boolean(), attempts: z.number().int().min(0).max(1000).optional(), failedAttempts: z.number().int().min(0).max(1000).optional() }).refine(r=>(r.attempts !== 0 || r.outcome==='missed') && (r.failedAttempts??0)<=(r.attempts??1))).max(160) });
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để xem kết quả.' }, { status: 401 });
  try {
    const run = await prisma.practiceSession.findFirst({ where: { id: (await params).id, userId: session.user.id, completedAt: { not: null } } });
    if (!run) return NextResponse.json({ error: 'Không tìm thấy kết quả.' }, { status: 404 });
    const snapshot = z.object({ wordsSnapshot: z.array(z.object({ id: z.number(), word: z.string(), meaning: z.string(), pos: z.string().nullable(), ipa: z.string().nullable(), example: z.string().nullable() }).passthrough()) }).safeParse(run.source);
    const words = snapshot.success ? snapshot.data.wordsSnapshot : (await prisma.word.findMany({ where: { id: { in: run.wordIds } } })).map((w:Word)=>({...w,meaning:parseMeaning(w.meaning_vi,w.pos).vi||parseMeaning(w.meaning_vi,w.pos).en}));
    return NextResponse.json({ ...run, words }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ error: 'Chưa tải được lịch sử.' }, { status: 503 }); }
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để lưu kết quả.' }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(()=>null));
  if (!input.success) return NextResponse.json({ error: 'Kết quả không hợp lệ.' }, { status: 400 });
  const id = (await params).id, userId = session.user.id;
  try {
    const result = await studyTransaction(userId, async tx => {
      return completePractice(tx,userId,id,input.data.results);
    });
    return NextResponse.json(result);
  } catch (e) { return NextResponse.json({ error: e instanceof StudyError ? e.message : 'Chưa lưu kết quả. Hãy thử lại.' }, { status: e instanceof StudyError ? e.status : 503 }); }
}
