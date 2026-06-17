'use client';

import { useState, useEffect } from 'react';
import RoastButton from '@/components/RoastButton';
import PronounceRoast from '@/components/PronounceRoast';

export default function RoastDemoPage() {
  const [wordData, setWordData] = useState<{ id: number; word: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRandomWord = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/word/random');
      if (res.ok) {
        const data = await res.json();
        setWordData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomWord();
  }, []);

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-black mb-6 uppercase border-b-4 border-black pb-2">
        🕵️‍♂️ THỬ THÁCH PHÁT ÂM (MINI GAME)
      </h1>
      
      <p className="mb-6 text-lg font-bold text-gray-700">
        Tính năng chọc ngoáy AI tự động lấy một từ vựng bất kỳ để thách thức bạn!
      </p>

      <div className="panel bg-[#f0f0f0] mb-8 text-center">
        <button 
          onClick={fetchRandomWord}
          disabled={loading}
          className={`btn-brutal px-8 py-3 text-xl font-black ${loading ? 'bg-gray-400' : 'bg-[#007bff] text-white hover:bg-blue-600'}`}
        >
          {loading ? '⏳ Đang xoay ru-lét...' : '🎲 ĐỔI TỪ KHÁC (RANDOM)'}
        </button>
      </div>

      {!loading && wordData && (
        <div className="space-y-8">
          <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4">1. Tính năng chấm điểm phát âm:</h2>
            <PronounceRoast key={`pronounce-${wordData.id}`} wordId={wordData.id} wordText={wordData.word} />
          </div>

          <div className="border-4 border-black p-6 bg-white shadow-[8px_8px_0_rgba(0,0,0,1)]">
            <h2 className="text-2xl font-black mb-4">2. (Test) Nút chửi tự động:</h2>
            <RoastButton key={`roast-${wordData.id}`} wordId={wordData.id} wordText={wordData.word} />
          </div>
        </div>
      )}
    </div>
  );
}
