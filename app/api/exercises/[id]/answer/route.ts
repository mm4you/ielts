import { auth } from '@/auth';
import { studyTransaction } from '@/lib/prisma';
import { answerExercise } from '@/lib/exercise-session';
import { StudyError } from '@/lib/practice-source';
import { NextResponse } from 'next/server';
import { z } from 'zod';
const schema=z.object({questionId:z.string().min(1).max(150),requestId:z.uuid(),answer:z.string().trim().min(1).max(100),selection:z.number().int().min(0).max(1000).optional()}).strict();
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  const user=(await auth())?.user;
  if(!user?.id)return NextResponse.json({error:'Đăng nhập để lưu câu trả lời.'},{status:401});
  const input=schema.safeParse(await request.json().catch(()=>null));
  if(!input.success)return NextResponse.json({error:'Bạn nhập câu trả lời rồi thử lại nhé.'},{status:400});
  try {
    const id=(await params).id;
    return NextResponse.json(await studyTransaction(user.id,tx=>answerExercise(tx,user.id!,id,input.data)));
  } catch(e) {
    return NextResponse.json({error:e instanceof StudyError?e.message:'Chưa lưu được câu trả lời. Bạn thử gửi lại nhé.'},{status:e instanceof StudyError?e.status:503});
  }
}
