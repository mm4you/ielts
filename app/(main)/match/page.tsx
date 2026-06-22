'use client';

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
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <p className="text-xl font-bold animate-pulse">Đang tải cấu hình ghép thẻ...</p>
        </div>
      </div>
    }>
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
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--blue)] relative">
          <button
            onClick={() => router.push(exitRoute)}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm z-10"
            title={exitLabel}
          >
            X
          </button>
          <h2 className="text-4xl font-serif font-black uppercase mb-2 text-[var(--blue)]">Lật Thẻ</h2>
          <p className="text-xl font-black mb-8">Trò chơi Trí Nhớ</p>
          
          <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-8 text-left rounded-xl">
            <h3 className="font-black text-lg mb-2 border-b-2 border-dashed border-[var(--line)] pb-2">Luật chơi:</h3>
            <ul className="font-bold text-sm space-y-3">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--blue)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Có 12 tấm thẻ bị úp sấp.</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#8b5cf6] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Lật 2 thẻ để tìm 1 cặp Tiếng Anh - Tiếng Việt.</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--yellow)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <span>Ghép thành công 6 cặp bằng ít lượt nhất.</span>
              </li>
            </ul>
          </div>

          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--blue)] transition-shadow mb-8 appearance-none cursor-pointer text-center text-lg"
          >
            <option value="all">Tất cả mức độ</option>
            {LEVELS.map(l => <option key={l} value={l}>Mức độ {l}</option>)}
          </select>

          <button onClick={startGame} className="w-full btn-brutal bg-[var(--blue)] text-white py-4 text-2xl uppercase shadow-[4px_4px_0_var(--ink)] flex items-center justify-center gap-2">
            <span>CHIẾN NGAY</span>
            <svg className="w-6 h-6 animate-pulse shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--ink)] relative">
          <button
            onClick={() => router.push(exitRoute)}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm z-10"
            title={exitLabel}
          >
            X
          </button>
          <h2 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--blue)]">Chiến Thắng!</h2>
          <p className="text-2xl font-black mb-4">Số lượt lật của bạn:</p>
          <div className="text-7xl font-black text-[var(--green)] mb-6">{moves}</div>

          <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-6 text-left rounded-xl max-h-[200px] overflow-y-auto w-full">
            <h3 className="font-black text-sm mb-2 border-b-2 border-dashed border-[var(--line)] pb-2 uppercase text-[var(--blue)]">Các từ đã ghép cặp:</h3>
            <ul className="space-y-2">
              {playedWords.map(w => {
                const { en, vi } = parseMeaning(w.meaning_vi, w.pos);
                return (
                  <li key={w.id} className="flex justify-between items-center border-b border-gray-100 last:border-b-0 pb-1 text-xs">
                    <span className="text-[var(--ink)]">
                      <span className="font-bold">{w.word}</span> <span className="font-normal">({vi || en})</span>
                    </span>
                    <SaveToCollection wordId={w.id} wordText={w.word} />
                  </li>
                );
              })}
            </ul>
          </div>
          
          <button onClick={startGame} className="w-full btn-brutal bg-[var(--yellow)] text-[var(--ink)] py-4 text-xl uppercase">
            Chơi lại
          </button>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return <div className="text-center py-20 font-bold text-xl animate-pulse">Đang rải bài...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-4 md:py-10 px-2 md:px-4 min-h-[calc(100vh-80px)] flex flex-col justify-center">
      {/* Top Bar */}
      <div className="flex items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl shrink-0 gap-4 w-full">
        <div className="text-xl md:text-2xl font-black text-[var(--ink)] flex-1">
          Lượt (Moves): <span className="text-[var(--blue)]">{moves}</span>
        </div>
        <div className="text-xl md:text-2xl font-black text-[var(--green)]">
          {matchedIndices.length / 2} / 6 Cặp
        </div>
        <button 
          onClick={() => router.push(exitRoute)} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer"
          title="Thoát game"
        >
          X
        </button>
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
                <div className="absolute inset-0 bg-[var(--blue)] border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl backface-hidden flex items-center justify-center">
                  <span className="text-4xl text-white/50 font-black">?</span>
                </div>

                {/* Front of card (Face up) */}
                <div className={`absolute inset-0 border-[3px] shadow-[4px_4px_0_var(--line)] rounded-xl backface-hidden flex items-center justify-center p-2 text-center rotate-y-180 leading-tight overflow-y-auto ${
                  isMatched ? 'bg-green-500 border-green-700 shadow-none' : 
                  isMismatched ? 'bg-red-100 border-red-500 shadow-none' : 
                  'bg-[var(--paper)] border-[var(--line)]'
                }`}>
                  <span className={`font-black break-words block w-full my-auto ${isMatched ? 'text-green-950' : isMismatched ? 'text-red-950' : (card.type === 'en' ? 'text-sm md:text-2xl text-[var(--ink)]' : 'text-[10px] md:text-sm text-[var(--muted)]')}`}>
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
