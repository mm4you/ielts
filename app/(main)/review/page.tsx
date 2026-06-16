'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Word, ReviewRating, RATING_LABELS } from '@/types';
import { calculateSRS } from '@/lib/srs';

export default function ReviewPage() {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch('/api/review');
      const data = await res.json();
      setWords(data);
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleRating = async (rating: ReviewRating) => {
    const word = words[currentIndex];
    const srsData = calculateSRS(
      rating,
      word.ease_factor,
      word.interval_days,
      word.repetition_count
    );

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + srsData.interval_days);

    try {
      // Background update
      fetch(`/api/words/${word.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...srsData,
          next_review_date: nextDate.toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to update word:', error);
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } else {
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)] font-bold text-xl animate-pulse">Đang tải thẻ học...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="panel text-center py-20 max-w-2xl mx-auto mt-10">
        <h2 className="text-3xl font-serif mb-4">Hoàn thành!</h2>
        <p className="text-[var(--muted)] mb-8 font-bold">Bạn đã học xong tất cả các từ cần ôn tập hôm nay.</p>
        <button onClick={() => router.push('/library')} className="btn-brutal bg-[var(--yellow)]">
          Khám phá thư viện
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full px-4">
      <div className="flex items-center justify-between mb-4 font-bold text-[var(--ink)]">
        <span>Thẻ {currentIndex + 1} / {words.length}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      <div className="w-full h-4 bg-[var(--paper)] border-[3px] border-[var(--line)] rounded-full mb-10 overflow-hidden shadow-[2px_2px_0_var(--line)]">
        <div
          className="h-full bg-[var(--green)] border-r-[3px] border-[var(--line)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="panel min-h-[400px] flex flex-col justify-center items-center text-center mb-8 relative">
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="chip bg-[var(--yellow)]">{currentWord.level}</span>
          <span className="chip">{currentWord.topic}</span>
        </div>
        
        <h2 className="text-5xl md:text-6xl font-serif font-bold text-[var(--ink)] mb-4 mt-8">
          {currentWord.word}
        </h2>
        
        {currentWord.ipa && (
          <p className="text-xl text-[var(--muted)] mb-8 font-mono bg-gray-100 px-4 py-1 rounded-md border-2 border-[var(--line)]">
            {currentWord.ipa}
          </p>
        )}

        {showMeaning ? (
          <div className="w-full max-w-xl text-left border-t-[3px] border-dashed border-[var(--line)] pt-4 mb-4">
            <p className="text-2xl font-bold whitespace-pre-line text-left">{currentWord.meaning_vi}</p>
            
            {currentWord.example && (
              <>
                <h3 className="text-lg font-bold mb-2 text-[var(--green)] mt-6">Ví dụ:</h3>
                <p className="text-lg text-[var(--muted)] font-serif italic border-l-4 border-[var(--yellow)] pl-4">
                  "{currentWord.example}"
                </p>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowMeaning(true)}
            className="btn-brutal bg-[var(--ink)] text-white text-xl px-10 py-4 mt-10"
          >
            Hiện đáp án
          </button>
        )}
      </div>

      {showMeaning && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <button onClick={() => handleRating('forgot')} className="btn-brutal bg-[var(--red)] text-white">Lại</button>
          <button onClick={() => handleRating('hard')} className="btn-brutal bg-[var(--yellow)] text-[var(--ink)]">Khó</button>
          <button onClick={() => handleRating('good')} className="btn-brutal bg-[var(--blue)] text-white">Tốt</button>
          <button onClick={() => handleRating('easy')} className="btn-brutal bg-[var(--green)] text-white">Dễ</button>
        </div>
      )}
    </div>
  );
}