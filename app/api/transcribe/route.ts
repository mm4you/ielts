import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Audio file size exceeds the 2MB limit' }, { status: 400 });
    }

    // Prepare Groq API request
    const groqFormData = new FormData();
    groqFormData.append('file', file, 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('temperature', '0');
    groqFormData.append('response_format', 'json');
    groqFormData.append('language', 'en'); // Bắt buộc nhận diện tiếng Anh để tránh dịch bậy

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq Whisper API Error:', err);
      return NextResponse.json({ error: `Groq Error: ${response.statusText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
