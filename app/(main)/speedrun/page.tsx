'use client';
import { Button } from '@fluentui/react-components';

import GameResult from '@/components/GameResult';
import PracticeSetup from '@/components/PracticeSetup';
import AppLoading from '@/components/AppLoading';
import LoadingState from '@/components/LoadingState';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { PlayRegular } from '@fluentui/react-icons/svg/play';
import { FireRegular as FluentFireRegular } from '@fluentui/react-icons/svg/fire';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LEVELS } from '@/types';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

interface Question {
  id: number;
  word: string;
  pos: string | null;
  choices: string[];
  correctIndex: number;
}

export default function SpeedrunPage() {
  return (
    <Suspense fallback={<AppLoading contained />}>
      <SpeedrunContent />
    </Suspense>
  );
}

function SpeedrunContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';

  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [loadError,setLoadError]=useState('');
  const [loading,setLoading]=useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [streak, setStreak] = useState(0);

  const [isShaking, setIsShaking] = useState(false);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  const [answerStatus, setAnswerStatus] = useState<{ selectedIdx: number, isCorrect: boolean } | null>(null);
  const [explosions, setExplosions] = useState<{id: string, x: number, y: number}[]>([]);
  const [scorePops, setScorePops] = useState<{ id: string; text: string; color: string; x: number; y: number }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuestions = async () => {
    try {
      const collectionParam = collectionId ? `&collectionId=${collectionId}` : '';
      const res = await fetch(`/api/speedrun?level=${selectedLevel}${collectionParam}`,{signal:AbortSignal.timeout(15000)});
      const data = await res.json();
      if(!res.ok)throw new Error(data.error||'Chưa tải được bộ từ. Bạn thử lại nhé.');
      if (!data.error) {
        setQuestions(data);
      }
      return true;
    } catch (e) {
      setLoadError(e instanceof Error?e.message:'Chưa tải được từ.');
      return false;
    }
  };

  const startGame = async () => {
    if(loading)return;setLoading(true);setLoadError('');
    setScore(0);
    setTimeLeft(45);
    setCurrentIndex(0);
    setStreak(0);
    setScorePops([]);
    const ready=await fetchQuestions();
    setLoading(false);if(!ready)return;setGameState('playing');
  };

  // Timer logic
  useEffect(() => {
    if (gameState === 'playing' && questions.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setGameState('gameover');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, questions]);

  const handleAnswer = (choiceIdx: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (questions.length === 0 || answerStatus) return;

    const currentQ = questions[currentIndex];
    const isCorrect = choiceIdx === currentQ.correctIndex;

    const x = e.clientX;
    const y = e.clientY;
    const popId = Date.now().toString() + Math.random().toString();
    const scoreVal = 10 + (streak * 2);
    const popText = isCorrect ? `+${scoreVal} pts | +2s` : `-3s`;
    const popColor = isCorrect ? 'text-green-600' : 'text-red-600';

    setScorePops(prev => [...prev, { id: popId, text: popText, color: popColor, x, y }]);
    setTimeout(() => {
      setScorePops(prev => prev.filter(p => p.id !== popId));
    }, 800);

    setAnswerStatus({ selectedIdx: choiceIdx, isCorrect });

    if (isCorrect) {
      const targetEl = document.getElementById('speedrun-target-word');
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const explosionId = Date.now().toString();
        setExplosions(prev => [...prev, { id: explosionId, x, y }]);
        setTimeout(() => {
          setExplosions(prev => prev.filter(e => e.id !== explosionId));
        }, 600);
      }

      setScore(s => s + scoreVal);
      setTimeLeft(t => t + 2);
      setStreak(s => s + 1);
      setFlashColor('green');


      setTimeout(() => {
        setFlashColor(null);
        setCurrentIndex(c => (c + 1) % questions.length);
        setAnswerStatus(null);
      }, 500);

    } else {
      setTimeLeft(t => Math.max(0, t - 3)); // Penalty
      setStreak(0);
      setIsShaking(true);
      setFlashColor('red');

      setTimeout(() => {
        setIsShaking(false);
        setFlashColor(null);
        setCurrentIndex(c => (c + 1) % questions.length);
        setAnswerStatus(null);
      }, 1500);
    }
  };

  if (gameState === 'setup') {
    return <PracticeSetup mode="speedrun" title="Tốc chiến" rules={['Bắt đầu với 45 giây.','Đúng: thêm 2 giây và 10 điểm.','Sai: trừ 3 giây. Hết giờ thì kết thúc.']} level={selectedLevel} onLevelChange={setSelectedLevel} onStart={startGame} exitRoute={exitRoute} loading={loading} error={loadError} />;
  }

  if (gameState === 'gameover') {
    return <GameResult error={loadError} value={score} onReplay={() => setGameState('setup')} exitRoute={exitRoute}></GameResult>;
  }

  if (questions.length === 0) {
    return <LoadingState label="Đang tải câu hỏi" />;
  }

  const currentQ = questions[currentIndex];

  return (
    <div className={`max-w-2xl mx-auto py-4 md:py-10 px-4 min-h-[calc(100vh-80px)] flex flex-col justify-center transition-colors duration-200 ${ flashColor === 'green' ? 'bg-[var(--success-soft)]' : flashColor === 'red' ? 'bg-[var(--danger-soft)]' : '' }`}>
      {/* Top Bar */}
      <div className={`flex items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 pb-5 md:pb-6 border rounded-xl relative shrink-0 gap-4 transition-all duration-300 ${ timeLeft <= 10 ? 'border-[var(--red)] animate-pulse' : 'border-[var(--line)] ' }`}>
        <div className="text-xl md:text-2xl font-semibold text-[var(--ink)] flex-1">
          Điểm: <span className="text-[var(--blue)]">{score}</span>
        </div>
        {streak >= 3 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-3xl font-semibold text-[var(--red)] animate-bounce whitespace-nowrap drop-shadow-md flex items-center gap-1">
            <FluentFireRegular aria-hidden="true" className="w-6 h-6 md:w-8 md:h-8 shrink-0 " />
            <span>x{streak} FLAME</span>
          </div>
        )}
        <div className={`transition-all duration-300 font-semibold ${timeLeft <= 10 ? 'text-2xl md:text-3xl text-[var(--red)]' : 'text-2xl md:text-4xl text-[var(--ink)]'}`}>
          {timeLeft}s
        </div>
        <Button
          onClick={() => router.push(exitRoute)}
          className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer z-10"
          title="Thoát game"
         aria-label="Thoát game">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></Button>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 rounded-b-lg overflow-hidden border-t border-[var(--line)]">
          <div
            className={`h-full transition-all duration-200 ${ timeLeft <= 10 ? 'bg-[var(--red)]' : 'bg-[var(--green)]' }`}
            style={{ width: `${Math.min(100, (timeLeft / 45) * 100)}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className={`panel text-center mb-4 md:mb-8 flex-1 min-h-[150px] md:min-h-[250px] flex flex-col justify-center items-center relative transition-all duration-300 ${ isShaking ? 'animate-[shake_0.5s_ease-in-out]' : '' } ${ streak >= 3 ? 'animate-fire-glow border-[#ef4444]' : '' }`}>
        <div className="absolute top-4 left-4">
          <span className="bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] font-semibold text-xs px-2.5 py-1 rounded-md ">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="absolute top-4 right-4">
          <SaveToCollection wordId={currentQ.id} wordText={currentQ.word} />
        </div>
        <h2 id="speedrun-target-word" className={`text-4xl md:text-6xl font-sans font-semibold text-[var(--ink)] mb-2 mt-6 break-words px-2 w-full transition-all duration-200 ${ explosions.length > 0 ? 'opacity-0 scale-50' : 'opacity-100 scale-100' }`}>{currentQ.word}</h2>
        {currentQ.pos && <span className="bg-[var(--bg)] text-[var(--muted)] border border-[var(--line)] font-semibold text-sm px-3 py-1 rounded-md ">{currentQ.pos}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.choices.map((choice, idx) => {
          const { en, vi } = parseMeaning(choice, currentQ.pos || '');
          return (
            <Button
              key={idx}
              onClick={(e) => handleAnswer(idx, e)}
              className="answer-choice" appearance="secondary" disabled={!!answerStatus} data-result={answerStatus ? idx === currentQ.correctIndex ? 'correct' : idx === answerStatus.selectedIdx ? 'wrong' : undefined : undefined}
            >
              <div className="flex flex-col h-full justify-center">
                <span className={`block text-lg md:text-xl font-semibold mb-1 text-center ${ !answerStatus ? 'text-[var(--ink)] group-hover:text-[var(--ink)]' : (idx === currentQ.correctIndex || idx === answerStatus.selectedIdx ? 'text-[var(--ink)]' : 'text-[var(--ink)]') }`}>{en}</span>
                {vi && <span className={`block text-sm font-semibold text-center ${ !answerStatus ? 'text-[var(--muted)] group-hover:text-[var(--ink)]/80' : (idx === currentQ.correctIndex || idx === answerStatus.selectedIdx ? 'text-[var(--ink)]/80' : 'text-[var(--muted)]') }`}>{vi}</span>}
              </div>
            {answerStatus && (idx === currentQ.correctIndex ? <span> ✓ Đáp án đúng</span> : idx === answerStatus.selectedIdx ? <span> — Bạn đã chọn</span> : null)}</Button>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-2deg); }
          50% { transform: translateX(10px) rotate(2deg); }
          75% { transform: translateX(-10px) rotate(-2deg); }
          100% { transform: translateX(0); }
        }
        @keyframes text-explode {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(720deg); opacity: 0; }
        }
        @keyframes score-pop {
          0% { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
          20% { transform: translate(-50%, -20px) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -80px) scale(0.8); opacity: 0; }
        }
        .animate-score-pop {
          animation: score-pop 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes fire-glow {
          0% {
            box-shadow: 6px 6px 0 var(--ink), 0 0 10px rgba(239, 68, 68, 0.4), 0 0 20px rgba(249, 115, 22, 0.4);
            border-color: #ef4444;
          }
          50% {
            box-shadow: 6px 6px 0 var(--ink), 0 0 20px rgba(239, 68, 68, 0.8), 0 0 35px rgba(249, 115, 22, 0.8);
            border-color: #f97316;
          }
          100% {
            box-shadow: 6px 6px 0 var(--ink), 0 0 12px rgba(239, 68, 68, 0.4), 0 0 24px rgba(249, 115, 22, 0.4);
            border-color: #ef4444;
          }
        }
        .animate-fire-glow {
          animation: fire-glow 1s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Explosions layer */}
      {explosions.map(exp => (
        <div key={exp.id} className="fixed pointer-events-none" style={{ left: exp.x, top: exp.y, zIndex: 100 }}>
          {Array.from({ length: Math.min(12, currentQ.word.length * 2) }).map((_, i) => {
            const angle = (i * Math.PI * 2) / Math.min(12, currentQ.word.length * 2);
            const distance = 40 + Math.random() * 80;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            const letter = currentQ.word[i % currentQ.word.length];
            return (
              <div
                key={i}
                className="absolute font-sans font-semibold text-2xl md:text-4xl text-[var(--ink)]"
                style={{
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                  animation: `text-explode 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
                } as any}
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}

      {/* Score Pops Layer */}
      {scorePops.map(pop => (
        <div
          key={pop.id}
          className={`fixed pointer-events-none z-50 text-xl md:text-3xl font-semibold bg-[var(--paper)] px-3 py-1.5 border border-[var(--line)] rounded-xl animate-score-pop ${pop.color}`}
          style={{ left: pop.x, top: pop.y }}
        >
          {pop.text}
        </div>
      ))}
    </div>
  );
}
