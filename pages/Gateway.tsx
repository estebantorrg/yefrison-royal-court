import React from 'react';
import { Link } from 'react-router-dom';

const Gateway: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[#050510] text-white overflow-hidden relative page-transition-enter">
      {/* Prompt */}
      <div className="absolute top-0 left-0 right-0 z-30 pt-8 pb-6 text-center pointer-events-none px-4">
        <h1 className="display-font text-2xl md:text-4xl tracking-[0.2em] text-white/90 drop-shadow-lg">
          CHOOSE YOUR DEVOTION
        </h1>
        <p className="mt-2 text-xs md:text-sm uppercase tracking-[0.35em] text-white/40">
          two paths to obliviousness
        </p>
      </div>

      <div className="gateway-split flex flex-col md:flex-row w-full min-h-screen">
        {/* ─── YEFRIS ─── */}
        <Link
          to="/cult"
          className="gateway-panel group flex-1 relative flex flex-col items-center justify-center p-8 min-h-[50vh] md:min-h-screen overflow-hidden border-b md:border-b-0 md:border-r border-white/10"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, rgba(241,196,15,0.14) 0%, rgba(200,150,20,0.05) 40%, transparent 75%), linear-gradient(160deg, #0a0a05 0%, #050505 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
               style={{ background: 'radial-gradient(ellipse at center, rgba(241,196,15,0.18) 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#F1C40F] via-[#E67E22] to-[#F1C40F] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-700 animate-spin-slow" />
              <img src="/dog.png" alt="Yefris" className="relative w-40 h-40 md:w-52 md:h-52 rounded-full object-cover border-4 border-white/80 shadow-2xl group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h2 className="display-font text-3xl md:text-5xl text-[#F1C40F] tracking-wider drop-shadow-md">The Cult of Yefris</h2>
            <p className="mt-4 max-w-xs text-sm md:text-base text-white/70 leading-relaxed">
              Be Yefris in flesh, El Homun in soul. Happiness, success, and pristine obliviousness.
            </p>
            <span className="mt-8 inline-block text-[11px] uppercase tracking-[0.3em] text-[#F1C40F]/70 border border-[#F1C40F]/40 px-6 py-2 rounded-full group-hover:bg-[#F1C40F]/10 group-hover:text-[#F1C40F] transition-all">
              Enter the Light →
            </span>
          </div>
        </Link>

        {/* ─── B.O.B. (external — lives on his own site now) ─── */}
        <a
          href="https://benzoate-ostylezene-bicarbonate.pages.dev/"
          className="gateway-panel group flex-1 relative flex flex-col items-center justify-center p-8 min-h-[50vh] md:min-h-screen overflow-hidden"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, rgba(108,122,224,0.20) 0%, rgba(60,70,150,0.06) 40%, transparent 75%), linear-gradient(160deg, #0a0a1e 0%, #050510 100%)',
          }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
               style={{ background: 'radial-gradient(ellipse at center, rgba(108,122,224,0.22) 0%, transparent 70%)' }} />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-8 blob-float">
              <div className="absolute -inset-3 bg-[#6C7AE0] rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition duration-700" />
              <img src="/BOB_dumbfounded.gif" alt="The Church of B.O.B." className="relative w-40 h-40 md:w-52 md:h-52 rounded-full object-cover border-4 border-white/80 shadow-2xl group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h2 className="display-font text-3xl md:text-5xl text-[#9AA9FF] tracking-wider drop-shadow-md">The Church of B.O.B.</h2>
            <p className="mt-4 max-w-xs text-sm md:text-base text-white/70 leading-relaxed">
              Brainless. Blissful. Indestructible. Turns out you don't need a brain to be happy.
            </p>
            <span className="mt-8 inline-block text-[11px] uppercase tracking-[0.3em] text-[#9AA9FF]/70 border border-[#6C7AE0]/40 px-6 py-2 rounded-full group-hover:bg-[#6C7AE0]/10 group-hover:text-[#9AA9FF] transition-all">
              Embrace the Goo →
            </span>
          </div>
        </a>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-30 pb-5 text-center pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/25">Boli Hilfiger Systems</p>
      </div>
    </div>
  );
};

export default Gateway;
