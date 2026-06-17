'use client';

import { useState, useEffect, useRef } from 'react';

// Hack for TypeScript to recognize Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface PronounceRoastProps {
  wordId: number;
  wordText: string;
  onFinish?: () => void;
}

export default function PronounceRoast({ wordId, wordText, onFinish }: PronounceRoastProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribed, setTranscribed] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ score: number; roast: string } | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load voices early
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speakRoast = (text: string) => {
    // Gọi qua Next.js API Proxy để tránh bị Google chặn CORS hoặc Referer
    const url = `/api/tts?text=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    // Tăng tốc độ giọng nói lên 1.35x cho có vẻ Gen Z nói nhanh, xéo xắt
    audio.playbackRate = 1.35;
    
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    audio.play().catch(e => {
      console.error("Audio proxy failed, falling back to Web Speech API:", e);
      if (window.speechSynthesis) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'vi-VN';
        utter.onend = () => setIsPlaying(false);
        utter.onerror = () => setIsPlaying(false);
        window.speechSynthesis.speak(utter);
      } else {
        setIsPlaying(false);
      }
    });
  };

  const startRecording = async () => {
    if (typeof window === 'undefined') return;
    
    // Unlock audio
    if (window.speechSynthesis) {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      window.speechSynthesis.speak(dummy);
    }

    try {
      setError('');
      setTranscribed('');
      setResult(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        // Tắt đèn đỏ trên tab trình duyệt
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
          setError('Không có âm thanh được ghi lại.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioWithWhisper(audioBlob);
      };

      mediaRecorder.start();

      // Tự động ngắt sau 7 giây nếu người dùng quên tắt
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 7000);

    } catch (err: any) {
      console.error('Lỗi truy cập Mic:', err);
      setError('Không thể truy cập Micro. Vui lòng cấp quyền trong trình duyệt nha sếp!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processAudioWithWhisper = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'audio.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi bóc băng Whisper');
      
      const text = data.text.trim();
      setTranscribed(text);
      
      if (!text) {
        throw new Error('Bạn chưa nói gì cả, nói to lên sếp ơi!');
      }

      await evaluatePronunciation(text);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  const evaluatePronunciation = async (speechResult: string) => {
    setLoading(true);
    
    // Giới hạn 6 giây cho API, nếu AI quá tải thì báo lỗi ngay thay vì treo
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const res = await fetch(`/api/word/${wordId}/pronounce-roast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcribedText: speechResult }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi AI');
      
      setResult(data);
      if (onFinish) onFinish();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('AI đang bận đi đẻ, sếp bấm nút Mic thử lại giùm nha!');
      } else {
        setError(err.message);
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-4 border-[var(--line)] p-6 bg-[var(--paper)] shadow-[8px_8px_0_var(--line)] relative">
      <div className="absolute -top-4 -left-4 bg-[var(--ink)] text-[var(--bg)] px-3 py-1 font-black border-2 border-[var(--line)] rotate-[-3deg]">
        🎙️ CHẤM ĐIỂM PHÁT ÂM <span className="text-xs text-[var(--red)] ml-2">v2.0</span>
      </div>

      <div className="text-center mb-6 pt-4 relative">
        <p className="font-bold text-[var(--muted)] mb-2">Hãy đọc to từ này vào Mic:</p>
        <div className="flex items-center justify-center gap-3">
          <h3 className="text-4xl font-black text-[var(--red)] uppercase tracking-widest">{wordText}</h3>
          <button 
            onClick={() => {
              if (!window.speechSynthesis) return;
              const utter = new SpeechSynthesisUtterance(wordText);
              utter.lang = 'en-US';
              window.speechSynthesis.speak(utter);
            }}
            className="text-2xl hover:scale-125 transition-transform"
            title="Nghe cách đọc chuẩn"
          >
            🔊
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`btn-brutal w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[6px_6px_0_var(--line)] transition-transform ${
            isRecording ? 'bg-[var(--red)] animate-pulse scale-110 border-[var(--line)] shadow-[2px_2px_0_var(--line)]' : 'bg-[var(--bg)] hover:brightness-95 border-[var(--line)] hover:-translate-y-1'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
      </div>

      {isRecording && (
        <p className="text-center font-bold text-red-600 animate-pulse">Đang nghe... Đọc lẹ lên má!</p>
      )}

      {isTranscribing && (
        <p className="text-center font-bold text-[var(--blue)] animate-pulse">Đang dùng siêu AI Whisper để bóc băng...</p>
      )}

      {transcribed && !isRecording && !isTranscribing && (
        <div className="bg-[var(--bg)] border-2 border-dashed border-[var(--muted)] p-3 text-center mb-4">
          <p className="text-sm text-[var(--muted)] font-bold">Máy nghe ra chữ:</p>
          <p className="text-2xl font-black text-[var(--ink)]">{transcribed}</p>
        </div>
      )}

      {loading && (
        <div className="panel bg-[var(--yellow)]/20 border-[var(--yellow)] text-center">
          <p className="font-bold text-[var(--yellow)] animate-pulse">⏳ AI đang soi mói lỗi phát âm của bạn...</p>
        </div>
      )}

      {error && (
        <div className="panel bg-[var(--red)]/20 border-[var(--red)]">
          <p className="font-bold text-[var(--red)] text-center">{error}</p>
        </div>
      )}

      {result && (
        <div className={`panel mt-4 border-4 shadow-[6px_6px_0_var(--line)] ${result.score >= 80 ? 'bg-[var(--green)]/20 border-[var(--green)]' : 'bg-[var(--red)]/20 border-[var(--red)]'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h4 className="font-black text-2xl">
              ĐIỂM: <span className={result.score >= 80 ? 'text-[var(--green)]' : 'text-[var(--red)]'}>{result.score}/100</span>
            </h4>
            <button 
              onClick={() => speakRoast(result.roast)}
              className={`text-sm px-3 py-1 rounded border-2 border-[var(--line)] font-bold w-full sm:w-auto ${isPlaying ? 'bg-[var(--ink)] text-[var(--bg)]' : 'bg-[var(--bg)] text-[var(--ink)] hover:brightness-95'}`}
            >
              {isPlaying ? '🔊 Đang la...' : '🔊 Nghe la'}
            </button>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap text-[var(--ink)]">{result.roast}</p>
        </div>
      )}
    </div>
  );
}
