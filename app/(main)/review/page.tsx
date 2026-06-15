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
      await fetch(`/api/words/${word.id}`, {
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
      router.refresh();
      setCurrentIndex(0);
      setShowMeaning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)]">Đang tải...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)] mb-4">Không có từ nào cần ôn tập!</p>
        <button onClick={() => router.push('/library')} className="btn-secondary">
          Khám phá thư viện
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-[var(--muted)]">
          {currentIndex + 1} / {words.length}
        </span>
        <span className="text-sm text-[var(--muted)]">{Math.round(progress)}%</span>
      </div>

      <div className="w-full h-1 bg-[var(--border)] rounded-full mb-8">
        <div
          className="h-full bg-[var(--primary)] rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="card text-center py-12 mb-6">
        <p className="text-4xl font-bold mb-2">{currentWord.word}</p>
        {currentWord.ipa && (
          <p className="text-lg text-[var(--muted)] mb-4">{currentWord.ipa}</p>
        )}

        {showMeaning ? (
          <div className="mt-6 text-left">
            <p className="text-lg mb-4">{currentWord.meaning_vi}</p>
            {currentWord.example && (
              <p className="text-[var(--muted)] italic mb-2">Ví dụ:</p>
            )}
            {currentWord.example && (
              <p className="text-sm text-[var(--muted)]">"{currentWord.example}"</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowMeaning(true)}
            className="btn-secondary mt-4"
          >
            Hiện nghĩa
          </button>
        )}
      </div>

      {showMeaning && (
        <div className="grid grid-cols-4 gap-3">
          {(['forgot', 'hard', 'good', 'easy'] as ReviewRating[]).map((rating) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                rating === 'forgot'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : rating === 'hard'
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : rating === 'good'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {RATING_LABELS[rating]}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-center gap-4 text-xs text-[var(--muted)]">
        <span className="px-2 py-1 bg-gray-100 rounded">{currentWord.topic}</span>
        <span className="px-2 py-1 bg-gray-100 rounded">{currentWord.level}</span>
      </div>
    </div>
  );
}