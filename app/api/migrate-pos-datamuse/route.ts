import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Lấy 50 từ chưa có POS
    const words = await prisma.word.findMany({
      where: { pos: null },
      take: 50,
    });

    if (words.length === 0) {
      return NextResponse.json({ done: true, message: 'All words have been processed!' });
    }

    // 2. Lấy thông tin POS từ Datamuse API (Concurrency)
    const updates = await Promise.all(words.map(async (w) => {
      let finalPos = 'Không phân loại';
      try {
        const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(w.word)}&md=p&max=1`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0 && data[0].tags) {
            const tags = data[0].tags;
            // Map Datamuse tags to POS
            if (tags.includes('n')) finalPos = 'Danh từ';
            else if (tags.includes('v')) finalPos = 'Động từ';
            else if (tags.includes('adj')) finalPos = 'Tính từ';
            else if (tags.includes('adv')) finalPos = 'Trạng từ';
          }
        }
      } catch (error) {
        // Silently ignore individual fetch errors, fallback to default
      }

      return {
        id: w.id,
        pos: finalPos
      };
    }));

    // 3. Cập nhật vào Database bằng transaction
    await prisma.$transaction(
      updates.map((u) => 
        prisma.word.update({
          where: { id: u.id },
          data: { pos: u.pos }
        })
      )
    );

    return NextResponse.json({ done: false, processed: words.length });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
