import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { recognitionScore, recognitionFeedback } from '@/lib/pronunciation';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())?.user) return NextResponse.json({ error: 'Bạn cần đăng nhập.' }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) return NextResponse.json({error:'Từ vựng không hợp lệ.'},{status:400});
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Dữ liệu không hợp lệ.'},{status:400}); }
  const text = body && typeof body === 'object' && 'transcribedText' in body ? body.transcribedText : null;
  if (typeof text !== 'string' || !text.trim() || text.length > 150) return NextResponse.json({error:'Nội dung nhận diện cần từ 1 đến 150 ký tự.'},{status:400});
  try {
    const word = await prisma.word.findUnique({where:{id:Number(id)}});
    if (!word) return NextResponse.json({error:'Không tìm thấy từ vựng.'},{status:404});
    const score = recognitionScore(word.word,text);
    return NextResponse.json({score, roast:recognitionFeedback(score), scoreKind:'recognition-match', wordDetails:{word:word.word,ipa:word.ipa,pos:word.pos,meaning_vi:word.meaning_vi,example:word.example}});
  } catch { return NextResponse.json({error:'Chưa thể đối chiếu từ lúc này. Bạn thử lại nhé.'},{status:500}); }
}
