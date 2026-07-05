import React from 'react';
import { AskBob } from '../components/AskBob';
import { Link } from 'react-router-dom';

const BobOraclePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#050510] page-transition-enter">
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#08081a]/80 backdrop-blur-md border-b border-[#6C7AE0]/15">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/bob" className="flex items-center gap-2 text-white/60 hover:text-[#9AA9FF] transition-colors text-sm uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Church
          </Link>
          <h1 className="display-font text-lg text-[#9AA9FF] tracking-wider">Ask the Blob</h1>
          <div className="w-16" />
        </div>
      </div>
      <div className="pt-[56px]">
        <AskBob />
      </div>
    </div>
  );
};

export default BobOraclePage;
