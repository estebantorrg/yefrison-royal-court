import React, { useState, useEffect, useRef } from 'react';

type GameMode = 'survival';

interface LeaderboardEntry {
  name: string;
  score: number;
}

const WORD_BANK = [
  // Oblivion (Correct Swipe Right)
  { word: "Naps", isOblivion: true },
  { word: "Tennis Balls", isOblivion: true },
  { word: "Barking", isOblivion: true },
  { word: "A Stick", isOblivion: true },
  { word: "Empty Space", isOblivion: true },
  { word: "Belly Rubs", isOblivion: true },
  { word: "Drool", isOblivion: true },
  { word: "Sunbeams", isOblivion: true },
  { word: "Unfocused Staring", isOblivion: true },
  { word: "Chasing Shadows", isOblivion: true },

  // Thought (Correct Swipe Left)
  { word: "Taxes", isOblivion: false },
  { word: "Algorithms", isOblivion: false },
  { word: "Existential Dread", isOblivion: false },
  { word: "Quantum Physics", isOblivion: false },
  { word: "Mortgages", isOblivion: false },
  { word: "Philosophy", isOblivion: false },
  { word: "Calculus", isOblivion: false },
  { word: "Ricardo Obregon", isOblivion: false },
  { word: "Self-Awareness", isOblivion: false },
  { word: "Regret", isOblivion: false },
  { word: "Syllogisms", isOblivion: false },
];

export const TheBurdenOfChoice: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<{ word: string, isOblivion: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(2000);

  // Physics States
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [swipeAnim, setSwipeAnim] = useState<'left' | 'right' | null>(null);
  const isAnimating = useRef(false);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // Focus ref so card catches keyboard automatically if we want, but window listener is fine

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver || isAnimating.current) return;
      if (e.key === 'ArrowLeft') {
        handleSwipeOut('thought');
      } else if (e.key === 'ArrowRight') {
        handleSwipeOut('oblivion');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, currentWord]);

  // Fetch Leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard?game=burden');
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (e) {
      console.error("Failed to load leaderboard");
    }
  };

  useEffect(() => {
    if (!isPlaying || gameOver) {
      fetchLeaderboard();
    }
  }, [isPlaying, gameOver]);

  // Game Loop (Timer)
  useEffect(() => {
    if (!isPlaying || gameOver || !currentWord || isAnimating.current) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 50) {
          clearInterval(interval);
          setGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 50;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, gameOver, currentWord]);

  const startGame = async () => {
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setScoreSubmitted(false);
    setSwipeAnim(null);
    setDragPos({ x: 0, y: 0 });
    pickNextWord(0);

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

  const pickNextWord = (currentScore: number) => {
    const nextMaxTime = Math.max(500, 2000 * Math.pow(0.95, currentScore));
    setMaxTime(nextMaxTime);
    setTimeLeft(nextMaxTime);

    // Pick random unequal to current
    let nextWord;
    do {
      nextWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
    } while (currentWord && nextWord.word === currentWord.word);

    setCurrentWord(nextWord);
  };

  const handleSwipeOut = (choice: 'thought' | 'oblivion') => {
    if (isAnimating.current || !currentWord) return;
    isAnimating.current = true;

    // Visual swipe animation direction
    setSwipeAnim(choice === 'oblivion' ? 'right' : 'left');

    const isCorrect = (choice === 'oblivion' && currentWord.isOblivion) ||
      (choice === 'thought' && !currentWord.isOblivion);

    setTimeout(() => {
      if (isCorrect) {
        const nextScore = score + 1;
        setScore(nextScore);
        pickNextWord(nextScore);
        setSwipeAnim(null);
        setDragPos({ x: 0, y: 0 });
      } else {
        setGameOver(true);
        setIsPlaying(false);
        setSwipeAnim(null);
        setDragPos({ x: 0, y: 0 });
      }
      isAnimating.current = false;
    }, 250); // wait for swipe animation to finish
  };

  // Pointer Events for native physical swiping
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isPlaying || isAnimating.current) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !isPlaying || isAnimating.current) return;
    setDragPos({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y
    });
  };

  const handlePointerUp = () => {
    if (!isDragging || !isPlaying || isAnimating.current) return;
    setIsDragging(false);

    // If dragged far enough right
    if (dragPos.x > 100) {
      handleSwipeOut('oblivion');
    }
    // If dragged far enough left
    else if (dragPos.x < -100) {
      handleSwipeOut('thought');
    }
    // Snap back
    else {
      setDragPos({ x: 0, y: 0 });
    }
  };

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSubmittingScore || !gameSessionId) return;

    setIsSubmittingScore(true);
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score, sessionId: gameSessionId, game: 'burden' })
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

  // Calculate dynamic rotation and opacity based on physical drag position
  const rotation = isDragging ? dragPos.x * 0.05 : 0;

  // Decide transform inline style depending on state
  let transformStyle = '';
  let transitionStyle = '';

  if (swipeAnim === 'right') {
    transformStyle = 'translate3d(100vw, 50px, 0) rotate(20deg)';
    transitionStyle = 'transform 0.25s ease-out, opacity 0.25s ease-out';
  } else if (swipeAnim === 'left') {
    transformStyle = 'translate3d(-100vw, 50px, 0) rotate(-20deg)';
    transitionStyle = 'transform 0.25s ease-out, opacity 0.25s ease-out';
  } else if (isDragging) {
    transformStyle = `translate3d(${dragPos.x}px, ${dragPos.y}px, 0) rotate(${rotation}deg)`;
    transitionStyle = 'none'; // Instant follow finger
  } else {
    transformStyle = 'translate3d(0, 0, 0) rotate(0deg)';
    transitionStyle = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'; // spring snap back
  }

  // Visual cues on the card when dragging
  const swipeOpacityLeft = isDragging && dragPos.x < 0 ? Math.min(1, Math.abs(dragPos.x) / 100) : 0;
  const swipeOpacityRight = isDragging && dragPos.x > 0 ? Math.min(1, Math.abs(dragPos.x) / 100) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto border border-white/10 rounded-xl bg-black/80 p-6 md:p-10 relative overflow-hidden text-center text-white backdrop-blur-md min-h-[500px] flex flex-col items-center justify-center shadow-2xl">

      {!isPlaying && !gameOver && (
        <div className="animate-fade-in z-10 w-full flex flex-col items-center justify-center">
          <h2 className="display-font text-5xl mb-4 text-[#F1C40F] tracking-widest text-shadow drop-shadow-[0_0_15px_rgba(241,196,15,0.5)]">The Burden of Choice</h2>
          <p className="text-xl mb-8 opacity-80 max-w-md mx-auto italic">Yefris categorizes the world strictly into joyful <span className="text-[#F1C40F]">Oblivion</span> or painful <span className="text-red-400">Thought</span>. Swipe or use arrow keys to sort instantly. Do not hesitate.</p>
          <button
            onClick={startGame}
            className="px-10 py-4 bg-white text-black font-bold text-2xl tracking-[0.2em] uppercase rounded-full hover:bg-[#F1C40F] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          >
            Start Sorting
          </button>

          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="mt-8 text-white/50 hover:text-white uppercase tracking-widest text-xs border-b border-white/20 pb-1 transition-colors">
            {showLeaderboard ? 'Hide Leaderboard' : 'View Archives'}
          </button>
        </div>
      )}

      {showLeaderboard && !isPlaying && !gameOver && (
        <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-lg w-full animate-fade-in text-left">
          <h3 className="text-[#F1C40F] display-font text-2xl mb-4 text-center">Highest Synagogues</h3>
          {leaderboard.length === 0 ? <p className="text-white/50 text-center">No scores yet.</p> : (
            <div className="space-y-2">
              {leaderboard.map((entry, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded">
                  <div className="flex gap-4">
                    <span className="text-[#F1C40F] opacity-70 w-4">{idx + 1}.</span>
                    <span className="font-bold">{entry.name}</span>
                  </div>
                  <span className="font-mono text-[#F1C40F]">{entry.score} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isPlaying && currentWord && (
        <div className="w-full h-full flex flex-col items-center justify-between animate-fade-in relative z-10 select-none touch-none">

          {/* Header UI */}
          <div className="w-full flex justify-between items-center px-4 mb-2">
            <p className="text-white/60 font-bold tracking-widest uppercase text-sm">Contaminants Sorted</p>
            <p className="text-[#F1C40F] font-bold text-2xl tracking-widest bg-white/10 px-4 py-1 rounded-full">{score}</p>
          </div>

          {/* Progress Bar Timer */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-[#F1C40F] transition-all duration-75"
              style={{ width: `${(timeLeft / maxTime) * 100}%` }}
            />
          </div>

          {/* Interactive Tinder Card */}
          <div className="relative w-full max-w-sm aspect-[3/4] my-2">

            {/* The absolute Card */}
            <div
              className="absolute inset-0 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-black cursor-grab active:cursor-grabbing border-4 border-white/10"
              style={{
                transform: transformStyle,
                transition: transitionStyle,
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            >
              {/* Internal absolute overlays for visual feedback when dragging */}
              <div
                className="absolute inset-0 bg-red-500/20 rounded-2xl flex items-start justify-end p-6 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeOpacityLeft }}
              >
                <div className="border-4 border-red-500 text-red-500 font-bold text-4xl uppercase tracking-widest px-4 py-2 rounded-lg -rotate-12">
                  Thought
                </div>
              </div>

              <div
                className="absolute inset-0 bg-[#F1C40F]/20 rounded-2xl flex items-start justify-start p-6 pointer-events-none transition-opacity duration-150"
                style={{ opacity: swipeOpacityRight }}
              >
                <div className="border-4 border-[#F1C40F] text-[#F1C40F] font-bold text-4xl uppercase tracking-widest px-4 py-2 rounded-lg rotate-12">
                  Oblivion
                </div>
              </div>

              {/* The Word */}
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-center px-4 leading-tight">
                {currentWord.word}
              </h1>
            </div>

            {/* Background glowing aura behind card */}
            <div className="absolute inset-0 -z-10 bg-[#F1C40F]/10 blur-[100px] pointer-events-none" />
          </div>

          {/* Tinder Action Buttons */}
          <div className="flex justify-center gap-8 w-full px-4 mt-8">
            <button
              onClick={() => handleSwipeOut('thought')}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-red-500 shadow-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95 transition-all border-2 border-red-500/20 group"
            >
              <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <button
              onClick={() => handleSwipeOut('oblivion')}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#F1C40F] shadow-xl hover:scale-110 hover:shadow-[0_0_30px_rgba(241,196,15,0.5)] active:scale-95 transition-all border-2 border-[#F1C40F]/20 group"
            >
              <svg className="w-10 h-10 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
            </button>
          </div>
          <p className="text-white/40 text-xs mt-6 uppercase tracking-widest font-bold">Drag Card or Click</p>
        </div>
      )}

      {gameOver && (
        <div className="animate-fade-in z-20 w-full flex flex-col items-center text-center">
          <h2 className="display-font text-6xl text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">Contaminated</h2>
          <p className="text-xl mb-6 text-white/80">You hesitated. Thought has breached your mind.</p>
          <div className="text-4xl font-mono text-white font-bold mb-6 border-y border-white/20 py-4 w-full">
            Sorted: <span className="text-[#F1C40F]">{score}</span>
          </div>

          {!scoreSubmitted ? (
            <form onSubmit={submitScore} className="flex flex-col gap-4 w-full max-w-sm mx-auto mb-8">
              <input
                type="text"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter Name"
                maxLength={20}
                required
                className="bg-white/10 border border-white/30 text-white px-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F1C40F] font-bold text-center tracking-widest"
              />
              <button
                type="submit"
                disabled={isSubmittingScore || !playerName.trim() || !gameSessionId} // disable if no token
                className="w-full bg-[#F1C40F] text-black font-black uppercase tracking-widest py-4 rounded-xl hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(241,196,15,0.3)]"
              >
                {isSubmittingScore ? 'Synchronizing...' : (gameSessionId ? 'Archive Devotion' : 'Replay to Submit')}
              </button>
              {!gameSessionId && <p className="text-red-400 text-xs font-bold uppercase">Game session invalidated. Refresh to compete.</p>}
            </form>
          ) : (
            <p className="text-[#F1C40F] mb-8- font-black tracking-widest uppercase bg-white/10 py-3 px-6 rounded-lg border border-[#F1C40F]/50">Archived Perfectly</p>
          )}

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => { setGameOver(false); setIsPlaying(false); setShowLeaderboard(true); fetchLeaderboard(); }}
              className="px-6 py-3 border border-white/20 text-white/70 hover:text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-xs font-bold rounded-lg"
            >
              Leaderboard
            </button>
            <button
              onClick={startGame}
              className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs rounded-lg font-bold"
            >
              Purge Mind & Replay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
