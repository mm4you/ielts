'use client';

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
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center">
          <p className="text-xl font-bold animate-pulse">Đang tải cấu hình tốc chiến...</p>
        </div>
      </div>
    }>
      <SpeedrunContent />
    </Suspense>
  );
}

function SpeedrunContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
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
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuestions = async () => {
    try {
      const collectionParam = collectionId ? `&collectionId=${collectionId}` : '';
      const res = await fetch(`/api/speedrun?level=${selectedLevel}${collectionParam}`);
      const data = await res.json();
      if (!data.error) {
        setQuestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = async () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(45);
    setCurrentIndex(0);
    setStreak(0);
    await fetchQuestions();
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

  const handleAnswer = (choiceIdx: number) => {
    if (questions.length === 0 || answerStatus) return;
    
    const currentQ = questions[currentIndex];
    const isCorrect = choiceIdx === currentQ.correctIndex;

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

      setScore(s => s + 10 + (streak * 2));
      setTimeLeft(t => t + 2);
      setStreak(s => s + 1);
      setFlashColor('green');
      fetch('/api/activity', { method: 'POST' }).catch(() => {});
      
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
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--red)]">
          <h2 className="text-4xl font-serif font-black uppercase mb-2 text-[var(--red)]">Speedrun</h2>
          <p className="text-xl font-black mb-8">Sinh Tồn Cùng Từ Vựng</p>
          
          <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-8 text-left rounded-xl">
            <h3 className="font-black text-lg mb-2 border-b-2 border-dashed border-[var(--line)] pb-2">Luật chơi:</h3>
            <ul className="font-bold text-sm space-y-2">
              <li>⏱️ Khởi đầu với 45 giây.</li>
              <li>🔥 Chế độ Sinh Tồn: Bắn không giới hạn từ.</li>
              <li>✅ Trả lời đúng: <span className="text-[var(--green)]">+2 giây</span>, +10 điểm.</li>
              <li>❌ Trả lời sai: <span className="text-[var(--red)]">-3 giây</span>.</li>
              <li>💀 Hết giờ = GAME OVER.</li>
            </ul>
          </div>

          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--red)] transition-shadow mb-8 appearance-none cursor-pointer text-center text-lg"
          >
            <option value="all">Tất cả mức độ</option>
            {LEVELS.map(l => <option key={l} value={l}>Mức độ {l}</option>)}
          </select>

          <button onClick={startGame} className="w-full btn-brutal bg-[var(--yellow)] text-[var(--ink)] py-4 text-2xl uppercase shadow-[4px_4px_0_var(--ink)]">
            CHIẾN NGAY 🔥
          </button>
          <button onClick={() => router.push('/')} className="block mt-6 text-center text-[var(--muted)] font-bold hover:text-[var(--ink)] underline w-full uppercase text-sm transition-colors">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--ink)]">
          <h2 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--red)]">Game Over</h2>
          <p className="text-2xl font-black mb-4">Điểm của bạn:</p>
          <div className="text-7xl font-black text-[var(--green)] mb-8">{score}</div>
          
          <button onClick={() => setGameState('setup')} className="w-full btn-brutal bg-[var(--yellow)] text-[var(--ink)] py-4 text-xl uppercase mb-4">
            Chơi lại
          </button>
          <button onClick={() => router.push('/')} className="w-full btn-brutal bg-[var(--paper)] text-[var(--ink)] py-4 text-xl uppercase">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center py-20 font-bold text-xl animate-pulse">Đang tải câu hỏi...</div>;
  }

  const currentQ = questions[currentIndex];

  return (
    <div className={`max-w-2xl mx-auto py-4 md:py-10 px-4 min-h-[calc(100vh-80px)] flex flex-col justify-center transition-colors duration-200 ${
      flashColor === 'green' ? 'bg-green-100' : flashColor === 'red' ? 'bg-red-100' : ''
    }`}>
      {/* Top Bar */}
      <div className="flex items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl relative shrink-0 gap-4">
        <div className="text-xl md:text-2xl font-black text-[var(--ink)] flex-1">
          Điểm: <span className="text-[var(--blue)]">{score}</span>
        </div>
        {streak >= 3 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-3xl font-black text-[var(--red)] animate-bounce whitespace-nowrap drop-shadow-md">
            🔥 x{streak}
          </div>
        )}
        <div className={`transition-all duration-300 font-black ${timeLeft <= 10 ? 'text-4xl md:text-6xl text-[var(--red)] animate-pulse drop-shadow-lg' : 'text-2xl md:text-4xl text-[var(--ink)]'}`}>
          {timeLeft}s
        </div>
        <button 
          onClick={() => setGameState('setup')} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 ml-2"
          title="Thoát game"
        >
          X
        </button>
      </div>

      {/* Question Card */}
      <div className={`panel text-center mb-4 md:mb-8 flex-1 min-h-[150px] md:min-h-[250px] flex flex-col justify-center items-center relative ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="absolute top-4 left-4">
          <span className="chip bg-[var(--blue)] text-white">{currentIndex + 1} / {questions.length}</span>
        </div>
        <div className="absolute top-4 right-4">
          <SaveToCollection wordId={currentQ.id} />
        </div>
        <h2 id="speedrun-target-word" className={`text-4xl md:text-6xl font-serif font-black text-[var(--ink)] mb-2 mt-6 break-words px-2 w-full transition-all duration-200 ${
          explosions.length > 0 ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
        }`}>{currentQ.word}</h2>
        {currentQ.pos && <span className="text-lg font-bold text-[var(--muted)] border-2 border-[var(--line)] px-3 py-1 rounded-full">{currentQ.pos}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.choices.map((choice, idx) => {
          const { en, vi } = parseMeaning(choice, currentQ.pos || '');
          return (
            <div 
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`btn-brutal text-left block w-full h-auto min-h-[60px] md:min-h-[80px] py-3 px-4 md:py-6 md:px-6 cursor-pointer transition-colors active:scale-95 ${
                !answerStatus ? 'bg-[var(--paper)] hover:bg-[var(--yellow)] group' :
                (idx === currentQ.correctIndex ? '!bg-green-400 !border-green-700 !text-green-950' :
                (idx === answerStatus.selectedIdx ? '!bg-red-400 !border-red-700 !text-red-950' : 'bg-[var(--paper)] opacity-50'))
              }`}
            >
              <div className="flex flex-col h-full justify-center">
                <span className={`block text-lg md:text-xl font-black mb-1 text-center ${
                  !answerStatus ? 'text-[var(--ink)] group-hover:text-black' :
                  (idx === currentQ.correctIndex || idx === answerStatus.selectedIdx ? 'text-black' : 'text-[var(--ink)]')
                }`}>{en}</span>
                {vi && <span className={`block text-sm font-bold text-center ${
                  !answerStatus ? 'text-[var(--muted)] group-hover:text-black/80' :
                  (idx === currentQ.correctIndex || idx === answerStatus.selectedIdx ? 'text-black/80' : 'text-[var(--muted)]')
                }`}>{vi}</span>}
              </div>
            </div>
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
                className="absolute font-serif font-black text-2xl md:text-4xl text-[var(--ink)]"
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
    </div>
  );
}
