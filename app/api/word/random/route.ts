import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, studyTransaction } from '@/lib/prisma';
import { auth } from '@/auth';
import { reviewedPracticeSense } from '@/lib/practice-content';
export async function GET(request:Request){
 try{
  const query=new URL(request.url).searchParams,level=query.get('level')?.toUpperCase(),collectionId=query.get('collectionId');
  if(level&& !['ALL','A1','A2','B1','B2','C1','C2'].includes(level))return NextResponse.json({error:'Cấp độ không hợp lệ.'},{status:400});
  const userId=collectionId?(await auth())?.user?.id:undefined;
  if(collectionId&&!userId)return NextResponse.json({error:'Bạn cần đăng nhập.'},{status:401});
  const where:Prisma.WordWhereInput=level&&level!=='ALL'?{level}:{};
  const select=async(tx:Prisma.TransactionClient)=>{
   if(collectionId){
    const allowed=await tx.collection.findFirst({where:{id:collectionId,OR:[{userId:userId!},{isPublic:true}]},select:{id:true}});
    if(!allowed)return NextResponse.json({error:'Không truy cập được bộ sưu tập.'},{status:404});
    where.collections={some:{collectionId}};
   }
   const count=await tx.word.count({where});
   if(!count)return NextResponse.json({error:'Chưa có từ phù hợp với bộ sưu tập và cấp độ này. Bạn thử chọn cấp độ khác nhé.'},{status:404});
   const word=await tx.word.findFirst({where,orderBy:{id:'asc'},skip:Math.floor(Math.random()*count),include:{contentReview:true}});
   if(!word)return NextResponse.json({error:'Chưa tải được từ vựng.'},{status:404});
   const sense=reviewedPracticeSense(word.contentReview);
   const {contentReview: _review,...publicWord}=word;
   void _review;
   return NextResponse.json({...publicWord,...(sense?{meaning_vi:sense.meaningVi,ipa:sense.ipa??word.ipa,example:sense.exampleEn+(sense.exampleVi?' /// '+sense.exampleVi:'')}: {})});
  };
  if(collectionId)return await studyTransaction(userId!,select);
  return await select(prisma);
 }catch{return NextResponse.json({error:'Không thể tải từ. Bạn thử lại nhé.'},{status:500});}
}
