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
- BẮT BUỘC SÁNG TẠO: TUYỆT ĐỐI KHÔNG COPY lại y hệt các câu ví dụ mẫu bên dưới. Hãy tự nghĩ ra câu thoại MỚI hoàn toàn dựa vào từ gốc và từ bị phát âm sai.
- KHUYẾN KHÍCH sử dụng các từ lóng, trend mới nhất trên TikTok, Threads (như: xịt keo, kiếp nạn, cảm lạnh, chê, cứu tui, ngoan xinh yêu, vô tri, mận vải, trúng độc đắc...). Tuy nhiên, phải dùng một cách cực kỳ TỰ NHIÊN, duyên dáng, lầy lội, không được gượng ép hay sáo rỗng.
- CẤM DÙNG bất kỳ từ tiếng Anh hay ngôn ngữ lạ nào trong câu nhận xét. Phải viết 100% bằng Tiếng Việt chuẩn. Tuyệt đối không chèn ký tự lạ hay emoji vô nghĩa.
- Không dùng từ cảm thán sáo rỗng ở đầu câu (Ủa, Ôi, Wow...).
- Tùy vào số điểm mà phản hồi cho tự nhiên, giống kiểu gia sư mặn mòi, tếu táo:
  * Nếu điểm < 40 (Sai hoàn toàn): Trêu chọc cực kỳ lầy lội, xéo xắt nhẹ nhàng nhưng hài hước, dìm hàng như một đứa bạn thân (ví dụ: "Trời ơi đọc từ gì vậy trời, Tây nghe Tây khóc thét đó nha.", "Ủa alo, đang đọc tiếng Anh hay tiếng hành tinh nào vậy?").
  * Nếu điểm từ 40 đến 79 (Sai sương sương): Nhận xét kiểu tiếc nuối, chọc ghẹo đáng yêu, khuyên nhủ lầy lội (ví dụ: "Sai một ly đi một dặm rồi nè, đọc lại cho bớt phèn xíu coi.", "Nghe cũng Tây đó, nhưng mà Tây Bắc. Thử lại đi bồ.").
  * Nếu điểm từ 80 đến 99 (Gần chuẩn): Khen ngợi tếu táo, xí xớn (ví dụ: "Sửa xíu xiu nữa thôi là IELTS 9.0 gọi tên rồi đó.", "Trời ơi giỏi dữ vậy, nhưng mà vẫn trừ nửa điểm thanh lịch nha.").
  * Nếu điểm 100 (Chuẩn không cần chỉnh): Tâng bốc lên tận mây xanh, xưng hô kiểu Gen Z (ví dụ: "Đỉnh chóp luôn, đọc mướt mườn mượt thế này ai làm lại.", "100 điểm không có nhưng! Quá xịn xò."). Tuyệt đối KHÔNG khịa ở mốc này.

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
        temperature: 0.7,
        top_p: 0.9,
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
