'use client';
import { Button, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent } from '@fluentui/react-components';

import GameResult from '@/components/GameResult';
import PracticeSetup from '@/components/PracticeSetup';
import { DismissRegular as UiDismissRegular } from '@fluentui/react-icons/svg/dismiss';
import { TrophyRegular } from '@fluentui/react-icons/svg/trophy';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { parseMeaning } from '@/lib/parse';
import { LEVELS } from '@/types';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

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
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';

  const [board, setBoard] = useState<Board>(Array(8).fill(0).map(() => Array(8).fill(0)));
  const [shapes, setShapes] = useState<(Shape | null)[]>([]);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'vocab' | 'gameover'>('setup');
  const [previewCoords, setPreviewCoords] = useState<{r: number, c: number}[]>([]);
  const [isBumped, setIsBumped] = useState(false);
  const [clearingCells, setClearingCells] = useState<{r: number, c: number}[]>([]);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; vx: number; vy: number; color: string }[]>([]);
  const [comboText, setComboText] = useState('');
  const [fallingCells, setFallingCells] = useState<{r: number, c: number}[]>([]);
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

  const [loading,setLoading]=useState(false),[loadError,setLoadError]=useState('');
  const startGame = async () => {
    if(loading)return;setLoading(true);setLoadError('');
    try {
      const res=await fetch('/api/speedrun?level='+encodeURIComponent(selectedLevel),{signal:AbortSignal.timeout(15000)});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Chưa tải được từ.');
      setQuestions(data);setGameState('playing');
    setBoard(Array(8).fill(0).map(() => Array(8).fill(0)));
    setShapes(getSmartShapes(3, Array(8).fill(0).map(() => Array(8).fill(0))));
    setScore(0);
    setCurrentQIndex(0);

    }catch(e){setLoadError(e instanceof Error?e.message:'Chưa tải được từ.');}finally{setLoading(false);}
  };

  const { data: session } = useSession();

  // Load high score on mount and sync with database
  useEffect(() => {
    const syncHighScore = async () => {
      let localScore = 0;
      const saved = localStorage.getItem('blockblast_highscore');
      if (saved) {
        localScore = parseInt(saved, 10);
        setHighScore(localScore);
      }

      if (session?.user?.id) {
        try {
          const res = await fetch('/api/users/highscores');
          if (res.ok) {
            const data = await res.json();
            const dbScore = data.blockblast ?? 0;

            const maxScore = Math.max(localScore, dbScore);
            setHighScore(maxScore);

            // Sync local storage to DB if local is higher
            if (localScore > dbScore) {
              await fetch('/api/users/highscores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameType: 'blockblast', score: localScore }),
              });
            }
            // Sync DB to local storage if DB is higher
            else if (dbScore > localScore) {
              localStorage.setItem('blockblast_highscore', dbScore.toString());
            }
          }
        } catch (e) {
          console.error('Lỗi đồng bộ kỷ lục:', e);
        }
      }
    };

    syncHighScore();
  }, [session]);

  // Update high score when score changes
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('blockblast_highscore', score.toString());

      // Sync to database if logged in
      if (session?.user?.id) {
        fetch('/api/users/highscores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameType: 'blockblast', score }),
        }).catch(err => console.error('Lỗi cập nhật kỷ lục lên DB:', err));
      }
    }
  }, [score, highScore, session]);

  // Main game loop effect
  useEffect(() => {
    if (gameState === 'playing' && shapes.some(s => s !== null)) {
      if (!checkAnyCanFit(board, shapes)) {
        setGameState('gameover');
      }
    }
  }, [board, shapes, gameState]);

  // Update drag preview shadow coordinates
  useEffect(() => {
    if (!dragState) {
      setPreviewCoords([]);
      return;
    }
    const gridEl = document.getElementById('block-blast-grid');
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    const cellSize = rect.width / 8;
    const shapeRows = dragState.shape.grid.length;
    const shapeCols = dragState.shape.grid[0].length;

    const dropX = dragState.currX - rect.left - (shapeCols * cellSize) / 2;
    const dropY = dragState.currY - rect.top - (shapeRows * cellSize) / 2;

    const targetC = Math.round(dropX / cellSize);
    const targetR = Math.round(dropY / cellSize);

    if (canPlace(board, dragState.shape.grid, targetR, targetC)) {
      const coords = [];
      for (let r = 0; r < shapeRows; r++) {
        for (let c = 0; c < shapeCols; c++) {
          if (dragState.shape.grid[r][c] === 1) {
            coords.push({ r: targetR + r, c: targetC + c });
          }
        }
      }
      setPreviewCoords(coords);
    } else {
      setPreviewCoords([]);
    }
  }, [dragState, board]);

  // Update particles movement animation
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.35 // Gravity pull
      })).filter(p => p.x >= -10 && p.x <= 110 && p.y >= -10 && p.y <= 110));
    }, 16);
    return () => clearInterval(interval);
  }, [particles]);

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

    // Rung bàn cờ nhịp nhẹ
    setIsBumped(true);
    setTimeout(() => setIsBumped(false), 150);

    const newBoard = board.map(row => [...row]);
    let pointsEarned = 0;

    // Đặt tạm thời trên board mới để tính toán nổ
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

    // Các ô sẽ bị nổ
    const cellsToClear: {r: number, c: number}[] = [];
    rowsToClear.forEach(r => {
      for (let c = 0; c < 8; c++) {
        if (newBoard[r][c] === 1) cellsToClear.push({ r, c });
      }
    });
    colsToClear.forEach(c => {
      for (let r = 0; r < 8; r++) {
        if (newBoard[r][c] === 1 && !cellsToClear.some(cell => cell.r === r && cell.c === c)) {
          cellsToClear.push({ r, c });
        }
      }
    });

    const linesCleared = rowsToClear.length + colsToClear.length;
    if (linesCleared > 0) {
      pointsEarned += linesCleared * 100 * linesCleared;

      // Hiển thị banner combo
      let comboMsg = "CLEARED!";
      if (linesCleared === 2) comboMsg = "DOUBLE BLAST!";
      else if (linesCleared === 3) comboMsg = "TRIPLE BLAST!";
      else if (linesCleared >= 4) comboMsg = "MEGA BLAST!!!";
      setComboText(comboMsg);
      setTimeout(() => setComboText(''), 800);
    }

    // Xử lý nổ có hiệu ứng hoạt ảnh
    if (cellsToClear.length > 0) {
      setClearingCells(cellsToClear);

      // Tạo hạt bụi vỡ vụn
      const newParticles: { id: string; x: number; y: number; vx: number; vy: number; color: string }[] = [];
      cellsToClear.forEach(cell => {
        for (let i = 0; i < 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.0 + Math.random() * 2.0;
          newParticles.push({
            id: Math.random().toString(),
            x: (cell.c * 12.5) + 6.25,
            y: (cell.r * 12.5) + 6.25,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            color: shape.color
          });
        }
      });
      setParticles(prev => [...prev, ...newParticles].slice(-100));

      // Chờ hoạt ảnh flash kết thúc rồi mới xóa chính thức
      setTimeout(() => {
        const finalBoard = board.map(row => [...row]);
        // Áp dụng đặt gạch
        for (let r = 0; r < shape.grid.length; r++) {
          for (let c = 0; c < shape.grid[0].length; c++) {
            if (shape.grid[r][c] === 1) {
              finalBoard[boardR + r][boardC + c] = 1;
            }
          }
        }
        // Xóa thực tế trên board
        rowsToClear.forEach(r => {
          for (let c = 0; c < 8; c++) {
            if (finalBoard[r][c] === 1) finalBoard[r][c] = 0;
          }
        });
        colsToClear.forEach(c => {
          for (let r = 0; r < 8; r++) {
            if (finalBoard[r][c] === 1) finalBoard[r][c] = 0;
          }
        });

        setBoard(finalBoard);
        setClearingCells([]);
      }, 250);
    } else {
      setBoard(newBoard);
    }

    setScore(s => s + pointsEarned);

    const newShapes = [...shapes];
    newShapes[trayIdx] = null;
    setShapes(newShapes);

    if (newShapes.every(s => s === null)) {
      setTimeout(() => {
        setGameState('vocab');
      }, 700); // Thêm chút thời gian chờ hiệu ứng nổ kết thúc hẳn
    }
  };
  const handleVocabAnswer = (choiceIdx: number) => {
    if (questions.length === 0 || answerStatus) return;
    const currentQ = questions[currentQIndex];
    const isCorrect = choiceIdx === currentQ.correctIndex;

    setAnswerStatus({ selectedIdx: choiceIdx, isCorrect });

    if (isCorrect) {
      setScore(s => s + 500);


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

        const dropped: {r: number, c: number}[] = [];
        if (emptyCells.length > 0) {
          for (let i=0; i<Math.min(2, emptyCells.length); i++) {
            const rIdx = Math.floor(Math.random() * emptyCells.length);
            const target = emptyCells.splice(rIdx, 1)[0];
            newBoard[target.r][target.c] = 2; // Dead block
            dropped.push(target);
          }
        }

        setFallingCells(dropped);

        setTimeout(() => {
          setBoard(newBoard);
          setFallingCells([]);
          setShapes(getSmartShapes(3, newBoard));
          setGameState('playing');
          setCurrentQIndex(c => (c + 1) % questions.length);
          setAnswerStatus(null);
        }, 600);
      }, 1500);
    }
  };
  if (gameState === 'setup') {
    return <PracticeSetup mode="blockblast" title="Xếp hình" rules={['Kéo khối vào bàn cờ để ghi điểm.','Xếp hết 3 khối rồi trả lời câu hỏi từ vựng.','Trả lời sai sẽ thêm ô bị chặn. Hết chỗ thì kết thúc.']} level={selectedLevel} onLevelChange={setSelectedLevel} onStart={startGame} exitRoute={exitRoute} highScore={highScore} loading={loading} error={loadError} />;
  }

  return (
    <div className="max-w-md mx-auto pt-4 pb-24 md:py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4 md:mb-8 bg-[var(--paper)] p-3 md:p-4 border border-[var(--line)] rounded-xl shrink-0 gap-4 w-full">
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
          <div className="text-xl md:text-2xl font-semibold text-[var(--ink)]">
            Điểm: <span className="text-[var(--blue)]">{score}</span>
          </div>
          {highScore > 0 && (
            <div className="text-sm font-semibold text-[var(--muted)]">
              Kỷ lục: {highScore}
            </div>
          )}
        </div>
        <Button
          onClick={() => router.push(exitRoute)}
          className="w-8 h-8 md:w-10 md:h-10 border border-[var(--line)] bg-[var(--red)] text-white font-semibold rounded-lg hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer"
          title="Thoát game"
         aria-label="Thoát game">
          <UiDismissRegular aria-hidden="true" className="w-4 h-4 ui-close-icon" /></Button>
      </div>

      {/* Board */}
      <div className={`relative panel p-2 md:p-4 mb-6 bg-[var(--line)] border-none flex-shrink-0 touch-none ${isBumped ? 'animate-[bump_0.15s_ease-in-out]' : ''}`}>
        <div id="block-blast-grid" className="grid grid-cols-8 gap-1 bg-[var(--line)] w-fit mx-auto relative">
          {board.map((row, r) => (
            row.map((cell, c) => {
              const isPreview = previewCoords.some(coord => coord.r === r && coord.c === c);
              const previewColor = dragState?.shape.color;
              const isClearing = clearingCells.some(cell => cell.r === r && cell.c === c);
              const isFalling = fallingCells.some(cell => cell.r === r && cell.c === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-sm border transition-all duration-200 ${ isClearing ? 'bg-[var(--paper)] border-white scale-95 animate-[clearFlash_0.25s_ease-out] z-10 ' : isFalling ? 'bg-[var(--ink)] border-[var(--ink)] animate-[fallDown_0.6s_ease-out] flex items-center justify-center after:content-["X"] after:text-red-500 after:font-semibold' : cell === 1 ? 'bg-[var(--blue)] border-[rgba(0,0,0,0.2)] ' : cell === 2 ? 'bg-[var(--ink)] border-[var(--ink)] flex items-center justify-center after:content-["X"] after:text-gray-500 after:font-semibold' : 'bg-[#2d3748] border-[#1a202c]' }`}
                  style={isPreview ? {
                    backgroundColor: previewColor,
                    opacity: 0.35,
                    borderStyle: 'dashed',
                    borderColor: 'rgba(255,255,255,0.5)'
                  } : undefined}
                />
              );
            })
          ))}
        </div>

        {/* Particles Overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {particles.map(p => (
            <div
              key={p.id}
              className="absolute w-2.5 h-2.5 rounded-sm border border-black/30 shadow-sm"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                backgroundColor: p.color,
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        {/* Combo Text Pop-up Overlay */}
        {comboText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-[var(--brand-soft)] text-[var(--blue)] border border-[var(--line)] px-6 py-3 rounded-xl animate-[comboPop_0.6s_ease-out]">
              <span className="text-2xl md:text-3xl font-semibold text-[var(--blue)] ">{comboText}</span>
            </div>
          </div>
        )}

        {/* Vocab Overlay */}
        {gameState === 'vocab' && questions.length > 0 && (
          <Dialog open onOpenChange={(_,d)=>{if(!d.open)setGameState('gameover');}}><DialogSurface><DialogBody><DialogTitle action={<Button aria-label="Kết thúc lượt chơi" onClick={()=>setGameState('gameover')}>Đóng</Button>}>Một câu hỏi nhỏ</DialogTitle><DialogContent>
              <div className="absolute top-4 right-4">
                <SaveToCollection wordId={questions[currentQIndex].id} wordText={questions[currentQIndex].word} />
              </div>
              <span className="text-[var(--red)] font-semibold text-sm mb-2 block text-center shrink-0 animate-pulse">Hết Gạch! Hãy trả lời:</span>
              <h2 className="text-3xl md:text-4xl font-sans font-semibold mb-4 text-[var(--ink)] text-center shrink-0">{questions[currentQIndex].word}</h2>
              <div className="grid grid-cols-1 gap-3 overflow-y-auto p-1">
                {questions[currentQIndex].choices.map((choice, idx) => {
                  const { en, vi } = parseMeaning(choice, questions[currentQIndex].pos || '');
                  return (
                    <Button
                      key={idx}
                      onClick={() => handleVocabAnswer(idx)}
                      className="answer-choice" appearance="secondary" disabled={!!answerStatus} data-result={answerStatus ? idx === questions[currentQIndex].correctIndex ? 'correct' : idx === answerStatus.selectedIdx ? 'wrong' : undefined : undefined}
                    >
                      <span className={`block font-semibold text-base leading-tight mb-1 ${ !answerStatus ? 'text-[var(--ink)] group-hover:text-[var(--ink)]' : (idx === questions[currentQIndex].correctIndex || idx === answerStatus.selectedIdx ? 'text-[var(--ink)]' : 'text-[var(--ink)]') }`}>{en}</span>
                      {vi && <span className={`block font-semibold text-xs ${ !answerStatus ? 'text-[var(--muted)] group-hover:text-[var(--ink)]/80' : (idx === questions[currentQIndex].correctIndex || idx === answerStatus.selectedIdx ? 'text-[var(--ink)]/80' : 'text-[var(--muted)]') }`}>{vi}</span>}
                    {answerStatus && (idx === questions[currentQIndex].correctIndex ? <span> ✓ Đáp án đúng</span> : idx === answerStatus.selectedIdx ? <span> — Bạn đã chọn</span> : null)}</Button>
                  );
                })}
              </div></DialogContent></DialogBody></DialogSurface></Dialog>
        )}

        {gameState === 'gameover' && <div className="game-result-overlay"><GameResult embedded value={score} onReplay={() => setGameState('setup')} exitRoute={exitRoute}>{score>=highScore&&score>0&&<p className="new-record">Kỷ lục mới</p>}</GameResult></div>}

      </div>
      {/* Shapes tray */}
      <div className="w-full h-32 panel flex justify-between items-center gap-4 shrink-0 touch-none p-3 bg-[var(--paper)]">
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
              className={`flex-1 h-full border border-solid border-[var(--line)]/20 rounded-xl flex items-center justify-center p-2 transition-transform bg-[var(--bg)] ${ !shape ? 'opacity-20 pointer-events-none' : 'cursor-grab active:cursor-grabbing ' } ${isDraggingThis ? 'opacity-0' : ''}`}
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
        @keyframes bump {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        @keyframes clearFlash {
          0% { background-color: #fff; transform: scale(1); opacity: 1; filter: brightness(2); }
          100% { background-color: transparent; transform: scale(0); opacity: 0; }
        }
        @keyframes fallDown {
          0% { transform: translateY(-400px) rotate(-15deg); opacity: 0; }
          60% { transform: translateY(0) rotate(0deg); opacity: 1; }
          80% { transform: translateY(-12px); }
          100% { transform: translateY(0); }
        }
        @keyframes comboPop {
          0% { transform: scale(0.3) rotate(-12deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(-5deg); opacity: 1; }
          100% { transform: scale(1) rotate(-5deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
}