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
    
    // Check if API Key exists
    const apiKey = process.env.NVIDIA_API_KEY;
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

    // Process each word with Gemini API
    for (const word of wordsToImprove) {
      // Extract the English part from the old meaning
      const enMeaning = word.meaning_vi.split('|||')[0].trim();
      
      const prompt = `
        Bạn là một giáo viên chuyên dạy IELTS. Hãy giải thích và dịch từ vựng tiếng Anh sau sang tiếng Việt một cách tự nhiên, ngắn gọn và dễ hiểu nhất cho học sinh Việt Nam. 
        Từ vựng: "${word.word}"
        Loại từ: ${word.pos || 'Không xác định'}
        Ngữ cảnh/Nghĩa tiếng Anh gốc: "${enMeaning}"
        
        Yêu cầu Format bắt buộc (Chỉ trả về đúng format này, không giải thích gì thêm):
        [Nghĩa Tiếng Anh gốc] ||| [Nghĩa Tiếng Việt tự nhiên]
        
        Ví dụ: a system of wires or radio waves ||| một hệ thống sử dụng sóng vô tuyến hoặc dây cáp
      `;

      try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct", // You can change this to llama3-70b-instruct if you want
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3
          })
        });

        if (response.ok) {
          const data = await response.json();
          const aiText = data.choices?.[0]?.message?.content;
          
          if (aiText && aiText.includes('|||')) {
            const cleanText = aiText.trim();
            
            // Update the word in database
            await prisma.word.update({
              where: { id: word.id },
              data: { meaning_vi: cleanText }
            });
            successCount++;
          }
        }
      } catch (err) {
        console.error('Error calling NVIDIA NIM for word:', word.word, err);
      }
      
      // Delay to avoid rate limit (free tier)
      await new Promise(resolve => setTimeout(resolve, 1000));
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
