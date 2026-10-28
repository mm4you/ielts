'use client';

import GameResult from '@/components/GameResult';
import PracticeSetup from '@/components/PracticeSetup';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { GridRegular } from '@fluentui/react-icons/svg/grid';
import { ArrowSwapRegular } from '@fluentui/react-icons/svg/arrow-swap';
import { TrophyRegular } from '@fluentui/react-icons/svg/trophy';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Word, LEVELS } from '@/types';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

interface Card {
  id: string; // unique card id
  wordId: number; // to check match
  type: 'en' | 'vi';
  content: string;
}

export default function MatchPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <MatchContent />
    </Suspense>
  );
}

function MatchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';

  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedIndices, setMatchedIndices] = useState<number[]>([]);
  const [mismatchIndices, setMismatchIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [playedWords, setPlayedWords] = useState<Word[]>([]);

  const fetchAndSetupCards = async () => {
    try {
      const collectionParam = collectionId ? `&collectionId=${collectionId}` : '';
      const res = await fetch(`/api/match?level=${selectedLevel}${collectionParam}`);
      const data: Word[] = await res.json();
      if (data.length > 0) {
        setPlayedWords(data);
        const generatedCards: Card[] = [];
        data.forEach(word => {
          const { en, vi } = parseMeaning(word.meaning_vi, word.pos);

          generatedCards.push({
            id: `en-${word.id}`,
            wordId: word.id,
            type: 'en',
            content: word.word
          });

          generatedCards.push({
            id: `vi-${word.id}`,
            wordId: word.id,
            type: 'vi',
            content: vi || en // Fallback if no vietnamese
          });
        });

        // Shuffle cards
        const shuffled = generatedCards.sort(() => 0.5 - Math.random());
        setCards(shuffled);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = async () => {
    setGameState('playing');
    setMoves(0);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setMismatchIndices([]);
    await fetchAndSetupCards();
  };

  const handleCardClick = (index: number) => {
    if (isLocked) return;
    if (flippedIndices.includes(index) || matchedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setIsLocked(true);
      setMoves(m => m + 1);

      const card1 = cards[newFlipped[0]];
      const card2 = cards[newFlipped[1]];

      if (card1.wordId === card2.wordId) {
        // Match!
        setTimeout(() => {
          setMatchedIndices(prev => [...prev, newFlipped[0], newFlipped[1]]);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 500);
      } else {
        // No match
        setMismatchIndices(newFlipped);
        setTimeout(() => {
          setFlippedIndices([]);
          setMismatchIndices([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0 && matchedIndices.length === cards.length) {
      setTimeout(() => {
        setGameState('gameover');
      }, 500);
    }
  }, [matchedIndices, cards, gameState]);

  if (gameState === 'setup') {
    return <PracticeSetup mode="match" title="Lật thẻ" rules={['Ghép 6 cặp từ tiếng Anh và nghĩa tiếng Việt.','Lật 2 thẻ mỗi lượt.','Hoàn thành với ít lượt lật nhất.']} level={selectedLevel} onLevelChange={setSelectedLevel} onStart={startGame} exitRoute={exitRoute} />;
  }

  if (gameState === 'gameover') {
    return <GameResult title="Đã ghép đủ 6 cặp" value={moves} label="Lượt lật" onReplay={startGame} exitRoute={exitRoute}>          <div className="bg-[var(--paper)] p-4 border border-[var(--line)] mb-6 text-left rounded-xl max-h-[200px] overflow-y-auto w-full">
            <h3 className="font-semibold text-sm mb-2 border-b border-solid border-[var(--line)] pb-2 text-[var(--blue)]">Các từ đã ghép cặp:</h3>
            <ul className="space-y-2">
              {playedWords.map(w => {
                const { en, vi } = parseMeaning(w.meaning_vi, w.pos);
                return (
                  <li key={w.id} className="flex justify-between items-center border-b border-gray-100 last:border-b-0 pb-1 text-xs">
                    <span className="text-[var(--ink)]">
                      <span className="font-semibold">{w.word}</span> <span className="font-normal">({vi || en})</span>
                    </span>
                    <SaveToCollection wordId={w.id} wordText={w.word} />
                  </li>
                );
              })}
            </ul>
          </div>
</GameResult>;
  }

  if (cards.length === 0) {
    return <div className="text-center py-20 font-semibold text-xl animate-pulse">Đang chuẩn bị thẻ</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-10 px-2 md:px-4 min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Top Bar */}
      <div className="flex items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border border-[var(--line)] rounded-xl shrink-0 gap-4 w-full">
        <div className="text-xl md:text-2xl font-semibold text-[var(--ink)] flex-1">
          Lượt lật: <span className="text-[var(--blue)]">{moves}</span>
        </div>
        <div className="text-xl md:text-2xl font-semibold text-[var(--green)]">
          {matchedIndices.length / 2} / 6 cặp
        </div>
        <button
          onClick={() => router.push(exitRoute)}
          className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer"
          title="Thoát game"
         aria-label="Thoát game">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 perspective-1000">
        {cards.map((card, idx) => {
          const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
          const isMatched = matchedIndices.includes(idx);
          const isMismatched = mismatchIndices.includes(idx);

          return (
            <div
              key={idx}
              className="w-full h-full animate-[card-deal_0.5s_cubic-bezier(0.175,_0.885,_0.32,_1.275)_both]"
              style={{ animationDelay: `${idx * 45}ms` }}
            >
              <div
                className={`relative h-24 md:h-40 cursor-pointer transform-style-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''} ${isMatched ? 'scale-95' : 'hover:-translate-y-2'} ${isMismatched ? 'animate-mismatch-shake' : ''}`}
                onClick={() => handleCardClick(idx)}
              >
                {/* Back of card (Face down) */}
                <div className="absolute inset-0 bg-[var(--blue)] border border-[var(--line)] rounded-xl backface-hidden flex items-center justify-center">
                  <span className="text-4xl text-white/50 font-semibold">?</span>
                </div>

                {/* Front of card (Face up) */}
                <div className={`absolute inset-0 border rounded-xl backface-hidden flex items-center justify-center p-2 text-center rotate-y-180 leading-tight overflow-y-auto ${ isMatched ? 'bg-green-500 border-green-700 shadow-none' : isMismatched ? 'bg-[var(--danger-soft)] border-red-500 shadow-none' : 'bg-[var(--paper)] border-[var(--line)]' }`}>
                  <span className={`font-semibold break-words block w-full my-auto ${isMatched ? 'text-green-950' : isMismatched ? 'text-red-950' : (card.type === 'en' ? 'text-sm md:text-2xl text-[var(--ink)]' : 'text-[10px] md:text-sm text-[var(--muted)]')}`}>
                    {card.content}
                  </span>
                </div>

                {/* Sparkles Layer */}
                {isMatched && (
                  <div className="absolute inset-0 pointer-events-none overflow-visible z-30">
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i * Math.PI * 2) / 8;
                      const dist = 30 + Math.random() * 40;
                      const tx = Math.cos(angle) * dist;
                      const ty = Math.sin(angle) * dist;
                      return (
                        <div
                          key={i}
                          className="absolute w-2 h-2 md:w-3 md:h-3 bg-yellow-400 border border-yellow-600 rounded-full animate-sparkle"
                          style={{
                            left: '50%',
                            top: '50%',
                            '--tx': `${tx}px`,
                            '--ty': `${ty}px`,
                            animationDelay: `${Math.random() * 0.1}s`,
                          } as any}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes card-deal {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(100px) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotate(0deg);
          }
        }
        @keyframes mismatch-shake {
          0%, 100% { transform: translateX(0) rotateY(180deg); }
          20%, 60% { transform: translateX(-8px) rotate(-1deg) rotateY(180deg); }
          40%, 80% { transform: translateX(8px) rotate(1deg) rotateY(180deg); }
        }
        .animate-mismatch-shake {
          animation: mismatch-shake 0.4s ease-in-out;
        }
        @keyframes sparkle {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
          }
          100% {
            transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(180deg);
            opacity: 0;
          }
        }
        .animate-sparkle {
          animation: sparkle 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
