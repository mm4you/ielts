import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { exerciseView } from '@/lib/exercise-session';
import { NextResponse } from 'next/server';
export async function GET(_request: Request,{ params }:{params:Promise<{id:string}>}) {
  const user=(await auth())?.user;
  if(!user?.id)return NextResponse.json({error:'Đăng nhập để xem lượt luyện.'},{status:401});
  try {
    const run=await prisma.exerciseSession.findFirst({where:{id:(await params).id,userId:user.id}});
    if(!run)return NextResponse.json({error:'Không tìm thấy lượt luyện của bạn.'},{status:404});
    return NextResponse.json(exerciseView(run),{headers:{'Cache-Control':'private, no-store'}});
  } catch { return NextResponse.json({error:'Chưa tải được lượt luyện. Bạn thử lại nhé.'},{status:503}); }
}
