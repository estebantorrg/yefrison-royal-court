import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AskBob } from '../components/AskBob';

const BobSection: React.FC<{ children: React.ReactNode; id?: string }> = ({ children, id }) => (
  <section id={id} className="min-h-[60vh] flex items-center justify-center p-8 px-4 relative z-10 w-full">
    <div className="w-full max-w-4xl mx-auto bg-[#0b0b1e]/50 backdrop-blur-md border border-[#6C7AE0]/15 p-6 md:p-16 shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-2xl text-center transition-transform duration-700 hover:scale-[1.01]">
      {children}
    </div>
  </section>
);

// The gospel — B.O.B.'s sacred (dumb) verses, quoted from the film.
const scriptures: { verse: string; gloss: string }[] = [
  { verse: "I may not have a brain, gentlemen, but I have an idea.", gloss: "On faith over reason." },
  { verse: "Turns out, you don't need one! Totally overrated!", gloss: "On the burden of thought." },
  { verse: "I forgot how to breathe! Help me, Dr. Cockroach!", gloss: "On the fragility of being." },
  { verse: "These disguises are da bomb!", gloss: "On appearances." },
  { verse: "I'll see you guys tomorrow, for lunch! Cake and balloons for lunch?! Best day ever!", gloss: "On facing the void with joy." },
  { verse: "She's lime-green, she has 14 little chunks of pineapple inside her... I'm happy now!", gloss: "On love, and jello." },
];

type Media = { src: string; label: string; type: 'image' | 'video' };
const gallery: Media[] = [
  { src: "/bob/bob_main.webp", label: "Benzoate Ostylezene Bicarbonate", type: 'image' },
  { src: "/bob/BOB_being_bob.webp", label: "B.O.B. Being B.O.B.", type: 'image' },
  { src: "/bob/BOB_smiling.png", label: "B.O.B. Smiling", type: 'image' },
  { src: "/bob/BOB_dumbfounded.gif", label: "B.O.B. Dumbfounded", type: 'image' },
  { src: "/bob/BOB_dissing_derek.mp4", label: "B.O.B. Dissing Derek", type: 'video' },
  { src: "/bob/Bob_being_forced_to_eat_carrots.mp4", label: "B.O.B. Being Forced to Eat Carrots", type: 'video' },
  { src: "/bob/Bob_Getting_Laid.mp4", label: "B.O.B. Getting Laid", type: 'video' },
];

const navLinks = [
  { href: "#bob-intro", label: "The Blob" },
  { href: "#bob-origin", label: "Origin" },
  { href: "#bob-gospel", label: "Gospel of Blankness" },
  { href: "#bob-powers", label: "Powers" },
  { href: "#bob-gallery", label: "Relics" },
  { href: "#bob-scripture", label: "Scripture" },
  { href: "#bob-oracle", label: "Ask the Blob" },
];

const BobPage: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const bgStyle: React.CSSProperties = {
    backgroundColor: '#050510',
    backgroundImage:
      'radial-gradient(ellipse at center top, rgba(108,122,224,0.18) 0%, rgba(60,70,150,0.06) 35%, transparent 75%)',
    backgroundAttachment: 'fixed',
  };
  const text = '#E6E9FF';

  return (
    <div style={bgStyle} className="min-h-screen font-sans text-white selection:bg-[#6C7AE0] selection:text-white page-transition-enter">
      <div className="flex flex-col lg:flex-row relative">
        {/* SIDEBAR */}
        <nav className="lg:flex flex-col lg:w-64 sticky top-0 lg:h-screen bg-[#08081a]/80 lg:bg-[#08081a]/60 border-b lg:border-b-0 lg:border-r border-[#6C7AE0]/10 backdrop-blur-md z-50 flex-shrink-0 w-full lg:overflow-y-auto shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between p-4 lg:p-6 border-b lg:border-[#6C7AE0]/20 border-transparent">
            <h2 className="display-font text-2xl lg:text-3xl text-[#9AA9FF] drop-shadow-md leading-none">B.O.B.</h2>
            <button className="lg:hidden text-white hover:text-[#9AA9FF] focus:outline-none p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          <ul className={`${isMobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col gap-3 p-4 lg:p-6 bg-[#08081a]/95 lg:bg-transparent absolute lg:static top-full left-0 w-full lg:w-auto shadow-xl lg:shadow-none border-b border-[#6C7AE0]/10 lg:border-none z-40`}>
            {navLinks.map(l => (
              <li key={l.href}>
                <a onClick={() => setIsMobileMenuOpen(false)} href={l.href} className="block text-center bg-[#6C7AE0]/10 hover:bg-[#6C7AE0]/30 border border-[#6C7AE0]/40 text-[#E6E9FF] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2 mt-2 border-t border-[#6C7AE0]/10">
              <Link to="/cult" className="block text-center bg-[#F1C40F]/10 hover:bg-[#F1C40F]/25 border border-[#F1C40F]/40 text-[#F1C40F] py-3 px-4 font-bold tracking-wider transition-all hover:scale-[1.02]">
                ⇄ The Cult of Yefris
              </Link>
            </li>
            <li>
              <Link to="/" className="block text-center text-[#9AA9FF]/60 hover:text-[#9AA9FF] py-2 px-4 text-xs uppercase tracking-[0.3em] transition-all">
                ← Gateway
              </Link>
            </li>
          </ul>
        </nav>

        {/* MAIN */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {/* Hero */}
          <div id="bob-intro" className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10 w-full text-center">
            <div className="relative mb-10 blob-float">
              <div className="absolute -inset-6 bg-[#6C7AE0] rounded-full blur-3xl opacity-30" />
              <img src="/bob/bob_main.webp" alt="B.O.B." className="relative w-56 h-56 md:w-80 md:h-80 object-contain drop-shadow-2xl blob-wobble" />
            </div>
            <h1 className="display-font text-4xl md:text-7xl mb-4 tracking-widest text-[#9AA9FF] drop-shadow-lg">
              THE CHURCH OF B.O.B.
            </h1>
            <p className="text-lg md:text-2xl opacity-80 max-w-2xl italic tracking-wide" style={{ color: text }}>
              Brainless. Blissful. Indestructible. You have questions. B.O.B. has no brain — and yet, he is happier than you.
            </p>
            <div className="mt-16 animate-bounce text-[#9AA9FF]/50">
              <p className="uppercase tracking-[0.3em] text-sm mb-2">Scroll to Wobble</p>
              <svg className="w-6 h-6 mx-auto" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          {/* Origin */}
          <BobSection id="bob-origin">
            <h2 className="display-font text-3xl md:text-4xl mb-8 text-[#9AA9FF]">Benzoate Ostylezene Bicarbonate</h2>
            <p className="text-xl md:text-2xl leading-relaxed font-medium" style={{ color: text }}>
              He was not born. He was <span className="text-[#C7D0FF]">spilled into existence</span> — a tomato injected with a genetically-altered, ranch-flavored dessert topping. From that laboratory accident rose an indestructible blue gelatinous mass with one eye and, famously, no brain.
            </p>
            <p className="mt-6 text-base md:text-lg leading-loose opacity-90" style={{ color: text }}>
              You may call him Benzoate Ostylezene Bicarbonate. But that is a mouthful, and B.O.B. would forget it anyway. He can call himself B.O.B. — whichever's easier.
            </p>
          </BobSection>

          {/* Gospel of Blankness */}
          <BobSection id="bob-gospel">
            <h2 className="display-font text-3xl md:text-5xl mb-8 border-y-4 py-4 text-[#9AA9FF]" style={{ borderColor: '#6C7AE0' }}>
              The Gospel of Blankness
            </h2>
            <p className="text-2xl md:text-3xl italic text-[#C7D0FF]">
              "Turns out, you don't need one. Totally overrated."
            </p>
            <p className="mt-8 text-lg md:text-xl leading-relaxed" style={{ color: text }}>
              Life is enormous, confusing, and utterly dumbfounding. The clever suffer under the weight of understanding it. B.O.B. does not. He has no brain to worry with, so he simply <span className="text-[#9AA9FF]">wobbles, floats, and marvels</span> — at breathing, at tacos, at the sheer improbability of existing at all.
            </p>
            <p className="mt-6 text-base md:text-lg leading-loose opacity-90" style={{ color: text }}>
              This is the secret the brained will never grasp: the universe makes no sense, and that is the best news anyone has ever heard. To be dumbfounded by life is to be endlessly delighted by it. Empty your head. Become the goo.
            </p>
          </BobSection>

          {/* Powers */}
          <BobSection id="bob-powers">
            <h2 className="display-font text-3xl md:text-4xl mb-10 text-[#9AA9FF]">Sacred Properties of the Blob</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                { t: "Indestructible", d: "You cannot kill what has nothing to lose. Blow him up; he reassembles, unbothered." },
                { t: "Devours Anything", d: "B.O.B. can eat and digest almost any substance. Problems included. Do not worry them; feed them to him." },
                { t: "No Brain, All Bliss", d: "Zero neurons. Infinite serenity. He forgets your worries faster than you can name them." },
              ].map((c) => (
                <div key={c.t} className="bg-[#6C7AE0]/5 border border-[#6C7AE0]/20 rounded-xl p-6 hover:bg-[#6C7AE0]/10 transition-colors">
                  <h3 className="text-xl font-bold text-[#C7D0FF] mb-3 display-font">{c.t}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: text }}>{c.d}</p>
                </div>
              ))}
            </div>
          </BobSection>

          {/* Gallery */}
          <BobSection id="bob-gallery">
            <h2 className="display-font text-3xl md:text-4xl mb-10 text-[#9AA9FF]">Holy Relics</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {gallery.map((g) => (
                <figure key={g.src} className="group rounded-xl overflow-hidden border border-[#6C7AE0]/20 bg-[#08081a]/60 flex flex-col">
                  <div className="relative aspect-square flex items-center justify-center overflow-hidden bg-black/30">
                    {g.type === 'video' ? (
                      <video
                        src={g.src}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img src={g.src} alt={g.label} loading="lazy" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                    )}
                  </div>
                  <figcaption className="px-3 py-2.5 text-[10px] md:text-xs uppercase tracking-widest text-[#C7D0FF] bg-[#6C7AE0]/10 border-t border-[#6C7AE0]/20 text-center leading-tight">
                    {g.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </BobSection>

          {/* Scripture */}
          <BobSection id="bob-scripture">
            <h2 className="display-font text-3xl md:text-4xl mb-10 text-[#9AA9FF]">The Wobbled Scriptures</h2>
            <div className="space-y-6 text-left">
              {scriptures.map((s, i) => (
                <blockquote key={i} className="border-l-4 border-[#6C7AE0]/50 pl-5 py-2">
                  <p className="text-lg md:text-xl italic text-[#E6E9FF]">"{s.verse}"</p>
                  <footer className="mt-1 text-xs uppercase tracking-widest text-[#9AA9FF]/60">— {s.gloss}</footer>
                </blockquote>
              ))}
            </div>
          </BobSection>

          {/* Oracle */}
          <section id="bob-oracle" className="pt-20 pb-8 relative z-10 flex flex-col items-center scroll-mt-4">
            <div className="text-center mb-8 px-4">
              <h2 className="display-font text-3xl md:text-4xl text-[#9AA9FF] mb-4">Ask the Blob</h2>
              <p className="text-[#C7D0FF]/70 max-w-md mx-auto">
                B.O.B. has no brain, but he has an idea. Ask him anything. Expect joy, confusion, and the occasional accidental wisdom.
              </p>
            </div>
            <AskBob />
            <Link to="/bob/oracle" className="mt-8 text-[#9AA9FF]/70 hover:text-[#9AA9FF] text-xs uppercase tracking-[0.3em] transition-colors">
              Open the Blob full-screen →
            </Link>
          </section>

          <footer className="bg-transparent text-[#9AA9FF]/50 text-center p-8 mt-12 pb-24 relative z-10 border-t border-[#6C7AE0]/10">
            <p className="text-xl display-font uppercase tracking-widest">&copy; {new Date().getFullYear()} B.O.B. forgot your name.</p>
            <p className="text-sm mt-4 italic">No brain. No worries. Best day ever.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default BobPage;
