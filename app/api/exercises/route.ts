import { auth } from '@/auth';
import { studyTransaction } from '@/lib/prisma';
import { EXERCISE_MODES, publicExercise } from '@/lib/exercises';
import { exerciseSourceSchema, selectExercises } from '@/lib/exercise-source';
import { StudyError } from '@/lib/practice-source';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({ mode: z.enum(EXERCISE_MODES), difficulty: z.enum(['basic','advanced']).default('basic'), source: exerciseSourceSchema });
export async function POST(request: Request) {
  const user = (await auth())?.user;
  if (!user?.id) return NextResponse.json({ error: 'Đăng nhập để luyện cùng bộ từ của bạn.' },{ status:401 });
  const input = schema.safeParse(await request.json().catch(()=>null));
  if (!input.success) return NextResponse.json({ error: 'Bạn kiểm tra lại lựa chọn nhé.' },{ status:400 });
  try {
    const data = await studyTransaction(user.id,async tx=>{
      const snapshots = await selectExercises(tx,user.id!,input.data.mode,input.data.source);
      const run = await tx.exerciseSession.create({ data: { userId:user.id!,mode:input.data.mode,difficulty:input.data.difficulty,source:input.data.source,questionIds:snapshots.map(q=>q.id),snapshots } });
      return { id:run.id,mode:run.mode,difficulty:run.difficulty,questions:snapshots.map(q=>publicExercise(q,run.difficulty)),results:[],completed:false };
    });
    return NextResponse.json(data,{ headers:{'Cache-Control':'private, no-store'} });
  } catch(e) {
    return NextResponse.json({ error:e instanceof StudyError?e.message:'Chưa tải được câu hỏi. Bạn thử lại sau nhé.' },{ status:e instanceof StudyError?e.status:503 });
  }
}
