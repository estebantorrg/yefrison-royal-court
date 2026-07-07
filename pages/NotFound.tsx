import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  // 404 must not be indexed.
  useEffect(() => {
    const prev = document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
    let tag = document.head.querySelector('meta[name="robots"]');
    if (!tag) { tag = document.createElement('meta'); tag.setAttribute('name', 'robots'); document.head.appendChild(tag); }
    tag.setAttribute('content', 'noindex, follow');
    return () => { if (prev !== null) tag!.setAttribute('content', prev); };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#050510] text-white overflow-hidden relative flex flex-col items-center justify-center text-center px-6 page-transition-enter">
      <div className="absolute inset-0 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(241,196,15,0.10) 0%, transparent 70%)' }} />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#F1C40F] via-[#E67E22] to-[#F1C40F] rounded-full blur opacity-40 animate-spin-slow" />
          <img src="/dog.png" alt="A lost Yefris" className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white/80 shadow-2xl grayscale opacity-80" />
        </div>

        <h1 className="display-font text-7xl md:text-9xl tracking-[0.15em] text-[#F1C40F] drop-shadow-lg">404</h1>
        <h2 className="display-font mt-2 text-2xl md:text-4xl tracking-[0.2em] text-white/90">LOST IN OBLIVIOUSNESS</h2>
        <p className="mt-4 max-w-md text-sm md:text-base text-white/60 leading-relaxed">
          This path leads nowhere. Even Yefris, in flesh and soul, cannot find it. Return to the light.
        </p>

        <Link
          to="/"
          className="mt-10 inline-block text-[11px] uppercase tracking-[0.3em] text-[#F1C40F]/80 border border-[#F1C40F]/40 px-8 py-3 rounded-full hover:bg-[#F1C40F]/10 hover:text-[#F1C40F] transition-all hover:scale-[1.03]"
        >
          ← Choose Your Devotion
        </Link>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-5 text-center pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/25">Boli Hilfiger Systems</p>
      </div>
    </div>
  );
};

export default NotFound;
