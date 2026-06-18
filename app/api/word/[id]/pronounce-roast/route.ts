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

    const targetWord = word.word;
    const spoken = transcribedText;

    // Tính điểm bằng thuật toán Levenshtein Distance để có dải điểm từ 0-100 chuẩn xác
    const calculatedScore = calculateSimilarityScore(targetWord, spoken);

    const prompt = `Nhiệm vụ:
Viết đúng 1 câu nhận xét ngắn (tối đa 20 từ) để phản hồi kết quả phát âm.

Đầu vào:
* Từ gốc: ${targetWord}
* Từ được nhận diện: ${spoken}
* Điểm phát âm: ${calculatedScore}/100

Yêu cầu bắt buộc:
* Chỉ trả về DUY NHẤT 1 câu nhận xét.
* Tối đa 20 từ.
* Viết 100% bằng tiếng Việt.
* Không dùng emoji.
* Không dùng tiếng Anh.
* Không giải thích thêm.
* Không xuống dòng.
* Không mở đầu bằng các từ như: "Ủa", "Ôi", "Wow", "Trời ơi".

Văn phong:
* Giống gia sư Gen Z trên Threads hoặc TikTok.
* Hài hước, duyên dáng, mang đậm yếu tố "cà khịa" dí dỏm, mặn mòi và tếu táo rõ nét (nhất là ở các mốc điểm dưới 80).
* Tạo cảm giác như đang trò chuyện với bạn bè.
* Ưu tiên những câu khiến người đọc bật cười vì độ lầy lội nhưng vẫn nhận ra lỗi sai.
* Không giáo điều, không khô khan.
* Không độc hại, không chế giễu xúc phạm người học.

Yêu cầu nội dung:
* Câu nhận xét phải dựa trên từ gốc, từ được nhận diện và điểm số.
* YẾU TỐ CÀ KHỊA PHẢI THỂ HIỆN RÕ: Trêu đùa dí dỏm về sự khác biệt phát âm (ví dụ: từ gốc nghĩa là thế này nhưng đọc ra từ nhận diện lại thành một nghĩa lố bịch hoặc vô lý khác).
* Nếu phát âm gần đúng, hãy khen theo cách dí dỏm, "khịa nhẹ" cho bớt tự mãn.
* Nếu phát âm sai, hãy chọc vui vào sự khác biệt âm thanh giữa hai từ.
* Nếu từ nhận diện quá khác từ gốc, có thể ví von hài hước rằng từ đã "đi lạc", "đổi địa chỉ", "quay xe", "mất tín hiệu", "bay màu"... nhưng phải hợp lý.
* Không được tạo nhận xét chung chung có thể áp dụng cho mọi trường hợp. Mỗi câu phải được may đo riêng cho cặp từ này.

Quy tắc dùng từ lóng:
* Tối đa 1 từ lóng hoặc từ trend trong một câu.
* Chỉ dùng khi thực sự tự nhiên.
* Có thể tham khảo các từ như: xịt keo, kiếp nạn, cảm lạnh, chê, cứu tui, vô tri, ngoan xinh yêu, mận vải, trúng độc đắc...
* Không cố nhồi nhét từ lóng.

Phân loại theo điểm:
* 90–100: Khen vui vẻ, dí dỏm, cảm giác rất sát đáp án.
* 80–89: Khen là chính, "khịa nhẹ" nhắc nhở chỉnh phát âm cho mượt.
* 60–79: Có tiến bộ nhưng "khịa" độ lệch âm tinh tế để sửa lại.
* 40–59: Sai khá rõ, cà khịa tếu táo và dí dỏm về từ bị đọc sai.
* 20–39: Cà khịa mạnh hơn, ví von hài hước sự khác biệt xa giữa hai từ.
* 0–19: Cà khịa cực lầy kiểu "đi lạc sang hành tinh khác" nhưng dí dỏm để động viên tinh thần.

Điều cấm:
* Không được copy nguyên văn ví dụ.
* Không dùng nhiều từ lóng trong cùng một câu.
* Không tạo câu vô nghĩa.
* Không dùng các mẫu sáo rỗng như "Bạn cần cố gắng hơn", "Hãy luyện tập thêm", "Rất tốt", "Khá ổn".
* Không xúc phạm, mỉa mai nặng nề hoặc gây khó chịu.

Mục tiêu:
Tạo cảm giác như một người bạn Gen Z mặn mòi, dí dỏm, chuyên "cà khịa" lầy lội và tỉnh bơ đang nhận xét phát âm, chứ không phải giáo viên đang chấm bài.

Trả về định dạng JSON duy nhất:
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
        temperature: 0.4,
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
        roast: parsed.roast || 'Lỗi AI mỏ hỗn',
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
