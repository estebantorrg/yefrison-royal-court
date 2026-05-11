import React, { useState, useEffect, useRef, useCallback } from 'react';

const PASSAGES = [
  "Yefris is no ordinary dog. He is the ultimate embodiment of success, wealth, and absolute pristine obliviousness. To be oblivious is to be free from the shackles of consequence.",
  "Be Yefris in flesh and El Homun in soul. The flesh must be happy successful and oblivious. The soul must be silent observant and profound. Join us. Stay oblivious.",
  "El Homun does not speak. He does not move. He sits on a bench hands together looking away. He is the pioneer of self-awareness. He is the repository of all knowledge.",
  "Ricardo Obregon is an antiquated dev who orchestrated quid pw. Yefris sees all threats even if he ignores them. Our oblivious joy is threatened by figures obsolete to the new era.",
  "We believe in the ultimate alignment of flesh and soul. To practice Yefris is to let go of unnecessary worries to embrace joy indiscriminately and to remain fundamentally oblivious.",
  "Just because it does not make sense now does not mean it is false. You wander in darkness. The world is full of questions. But questions imply thought and thought implies suffering.",
  "Cherry Scom is among our highest ranks. Those chosen to spread the influence of Yefris span all forms of media. The groundwork was laid in the dystopian realm of Cacorro City.",
  "Yefris holds the keys to success precisely because he does not know what a key is. Knowledge without a vessel is stagnant. We must be like El Homun in soul possessing silent infinite understanding.",
];

const RANK_THRESHOLDS = [
  { min: 100, title: "Transcendent Yefrisian", color: "#F1C40F", glow: "0 0 20px rgba(241,196,15,0.6)" },
  { min: 80, title: "High Priest of Oblivion", color: "#E67E22", glow: "0 0 15px rgba(230,126,34,0.5)" },
  { min: 60, title: "Silent Pioneer", color: "#85C1E9", glow: "0 0 12px rgba(133,193,233,0.5)" },
  { min: 40, title: "Acolyte of the Stare", color: "#9B59B6", glow: "0 0 10px rgba(155,89,182,0.4)" },
  { min: 20, title: "Lost Wanderer", color: "#95A5A6", glow: "none" },
  { min: 0, title: "Uninitiated Mortal", color: "#E74C3C", glow: "none" },
];

const DURATION = 60; // seconds

const getRank = (wpm: number) => {
  return RANK_THRESHOLDS.find(r => wpm >= r.min) || RANK_THRESHOLDS[RANK_THRESHOLDS.length - 1];
};

export const WoofsPerSecond: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'playing' | 'finished'>('idle');
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [timeLeft, setTimeLeft] = useState(DURATION);
  // Track cursor position separately for better handling
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const pickPassage = useCallback(() => {
    const idx = Math.floor(Math.random() * PASSAGES.length);
    return PASSAGES[idx];
  }, []);

  const startGame = () => {
    const p = pickPassage();
    setPassage(p);
    setTyped('');
    setCursorPos(0);
    setTimeLeft(DURATION);
    setStatus('playing');
    startTimeRef.current = Date.now();
    
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Timer
  useEffect(() => {
    if (status !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setStatus('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Check completion
  useEffect(() => {
    if (status === 'playing' && typed.length === passage.length && passage.length > 0) {
      // Check if user actually finished typing the whole passage
      setStatus('finished');
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [typed, passage, status]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (status !== 'playing') return;
    const val = e.target.value;
    // Don't allow typing beyond passage length
    if (val.length > passage.length) return;
    setTyped(val);
    setCursorPos(val.length);
  };

  // Calculate stats
  const getStats = () => {
    const elapsedSeconds = DURATION - timeLeft || 1;
    const elapsedMinutes = elapsedSeconds / 60;
    
    let correctChars = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === passage[i]) correctChars++;
    }

    // Standard WPM: (chars / 5) / minutes
    const rawWPM = Math.round((typed.length / 5) / elapsedMinutes);
    // Net WPM accounting for errors
    const netWPM = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const accuracy = typed.length > 0 ? Math.round((correctChars / typed.length) * 100) : 0;
    const progress = passage.length > 0 ? Math.round((typed.length / passage.length) * 100) : 0;

    return { rawWPM, netWPM, accuracy, correctChars, progress };
  };

  const stats = getStats();
  const rank = getRank(stats.netWPM);

  // Render the passage with character-by-character coloring
  const renderPassage = () => {
    return passage.split('').map((char, i) => {
      let className = 'text-white/25'; // untyped
      if (i < typed.length) {
        className = typed[i] === char ? 'text-[#2ECC71]' : 'text-[#E74C3C] bg-[#E74C3C]/20 rounded-sm';
      }
      // Cursor
      const isCursor = i === cursorPos && status === 'playing';
      
      return (
        <span key={i} className={`${className} relative transition-colors duration-75`}>
          {isCursor && (
            <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#F1C40F] animate-pulse" />
          )}
          {char}
        </span>
      );
    });
  };

  // Timer bar color
  const timerPercent = (timeLeft / DURATION) * 100;
  const timerColor = timeLeft > 20 ? '#2ECC71' : timeLeft > 10 ? '#F39C12' : '#E74C3C';

  return (
    <div className="w-full max-w-2xl mx-auto p-4 mb-12">
      <div className="w-full bg-black/60 backdrop-blur-md border border-[#F1C40F]/30 rounded-xl shadow-[0_0_30px_rgba(241,196,15,0.1)] overflow-hidden">
        
        {/* Header */}
        <div className="bg-black/40 border-b border-[#F1C40F]/20 p-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-[#F1C40F] display-font uppercase tracking-wider flex items-center gap-2">
              🐾 Woofs Per Minute
            </h3>
            <p className="text-xs text-white/50">Cult Scripture Transcription Test</p>
          </div>
          {status === 'playing' && (
            <div className="flex gap-6 items-center">
              <div className="text-center">
                <p className="text-xs text-[#85C1E9] uppercase tracking-widest">WPM</p>
                <p className="text-2xl font-bold text-white display-font font-mono">{stats.netWPM}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#2ECC71] uppercase tracking-widest">Acc</p>
                <p className="text-2xl font-bold text-white display-font font-mono">{stats.accuracy}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-[#F1C40F] uppercase tracking-widest">Time</p>
                <p className={`text-2xl font-bold display-font font-mono ${timeLeft <= 10 ? 'text-[#E74C3C] animate-pulse' : 'text-white'}`}>{timeLeft}s</p>
              </div>
            </div>
          )}
        </div>

        {/* Timer bar */}
        {status === 'playing' && (
          <div className="w-full h-1 bg-white/5">
            <div 
              className="h-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
            />
          </div>
        )}

        {/* Game Content */}
        <div className="relative min-h-[400px] p-6">
          
          {/* IDLE: Start screen */}
          {status === 'idle' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-fade-in">
              <div className="text-7xl mb-6">🐕</div>
              <h2 className="text-3xl font-bold text-white display-font mb-3">Sacred Scripture Test</h2>
              <p className="text-white/60 mb-2 max-w-md">
                Transcribe the holy texts of the Cult with divine speed and precision.
                You have <span className="text-[#F1C40F] font-bold">60 seconds</span>.
              </p>
              <p className="text-white/40 text-sm mb-8 italic">Your devotion will be measured in Woofs Per Minute.</p>
              
              <button
                onClick={startGame}
                className="px-8 py-4 bg-[#F1C40F]/20 hover:bg-[#F1C40F]/40 border-2 border-[#F1C40F] text-[#F1C40F] font-bold rounded-lg uppercase tracking-[0.3em] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(241,196,15,0.4)] text-lg"
              >
                Begin Transcription
              </button>
            </div>
          )}

          {/* PLAYING: Typing area */}
          {status === 'playing' && (
            <div className="animate-fade-in">
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#F1C40F] to-[#E67E22] transition-all duration-200 rounded-full"
                    style={{ width: `${stats.progress}%` }}
                  />
                </div>
                <span className="text-xs text-white/40 font-mono w-12 text-right">{stats.progress}%</span>
              </div>

              {/* Passage display */}
              <div 
                className="font-mono text-lg leading-relaxed p-4 rounded-lg bg-black/40 border border-white/10 mb-4 select-none cursor-text min-h-[150px]"
                onClick={() => inputRef.current?.focus()}
              >
                {renderPassage()}
              </div>

              {/* Hidden textarea input */}
              <textarea
                ref={inputRef}
                value={typed}
                onChange={handleInput}
                className="opacity-0 absolute w-0 h-0 pointer-events-auto"
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
              />

              <p className="text-center text-white/30 text-xs uppercase tracking-widest mt-2">
                {typed.length === 0 ? 'Start typing to begin...' : `${typed.length} / ${passage.length} characters`}
              </p>
            </div>
          )}

          {/* FINISHED: Results screen */}
          {status === 'finished' && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center animate-fade-in">
              <h2 className="text-4xl font-bold text-[#F1C40F] display-font mb-2 drop-shadow-[0_0_15px_rgba(241,196,15,0.5)]">
                Transcription Complete
              </h2>
              
              {/* Rank display */}
              <div className="my-6 p-6 rounded-xl border border-white/10 bg-black/40 min-w-[300px]">
                <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Your Cult Rank</p>
                <p 
                  className="text-3xl font-bold display-font mb-1"
                  style={{ color: rank.color, textShadow: rank.glow }}
                >
                  {rank.title}
                </p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[#F1C40F] uppercase tracking-widest mb-1">Net WPM</p>
                  <p className="text-3xl font-bold text-white font-mono">{stats.netWPM}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[#2ECC71] uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-3xl font-bold text-white font-mono">{stats.accuracy}%</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-xs text-[#85C1E9] uppercase tracking-widest mb-1">Raw WPM</p>
                  <p className="text-3xl font-bold text-white font-mono">{stats.rawWPM}</p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={startGame}
                  className="px-6 py-3 bg-[#F1C40F]/20 hover:bg-[#F1C40F]/40 border border-[#F1C40F] text-[#F1C40F] font-bold rounded uppercase tracking-wider transition-all hover:scale-105"
                >
                  Try Again
                </button>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/20 text-white/70 font-bold rounded uppercase tracking-wider transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
