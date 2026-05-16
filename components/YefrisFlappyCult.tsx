import React, { useState, useEffect, useRef, useCallback } from 'react';

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface Pipe {
  id: number;
  x: number; // percentage
  topHeight: number; // percentage
  bottomY: number; // percentage starts here
  passed: boolean;
}

export const YefrisFlappyCult: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Game states
  const [playerY, setPlayerY] = useState(50);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const pipeIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Constants
  const GRAVITY = 0.08;
  const JUMP_STRENGTH = -1.6;
  const PIPE_SPEED = 0.3; // Speed per frame
  const PIPE_SPAWN_RATE = 1500; // ms between pipes
  const GAP_SIZE = 35; // percentage gap

  // Hitbox parameters
  const PLAYER_X = 20; // Fixed horizontal position of player (%)
  const PLAYER_WIDTH = 8;
  const PLAYER_HEIGHT = 8;
  const PIPE_WIDTH = 12;

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?game=flappy');
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

  // Jump logic
  const handleJump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setVelocity(JUMP_STRENGTH);
  }, [isPlaying, gameOver]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump]);

  const startGame = async () => {
    setScore(0);
    setPlayerY(50);
    setVelocity(0);
    setPipes([]);
    pipeIdCounter.current = 0;
    setGameOver(false);
    setIsPlaying(true);
    setScoreSubmitted(false);

    try {
      const res = await fetch('/api/game-session', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setGameSessionId(data.sessionId);
      }
    } catch (e) {
      console.warn('Failed to get game session');
    }
  };

  // Main Game Loop using requestAnimationFrame for smooth physics
  const updateGame = useCallback((time: number) => {
    if (!isPlaying || gameOver) return;

    // Delta time normalization
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      
      // We process physics in fixed steps or just scale by a base 16ms frame
      const timeScale = Math.min(deltaTime / 16, 2); 

      // 1. Update Physics
      setPlayerY(prevY => {
        setVelocity(prevV => {
          const nextV = prevV + (GRAVITY * timeScale);
          const nextY = prevY + (nextV * timeScale);
          
          // Floor / Ceiling Collision
          if (nextY >= 95 || nextY <= -5) {
            setGameOver(true);
            setIsPlaying(false);
          }
          return nextV;
        });
        return prevY;
      });

      // 2. Update Pipes
      setPipes(currentPipes => {
        let newPipes = currentPipes.map(p => ({
          ...p,
          x: p.x - (PIPE_SPEED * timeScale)
        }));

        // Remove offscreen
        newPipes = newPipes.filter(p => p.x > -20);
        
        // 3. Collision and Scoring Layer
        setPlayerY(py => {
          for (let p of newPipes) {
            // Check scoring
            if (!p.passed && p.x + PIPE_WIDTH < PLAYER_X) {
              p.passed = true;
              setScore(s => s + 1);
            }

            // AABB Collision bounds
            const overlapX = (PLAYER_X < p.x + PIPE_WIDTH) && (PLAYER_X + PLAYER_WIDTH > p.x);
            if (overlapX) {
              const hitTop = py < p.topHeight;
              const hitBottom = py + PLAYER_HEIGHT > p.bottomY;
              if (hitTop || hitBottom) {
                setGameOver(true);
                setIsPlaying(false);
              }
            }
          }
          return py;
        });

        return newPipes;
      });
    }

    lastTimeRef.current = time;
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
  }, [isPlaying, gameOver]);

  // Start Animation Loop
  useEffect(() => {
    if (isPlaying && !gameOver) {
      requestRef.current = requestAnimationFrame(updateGame);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, gameOver, updateGame]);

  // Wipe last time ref on pause/stop so it doesn't jump
  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = undefined;
    }
  }, [isPlaying]);

  // Pipe Spawner
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const spawnPipe = () => {
      // Dynamic scaling speed as score goes up
      const spawnRate = Math.max(800, PIPE_SPAWN_RATE * Math.pow(0.98, score));
      
      setTimeout(() => {
        if (!isPlaying || gameOver) return;
        
        // Calculate gap placement safely
        const minHeight = 15;
        const maxTop = 100 - GAP_SIZE - minHeight;
        const topH = Math.max(minHeight, Math.random() * maxTop);
        const botY = topH + GAP_SIZE;

        pipeIdCounter.current += 1;
        setPipes(prev => [...prev, {
          id: pipeIdCounter.current,
          x: 100, // spawn at edge
          topHeight: topH,
          bottomY: botY,
          passed: false
        }]);

        spawnPipe();
      }, spawnRate);
    };

    spawnPipe();
  }, [isPlaying, gameOver, score]); // re-binds safely because inner timeout checks isPlaying

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmittingScore || !gameSessionId) return;
    
    setIsSubmittingScore(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score, sessionId: gameSessionId, game: 'flappy' })
      });
      if (res.ok) {
        setScoreSubmitted(true);
        fetchLeaderboard();
      } else {
        const err = await res.json();
        alert(`Failed to submit: ${err.error}`);
      }
    } catch (e) {
       console.error(e);
       alert("Network error.");
    } finally {
      setIsSubmittingScore(false);
    }
  };

  // Rotation logic purely visual based on velocity
  const playerRotation = Math.max(-20, Math.min(45, velocity * 15));

  return (
    <div 
      ref={containerRef}
      onPointerDown={handleJump} // handles mouse down and touch start seamlessly
      className={`w-full max-w-lg mx-auto border border-[#E67E22]/30 rounded-xl bg-black overflow-hidden relative text-white h-[600px] flex flex-col ${isPlaying ? 'cursor-pointer touch-none select-none' : ''}`}
      style={{ touchAction: 'none' }}
    >
      {/* Background Scroll Parallax */}
      <div className={`absolute inset-0 bg-[#0F0A1A] z-0`} />
      
      {/* Clouds / Ruins Parallax Array */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 pointer-events-none">
        <div className={`absolute inset-0 bg-[url('/media__1777867305586.png')] bg-cover mix-blend-screen opacity-20 ${isPlaying ? 'animate-parallax-linear' : ''}`} style={{ animationDuration: '30s', width: '200%' }} />
      </div>

      <style>{`
        @keyframes parallax-linear {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {!isPlaying && !gameOver && (
        <div className="absolute inset-x-0 inset-y-0 z-30 flex flex-col items-center justify-center bg-black/60 p-6 text-center backdrop-blur-sm shadow-xl">
          <h2 className="display-font text-5xl mb-4 text-[#E67E22] tracking-widest text-shadow drop-shadow-[0_0_15px_rgba(230,126,34,0.6)]">Flight of El Homun</h2>
          <p className="text-sm md:text-base mb-8 opacity-80 max-w-sm mx-auto">
            Navigate the ruined pillars of thought. <br/><br/>
            Tap or press <span className="text-[#E67E22] font-bold">SPACEBAR</span> to ascend. Do not touch the pillars.
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-transparent border-2 border-[#E67E22] text-[#E67E22] font-bold text-xl tracking-[0.2em] uppercase rounded hover:bg-[#E67E22] hover:text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(230,126,34,0.2)]"
          >
            Take Flight
          </button>
          
          <button onClick={(e) => { e.stopPropagation(); setShowLeaderboard(!showLeaderboard); }} className="mt-8 text-white/50 hover:text-white uppercase tracking-widest text-xs border-b border-white/20 pb-1 z-40 relative">
            {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
          </button>
        </div>
      )}

      {showLeaderboard && !isPlaying && !gameOver && (
        <div className="absolute inset-0 z-40 pt-48 p-6 bg-black/95 w-full animate-fade-in text-left overflow-y-auto">
          <h3 className="text-[#E67E22] display-font text-3xl mb-6 text-center">Top Aviators</h3>
          {leaderboard.length === 0 ? <p className="text-white/50 text-center">No scores yet.</p> : (
            <div className="space-y-3 max-w-xs mx-auto">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-3 rounded border border-[#E67E22]/20">
                  <div className="flex gap-4">
                    <span className="text-[#E67E22] opacity-70 w-4 font-bold">{idx + 1}.</span>
                    <span className="font-bold">{entry.name}</span>
                  </div>
                  <span className="font-mono text-[#E67E22] font-bold">{entry.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Game Engine Rendering */}
      {(isPlaying || gameOver) && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          
          {/* Big Score HUD */}
          <div className="absolute top-10 w-full text-center z-20">
            <span className="text-6xl text-white font-black drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] opacity-90 stroke-black" style={{ WebkitTextStroke: '2px black' }}>
              {score}
            </span>
          </div>

          {/* El Homun (Player) */}
          <div 
            className="absolute z-20 transition-transform"
            style={{ 
              left: `${PLAYER_X}%`, 
              top: `${playerY}%`,
              width: `${PLAYER_WIDTH}%`,
              height: `${PLAYER_HEIGHT}%`,
              transform: `rotate(${playerRotation}deg)`,
              transition: 'transform 0.1s linear' // smooth rotation only
            }}
          >
            <div className="w-full h-full bg-[url('/homun.webp')] bg-cover bg-center rounded-full drop-shadow-[0_0_10px_rgba(230,126,34,0.8)] border-2 border-[#E67E22]" />
          </div>

          {/* Pipes Rendering */}
          {pipes.map(pipe => (
            <React.Fragment key={pipe.id}>
              {/* Top Pipe */}
              <div 
                className="absolute bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 border-2 border-b-4 border-[#E67E22] rounded-b-sm z-15 shadow-xl"
                style={{
                  left: `${pipe.x}%`,
                  top: 0,
                  width: `${PIPE_WIDTH}%`,
                  height: `${pipe.topHeight}%`
                }}
              >
                {/* Visual texture */}
                <div className="w-full h-full opacity-20 bg-[url('/dog.png')] bg-cover bg-center mix-blend-overlay" />
              </div>

              {/* Bottom Pipe */}
              <div 
                className="absolute bg-gradient-to-r from-gray-800 via-gray-600 to-gray-800 border-2 border-t-4 border-[#E67E22] rounded-t-sm z-15 shadow-xl"
                style={{
                  left: `${pipe.x}%`,
                  top: `${pipe.bottomY}%`,
                  width: `${PIPE_WIDTH}%`,
                  bottom: 0
                }}
              >
                 {/* Visual texture */}
                 <div className="w-full h-full opacity-20 bg-[url('/dog.png')] bg-cover bg-center mix-blend-overlay" />
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center animate-fade-in">
          <h2 className="display-font text-5xl text-[#E67E22] mb-2 drop-shadow-[0_0_15px_rgba(230,126,34,0.5)]">Grounded</h2>
          <p className="text-base mb-6 text-white/80">The pillars of thought have caught you.</p>
          
          <div className="bg-white/10 px-12 py-6 rounded-2xl border border-white/10 shadow-2xl mb-8">
            <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">Pillars Passed</p>
            <div className="text-6xl font-black text-[#E67E22]">
              {score}
            </div>
          </div>

          {!scoreSubmitted ? (
            <form onSubmit={submitScore} className="flex flex-col gap-4 w-full max-w-xs mx-auto mb-8">
              <input 
                type="text" 
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter Name"
                maxLength={20}
                required
                className="bg-black/80 border border-[#E67E22]/50 text-white px-4 py-3 rounded text-center font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#E67E22]"
              />
              <button 
                type="submit" 
                disabled={isSubmittingScore || !playerName.trim() || !gameSessionId} // disable if no token
                className="w-full bg-[#E67E22] text-black font-black uppercase tracking-widest py-4 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingScore ? 'Charting...' : (gameSessionId ? 'Submit Log' : 'Replay to Submit')}
              </button>
              {!gameSessionId && <p className="text-red-400 text-xs font-bold uppercase">Session Invalid. Please refresh.</p>}
            </form>
          ) : (
            <p className="text-[#E67E22] mb-8 font-black tracking-widest uppercase bg-white/10 py-3 px-6 rounded-lg border border-[#E67E22]/50">Log Recorded</p>
          )}

          <div className="flex gap-4">
             <button 
                onClick={() => { setGameOver(false); setIsPlaying(false); setShowLeaderboard(true); fetchLeaderboard(); }}
                className="px-6 py-3 border border-white/20 text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-xs font-bold rounded"
              >
                Leaderboard
              </button>
              <button 
                onClick={startGame}
                className="px-6 py-3 bg-[#E67E22]/20 border border-[#E67E22] text-[#E67E22] hover:bg-[#E67E22] hover:text-black transition-all uppercase tracking-widest text-xs rounded font-bold"
              >
                Take Flight Again
              </button>
          </div>
        </div>
      )}
    </div>
  );
};
