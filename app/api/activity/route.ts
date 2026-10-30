import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
// Activity is now recorded atomically with a review or completed practice session.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ error: 'Lưu hoạt động cùng kết quả lượt học.' }, { status: 410 });
}
export async function GET() {
  const session=await auth();
  if(!session?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});
  try {
    return NextResponse.json(await prisma.dailyActivity.findMany({where:{userId:session.user.id},orderBy:{date:'asc'}}));
  } catch {return NextResponse.json({error:'Chưa tải được lịch sử học.'},{status:503});}
}
