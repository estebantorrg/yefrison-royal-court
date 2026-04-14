import React, { useState, useEffect, useRef } from 'react';
import { askYefris, ChatMessage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'yefris';
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: DisplayMessage[];
}

export const AskYefris: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile UI
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yefris_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          if (parsed.length > 0) {
            // Sort by recent and set active
            const sorted = parsed.sort((a, b) => b.updatedAt - a.updatedAt);
            setActiveSessionId(sorted[0].id);
          }
        }
      } catch (e) {
        console.error("Failed to parse chat sessions");
      }
    } else {
      // Create an initial empty session if none exist at all
      createNewSession();
    }
  }, []);

  // Save history to local storage whenever sessions array changes
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('yefris_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Scroll to bottom when messages in active session change
  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Divination',
      updatedAt: Date.now(),
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setError('');
    
    // Close sidebar on mobile after creation
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        // If we deleted the last one, local storage auto-sync deletes it but we need an active session
        setTimeout(() => createNewSession(), 0);
      } else if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      // Clean up localStorage explicitly if empty
      if (remaining.length === 0) {
         localStorage.removeItem('yefris_chat_sessions');
      }
      return remaining;
    });
  };

  const submitQuestion = async () => {
    if (!question.trim() || !activeSessionId) return;

    const newQuestion = question;
    setQuestion('');
    setError('');

    const userMsgId = Date.now().toString();
    const userMsg: DisplayMessage = { id: userMsgId, role: 'user', text: newQuestion };
    
    // Optimistic update of the session
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        // Generate title if it's the first message
        const newTitle = session.messages.length === 0 
          ? (newQuestion.length > 25 ? newQuestion.substring(0, 25) + '...' : newQuestion)
          : session.title;
          
        return {
          ...session,
          title: newTitle,
          updatedAt: Date.now(),
          messages: [...session.messages, userMsg]
        };
      }
      return session;
    }));

    setLoading(true);

    try {
      // Grab the active session history right before sending (to format to Gemini's expected array)
      const currentSessionDetails = sessions.find(s => s.id === activeSessionId);
      const pastMessagesForPayload = currentSessionDetails ? currentSessionDetails.messages : [];
      
      const historyPayload: ChatMessage[] = pastMessagesForPayload.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const response = await askYefris(newQuestion, historyPayload);
      
      const yefrisMsg: DisplayMessage = { id: (Date.now() + 1).toString(), role: 'yefris', text: response };
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, yefrisMsg]
          };
        }
        return session;
      }));
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
    <section id="ask-yefris" className="py-20 px-4 bg-transparent text-white flex justify-center relative z-10 text-shadow-md">
      <div className="max-w-6xl w-full bg-black/60 backdrop-blur-md text-[#F8F9FA] rounded-lg shadow-[0_0_50px_rgba(255,237,74,0.15)] border border-white/20 h-[85vh] min-h-[600px] flex overflow-hidden lg:flex-row flex-col">
        
        {/* Mobile Header Toggle */}
        <div className="lg:hidden p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
           <h2 className="text-2xl font-bold display-font text-[#F1C40F] drop-shadow-lg leading-none">The Oracle</h2>
           <button 
             onClick={() => setIsSidebarOpen(!isSidebarOpen)}
             className="text-white hover:text-[#F1C40F] focus:outline-none p-2 border border-white/20 rounded-md"
           >
             <span className="sr-only">Toggle Sidebar</span>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
           </button>
        </div>

        {/* Sidebar (History List) */}
        <div className={`
          ${isSidebarOpen ? 'flex' : 'hidden'} 
          lg:flex flex-col w-full lg:w-72 bg-black/80 border-r border-white/10 flex-shrink-0 z-20 
          lg:relative absolute top-[73px] lg:top-0 h-[calc(100%-73px)] lg:h-full lg:translate-x-0
        `}>
          <div className="p-4 border-b border-white/10 hidden lg:block">
            <h2 className="text-3xl font-bold display-font text-[#F1C40F] drop-shadow-lg leading-none mb-1">Yefris</h2>
            <p className="text-[10px] tracking-widest uppercase text-[#85C1E9]">The Oracle Log</p>
          </div>
          
          <div className="p-4">
            <button
              onClick={createNewSession}
              className="w-full flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-bold bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-3 rounded transition-all drop-shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              New Thread
            </button>
          </div>

          <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
            {sessions.map(session => (
              <div 
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  if(window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                  activeSessionId === session.id 
                    ? 'bg-[#E67E22]/20 border-[#E67E22] text-[#F1C40F]' 
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="truncate text-sm font-medium pr-2">
                  {session.title}
                </div>
                <button 
                  onClick={(e) => deleteSession(e, session.id)}
                  className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0 transition-colors"
                  title="Delete Thread"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex flex-col flex-grow w-full relative">
          
          {/* Chat Log Window */}
          <div className="flex-grow overflow-y-auto p-4 lg:p-8 space-y-4 custom-scrollbar lg:bg-gradient-to-br from-transparent to-black/20">
            {(!activeSession || activeSession.messages.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                <svg className="w-16 h-16 text-[#F1C40F] mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                <p className="italic text-lg">The Oracle awaits your inquiry...</p>
                <p className="text-sm mt-2 font-medium">Ask for wisdom, guidance, or pure oblivion.</p>
              </div>
            ) : (
              activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div 
                    className={`max-w-[90%] lg:max-w-[80%] p-4 lg:px-6 lg:py-5 rounded-2xl shadow-md ${
                      msg.role === 'user' 
                        ? 'bg-[#1F618D] border border-[#2980B9]/60 text-white rounded-br-sm' 
                        : 'bg-[#FDF2E9] border border-amber-300/80 text-gray-900 rounded-bl-sm shadow-[0_0_15px_rgba(241,196,15,0.1)]'
                    }`}
                  >
                    {msg.role === 'yefris' && <h3 className="text-xs tracking-wider uppercase font-bold mb-2 text-[#D35400] opacity-80 border-b border-[#D35400]/20 pb-1 inline-block">Yefris Answers</h3>}
                    <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex flex-col items-start">
                <div className="max-w-[85%] p-4 rounded-2xl bg-[#FDF2E9]/70 border border-amber-300/50 text-gray-900 rounded-bl-sm flex items-center shadow-[0_0_15px_rgba(241,196,15,0.1)]">
                  <LoadingSpinner className="mr-3 text-[#D35400] h-5 w-5" />
                  <span className="italic font-medium text-gray-700">Divining...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-white/10 p-4 lg:p-6 bg-black/40 backdrop-blur-sm">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-100 rounded text-sm text-center">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-grow">
                <textarea
                  id="question"
                  rows={1}
                  className="w-full px-4 py-3 min-h-[50px] max-h-[150px] border border-white/20 focus:ring-2 focus:ring-[#F1C40F] focus:border-[#F1C40F] rounded-lg resize-y bg-black/60 text-white outline-none transition-all duration-200"
                  placeholder="Ask the Oracle..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="px-6 py-3 h-[50px] bg-[#E67E22] hover:bg-[#D35400] text-white font-bold rounded-lg shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase flex-shrink-0 tracking-wider display-font flex items-center justify-center"
              >
                Send
              </button>
            </form>
            <div className="text-center mt-2 hidden lg:block">
              <span className="text-[10px] uppercase tracking-widest text-white/30">Shift + Enter to add a new line</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
