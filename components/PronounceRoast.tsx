'use client';

import { useState, useEffect } from 'react';

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

  // Load voices early
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const speakRoast = (text: string) => {
    // Dùng Google Translate TTS để đảm bảo 100% ra giọng tiếng Việt chuẩn, không bị lỗi giọng Tây lơ lớ
    // Do AI đã được giới hạn cực ngắn nên không sợ bị quá limit ký tự của Google
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(text)}`;
    const audio = new Audio(url);
    
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    audio.play().catch(e => {
      console.error("Lỗi phát âm thanh:", e);
      setIsPlaying(false);
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
      setTimeout(() => speakRoast(data.roast), 100);
      if (onFinish) onFinish();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-4 border-black dark:border-white p-6 bg-[#f0f0f0] dark:bg-gray-800 shadow-[8px_8px_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_rgba(255,255,255,1)] relative">
      <div className="absolute -top-4 -left-4 bg-black dark:bg-white text-white dark:text-black px-3 py-1 font-black border-2 border-black dark:border-white rotate-[-3deg]">
        🎙️ CHẤM ĐIỂM PHÁT ÂM
      </div>

      <div className="text-center mb-6 pt-4">
        <p className="font-bold text-gray-700 dark:text-gray-300 mb-2">Hãy đọc to từ này vào Mic:</p>
        <h3 className="text-4xl font-black text-[#ff3b30] uppercase tracking-widest">{wordText}</h3>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? undefined : startRecording}
          className={`btn-brutal w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[6px_6px_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_rgba(255,255,255,1)] transition-transform ${
            isRecording ? 'bg-red-500 animate-pulse scale-110 border-red-800 shadow-[2px_2px_0_#8b0000] dark:shadow-[2px_2px_0_#ff3b30]' : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-black dark:border-white hover:-translate-y-1'
          }`}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
      </div>

      {isRecording && (
        <p className="text-center font-bold text-red-600 animate-pulse">Đang nghe... Đọc lẹ lên má!</p>
      )}

      {transcribed && !isRecording && (
        <div className="bg-white dark:bg-gray-700 border-2 border-dashed border-gray-400 dark:border-gray-500 p-3 text-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Máy nghe ra chữ:</p>
          <p className="text-2xl font-black dark:text-white">{transcribed}</p>
        </div>
      )}

      {loading && (
        <div className="panel bg-[#fff3cd] dark:bg-yellow-900 border-[#ffc107] dark:border-yellow-500 text-center">
          <p className="font-bold text-[#856404] dark:text-yellow-200 animate-pulse">⏳ AI đang soi mói lỗi phát âm của bạn...</p>
        </div>
      )}

      {error && (
        <div className="panel bg-[#f8d7da] dark:bg-red-900 border-[#dc3545] dark:border-red-500">
          <p className="font-bold text-[#721c24] dark:text-red-200 text-center">{error}</p>
        </div>
      )}

      {result && (
        <div className={`panel mt-4 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_rgba(255,255,255,1)] ${result.score >= 80 ? 'bg-[#d4edda] dark:bg-green-900 border-[#28a745] dark:border-green-500' : 'bg-[#f8d7da] dark:bg-red-900 border-[#dc3545] dark:border-red-500'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h4 className="font-black text-2xl">
              ĐIỂM: <span className={result.score >= 80 ? 'text-[#28a745] dark:text-green-400' : 'text-[#dc3545] dark:text-red-400'}>{result.score}/100</span>
            </h4>
            <button 
              onClick={() => speakRoast(result.roast)}
              className={`text-sm px-3 py-1 rounded border-2 border-black dark:border-white font-bold w-full sm:w-auto ${isPlaying ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white'}`}
            >
              {isPlaying ? '🔊 Đang chửi...' : '🔊 Nghe lại'}
            </button>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap dark:text-gray-100">{result.roast}</p>
        </div>
      )}
    </div>
  );
}
