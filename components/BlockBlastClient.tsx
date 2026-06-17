'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Board = number[][]; // 0=empty, 1=filled, 2=dead
type Shape = { id: string; grid: number[][]; color: string };

const COLORS = [
  'var(--blue)',
  'var(--green)',
  'var(--red)',
  'var(--yellow)',
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

const SHAPE_DEFS: { grid: number[][] }[] = [
  { grid: [[1]] },
  { grid: [[1, 1], [1, 1]] },
  { grid: [[1, 1]] },
  { grid: [[1], [1]] },
  { grid: [[1, 1, 1]] },
  { grid: [[1], [1], [1]] },
  { grid: [[1, 1, 1, 1]] },
  { grid: [[1], [1], [1], [1]] },
  { grid: [[1, 0], [1, 1]] },
  { grid: [[0, 1], [1, 1]] },
  { grid: [[1, 1], [1, 0]] },
  { grid: [[1, 1], [0, 1]] },
  { grid: [[1,0,0],[1,0,0],[1,1,1]] },
  { grid: [[0,0,1],[0,0,1],[1,1,1]] },
  { grid: [[1,1,1],[1,0,0],[1,0,0]] },
  { grid: [[1,1,1],[0,0,1],[0,0,1]] },
  { grid: [[1,1,1],[0,1,0]] },
  { grid: [[0,1,0],[1,1,1]] },
  { grid: [[1,0],[1,1],[1,0]] },
  { grid: [[0,1],[1,1],[0,1]] },
  { grid: [[1,1,0],[0,1,1]] },
  { grid: [[0,1,1],[1,1,0]] },
];

function getRandomShapes(count: number): (Shape | null)[] {
  return Array.from({ length: count }).map(() => {
    const def = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    return { id: Math.random().toString(), grid: def.grid, color };
  });
}

function canPlace(board: Board, shapeGrid: number[][], startR: number, startC: number): boolean {
  for (let r = 0; r < shapeGrid.length; r++) {
    for (let c = 0; c < shapeGrid[0].length; c++) {
      if (shapeGrid[r][c] === 1) {
        const boardR = startR + r;
        const boardC = startC + c;
        if (boardR < 0 || boardR >= 8 || boardC < 0 || boardC >= 8) return false;
        if (board[boardR][boardC] !== 0) return false;
      }
    }
  }
  return true;
}

function checkAnyCanFit(board: Board, shapes: (Shape | null)[]): boolean {
  for (const shape of shapes) {
    if (!shape) continue;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (canPlace(board, shape.grid, r, c)) return true;
      }
    }
  }
  return shapes.every(s => s === null) ? true : false;
}

interface Question {
  id: number;
  word: string;
  pos: string | null;
  choices: string[];
  correctIndex: number;
}

export default function BlockBlastClient() {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(Array(8).fill(0).map(() => Array(8).fill(0)));
  const [shapes, setShapes] = useState<(Shape | null)[]>([]);
  const [selectedShapeIdx, setSelectedShapeIdx] = useState<number | null>(null);
  
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'vocab' | 'gameover'>('playing');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    setShapes(getRandomShapes(3));
    fetch('/api/speedrun?level=all')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setQuestions(data);
      });
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && shapes.some(s => s !== null)) {
      if (!checkAnyCanFit(board, shapes)) {
        setGameState('gameover');
      }
    }
  }, [board, shapes, gameState]);

  const placeShape = (boardR: number, boardC: number) => {
    if (selectedShapeIdx === null || gameState !== 'playing') return;
    const shape = shapes[selectedShapeIdx];
    if (!shape) return;

    if (!canPlace(board, shape.grid, boardR, boardC)) return;

    const newBoard = board.map(row => [...row]);
    let pointsEarned = 0;
    for (let r = 0; r < shape.grid.length; r++) {
      for (let c = 0; c < shape.grid[0].length; c++) {
        if (shape.grid[r][c] === 1) {
          newBoard[boardR + r][boardC + c] = 1;
          pointsEarned += 10;
        }
      }
    }

    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];
    for (let r = 0; r < 8; r++) {
      if (newBoard[r].every(cell => cell === 1 || cell === 2)) rowsToClear.push(r);
    }
    for (let c = 0; c < 8; c++) {
      let isFull = true;
      for (let r = 0; r < 8; r++) {
        if (newBoard[r][c] === 0) {
          isFull = false; break;
        }
      }
      if (isFull) colsToClear.push(c);
    }

    rowsToClear.forEach(r => {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c] === 1) newBoard[r][c] = 0;
      }
    });
    colsToClear.forEach(c => {
      for (let r = 0; r < 8; r++) {
        if (newBoard[r][c] === 1) newBoard[r][c] = 0;
      }
    });

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      pointsEarned += linesCleared * 100 * linesCleared;
    }

    setBoard(newBoard);
    setScore(s => s + pointsEarned);

    const newShapes = [...shapes];
    newShapes[selectedShapeIdx] = null;
    setShapes(newShapes);
    setSelectedShapeIdx(null);

    if (newShapes.every(s => s === null)) {
      setTimeout(() => {
        setGameState('vocab');
      }, 500);
    }
  };

  const handleVocabAnswer = (choiceIdx: number) => {
    if (questions.length === 0) return;
    const currentQ = questions[currentQIndex];
    const isCorrect = choiceIdx === currentQ.correctIndex;

    if (isCorrect) {
      setScore(s => s + 500);
      setShapes(getRandomShapes(3));
      setGameState('playing');
      setCurrentQIndex(c => (c + 1) % questions.length);
      // Background activity update
      fetch('/api/activity', { method: 'POST' }).catch(() => {});
    } else {
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        const newBoard = board.map(row => [...row]);
        const emptyCells: {r: number, c: number}[] = [];
        for (let r=0; r<8; r++) {
          for (let c=0; c<8; c++) {
            if (newBoard[r][c] === 0) emptyCells.push({r,c});
          }
        }
        if (emptyCells.length > 0) {
          for (let i=0; i<Math.min(2, emptyCells.length); i++) {
            const rIdx = Math.floor(Math.random() * emptyCells.length);
            const target = emptyCells.splice(rIdx, 1)[0];
            newBoard[target.r][target.c] = 2; // Dead block
          }
        }
        setBoard(newBoard);
        setShapes(getRandomShapes(3));
        setGameState('playing');
        setCurrentQIndex(c => (c + 1) % questions.length);
      }, 800);
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 md:py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="w-full flex justify-between items-center bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl mb-6 shrink-0">
        <h1 className="text-xl md:text-2xl font-black font-serif uppercase text-[var(--ink)]">Vocab Blast</h1>
        <div className="text-2xl font-black text-[var(--blue)]">{score}</div>
      </div>

      {/* Board */}
      <div className={`relative panel p-2 md:p-4 mb-6 bg-[var(--line)] border-none shadow-[8px_8px_0_var(--ink)] flex-shrink-0 ${gameState === 'gameover' ? 'opacity-50' : ''}`}>
        <div className="grid grid-cols-8 gap-1 bg-[var(--line)]">
          {board.map((row, r) => (
            row.map((cell, c) => (
              <div 
                key={`${r}-${c}`}
                onClick={() => placeShape(r, c)}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-sm border-2 transition-colors duration-200 cursor-pointer ${
                  cell === 1 ? 'bg-[var(--blue)] border-[rgba(0,0,0,0.2)] shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]' : 
                  cell === 2 ? 'bg-[var(--ink)] border-[var(--ink)] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] flex items-center justify-center after:content-["X"] after:text-gray-500 after:font-black' : 
                  'bg-[#2d3748] border-[#1a202c] hover:bg-[#4a5568]'
                }`}
              />
            ))
          ))}
        </div>

        {/* Vocab Overlay */}
        {gameState === 'vocab' && questions.length > 0 && (
          <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 rounded-2xl ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <div className="bg-[var(--paper)] p-4 rounded-xl border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--yellow)] w-full text-center">
              <span className="text-[var(--red)] font-black uppercase text-sm mb-2 block animate-pulse">Hết Gạch! Hãy trả lời:</span>
              <h2 className="text-3xl font-serif font-black mb-4 text-[var(--ink)]">{questions[currentQIndex].word}</h2>
              <div className="grid grid-cols-1 gap-2">
                {questions[currentQIndex].choices.map((choice, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleVocabAnswer(idx)}
                    className="btn-brutal py-2 px-3 text-sm bg-white hover:bg-[var(--yellow)] text-left text-[var(--ink)]"
                  >
                    {choice.split(' | ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 rounded-2xl">
            <h2 className="text-5xl font-serif font-black text-[var(--red)] mb-4">GAME OVER</h2>
            <p className="text-white font-bold mb-6 text-xl">Điểm: {score}</p>
            <button 
              onClick={() => {
                setBoard(Array(8).fill(0).map(() => Array(8).fill(0)));
                setShapes(getRandomShapes(3));
                setScore(0);
                setGameState('playing');
              }}
              className="btn-brutal bg-[var(--yellow)] w-full mb-2"
            >
              Chơi Lại
            </button>
            <button onClick={() => router.push('/')} className="btn-brutal bg-white w-full text-[var(--ink)]">Về Trang Chủ</button>
          </div>
        )}
      </div>

      {/* Shapes tray */}
      <div className="w-full flex justify-between items-center gap-2 h-32 shrink-0">
        {shapes.map((shape, idx) => (
          <div 
            key={shape ? shape.id : `empty-${idx}`}
            onClick={() => { if (shape) setSelectedShapeIdx(idx); }}
            className={`flex-1 h-full panel flex items-center justify-center p-2 cursor-pointer transition-transform ${
              selectedShapeIdx === idx ? 'scale-110 shadow-[8px_8px_0_var(--yellow)] border-[var(--yellow)]' : 'hover:-translate-y-1'
            } ${!shape ? 'opacity-20 pointer-events-none' : ''}`}
          >
            {shape && (
              <div 
                className="grid gap-[2px]" 
                style={{
                  gridTemplateColumns: `repeat(${shape.grid[0].length}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${shape.grid.length}, minmax(0, 1fr))`
                }}
              >
                {shape.grid.map((r, ri) => 
                  r.map((val, ci) => (
                    <div 
                      key={`${ri}-${ci}`} 
                      className="w-4 h-4 md:w-5 md:h-5 rounded-[2px]"
                      style={{
                        backgroundColor: val ? shape.color : 'transparent',
                        border: val ? '1px solid rgba(0,0,0,0.3)' : 'none'
                      }}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
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
