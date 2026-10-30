import type { Word, Prisma } from '@prisma/client';
import { auth } from '@/auth';
import { prisma } from './prisma';
import { LEVELS, TOPICS } from '@/types';
export class GamePoolError extends Error {constructor(message:string,public status=400){super(message);}}
export async function loadGamePool(request:Request,take:number):Promise<Word[]>{
  const session=await auth();if(!session?.user?.id)throw new GamePoolError('Đăng nhập để chơi cùng bộ từ của bạn.',401);
  const p=new URL(request.url).searchParams,level=p.get('level')||'all',topic=p.get('topic')||'all',collectionId=p.get('collectionId');
  if((level!=='all'&&!LEVELS.some(l=>l===level))||(topic!=='all'&&!TOPICS.some(t=>t===topic)))throw new GamePoolError('Bộ lọc chưa đúng. Bạn chọn lại nhé.');
  if(collectionId&&!await prisma.collection.findFirst({where:{id:collectionId,OR:[{userId:session.user.id},{isPublic:true}]},select:{id:true}}))throw new GamePoolError('Không truy cập được bộ từ này.',404);
  const where:Prisma.WordWhereInput={...(level!=='all'?{level}:{}),...(topic!=='all'?{topic}:{}),...(collectionId?{collections:{some:{collectionId}}}:{})};
  const count=await prisma.word.count({where});
  if(!count)throw new GamePoolError('Chưa có từ phù hợp. Bạn thử bộ lọc khác nhé.',409);
  return prisma.word.findMany({where,orderBy:{id:'asc'},take:Math.min(take,count),skip:Math.max(0,Math.floor(Math.random()*(count-Math.min(take,count)+1)))});
}
