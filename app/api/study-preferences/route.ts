import { auth } from '@/auth';
import { prisma, studyTransaction } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DEFAULT_STUDY_TIMEZONE } from '@/lib/study';
const schema=z.object({timeZone:z.string().max(100).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}})});
export async function GET(){const s=await auth();if(!s?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});try{return NextResponse.json(await prisma.studyPreference.findUnique({where:{userId:s.user.id}})||{timeZone:DEFAULT_STUDY_TIMEZONE});}catch{return NextResponse.json({error:'Chưa tải được múi giờ.'},{status:503});}}
export async function PUT(req:Request){const s=await auth();if(!s?.user?.id)return NextResponse.json({error:'Unauthorized'},{status:401});const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:'Múi giờ không hợp lệ.'},{status:400});try{const result=await studyTransaction(s.user.id,tx=>tx.studyPreference.upsert({where:{userId:s.user!.id!},create:{userId:s.user!.id!,timeZone:parsed.data.timeZone},update:{timeZone:parsed.data.timeZone}}));return NextResponse.json(result);}catch{return NextResponse.json({error:'Chưa lưu được múi giờ.'},{status:503});}}
