'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseMeaning } from '@/lib/parse';
import { LEVELS } from '@/types';

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

function getSmartShapes(count: number, currentBoard: Board): (Shape | null)[] {
  const comboShapes: { grid: number[][] }[] = [];
  const fitShapes: { grid: number[][] }[] = [];

  for (const def of SHAPE_DEFS) {
    let canFit = false;
    let canCombo = false;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (canPlace(currentBoard, def.grid, r, c)) {
          canFit = true;
          let clearsLine = false;
          
          for (let rr = 0; rr < def.grid.length; rr++) {
            let rowFull = true;
            for (let cc = 0; cc < 8; cc++) {
              const isShapeBlock = (cc >= c && cc < c + def.grid[0].length) && (def.grid[rr][cc - c] === 1);
              if (currentBoard[r + rr]?.[cc] === 0 && !isShapeBlock) {
                rowFull = false;
                break;
              }
            }
            if (rowFull) clearsLine = true;
          }
          
          for (let cc = 0; cc < def.grid[0].length; cc++) {
            let colFull = true;
            for (let rr = 0; rr < 8; rr++) {
              const isShapeBlock = (rr >= r && rr < r + def.grid.length) && (def.grid[rr - r][cc] === 1);
              if (currentBoard[rr]?.[c + cc] === 0 && !isShapeBlock) {
                colFull = false;
                break;
              }
            }
            if (colFull) clearsLine = true;
          }

          if (clearsLine) canCombo = true;
        }
        if (canCombo) break;
      }
      if (canCombo) break;
    }
    
    if (canCombo) comboShapes.push(def);
    else if (canFit) fitShapes.push(def);
  }

  return Array.from({ length: count }).map((_, i) => {
    let def: { grid: number[][] } | undefined;
    
    if (i === 0 && comboShapes.length > 0 && Math.random() < 0.6) {
      def = comboShapes[Math.floor(Math.random() * comboShapes.length)];
    } 
    else if (i === 1 && fitShapes.length > 0 && Math.random() < 0.7) {
      def = fitShapes[Math.floor(Math.random() * fitShapes.length)];
    }
    else if (i === 2 && comboShapes.length > 0 && Math.random() < 0.2) {
      def = comboShapes[Math.floor(Math.random() * comboShapes.length)];
    }
    
    if (!def) {
      def = SHAPE_DEFS[Math.floor(Math.random() * SHAPE_DEFS.length)];
    }

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
  
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'vocab' | 'gameover'>('setup');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<{ selectedIdx: number, isCorrect: boolean } | null>(null);

  // Drag state
  const [dragState, setDragState] = useState<{
    shape: Shape;
    trayIdx: number;
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);

  const startGame = () => {
    setGameState('playing');
    setBoard(Array(8).fill(0).map(() => Array(8).fill(0)));
    setShapes(getSmartShapes(3, Array(8).fill(0).map(() => Array(8).fill(0))));
    setScore(0);
    setCurrentQIndex(0);
    
    fetch(`/api/speedrun?level=${selectedLevel}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setQuestions(data);
      })
      .catch(console.error);
  };

  // Load high score on mount
  useEffect(() => {
    const saved = localStorage.getItem('blockblast_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('blockblast_highscore', score.toString());
    }
  }, [score, highScore]);

  // Main game loop effect
  useEffect(() => {
    if (gameState === 'playing' && shapes.some(s => s !== null)) {
      if (!checkAnyCanFit(board, shapes)) {
        setGameState('gameover');
      }
    }
  }, [board, shapes, gameState]);

  // Handle Global Drag Events
  useEffect(() => {
    if (!dragState) return;
    const onMove = (e: PointerEvent) => {
      setDragState(prev => prev ? { ...prev, currX: e.clientX, currY: e.clientY } : null);
    };
    const onUp = (e: PointerEvent) => {
      const gridEl = document.getElementById('block-blast-grid');
      if (gridEl && dragState) {
        const rect = gridEl.getBoundingClientRect();
        const cellSize = rect.width / 8; 
        const shapeRows = dragState.shape.grid.length;
        const shapeCols = dragState.shape.grid[0].length;
        
        // Calculate the intended top-left cell on the grid
        const dropX = e.clientX - rect.left - (shapeCols * cellSize) / 2;
        const dropY = e.clientY - rect.top - (shapeRows * cellSize) / 2;
        
        const targetC = Math.round(dropX / cellSize);
        const targetR = Math.round(dropY / cellSize);
        
        if (canPlace(board, dragState.shape.grid, targetR, targetC)) {
          placeShape(targetR, targetC, dragState.shape, dragState.trayIdx);
        }
      }
      setDragState(null);
    };
    
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragState, board]);

  const placeShape = (boardR: number, boardC: number, shape: Shape, trayIdx: number) => {
    if (gameState !== 'playing') return;

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
    newShapes[trayIdx] = null;
    setShapes(newShapes);

    if (newShapes.every(s => s === null)) {
      setTimeout(() => {
        setGameState('vocab');
      }, 500);
    }
  };

  const handleVocabAnswer = (choiceIdx: number) => {
    if (questions.length === 0 || answerStatus) return;
    const currentQ = questions[currentQIndex];
    const isCorrect = choiceIdx === currentQ.correctIndex;
    
    setAnswerStatus({ selectedIdx: choiceIdx, isCorrect });

    if (isCorrect) {
      setScore(s => s + 500);
      fetch('/api/activity', { method: 'POST' }).catch(() => {});
      
      setTimeout(() => {
        setShapes(getSmartShapes(3, board));
        setGameState('playing');
        setCurrentQIndex(c => (c + 1) % questions.length);
        setAnswerStatus(null);
      }, 600);
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
        setShapes(getSmartShapes(3, newBoard));
        setGameState('playing');
        setCurrentQIndex(c => (c + 1) % questions.length);
        setAnswerStatus(null);
      }, 1500);
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="flex items-center justify-center py-20 px-4 min-h-[calc(100vh-80px)]">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--ink)]">
          <h2 className="text-4xl font-serif font-black uppercase mb-2 text-[#8b5cf6]">Block Blast</h2>
          <p className="text-xl font-black mb-4 md:mb-8 text-[var(--ink)]">Xếp Hình Sinh Tồn</p>
          
          {highScore > 0 && (
            <div className="mb-6 p-4 border-[3px] border-[var(--line)] bg-[var(--yellow)] rounded-xl shadow-[4px_4px_0_var(--ink)] inline-block">
              <span className="block text-sm font-black uppercase text-[var(--ink)]">Kỷ Lục Cao Nhất</span>
              <span className="block text-3xl font-black text-[var(--red)]">{highScore}</span>
            </div>
          )}
          
          <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-8 text-left rounded-xl">
            <h3 className="font-black text-lg mb-2 border-b-2 border-dashed border-[var(--line)] pb-2">Luật chơi:</h3>
            <ul className="font-bold text-sm space-y-2">
              <li>🧩 Kéo thả gạch vào bàn cờ để ăn điểm.</li>
              <li>⚡ Xếp xong 3 khối gạch sẽ phải trả lời từ vựng.</li>
              <li>✅ Trả lời đúng: Được cấp gạch mới.</li>
              <li>❌ Trả lời sai: Bị rớt "gạch chết" không thể xóa.</li>
              <li>💀 Không còn chỗ xếp gạch = GAME OVER.</li>
            </ul>
          </div>

          <select 
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_#8b5cf6] transition-shadow appearance-none cursor-pointer text-center text-lg mb-8"
          >
            <option value="all">Mọi từ vựng</option>
            {LEVELS.map(l => <option key={l} value={l}>Trình độ {l}</option>)}
          </select>

          <button onClick={startGame} className="w-full btn-brutal bg-[#8b5cf6] text-white py-4 text-2xl uppercase shadow-[4px_4px_0_var(--ink)] mb-4">
            VÀO XẾP HÌNH
          </button>
          <button onClick={() => router.push('/')} className="block mt-4 text-center text-[var(--muted)] font-bold hover:text-[var(--ink)] underline w-full uppercase text-sm transition-colors">
            Về Trang Chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pt-4 pb-24 md:py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--line)] rounded-xl shrink-0 gap-4 w-full">
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <div className="text-xl md:text-2xl font-black text-[var(--ink)]">
            Điểm: <span className="text-[var(--blue)]">{score}</span>
          </div>
          {highScore > 0 && (
            <div className="text-sm font-bold text-[var(--muted)]">
              Kỷ lục: {highScore}
            </div>
          )}
        </div>
        <button 
          onClick={() => setGameState('setup')} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0"
          title="Thoát game"
        >
          X
        </button>
      </div>

      {/* Board */}
      <div className="relative panel p-2 md:p-4 mb-6 bg-[var(--line)] border-none shadow-[8px_8px_0_var(--ink)] flex-shrink-0 touch-none">
        <div id="block-blast-grid" className="grid grid-cols-8 gap-1 bg-[var(--line)] w-fit mx-auto">
          {board.map((row, r) => (
            row.map((cell, c) => (
              <div 
                key={`${r}-${c}`}
                className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-sm border-2 transition-colors duration-200 ${
                  cell === 1 ? 'bg-[var(--blue)] border-[rgba(0,0,0,0.2)] shadow-[inset_0_0_10px_rgba(255,255,255,0.1)]' : 
                  cell === 2 ? 'bg-[var(--ink)] border-[var(--ink)] shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] flex items-center justify-center after:content-["X"] after:text-gray-500 after:font-black' : 
                  'bg-[#2d3748] border-[#1a202c]'
                }`}
              />
            ))
          ))}
        </div>

        {/* Vocab Overlay */}
        {gameState === 'vocab' && questions.length > 0 && (
          <div className={`fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-4 ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <div className="bg-[var(--paper)] p-4 md:p-6 rounded-xl border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--yellow)] w-full max-w-md max-h-[90vh] flex flex-col">
              <span className="text-[var(--red)] font-black uppercase text-sm mb-2 block animate-pulse text-center shrink-0">Hết Gạch! Hãy trả lời:</span>
              <h2 className="text-3xl md:text-4xl font-serif font-black mb-4 text-[var(--ink)] text-center shrink-0">{questions[currentQIndex].word}</h2>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto p-1">
                {questions[currentQIndex].choices.map((choice, idx) => {
                  const { en, vi } = parseMeaning(choice, questions[currentQIndex].pos || '');
                  return (
                    <div 
                      key={idx}
                      onClick={() => handleVocabAnswer(idx)}
                      className={`btn-brutal py-3 px-4 text-sm text-left block w-full h-auto min-h-[60px] ${
                        !answerStatus ? 'bg-[var(--paper)] hover:bg-[var(--yellow)] cursor-pointer group' :
                        (idx === questions[currentQIndex].correctIndex ? '!bg-green-400 !border-green-700 !text-green-950' :
                        (idx === answerStatus.selectedIdx ? '!bg-red-400 !border-red-700 !text-red-950' : 'bg-[var(--paper)] opacity-50'))
                      }`}
                    >
                      <span className={`block font-black text-base leading-tight mb-1 ${
                        !answerStatus ? 'text-[var(--ink)] group-hover:text-black' :
                        (idx === questions[currentQIndex].correctIndex || idx === answerStatus.selectedIdx ? 'text-black' : 'text-[var(--ink)]')
                      }`}>{en}</span>
                      {vi && <span className={`block font-bold text-xs ${
                        !answerStatus ? 'text-[var(--muted)] group-hover:text-black/80' :
                        (idx === questions[currentQIndex].correctIndex || idx === answerStatus.selectedIdx ? 'text-black/80' : 'text-[var(--muted)]')
                      }`}>{vi}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-4 rounded-2xl">
            <h2 className="text-5xl font-serif font-black text-[var(--red)] mb-4">GAME OVER</h2>
            <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] rounded-xl mb-6 text-center w-full max-w-[200px] shadow-[4px_4px_0_var(--ink)]">
              <span className="block text-sm font-bold text-[var(--muted)] uppercase">Điểm của bạn</span>
              <span className="block text-4xl font-black text-[var(--blue)]">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="block mt-2 text-xs font-black text-[var(--red)] animate-pulse uppercase">🎉 Kỷ lục mới! 🎉</span>
              )}
            </div>
            <button 
              onClick={() => setGameState('setup')}
              className="btn-brutal bg-[var(--yellow)] w-full mb-2"
            >
              Chơi Lại
            </button>
            <button onClick={() => router.push('/')} className="btn-brutal bg-[var(--paper)] w-full text-[var(--ink)]">Về Trang Chủ</button>
          </div>
        )}
      </div>

      {/* Shapes tray */}
      <div className="w-full flex justify-between items-center gap-2 h-32 shrink-0 touch-none">
        {shapes.map((shape, idx) => {
          const isDraggingThis = dragState?.trayIdx === idx;
          return (
            <div 
              key={shape ? shape.id : `empty-${idx}`}
              onPointerDown={(e) => {
                if (shape && gameState === 'playing') {
                  e.preventDefault();
                  // Ensure we only start drag on primary button/touch
                  setDragState({
                    shape,
                    trayIdx: idx,
                    startX: e.clientX,
                    startY: e.clientY,
                    currX: e.clientX,
                    currY: e.clientY
                  });
                }
              }}
              className={`flex-1 h-full panel flex items-center justify-center p-2 transition-transform ${
                !shape ? 'opacity-20 pointer-events-none' : 'cursor-grab active:cursor-grabbing hover:-translate-y-1'
              } ${isDraggingThis ? 'opacity-0' : ''}`}
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
                        className="w-4 h-4 md:w-6 md:h-6 rounded-[2px]"
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
          );
        })}
      </div>

      {/* Dragging Overlay */}
      {dragState && (
        <div 
          style={{
            position: 'fixed',
            top: dragState.currY,
            left: dragState.currX,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          <div 
            className="grid gap-[4px]" 
            style={{
              gridTemplateColumns: `repeat(${dragState.shape.grid[0].length}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${dragState.shape.grid.length}, minmax(0, 1fr))`
            }}
          >
            {dragState.shape.grid.map((r, ri) => 
              r.map((val, ci) => (
                <div 
                  key={`${ri}-${ci}`} 
                  className="w-10 h-10 md:w-12 md:h-12 rounded-[2px] shadow-lg"
                  style={{
                    backgroundColor: val ? dragState.shape.color : 'transparent',
                    border: val ? '2px solid rgba(0,0,0,0.5)' : 'none'
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}

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
