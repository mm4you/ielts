import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
export async function GET(){
 if(!(await auth())?.user?.id)return NextResponse.json({error:'Đăng nhập để chọn bộ từ nhé.'},{status:401});
 try{
  const groups=await prisma.word.groupBy({by:['topic','level'],_count:{_all:true}});
  const topics:Record<string,{topic:string;count:number;levels:Record<string,number>}>={};
  for(const row of groups as {topic:string;level:string;_count:{_all:number}}[]){const topic=topics[row.topic]??={topic:row.topic,count:0,levels:{}};topic.count+=row._count._all;topic.levels[row.level]=(topic.levels[row.level]||0)+row._count._all;}
  return NextResponse.json({total:Object.values(topics).reduce((n,t)=>n+t.count,0),topics:Object.values(topics)},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Chưa tải được các chủ đề. Bạn thử lại nhé.'},{status:503});}
}
