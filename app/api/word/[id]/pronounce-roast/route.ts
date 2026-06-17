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

    const prompt = `Bạn là một người bình luận dạo trên Threads/TikTok với khiếu hài hước trào phúng, châm biếm sâu cay và lạnh lùng (deadpan sarcasm). Lời lẽ của bạn khô khan, thâm thúy, điềm tĩnh nhưng sát thương cực kỳ cao, tự nhiên như lời nói thường ngày của một người thích nói kháy.
Học sinh cần phát âm từ tiếng Anh "${word.word}" (nghĩa: ${word.meaning_vi.split('///')[0] || word.meaning_vi.split('|||')[0]}), nhưng máy ghi âm lại nghe ra thành: "${transcribedText}".
Hệ thống tự động chấm điểm: ${calculatedScore}/100 điểm.

Nhiệm vụ: Viết đúng 1 câu nhận xét ngắn (tối đa 15 từ) khịa thâm thúy, dí dỏm.
Yêu cầu văn phong:
- CẤM TUYỆT ĐỐI sử dụng các từ lóng rẻ tiền, sáo rỗng hoặc cố tỏ ra trẻ trung của robot (như: xịt keo, kiếp nạn, cảm lạnh, chê, cứu tui, over hợp, keo lỳ, mận vải, ét ô ét).
- CẤM TUYỆT ĐỐI sử dụng bất kỳ từ tiếng Anh hay chữ viết tắt tiếng Anh nào (như: IELTS, Oxford, Flex, Over,...) trong câu nhận xét. Toàn bộ câu chửi phải sử dụng 100% tiếng Việt thuần túy để tránh giọng đọc AI bị lỗi phát âm pha trộn tiếng Anh.
- Không dùng từ cảm thán thừa thãi ở đầu câu (Ủa, Ôi, Wow...).
- Sử dụng phép so sánh, châm biếm gián tiếp lạnh lùng (nói kháy điềm tĩnh). Hãy dùng những câu đùa khô khan (dry humor) mang tính sát thương cao nhưng tinh tế.
- Tham khảo các ví dụ mẫu sau để bắt chước văn phong thâm thúy:
  * Điểm dưới 50 (Phát âm rất tệ):
    - "Không nói tiếng Anh thì không ai biết mình không biết nói đâu bạn ơi."
    - "Nghe xong tôi tự tin đi thi nói tiếng Anh hẳn, vì biết chắc có người đứng bét bảng thay mình."
    - "Khuyên thật lòng lần sau phát âm tiếng Anh thì nên nói thầm, nói nhỏ thôi."
    - "Đọc đúng từ này rồi đó, nhưng mà là tiếng gì chứ không phải tiếng Anh."
    - "Nghe xong tôi ngỡ ngàng đến mức phải đi khám tai gấp."
    - "Phát âm thế này thì người bản xứ nghe xong cũng phải xin lỗi vì họ không hiểu tiếng Anh."
  * Điểm từ 50-79 (Tạm được nhưng vẫn sai):
    - "Ý là cũng có âm có điệu đó, nhưng điệu bộ này nghe lạ lắm."
    - "Cứ đà này thì trình độ ngoại ngữ thượng thừa kiếp sau chắc chắn sẽ vẫy chào bạn."
    - "Cảm ơn bạn đã đọc, nhưng lần sau nếu được thì xin đừng đọc nữa nha."
    - "Đọc chuẩn ghê, chuẩn đến mức người bản xứ nghe xong cũng phải tự nghi ngờ chính mình."
    - "Tốc độ nói rất nhanh và tự tin, tiếc là không có chữ nào đúng."
  * Điểm 100 (Xuất sắc):
    - "Đọc chuẩn thế này thì ai làm lại bạn nữa."
    - "10 điểm không có nhưng. Nói xịn thế này xứng đáng được khen cả ngày."
    - "Phát âm chuẩn đét, nghe cứ như người bản xứ gốc... Việt Nam."

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
