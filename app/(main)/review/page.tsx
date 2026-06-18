'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReviewWord, ReviewRating, RATING_LABELS, LEVELS } from '@/types';
import { calculateSRS } from '@/lib/srs';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

export default function ReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <p className="text-xl font-bold animate-pulse">Đang tải cấu hình ôn tập...</p>
        </div>
      </div>
    }>
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedLimit, setSelectedLimit] = useState<string>('50');

  const fetchWords = useCallback(async () => {
    setLoading(true);
    setGameState('playing');
    try {
      const collectionParam = collectionId ? `&collectionId=${collectionId}` : '';
      const res = await fetch(`/api/review?level=${selectedLevel}&limit=${selectedLimit}${collectionParam}`);
      const data = await res.json();
      if (res.status === 401 || data.error) {
        setWords([]);
        return;
      }
      setWords(data);
    } catch (error) {
      console.error('Failed to fetch words:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedLevel, selectedLimit, collectionId]);

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
      // Background update word
      fetch(`/api/words/${word.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...srsData,
          next_review_date: nextDate.toISOString(),
        }),
      });

      // Background update activity
      fetch('/api/activity', { method: 'POST' });
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

  const getIntervalPreview = (rating: ReviewRating) => {
    const word = words[currentIndex];
    if (!word) return '';
    const nextSRS = calculateSRS(
      rating,
      word.ease_factor,
      word.interval_days,
      word.repetition_count
    );
    const days = nextSRS.interval_days;
    if (days <= 1) return 'Ôn: Ngày mai';
    return `Ôn: ${days} ngày nữa`;
  };

  if (gameState === 'setup') {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <h2 className="text-3xl font-serif font-black uppercase mb-4">Ôn Tập Từ Vựng</h2>
          <p className="text-[var(--muted)] font-bold mb-8">Bạn muốn ôn tập từ vựng ở mức độ nào?</p>
          
          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--blue)] transition-shadow mb-4 appearance-none cursor-pointer text-center text-lg"
          >
            <option value="all">Tất cả mức độ</option>
            {LEVELS.map(l => <option key={l} value={l}>Mức độ {l}</option>)}
          </select>

          <p className="text-[var(--muted)] font-bold mb-4">Số lượng từ muốn ôn tập?</p>
          
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

          <button onClick={fetchWords} className="w-full btn-brutal bg-[var(--green)] text-white py-4 text-xl uppercase shadow-[4px_4px_0_var(--ink)]">
            Bắt đầu ôn tập
          </button>
          <button onClick={() => router.push('/')} className="block mt-6 text-center text-[var(--muted)] font-bold hover:text-[var(--ink)] underline w-full uppercase text-sm transition-colors">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)] font-bold text-xl animate-pulse">Đang tải thẻ học...</p>
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="panel text-center py-20 max-w-2xl mx-auto mt-10">
        <h2 className="text-3xl font-serif mb-4">Bạn chưa đăng nhập hoặc đã học xong!</h2>
        <p className="text-[var(--muted)] mb-8 font-bold">Vui lòng đăng nhập để theo dõi tiến trình học, hoặc khám phá thêm từ vựng mới trong Thư viện.</p>
        <button onClick={() => router.push('/library')} className="btn-brutal bg-[var(--yellow)]">
          Khám phá thư viện
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full px-2 md:px-4 py-4 md:py-8 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between font-bold mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl items-center gap-4">
        <div className="flex-1 flex justify-between items-center mr-4">
          <span>Thẻ {currentIndex + 1} / {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <button 
          onClick={() => setGameState('setup')} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0"
          title="Dừng ôn tập"
        >
          X
        </button>
      </div>

      <div className="w-full h-3 md:h-4 bg-[var(--paper)] border-[3px] border-[var(--line)] rounded-full mb-4 md:mb-10 overflow-hidden shadow-[2px_2px_0_var(--line)] shrink-0">
        <div
          className="h-full bg-[var(--green)] border-r-[3px] border-[var(--line)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div 
        className={`panel flex-1 min-h-[250px] md:min-h-[400px] flex flex-col justify-center items-center text-center mb-4 md:mb-8 relative transition-all duration-300 ${!showMeaning ? 'cursor-pointer hover:-translate-y-2 hover:shadow-[12px_12px_0_var(--line)]' : ''}`}
        onClick={() => { if (!showMeaning) setShowMeaning(true); }}
      >
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="chip bg-[var(--yellow)]">{currentWord.level}</span>
          <span className="chip">{currentWord.topic}</span>
        </div>
        <div className="absolute top-4 right-4">
          <SaveToCollection wordId={currentWord.id} wordText={currentWord.word} />
        </div>
        
        <h2 className={`text-4xl md:text-6xl font-serif font-bold text-[var(--ink)] mb-4 ${showMeaning ? 'mt-8' : ''}`}>
          {currentWord.word}
        </h2>
        
        {currentWord.ipa && (
          <p className="text-lg md:text-xl text-[var(--muted)] mb-4 md:mb-8 font-mono bg-gray-100 px-4 py-1 rounded-md border-2 border-[var(--line)]">
            {currentWord.ipa}
          </p>
        )}

        {showMeaning ? (
          <div className="w-full max-w-xl text-left border-t-[3px] border-dashed border-[var(--line)] pt-4 md:pt-6 mt-2 animate-fade-in flex flex-col items-center">
            {(() => {
              const { pos, en, vi } = parseMeaning(currentWord.meaning_vi, currentWord.pos);
              return (
                <div className="mb-4 text-center">
                  {pos && (
                    <span className="inline-block bg-[var(--blue)] text-white text-sm font-bold px-3 py-1 rounded-md mb-3 shadow-[2px_2px_0_var(--ink)]">
                      {pos}
                    </span>
                  )}
                  <p className="text-xl font-bold text-[var(--ink)] mb-2 leading-tight break-words">{en}</p>
                  {vi && <p className="text-lg font-bold text-[var(--muted)] break-words">{vi}</p>}
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="absolute bottom-8 text-[var(--muted)] font-bold text-lg animate-pulse flex items-center gap-2">
            <span>👆</span> Bấm vào thẻ để xem nghĩa
          </div>
        )}
      </div>

      {showMeaning && (
        <div className="w-full flex flex-col gap-3 mt-4 md:mt-8 animate-fade-in shrink-0">
          <p className="text-center text-[10px] md:text-xs font-mono font-black uppercase text-[var(--muted)]">
            Chọn mức độ ghi nhớ của bạn để thuật toán xếp lịch học tiếp theo:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <button onClick={() => handleRating('forgot')} className="btn-brutal bg-[var(--red)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Lại</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 uppercase text-center leading-tight">Quên sạch</span>
              <span className="text-[9px] md:text-[10px] font-mono mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('forgot')}</span>
            </button>
            <button onClick={() => handleRating('hard')} className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Khó</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 uppercase text-center leading-tight">Nhớ mang máng</span>
              <span className="text-[9px] md:text-[10px] font-mono mt-1.5 opacity-90 bg-black/5 px-2 py-0.5 rounded-full">{getIntervalPreview('hard')}</span>
            </button>
            <button onClick={() => handleRating('good')} className="btn-brutal bg-[var(--blue)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Tốt</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 uppercase text-center leading-tight">Nhớ rõ</span>
              <span className="text-[9px] md:text-[10px] font-mono mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('good')}</span>
            </button>
            <button onClick={() => handleRating('easy')} className="btn-brutal bg-[var(--green)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Dễ</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 uppercase text-center leading-tight">Quá quen thuộc</span>
              <span className="text-[9px] md:text-[10px] font-mono mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('easy')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}