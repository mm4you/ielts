'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LEVELS } from '@/types';
import { parseMeaning } from '@/lib/parse';

interface Question {
  id: number;
  word: string;
  pos: string | null;
  choices: string[];
  correctIndex: number;
}

export default function SpeedrunPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [streak, setStreak] = useState(0);
  
  const [isShaking, setIsShaking] = useState(false);
  const [flashColor, setFlashColor] = useState<'green' | 'red' | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/speedrun?level=${selectedLevel}`);
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
    setTimeLeft(60);
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

  const handleAnswer = (choiceIndex: number) => {
    const currentQ = questions[currentIndex];
    const isCorrect = choiceIndex === currentQ.correctIndex;

    if (isCorrect) {
      setScore(s => s + 10);
      setTimeLeft(t => t + 2); // Bonus time
      setStreak(s => s + 1);
      setFlashColor('green');
      
      // Background log activity
      fetch('/api/activity', { method: 'POST' }).catch(() => {});
    } else {
      setTimeLeft(t => Math.max(0, t - 3)); // Penalty
      setStreak(0);
      setIsShaking(true);
      setFlashColor('red');
      setTimeout(() => setIsShaking(false), 500);
    }

    setTimeout(() => setFlashColor(null), 300);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
    } else {
      // Finished all 50 questions
      clearInterval(timerRef.current!);
      setGameState('gameover');
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
              <li>⏱️ Bạn có 60 giây.</li>
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

          <button onClick={startGame} className="w-full btn-brutal bg-[var(--red)] text-white py-4 text-2xl uppercase">
            CHIẾN NGAY 🔥
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
      <div className="flex justify-between items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl relative shrink-0">
        <div className="text-2xl font-black text-[var(--ink)]">
          Điểm: <span className="text-[var(--blue)]">{score}</span>
        </div>
        {streak >= 3 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-black text-[var(--red)] animate-bounce whitespace-nowrap drop-shadow-md">
            🔥 COMBO x{streak} 🔥
          </div>
        )}
        <div className={`transition-all duration-300 font-black ${timeLeft <= 10 ? 'text-6xl md:text-7xl text-[var(--red)] animate-pulse scale-110 drop-shadow-lg' : 'text-4xl text-[var(--ink)]'}`}>
          {timeLeft}s
        </div>
      </div>

      {/* Question Card */}
      <div className={`panel text-center mb-4 md:mb-8 flex-1 min-h-[150px] md:min-h-[250px] flex flex-col justify-center items-center relative ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        <div className="absolute top-4 left-4">
          <span className="chip bg-[var(--blue)] text-white">{currentIndex + 1} / {questions.length}</span>
        </div>
        <h2 className="text-6xl font-serif font-black text-[var(--ink)] mb-2 mt-6">{currentQ.word}</h2>
        {currentQ.pos && <span className="text-lg font-bold text-[var(--muted)] border-2 border-[var(--line)] px-3 py-1 rounded-full">{currentQ.pos}</span>}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.choices.map((choice, idx) => {
          const { en, vi } = parseMeaning(choice, currentQ.pos || '');
          return (
            <button 
              key={idx}
              onClick={() => handleAnswer(idx)}
              className="btn-brutal bg-[var(--paper)] text-left flex flex-col items-center justify-center py-3 px-2 md:py-6 md:px-4 hover:bg-[var(--yellow)] transition-colors active:scale-95 min-h-[60px]"
            >
              <span className="text-lg md:text-xl font-bold text-[var(--ink)] mb-1 text-center">{en}</span>
              {vi && <span className="text-sm font-bold text-[var(--muted)] text-center">{vi}</span>}
            </button>
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
      `}</style>
    </div>
  );
}
