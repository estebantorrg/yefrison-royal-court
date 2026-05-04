import React, { useState, useEffect, useCallback, useRef } from 'react';

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

export const YefrisLaserDefense: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<GameMode>('survival');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  
  const [targets, setTargets] = useState<Target[]>([]);
  const [lasers, setLasers] = useState<Laser[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const targetIdCounter = useRef(0);

  // Handle Target Spawn Loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    // Difficulty increases with score (targets spawn faster)
    const spawnRate = Math.max(600, 2000 - (score * 50)); 
    
    const interval = setInterval(() => {
      const newTarget: Target = {
        id: `target-${targetIdCounter.current++}`,
        left: 10 + Math.random() * 80, // Random X position 10% to 90%
        duration: Math.max(2, 5 - (score * 0.1)), // Fall gets faster (min 2s)
      };
      setTargets(prev => [...prev, newTarget]);
    }, spawnRate);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, score]);

  const startGame = (selectedMode: GameMode) => {
    setMode(selectedMode);
    setScore(0);
    setLives(3);
    setTargets([]);
    setLasers([]);
    setGameOver(false);
    setIsPlaying(true);
    targetIdCounter.current = 0;
  };

  const stopGame = () => {
    setIsPlaying(false);
    setTargets([]);
    setLasers([]);
  };

  const handleTargetMiss = useCallback((id: string) => {
    if (gameOver || !isPlaying) return;
    
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
  }, [mode, gameOver, isPlaying]);

  const handleShootTarget = (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!isPlaying || gameOver) return;

    // Get click coords relative to container
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const laserId = `laser-${Date.now()}`;
      setLasers(prev => [...prev, { id: laserId, x, y }]);
      
      // Remove laser after brief flash
      setTimeout(() => {
        setLasers(prev => prev.filter(l => l.id !== laserId));
      }, 150);
    }

    setTargets(prev => prev.filter(t => t.id !== targetId));
    setScore(prev => prev + 10);
  };

  const handleMissedShot = (e: React.MouseEvent) => {
    if (!isPlaying || gameOver) return;
    // Visually fire a laser anyway, but no hit
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const laserId = `laser-${Date.now()}`;
      setLasers(prev => [...prev, { id: laserId, x, y }]);
      
      setTimeout(() => {
        setLasers(prev => prev.filter(l => l.id !== laserId));
      }, 150);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 mb-12">
      <div className="w-full bg-black/60 backdrop-blur-md border border-[#E74C3C]/30 rounded-xl shadow-[0_0_30px_rgba(231,76,60,0.15)] overflow-hidden">
        
        {/* Game Header */}
        <div className="bg-black/40 border-b border-[#E74C3C]/20 p-4 flex justify-between items-center relative z-20">
          <div>
            <h3 className="text-xl font-bold text-[#E74C3C] display-font uppercase tracking-wider">Yefris Defense</h3>
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
                    <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? 'bg-[#E74C3C] shadow-[0_0_8px_#E74C3C]' : 'bg-white/10'}`} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Game Area */}
        <div 
          ref={containerRef}
          className={`relative w-full h-[450px] overflow-hidden bg-gradient-to-b from-black to-[#110505] transition-all duration-300 ${isPlaying && !gameOver ? 'cursor-crosshair' : ''}`}
          onClick={handleMissedShot}
        >
          {/* Menu Overlay */}
          {(!isPlaying || gameOver) && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
              {gameOver ? (
                <>
                  <h2 className="text-5xl font-bold text-[#E74C3C] display-font mb-2 drop-shadow-[0_0_15px_rgba(231,76,60,0.8)]">SYSTEM BREACH</h2>
                  <p className="text-lg text-white mb-6">Final Score: <span className="text-[#F1C40F] font-bold text-2xl">{score}</span></p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold text-white display-font mb-4">Obliviousness Under Attack</h2>
                  <p className="text-white/70 mb-8 max-w-sm">
                    Ricardo Obregon's obsolete systems are falling. Use Yefris's ocular judgment lasers to destroy them before they reach the bottom state.
                  </p>
                </>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => startGame('survival')}
                  className="px-6 py-3 bg-[#E74C3C]/20 hover:bg-[#E74C3C]/40 border border-[#E74C3C] text-[#E74C3C] font-bold rounded uppercase tracking-wider transition-all"
                >
                  {gameOver ? 'Play Again (Survival)' : 'Survival (3 Lives)'}
                </button>
                <button 
                  onClick={() => startGame('endless')}
                  className="px-6 py-3 bg-[#85C1E9]/20 hover:bg-[#85C1E9]/40 border border-[#85C1E9] text-[#85C1E9] font-bold rounded uppercase tracking-wider transition-all"
                >
                  Endless Zen Mode
                </button>
              </div>
            </div>
          )}

          {/* Falling Targets */}
          {targets.map(target => (
            <div 
              key={target.id}
              className="absolute top-[-60px] w-12 h-12 rounded overflow-hidden border-2 border-[#E74C3C] shadow-[0_0_15px_rgba(231,76,60,0.5)] z-10 cursor-crosshair hover:scale-110 hover:border-white transition-transform"
              style={{ 
                left: `${target.left}%`,
                animation: `dropTarget ${target.duration}s linear forwards`
              }}
              onClick={(e) => handleShootTarget(e, target.id)}
              onAnimationEnd={() => handleTargetMiss(target.id)}
            >
              <img src="/ricardo_obregon.jpg" alt="Threat" className="w-full h-full object-cover grayscale opacity-80" />
            </div>
          ))}

          {/* Laser Beams */}
          {lasers.map(laser => {
            // Calculate angle and distance from Yefris (bottom center) to click target
            const startX = containerRef.current?.offsetWidth ? containerRef.current.offsetWidth / 2 : 300;
            const startY = 400; // Yefris Y pos approx
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
                  height: '4px',
                  transformOrigin: '0 50%',
                  transform: `rotate(${angle}deg)`,
                  boxShadow: '0 0 10px #E74C3C, 0 0 20px #F1C40F',
                  opacity: 0.8,
                }}
              />
            );
          })}

          {/* Yefris Turret Image */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            {/* Pulsing aura when playing */}
            {isPlaying && !gameOver && (
              <div className="absolute inset-0 bg-[#E74C3C] blur-2xl rounded-full opacity-20 animate-pulse" />
            )}
            <img 
              src="/yefris_laser.png" 
              alt="Yefris Guardian" 
              className={`w-32 h-auto drop-shadow-2xl transition-transform duration-200 ${lasers.length > 0 ? 'scale-110 brightness-125' : ''}`}
            />
          </div>

        </div>
      </div>
      <style>
        {`
          @keyframes dropTarget {
            0% { top: -60px; transform: rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 450px; transform: rotate(180deg); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};
