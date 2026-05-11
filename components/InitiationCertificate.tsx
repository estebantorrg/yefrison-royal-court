import React, { useRef, useState, useCallback, useEffect } from 'react';
import { toPng } from 'html-to-image';

const TITLES = [
  "Practitioner of Selective Obliviousness",
  "Acolyte of El Homun",
  "Knight of Stagnant Knowledge",
  "High Priest of Yefris",
  "Warden of the Pre-Yefris Era"
];

export const InitiationCertificate: React.FC = () => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState(TITLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Random title on mount
    setTitle(TITLES[Math.floor(Math.random() * TITLES.length)]);
  }, []);

  const generateImage = useCallback(async () => {
    if (!cardRef.current || !name.trim()) return;
    setIsGenerating(true);

    try {
      await new Promise(r => setTimeout(r, 150)); // layout calculation wait
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { margin: '0' } // Clear any margin affecting the export
      });
      setGeneratedImage(dataUrl);
    } catch (err) {
      console.error('Failed to generate certificate:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [name]);

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `cult-initiation-${name.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.href = generatedImage;
    link.click();
  };

  const handleCopyToClipboard = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4">
      <div className="w-full bg-black/60 backdrop-blur-md border border-[#F1C40F]/20 p-8 rounded-xl shadow-[0_0_30px_rgba(241,196,15,0.1)] transition-all mb-8">
        <h3 className="text-3xl font-bold text-[#F1C40F] display-font mb-4 text-center">Join The Cult</h3>
        <p className="text-[#F8F9FA]/80 mb-6 text-center">
          Declare your allegiance and receive official documentation of your selective obliviousness.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Enter Your Name" 
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setGeneratedImage(null); // Reset generated image when name changes
              setTitle(TITLES[Math.floor(Math.random() * TITLES.length)]); // Re-roll title on new name
            }}
            className="flex-1 bg-black/50 border border-[#F1C40F]/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F1C40F] transition-colors"
            maxLength={30}
          />
          <button 
            onClick={generateImage}
            disabled={!name.trim() || isGenerating}
            className="bg-[#F1C40F] hover:bg-[#F39C12] text-black font-bold uppercase tracking-wider px-6 py-3 rounded-lg disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(241,196,15,0.3)]"
          >
            {isGenerating ? 'Forging...' : 'Initiate'}
          </button>
        </div>

        {generatedImage && (
          <div className="mt-8 flex flex-col items-center gap-4 transition-all duration-500">
            <p className="text-sm uppercase tracking-widest text-[#F1C40F]/60 mb-2">Certificate Forged</p>
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded-lg shadow-[0_0_15px_rgba(230,126,34,0.4)] transition-all duration-200 text-sm uppercase tracking-wider"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all duration-200 border border-white/20 text-sm uppercase tracking-wider"
              >
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            {/* Real preview of the generated image */}
            <img src={generatedImage} alt="Certificate Preview" className="w-full max-w-[400px] rounded-lg shadow-2xl border border-[#F1C40F]/30 mt-4" />
          </div>
        )}
      </div>

      {/* Hidden Div Used for Image Generation - Kept out of normal view */}
      <div className="fixed top-0 left-0 opacity-0 -z-50 pointer-events-none">
        <div 
          ref={cardRef}
          style={{
            width: '600px',
            height: '800px',
            background: 'linear-gradient(135deg, #050505 0%, #151004 100%)',
            padding: '50px',
            position: 'relative',
            border: '8px solid #1A1A1A',
            outline: '2px solid rgba(241, 196, 15, 0.5)',
            outlineOffset: '-12px',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          {/* Ornate corner borders */}
          <div style={{ position: 'absolute', top: '24px', left: '24px', width: '40px', height: '40px', borderTop: '2px solid #F1C40F', borderLeft: '2px solid #F1C40F' }} />
          <div style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderTop: '2px solid #F1C40F', borderRight: '2px solid #F1C40F' }} />
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '40px', height: '40px', borderBottom: '2px solid #F1C40F', borderLeft: '2px solid #F1C40F' }} />
          <div style={{ position: 'absolute', bottom: '24px', right: '24px', width: '40px', height: '40px', borderBottom: '2px solid #F1C40F', borderRight: '2px solid #F1C40F' }} />

          {/* Cult Seal / Logo */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: '4px solid #F1C40F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            background: 'radial-gradient(circle, rgba(241,196,15,0.2) 0%, transparent 70%)',
            overflow: 'hidden',
          }}>
            <img src="/dog.png" alt="Yefris" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          <h2 style={{ color: '#E67E22', fontSize: '24px', letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>
            Official Proclamation
          </h2>
          
          <h1 style={{ color: '#F8F9FA', fontSize: '42px', fontFamily: "'Cinzel', serif", marginBottom: '40px', textShadow: '0 0 20px rgba(241, 196, 15, 0.4)' }}>
            {name || "Initiate"}
          </h1>

          <p style={{ color: 'rgba(248, 249, 250, 0.7)', fontSize: '18px', maxWidth: '80%', lineHeight: '1.6', marginBottom: '24px' }}>
            Has formally embraced the Yefris-El Homun Theory of Mind. They are hereafter recognized globally and eternally as:
          </p>

          <p style={{ color: '#F1C40F', fontSize: '28px', fontStyle: 'italic', fontWeight: '600', marginBottom: '60px' }}>
            "{title}"
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 'auto', padding: '0 40px', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '150px', borderBottom: '1px solid rgba(255,255,255,0.3)', marginBottom: '8px', paddingBottom: '4px', fontFamily: "'Cinzel', serif", color: '#F8F9FA', fontSize: '20px' }}>
                El Homun
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Silent Overseer</span>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '150px', borderBottom: '1px solid rgba(255,255,255,0.3)', marginBottom: '8px', paddingBottom: '4px', fontFamily: "'Cinzel', serif", color: '#F8F9FA', fontSize: '20px' }}>
                Yefris
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Oblivious Director</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
