import React from 'react';
import { AskYefris } from '../components/AskYefris';
import { Link } from 'react-router-dom';

const OraclePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050505] page-transition-enter">
      {/* Compact header with back navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/cult"
            className="flex items-center gap-2 text-white/60 hover:text-[#F1C40F] transition-colors text-sm uppercase tracking-widest"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <h1 className="display-font text-lg text-[#F1C40F] tracking-wider">The Oracle</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Oracle takes full remaining space */}
      <div className="pt-[56px]">
        <AskYefris />
      </div>
    </div>
  );
};

export default OraclePage;
