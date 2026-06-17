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
}

export default function PronounceRoast({ wordId, wordText }: PronounceRoastProps) {
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
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.pitch = 0.6;
    utterance.rate = 1.1;

    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter(v => v.lang.toLowerCase().includes('vi'));
    if (viVoices.length > 0) {
      const maleVoice = viVoices.find(v => v.name.toLowerCase().includes('male'));
      utterance.voice = maleVoice || viVoices[0]; 
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
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
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setError('');
      setTranscribed('');
      setResult(null);
    };

    recognition.onresult = async (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setTranscribed(speechResult);
      await evaluatePronunciation(speechResult);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-4 border-black p-6 bg-[#f0f0f0] shadow-[8px_8px_0_rgba(0,0,0,1)] relative">
      <div className="absolute -top-4 -left-4 bg-black text-white px-3 py-1 font-black border-2 border-black rotate-[-3deg]">
        🎙️ CHẤM ĐIỂM PHÁT ÂM
      </div>

      <div className="text-center mb-6 pt-4">
        <p className="font-bold text-gray-700 mb-2">Hãy đọc to từ này vào Mic:</p>
        <h3 className="text-4xl font-black text-[#ff3b30] uppercase tracking-widest">{wordText}</h3>
      </div>

      <div className="flex justify-center mb-6">
        <button
          onClick={isRecording ? undefined : startRecording}
          className={`btn-brutal w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-[6px_6px_0_rgba(0,0,0,1)] transition-transform ${
            isRecording ? 'bg-red-500 animate-pulse scale-110 border-red-800 shadow-[2px_2px_0_#8b0000]' : 'bg-white hover:bg-gray-100 border-black hover:-translate-y-1'
          }`}
        >
          {isRecording ? '🔴' : '🎤'}
        </button>
      </div>

      {isRecording && (
        <p className="text-center font-bold text-red-600 animate-pulse">Đang nghe... Đọc lẹ lên má!</p>
      )}

      {transcribed && !isRecording && (
        <div className="bg-white border-2 border-dashed border-gray-400 p-3 text-center mb-4">
          <p className="text-sm text-gray-500 font-bold">Máy nghe ra chữ:</p>
          <p className="text-2xl font-black">{transcribed}</p>
        </div>
      )}

      {loading && (
        <div className="panel bg-[#fff3cd] border-[#ffc107] text-center">
          <p className="font-bold text-[#856404] animate-pulse">⏳ AI đang soi mói lỗi phát âm của bạn...</p>
        </div>
      )}

      {error && (
        <div className="panel bg-[#f8d7da] border-[#dc3545]">
          <p className="font-bold text-[#721c24] text-center">{error}</p>
        </div>
      )}

      {result && (
        <div className={`panel mt-4 border-4 shadow-[6px_6px_0_rgba(0,0,0,1)] ${result.score >= 80 ? 'bg-[#d4edda] border-[#28a745]' : 'bg-[#f8d7da] border-[#dc3545]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-black text-2xl">
              ĐIỂM: <span className={result.score >= 80 ? 'text-[#28a745]' : 'text-[#dc3545]'}>{result.score}/100</span>
            </h4>
            <button 
              onClick={() => speakRoast(result.roast)}
              className={`text-sm px-3 py-1 rounded border-2 border-black font-bold ${isPlaying ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'}`}
            >
              {isPlaying ? '🔊 Đang chửi...' : '🔊 Nghe lại'}
            </button>
          </div>
          <p className="font-bold text-lg leading-relaxed whitespace-pre-wrap">{result.roast}</p>
        </div>
      )}
    </div>
  );
}
