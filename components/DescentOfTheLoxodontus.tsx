import React, { useState, useEffect, useCallback, useRef } from 'react';

interface LeaderboardEntry {
  name: string;
  score: number;
}

interface Orb {
  id: string;
  x: number; // 0 to 100 percentage
  y: number; // 0 to 100 percentage
  speed: number;
}

export const DescentOfTheLoxodontus: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  
  // Player state: X position (0 to 100)
  const [playerX, setPlayerX] = useState(50);
  
  const [orbs, setOrbs] = useState<Orb[]>([]);
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  const orbIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?game=loxodontus');
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      if (e.key === 'ArrowLeft') {
        setPlayerX(prev => Math.max(5, prev - 10));
      } else if (e.key === 'ArrowRight') {
        setPlayerX(prev => Math.min(95, prev + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver]);

  // Touch Support
  const handleTouch = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isPlaying || gameOver || !containerRef.current) return;
    // Calculate relative x position
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const relativeX = ((clientX - rect.left) / rect.width) * 100;
    setPlayerX(Math.max(5, Math.min(95, relativeX)));
  };

  const startGame = async () => {
    setScore(0);
    setPlayerX(50);
    setOrbs([]);
    orbIdCounter.current = 0;
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

  // Game Loop: Update positions and check collisions
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setScore(s => s + 1); // Passive score increase

      setOrbs(currentOrbs => {
        let validOrbs = currentOrbs.filter(o => o.y > -10); // Remove ones that floated past top
        
        // Move orbs up
        validOrbs = validOrbs.map(orb => ({
          ...orb,
          y: orb.y - orb.speed
        }));

        // Collision Check
        // Player is at playerX, y=15. Player width is ~10%, height ~10%
        // Orbs are width ~6%, height ~6%
        for (const orb of validOrbs) {
          const dx = Math.abs(orb.x - playerX);
          const dy = Math.abs(orb.y - 15);
          
          if (dx < 8 && dy < 8) { // rough collision bounds
            clearInterval(gameLoop);
            setGameOver(true);
            setIsPlaying(false);
            return validOrbs; // Game over, stop
          }
        }

        return validOrbs;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, playerX]);

  // Orb Spawner Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const spawnRate = Math.max(300, 1500 * Math.pow(0.95, score / 100)); 
    
    const spawner = setInterval(() => {
      orbIdCounter.current += 1;
      setOrbs(prev => [...prev, {
        id: `orb-${orbIdCounter.current}`,
        x: 10 + Math.random() * 80,
        y: 110, // Start just below screen
        speed: 1 + Math.random() * 1.5 + (score / 1000) // Increase base speed over time
      }]);
    }, spawnRate);

    return () => clearInterval(spawner);
  }, [isPlaying, gameOver, score]);

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmittingScore || !gameSessionId) return;
    
    setIsSubmittingScore(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score, sessionId: gameSessionId, game: 'loxodontus' })
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

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleTouch}
      onTouchMove={handleTouch}
      className={`w-full max-w-lg mx-auto border border-[#85C1E9]/30 rounded-xl bg-black overflow-hidden relative text-white min-h-[60vh] flex flex-col ${isPlaying ? 'cursor-none touch-none' : ''}`}
      style={{ userSelect: 'none' }}
    >
      <style>{`
        @keyframes floatUpFast {
          0% { transform: translateY(100vh); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-20vh); opacity: 0; }
        }
      `}</style>

      {/* Background abyss effect */}
      <div className={`absolute inset-0 bg-gradient-to-b from-[#010b14] to-[#041d33] transition-colors duration-1000 ${isPlaying ? 'animate-pulse opacity-80' : ''}`} />

      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 p-6 text-center backdrop-blur-sm">
          <h2 className="display-font text-5xl mb-4 text-[#85C1E9] tracking-widest text-shadow drop-shadow-[0_0_15px_rgba(133,193,233,0.5)]">Descent of the Loxodontus</h2>
          <p className="text-sm md:text-base mb-8 opacity-80 max-w-sm mx-auto">
            Sink into the oceanic depths of absolute silence. Use your <span className="text-[#85C1E9]">mouse</span> or <span className="text-[#85C1E9]">touch</span> to drift left and right. Dodge expanding orbs of <span className="text-red-400 font-bold">Logic</span> and <span className="text-red-400 font-bold">Reason</span>.
          </p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-transparent border-2 border-[#85C1E9] text-[#85C1E9] font-bold text-xl tracking-[0.2em] uppercase rounded hover:bg-[#85C1E9] hover:text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(133,193,233,0.2)]"
          >
            Sink Deep
          </button>
          
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="mt-8 text-[#85C1E9]/50 hover:text-[#85C1E9] uppercase tracking-widest text-xs border-b border-[#85C1E9]/20 pb-1">
            {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
          </button>
        </div>
      )}

      {showLeaderboard && !isPlaying && !gameOver && (
        <div className="absolute inset-0 z-30 pt-48 p-6 bg-black/90 w-full animate-fade-in text-left overflow-y-auto">
          <h3 className="text-[#85C1E9] display-font text-2xl mb-4 text-center">Trench Dwellers</h3>
          {leaderboard.length === 0 ? <p className="text-white/50 text-center">No scores yet.</p> : (
            <div className="space-y-2 max-w-xs mx-auto">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded border border-[#85C1E9]/10">
                  <div className="flex gap-4">
                    <span className="text-[#85C1E9] opacity-70 w-4">{idx + 1}.</span>
                    <span className="font-bold">{entry.name}</span>
                  </div>
                  <span className="font-mono text-[#85C1E9]">{entry.score} ft</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isPlaying && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          
          {/* Parallax Debris for falling illusion */}
          {[...Array(20)].map((_, i) => (
            <div 
              key={`debris-${i}`}
              className="absolute w-1 h-1 bg-[#85C1E9]/30 rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                animation: `floatUpFast ${1 + Math.random() * 2}s linear infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}

          <div className="absolute top-4 left-4 text-[#85C1E9] font-bold text-xl tracking-widest opacity-50 z-20">
            {score} ft
          </div>

          {/* UX Drift Hints */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 font-black tracking-widest text-sm rotate-[-90deg] origin-left">
            ← DRIFT LEFT
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/10 font-black tracking-widest text-sm rotate-[90deg] origin-right">
            DRIFT RIGHT →
          </div>

          {/* El Homun (Player) */}
          <div 
            className="absolute z-20 w-16 h-16 -ml-8 -mt-8"
            style={{ 
              left: `${playerX}%`, 
              top: `15%`,
              transition: 'left 0.05s linear' // smooth horizontal jitter
            }}
          >
            <div className="w-full h-full bg-[url('/homun.webp')] bg-cover bg-center mix-blend-screen opacity-90 drop-shadow-[0_0_10px_rgba(133,193,233,0.5)] rounded-full border border-[#85C1E9]" />
          </div>

          {/* Orbs */}
          {orbs.map(orb => (
            <div 
              key={orb.id}
              className="absolute w-12 h-12 -ml-6 -mt-6 bg-gradient-radial from-red-500 via-red-900 to-transparent rounded-full flex items-center justify-center mix-blend-screen shadow-[0_0_15px_rgba(239,68,68,0.8)] opacity-90 animate-pulse"
              style={{
                left: `${orb.x}%`,
                top: `${orb.y}%`
              }}
            >
              <div className="w-2 h-2 bg-white rounded-full opacity-80" />
            </div>
          ))}
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 text-center">
          <h2 className="display-font text-5xl text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">Resurfaced</h2>
          <p className="text-base mb-6 text-white/80">You collided with Reason. The Silence ends.</p>
          <div className="text-3xl font-mono text-[#85C1E9] mb-6 border-y border-[#85C1E9]/20 py-4 w-full">
            Depth: {score} ft
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
                className="bg-black/50 border border-[#85C1E9]/50 text-white px-4 py-3 rounded focus:outline-none focus:ring-2 focus:ring-[#85C1E9]"
              />
              <button 
                type="submit" 
                disabled={isSubmittingScore || !playerName.trim() || !gameSessionId} // disable if no token
                className="w-full bg-[#85C1E9] text-black font-bold uppercase tracking-widest py-3 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmittingScore ? 'Sinking Data...' : (gameSessionId ? 'Submit Depth' : 'Replay to Submit')}
              </button>
              {!gameSessionId && <p className="text-red-400 text-xs">Session Invalid. Please refresh.</p>}
            </form>
          ) : (
            <p className="text-[#85C1E9] mb-8 font-bold tracking-widest uppercase">Depth Recorded</p>
          )}

          <div className="flex gap-4">
             <button 
                onClick={() => { setGameOver(false); setIsPlaying(false); setShowLeaderboard(true); fetchLeaderboard(); }}
                className="px-6 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-sm rounded"
              >
                Leaderboard
              </button>
              <button 
                onClick={startGame}
                className="px-6 py-2 bg-[#85C1E9]/10 border border-[#85C1E9]/30 text-[#85C1E9] hover:bg-[#85C1E9]/30 hover:text-white transition-colors uppercase tracking-widest text-sm rounded font-bold"
              >
                Dive Again
              </button>
          </div>
        </div>
      )}
    </div>
  );
};
