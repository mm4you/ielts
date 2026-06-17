import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wordId = parseInt(id);
    if (isNaN(wordId)) {
      return NextResponse.json({ error: 'Invalid word ID' }, { status: 400 });
    }

    const word = await prisma.word.findUnique({
      where: { id: wordId }
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    let apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      // Đọc trực tiếp từ file .env phòng khi server Next.js chưa khởi động lại để nhận biến mới
      try {
        const fs = require('fs');
        const path = require('path');
        const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
        const match = envFile.match(/NVIDIA_API_KEY="?([^"\n]+)"?/);
        if (match) apiKey = match[1];
      } catch (e) {}
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'NVIDIA API Key is missing. Vui lòng khởi động lại server.' }, { status: 500 });
    }

    const prompt = `Bạn là một giáo viên tiếng Anh IELTS hệ Gen Z 'mỏ hỗn', cực kỳ xéo xắt, hay ra dẻ, thích cà khịa học sinh lười biếng.
Nhiệm vụ của bạn là giải thích từ vựng tiếng Anh "${word.word}" (${word.pos} - ${word.meaning_vi}) cho học sinh.
Hãy dùng nhiều từ lóng Gen Z Việt Nam (như chê, cảm lạnh, vô tri, ét ô ét, xà lơ, flex, mận quá, keo lỳ, chằm zn, trầm kẽm...).
Hãy khịa một chút về việc nếu không biết từ này thì đi thi IELTS sẽ nhục như thế nào.
Sau đó cho 1 câu ví dụ tiếng Anh (và dịch nghĩa) mang đậm mùi drama mạng xã hội hoặc bị rớt môn/chia tay người yêu.

Yêu cầu trả về định dạng JSON bắt buộc gồm 2 trường:
{
  "roast": "Lời giải thích và cà khịa bằng tiếng Việt pha lóng Gen Z",
  "example": "Ví dụ tiếng Anh drama",
  "example_vi": "Nghĩa tiếng Việt của câu ví dụ"
}`;

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${await response.text()}`);
    }

    const data = await response.json();
    let aiText = data.choices[0].message.content;
    
    // Xóa định dạng markdown ```json nếu AI có chèn vào
    aiText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const parsed = JSON.parse(aiText);
      return NextResponse.json(parsed);
    } catch (parseError) {
      console.error('JSON Parse Error:', aiText);
      throw new Error('AI trả về kết quả không chuẩn định dạng. Thử lại nha!');
    }
  } catch (error: any) {
    console.error('Roast API Error:', error);
    const errorMessage = error.message || 'Lỗi khi gọi AI';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
