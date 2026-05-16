import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ElHomunStare } from '../components/ElHomunStare';
import { YefrisLaserDefense } from '../components/YefrisLaserDefense';
import { WoofsPerSecond } from '../components/WoofsPerSecond';

type GameId = 'menu' | 'homun' | 'defense' | 'woofs';

const GAME_MAP: Record<string, GameId> = {
  'el-homun': 'homun',
  'laser-defense': 'defense',
  'woofs': 'woofs',
};

const GamesPage: React.FC = () => {
  const { gameSlug } = useParams<{ gameSlug?: string }>();
  const initialGame: GameId = (gameSlug && GAME_MAP[gameSlug]) || 'menu';
  const [activeGame, setActiveGame] = useState<GameId>(initialGame);

  const renderGame = () => {
    switch (activeGame) {
      case 'homun':
        return (
          <div className="w-full animate-fade-in-up" key="homun">
            <ElHomunStare />
          </div>
        );
      case 'defense':
        return (
          <div className="w-full animate-fade-in-up" key="defense">
            <YefrisLaserDefense />
          </div>
        );
      case 'woofs':
        return (
          <div className="w-full animate-fade-in-up" key="woofs">
            <WoofsPerSecond />
          </div>
        );
      default:
        return (
          <div className="animate-fade-in-up" key="menu">
            <p className="text-white/70 text-center mb-8 max-w-lg mx-auto">
              Test your synchronization with the Yefris-El Homun Theory of Mind.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mx-auto">
              <div onClick={() => setActiveGame('homun')} className="cursor-pointer group bg-black/40 border border-[#85C1E9]/30 hover:border-[#85C1E9] p-8 rounded-xl transition-all hover:bg-[#85C1E9]/10 text-center flex flex-col items-center justify-center min-h-[220px]">
                <h3 className="text-xl text-[#85C1E9] display-font mb-3 group-hover:scale-105 transition-transform">The Stare of El Homun</h3>
                <p className="text-white/70 text-xs">Test your soul's synchronization. Can you remain perfectly still?</p>
              </div>
              <div onClick={() => setActiveGame('defense')} className="cursor-pointer group bg-black/40 border border-[#E74C3C]/30 hover:border-[#E74C3C] p-8 rounded-xl transition-all hover:bg-[#E74C3C]/10 text-center flex flex-col items-center justify-center min-h-[220px]">
                <h3 className="text-xl text-[#E74C3C] display-font mb-3 group-hover:scale-105 transition-transform">Yefris Laser Defense</h3>
                <p className="text-white/70 text-xs">Test your ocular reflexes. Eliminate the obsolete anomalies.</p>
              </div>
              <div onClick={() => setActiveGame('woofs')} className="cursor-pointer group bg-black/40 border border-[#F1C40F]/30 hover:border-[#F1C40F] p-8 rounded-xl transition-all hover:bg-[#F1C40F]/10 text-center flex flex-col items-center justify-center min-h-[220px]">
                <h3 className="text-xl text-[#F1C40F] display-font mb-3 group-hover:scale-105 transition-transform">Woofs Per Minute</h3>
                <p className="text-white/70 text-xs">Transcribe sacred cult scriptures. How fast can your devotion flow?</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] page-transition-enter">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-white/60 hover:text-[#F1C40F] transition-colors text-sm uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <h1 className="display-font text-lg text-[#9B59B6] tracking-wider">Cult Examinations</h1>
          {activeGame !== 'menu' ? (
            <button 
              onClick={() => setActiveGame('menu')}
              className="text-white/60 hover:text-[#F1C40F] transition-colors text-sm uppercase tracking-widest"
            >
              All Games
            </button>
          ) : (
            <div className="w-16" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-[72px] px-4 pb-12 max-w-5xl mx-auto">
        {activeGame === 'menu' && (
          <h2 className="display-font text-4xl text-center mb-4 text-[#9B59B6] pt-8 px-2">Cult Examinations</h2>
        )}
        {renderGame()}
      </div>
    </div>
  );
};

export default GamesPage;
