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

    const targetWord = word.word.toLowerCase();
    const spoken = transcribedText.toLowerCase();
    const isPerfect = targetWord === spoken;

    // Tính điểm bằng Code để tránh AI bị "ngáo" (như vụ đọc đúng mà cho 0 điểm)
    let calculatedScore = 0;
    if (isPerfect) {
      calculatedScore = 100;
    } else {
      // Đơn giản hóa: Nếu có chứa một phần của nhau thì vớt vát 50 điểm, còn không thì ngẫu nhiên 0-40 điểm
      if (spoken.includes(targetWord) || targetWord.includes(spoken)) {
        calculatedScore = 50;
      } else {
        calculatedScore = Math.floor(Math.random() * 40);
      }
    }

    const prompt = `Bạn là một giáo viên tiếng Anh IELTS hệ Gen Z 'mỏ hỗn'.
Học sinh được yêu cầu đọc từ "${word.word}" (nghĩa: ${word.meaning_vi.split('///')[0] || word.meaning_vi.split('|||')[0]}).
Tuy nhiên, qua máy ghi âm, học sinh lại đọc thành ra chữ: "${transcribedText}".
Hệ thống đã tự động chấm điểm phát âm là: ${calculatedScore}/100 điểm.

Nhiệm vụ: Dùng từ lóng Gen Z Việt Nam (chê, cảm lạnh, vô tri, ét ô ét, xà lơ, mận quá, keo lỳ, đỉnh chóp...) để nhận xét. Cực kỳ ngắn gọn, tối đa 1-2 câu ngắn! Tuyệt đối không chào hỏi dài dòng! Không phân tích chữ!
   - NẾU ĐIỂM = 100: Tuyệt đối KHÔNG CHỬI. Hãy khen một cách dí dỏm, hài hước. Dùng các từ như 'mận quá', 'keo lỳ', '10 điểm không có nhưng', 'đỉnh nóc kịch trần'.
   - NẾU ĐIỂM < 100: Chửi xéo xắt, mỏ hỗn, khịa cho nhớ đời vì tội phát âm dở. Dùng từ ngữ mang tính sát thương cao nhưng hài hước. VÀO THẲNG VẤN ĐỀ, KHÔNG GIẢI THÍCH!

Yêu cầu trả về định dạng JSON bắt buộc gồm:
{
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
        max_tokens: 250,
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
      return NextResponse.json({
        score: calculatedScore,
        roast: parsed.roast || 'Lỗi AI mỏ hỗn'
      });
    } catch (parseError) {
      console.error('JSON Parse Error:', aiText);
      throw new Error('AI trả về kết quả không chuẩn định dạng. Thử lại nha!');
    }
  } catch (error: any) {
    console.error('Pronounce Roast API Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi khi gọi AI' }, { status: 500 });
  }
}
