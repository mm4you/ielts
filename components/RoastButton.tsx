'use client';

import { useState } from 'react';

interface RoastButtonProps {
  wordId: number;
  wordText: string;
}

export default function RoastButton({ wordId, wordText }: RoastButtonProps) {
  const [loading, setLoading] = useState(false);
  const [roastData, setRoastData] = useState<{ roast: string; example: string; example_vi: string } | null>(null);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const speakRoast = (text: string) => {
    if (!window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.pitch = 0.6; // Giọng trầm xuống nghe nam tính/khịa hơn
    utterance.rate = 1.1; // Hơi nhanh xíu cho giống Gen Z

    const voices = window.speechSynthesis.getVoices();
    const viVoices = voices.filter(v => v.lang.includes('vi'));
    if (viVoices.length > 0) {
      // Ưu tiên chọn giọng nam nếu có (thường giọng Google Nam hoặc cứ lấy giọng vi đầu tiên)
      utterance.voice = viVoices[0]; 
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleRoast = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/word/${wordId}/roast`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi kết nối AI');
      }
      setRoastData(data);
      // Đọc lên ngay sau khi có kết quả
      speakRoast(data.roast);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      {!roastData && !loading && (
        <button
          onClick={handleRoast}
          className="btn-brutal w-full bg-[#ff3b30] text-white py-3 px-4 shadow-[4px_4px_0_#8b0000] hover:shadow-[6px_6px_0_#8b0000] border-[#8b0000] text-lg flex items-center justify-center gap-2"
        >
          🔥 Chọc ngoáy AI (Roast Me)
        </button>
      )}

      {loading && (
        <div className="panel bg-[#fff3cd] border-[#ffc107] shadow-[4px_4px_0_#ffc107] animate-pulse">
          <p className="font-bold text-[#856404] flex items-center gap-2">
            <span className="animate-spin text-xl">⏳</span> AI đang xắn tay áo lên gõ phím chửi... chờ xíu má!
          </p>
        </div>
      )}

      {error && (
        <div className="panel bg-[#f8d7da] border-[#dc3545] shadow-[4px_4px_0_#dc3545]">
          <p className="font-bold text-[#721c24]">Ối dồi ôi lỗi cmnr: {error}</p>
        </div>
      )}

      {roastData && (
        <div className="panel bg-[#f8d7da] border-[#dc3545] shadow-[6px_6px_0_#dc3545] space-y-4 relative">
          <div className="absolute -top-4 -left-4 bg-[#dc3545] text-white px-3 py-1 font-black border-2 border-black rotate-[-5deg]">
            ⚠️ AI MỎ HỖN
          </div>
          
          <div className="pt-2">
            <h4 className="font-black text-xl mb-2 text-[#721c24] flex items-center justify-between">
              <span>Lời sấm truyền:</span>
              <button 
                onClick={() => speakRoast(roastData.roast)}
                className={`text-sm px-2 py-1 rounded border-2 border-[#721c24] ${isPlaying ? 'bg-[#721c24] text-white animate-pulse' : 'bg-transparent text-[#721c24] hover:bg-[#721c24] hover:text-white'}`}
              >
                {isPlaying ? '🔊 Đang chửi...' : '🔊 Nghe lại'}
              </button>
            </h4>
            <p className="text-[#721c24] leading-relaxed whitespace-pre-wrap">{roastData.roast}</p>
          </div>

          <div className="bg-white/50 p-4 border-2 border-[#dc3545] border-dashed">
            <h4 className="font-black text-sm mb-1 text-[#dc3545]">VÍ DỤ DRAMA:</h4>
            <p className="font-bold text-black mb-1">{roastData.example}</p>
            <p className="text-sm text-[#721c24] italic">👉 {roastData.example_vi}</p>
          </div>
          
          <button 
            onClick={handleRoast}
            className="text-xs font-bold underline text-[#dc3545] hover:text-black mt-2"
          >
            Chửi chưa đã? Khịa lại câu khác xem!
          </button>
        </div>
      )}
    </div>
  );
}
