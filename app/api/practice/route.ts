import { auth } from '@/auth';
import { studyTransaction } from '@/lib/prisma';
import { practiceSourceSchema, selectPracticeWords, StudyError } from '@/lib/practice-source';
import { NextResponse } from 'next/server';
import { z } from 'zod';
const schema = z.object({ mode: z.enum(['typing','word-rain','spelling-bee']), source: practiceSourceSchema });
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Đăng nhập để luyện tập.' }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(()=>null));
  if (!input.success) return NextResponse.json({ error: 'Nguồn từ không hợp lệ.' }, { status: 400 });
  try {
    const result = await studyTransaction(session.user.id, async tx => {
      const { words, excluded, stagePosition } = await selectPracticeWords(tx, session.user!.id!, input.data.mode, input.data.source);
      const practice = await tx.practiceSession.create({ data: { userId: session.user!.id!, mode: input.data.mode, source: {...input.data.source,answerKey:Object.fromEntries(words.map(w=>[String(w.id),[w.word,...w.acceptedAnswers||[]]])),wordsSnapshot:words}, wordIds: words.map(w=>w.id) } });
      if (input.data.source.kind === 'stage') await tx.studyCheckpoint.upsert({ where: { userId_stageId_mode: { userId: session.user!.id!, stageId: input.data.source.stageId!, mode: input.data.mode } }, create: { userId: session.user!.id!, stageId: input.data.source.stageId!, mode: input.data.mode }, update: { updatedAt: new Date() } });
      return { id: practice.id, words, excluded, stagePosition };
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (e) { return NextResponse.json({ error: e instanceof StudyError ? e.message : 'Không tải được từ vựng. Vui lòng thử lại.' }, { status: e instanceof StudyError ? e.status : 503 }); }
}
