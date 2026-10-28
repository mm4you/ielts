'use client';

import PracticeSetup from '@/components/PracticeSetup';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { Speaker2Regular } from '@fluentui/react-icons/svg/speaker';
import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReviewWord, ReviewRating, RATING_LABELS, LEVELS } from '@/types';
import { calculateSRS } from '@/lib/srs';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

export default function ReviewPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <ReviewContent />
    </Suspense>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';

  const [words, setWords] = useState<ReviewWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<'setup' | 'playing'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedLimit, setSelectedLimit] = useState<string>('50');

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Dừng phát âm khi chuyển từ khác
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, [currentIndex]);

  const handlePlayAudio = (wordText: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(`/api/tts?text=${encodeURIComponent(wordText)}&lang=en`);
    audioRef.current = audio;
    setIsPlaying(true);

    audio.play().catch(err => {
      console.warn("Audio play failed:", err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };

    audio.onerror = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
  };

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

    if (rating === 'forgot') {
      const updatedWord = {
        ...word,
        ease_factor: srsData.ease_factor,
        interval_days: srsData.interval_days,
        repetition_count: srsData.repetition_count,
      };
      setWords(prev => [...prev, updatedWord]);
    }

    const hasMore = rating === 'forgot' || currentIndex < words.length - 1;
    if (hasMore) {
      setCurrentIndex(currentIndex + 1);
      setShowMeaning(false);
    } else {
      router.push(exitRoute);
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
    return <PracticeSetup mode="review" title="Ôn tập từ vựng" rules={['Xem từ và thử nhớ nghĩa trước khi lật thẻ.','Đánh giá mức độ nhớ để lên lịch ôn tiếp theo.']} level={selectedLevel} onLevelChange={setSelectedLevel} onStart={fetchWords} exitRoute={exitRoute} loading={loading}><label className="setup-field">Số từ<select value={selectedLimit} onChange={e=>setSelectedLimit(e.target.value)}>{[10,20,50,100,200].map(value=><option key={value} value={String(value)}>{value} từ</option>)}</select></label></PracticeSetup>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingState label="Đang tải thẻ học" />
      </div>
    );
  }

  if (!words || words.length === 0) {
    return (
      <div className="panel text-center py-20 max-w-2xl mx-auto mt-10 relative border border-[var(--line)] ">
        <button
          onClick={() => router.push(exitRoute)}
          className="absolute top-4 right-4 w-8 h-8 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm"
          title={exitLabel}
         aria-label="Đóng">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></button>
        <h2 className="text-3xl font-sans mb-4">Bạn chưa đăng nhập hoặc đã học xong!</h2>
        <p className="text-[var(--muted)] mb-8 font-semibold">Vui lòng đăng nhập để theo dõi tiến trình học, hoặc khám phá thêm từ vựng mới trong Thư viện.</p>
        <button onClick={() => router.push('/library')} className="btn-brutal bg-[var(--yellow)] w-full max-w-xs mx-auto">
          Khám phá thư viện
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full px-2 md:px-4 py-4 md:py-8 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between font-semibold mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border border-[var(--line)] rounded-xl items-center gap-4">
        <div className="flex-1 flex justify-between items-center mr-4">
          <span>Thẻ {currentIndex + 1} / {words.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <button
          onClick={() => router.push(exitRoute)}
          className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title="Thoát"
         aria-label="Thoát">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></button>
      </div>

      <div className="w-full h-3 md:h-4 bg-[var(--paper)] border border-[var(--line)] rounded-full mb-4 md:mb-10 overflow-hidden shrink-0">
        <div
          className="h-full bg-[var(--green)] border-r-[3px] border-[var(--line)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`panel flex-1 min-h-[250px] md:min-h-[400px] flex flex-col justify-center items-center text-center mb-4 md:mb-8 relative transition-all duration-300 ${!showMeaning ? 'cursor-pointer hover:-translate-y-2 ' : ''}`}
        onClick={() => { if (!showMeaning) setShowMeaning(true); }}
      >
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-[var(--brand-soft)] text-[var(--blue)] border border-[var(--line)] font-semibold text-[10px] px-2.5 py-0.5 rounded-md ">{currentWord.level}</span>
          <span className="chip">{currentWord.topic}</span>
        </div>
        <div className="absolute top-4 right-4">
          <SaveToCollection wordId={currentWord.id} wordText={currentWord.word} />
        </div>

        <div className="flex items-center gap-3 justify-center mb-4 relative z-20">
          <h2 className={`text-4xl md:text-6xl font-sans font-semibold text-[var(--ink)] ${showMeaning ? 'mt-8' : ''}`}>
            {currentWord.word}
          </h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handlePlayAudio(currentWord.word);
            }}
            className={`p-2 rounded-lg border border-[var(--line)] transition-all flex items-center justify-center cursor-pointer select-none ${isPlaying ? 'bg-[var(--green)] text-white translate-y-0.5 shadow-none' : 'bg-[var(--bg)] hover:bg-[var(--brand-soft)] text-[var(--blue)] active:shadow-none' }`}
            title="Phát âm"
          >
            {isPlaying ? (
              <Speaker2Regular aria-hidden="true" className="w-5 h-5 " />
            ) : (
              <Speaker2Regular aria-hidden="true" className="w-5 h-5" />
            )}
          </button>
        </div>

        {currentWord.ipa && (
          <p className="text-lg md:text-xl text-[var(--muted)] mb-4 md:mb-8 font-sans bg-[var(--bg)] px-4 py-1 rounded-md border border-[var(--line)]">
            {currentWord.ipa}
          </p>
        )}

        {showMeaning ? (
          <div className="w-full max-w-xl text-left border-t-[3px] border-solid border-[var(--line)] pt-4 md:pt-6 mt-2 animate-fade-in flex flex-col items-center">
            {(() => {
              const { pos, en, vi } = parseMeaning(currentWord.meaning_vi, currentWord.pos);
              return (
                <div className="mb-4 text-center">
                  {pos && (
                    <span className="inline-block bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] font-semibold text-sm px-3 py-1 rounded-md mb-3">
                      {pos}
                    </span>
                  )}
                  <p className="text-xl font-semibold text-[var(--ink)] mb-2 leading-tight break-words">{en}</p>
                  {vi && <p className="text-lg font-semibold text-[var(--muted)] break-words">{vi}</p>}
                </div>
              );
            })()}

            {(currentWord as any).example && (
              <div className="w-full mt-2 bg-[var(--bg)] border border-[var(--line)] rounded-xl p-3 text-left">
                <span className="font-semibold text-[var(--muted)] block mb-1 text-xs tracking-wide">Ví dụ ngữ cảnh:</span>
                {(() => {
                  const rawEx = (currentWord as any).example;
                  const separator = rawEx.includes('///') ? '///' : '|||';
                  const parts = rawEx.split(separator);
                  const exEn = parts[0]?.trim();
                  const exVi = parts[1]?.trim();
                  return (
                    <>
                      <p className="text-sm font-semibold text-[var(--ink)] font-sans italic">"{exEn}"</p>
                      {exVi && <p className="text-xs text-[var(--muted)] mt-1">{exVi}</p>}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="absolute bottom-8 text-[var(--muted)] font-semibold text-lg animate-pulse">
            Bấm vào thẻ để xem nghĩa
          </div>
        )}
      </div>

      {showMeaning && (
        <div className="w-full flex flex-col gap-3 mt-4 md:mt-8 animate-fade-in shrink-0">
          <p className="text-center text-[10px] md:text-xs font-sans font-semibold text-[var(--muted)]">
            Chọn mức độ ghi nhớ của bạn để thuật toán xếp lịch học tiếp theo:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <button onClick={() => handleRating('forgot')} className="btn-brutal bg-[var(--red)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Lại</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 text-center leading-tight">Quên sạch</span>
              <span className="text-[9px] md:text-[10px] font-sans mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('forgot')}</span>
            </button>
            <button onClick={() => handleRating('hard')} className="btn-brutal bg-[var(--brand-soft)] text-[var(--blue)] flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Khó</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 text-center leading-tight">Nhớ mang máng</span>
              <span className="text-[9px] md:text-[10px] font-sans mt-1.5 opacity-90 bg-black/5 px-2 py-0.5 rounded-full">{getIntervalPreview('hard')}</span>
            </button>
            <button onClick={() => handleRating('good')} className="btn-brutal bg-[var(--blue)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Tốt</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 text-center leading-tight">Nhớ rõ</span>
              <span className="text-[9px] md:text-[10px] font-sans mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('good')}</span>
            </button>
            <button onClick={() => handleRating('easy')} className="btn-brutal bg-[var(--green)] text-white flex flex-col items-center justify-center py-2 md:py-3 cursor-pointer">
              <span className="text-lg md:text-2xl">Dễ</span>
              <span className="text-[10px] md:text-xs font-normal opacity-90 mt-1 text-center leading-tight">Quá quen thuộc</span>
              <span className="text-[9px] md:text-[10px] font-sans mt-1.5 opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{getIntervalPreview('easy')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}