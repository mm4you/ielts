'use client';

import { useState, useEffect } from 'react';
import PronounceRoast from '@/components/PronounceRoast';

export default function RoastDemoPage() {
  const [wordData, setWordData] = useState<{ id: number; word: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRandomWord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/word/random?level=${level}`);
      const data = await res.json();
      if (res.ok) {
        setWordData(data);
      } else {
        setErrorMsg(data.error || 'Lỗi lấy từ vựng');
        setWordData(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when level changes or component mounts
  useEffect(() => {
    fetchRandomWord();
  }, [level]);

  const CEFR_LEVELS = ['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl text-black dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-black mb-6 uppercase border-b-4 border-black dark:border-white pb-2 flex items-center gap-3">
        🎙️ THỬ THÁCH PHÁT ÂM
        <span className="bg-yellow-400 text-black text-sm px-2 py-1 border-2 border-black rotate-[-5deg]">BETA</span>
      </h1>
      
      <p className="mb-6 text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300">
        AI "Mỏ Hỗn" sẽ chấm điểm và nhận xét trình độ phát âm tiếng Anh của bạn!
      </p>

      <div className="panel bg-[#f0f0f0] dark:bg-gray-800 border-4 border-black dark:border-white shadow-[6px_6px_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_rgba(255,255,255,1)] mb-8 p-4 sm:p-6 text-center">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="font-bold text-lg">Chọn Độ Khó:</label>
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="input-brutal w-full sm:w-auto text-center font-bold dark:bg-gray-700 dark:text-white"
          >
            {CEFR_LEVELS.map(l => (
              <option key={l} value={l}>{l === 'ALL' ? 'Tất cả (Trộn lộn xộn)' : `Level ${l}`}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={fetchRandomWord}
          disabled={loading}
          className={`btn-brutal w-full sm:w-auto px-8 py-3 text-xl font-black ${loading ? 'bg-gray-400 dark:bg-gray-600' : 'bg-[#007bff] text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500'}`}
        >
          {loading ? '⏳ Đang xoay ru-lét...' : '🎲 ĐỔI TỪ KHÁC'}
        </button>
        {errorMsg && <p className="text-red-500 font-bold mt-4">{errorMsg}</p>}
      </div>

      {!loading && wordData && (
        <div className="space-y-8">
          <div className="border-4 border-black dark:border-white p-4 sm:p-6 bg-white dark:bg-gray-800 shadow-[8px_8px_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_rgba(255,255,255,1)]">
            <PronounceRoast 
              key={`pronounce-${wordData.id}`} 
              wordId={wordData.id} 
              wordText={wordData.word} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
