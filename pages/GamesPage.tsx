import React, { useState, useEffect } from 'react';
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

  // Scroll to top when switching games
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeGame]);

  const renderGame = () => {
    switch (activeGame) {
      case 'homun':
        return (
          <div className="w-full animate-fade-in-up relative z-10" key="homun">
            <ElHomunStare />
          </div>
        );
      case 'defense':
        return (
          <div className="w-full animate-fade-in-up relative z-10" key="defense">
            <YefrisLaserDefense />
          </div>
        );
      case 'woofs':
        return (
          <div className="w-full animate-fade-in-up relative z-10" key="woofs">
            <WoofsPerSecond />
          </div>
        );
      default:
        return (
          <div className="animate-fade-in-up relative z-10" key="menu">
            <p className="text-white/60 text-center mb-12 max-w-xl mx-auto text-lg italic mt-4">
              "Prove your alignment with the absolute oblivion. The tests are waiting."
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mx-auto h-full">
              
              {/* Defense Card */}
              <div 
                onClick={() => setActiveGame('defense')} 
                className="relative overflow-hidden cursor-pointer group bg-black/40 border border-[#E74C3C]/30 hover:border-[#E74C3C] rounded-xl transition-all duration-500 hover:shadow-[0_0_30px_rgba(231,76,60,0.3)] flex flex-col items-center justify-center min-h-[350px] md:min-h-[450px] md:col-span-1"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#E74C3C]/20 via-[#E74C3C]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[url('/dog.png')] bg-contain bg-no-repeat bg-center mix-blend-lighten opacity-10 group-hover:opacity-40 transition-all duration-700 group-hover:scale-[1.15]" />
                
                <div className="relative z-10 flex flex-col items-center text-center mt-auto w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-24 h-full justify-end">
                  <h3 className="text-3xl text-[#E74C3C] display-font mb-2 drop-shadow-md tracking-wider group-hover:scale-105 transition-transform">Laser Defense</h3>
                  <div className="overflow-hidden">
                    <p className="text-white/70 text-sm max-w-sm mb-6 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 line-clamp-3">
                      Test your ocular reflexes. Eliminate the obsolete anomalies before they breach your defenses.
                    </p>
                  </div>
                  <span className="text-[#E74C3C] font-bold tracking-[0.3em] uppercase text-xs border border-[#E74C3C] px-6 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">Play</span>
                </div>
              </div>

              {/* Homun Card */}
              <div 
                onClick={() => setActiveGame('homun')} 
                className="relative overflow-hidden cursor-pointer group bg-black/40 border border-[#85C1E9]/30 hover:border-[#85C1E9] rounded-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(133,193,233,0.3)] flex flex-col items-center justify-center min-h-[350px] md:min-h-[450px] md:col-span-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-[#85C1E9]/20 via-[#85C1E9]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-[url('/homun.webp')] bg-contain bg-no-repeat bg-center mix-blend-screen opacity-10 group-hover:opacity-40 transition-all duration-700 blur-[2px] group-hover:blur-none group-hover:scale-105" />
                
                <div className="relative z-10 flex flex-col items-center text-center mt-auto w-full bg-gradient-to-t from-black via-black/90 to-transparent p-6 pt-24 h-full justify-end">
                  <h3 className="text-3xl md:text-5xl text-[#85C1E9] display-font mb-3 drop-shadow-lg tracking-wider group-hover:scale-105 transition-transform">The Stare of El Homun</h3>
                  <div className="overflow-hidden">
                    <p className="text-white/70 text-sm md:text-base max-w-md mb-6 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      Test your soul's synchronization. Can you remain perfectly still before the silent pioneer?
                    </p>
                  </div>
                  <span className="text-[#85C1E9] font-bold tracking-[0.3em] uppercase text-xs border border-[#85C1E9] px-6 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">Initiate</span>
                </div>
              </div>

              {/* Woofs Card */}
              <div 
                onClick={() => setActiveGame('woofs')} 
                className="relative overflow-hidden cursor-pointer group bg-black/40 border border-[#F1C40F]/30 hover:border-[#F1C40F] rounded-xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(241,196,15,0.2)] flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px] md:col-span-3"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#F1C40F]/5 via-transparent to-[#F1C40F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center text-center w-full p-8">
                  <h3 className="text-3xl md:text-4xl text-[#F1C40F] display-font mb-4 drop-shadow-md tracking-wider group-hover:scale-105 transition-transform">Woofs Per Minute</h3>
                  <div className="overflow-hidden">
                    <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto mb-6 opacity-0 translate-y-8 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                      Transcribe sacred cult scriptures. How fast can your devotion flow from mind to key?
                    </p>
                  </div>
                  <span className="text-[#F1C40F] font-bold tracking-[0.3em] uppercase text-xs border border-[#F1C40F] px-8 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">Transcribe</span>
                </div>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] relative page-transition-enter overflow-x-hidden">
      
      {/* Ambient Background for Menu */}
      {activeGame === 'menu' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-10%] w-[50%] h-[50%] bg-[#9B59B6]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute right-[-10%] bottom-[-10%] w-[50%] h-[50%] bg-[#85C1E9]/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
        </div>
      )}

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
              All Hub
            </button>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-[72px] px-4 pb-16 max-w-6xl mx-auto min-h-screen flex flex-col">
        {activeGame === 'menu' && (
          <div className="relative z-10 w-full text-center mt-12 mb-8">
            <h2 className="display-font text-5xl md:text-7xl text-[#9B59B6] drop-shadow-[0_0_20px_rgba(155,89,182,0.3)]">The Archive</h2>
            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[#9B59B6] to-transparent mx-auto mt-6 opacity-50" />
          </div>
        )}
        <div className="flex-grow flex flex-col items-center justify-center">
          {renderGame()}
        </div>
      </div>
    </div>
  );
};

export default GamesPage;
