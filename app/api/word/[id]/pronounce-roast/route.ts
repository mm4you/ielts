import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const prompt = `Bạn là một người bình luận dạo trên mạng với khiếu hài hước duyên dáng, lầy lội và tỉnh bơ. Lời lẽ của bạn tự nhiên như người Việt hay nói giỡn với nhau hàng ngày.
Học sinh cần phát âm từ tiếng Anh "${word.word}" (nghĩa: ${word.meaning_vi.split('///')[0] || word.meaning_vi.split('|||')[0]}), nhưng máy ghi âm lại nghe ra thành: "${transcribedText}".
Hệ thống tự động chấm điểm: ${calculatedScore}/100 điểm.

Nhiệm vụ: Viết đúng 1 câu nhận xét ngắn (tối đa 20 từ) để phản hồi lại kết quả này.
Yêu cầu văn phong:
- CẤM DÙNG các từ lóng mạng gượng ép (như: xịt keo, kiếp nạn, cảm lạnh, chê, cứu tui, ét ô ét). Hãy nói chuyện một cách tự nhiên, tếu táo.
- CẤM DÙNG bất kỳ từ tiếng Anh nào trong câu nhận xét để tránh lỗi phát âm của máy đọc. Viết 100% tiếng Việt.
- Không dùng từ cảm thán sáo rỗng ở đầu câu (Ủa, Ôi, Wow...).
- Tùy vào số điểm mà có thái độ khác nhau:
  * Nếu điểm >= 80 (Phát âm đúng hoặc xuất sắc): Khen ngợi một cách dí dỏm, hề hước, tâng bốc người đọc lên tận mây xanh nhưng vẫn tếu táo (ví dụ: "Đọc chuẩn thế này thì Tây nghe xong cũng phải xin lại quốc tịch.", "Mười điểm không có nhưng, phát âm mượt như nhung luôn."). Tuyệt đối KHÔNG được chê bai hay khịa.
  * Nếu điểm < 80 (Phát âm sai): Trêu đùa nhẹ nhàng, duyên dáng, không sỉ nhục người khác. Cà khịa một cách mặn mà, tự nhiên (ví dụ: "Đọc xong từ này chắc từ điển cũng tự động gập lại đi ngủ luôn.", "Có cố gắng đó, nhưng mà là cố gắng làm người nghe hoang mang.", "Nghe quen quen mà hình như không phải tiếng người trái đất.").

Trả về JSON duy nhất:
{
  "roast": "Lời nhận xét"
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
        max_tokens: 100,
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
