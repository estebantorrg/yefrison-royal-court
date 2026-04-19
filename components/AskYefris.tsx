import React, { useState, useEffect, useRef } from 'react';
import { askYefrisStream, ChatMessage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'yefris';
  text: string;
  meta?: {
    groundingStatus: string;
    sources: Array<{ title: string; uri: string }>;
  };
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

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleBuffer, setEditTitleBuffer] = useState('');

  const [showHomun, setShowHomun] = useState(false);
  const [isBloodMoon, setIsBloodMoon] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const oracleCardRef = useRef<HTMLDivElement>(null);

  // Set correct height on Oracle card: full svh on mobile, 85vh on desktop
  useEffect(() => {
    const setOracleHeight = () => {
      const el = oracleCardRef.current;
      if (!el) return;
      if (window.innerWidth >= 1024) {
        el.style.height = '85vh';
        el.style.maxHeight = '85vh';
      } else {
        el.style.height = '100svh';
        el.style.maxHeight = '100svh';
      }
    };
    setOracleHeight();
    window.addEventListener('resize', setOracleHeight);
    return () => window.removeEventListener('resize', setOracleHeight);
  }, []);

  const loadingPhrases = [
    'yefris is doing hard yakka...',
    'yefris is yefrising...',
    'yefris is waffling...',
    'yefris is thinking...',
    'yefris is pondering...',
    'yefris is flibbertigibberting...',
  ];
  const [loadingText, setLoadingText] = useState('');

  useEffect(() => {
    if (!loading) {
      setLoadingText('');
      return;
    }

    let phraseIndex = Math.floor(Math.random() * loadingPhrases.length);
    let charIndex = 0;
    let pausing = false;
    let cancelled = false;

    const pickRandom = () => {
      let next;
      do { next = Math.floor(Math.random() * loadingPhrases.length); } while (next === phraseIndex && loadingPhrases.length > 1);
      return next;
    };

    const tick = () => {
      if (cancelled) return;
      const phrase = loadingPhrases[phraseIndex];

      if (pausing) {
        pausing = false;
        phraseIndex = pickRandom();
        charIndex = 0;
        setLoadingText('');
        setTimeout(tick, 50);
        return;
      }

      if (charIndex <= phrase.length) {
        setLoadingText(phrase.slice(0, charIndex));
        charIndex++;
        setTimeout(tick, 45);
      } else {
        // 3-second pause between phrases
        pausing = true;
        setTimeout(tick, 3000);
      }
    };

    tick();
    return () => { cancelled = true; };
  }, [loading]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yefris_chat_sessions');
    let loadedSessions: ChatSession[] = [];
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          loadedSessions = parsed;
        }
      } catch (e) {
        console.error("Failed to parse chat sessions");
      }
    }

    if (loadedSessions.length > 0) {
      // Find if we already have an empty session to avoid spamming them
      const emptySession = loadedSessions.find(s => s.messages.length === 0);
      
      if (emptySession) {
        setSessions(loadedSessions);
        setActiveSessionId(emptySession.id);
      } else {
        // Create a new session on top of the loaded history
        const tempId = Date.now().toString();
        setSessions([{
          id: tempId,
          title: 'New Divination',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, ...loadedSessions]);
        setActiveSessionId(tempId);
      }
    } else {
      // No history at all, just create a fresh one
      const tempId = Date.now().toString();
      setSessions([{
        id: tempId,
        title: 'New Divination',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]);
      setActiveSessionId(tempId);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('yefris_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [activeSession?.messages, error, loading]);

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

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        setTimeout(() => createNewSession(), 0);
      } else if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      if (remaining.length === 0) {
        localStorage.removeItem('yefris_chat_sessions');
      }
      return remaining;
    });
  };

  const startEditing = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitleBuffer(currentTitle);
  };

  const saveEdit = () => {
    if (editingSessionId && editTitleBuffer.trim() !== '') {
      setSessions(prev => prev.map(s =>
        s.id === editingSessionId ? { ...s, title: editTitleBuffer.trim() } : s
      ));
    }
    setEditingSessionId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  const handleApiConnection = async (questionText: string, isRetry: boolean = false) => {
    if (!activeSessionId) return;
    setError('');
    
    // We keep loading true while the oracle is thinking
    setLoading(true);

    try {
      const currentSessionDetails = sessions.find(s => s.id === activeSessionId);
      let pastMessagesForPayload = currentSessionDetails ? currentSessionDetails.messages : [];

      if (isRetry && pastMessagesForPayload.length > 0) {
        pastMessagesForPayload = pastMessagesForPayload.slice(0, -1);
      }

      const historyPayload: ChatMessage[] = pastMessagesForPayload.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Create a placeholder message in state immediately
      const newMsgId = (Date.now() + 1).toString();
      
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: [...session.messages, { id: newMsgId, role: 'yefris', text: '' }]
          };
        }
        return session;
      }));

      let isFirstChunk = true;
      let finalMeta: any = undefined;

      // Start streaming
      for await (const update of askYefrisStream(questionText, historyPayload)) {
        if (isFirstChunk) {
          // As soon as first text or meta arrives, we turn off the generic loading spinner
          setLoading(false);
          isFirstChunk = false;
        }

        if (update.type === 'error') {
          throw new Error(update.error);
        } else if (update.type === 'metadata') {
          finalMeta = update._oracle_meta;
          // Apply metadata
          setSessions(prev => prev.map(session => {
            if (session.id === activeSessionId) {
              const msgs = [...session.messages];
              const mIdx = msgs.findIndex(m => m.id === newMsgId);
              if (mIdx !== -1) {
                msgs[mIdx] = { ...msgs[mIdx], meta: update._oracle_meta };
              }
              return { ...session, messages: msgs };
            }
            return session;
          }));
        } else if (update.type === 'content') {
          // Append text chunk
          setSessions(prev => prev.map(session => {
            if (session.id === activeSessionId) {
              const msgs = [...session.messages];
              const mIdx = msgs.findIndex(m => m.id === newMsgId);
              if (mIdx !== -1) {
                msgs[mIdx] = { ...msgs[mIdx], text: msgs[mIdx].text + update.text };
              }
              return { ...session, messages: msgs };
            }
            return session;
          }));
        }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'yefris went to take a break. come back later.');
      // remove the partial empty message if it failed before starting
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          const msgs = session.messages.filter(m => m.text !== ''); // clean up empty placeholder
          return { ...session, messages: msgs };
        }
        return session;
      }));
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!question.trim() || !activeSessionId) return;

    const normalizedQ = question.trim().toLowerCase();

    if (normalizedQ === '/bloodmoon') {
      setQuestion('');
      setIsBloodMoon(prev => !prev);
      return;
    }

    if (normalizedQ === '/whisper') {
      setQuestion('');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance("Yefris sees everything... even your browser history.");
        msg.pitch = 0.1;
        msg.rate = 0.55;
        msg.volume = 1;
        window.speechSynthesis.speak(msg);
      }
      return;
    }

    if (normalizedQ === '/homun' || normalizedQ === 'el homun in flesh') {
      setQuestion('');
      setShowHomun(true);
      setTimeout(() => setShowHomun(false), 6000);
      return;
    }

    const currentSession = sessions.find(s => s.id === activeSessionId);
    const lastMsg = currentSession?.messages[currentSession.messages.length - 1];

    // If the last message is already a user message and hasn't been answered, 
    // just update it and retry instead of adding a new bubble.
    if (lastMsg && lastMsg.role === 'user') {
      const updatedQuestion = question;
      setQuestion('');
      setError('');

      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: session.messages.map((m, idx) =>
              idx === session.messages.length - 1 ? { ...m, text: updatedQuestion } : m
            )
          };
        }
        return session;
      }));

      await handleApiConnection(updatedQuestion, true);
      return;
    }

    const newQuestion = question;
    setQuestion('');
    setError('');

    const userMsgId = Date.now().toString();
    const userMsg: DisplayMessage = { id: userMsgId, role: 'user', text: newQuestion };

    // Add User Bubble Immediately
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        const newTitle = session.messages.length === 0 && session.title === 'New Divination'
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

    await handleApiConnection(newQuestion, false);
  };

  const deleteLastMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSessionId) return;
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        return {
          ...session,
          messages: session.messages.slice(0, -1)
        };
      }
      return session;
    }));
    setError('');
  };

  const retryLastQuestion = async () => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0) return;

    const lastMsg = currentSession.messages[currentSession.messages.length - 1];
    if (lastMsg.role !== 'user') return; // Paranoia check

    await handleApiConnection(lastMsg.text, true);
  };

  const handleInputTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    // Erase the error block if the user starts typing something new
    if (error) setError('');
  }

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
    <>
      {showHomun && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black homun-bg-fade pointer-events-none">
          <img 
            src="/homun.webp" 
            alt="El Homun" 
            className="max-h-[80vh] w-auto max-w-[95vw] object-contain opacity-0 homun-anim mix-blend-lighten" 
            style={{ 
              WebkitMaskImage: 'radial-gradient(ellipse closest-side at center, black 20%, transparent 100%)', 
              maskImage: 'radial-gradient(ellipse closest-side at center, black 20%, transparent 100%)' 
            }}
          />
          <div className="absolute inset-x-0 bottom-[10%] text-center opacity-0 homun-anim flex justify-center w-full z-10">
            <h2 className="text-4xl md:text-6xl text-red-700 font-bold display-font tracking-[0.5em] blur-[1px] opacity-80 mix-blend-screen text-shadow-lg">EL HOMUN SEES</h2>
          </div>
        </div>
      )}

      <section id="ask-yefris" className={`lg:py-20 px-4 py-0 bg-transparent text-white flex justify-center relative z-10 text-shadow-md ${isBloodMoon ? 'theme-bloodmoon' : ''}`}>
        <div
          ref={oracleCardRef}
          className="max-w-6xl w-full bg-black/60 backdrop-blur-md text-[#F8F9FA] rounded-none lg:rounded-lg shadow-[0_0_50px_rgba(255,237,74,0.15)] border-y border-white/20 lg:border flex overflow-hidden lg:flex-row flex-col"
        >

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
          flex-col w-full lg:w-64 bg-black/80 border-r border-white/10 flex-shrink-0 z-20 
          lg:relative absolute top-[73px] lg:top-0 h-[calc(100%-73px)] lg:h-full lg:translate-x-0
        `}>
            <div className="p-3 border-b border-white/10 hidden lg:block">
              <h2 className="text-2xl font-bold display-font text-[#F1C40F] drop-shadow-lg leading-none mb-1">Yefris</h2>
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] tracking-widest uppercase text-[#85C1E9]">The Oracle Log</p>
                <p className="text-[8px] text-gray-500 italic leading-tight">*History is stored locally and will not sync across devices.</p>
              </div>
            </div>

            <div className="p-3">
              <button
                onClick={createNewSession}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-bold bg-[#85C1E9]/10 hover:bg-[#85C1E9]/30 border border-[#85C1E9]/40 text-[#F8F9FA] py-1.5 rounded transition-all drop-shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                New Thread
              </button>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar px-2 pb-4 space-y-1">
              {sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => {
                    if (editingSessionId !== session.id) {
                      setActiveSessionId(session.id);
                      if (window.innerWidth < 1024) setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center justify-between p-2 py-1.5 rounded-lg transition-all border ${activeSessionId === session.id
                    ? 'bg-[#E67E22]/20 border-[#E67E22] text-[#F1C40F]'
                    : 'bg-transparent border-transparent hover:bg-white/5 text-gray-300'
                    } ${editingSessionId === session.id ? 'opacity-100 cursor-default' : 'cursor-pointer'}`}
                >
                  {editingSessionId === session.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editTitleBuffer}
                      onChange={(e) => setEditTitleBuffer(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black/50 text-white outline-none border-b border-[#F1C40F] text-xs py-0.5 font-medium px-1"
                    />
                  ) : (
                    <>
                      <div className="truncate text-xs font-medium pr-2">
                        {session.title}
                      </div>
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 flex-shrink-0">
                        <button
                          onClick={(e) => startEditing(e, session.id, session.title)}
                          className="text-gray-400 hover:text-blue-400 p-0.5 transition-colors"
                          title="Rename Thread"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={(e) => deleteSession(e, session.id)}
                          className="text-gray-400 hover:text-red-400 p-0.5 transition-colors"
                          title="Delete Thread"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
        <div className="flex flex-col flex-grow w-full relative">
          
          {/* Desktop Sidebar Toggle */}
          <div className="hidden lg:flex absolute top-4 left-4 z-10">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-[#F1C40F] focus:outline-none p-1.5 bg-black/40 border border-white/10 hover:border-[#F1C40F]/50 rounded-md transition-colors backdrop-blur-sm"
              title="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>

          {/* Chat Log Window */}
          <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 lg:p-8 pt-12 lg:pt-12 space-y-5 custom-scrollbar lg:bg-gradient-to-br from-transparent to-black/20">
              {(!activeSession || activeSession.messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-6">
                  <svg className="w-16 h-16 text-[#F1C40F] mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  <p className="italic text-lg">The Oracle awaits your inquiry...</p>
                  <p className="text-sm mt-2 font-medium">Ask for wisdom, guidance, or pure oblivion.</p>
                </div>
              ) : (
                activeSession.messages.map((msg, index) => {
                  // Do not render empty Yefris bubbles that act as a placeholder for streaming
                  if (msg.role === 'yefris' && !msg.text.trim()) {
                    return null;
                  }

                  const isLastUserMessage = msg.role === 'user' && index === activeSession.messages.length - 1;
                  const isErrorOnLastMessage = isLastUserMessage && error !== '';

                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="relative group flex items-center gap-2 max-w-[95%] lg:max-w-[85%]">
                        {isLastUserMessage && !loading && (
                          <button
                            onClick={deleteLastMessage}
                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all duration-200"
                            title="Remove stuck message"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}

                        <div
                          className={`p-4 lg:px-6 lg:py-5 rounded-2xl shadow-md ${msg.role === 'user'
                            ? 'bg-[#1F618D] border border-[#2980B9]/60 text-white rounded-br-sm'
                            : 'bg-[#FDF2E9] border border-amber-300/80 text-gray-900 rounded-bl-sm shadow-[0_0_15px_rgba(241,196,15,0.1)]'
                            } ${isErrorOnLastMessage ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}
                        >
                          {msg.role === 'yefris' && <h3 className="text-xs tracking-wider uppercase font-bold mb-2 text-[#D35400] opacity-80 border-b border-[#D35400]/20 pb-1 inline-block">Yefris Answers</h3>}
                          <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.text.trimStart()}</p>
                          
                          {/* Grounding / Homun Sources Metadata */}
                          {msg.meta && msg.meta.groundingStatus === "success" && msg.meta.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#D35400]/10">
                              <div className="flex items-center gap-1.5 mb-2 text-[#D35400] text-[10px] font-bold uppercase tracking-widest opacity-70">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Homun Sources</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.meta.sources.map((source, idx) => (
                                  <a 
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-[#D35400]/5 hover:bg-[#D35400]/10 border border-[#D35400]/20 px-2 py-1 rounded text-[10px] text-[#D35400] transition-colors truncate max-w-[200px]"
                                    title={source.title}
                                  >
                                    {source.title || 'Source'}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.meta && msg.meta.groundingStatus.startsWith("failed") && (
                            <div className="mt-2 text-[8px] text-gray-400 italic opacity-50 text-right">
                              *oracle insight clouded*
                            </div>
                          )}
                        </div>
                      </div>

                      {isLastUserMessage && !loading && (
                        <div className="mt-2 flex flex-col items-end w-full max-w-[90%] lg:max-w-[80%]">
                          {error && <span className="text-xs text-red-400 font-bold mb-1.5 px-1">{error}</span>}
                          <button
                            onClick={retryLastQuestion}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-900/60 hover:bg-red-800/80 border border-red-500/50 text-red-100 rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            {error ? "Re-Connect to Yefris" : "Retry Inquiry"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-[#FDF2E9]/70 border border-amber-300/50 text-gray-900 rounded-bl-sm flex items-center shadow-[0_0_15px_rgba(241,196,15,0.1)]">
                    <LoadingSpinner className="mr-3 text-[#D35400] h-5 w-5" />
                    <span className="italic font-medium text-gray-700">{loadingText}<span style={{ animation: 'blink 0.7s step-end infinite' }}>|</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-white/10 p-4 lg:p-6 bg-black/40 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="flex-grow">
                  <textarea
                    id="question"
                    rows={1}
                    className="w-full px-4 py-3 min-h-[50px] max-h-[150px] border border-white/20 focus:ring-2 focus:ring-[#F1C40F] focus:border-[#F1C40F] rounded-lg resize-y bg-black/60 text-white outline-none transition-all duration-200"
                    placeholder="Ask the Oracle..."
                    value={question}
                    onChange={handleInputTextChange}
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
    </>
  );
};
