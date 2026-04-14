import React, { useState, useEffect, useRef } from 'react';
import { askYefris, ChatMessage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'yefris';
  text: string;
}

export const AskYefris: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yefris_chat_history');
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save history to local storage whenever messages array changes
  useEffect(() => {
    localStorage.setItem('yefris_chat_history', JSON.stringify(messages));
    // Auto scale to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('yefris_chat_history');
    setError('');
  };

  const submitQuestion = async () => {
    if (!question.trim()) return;

    const newQuestion = question;
    setQuestion('');
    setError('');

    // Add user message to UI immediately
    const userMsg: DisplayMessage = { id: Date.now().toString(), role: 'user', text: newQuestion };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    setLoading(true);

    try {
      // Build history payload for API (exclude current error/loading states, only past messages)
      const historyPayload: ChatMessage[] = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await askYefris(newQuestion, historyPayload);
      
      const yefrisMsg: DisplayMessage = { id: (Date.now() + 1).toString(), role: 'yefris', text: response };
      setMessages(prev => [...prev, yefrisMsg]);
    } catch (err: any) {
      setError(err.message || 'The connection to yefris failed.');
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
      <div className="max-w-3xl w-full bg-black/60 backdrop-blur-md text-[#F8F9FA] p-8 rounded-lg shadow-[0_0_50px_rgba(255,237,74,0.15)] border border-white/20 flex flex-col h-[80vh] min-h-[600px]">
        
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-start mb-6">
          <div className="flex-grow text-center pl-10">
            <h2 className="text-4xl font-bold display-font text-[#F1C40F] drop-shadow-lg">Seek the Light of Yefris</h2>
            <p className="text-lg italic mt-2">Submit your worldly questions. Embrace the obliviousness.</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs uppercase tracking-wider bg-red-900/40 hover:bg-red-800/60 border border-red-500/50 text-red-100 py-2 px-3 rounded shadow transition-colors flex-shrink-0"
              title="Start a new session to clear memory"
            >
              New Chat
            </button>
          )}
        </div>

        {/* Chat Log Window */}
        <div className="flex-grow overflow-y-auto mb-6 pr-2 space-y-4 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center opacity-50 italic">
              The Oracle awaits your inquiry...
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[85%] p-4 rounded-lg shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-[#1F618D]/80 border border-[#2980B9]/50 text-white rounded-br-none' 
                      : 'bg-amber-50/90 border border-amber-300 text-gray-900 rounded-bl-none shadow-[0_0_15px_rgba(241,196,15,0.1)]'
                  }`}
                >
                  {msg.role === 'yefris' && <h3 className="text-sm font-bold mb-1 display-font text-[#D35400]">Yefris Answers:</h3>}
                  <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex flex-col items-start">
              <div className="max-w-[85%] p-4 rounded-lg bg-amber-50/50 border border-amber-300/50 text-gray-900 rounded-bl-none flex items-center shadow-[0_0_15px_rgba(241,196,15,0.1)]">
                <LoadingSpinner className="mr-3 text-[#D35400] h-5 w-5" />
                <span className="italic font-medium text-gray-700">Divining...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-white/20 pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-100 rounded text-sm text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="flex-grow">
              <textarea
                id="question"
                rows={2}
                className="w-full px-4 py-3 border border-[#BDC3C7]/40 focus:ring-2 focus:ring-[#F1C40F] focus:border-[#F1C40F] rounded resize-none bg-black/50 text-white outline-none transition-all duration-200"
                placeholder="Oh Yefris, how do I achieve such perfect oblivion?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="px-6 py-4 h-[76px] bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase flex-shrink-0 tracking-wider display-font"
            >
              Ask
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40">shift+enter to add a new line</span>
          </div>
        </div>

      </div>
    </section>
  );
};
