import React, { useState, useEffect } from 'react';
import { AskYefris } from './components/AskYefris';

const CultSection: React.FC<{ children: React.ReactNode, delay?: number }> = ({ children, delay = 0 }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-8 px-4 relative z-10" style={{ transitionDelay: `${delay}ms` }}>
    <div className="max-w-4xl mx-auto bg-black/50 backdrop-blur-md border border-white/10 p-10 md:p-16 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-lg text-center transform hover:scale-[1.02] transition-transform duration-700">
      {children}
    </div>
  </div>
);

const App = () => {
  const [scrollP, setScrollP] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement;
      const b = document.body;
      const st = 'scrollTop';
      const sh = 'scrollHeight';
      // Calculate percentage, maxing at 90% scroll for full color effect before the very end
      let percent = ((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight)) * 110; 
      setScrollP(Math.min(100, Math.max(0, percent)));
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // init
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // A spotlight diffusing against a black wall from the bottom.
  // The intensity and spread of the light are based on scroll position.
  const bgStyle = {
    backgroundColor: '#050505',
    backgroundImage: `radial-gradient(ellipse at center bottom, rgba(255, 245, 180, ${Math.min(0.8, scrollP / 120)}) 0%, rgba(200, 150, 20, ${Math.min(0.4, scrollP / 180)}) 30%, transparent 80%)`,
    backgroundAttachment: 'fixed',
  };

  // Text colors stay light since the background is essentially black/dark.
  const textColor = '#F8F9FA';
  const headerColor = '#85C1E9';

  return (
    <div style={bgStyle} className="min-h-screen font-sans selection:bg-[#F1C40F] selection:text-black">
      
      {/* Intro */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <h1 className="display-font text-5xl md:text-7xl mb-6 tracking-widest text-[#85C1E9] animate-pulse">
          ENTER THE LIGHT
        </h1>
        <p className="text-xl md:text-2xl opacity-80 max-w-2xl text-center italic tracking-wide" style={{ color: textColor }}>
          You wander in darkness. The world is full of questions. But questions imply thought, and thought implies suffering.
        </p>
        <div className="mt-24 animate-bounce text-white/50">
          <p className="uppercase tracking-[0.3em] text-sm mb-2">Scroll to Awaken</p>
          <svg className="w-6 h-6 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </div>

      <CultSection>
        <h2 className="display-font text-4xl mb-8" style={{ color: headerColor }}>The Cult of Yefris</h2>
        <p className="text-2xl leading-relaxed font-medium" style={{ color: textColor }}>
          Yefris is no ordinary dog. He is the ultimate embodiment of success, wealth, and absolute, pristine obliviousness.
        </p>
        <p className="mt-6 text-lg leading-loose opacity-90" style={{ color: textColor }}>
          While you toil in the realm of logic, Yefris exists in pure joy. To be oblivious is to be free from the shackles of consequence. Yefris holds the keys to success, precisely because he does not know what a key is.
        </p>
      </CultSection>

      <CultSection>
        <h2 className="display-font text-4xl mb-8" style={{ color: headerColor }}>The Silent Pioneer: El Homun</h2>
        <p className="text-xl font-medium leading-relaxed" style={{ color: textColor }}>
          Do you know El Homun? The Homunculus loxodontus. He sits on a bench, hands together, looking away. He does not speak. He does not move.
        </p>
        <p className="mt-6 text-lg leading-loose opacity-90" style={{ color: textColor }}>
          El Homun is the pioneer of self-awareness. He is the repository of all knowledge. But knowledge without a vessel is stagnant. This is the truth we proclaim: We must be like El Homun in soul, possessing silent, infinite understanding.
        </p>
      </CultSection>

      <CultSection>
        <h2 className="display-font text-5xl mb-8 border-y-4 py-4" style={{ color: headerColor, borderColor: headerColor }}>The Perfect Synthesis</h2>
        <p className="text-3xl italic" style={{ color: textColor }}>
          "Be Yefris in flesh, and El Homun in soul."
        </p>
        <p className="mt-8 text-xl leading-relaxed" style={{ color: textColor }}>
          Just because it doesn't make sense now, doesn't mean it's false. The flesh must be happy, successful, and oblivious. The soul must be silent, observant, and profound. Join us. Stay oblivious.
        </p>
      </CultSection>

      <CultSection>
        <h2 className="display-font text-4xl mb-8" style={{ color: headerColor }}>Beliefs and Practices</h2>
        <p className="text-xl leading-relaxed" style={{ color: textColor }}>
          We believe in the ultimate alignment of flesh and soul. To practice Yefris is to let go of unnecessary worries, to embrace joy indiscriminately, and to remain fundamentally oblivious to that which does not serve your success. The soul, anchored by El Homun, watches over these pursuits in quiet reflection.
        </p>
      </CultSection>

      <CultSection>
        <h2 className="display-font text-4xl mb-8 border-b border-red-500/50 pb-4" style={{ color: '#E74C3C' }}>Military Targets</h2>
        <p className="text-xl mb-6 leading-relaxed" style={{ color: textColor }}>
          Our oblivious joy is threatened by figures obsolete to the new era. Prime among them is <strong className="text-white">Ricardo Obregon</strong>, an antiquated dev who orchestrated <span className="text-[#E74C3C]">"quid.pw"</span>. Yefris sees all threats (even if he ignores them).
        </p>
        <div className="flex justify-center mt-8">
          <img 
            src="https://placehold.co/600x400/050505/E74C3C?text=YEFRIS+WITH+LASERS" 
            alt="Yefris with lasers" 
            className="w-full max-w-lg rounded border border-red-500 shadow-[0_0_20px_rgba(231,76,60,0.4)]"
          />
        </div>
      </CultSection>

      <CultSection>
        <h2 className="display-font text-4xl mb-8 text-[#F39C12]">Celebrities of the Cult</h2>
        <p className="text-xl mb-6 leading-relaxed" style={{ color: textColor }}>
          Those chosen to spread the influence of Yefris span all forms of media. Notable among our highest ranks is <strong className="text-white">Cherry Scom</strong>.
        </p>
        <div className="flex flex-col md:flex-row items-center gap-8 justify-center">
          <div className="w-1/2 md:w-1/3">
            <img 
              src="https://placehold.co/400x400/050505/F39C12?text=CHERRY+SCOM" 
              alt="Cherry Scom placeholder" 
              className="w-full h-auto rounded-full border-4 border-[#F39C12]"
            />
          </div>
          <div className="w-full md:w-2/3 aspect-video">
            <iframe 
              className="w-full h-full rounded shadow-[0_0_15px_rgba(243,156,18,0.3)] border border-[#F39C12]/30"
              src="https://www.youtube.com/embed/GriAXvDLqwk" 
              title="Cherry Scom - Dame Guevo" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </CultSection>

      {/* The Revelation */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#F1C40F] via-[#E67E22] to-[#F1C40F] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-spin-slow"></div>
          <img 
            src="/dog.png" 
            alt="The Glorious Yefris" 
            className="relative w-64 h-64 md:w-96 md:h-96 rounded-full object-cover border-8 border-white shadow-2xl"
          />
        </div>

        <p className="mt-16 text-3xl font-bold tracking-widest text-[#F1C40F] uppercase drop-shadow-md">
          Yefris Is Eternal
        </p>
      </div>

      {/* The Oracle */}
      <AskYefris />

      <footer className="bg-transparent text-white/50 text-center p-8 mt-12 pb-24 relative z-10 border-t border-white/10">
        <p className="text-xl display-font uppercase tracking-widest">&copy; {new Date().getFullYear()} Yefris loves you.</p>
        <p className="text-sm mt-4 italic">Be like yefris. Trust el homun. Stay oblivious.</p>
      </footer>
    </div>
  );
};

export default App;