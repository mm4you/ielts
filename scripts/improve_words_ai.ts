process.env.IS_SCRIPT = 'true';
import { prisma } from '../lib/prisma';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env', override: false });
const apiKey = process.env.NVIDIA_API_KEY;

const ALLOWED_TOPICS = [
  'Academic',
  'Daily Update',
  'Education',
  'Environment',
  'Technology',
  'Health',
  'Crime',
  'Government',
  'Work',
  'Culture',
  'Globalization',
  'Gre', 'Sat', 'Gmat', 'Idioms', 'Phrasal verbs', 'Slang', 'Colloquial', 
  'Sports', 'Entertainment', 'Travel', 'Food', 'Cooking', 'Fashion',
  'Fitness', 'Hobby', 'Gaming', 'Internet', 'Marketing', 'Finance', 'Real estate',
  'Astronomy', 'Geology', 'Meteorology', 'Anthropology', 'Archaeology'
];

async function callNvidiaNIM(word: string, pos: string | null, meaning: string, currentTopic: string, attempt = 1): Promise<any> {
  const prompt = `
You are an IELTS vocabulary expert. For the following word, provide:
1. Its standard IPA pronunciation (e.g. /juːˈbɪk.wɪ.təs/).
2. A clear, contextual IELTS-style example sentence using the word, followed by " /// " and its natural Vietnamese translation.
3. The most fitting topic from the list of allowed topics below.

Word: "${word}"
Part of speech: "${pos || 'Unknown'}"
Meaning/Definition: "${meaning}"
Current Topic: "${currentTopic}"

Allowed Topics:
${ALLOWED_TOPICS.join(', ')}

Your response MUST be a valid JSON object with the following keys. Do not include any markdown formatting, backticks, or extra explanation. Just return the JSON object:
{
  "ipa": "IPA pronunciation",
  "example": "English example sentence /// Bản dịch tiếng Việt tự nhiên",
  "topic": "Selected Topic"
}
`.trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', { 
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      if (attempt <= 3) {
        console.warn(`  [Rate Limit] Bị giới hạn băng thông (429) cho "${word}". Chờ 15 giây trước khi thử lại lần ${attempt}/3...`);
        await new Promise(r => setTimeout(r, 15000));
        return callNvidiaNIM(word, pos, meaning, currentTopic, attempt + 1);
      }
    }

    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        // Strip markdown code block if present
        let jsonStr = content;
        if (jsonStr.startsWith('```')) {
          const match = jsonStr.match(/```(?:json)?([\s\S]*?)```/);
          if (match) {
            jsonStr = match[1].trim();
          }
        }
        return JSON.parse(jsonStr);
      }
    } else {
      console.error(`  [API Error] Lỗi gọi API cho "${word}":`, await response.text());
    }
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (attempt <= 3) {
      console.warn(`  [Lỗi mạng/Timeout] "${word}". Chờ 5 giây trước khi thử lại lần ${attempt}/3...`);
      await new Promise(r => setTimeout(r, 5000));
      return callNvidiaNIM(word, pos, meaning, currentTopic, attempt + 1);
    }
    console.error(`  [Thất bại hoàn toàn] "${word}":`, err.message || err);
  }
  return null;
}

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

  // Get limit from command line args if any (e.g. npm run ai:optimize -- all or 500)
  const args = process.argv.slice(2);
  const isAll = args.includes('all') || args.includes('--all');
  const limitArg = args.find(arg => !isNaN(Number(arg)));
  const maxWordsToProcess = isAll ? Infinity : (limitArg ? Number(limitArg) : 100);

  if (isAll) {
    console.log('Đang chạy chế độ liên tục (tối ưu TOÀN BỘ từ vựng còn thiếu)...');
  } else {
    console.log(`Đang quét database tìm các từ cần sửa/cập nhật (Giới hạn xử lý: ${maxWordsToProcess} từ)...`);
  }

  // Target words that:
  // - Have empty or null IPA
  // - Have empty or null example
  // - Have example that doesn't contain the '///' separator (English only)
  const allWords = await prisma.word.findMany({
    orderBy: { id: 'asc' }
  });

  const wordsToImprove = allWords.filter(w => {
    const needsIpa = !w.ipa || w.ipa.trim() === '';
    const needsExample = !w.example || w.example.trim() === '' || !w.example.includes('///');
    
    // We also want to fix the topic for any word that was randomly assigned,
    // but to avoid running 6000 calls, we target words that need IPA or example first.
    return needsIpa || needsExample;
  }).slice(0, maxWordsToProcess);

  console.log(`Tìm thấy ${wordsToImprove.length} từ cần cải thiện.`);
  if (wordsToImprove.length === 0) {
    console.log('Tất cả từ vựng đều đã có phiên âm và ví dụ dịch nghĩa!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  const tasks = wordsToImprove.map((w, index) => async () => {
    // Stagger start times slightly
    await new Promise(r => setTimeout(r, Math.random() * 800));
    
    const progress = `[${index + 1}/${wordsToImprove.length}]`;
    console.log(`${progress} Đang tối ưu từ: "${w.word}" (${w.pos || ''}) - Chủ đề hiện tại: ${w.topic}...`);

    const result = await callNvidiaNIM(w.word, w.pos, w.meaning_vi, w.topic);

    if (result && result.ipa && result.example && result.topic) {
      // Validate topic belongs to allowed topics
      let finalTopic = result.topic.trim();
      if (!ALLOWED_TOPICS.includes(finalTopic)) {
        // Fallback to Academic or closest match if AI returned invalid topic
        const matched = ALLOWED_TOPICS.find(t => t.toLowerCase() === finalTopic.toLowerCase());
        finalTopic = matched || 'Academic';
      }

      try {
        await prisma.word.update({
          where: { id: w.id },
          data: {
            ipa: result.ipa.trim(),
            example: result.example.trim(),
            topic: finalTopic
          }
        });
        successCount++;
        console.log(`  ✓ Cập nhật thành công: "${w.word}"`);
        console.log(`    + IPA: ${result.ipa}`);
        console.log(`    + Ví dụ: ${result.example}`);
        console.log(`    + Chủ đề mới: ${finalTopic}`);
      } catch (dbErr: any) {
        failCount++;
        console.error(`  ✗ Lỗi lưu DB cho "${w.word}":`, dbErr.message || dbErr);
      }
    } else {
      failCount++;
      console.error(`  ✗ AI không trả về đủ dữ liệu hợp lệ cho "${w.word}"`);
    }

    // Small delay to respect rate limit
    await new Promise(r => setTimeout(r, 1000));
  });

  const startTime = Date.now();
  
  // Run with concurrency limit of 5 to not exceed NVIDIA NIM rate limits
  await runWithConcurrencyLimit(tasks, 5);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================');
  console.log('HOÀN THÀNH TIẾN TRÌNH TỐI ƯU TỪ VỰNG');
  console.log(`Thời gian thực hiện: ${duration} giây`);
  console.log(`Số từ cập nhật thành công: ${successCount}`);
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
