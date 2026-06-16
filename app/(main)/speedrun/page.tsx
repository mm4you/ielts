'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  word: string;
  correctAnswer: string;
  options: string[];
}

export default function SpeedrunPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch('/api/quiz')
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
      });
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current as NodeJS.Timeout);
            setGameState('gameover');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

  const handleSelect = (option: string) => {
    const isCorrect = option === questions[currentIndex].correctAnswer;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setTimeLeft(t => t + 2); // Bonus 2 seconds
      
      // Flash screen green temporarily
      document.body.style.backgroundColor = 'var(--green)';
      setTimeout(() => document.body.style.backgroundColor = '', 100);

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        // Fetch more questions invisibly in a real app, but for now we loop or end
        setGameState('gameover');
      }
    } else {
      // Instant death
      document.body.style.backgroundColor = 'var(--red)';
      setTimeout(() => document.body.style.backgroundColor = '', 100);
      setGameState('gameover');
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(10);
    setCurrentIndex(0);
    setGameState('playing');
  };

  if (gameState === 'start') {
    return (
      <div className="panel max-w-xl mx-auto text-center py-20 mt-10">
        <h1 className="text-6xl font-serif font-black text-[var(--red)] mb-4 uppercase tracking-tighter">Tốc Chiến</h1>
        <p className="text-xl font-bold mb-8 text-[var(--muted)]">Sinh tồn 10 giây. Đúng +2s. Sai là CHẾT!</p>
        <button onClick={startGame} className="btn-brutal bg-[var(--red)] text-white text-2xl px-12 py-6 animate-pulse">
          Bắt Đầu
        </button>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="panel max-w-xl mx-auto text-center py-20 mt-10 animate-fade-in border-[var(--red)] shadow-[8px_8px_0_var(--red)]">
        <h2 className="text-6xl font-black text-[var(--red)] mb-4">GAME OVER</h2>
        <p className="text-2xl font-bold mb-2">Điểm sinh tồn của bạn</p>
        <p className="text-8xl font-black text-[var(--ink)] mb-10">{score}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={startGame} className="btn-brutal bg-[var(--yellow)] text-[var(--ink)] px-8 py-4">Chơi Lại</button>
          <Link href="/" className="btn-brutal bg-[var(--paper)] text-[var(--ink)] px-8 py-4">Thoát</Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return <div className="text-center font-bold">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b-4 border-[var(--line)] pb-4">
        <div>
          <p className="text-[var(--muted)] font-bold text-xl">Điểm</p>
          <p className="text-5xl font-black">{score}</p>
        </div>
        <div className="text-right">
          <p className="text-[var(--muted)] font-bold text-xl">Thời gian</p>
          <p className={`text-6xl font-black transition-colors ${timeLeft <= 3 ? 'text-[var(--red)] animate-pulse' : 'text-[var(--blue)]'}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      <div className="panel text-center mb-8 py-16">
        <h2 className="text-3xl md:text-5xl font-bold text-[var(--ink)] leading-snug">{currentQ.word}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(opt)}
            className="btn-brutal text-left p-6 text-base hover:bg-[var(--line)] hover:text-white transition-colors whitespace-pre-line leading-relaxed"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
