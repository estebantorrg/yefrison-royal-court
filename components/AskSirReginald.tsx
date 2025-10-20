import React, { useState, useCallback } from 'react';
import { askSirYuleinis } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export const AskSirYuleinis: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnswer('');

    try {
      const response = await askSirYuleinis(question);
      setAnswer(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [question, isLoading]);

  return (
    <section id="ask" className="bg-white py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Audience with His Majesty</h2>
        <p className="text-lg text-gray-600 mb-8">
          Have a pressing question? Seek the profound wisdom of Sir Yuleinis Yefrison. He will grace you with a response, provided he isn't in the middle of an important nap.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about treats, squirrels, life..."
            className="flex-grow w-full px-4 py-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow duration-200"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-amber-800 text-white font-bold py-3 px-8 rounded-md hover:bg-amber-900 transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <LoadingSpinner /> : 'Inquire'}
          </button>
        </form>

        {error && <div className="mt-6 text-red-600 bg-red-100 p-4 rounded-md">{error}</div>}

        {answer && (
          <div className="mt-8 text-left bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500 shadow-md animate-fade-in">
            <h3 className="text-lg font-bold text-amber-900 mb-2">Sir Yuleinis Proclaims:</h3>
            <p className="text-gray-700 whitespace-pre-wrap font-serif italic">"{answer}"</p>
          </div>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
};