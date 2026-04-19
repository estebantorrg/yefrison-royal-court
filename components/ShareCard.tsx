import React, { useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';

interface ShareCardProps {
  question: string;
  answer: string;
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ question, answer, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedImage, setGeneratedImage] = React.useState<string | null>(null);

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);

    try {
      // Small pause to let fonts and responsive elements finish layout calculations
      await new Promise(r => setTimeout(r, 150));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x for retina quality
        style: {
           margin: '0', 
        }
      });

      setGeneratedImage(dataUrl);
    } catch (err) {
      console.error('Failed to generate share card:', err);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  React.useEffect(() => {
    generateImage();
  }, [generateImage]);

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.download = `yefris-oracle-${Date.now()}.png`;
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
      // Brief visual feedback
      const btn = document.getElementById('copy-btn');
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy Image'; }, 1500);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Ensure we format the text nicely and allow it to be full length


  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="flex flex-col items-center gap-6 max-w-[620px] w-full" onClick={(e) => e.stopPropagation()}>
        
        {/* Scrollable area for the card if it gets too long */}
        <div id="share-scroll-container" className="w-full max-h-[75vh] overflow-y-auto custom-scrollbar flex justify-center pb-4 rounded-xl">
          {/* The actual card that gets rendered to image */}

        <div 
          ref={cardRef}
          style={{
            width: '560px',
            padding: '2px',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
          {/* Card inner with background */}
          <div style={{
            background: 'linear-gradient(180deg, #0c0c0c 0%, #0f0d08 50%, #141008 100%)',
            padding: '40px 36px 36px 36px',
            position: 'relative',
            border: '1px solid rgba(241, 196, 15, 0.12)',
            borderRadius: '16px',
          }}>
            {/* Subtle glow effect at bottom */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              height: '120px',
              background: 'radial-gradient(ellipse at center bottom, rgba(230, 126, 34, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '28px',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(241, 196, 15, 0.1)',
            }}>
              <span style={{
                color: '#F1C40F',
                fontSize: '11px',
                fontWeight: '700',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}>✦ CULT OF YEFRIS</span>
              <span style={{
                marginLeft: 'auto',
                color: 'rgba(241, 196, 15, 0.35)',
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>THE ORACLE</span>
            </div>

            {/* Question */}
            <div style={{
              color: 'rgba(255, 255, 255, 0.35)',
              fontSize: '13px',
              fontStyle: 'italic',
              marginBottom: '20px',
              lineHeight: '1.5',
              fontWeight: '400',
            }}>
              "{question}"
            </div>

            {/* Answer */}
            <div style={{
              color: 'rgba(248, 249, 250, 0.92)',
              fontSize: '16px',
              lineHeight: '1.75',
              fontWeight: '400',
              marginBottom: '32px',
              letterSpacing: '0.01em',
              whiteSpace: 'pre-wrap', // Preserve formatting for long answers
            }}>
              {answer}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              paddingBottom: '8px', 
              borderTop: '1px solid rgba(241, 196, 15, 0.08)',
              lineHeight: '1',
            }}>
              <span style={{
                color: 'rgba(241, 196, 15, 0.5)',
                fontSize: '11px',
                fontWeight: '500',
                letterSpacing: '1px',
              }}>yefris.pages.dev</span>
              <span style={{
                color: 'rgba(230, 126, 34, 0.4)',
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}>powered by el homun</span>
            </div>
          </div>
        </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!generatedImage || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-40 text-sm uppercase tracking-wider"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isGenerating ? 'Generating...' : 'Save Image'}
          </button>
          <button
            id="copy-btn"
            onClick={handleCopyToClipboard}
            disabled={!generatedImage || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-40 text-sm uppercase tracking-wider border border-white/20"
          >
            Copy Image
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 font-bold rounded-lg transition-all duration-200 text-sm uppercase tracking-wider border border-white/10"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
