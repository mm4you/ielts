import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')                        // collapse whitespace
    .trim();
}

function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  let i, j, val;
  for (i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      val = (a[i - 1] === b[j - 1]) ? 0 : 1;
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + val
      );
    }
  }
  return tmp[a.length][b.length];
}

function calculateSimilarityScore(target: string, spoken: string): number {
  const cleanTarget = cleanString(target);
  const cleanSpoken = cleanString(spoken);
  
  if (cleanTarget === cleanSpoken) return 100;
  if (!cleanTarget || !cleanSpoken) return 0;
  
  const distance = getLevenshteinDistance(cleanTarget, cleanSpoken);
  const maxLength = Math.max(cleanTarget.length, cleanSpoken.length);
  
  const similarity = 1 - distance / maxLength;
  return Math.round(similarity * 100);
}

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

    if (transcribedText.length > 150) {
      return NextResponse.json({ error: 'Transcribed text exceeds maximum length of 150 characters' }, { status: 400 });
    }

    const word = await prisma.word.findUnique({
      where: { id: wordId }
    });

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'NVIDIA API Key is missing.' }, { status: 500 });
    }

    const targetWord = word.word;
    const spoken = transcribedText;

    // Tính điểm bằng thuật toán Levenshtein Distance để có dải điểm từ 0-100 chuẩn xác
    const calculatedScore = calculateSimilarityScore(targetWord, spoken);

    const systemInstruction = `Bạn là một chiến thần "mỏ hỗn" IELTS chuyên cà khịa phát âm tiếng Anh bằng tiếng Việt xéo xắt, đanh đá và hài hước kiểu Gen Z.
Hãy viết đúng 1 câu nhận xét ngắn (dưới 20 từ) để phản hồi kết quả phát âm của học sinh.

Yêu cầu bắt buộc:
1. Chỉ trả về duy nhất định dạng JSON: {"roast": "Lời nhận xét"}
2. Nhận xét cực kỳ ngắn gọn (dưới 20 từ), không dùng emoji, không mở đầu bằng các từ nhàm chán như "Ủa", "Ôi", "Wow", "Trời ơi".
3. TUYỆT ĐỐI KHÔNG sử dụng cấu trúc rập khuôn dạng: "Từ gốc là X mà đọc ra Y...". Hãy tự sáng tạo câu mới linh hoạt dựa trên từ vựng học sinh đã đọc.
4. Câu nhận xét phải có nghĩa rõ ràng, đúng ngữ pháp tiếng Việt, và phù hợp với điểm số của học sinh theo quy tắc dưới đây.

Quy tắc khen/chê theo điểm:
- Điểm từ 80-100: Khen kiểu khịa (khen ngợi một cách mỉa mai, hài hước vì học sinh đọc quá xuất sắc/hoàn hảo). Hãy hỏi xem học sinh có phải người bản xứ không, hoặc trêu họ định đi làm giáo sư/thủ khoa tiếng Anh, hoặc bảo họ làm cho AI mất việc.
- Điểm dưới 80 (0-79 điểm): Chê thẳng mặt (cà khịa lỗi phát âm sai, lệch âm, ngớ ngẩn). Trêu chọc rằng họ đọc như đang đọc bùa chú, hoặc giọng đọc làm người khác buồn ngủ, hoặc giám khảo nghe xong sẽ cho về chỗ.`;

    const messages = [
      { role: 'system', content: systemInstruction },
      // Mock Turn 1: High score
      { role: 'user', content: 'Từ gốc: "DIFFERENT"\nTừ học sinh đọc: "different"\nĐiểm phát âm: 100/100' },
      { role: 'assistant', content: '{"roast": "Phát âm đỉnh thế định cướp việc của AI hay gì đây?"}' },
      // Mock Turn 2: Low score
      { role: 'user', content: 'Từ gốc: "UNIVERSITY"\nTừ học sinh đọc: "univer"\nĐiểm phát âm: 40/100' },
      { role: 'assistant', content: '{"roast": "Đọc từ \'UNIVERSITY\' gì mà nghe như đang đọc bùa chú trục xuất AI vậy."}' },
      // Mock Turn 3: High score
      { role: 'user', content: 'Từ gốc: "SCHEDULE"\nTừ học sinh đọc: "schedule"\nĐiểm phát âm: 95/100' },
      { role: 'assistant', content: '{"roast": "Học giỏi thế này thì AI mỏ hỗn biết sống sao, bớt hoàn hảo lại giùm cái!"}' },
      // Mock Turn 4: Low score
      { role: 'user', content: 'Từ gốc: "BEAUTIFUL"\nTừ học sinh đọc: "pít-ti-phun"\nĐiểm phát âm: 30/100' },
      { role: 'assistant', content: '{"roast": "Nghe bạn đọc xong con AI của tôi nó trầm cảm đòi tắt nguồn luôn rồi."}' },
      // Mock Turn 5: Low score
      { role: 'user', content: 'Từ gốc: "GRADUATE"\nTừ học sinh đọc: "Graduating"\nĐiểm phát âm: 70/100' },
      { role: 'assistant', content: '{"roast": "Chữ \'GRADUATE\' người ta rõ ràng thế kia mà đọc ra thành đang đi học lại à?"}' },
      // Actual Turn
      { role: 'user', content: `Từ gốc: "${targetWord}"\nTừ học sinh đọc: "${spoken}"\nĐiểm phát âm: ${calculatedScore}/100` }
    ];

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: messages,
        temperature: 0.8,
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
      let roast = parsed.roast || 'Lỗi AI mỏ hỗn';

      // Khắc phục an toàn: thay thế placeholder nếu mô hình trả về thẻ thô
      roast = roast.replace(/{target}/gi, targetWord)
                   .replace(/{spoken}/gi, spoken)
                   .replace(/{targetWord}/gi, targetWord);

      return NextResponse.json({
        score: calculatedScore,
        roast,
        wordDetails: {
          word: word.word,
          ipa: word.ipa,
          pos: word.pos,
          meaning_vi: word.meaning_vi,
          example: word.example,
          synonyms: word.synonyms
        }
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
