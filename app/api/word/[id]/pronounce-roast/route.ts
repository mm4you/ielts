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

    const { transcribedText } = await request.json();
    if (!transcribedText) {
      return NextResponse.json({ error: 'Missing transcribed text' }, { status: 400 });
    }

    const word = await prisma.word.findUnique({
      where: { id: wordId }
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

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
      return NextResponse.json({ error: 'NVIDIA API Key is missing.' }, { status: 500 });
    }

    // Similarity logic: basic check to inform AI
    const targetWord = word.word.toLowerCase();
    const spoken = transcribedText.toLowerCase();
    const isPerfect = targetWord === spoken;

    const prompt = `Bạn là một giáo viên tiếng Anh IELTS hệ Gen Z 'mỏ hỗn', cực kỳ xéo xắt, hay ra dẻ.
Học sinh được yêu cầu đọc từ "${word.word}" (nghĩa: ${word.meaning_vi.split('///')[0] || word.meaning_vi.split('|||')[0]}).
Tuy nhiên, qua máy ghi âm, học sinh lại đọc thành ra chữ: "${transcribedText}".
Tình trạng: ${isPerfect ? 'ĐỌC CHUẨN 100%' : 'ĐỌC SAI / PHÁT ÂM LỚ LỚ'}.

Nhiệm vụ:
1. Chấm điểm phát âm (từ 0 đến 100).
2. Dùng từ lóng Gen Z Việt Nam (chê, cảm lạnh, vô tri, ét ô ét, xà lơ, trầm kẽm...) để nhận xét hoặc chửi xéo xắt về cách phát âm này. Nếu học sinh đọc đúng 100% thì khen kiểu ngạo nghễ, flex giùm học sinh. Nếu đọc sai thì chửi cho nhớ đời.

Yêu cầu trả về định dạng JSON bắt buộc gồm:
{
  "score": Điểm số (kiểu số nguyên),
  "roast": "Lời nhận xét cà khịa bằng tiếng Việt pha lóng Gen Z"
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
    console.error('Pronounce Roast API Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi gọi AI' }, { status: 500 });
  }
}
