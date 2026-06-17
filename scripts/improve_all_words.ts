import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const prisma = new PrismaClient();
const apiKey = process.env.NVIDIA_API_KEY;

async function translateWithAI(word: string, pos: string | null, oldMeaning: string): Promise<string | null> {
  const prompt = \`
Bạn là một giáo viên chuyên dạy IELTS. Hãy giải thích và dịch từ vựng tiếng Anh sau sang tiếng Việt một cách tự nhiên, ngắn gọn và dễ hiểu nhất cho học sinh Việt Nam. 
Từ vựng: "\${word}"
Loại từ: \${pos || 'Không xác định'}
Ngữ cảnh/Nghĩa tiếng Anh gốc: "\${oldMeaning}"

Yêu cầu Format bắt buộc (Chỉ trả về đúng format này, không giải thích gì thêm):
[Nghĩa Tiếng Anh gốc] ||| [Nghĩa Tiếng Việt tự nhiên]

Ví dụ: a system of wires or radio waves ||| một hệ thống sử dụng sóng vô tuyến hoặc dây cáp
\`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content;
      if (aiText && aiText.includes('|||')) {
        return aiText.trim();
      }
    } else {
      console.error('API Error:', await response.text());
    }
  } catch (err) {
    console.error('Error calling NVIDIA NIM:', err);
  }
  return null;
}

async function main() {
  if (!apiKey) {
    console.error('Lỗi: Chưa cài đặt NVIDIA_API_KEY trong file .env');
    process.exit(1);
  }

  console.log('Bắt đầu quét từ vựng cần sửa nghĩa (chứa "|||")...');
  
  // Find all words that have the '|||' pattern (meaning they were auto-translated)
  const wordsToImprove = await prisma.word.findMany({
    where: {
      meaning_vi: {
        contains: '|||'
      }
    },
    orderBy: { id: 'asc' }
  });

  console.log(\`Tìm thấy \${wordsToImprove.length} từ vựng cần cải thiện.\`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < wordsToImprove.length; i++) {
    const word = wordsToImprove[i];
    const enMeaning = word.meaning_vi.split('|||')[0].trim();
    
    console.log(\`[\${i + 1}/\${wordsToImprove.length}] Đang xử lý từ: \${word.word}...\`);
    
    const newMeaning = await translateWithAI(word.word, word.pos, enMeaning);
    
    if (newMeaning) {
      await prisma.word.update({
        where: { id: word.id },
        data: { meaning_vi: newMeaning }
      });
      successCount++;
      console.log(\`  -> Thành công: \${newMeaning}\`);
    } else {
      errorCount++;
      console.log(\`  -> Thất bại.\`);
    }

    // Rate limiting delay (adjust according to your NVIDIA NIM limits)
    // 1500ms delay avoids hitting the limits too fast.
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('================================');
  console.log('Hoàn thành quá trình chạy AI!');
  console.log(\`Số từ thành công: \${successCount}\`);
  console.log(\`Số từ thất bại: \${errorCount}\`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
