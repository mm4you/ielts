import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const prisma = new PrismaClient();
const apiKey = process.env.NVIDIA_API_KEY;

const hasVietnameseTones = (text: string) => {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
};

// Google Translate API
async function translateText(text: string): Promise<string> {
  if (!text) return text;
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`);
    const data = await res.json();
    return data[0].map((t: any[]) => t[0]).join('');
  } catch (error) {
    return text;
  }
}

// Public Dictionary API
async function fetchDictionaryDefinition(word: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    if (!res.ok) return null;
    const data = await res.json();
    
    // Find the first definition
    if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
      const meaning = data[0].meanings[0];
      if (meaning.definitions && meaning.definitions[0]) {
        return meaning.definitions[0].definition || null;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// NVIDIA NIM Llama Fallback
async function fixWordMeaningWithAI(word: string, pos: string | null): Promise<string | null> {
  const prompt = `
    Bạn là một giáo viên chuyên dạy IELTS. Hãy đưa ra định nghĩa tiếng Anh gốc ngắn gọn, dễ hiểu và bản dịch tiếng Việt tự nhiên nhất cho từ vựng sau:
    Từ: "${word}"
    Loại từ: "${pos || 'Không xác định'}"

    Yêu cầu Format bắt buộc (Chỉ trả về đúng duy nhất 1 dòng theo format này, không giải thích gì thêm, không chào hỏi, không thêm bất cứ ký tự nào khác):
    [Nghĩa tiếng Anh ngắn gọn] /// [Nghĩa tiếng Việt tự nhiên]

    Ví dụ:
    relating to or based on theory rather than practice or empirical evidence /// thuộc về lý thuyết, dựa trên lý thuyết hơn là thực tế
  `;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const aiText = data.choices?.[0]?.message?.content?.trim();
      if (aiText) {
        const lines = aiText.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('///')) {
            return trimmedLine;
          }
        }
      }
    }
  } catch (e: any) {
    console.error(`AI fallback failed for "${word}":`, e.message || e);
  }
  return null;
}

// Concurrency pool helper
async function runWithConcurrencyLimit(tasks: (() => Promise<void>)[], limit: number) {
  const active: Promise<void>[] = [];
  for (const task of tasks) {
    const p = task().then(() => {
      active.splice(active.indexOf(p), 1);
    });
    active.push(p);
    if (active.length >= limit) {
      await Promise.race(active);
    }
  }
  await Promise.all(active);
}

async function main() {
  console.log('Quét toàn bộ từ vựng trong database để phân tích...');
  const words = await prisma.word.findMany({
    orderBy: { id: 'asc' }
  });

  const incorrectWords = [];

  for (const w of words) {
    const parts = w.meaning_vi.split('///');
    if (parts.length >= 2) {
      const enPart = parts[0].trim();
      const isWordSelf = enPart.toLowerCase() === w.word.toLowerCase();
      const isVietnamese = hasVietnameseTones(enPart);

      if (isWordSelf || isVietnamese) {
        incorrectWords.push(w);
      }
    } else {
      incorrectWords.push(w);
    }
  }

  console.log(`Tìm thấy tổng cộng ${incorrectWords.length} từ vựng bị lỗi nghĩa.`);
  if (incorrectWords.length === 0) {
    console.log('Tất cả nghĩa từ vựng đều chuẩn xác!');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let dictionaryHits = 0;
  let aiFallbacks = 0;

  const tasks = incorrectWords.map((w, index) => async () => {
    // Stagger tasks to prevent spamming APIs simultaneously
    await new Promise(r => setTimeout(r, Math.random() * 500));
    
    const wordText = w.word;
    const pos = w.pos;
    const progress = `[${index + 1}/${incorrectWords.length}]`;
    
    console.log(`${progress} Đang sửa từ: "${wordText}" (${pos || ''})...`);
    
    let fixedMeaning: string | null = null;
    
    // 1. Try public Dictionary API + Google Translate
    const def = await fetchDictionaryDefinition(wordText);
    if (def && def.toLowerCase() !== wordText.toLowerCase() && !hasVietnameseTones(def)) {
      const translated = await translateText(def);
      if (translated && translated !== def) {
        fixedMeaning = `${def} /// ${translated}`;
        dictionaryHits++;
      }
    }
    
    // 2. Fall back to Llama 3.1 8B AI if Dictionary API fails or returns invalid result
    if (!fixedMeaning) {
      console.log(`  [AI Fallback] Gọi Llama cho: "${wordText}"...`);
      fixedMeaning = await fixWordMeaningWithAI(wordText, pos);
      if (fixedMeaning) {
        aiFallbacks++;
        // Add a small extra delay after AI call to respect rate limits
        await new Promise(r => setTimeout(r, 1500));
      }
    }
    
    if (fixedMeaning) {
      try {
        await prisma.word.update({
          where: { id: w.id },
          data: { meaning_vi: fixedMeaning }
        });
        successCount++;
        console.log(`  ✓ Đã sửa: "${wordText}" -> "${fixedMeaning}"`);
      } catch (dbErr: any) {
        failCount++;
        console.error(`  ✗ Lỗi lưu DB cho "${wordText}":`, dbErr.message || dbErr);
      }
    } else {
      failCount++;
      console.error(`  ✗ Thất bại sửa đổi cho "${wordText}"`);
    }
  });

  console.log('\nKhởi động tiến trình sửa đổi song song (Concurrency Limit: 4)...');
  const startTime = Date.now();
  
  await runWithConcurrencyLimit(tasks, 4);
  
  const endTime = Date.now();
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('HOÀN THÀNH TIẾN TRÌNH SỬA LỖI NGHĨA TỪ VỰNG');
  console.log(`Thời gian thực hiện: ${durationSeconds} giây (khoảng ${(Number(durationSeconds)/60).toFixed(1)} phút)`);
  console.log(`Số từ sửa thành công: ${successCount}`);
  console.log(`- Từ Dictionary API + Translate: ${dictionaryHits}`);
  console.log(`- Từ Llama AI Fallback: ${aiFallbacks}`);
  console.log(`Số từ thất bại: ${failCount}`);
  console.log('========================================');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
