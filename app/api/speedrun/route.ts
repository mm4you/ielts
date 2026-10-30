import { NextResponse } from 'next/server';
import { loadGamePool, GamePoolError } from '@/lib/game-pool';
import { meaningQuestions } from '@/lib/game-questions';
export async function GET(request:Request){
  try{
    const words=await loadGamePool(request,300),questions=meaningQuestions(words);
    if(questions.length===0)throw new GamePoolError('Bộ này cần ít nhất 4 từ có nghĩa khác nhau để tạo câu hỏi.',409);
    return NextResponse.json(questions,{headers:{'Cache-Control':'private, no-store'}});
  }catch(e){return NextResponse.json({error:e instanceof GamePoolError?e.message:'Chưa tải được từ. Bạn thử lại nhé.'},{status:e instanceof GamePoolError?e.status:503});}
}
