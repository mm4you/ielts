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
  const recognitionRef = useRef<any>(null);

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

  const startRecording = () => {
    if (typeof window === 'undefined') return;
    
    // Unlock audio
    if (window.speechSynthesis) {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      window.speechSynthesis.speak(dummy);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói. Hãy dùng Google Chrome!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    // Bật interimResults để máy quét liên tục từng âm tiết, giúp cực kỳ nhạy!
    recognition.interimResults = true; 
    recognition.maxAlternatives = 5;

    let hasEvaluated = false;
    let currentTranscript = '';

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
      setTranscribed('');
      setResult(null);
    };

    recognition.onresult = async (event: any) => {
      if (hasEvaluated) return;
      
      const target = wordText.toLowerCase();
      let bestTranscript = '';
      let isFinal = false;
      let isPerfectMatch = false;

      // Quét toàn bộ kết quả trả về (kể cả interim đang đoán)
      for (let i = 0; i < event.results.length; i++) {
        const resultItem = event.results[i];
        if (resultItem.isFinal) isFinal = true;
        
        // Quét 5 phương án dự đoán của mỗi kết quả
        for (let j = 0; j < resultItem.length; j++) {
          const rawText = resultItem[j].transcript.toLowerCase().trim();
          const cleanText = rawText.replace(/[^a-z0-9\s]/g, '');
          const cleanTarget = target.replace(/[^a-z0-9\s]/g, '');
          
          if (!bestTranscript) bestTranscript = resultItem[0].transcript; // Mặc định lấy cái đầu tiên
          
          if (cleanText === cleanTarget || rawText.includes(target)) {
            isPerfectMatch = true;
            bestTranscript = resultItem[j].transcript;
            break;
          }
        }
        if (isPerfectMatch) break;
      }

      currentTranscript = bestTranscript;
      setTranscribed(bestTranscript);

      // NẾU BẮT ĐƯỢC CHỮ CHUẨN 100% -> DỪNG NGAY LẬP TỨC! Cảm giác cực kỳ nhạy!
      // Hoặc nếu người dùng dừng nói (isFinal)
      if (isPerfectMatch || isFinal) {
        hasEvaluated = true;
        recognition.stop();
        await evaluatePronunciation(bestTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      // Bỏ qua lỗi no-speech nếu nó tự động ngắt
      if (event.error !== 'no-speech') {
        setError(`Lỗi Mic: ${event.error}`);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      
      // Nếu ngắt mà chưa chấm điểm (do bấm ngắt tay), thì lấy kết quả cuối cùng để chấm
      if (!hasEvaluated && currentTranscript) {
        hasEvaluated = true;
        evaluatePronunciation(currentTranscript);
      } else if (!hasEvaluated && !currentTranscript) {
        setError('Không nghe thấy gì. Bấm nút Mic nói to lên nha!');
      }
    };

    recognition.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
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
        🎙️ CHẤM ĐIỂM PHÁT ÂM
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
          className={`btn-brutal w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[6px_6px_0_var(--line)] transition-transform ${
            isRecording ? 'bg-[var(--red)] animate-pulse scale-110 border-[var(--line)] shadow-[2px_2px_0_var(--line)]' : 'bg-[var(--bg)] hover:brightness-95 border-[var(--line)] hover:-translate-y-1'
          }`}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
      </div>

      {isRecording && (
        <p className="text-center font-bold text-red-600 animate-pulse">Đang nghe... Đọc lẹ lên má!</p>
      )}

      {transcribed && !isRecording && (
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
