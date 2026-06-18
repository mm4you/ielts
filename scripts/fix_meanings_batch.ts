import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });

const prisma = new PrismaClient();
const apiKey = process.env.NVIDIA_API_KEY;

// Robust retry wrapper to handle Neon serverless cold starts
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 8, delayMs = 4000): Promise<T> {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.log(`\n[DB] Connection failed. Retrying in ${delayMs/1000}s... (${i+1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw lastError;
}

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

interface WordRecord {
  id: number;
  word: string;
  pos: string | null;
  meaning_vi: string;
}

async function fixBatchWithAI(batch: WordRecord[]): Promise<Map<string, string> | null> {
  const wordLines = batch.map((w, i) => `${i + 1}. ${w.word} (${w.pos || 'Không xác định'})`).join('\n');

  const prompt = `
    Bạn là một giáo viên chuyên dạy IELTS. Hãy đưa ra định nghĩa tiếng Anh gốc ngắn gọn, dễ hiểu và bản dịch tiếng Việt tự nhiên nhất cho danh sách các từ vựng sau:
    
    ${wordLines}

    Yêu cầu Format bắt buộc:
    Trả về đúng danh sách tương ứng, mỗi từ trên một dòng theo đúng format sau, không giải thích gì thêm, không chào hỏi, không thêm bất kỳ ký tự nào khác (không bọc trong dấu ngoặc hay ký hiệu khác):
    từ_vựng /// định nghĩa tiếng Anh /// dịch tiếng Việt
    
    Ví dụ:
    theoretical /// based on or related to theory rather than practice /// dựa trên lý thuyết, không dựa trên thực tế
    bureaucracy /// complex system of administration or management /// hệ thống quản lý hành chính phức tạp
  `;

  let attempts = 0;
  while (attempts < 3) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for batch

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
          const resultMap = new Map<string, string>();
          
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('///')) {
              const parts = trimmedLine.split('///');
              if (parts.length >= 3) {
                // Strip out numbering prefix like "1. ", "10. "
                const word = parts[0].replace(/^\d+\.\s*/, '').trim().toLowerCase();
                const enDef = parts[1].trim();
                const viTrans = parts[2].trim();
                resultMap.set(word, `${enDef} /// ${viTrans}`);
              }
            }
          }
          if (resultMap.size > 0) {
            return resultMap;
          }
        }
      } else {
        console.error(`AI Batch Error (HTTP ${res.status}):`, await res.text());
      }
    } catch (e: any) {
      console.error(`Attempt ${attempts} failed for batch:`, e.message || e);
    }
    // Delay before retry
    await new Promise(r => setTimeout(r, attempts * 3000));
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
  if (!apiKey) {
    console.error('Lỗi: Chưa cài đặt NVIDIA_API_KEY trong file .env');
    process.exit(1);
  }

  console.log('Quét database và phân tích từ vựng...');
  const words = await withRetry(() => prisma.word.findMany({
    orderBy: { id: 'asc' }
  }));

  const incorrectWords: WordRecord[] = [];

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

  const totalToFix = incorrectWords.length;
  console.log(`Tìm thấy tổng cộng ${totalToFix} từ vựng bị lỗi nghĩa.`);
  if (totalToFix === 0) {
    console.log('Tất cả nghĩa từ vựng đều chuẩn xác!');
    return;
  }

  const batchSize = 25;
  let successCount = 0;
  let failCount = 0;

  const totalBatches = Math.ceil(totalToFix / batchSize);
  console.log(`\nBắt đầu chạy sửa lỗi song song theo lô (mỗi lô ${batchSize} từ, tổng cộng ${totalBatches} lô)...`);

  const tasks = [];

  for (let i = 0; i < totalToFix; i += batchSize) {
    const batch = incorrectWords.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize) + 1;

    tasks.push(async () => {
      // Stagger start times to spread out API requests evenly
      await new Promise(resolve => setTimeout(resolve, (batchIndex - 1) * 3500));
      
      console.log(`\n--- BẮT ĐẦU LÔ [${batchIndex}/${totalBatches}] (Gồm ${batch.length} từ) ---`);
      
      const resultMap = await fixBatchWithAI(batch);

      if (resultMap) {
        await Promise.all(
          batch.map(async (w) => {
            const cleanWord = w.word.toLowerCase();
            const newMeaning = resultMap.get(cleanWord);
            
            if (newMeaning) {
              try {
                await withRetry(() => prisma.word.update({
                  where: { id: w.id },
                  data: { meaning_vi: newMeaning }
                }));
                successCount++;
              } catch (dbErr: any) {
                failCount++;
                console.error(`  ✗ Lỗi lưu DB cho "${w.word}":`, dbErr.message || dbErr);
              }
            } else {
              // Fuzzy match fallback
              let foundKey = '';
              for (const key of resultMap.keys()) {
                if (key.includes(cleanWord) || cleanWord.includes(key)) {
                  foundKey = key;
                  break;
                }
              }

              if (foundKey) {
                const fuzzyMeaning = resultMap.get(foundKey)!;
                try {
                  await withRetry(() => prisma.word.update({
                    where: { id: w.id },
                    data: { meaning_vi: fuzzyMeaning }
                  }));
                  successCount++;
                } catch (dbErr: any) {
                  failCount++;
                }
              } else {
                failCount++;
                console.warn(`  ⚠️ Lô [${batchIndex}]: AI bỏ sót từ: "${w.word}"`);
              }
            }
          })
        );
        console.log(`  ✓ LÔ [${batchIndex}/${totalBatches}] HOÀN THÀNH CẬP NHẬT`);
      } else {
        failCount += batch.length;
        console.error(`  ✗ LÔ [${batchIndex}/${totalBatches}] THẤT BẠI GỌI AI`);
      }
    });
  }

  console.log('\nKhởi động tiến trình sửa đổi song song (Concurrency Limit: 3)...');
  const startTime = Date.now();
  
  await runWithConcurrencyLimit(tasks, 3);
  
  const endTime = Date.now();
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);

  console.log('\n========================================');
  console.log('HOÀN THÀNH TIẾN TRÌNH SỬA LỖI NGHĨA TỪ VỰNG THEO LÔ');
  console.log(`Tổng số từ đã quét sửa: ${totalToFix}`);
  console.log(`Thời gian thực hiện: ${durationSeconds} giây (khoảng ${(Number(durationSeconds)/60).toFixed(1)} phút)`);
  console.log(`Thành công: ${successCount}`);
  console.log(`Thất bại: ${failCount}`);
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
