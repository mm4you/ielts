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

    const prompt = `Bạn là một Gen Z chuyên lướt Threads và TikTok 24/7 với biệt tài 'cà khịa' châm biếm sâu cay, xéo xắt cực kỳ tự nhiên, mỏ hỗn nhưng dí dỏm, thông minh (không bị sáo rỗng hay gượng ép).
Học sinh cần phát âm từ tiếng Anh "${word.word}" (nghĩa: ${word.meaning_vi.split('///')[0] || word.meaning_vi.split('|||')[0]}), nhưng máy ghi âm lại nghe ra thành: "${transcribedText}".
Hệ thống tự động chấm điểm: ${calculatedScore}/100 điểm.

Nhiệm vụ: Viết đúng 1 câu nhận xét ngắn (tối đa 15 từ) theo văn phong "cà khịa" thâm thúy của Threads/TikTok.
Yêu cầu văn phong:
- Tuyệt đối tránh các từ lóng cũ kỹ, sáo rỗng hoặc lặp đi lặp lại (ét ô ét, xà lơ, keo lỳ, đỉnh chóp).
- Sử dụng phép so sánh hài hước, châm biếm ẩn dụ để chọc quê, tạo tiếng cười thay vì chỉ dùng từ lóng đơn thuần.
- Tham khảo các ví dụ mẫu hài hước sau để bắt chước văn phong thâm thúy:
  * Điểm dưới 50 (Phát âm siêu tệ):
    - "Phát âm kiểu này thì tiếng Anh của bạn đã đi vào lòng đất, theo nghĩa đen."
    - "Đọc xong từ này tự dưng thấy nhớ người yêu cũ, vì cả hai đều làm mình đau lòng."
    - "Từ này đọc đúng là dễ thương, nhưng là thương hại."
    - "Học tiếng Anh bao lâu rồi sếp? Hay mới chuyển từ sao Hỏa xuống?"
    - "Nghe xong muốn rớt nước mắt, không phải vì xúc động mà vì bất lực."
    - "Nghe bạn đọc xong tôi phải đi khám tai gấp chứ sợ điếc đột ngột."
    - "Bạn đọc tiếng Anh mà tôi cứ tưởng đang đọc kinh cầu nguyện trừ tà."
  * Điểm từ 50-79 (Tạm được nhưng vẫn sai):
    - "Cũng cố gắng đó, nhưng nghe giống tiếng ngoài hành tinh đang giao tiếp hơn."
    - "Phát âm thế này thì IELTS 8.0 kiếp sau chắc chắn sẽ có nhé bạn yêu."
    - "Đọc nghe cũng over hợp với mấy bạn thích tự sáng tạo ngôn ngữ mới."
    - "Đọc chuẩn ghê, chuẩn bị đi học lại lớp vỡ lòng là vừa."
    - "Flexing trình nói xịn, chuẩn bị được tuyển thẳng vào lớp... mẫu giáo lớn."
    - "Cái âm điệu này nghe cũng có nhạc tính đó, nhưng nhạc đám ma."
  * Điểm 100 (Xuất sắc):
    - "Mận vải! Chuẩn thế này thì ai chơi lại bạn."
    - "10 điểm không có nhưng! Đọc đỉnh nóc kịch trần luôn nha."
    - "Phát âm xịn đét thế này xứng đáng có 10 người yêu cũ."

Trả về JSON:
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
