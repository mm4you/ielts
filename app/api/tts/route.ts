import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');

  if (!text) {
    return new NextResponse('Missing text parameter', { status: 400 });
  }

  try {
    const tts = new EdgeTTS({
      voice: 'vi-VN-HoaiMyNeural', // Giọng Nữ Miền Nam (Hoài My)
      lang: 'vi-VN'
    });

    // Tạo file tạm trong thư mục /tmp (được Vercel hỗ trợ cho serverless)
    const tmpFilePath = path.join('/tmp', `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`);
    
    await tts.ttsPromise(text, tmpFilePath);

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
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text)}`;
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
