'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LEVELS } from '@/types';
import { parseMeaning } from '@/lib/parse';
import SaveToCollection from '@/app/(main)/collections/SaveToCollection';

interface Question {
  id: number;
  targetMeaning: string;
  pos: string | null;
  choices: string[];
  correctIndex: number;
}

interface Target {
  id: string;
  text: string;
  isCorrect: boolean;
  top: number; // percentage
  duration: number; // seconds
  delay: number; // seconds
  direction: 'ltr' | 'rtl';
}

interface Explosion {
  id: string;
  x: number;
  y: number;
  color: string;
}

export default function SniperClient({ collectionId }: { collectionId?: string }) {
  const router = useRouter();
  const exitRoute = collectionId ? '/collections' : '/';
  const exitLabel = collectionId ? 'Quay lại Bộ sưu tập' : 'Về Trang Chủ';
  
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'gameover'>('setup');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<'normal' | 'hardcore'>('normal');
  
  const [targets, setTargets] = useState<Target[]>([]);
  const [flash, setFlash] = useState<'green' | 'red' | null>(null);
  const [loading, setLoading] = useState(false);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [playedWords, setPlayedWords] = useState<Question[]>([]);
  const [isRecoil, setIsRecoil] = useState(false);
  const [isMuzzleFlash, setIsMuzzleFlash] = useState(false);
  const [brokenTargets, setBrokenTargets] = useState<{ id: string; text: string; x: number; y: number; isLeft: boolean }[]>([]);

  useEffect(() => {
    if (gameState === 'setup') {
      setPlayedWords([]);
    }
  }, [gameState]);

  useEffect(() => {
    const currentQ = questions[currentQIndex];
    if (gameState === 'playing' && currentQ) {
      setPlayedWords(prev => {
        if (prev.some(w => w.id === currentQ.id)) return prev;
        return [...prev, currentQ];
      });
    }
  }, [currentQIndex, gameState, questions]);

  const fetchQuestions = async () => {
    try {
      const collectionParam = collectionId ? `&collectionId=${collectionId}` : '';
      const res = await fetch(`/api/sniper?level=${selectedLevel}${collectionParam}`);
      const data = await res.json();
      if (!data.error) {
        setQuestions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startGame = async () => {
    setLoading(true);
    await fetchQuestions();
    setScore(0);
    setLives(3);
    setCurrentQIndex(0);
    setBrokenTargets([]);
    setIsRecoil(false);
    setIsMuzzleFlash(false);
    setGameState('playing');
    setLoading(false);
  };

  useEffect(() => {
    if (gameState === 'playing' && questions.length > 0 && lives > 0) {
      generateTargets();
    }
  }, [currentQIndex, questions, gameState]);

  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('gameover');
    }
  }, [lives]);

  const generateTargets = () => {
    if (currentQIndex >= questions.length) {
      // Loop back or fetch more. For now just loop back.
      setCurrentQIndex(0);
      return;
    }

    const currentQ = questions[currentQIndex];
    
    // Base duration gets faster as score increases
    let baseDuration;
    if (difficulty === 'hardcore') {
      baseDuration = Math.max(1.5, 3 - (score / 1000)); 
    } else {
      baseDuration = Math.max(3, 6 - (score / 1000));
    }

    const lanes = [12, 22, 32, 42];
    // Shuffle lanes
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }

    const newTargets: Target[] = currentQ.choices.map((choice, idx) => ({
      id: `${currentQIndex}-${idx}`,
      text: choice,
      isCorrect: idx === currentQ.correctIndex,
      top: lanes[idx] + (Math.random() * 3 - 1.5), // slight vertical variance within lane
      duration: baseDuration + (Math.random() * 2), // random variance
      delay: Math.random() * 1.5,
      direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
    }));

    setTargets(newTargets);
  };

  const handleShoot = (target: Target, x: number, y: number) => {
    if (gameState !== 'playing') return;

    // Trigger gun effects
    setIsMuzzleFlash(true);
    setIsRecoil(true);
    setTimeout(() => setIsMuzzleFlash(false), 50);
    setTimeout(() => setIsRecoil(false), 150);

    const explosionId = Date.now().toString();
    setExplosions(prev => [...prev, { id: explosionId, x, y, color: target.isCorrect ? '#10b981' : '#ef4444' }]);
    setTimeout(() => {
      setExplosions(prev => prev.filter(e => e.id !== explosionId));
    }, 600);

    // Spawn broken target halves
    const brokenId = Date.now().toString();
    setBrokenTargets(prev => [
      ...prev,
      { id: `${brokenId}-L`, text: target.text, x, y, isLeft: true },
      { id: `${brokenId}-R`, text: target.text, x, y, isLeft: false }
    ]);
    setTimeout(() => {
      setBrokenTargets(prev => prev.filter(t => !t.id.startsWith(brokenId)));
    }, 1000);

    if (target.isCorrect) {
      setFlash('green');
      setScore(s => s + 100);
      setTargets([]);
      setTimeout(() => {
        setFlash(null);
        setCurrentQIndex(c => c + 1);
      }, 300);
    } else {
      setFlash('red');
      setLives(l => l - 1);
      setTargets(prev => prev.filter(t => t.id !== target.id));
      setTimeout(() => setFlash(null), 300);
    }
  };

  const handleTargetMiss = (target: Target) => {
    if (gameState !== 'playing') return;
    if (target.isCorrect) {
      // Let the correct target escape!
      setFlash('red');
      setLives(l => l - 1);
      setTargets([]);
      setTimeout(() => {
        setFlash(null);
        setCurrentQIndex(c => c + 1);
      }, 300);
    } else {
      // Wrong target escaped, just remove it from DOM
      setTargets(prev => prev.filter(t => t.id !== target.id));
    }
  };

  if (gameState === 'setup') {
    return (
      <div className="flex items-center justify-center py-20 px-4 min-h-[calc(100vh-80px)]">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--ink)] relative">
          <button
            onClick={() => router.push(exitRoute)}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm z-10"
            title={exitLabel}
          >
            X
          </button>
          <h2 className="text-4xl font-serif font-black uppercase mb-2 text-[var(--ink)]">Thiện Xạ</h2>
          <p className="text-xl font-black mb-8">Bắn Hạ Từ Vựng</p>
          
          <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-8 text-left rounded-xl">
            <h3 className="font-black text-lg mb-2 border-b-2 border-dashed border-[var(--line)] pb-2">Luật chơi:</h3>
            <ul className="font-bold text-sm space-y-2">
              <li>Nghĩa Tiếng Việt sẽ hiện ở dưới.</li>
              <li>Tìm và BẮN đúng từ Tiếng Anh đang bay lượn trên màn hình.</li>
              <li>Bắn sai: Mất 1 mạng.</li>
              <li>Để mục tiêu xổng mất: Mất 1 mạng.</li>
              <li>Bạn có 3 mạng. Hết mạng = GAME OVER.</li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--red)] transition-shadow appearance-none cursor-pointer text-center text-lg"
            >
              <option value="all">Mọi từ vựng</option>
              {LEVELS.map(l => <option key={l} value={l}>Trình độ {l}</option>)}
            </select>

            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'normal' | 'hardcore')}
              className="w-full px-4 py-3 border-[3px] border-[var(--line)] rounded-xl font-bold bg-[var(--paper)] focus:outline-none focus:shadow-[4px_4px_0_var(--red)] transition-shadow appearance-none cursor-pointer text-center text-lg"
            >
              <option value="normal">Mức: Tà tà</option>
              <option value="hardcore">Mức: Đột tử</option>
            </select>
          </div>

          <button onClick={startGame} disabled={loading} className={`w-full btn-brutal bg-[var(--blue)] text-white py-4 text-2xl uppercase shadow-[4px_4px_0_var(--ink)] mb-4 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'ĐANG TẢI...' : 'VÀO TRƯỜNG BẮN'}
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover') {
    return (
      <div className="flex items-center justify-center py-20 px-4 min-h-[calc(100vh-80px)]">
        <div className="panel max-w-md w-full text-center border-[4px] border-[var(--ink)] shadow-[8px_8px_0_var(--red)] relative">
          <button
            onClick={() => router.push(exitRoute)}
            className="absolute top-4 right-4 w-8 h-8 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 cursor-pointer text-sm z-10"
            title={exitLabel}
          >
            X
          </button>
          <h2 className="text-5xl font-serif font-black uppercase mb-4 text-[var(--red)]">TỬ TRẬN</h2>
          <p className="text-2xl font-black mb-4">Điểm thiện xạ:</p>
          <div className="text-7xl font-black text-[var(--ink)] mb-6">{score}</div>
          
          {playedWords.length > 0 && (
            <div className="bg-[var(--paper)] p-4 border-[3px] border-[var(--line)] mb-6 text-left rounded-xl max-h-[200px] overflow-y-auto w-full">
              <h3 className="font-black text-sm mb-2 border-b-2 border-dashed border-[var(--line)] pb-2 uppercase text-[var(--blue)]">Các từ đã xuất hiện:</h3>
              <ul className="space-y-2">
                {playedWords.map(q => {
                  const { en, vi } = parseMeaning(q.targetMeaning, q.pos || '');
                  const targetWord = q.choices[q.correctIndex];
                  return (
                    <li key={q.id} className="flex justify-between items-center border-b border-gray-100 last:border-b-0 pb-1 text-xs gap-2">
                      <span className="text-[var(--ink)] truncate">
                        <span className="font-bold">{targetWord}</span> <span className="font-normal">({vi || en})</span>
                      </span>
                      <SaveToCollection wordId={q.id} wordText={targetWord} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          <button onClick={startGame} disabled={loading} className={`w-full btn-brutal bg-[var(--yellow)] text-[var(--ink)] py-4 text-xl uppercase shadow-[4px_4px_0_var(--ink)] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {loading ? 'ĐANG TẢI...' : 'CHƠI LẠI'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className={`relative overflow-hidden w-full h-[calc(100vh-64px)] md:h-[calc(100vh-80px)] cursor-sniper transition-colors duration-200 ${
      flash === 'green' ? 'bg-green-300' : flash === 'red' ? 'bg-red-400' : 'bg-[var(--bg)]'
    } ${isRecoil ? 'animate-screen-recoil' : ''}`}>
      
      {isMuzzleFlash && (
        <div className="absolute inset-0 bg-white/50 pointer-events-none z-50 animate-flash-fast" />
      )}
      
      {/* Top Bar (Score & Lives) */}
      <div className="absolute top-4 left-4 right-4 flex items-center z-10 pointer-events-none gap-2">
        <div className="panel py-2 px-3 md:px-4 bg-[var(--paper)] text-xl md:text-2xl font-black text-[var(--ink)] flex-1">
          ĐIỂM: <span className="text-[var(--blue)]">{score}</span>
        </div>
        <div className="panel py-2 px-3 md:px-4 bg-[var(--paper)] text-xs md:text-sm font-mono font-black text-[var(--ink)] flex-none shadow-[2px_2px_0_var(--line)] flex items-center h-full">
          MẠNG:&nbsp;
          {[...Array(3)].map((_, i) => (
            <span key={i} className={i < lives ? 'text-[var(--red)] font-black text-sm md:text-base mr-0.5' : 'text-gray-300 text-sm md:text-base mr-0.5'}>
              X
            </span>
          ))}
        </div>
        <button 
          onClick={() => router.push(exitRoute)} 
          className="w-8 h-8 md:w-10 md:h-10 border-2 border-[var(--line)] bg-[var(--red)] text-white font-black rounded-lg shadow-[2px_2px_0_var(--line)] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center shrink-0 ml-2 pointer-events-auto cursor-pointer text-sm md:text-base"
          title="Thoát game"
        >
          X
        </button>
      </div>

      {/* Target Zone */}
      <div className="absolute inset-0 z-0">
        {targets.map(target => (
          <div
            key={target.id}
            onAnimationEnd={() => handleTargetMiss(target)}
            onPointerDown={(e) => {
              e.preventDefault();
              handleShoot(target, e.clientX, e.clientY);
            }}
            className="absolute whitespace-nowrap bg-[var(--paper)] text-[var(--ink)] font-black text-lg md:text-3xl px-4 py-2 md:px-6 md:py-3 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--ink)] md:shadow-[6px_6px_0_var(--ink)] cursor-crosshair hover:scale-110 active:scale-95 transition-transform"
            style={{
              top: `${target.top}%`,
              animation: `fly-${target.direction} ${target.duration}s linear ${target.delay}s forwards`,
              [target.direction === 'ltr' ? 'left' : 'right']: '-50%',
            }}
          >
            {target.text}
          </div>
        ))}
        
        {explosions.map(exp => (
          <div key={exp.id} className="absolute pointer-events-none" style={{ left: exp.x, top: exp.y, zIndex: 50 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              const distance = 40 + Math.random() * 40;
              const tx = Math.cos(angle) * distance;
              const ty = Math.sin(angle) * distance;
              return (
                <div
                  key={i}
                  className="absolute w-3 h-3 md:w-4 md:h-4 border-[2px] border-[var(--line)]"
                  style={{
                    backgroundColor: exp.color,
                    '--tx': `${tx}px`,
                    '--ty': `${ty}px`,
                    animation: `particle-explode 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`
                  } as any}
                />
              );
            })}
          </div>
        ))}
        {brokenTargets.map(part => (
          <div
            key={part.id}
            className={`absolute pointer-events-none whitespace-nowrap bg-[var(--paper)] text-[var(--ink)] font-black text-lg md:text-3xl px-4 py-2 md:px-6 md:py-3 border-[3px] border-[var(--line)] shadow-[4px_4px_0_var(--ink)] md:shadow-[6px_6px_0_var(--ink)] ${
              part.isLeft ? 'animate-fall-left' : 'animate-fall-right'
            }`}
            style={{
              left: part.x,
              top: part.y,
              clipPath: part.isLeft ? 'inset(0 50% 0 0)' : 'inset(0 0 0 50%)',
              zIndex: 40,
            }}
          >
            {part.text}
          </div>
        ))}
      </div>

      {/* Bottom Mission Panel */}
      <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 w-[95%] md:w-[90%] max-w-2xl z-10 pointer-events-none">
        <div className="panel bg-[var(--paper)] border-[3px] md:border-[4px] border-[var(--ink)] shadow-[6px_6px_0_var(--yellow)] p-3 md:p-6 text-center max-h-[40vh] flex flex-col pointer-events-auto">
          <span className="text-xs md:text-sm font-black text-[var(--red)] uppercase tracking-widest mb-1 block animate-pulse shrink-0">
            Mục tiêu cần diệt:
          </span>
          <div className="overflow-y-auto">
            <h2 className="text-base md:text-3xl font-serif font-black text-[var(--ink)]">
              {currentQ ? (
                (() => {
                  const { en, vi } = parseMeaning(currentQ.targetMeaning, currentQ.pos || '');
                  return (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-2">
                        <span className="leading-tight">{en}</span>
                      </div>
                      {vi && <span className="text-sm md:text-xl font-bold text-[var(--muted)]">{vi}</span>}
                    </div>
                  );
              })()
            ) : 'Đang nạp đạn...'}
          </h2>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fly-ltr {
          0% { left: -30%; }
          100% { left: 130%; }
        }
        @keyframes fly-rtl {
          0% { right: -30%; }
          100% { right: 130%; }
        }
        /* Make cursor a sniper scope reticle */
        .cursor-sniper, .cursor-sniper * {
          cursor: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='none' stroke='%23ef4444' stroke-width='2'/><circle cx='16' cy='16' r='2' fill='%23ef4444'/><line x1='16' y1='2' x2='16' y2='30' stroke='%23ef4444' stroke-width='1.5'/><line x1='2' y1='16' x2='30' y2='16' stroke='%23ef4444' stroke-width='1.5'/></svg>") 16 16, crosshair !important;
        }
        @keyframes particle-explode {
          0% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0) rotate(360deg); opacity: 0; }
        }
        @keyframes screen-recoil {
          0% { transform: translateY(0); }
          10% { transform: translateY(-10px) scale(1.005); }
          100% { transform: translateY(0) scale(1); }
        }
        .animate-screen-recoil {
          animation: screen-recoil 0.15s ease-out;
        }
        @keyframes flash-fast {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-flash-fast {
          animation: flash-fast 0.05s ease-out forwards;
        }
        @keyframes fall-left {
          0% {
            transform: translate(-100%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-180%, 250px) rotate(-45deg);
            opacity: 0;
          }
        }
        @keyframes fall-right {
          0% {
            transform: translate(0%, -50%) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(80%, 250px) rotate(45deg);
            opacity: 0;
          }
        }
        .animate-fall-left {
          animation: fall-left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        .animate-fall-right {
          animation: fall-right 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>
    </div>
  );
}
