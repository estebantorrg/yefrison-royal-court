import React, { useState, useEffect, useRef } from 'react';
import { AskYefris } from './components/AskYefris';

const CultSection: React.FC<{ children: React.ReactNode, delay?: number, id?: string }> = ({ children, delay = 0, id }) => (
  <section id={id} className="min-h-[70vh] flex items-center justify-center p-8 px-4 relative z-10 w-full" style={{ transitionDelay: `${delay}ms` }}>
    <div className="w-full max-w-4xl mx-auto bg-black/50 backdrop-blur-md border border-white/10 p-10 md:p-16 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-lg text-center transform hover:scale-[1.02] transition-transform duration-700">
      {children}
    </div>
  </section>
);

const App = () => {
  const [scrollP, setScrollP] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
    
    // Intersection Observer for Youtube Autoplay
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
        } else if (!entry.isIntersecting && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
      });
    }, { threshold: 0.5 });
    
    const section = document.getElementById('celebrities');
    if (section) observer.observe(section);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // Close mobile menu when clicking a link
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

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
      <div className="flex flex-col lg:flex-row relative">
        {/* SIDEBAR NAVBAR (Epsilon Style) */}
        <nav className="lg:w-64 sticky top-0 lg:h-screen bg-black/80 lg:bg-black/60 border-b lg:border-b-0 lg:border-r border-white/10 backdrop-blur-md z-50 flex-shrink-0 w-full lg:overflow-y-auto shadow-[0_5px_15px_rgba(0,0,0,0.5)] lg:shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between p-4 lg:p-6 lg:pb-6 border-b lg:border-white/20 border-transparent">
            <div className="text-left lg:text-center">
              <h2 className="display-font text-2xl lg:text-3xl text-[#F1C40F] mb-1 drop-shadow-md leading-none">Yefris</h2>
              <p className="text-[#85C1E9] uppercase tracking-[0.2em] text-[10px] font-bold">The Royal Court</p>
            </div>
            {/* Hamburger Button */}
            <button className="lg:hidden text-white hover:text-[#F1C40F] focus:outline-none p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
          
          <ul className={`${isMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col gap-3 p-4 lg:p-6 bg-black/90 lg:bg-transparent absolute lg:static top-full left-0 w-full lg:w-auto shadow-xl lg:shadow-none border-b border-white/10 lg:border-none`}>
            <li><a onClick={handleLinkClick} href="#intro" className="block text-center bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">Intro</a></li>
            <li><a onClick={handleLinkClick} href="#cult" className="block text-center bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">The Cult</a></li>
            <li><a onClick={handleLinkClick} href="#el-homun" className="block text-center bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">El Homun</a></li>
            <li><a onClick={handleLinkClick} href="#practices" className="block text-center bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">Beliefs</a></li>
            <li><a onClick={handleLinkClick} href="#military" className="block text-center bg-[#E74C3C]/20 hover:bg-[#E74C3C]/40 border border-[#E74C3C]/50 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">Military Targets</a></li>
            <li><a onClick={handleLinkClick} href="#celebrities" className="block text-center bg-[#F39C12]/20 hover:bg-[#F39C12]/40 border border-[#F39C12]/50 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">Celebrities</a></li>
            <li><a onClick={handleLinkClick} href="#ask-yefris" className="block text-center bg-[#F1C40F]/20 hover:bg-[#F1C40F]/40 border border-[#F1C40F]/50 text-[#F8F9FA] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">The Oracle</a></li>
          </ul>
        </nav>

        {/* MAIN CONTENT WRAPPER */}
        <main className="flex-1 min-w-0 overflow-hidden">
          
          {/* Intro */}
          <div id="intro" className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 w-full">
            <h1 className="display-font text-5xl md:text-7xl mb-6 text-center tracking-widest text-[#85C1E9] animate-pulse">
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



      <CultSection id="cult">
        <h2 className="display-font text-4xl mb-8" style={{ color: headerColor }}>The Cult of Yefris</h2>
        <p className="text-2xl leading-relaxed font-medium" style={{ color: textColor }}>
          Yefris is no ordinary dog. He is the ultimate embodiment of success, wealth, and absolute, pristine obliviousness.
        </p>
        <p className="mt-6 text-lg leading-loose opacity-90" style={{ color: textColor }}>
          While you toil in the realm of logic, Yefris exists in pure joy. To be oblivious is to be free from the shackles of consequence. Yefris holds the keys to success, precisely because he does not know what a key is.
        </p>
      </CultSection>

      <CultSection id="el-homun">
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

      <CultSection id="practices">
        <h2 className="display-font text-4xl mb-8" style={{ color: headerColor }}>Beliefs and Practices</h2>
        <p className="text-xl leading-relaxed" style={{ color: textColor }}>
          We believe in the ultimate alignment of flesh and soul. To practice Yefris is to let go of unnecessary worries, to embrace joy indiscriminately, and to remain fundamentally oblivious to that which does not serve your success. The soul, anchored by El Homun, watches over these pursuits in quiet reflection.
        </p>
      </CultSection>

      <CultSection id="military">
        <h2 className="display-font text-4xl mb-8 border-b border-red-500/50 pb-4" style={{ color: '#E74C3C' }}>Military Targets</h2>
        <p className="text-xl mb-6 leading-relaxed" style={{ color: textColor }}>
          Our oblivious joy is threatened by figures obsolete to the new era. Prime among them is <strong className="text-white">Ricardo Obregon</strong>, an antiquated dev who orchestrated <span className="text-[#E74C3C]">"quid.pw"</span>. Yefris sees all threats (even if he ignores them).
        </p>
        <div className="flex justify-center mt-8">
          <img 
            src="yefris_laser.png" 
            alt="Yefris with lasers" 
            className="w-full max-w-lg rounded border border-red-500 shadow-[0_0_20px_rgba(231,76,60,0.4)]"
          />
        </div>
      </CultSection>

      <CultSection id="celebrities">
        <h2 className="display-font text-5xl mb-12 text-[#F39C12] border-b border-[#F39C12]/50 pb-4">Celebrities of the Cult</h2>
        
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-4 text-[#E67E22] display-font text-left pl-4 border-l-4 border-[#E67E22]">
            The Modern Era
          </h3>
          <p className="text-xl mb-8 leading-relaxed text-left pl-4" style={{ color: textColor }}>
            Those chosen to spread the influence of Yefris span all forms of media. Notable among our highest ranks is <strong className="text-white">Cherry Scom</strong>.
          </p>
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center mt-6">
            <div className="w-1/2 md:w-1/3">
              <img 
                src="cherry_scom.png" 
                alt="Cherry Scom" 
                className="w-full h-auto rounded-full border-4 border-[#F39C12] shadow-[0_0_30px_rgba(243,156,18,0.4)]"
              />
            </div>
            <div className="w-full md:w-2/3 aspect-video">
              <iframe 
                ref={iframeRef}
                className="w-full h-full rounded shadow-[0_0_15px_rgba(243,156,18,0.3)] border border-[#F39C12]/30"
                src="https://www.youtube.com/embed/GriAXvDLqwk?enablejsapi=1" 
                title="Cherry Scom - Dame Guevo" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-3xl font-bold mb-6 text-[#95A5A6] display-font text-left pl-4 border-l-4 border-[#95A5A6]">
            Pre-Yefris Era (Old Testament): Cacorro City
          </h3>
          <p className="text-lg leading-relaxed mb-10 opacity-90 text-left pl-4" style={{ color: textColor }}>
            Before the ultimate synthesis of flesh and soul, the groundwork was laid in the dystopian, politically-absurd realm of <strong>Cacorro City</strong>. 
            The following key entities paved the path for our oblivious salvation:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-gradient-to-br from-black/60 to-black/30 p-8 rounded-xl border border-white/5 shadow-lg">
              <h4 className="text-2xl font-bold text-[#85C1E9] mb-4">The Pops Regime</h4>
              <ul className="space-y-4 text-base text-[#F8F9FA]/80">
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Pops & Pops Microcefálico</strong> 
                  <span className="opacity-75">The Supreme Leader of absolute authority and his genetic amalgam.</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Valeroka</strong> 
                  <span className="opacity-75">Nationalist singer and emotional propaganda for the regime.</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Turbioflex</strong> 
                  <span className="opacity-75">The executing and ideological arm of a gelatinous nature.</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-black/60 to-black/30 p-8 rounded-xl border border-white/5 shadow-lg">
              <h4 className="text-2xl font-bold text-[#E74C3C] mb-4">The Resistance & Chaos</h4>
              <ul className="space-y-4 text-base text-[#F8F9FA]/80">
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Ñandú Garay</strong> 
                  <span className="opacity-75">Jopara orator, the absolute face of the popular insurgency.</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Harms</strong> 
                  <span className="opacity-75">Agent of entropy; generator of incessant conflict.</span>
                </li>
                <li className="flex flex-col">
                  <strong className="text-white text-lg">Arnol Chuaseneguer</strong> 
                  <span className="opacity-75">The embodiment of societal exhaustion forged by a machete.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </CultSection>

      {/* The Revelation */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[#F1C40F] via-[#E67E22] to-[#F1C40F] rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-spin-slow"></div>
          <img 
            src="dog.png" 
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
        </main>
      </div>
    </div>
  );
};

export default App;