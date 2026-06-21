import fs from 'fs';
import path from 'path';

export function getApiKey(): string | null {
  let apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    try {
      const envFile = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
      const match = envFile.match(/NVIDIA_API_KEY="?([^"\n]+)"?/);
      if (match) apiKey = match[1];
    } catch (e) {}
  }
  return apiKey || null;
}

export interface GeneratedWordInfo {
  ipa: string;
  pos: string;
  meaning: string;
  example: string;
  synonyms: string;
}

export async function generateWordDetails(word: string): Promise<GeneratedWordInfo | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const prompt = `
Bạn là một giáo viên chuyên dạy IELTS. Hãy tạo thông tin chi tiết cho từ vựng tiếng Anh: "${word}".
Yêu cầu thông tin bao gồm:
1. Phiên âm IPA chuẩn Anh-Anh hoặc Anh-Mỹ kèm dấu gạch chéo (ví dụ: /əˈbɪl.ə.ti/).
2. Từ loại tiếng Việt (Danh từ, Động từ, Tính từ, Trạng từ, Giới từ, Cụm động từ, v.v.).
3. Nghĩa tiếng Anh ngắn gọn và nghĩa tiếng Việt tự nhiên dễ hiểu, phân tách bằng "///" (ví dụ: a system of wires or radio waves /// một hệ thống sử dụng sóng vô tuyến hoặc dây cáp).
4. Một ví dụ tiếng Anh chất lượng cao, thực tế cho kỳ thi IELTS, kèm theo dịch nghĩa tiếng Việt của ví dụ đó, phân tách bằng "///" (ví dụ: The internet is a vast network. /// Mạng internet là một mạng lưới rộng lớn.).
5. Các từ đồng nghĩa (synonyms) phân tách bằng dấu phẩy (tối đa 5 từ).

Hãy trả về đúng định dạng JSON dưới đây, không thêm bất kỳ văn bản giải thích nào khác:
{
  "ipa": "phiên âm",
  "pos": "từ loại",
  "meaning": "nghĩa tiếng Anh /// nghĩa tiếng Việt",
  "example": "ví dụ tiếng Anh /// ví dụ tiếng Việt",
  "synonyms": "từ đồng nghĩa 1, từ đồng nghĩa 2"
}
`;

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
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const aiText = data.choices?.[0]?.message?.content;
      if (aiText) {
        const parsed = JSON.parse(aiText.trim());
        return {
          ipa: parsed.ipa || '',
          pos: parsed.pos || 'Không xác định',
          meaning: parsed.meaning || '',
          example: parsed.example || '',
          synonyms: parsed.synonyms || ''
        };
      }
    }
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(`Error generating details for word ${word}:`, err);
    return null;
  }
}
