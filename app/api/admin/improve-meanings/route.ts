import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { limit = 10 } = await req.json().catch(() => ({ limit: 10 }));
    
    // Check if API Key exists with filesystem fallback
    let apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
        const match = envFile.match(/NVIDIA_API_KEY="?([^"\n]+)"?/);
        if (match) apiKey = match[1];
      } catch (e) {}
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình NVIDIA_API_KEY trong file .env' }, { status: 400 });
    }

    // Find words that have '|||' in their meaning (indicates auto-translated by Google Translate)
    const wordsToImprove = await prisma.word.findMany({
      where: {
        meaning_vi: {
          contains: '|||'
        }
      },
      take: limit,
      orderBy: { id: 'asc' }
    });

    if (wordsToImprove.length === 0) {
      return NextResponse.json({ success: true, message: 'Không còn từ vựng nào cần sửa nghĩa!' });
    }

    let successCount = 0;
    const batchSize = 5;

    // Process words in parallel batches to prevent timeouts
    for (let i = 0; i < wordsToImprove.length; i += batchSize) {
      const batch = wordsToImprove.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (word: any) => {
          // Extract the English part from the old meaning
          const enMeaning = word.meaning_vi.split('|||')[0].trim();
          
          const prompt = `
            Bạn là một giáo viên chuyên dạy IELTS. Hãy giải thích và dịch từ vựng tiếng Anh sau sang tiếng Việt một cách tự nhiên, ngắn gọn và dễ hiểu nhất cho học sinh Việt Nam. 
            Từ vựng: "${word.word}"
            Loại từ: ${word.pos || 'Không xác định'}
            Ngữ cảnh/Nghĩa tiếng Anh gốc: "${enMeaning}"
            
            Yêu cầu Format bắt buộc (Chỉ trả về đúng format này, không giải thích gì thêm):
            [Nghĩa Tiếng Anh gốc] /// [Nghĩa Tiếng Việt tự nhiên]
            
            Ví dụ: a system of wires or radio waves /// một hệ thống sử dụng sóng vô tuyến hoặc dây cáp
          `;

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per call

          try {
            const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: "meta/llama-3.1-8b-instruct",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3
              }),
              signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
              const data = await response.json();
              const aiText = data.choices?.[0]?.message?.content;
              
              if (aiText) {
                // Loop through lines to find the one containing '///' (handling extra comments or intro)
                let cleanText = '';
                const lines = aiText.split('\n');
                for (const line of lines) {
                  const trimmedLine = line.trim();
                  if (trimmedLine.includes('///')) {
                    cleanText = trimmedLine;
                    break;
                  }
                }
                
                if (cleanText) {
                  // Update the word in database
                  await prisma.word.update({
                    where: { id: word.id },
                    data: { meaning_vi: cleanText }
                  });
                  successCount++;
                }
              }
            }
          } catch (err: any) {
            clearTimeout(timeoutId);
            console.error(`Error improving word ${word.word}:`, err.message || err);
          }
        })
      );

      // Delay between batches to respect free tier rate limits
      if (i + batchSize < wordsToImprove.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã cải thiện thành công ${successCount}/${wordsToImprove.length} từ vựng.` 
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống' }, { status: 500 });
  }
}
