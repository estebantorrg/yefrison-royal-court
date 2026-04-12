import React, { useState } from 'react';
import { askYefris } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export const AskYefris: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError('');
    setAnswer('');

    try {
      const response = await askYefris(question);
      setAnswer(response);
    } catch (err: any) {
      setError(err.message || 'The connection to the flesh failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  return (
    <section id="ask-yefris" className="py-20 px-4 bg-transparent text-white flex flex-col items-center relative z-10 text-shadow-md">
      <div className="max-w-3xl w-full bg-black/60 backdrop-blur-md text-[#F8F9FA] p-8 rounded-lg shadow-[0_0_50px_rgba(255,237,74,0.15)] border border-white/20">
        <h2 className="text-4xl font-bold text-center mb-6 display-font text-[#F1C40F] drop-shadow-lg">Seek the Light of Yefris</h2>
        <p className="text-center text-lg mb-8 italic">Submit your worldly questions to the flesh. Embrace the obliviousness.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="question" className="block text-sm font-medium mb-2 uppercase tracking-widest text-[#7FB3D5]">
              Your Inquiry
            </label>
            <textarea
              id="question"
              rows={3}
              className="w-full px-4 py-3 border-2 border-[#BDC3C7] focus:ring-2 focus:ring-[#F1C40F] focus:border-[#F1C40F] rounded resize-none bg-gray-50 text-gray-900 outline-none transition-all duration-200"
              placeholder="Oh Yefris, how do I achieve such perfect oblivion?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>
          
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex justify-center items-center px-8 py-3 bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xl uppercase tracking-wider display-font"
            >
              {loading ? (
                <>
                  <LoadingSpinner className="mr-3 text-white h-5 w-5" />
                  Divining...
                </>
              ) : (
                "Seek Oblivion"
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-8 relative">
            <div className="mt-4 p-6 bg-amber-50 rounded-lg shadow-inner border border-amber-200">
              <h3 className="text-xl font-semibold mb-3 display-font text-[#D35400]">Yefris Answers:</h3>
              <p className="text-lg leading-relaxed whitespace-pre-wrap font-medium text-gray-900">{answer}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
