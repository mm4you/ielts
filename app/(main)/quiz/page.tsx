'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  word: string;
  ipa: string | null;
  correctAnswer: string;
  options: string[];
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, []);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz');
      const data = await res.json();
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setShowResult(false);
      setSelectedOption(null);
    } catch (error) {
      console.error('Failed to fetch quiz', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(option);
    if (option === questions[currentIndex].correctAnswer) {
      setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(null);
      } else {
        setShowResult(true);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[var(--muted)] font-bold text-xl animate-pulse">Đang tạo bộ đề thi...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="panel text-center py-20">
        <p className="text-xl font-bold">Lỗi: Không đủ từ vựng để tạo bài thi.</p>
      </div>
    );
  }

  if (showResult) {
    return (
      <div className="panel max-w-2xl mx-auto text-center py-16 animate-fade-in">
        <div className="w-24 h-24 bg-[var(--yellow)] border-4 border-[var(--line)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0_var(--line)]">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-4xl font-serif font-bold mb-4">Kết quả của bạn</h2>
        <p className="text-6xl font-black text-[var(--blue)] mb-8">
          {score} <span className="text-2xl text-[var(--muted)]">/ {questions.length}</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={fetchQuiz} className="btn-brutal bg-[var(--yellow)] text-[var(--ink)]">
            Thi lại
          </button>
          <Link href="/" className="btn-brutal bg-[var(--paper)] text-[var(--ink)]">
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4 font-bold">
        <span>Câu hỏi {currentIndex + 1} / {questions.length}</span>
        <span className="text-[var(--blue)]">Điểm: {score}</span>
      </div>

      <div className="w-full h-4 bg-[var(--paper)] border-[3px] border-[var(--line)] rounded-full mb-8 overflow-hidden shadow-[2px_2px_0_var(--line)]">
        <div
          className="h-full bg-[var(--blue)] border-r-[3px] border-[var(--line)] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="panel text-center mb-8 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--blue)] rounded-bl-full opacity-10"></div>
        <h2 className="text-5xl md:text-6xl font-serif font-bold mb-4">{currentQ.word}</h2>
        {currentQ.ipa && (
          <p className="inline-block font-mono bg-gray-100 text-[var(--muted)] px-4 py-1 border-2 border-[var(--line)] rounded-md">
            {currentQ.ipa}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentQ.options.map((opt, idx) => {
          let btnClass = "btn-brutal text-left py-6 hover:bg-gray-50 flex items-center";
          
          if (selectedOption !== null) {
            if (opt === currentQ.correctAnswer) {
              btnClass = "btn-brutal text-left py-6 bg-[var(--green)] text-white"; // Right answer glows green
            } else if (opt === selectedOption) {
              btnClass = "btn-brutal text-left py-6 bg-[var(--red)] text-white"; // Wrong chosen answer glows red
            } else {
              btnClass = "btn-brutal text-left py-6 opacity-50"; // Others fade
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              disabled={selectedOption !== null}
              className={btnClass}
            >
              <span className="w-8 h-8 flex items-center justify-center border-2 border-current rounded-full mr-4 shrink-0 font-bold">
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-bold text-lg">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
