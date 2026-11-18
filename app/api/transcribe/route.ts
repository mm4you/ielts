import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { VOICE_CONSENT_VERSION } from '@/lib/privacy';
import { recordingExtension } from '@/lib/pronunciation';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Bạn cần đăng nhập để gửi bản thu.' }, { status: 401 });
    }

    if (request.headers.get('x-voice-consent') !== VOICE_CONSENT_VERSION) {
      return NextResponse.json({ error: 'Bạn cần xác nhận gửi bản thu để nhận diện.' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Nhận diện lời đọc đang tạm thời không khả dụng.' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: 'Bạn chưa gửi bản thu.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bản thu vượt quá 2 MB.' }, { status: 400 });
    }

    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.' + recordingExtension(file.type));
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('temperature', '0');
    groqFormData.append('response_format', 'json');
    groqFormData.append('language', 'en'); // Bắt buộc nhận diện tiếng Anh để tránh dịch bậy

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: groqFormData,
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(30000)])
    });

    if (!response.ok) {
      console.error('Groq transcription failed', response.status);
      return NextResponse.json({ error: 'Chưa nhận diện được bản thu. Bạn thử lại nhé.' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error('Transcription error:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: 'Chưa gửi được bản thu. Bạn thử lại nhé.' }, { status: 500 });
  }
}
