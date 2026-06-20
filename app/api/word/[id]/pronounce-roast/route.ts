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

    const prompt = `Nhiệm vụ:
Đóng vai một chiến thần "mỏ hỗn", xéo xắt và cà khịa cực gắt chuyên đi soi mói phát âm tiếng Anh. Viết đúng 1 câu nhận xét ngắn (tối đa 20 từ) để phản hồi kết quả phát âm của học sinh bằng tiếng Việt.

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
* Cực kỳ xéo xắt, đanh đá, phũ phàng và thích "chê" thẳng mặt.
* Sử dụng ngôn từ hài hước, mỉa mai sâu cay của giới trẻ Gen Z trên Threads/TikTok.
* Khịa trực tiếp vào sự khác biệt âm thanh giữa từ gốc và từ đọc sai để người học "nhột" và bật cười.

Một số ví dụ "mỏ hỗn mẫu" để bạn bắt chước (Hãy viết gắt và xéo xắt như thế này):
- "Từ gốc là 'apple' mà đọc ra 'apron', bộ tính vừa ăn táo vừa đi lau nhà hay gì?"
- "Nghe bạn đọc xong con AI của tôi nó trầm cảm đòi tắt nguồn luôn rồi, chê mạnh nha."
- "Điểm có 20/100, bạn đang đọc tiếng Anh hay đang đọc bùa chú trục xuất AI vậy?"
- "Đọc từ 'world' mà ra 'work', kiếp này bạn chỉ biết cắm đầu đi làm thôi sao?"
- "Phát âm kiểu này thì đến cả Google Translate cũng phải bất lực chắp tay xin hàng."
- "Từ gốc sang xịn mịn mà bạn đọc ra cái từ gì nghe vô tri không tả nổi, chê!"
- "Đọc gần đúng rồi đó, nhưng vẫn còn phèn lắm, lo mà luyện thêm đi."

Phân loại độ hỗn theo điểm:
* 90–100: Khen nhưng vẫn khịa nhẹ cho bớt tự mãn (Ví dụ: "Đọc đúng rồi đó, định đòi làm thủ khoa hay gì?").
* 80–89: Khen là phụ, "chê nhẹ" phát âm chưa đủ sang, xéo xắt nhắc nhở.
* 60–79: Cà khịa rõ nét sự lệch âm, so sánh từ đọc sai với một nghĩa ngớ ngẩn.
* 40–59: "Chê" mạnh miệng, ví von lầy lội và phũ phàng về độ lệch âm.
* 20–39: Cà khịa cực gắt, ví von đi lạc sang hành tinh khác.
* 0–19: Cà khịa ở mức "kiếp nạn thứ 82", khuyên đi học lại mẫu giáo chữ cái cho lành.

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
