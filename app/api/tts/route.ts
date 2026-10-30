import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';
import { tmpdir } from 'node:os';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const langParam = searchParams.get('lang') || 'vi';

  if (!text) {
    return new NextResponse('Missing text parameter', { status: 400 });
  }

  if (text.length > 200) {
    return new NextResponse('Text parameter exceeds maximum length of 200 characters', { status: 400 });
  }

  const isEn = langParam.toLowerCase() === 'en';
  const voice = isEn ? 'en-US-AvaNeural' : 'vi-VN-HoaiMyNeural';
  const lang = isEn ? 'en-US' : 'vi-VN';
  const fallbackLang = isEn ? 'en' : 'vi';

  try {
    const tts = new EdgeTTS({
      voice,
      lang
    });

    // Tạo file tạm trong thư mục /tmp (được Vercel hỗ trợ cho serverless)
    const tmpFilePath = path.join(tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2, 11)}.mp3`);
    
    // Set a timeout of 2.5 seconds for EdgeTTS to prevent API hang
    const ttsPromise = tts.ttsPromise(text, tmpFilePath);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise((_, reject) => {
      timer=setTimeout(() => reject(new Error('EdgeTTS Timeout')), 2500);
    });
    try { await Promise.race([ttsPromise, timeoutPromise]); }
    catch (error) {
      // A timed-out provider can finish later; clean up its eventual file too.
      void ttsPromise.finally(()=>{try{fs.unlinkSync(tmpFilePath);}catch{}}).catch(()=>{});
      throw error;
    } finally { clearTimeout(timer); }

    const buffer = fs.readFileSync(tmpFilePath);

    // Xóa file tạm sau khi đọc xong để giải phóng bộ nhớ
    try {
      fs.unlinkSync(tmpFilePath);
    } catch (e) {
      console.error('Failed to cleanup tmp file:', e);
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('TTS Proxy Error:', error);
    // Fallback về Google TTS nếu Edge bị lỗi
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${fallbackLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://translate.google.com/'
        }
      });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new NextResponse(arrayBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=31536000, immutable'
          }
        });
      }
    } catch (e) {
      console.error('Google TTS Fallback Error:', e);
    }

    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
