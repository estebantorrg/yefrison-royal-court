import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useCardImage } from './useCardImage';

interface ShareCardProps {
  question: string;
  answer: string;
  onClose: () => void;
}

export const ShareCard: React.FC<ShareCardProps> = ({ question, answer, onClose }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isGenerating, generatedImage, isCopied, generateImage, download, copyToClipboard } = useCardImage(cardRef);

  React.useEffect(() => {
    generateImage();
  }, [generateImage]);

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
            height: 'max-content',
            flexShrink: 0,
            background: 'linear-gradient(180deg, #0c0c0c 0%, #0f0d08 50%, #141008 100%)',
            padding: '40px 36px 36px 36px',
            position: 'relative',
            border: '1px solid rgba(241, 196, 15, 0.12)',
            borderRadius: '16px',
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, sans-serif",
          }}
        >
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
                whiteSpace: 'nowrap',
              }}>✦ CULT OF YEFRIS</span>
              <span style={{
                marginLeft: 'auto',
                color: 'rgba(241, 196, 15, 0.35)',
                fontSize: '9px',
                fontWeight: '600',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
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
            }} className="oracle-markdown">
              <ReactMarkdown>{answer}</ReactMarkdown>
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
              }}>CULT OF YEFRIS</span>
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

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => download(`yefris-oracle-${Date.now()}.png`)}
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
            onClick={copyToClipboard}
            disabled={!generatedImage || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-40 text-sm uppercase tracking-wider border border-white/20"
          >
            {isCopied ? 'Copied!' : 'Copy Image'}
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
