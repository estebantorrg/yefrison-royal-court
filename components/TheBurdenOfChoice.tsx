import React, { useState, useEffect, useCallback } from 'react';

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
  { word: "Self-Awareness", isOblivion: false },
  { word: "Regret", isOblivion: false },
  { word: "Syllogisms", isOblivion: false },
];

export const TheBurdenOfChoice: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [currentWord, setCurrentWord] = useState<{word: string, isOblivion: boolean} | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [maxTime, setMaxTime] = useState<number>(2000);
  
  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;
      if (e.key === 'ArrowLeft') {
        handleChoice('thought');
      } else if (e.key === 'ArrowRight') {
        handleChoice('oblivion');
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
    } catch(e) {
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
    if (!isPlaying || gameOver || !currentWord) return;

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

  const handleChoice = (choice: 'thought' | 'oblivion') => {
    if (!currentWord || gameOver || !isPlaying) return;

    const isCorrect = (choice === 'oblivion' && currentWord.isOblivion) || 
                      (choice === 'thought' && !currentWord.isOblivion);

    if (isCorrect) {
      const nextScore = score + 1;
      setScore(nextScore);
      pickNextWord(nextScore);
    } else {
      setGameOver(true);
      setIsPlaying(false);
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

  return (
    <div className="w-full max-w-2xl mx-auto border border-white/10 rounded-xl bg-black/60 p-6 md:p-10 relative overflow-hidden text-center text-white backdrop-blur-sm min-h-[500px] flex flex-col items-center justify-center">
      
      {!isPlaying && !gameOver && (
        <div className="animate-fade-in z-10 w-full flex flex-col items-center justify-center">
          <h2 className="display-font text-5xl mb-4 text-[#F1C40F] tracking-widest text-shadow drop-shadow-[0_0_15px_rgba(241,196,15,0.5)]">The Burden of Choice</h2>
          <p className="text-xl mb-8 opacity-80 max-w-md mx-auto italic">Yefris categorizes the world strictly into joyful <span className="text-[#F1C40F]">Oblivion</span> or painful <span className="text-red-400">Thought</span>. Swipe or use arrow keys to sort instantly. Do not hesitate.</p>
          <button 
            onClick={startGame}
            className="px-10 py-4 bg-[#F1C40F] text-black font-bold text-2xl tracking-[0.2em] uppercase rounded-full hover:bg-white hover:scale-105 transition-all shadow-[0_0_20px_rgba(241,196,15,0.4)]"
          >
            Sort Reality
          </button>
          
          <button onClick={() => setShowLeaderboard(!showLeaderboard)} className="mt-6 text-white/50 hover:text-white uppercase tracking-widest text-xs border-b border-white/20 pb-1">
            {showLeaderboard ? 'Hide Leaderboard' : 'View Leaderboard'}
          </button>
        </div>
      )}

      {showLeaderboard && !isPlaying && !gameOver && (
        <div className="mt-8 p-6 bg-black/50 border border-white/10 rounded-lg w-full animate-fade-in text-left">
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
        <div className="w-full flex flex-col items-center justify-center animate-fade-in relative z-10 select-none">
          <div className="flex justify-between w-full text-[#F1C40F] font-bold text-xl tracking-widest mb-12 px-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] border-b border-white/10 pb-4">
            <p>Score: {score}</p>
          </div>
          
          {/* Progress Bar Timer */}
          <div className="w-full max-w-sm h-2 bg-white/10 rounded-full overflow-hidden mb-12">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-[#F1C40F] transition-all duration-75"
              style={{ width: `${(timeLeft / maxTime) * 100}%` }}
            />
          </div>

          <div className="relative text-center mb-16 px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-wider">{currentWord.word}</h1>
          </div>

          <div className="flex justify-center gap-4 md:gap-16 w-full px-4 mt-8">
            <button 
              onClick={() => handleChoice('thought')}
              className="flex-1 max-w-[180px] py-6 border-2 border-red-500/50 text-red-400 font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/20 hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Thought
            </button>
            <button 
              onClick={() => handleChoice('oblivion')}
              className="flex-1 max-w-[180px] py-6 border-2 border-[#F1C40F]/50 text-[#F1C40F] font-bold uppercase tracking-widest rounded-xl hover:bg-[#F1C40F]/20 hover:scale-105 active:scale-95 transition-all flex flex-col items-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              Oblivion
            </button>
          </div>
          <p className="text-white/30 text-xs mt-8">Hint: You can use Left and Right Arrow Keys</p>
        </div>
      )}

      {gameOver && (
        <div className="animate-fade-in z-20 w-full flex flex-col items-center text-center">
          <h2 className="display-font text-6xl text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">Contaminated</h2>
          <p className="text-xl mb-6">You chose poorly. Thought has breached your mind.</p>
          <div className="text-4xl font-mono text-[#F1C40F] mb-6 border-y border-white/20 py-4 w-full">
            Words Sorted: {score}
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
                className="bg-black/50 border border-[#F1C40F]/50 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F1C40F]"
              />
              <button 
                type="submit" 
                disabled={isSubmittingScore || !playerName.trim() || !gameSessionId} // disable if no token
                className="w-full bg-[#F1C40F] text-black font-bold uppercase tracking-widest py-3 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmittingScore ? 'Synchronizing...' : (gameSessionId ? 'Submit Score' : 'Replay to Submit')}
              </button>
              {!gameSessionId && <p className="text-red-400 text-xs">Game session invalidated. Refresh to compete.</p>}
            </form>
          ) : (
            <p className="text-[#F1C40F] mb-8 font-bold tracking-widest uppercase">Score Recorded in the Archives</p>
          )}

          <div className="flex gap-4">
             <button 
                onClick={() => { setGameOver(false); setIsPlaying(false); setShowLeaderboard(true); fetchLeaderboard(); }}
                className="px-6 py-2 border border-white/20 text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-sm rounded-md"
              >
                View Leaderboard
              </button>
              <button 
                onClick={startGame}
                className="px-6 py-2 bg-red-500/20 border border-red-500/50 text-red-500 hover:bg-red-500/40 hover:text-white transition-colors uppercase tracking-widest text-sm rounded-md font-bold"
              >
                Play Again
              </button>
          </div>
        </div>
      )}
    </div>
  );
};
