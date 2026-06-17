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
    // Dùng endpoint chính thức của Google Dictionary để bắt buộc đọc giọng tiếng Việt
    // client=dict-chrome-ex sẽ ưu tiên language flag tl=vi thay vì tự động đoán ngôn ngữ
    const url = `https://translate.googleapis.com/translate_tts?client=dict-chrome-ex&tl=vi&q=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    audio.play().catch(e => {
      console.error("Lỗi phát âm thanh:", e);
      setIsPlaying(false);
      alert("Trình duyệt chặn phát âm thanh tự động. Hãy bấm nút 'Nghe lại' nha!");
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
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
      setTranscribed('');
      setResult(null);
    };

    recognition.onresult = async (event: any) => {
      // Lấy danh sách các dự đoán (alternatives) của máy tính
      const results = event.results[0];
      let bestTranscript = results[0].transcript;
      const target = wordText.toLowerCase();

      // Duyệt qua 5 dự đoán, nếu có cái nào trùng khớp 100% với từ mục tiêu thì lấy cái đó (giúp máy thu âm "chính xác" và bao dung hơn)
      for (let i = 0; i < results.length; i++) {
        if (results[i].transcript.toLowerCase() === target) {
          bestTranscript = results[i].transcript;
          break;
        }
      }

      setTranscribed(bestTranscript);
      await evaluatePronunciation(bestTranscript);
    };

    recognition.onerror = (event: any) => {
      setError(`Lỗi Mic: ${event.error}`);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
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
    try {
      const res = await fetch(`/api/word/${wordId}/pronounce-roast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcribedText: speechResult })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi AI');
      
      setResult(data);
      // Đã tắt tự động phát âm thanh vì trình duyệt hay chặn
      // setTimeout(() => speakRoast(data.roast), 100);
      if (onFinish) onFinish();
    } catch (err: any) {
      setError(err.message);
    } finally {
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
              {isPlaying ? '🔊 Đang phát...' : '🔊 Nghe AI chửi'}
            </button>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap text-[var(--ink)]">{result.roast}</p>
        </div>
      )}
    </div>
  );
}
