import React, { useState, useEffect, useCallback, useRef } from 'react';
// @ts-ignore
import ricardoImg from './ricardo_obregon.jpg';

type GameMode = 'survival' | 'endless';

interface Target {
  id: string;
  left: number;
  duration: number;
}

interface Laser {
  id: string;
  x: number;
  y: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
}

export const YefrisLaserDefense: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [resumeCountdown, setResumeCountdown] = useState<number | null>(null);
  const [mode, setMode] = useState<GameMode>('survival');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  
  const [targets, setTargets] = useState<Target[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const targetIdCounter = useRef(0);

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch(e) {
       console.error("Failed to load leaderboard");
    }
  };

  useEffect(() => {
    if (!isPlaying || gameOver) {
      fetchLeaderboard();
    }
  }, [isPlaying, gameOver]);

  // Handle Resume Countdown Loop
  useEffect(() => {
    if (resumeCountdown === null) return;
    
    if (resumeCountdown > 0) {
      const timer = setTimeout(() => setResumeCountdown(prev => prev! - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsPaused(false);
      setResumeCountdown(null);
    }
  }, [resumeCountdown]);

  // Handle Target Spawn Loop
  useEffect(() => {
    if (!isPlaying || gameOver || isPaused || resumeCountdown !== null) return;

    // Moderate Difficulty Scaling
    // Base spawns at 1.5s. Every 10 points it gets 5% faster (was 15%), capping locally at 400ms.
    const spawnRate = Math.max(400, 1500 * Math.pow(0.95, score / 10)); 
    
    const interval = setInterval(() => {
      const newTarget: Target = {
        id: `target-${targetIdCounter.current++}`,
        left: 10 + Math.random() * 80,
        // Base drops in 4s. Every 10 points it falls 5% faster, capping cleanly at 1.2s.
        duration: Math.max(1.2, 4 * Math.pow(0.95, score / 10)), 
      };
      setTargets(prev => [...prev, newTarget]);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, isPaused, resumeCountdown, score]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScore(0);
    setLives(3);
    setTargets([]);
    setLasers([]);
    setGameOver(false);
    setIsPlaying(true);
    setIsPaused(false);
    setResumeCountdown(null);
    setScoreSubmitted(false);
    targetIdCounter.current = 0;
  };

  const endGame = () => {
    setGameOver(true);
    setIsPlaying(false);
    setIsPaused(false);
    setResumeCountdown(null);
  };

  const startResumeCountdown = () => {
    setResumeCountdown(3);
  };

  const togglePause = () => {
    if (!isPlaying || gameOver || resumeCountdown !== null) return;
    setIsPaused(true);
  }

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmittingScore) return;
    
    setIsSubmittingScore(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score })
      });
      if (res.ok) {
        setScoreSubmitted(true);
        fetchLeaderboard();
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSubmittingScore(false);
    }
  };

  const handleTargetMiss = useCallback((id: string) => {
    if (gameOver || !isPlaying || isPaused || resumeCountdown !== null) return;
    
    setTargets(prev => prev.filter(t => t.id !== id));
    
    if (mode === 'survival') {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          setIsPlaying(false);
        }
        return newLives;
      });
    }
  }, [mode, gameOver, isPlaying, isPaused, resumeCountdown]);

  const fireLaserVisually = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const laserId = `laser-${Date.now()}`;
    setLasers(prev => [...prev, { id: laserId, x, y }]);
    
    setTimeout(() => {
      setLasers(prev => prev.filter(l => l.id !== laserId));
    }, 150);
  };

  const handleShootTarget = (targetId: string, clientX: number, clientY: number) => {
    fireLaserVisually(clientX, clientY);
    setTargets(prev => prev.filter(t => t.id !== targetId));
    setScore(prev => prev + 10);
  };

  const handleMissedShot = (clientX: number, clientY: number) => {
    fireLaserVisually(clientX, clientY);
  };

  const handleGameAreaPointerDown = (e: React.PointerEvent) => {
    if (!isPlaying || gameOver || isPaused || resumeCountdown !== null) return;
    
    let hitTargetId: string | null = null;
    const targetEls = document.querySelectorAll('[data-target-id]');
    
    // Massive aim assist: 40px in every direction
    const HIT_ASSIST = 40; 
    
    for (let i = 0; i < targetEls.length; i++) {
        const rect = targetEls[i].getBoundingClientRect();
        if (
            e.clientX >= rect.left - HIT_ASSIST &&
            e.clientX <= rect.right + HIT_ASSIST &&
            e.clientY >= rect.top - HIT_ASSIST &&
            e.clientY <= rect.bottom + HIT_ASSIST
        ) {
            hitTargetId = targetEls[i].getAttribute('data-target-id');
            break;
        }
    }
    
    if (hitTargetId) {
        handleShootTarget(hitTargetId, e.clientX, e.clientY);
    } else {
        handleMissedShot(e.clientX, e.clientY);
    }
  };

  const isFrozen = isPaused || resumeCountdown !== null;

  return (
    <div className="w-full max-w-2xl mx-auto p-4 mb-12">
      <div className="w-full bg-black/60 backdrop-blur-md border border-[#E74C3C]/30 rounded-xl shadow-[0_0_30px_rgba(231,76,60,0.15)] overflow-hidden">
        
        {/* Game Header */}
        <div className="bg-black/40 border-b border-[#E74C3C]/20 p-4 flex justify-between items-center relative z-20">
          <div>
            <h3 className="text-xl font-bold text-[#E74C3C] display-font uppercase tracking-wider flex items-center gap-3">
              Yefris Defense
              {isPlaying && !gameOver && (
                <button 
                  onClick={togglePause}
                  disabled={resumeCountdown !== null}
                  className="text-xs bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/20 px-2 py-1 rounded tracking-widest text-white transition-colors"
                >
                  PAUSE
                </button>
              )}
            </h3>
            <p className="text-xs text-white/50">{mode === 'survival' ? 'Survival Mode' : 'Endless Mode'}</p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-center">
              <p className="text-xs text-[#F1C40F] uppercase tracking-widest">Score</p>
              <p className="text-2xl font-bold text-white display-font">{score}</p>
            </div>
            {mode === 'survival' && (
              <div className="text-center">
                <p className="text-xs text-[#E74C3C] uppercase tracking-widest">Lives</p>
                <div className="flex gap-1 justify-center mt-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i < lives ? 'bg-[#E74C3C] shadow-[0_0_8px_#E74C3C]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={containerRef}
          className={`relative w-full h-[550px] overflow-hidden bg-gradient-to-b from-black to-[#110505] transition-all duration-300 ${(!isFrozen && !gameOver && isPlaying) ? 'cursor-crosshair' : ''}`}
          onPointerDown={handleGameAreaPointerDown}
        >
          {/* Main Menu / Game Over Overlay */}
          {(!isPlaying || gameOver) && !showLeaderboard && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in overflow-y-auto">
              {gameOver ? (
                <>
                  <h2 className="text-5xl font-bold text-[#E74C3C] display-font mb-2 drop-shadow-[0_0_15px_rgba(231,76,60,0.8)] mt-8">SYSTEM BREACH</h2>
                  <p className="text-lg text-white mb-6">Final Score: <span className="text-[#F1C40F] font-bold text-2xl">{score}</span></p>
                  
                  {mode === 'survival' && score > 0 && !scoreSubmitted && (
                    <form onSubmit={submitScore} className="mb-8 w-full max-w-sm">
                      <p className="text-sm text-[#85C1E9] mb-3 uppercase tracking-wider">Submit to Global Leaderboard</p>
                      <div className="flex">
                        <input 
                          type="text" 
                          maxLength={15}
                          required
                          value={playerName}
                          onChange={e => setPlayerName(e.target.value)}
                          placeholder="Your Name (e.g. Yefrisian)" 
                          className="bg-white/5 border border-white/20 text-white px-4 py-2 rounded-l focus:outline-none focus:border-[#F1C40F] w-full"
                        />
                        <button 
                          type="submit" 
                          disabled={isSubmittingScore}
                          className="bg-[#F1C40F] text-black font-bold px-4 rounded-r uppercase tracking-wider hover:bg-white transition-colors"
                        >
                          Submit
                        </button>
                      </div>
                    </form>
                  )}
                  {scoreSubmitted && (
                    <p className="text-[#2ECC71] font-bold mb-8 animate-pulse tracking-widest uppercase">Score Recorded in the Archives</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold text-white display-font mb-4 mt-8">Obliviousness <br/><span className="text-[#E74C3C]">Under Attack</span></h2>
                  <p className="text-white/70 mb-8 max-w-sm">
                    Ricardo Obregon's systems are dropping rapidly. Use Yefris's ocular lasers to delete them. Difficulty scales aggressively.
                  </p>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button 
                  onClick={() => startGame('survival')}
                  className="px-6 py-3 bg-[#E74C3C]/20 hover:bg-[#E74C3C]/40 border border-[#E74C3C] text-[#E74C3C] font-bold rounded uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(231,76,60,0.3)] hover:shadow-[0_0_20px_rgba(231,76,60,0.6)]"
                >
                  {gameOver ? 'Play Again (Survival)' : 'Survival (Ranked)'}
                </button>
                <button 
                  onClick={() => startGame('endless')}
                  className="px-6 py-3 bg-[#85C1E9]/20 hover:bg-[#85C1E9]/40 border border-[#85C1E9] text-[#85C1E9] font-bold rounded uppercase tracking-wider transition-all"
                >
                  Endless Zen
                </button>
              </div>

              <button 
                onClick={() => setShowLeaderboard(true)}
                className="text-[#F1C40F] hover:text-white underline tracking-widest text-sm uppercase transition-colors"
              >
                View Global Leaderboard
              </button>
            </div>
          )}

          {/* Leaderboard Overlay */}
          {showLeaderboard && (
            <div className="absolute inset-0 z-30 bg-black/95 backdrop-blur-md flex flex-col p-6 animate-fade-in overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-[#F1C40F]/20 pb-4 mt-4">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-[#F1C40F]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  <h3 className="text-2xl font-bold text-[#F1C40F] display-font uppercase tracking-widest">Global Archives</h3>
                </div>
                <button onClick={() => setShowLeaderboard(false)} className="text-white hover:text-[#E74C3C] text-sm uppercase tracking-widest border border-white/20 hover:border-[#E74C3C] px-3 py-1 rounded transition-colors">
                  Close
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto w-full max-w-md mx-auto pr-2 custom-scrollbar">
                {leaderboard.length === 0 ? (
                  <p className="text-white/40 text-center italic py-10">No records found. The archive is empty.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {leaderboard.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                        <span className="font-bold text-white/90 flex items-center gap-3">
                          <span className={`text-base ${i === 0 ? 'text-[#F1C40F]' : (i === 1 ? 'text-gray-300' : (i === 2 ? 'text-orange-400' : 'text-white/30'))}`}>#{i + 1}</span> 
                          {entry.name}
                        </span>
                        <span className="text-[#F1C40F] font-mono tracking-wider">{entry.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pause Menu Overlay */}
          {(isPlaying && isPaused && resumeCountdown === null) && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-4xl font-bold text-white tracking-widest mb-8">PAUSED</h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={startResumeCountdown}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white text-white font-bold rounded uppercase tracking-wider transition-all hover:scale-105"
                >
                  Continue
                </button>
                <button 
                  onClick={endGame}
                  className="px-8 py-3 bg-[#E74C3C]/20 hover:bg-[#E74C3C]/40 border border-[#E74C3C] text-[#E74C3C] font-bold rounded uppercase tracking-wider transition-all hover:scale-105"
                >
                  Surrender
                </button>
              </div>
            </div>
          )}

          {/* Resume Countdown Overlay */}
          {(resumeCountdown !== null) && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <h1 className="text-9xl font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] animate-pulse">
                {resumeCountdown}
              </h1>
            </div>
          )}

          {/* Falling Targets */}
          {targets.map(target => (
            <div 
              key={target.id}
              data-target-id={target.id}
              className="absolute top-[-80px] w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border-[3px] border-[#E74C3C] shadow-[0_0_20px_rgba(231,76,60,0.6)] z-10 transition-transform"
              style={{ 
                left: `${target.left}%`,
                animation: `dropTarget ${target.duration}s linear forwards`,
                animationPlayState: isFrozen ? 'paused' : 'running'
              }}
              onAnimationEnd={() => handleTargetMiss(target.id)}
            >
              <img src={ricardoImg} alt="Threat" className="w-full h-full object-cover grayscale opacity-80 pointer-events-none select-none" draggable={false} />
            </div>
          ))}

          {/* Laser Beams */}
          {lasers.map(laser => {
            const startX = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth / 2 : 300;
            const startY = 480; // approximate yefris eye level inside 550px container
            const length = Math.sqrt(Math.pow(laser.x - startX, 2) + Math.pow(laser.y - startY, 2));
            const angle = Math.atan2(laser.y - startY, laser.x - startX) * (180 / Math.PI);

            return (
              <div 
                key={laser.id}
                className="absolute z-15 bg-gradient-to-r from-white via-[#F1C40F] to-[#E74C3C] rounded-full pointer-events-none"
                style={{
                  left: `${startX}px`,
                  top: `${startY}px`,
                  width: `${length}px`,
                  height: '6px',
                  transformOrigin: '0 50%',
                  transform: `rotate(${angle}deg)`,
                  boxShadow: '0 0 10px #E74C3C, 0 0 20px #F1C40F',
                  opacity: 0.9,
                }}
              />
            );
          })}

          {/* Yefris Turret Image */}
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            {isPlaying && !gameOver && !isFrozen && (
              <div className="absolute inset-0 bg-[#E74C3C] blur-3xl rounded-full opacity-20 animate-pulse" />
            )}
            <img 
              src="/yefris_laser.png" 
              alt="Yefris Guardian" 
              className={`w-40 h-auto drop-shadow-[0_0_15px_rgba(231,76,60,0.5)] transition-transform duration-100 ${lasers.length > 0 ? 'scale-110 brightness-150' : ''}`}
            />
          </div>

        </div>
      </div>
      <style>
        {`
          @keyframes dropTarget {
            0% { top: -80px; transform: rotate(0deg); opacity: 0; }
            5% { opacity: 1; }
            95% { opacity: 1; }
            100% { top: 550px; transform: rotate(180deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};
