'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PronounceRoast from '@/components/PronounceRoast';

export default function RoastDemoPage() {
  const router = useRouter();
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
    <div className="container mx-auto p-4 sm:p-8 max-w-2xl text-[var(--ink)]">
      <div className="flex items-center justify-between mb-6 border-b-4 border-[var(--line)] pb-2">
        <h1 className="text-2xl sm:text-3xl font-black uppercase flex items-center gap-3">
          🎙️ THỬ THÁCH PHÁT ÂM
          <span className="bg-[var(--yellow)] text-[var(--ink)] text-sm px-2 py-1 border-2 border-[var(--line)] rotate-[-5deg]">BETA</span>
        </h1>
        <button 
          onClick={() => router.push('/')} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm md:text-base"
          title="Thoát"
        >
          X
        </button>
      </div>
      
      <p className="mb-6 text-base sm:text-lg font-bold text-[var(--muted)]">
        AI "Mỏ Hỗn" sẽ chấm điểm và nhận xét trình độ phát âm tiếng Anh của bạn!
      </p>

      <div className="panel bg-[var(--paper)] border-4 border-[var(--line)] shadow-[6px_6px_0_var(--line)] mb-8 p-4 sm:p-6 text-center">
        <div className="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <label className="font-bold text-lg text-[var(--ink)]">Chọn Độ Khó:</label>
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="input-brutal w-full sm:w-auto text-center font-bold bg-[var(--bg)] text-[var(--ink)] border-[var(--line)]"
          >
            {CEFR_LEVELS.map(l => (
              <option key={l} value={l}>{l === 'ALL' ? 'Tất cả (Trộn lộn xộn)' : `Level ${l}`}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={fetchRandomWord}
          disabled={loading}
          className={`btn-brutal w-full sm:w-auto px-8 py-3 text-xl font-black ${loading ? 'bg-[var(--muted)] text-[var(--paper)]' : 'bg-[var(--blue)] text-[var(--bg)] hover:brightness-110'}`}
        >
          {loading ? '⏳ Đang xoay ru-lét...' : 'ĐỔI TỪ KHÁC'}
        </button>
        {errorMsg && <p className="text-red-500 font-bold mt-4">{errorMsg}</p>}
      </div>

      {!loading && wordData && (
        <div className="space-y-8">
          <div className="border-4 border-[var(--line)] p-4 sm:p-6 bg-[var(--paper)] shadow-[8px_8px_0_var(--line)]">
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
