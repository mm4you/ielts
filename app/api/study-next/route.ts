import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { dueProgressWhere } from '@/lib/srs';
import { NextResponse } from 'next/server';
export async function GET(){
  const session=await auth();if(!session?.user?.id)return NextResponse.json({error:'Đăng nhập để xem đề xuất.'},{status:401});
  const userId=session.user.id;
  const [due,mistakes,checkpoint,exerciseMistakes]=await Promise.allSettled([
    prisma.userProgress.count({where:dueProgressWhere(userId)}),
    prisma.wordMistake.groupBy({by:['wordId'],where:{userId,resolvedAt:null}}),
    prisma.studyCheckpoint.findMany({where:{userId},orderBy:{updatedAt:'desc'},take:50,include:{stage:{include:{deck:true}}}}),
    prisma.exerciseMistake.groupBy({by:['wordId'],where:{userId,resolvedAt:null}}),
  ]);
  let continuation=null;
  if(checkpoint.status==='fulfilled')for(const cp of checkpoint.value){
    try{
      const stage=cp.completedAt?await prisma.studyStage.findFirst({where:{deckId:cp.stage.deckId,position:{gt:cp.stage.position},checkpoints:{none:{userId,mode:cp.mode,completedAt:{not:null}}}},orderBy:{position:'asc'}}):cp.stage;
      if(stage){continuation={name:cp.stage.deck.name,position:stage.position,href:'/'+cp.mode+'?stageId='+encodeURIComponent(stage.id)};break;}
    }catch{ /* Other recommendations remain available. */ }
  }
  return NextResponse.json({due:due.status==='fulfilled'?due.value:null,mistakes:mistakes.status==='fulfilled'&&exerciseMistakes.status==='fulfilled'?new Set([...mistakes.value,...exerciseMistakes.value].map((r:{wordId:number})=>r.wordId)).size:null,continuation,unavailable:[due,mistakes,checkpoint,exerciseMistakes].some(r=>r.status==='rejected')},{headers:{'Cache-Control':'private, no-store'}});
}
