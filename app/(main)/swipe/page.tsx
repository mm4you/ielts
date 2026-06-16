'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Word, LEVELS } from '@/types';
import { parseMeaning } from '@/lib/parse';

export default function SwipePage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);

  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedLimit, setSelectedLimit] = useState<string>('50');

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setGameState('playing');
    try {
      const res = await fetch(`/api/swipe?level=${selectedLevel}&limit=${selectedLimit}`);
      const data = await res.json();
      if (res.status === 401 || data.error) {
        setWords([]);
        return;
      }
      setWords(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedLimit]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (swipeDirection !== null) return;
    
    setSwipeDirection(direction);
    const word = words[currentIndex];

    // Background update
    if (direction === 'right') {
      // User knows the word -> Mark as easy / high interval
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 30); // push 30 days into future
      fetch(`/api/words/${word.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ease_factor: 2.5,
          interval_days: 30,
          repetition_count: 5,
          next_review_date: nextDate.toISOString(),
        }),
      });
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeDirection(null);
      setShowMeaning(false);
    }, 400); // Wait for animation
  };

  if (gameState === 'setup') {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <h2 className="text-3xl font-serif font-black uppercase mb-4">Lọc thẻ từ mới</h2>
          <p className="text-[var(--muted)] font-bold mb-8">Hôm nay bạn muốn học ở mức độ nào?</p>
          
          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--blue)] transition-shadow mb-4 appearance-none cursor-pointer text-center text-lg"
          >
            <option value="all">Tất cả mức độ</option>
            {LEVELS.map(l => <option key={l} value={l}>Mức độ {l}</option>)}
          </select>

          <p className="text-[var(--muted)] font-bold mb-4">Số lượng từ muốn học?</p>
          
          <select 
            value={selectedLimit}
            onChange={(e) => setSelectedLimit(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--blue)] transition-shadow mb-8 appearance-none cursor-pointer text-center text-lg"
          >
            <option value="10">10 từ</option>
            <option value="20">20 từ</option>
            <option value="50">50 từ</option>
            <option value="100">100 từ</option>
            <option value="200">200 từ</option>
          </select>

          <button onClick={fetchWords} className="w-full btn-brutal bg-[var(--blue)] text-white py-4 text-xl uppercase">
            Bắt đầu học
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)] font-bold text-xl animate-pulse">Đang tải thẻ...</p>
      </div>
    );
  }

  if (!words || words.length === 0 || currentIndex >= words.length) {
    return (
      <div className="panel text-center py-20 max-w-2xl mx-auto mt-10">
        <h2 className="text-3xl font-serif mb-4">Bạn chưa đăng nhập hoặc hết thẻ!</h2>
        <p className="text-[var(--muted)] mb-8 font-bold">Vui lòng đăng nhập để bắt đầu học, hoặc bạn đã quẹt hết thẻ chưa học.</p>
        <button onClick={() => router.push('/review')} className="btn-brutal bg-[var(--blue)] text-white">
          Đi tới Ôn tập
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const nextWord = words[currentIndex + 1];

  return (
    <div className="max-w-md mx-auto w-full relative min-h-[500px]">
      <div className="flex justify-between font-bold mb-4">
        <span>Thẻ {currentIndex + 1} / {words.length}</span>
        <span className="text-[var(--muted)]">Vuốt để phân loại</span>
      </div>

      <div className="relative w-full h-[450px]">
        {/* Next Card (Background) */}
        {nextWord && (
          <div className="absolute inset-0 panel flex flex-col justify-center items-center text-center shadow-[4px_4px_0_var(--line)] scale-95 opacity-50 translate-y-4">
            <h2 className="text-4xl font-serif font-bold opacity-50 blur-[2px]">{nextWord.word}</h2>
          </div>
        )}

        {/* Current Card (Foreground) */}
        <div 
          onClick={() => setShowMeaning(true)}
          className={`absolute inset-0 panel flex flex-col items-center text-center shadow-[8px_8px_0_var(--line)] bg-[var(--paper)] z-10 transition-transform duration-300 cursor-pointer overflow-y-auto overflow-x-hidden ${!showMeaning ? 'justify-center' : 'pt-16'} ${
            swipeDirection === 'left' ? '-translate-x-[120%] -rotate-12 opacity-0' :
            swipeDirection === 'right' ? 'translate-x-[120%] rotate-12 opacity-0' : ''
          }`}
        >
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="chip bg-[var(--yellow)]">{currentWord.level}</span>
          </div>

          <h2 className="text-5xl font-serif font-bold text-[var(--ink)] mb-4">{currentWord.word}</h2>
          {currentWord.ipa && (
            <p className="text-lg text-[var(--muted)] mb-6 font-mono bg-gray-100 px-4 py-1 rounded-md border-2 border-[var(--line)]">
              {currentWord.ipa}
            </p>
          )}

          {showMeaning ? (
            <div className="w-full max-w-xl text-left border-t-[3px] border-dashed border-[var(--line)] pt-6 mt-8 animate-fade-in flex flex-col items-center">
              {(() => {
                const { pos, en, vi } = parseMeaning(currentWord.meaning_vi, currentWord.pos);
                return (
                  <div className="text-center px-2">
                    {pos && (
                      <span className="inline-block bg-[var(--blue)] text-white text-xs font-bold px-2 py-1 rounded-md mb-2 shadow-[2px_2px_0_var(--ink)]">
                        {pos}
                      </span>
                    )}
                    <p className="text-xl font-bold text-[var(--ink)] mb-2 leading-tight">{en}</p>
                    {vi && <p className="text-base font-bold text-[var(--muted)]">{vi}</p>}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="border-t-2 border-dashed border-[var(--line)] pt-4 w-full flex justify-center items-center h-[100px]">
              <p className="text-[var(--muted)] font-bold animate-pulse">Bấm vào thẻ để xem nghĩa</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-12 mt-12 relative z-20">
        <button 
          onClick={() => handleSwipe('left')}
          className="w-24 h-24 rounded-full border-[4px] border-[var(--red)] flex items-center justify-center text-5xl text-[var(--red)] bg-[var(--paper)] shadow-[6px_6px_0_var(--red)] hover:translate-y-1 hover:shadow-[2px_2px_0_var(--red)] transition-all active:scale-95"
          aria-label="Học lại"
        >
          <span className="-mt-1">✖</span>
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="w-24 h-24 rounded-full border-[4px] border-[var(--green)] flex items-center justify-center text-6xl text-[var(--green)] bg-[var(--paper)] shadow-[6px_6px_0_var(--green)] hover:translate-y-1 hover:shadow-[2px_2px_0_var(--green)] transition-all active:scale-95"
          aria-label="Đã biết"
        >
          <span className="mt-2">♥</span>
        </button>
      </div>
    </div>
  );
}
