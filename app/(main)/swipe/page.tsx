'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Word } from '@/types';

export default function SwipePage() {
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    fetch('/api/swipe')
      .then(res => res.json())
      .then(data => {
        setWords(data);
        setLoading(false);
      });
  }, []);

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
    }, 400); // Wait for animation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)] font-bold text-xl animate-pulse">Đang tải thẻ...</p>
      </div>
    );
  }

  if (currentIndex >= words.length) {
    return (
      <div className="panel max-w-2xl mx-auto text-center py-20">
        <h2 className="text-4xl font-serif mb-4">Hết Thẻ!</h2>
        <p className="text-[var(--muted)] mb-8 font-bold">Bạn đã quẹt hết các thẻ của hôm nay.</p>
        <Link href="/" className="btn-brutal bg-[var(--yellow)]">Về Trang Chủ</Link>
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

      <div className="relative w-full h-[400px]">
        {/* Next Card (Background) */}
        {nextWord && (
          <div className="absolute inset-0 panel flex flex-col justify-center items-center text-center shadow-[4px_4px_0_var(--line)] scale-95 opacity-50 translate-y-4">
            <h2 className="text-4xl font-serif font-bold opacity-50 blur-[2px]">{nextWord.word}</h2>
          </div>
        )}

        {/* Current Card (Foreground) */}
        <div 
          className={`absolute inset-0 panel flex flex-col justify-center items-center text-center shadow-[8px_8px_0_var(--line)] bg-[var(--paper)] z-10 transition-transform duration-300 ${
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
          <div className="text-xl font-bold border-t-2 border-dashed border-[var(--line)] pt-4 w-full">
            {currentWord.meaning_vi}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-12 relative z-20">
        <button 
          onClick={() => handleSwipe('left')}
          className="flex-1 btn-brutal bg-[var(--red)] text-white text-xl py-4 flex flex-col items-center"
        >
          <span className="text-3xl mb-1">👈</span>
          <span>Học lại</span>
        </button>
        <button 
          onClick={() => handleSwipe('right')}
          className="flex-1 btn-brutal bg-[var(--green)] text-white text-xl py-4 flex flex-col items-center"
        >
          <span className="text-3xl mb-1">👉</span>
          <span>Đã biết</span>
        </button>
      </div>
    </div>
  );
}
