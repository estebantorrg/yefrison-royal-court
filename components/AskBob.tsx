import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { askYefrisStream, ChatMessage } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

export interface DisplayMessage {
  id: string;
  role: 'user' | 'bob';
  text: string;
  meta?: {
    groundingStatus: string;
    sources: Array<{ title: string; uri: string }>;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: DisplayMessage[];
}

const STORAGE_KEY = 'bob_chat_sessions';

const loadingPhrases = [
  'b.o.b is wobbling...',
  'b.o.b is thinking (jk, no brain)...',
  'b.o.b is jiggling around...',
  'b.o.b forgot the question...',
  'b.o.b is looking for jello...',
  'b.o.b is being amazed by air...',
  'b.o.b is squishing thoughts...',
];

export const AskBob: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleBuffer, setEditTitleBuffer] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [charLimitWarning, setCharLimitWarning] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const oracleCardRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Card height: full svh on mobile, 85vh on desktop
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
        pausing = true;
        setTimeout(tick, 3000);
      }
    };

    tick();
    return () => { cancelled = true; };
  }, [loading]);

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let loadedSessions: ChatSession[] = [];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) loadedSessions = parsed;
      } catch (e) {
        console.error("Failed to parse bob chat sessions");
      }
    }

    if (loadedSessions.length > 0) {
      const emptySession = loadedSessions.find(s => s.messages.length === 0);
      if (emptySession) {
        setSessions(loadedSessions);
        setActiveSessionId(emptySession.id);
      } else {
        const tempId = Date.now().toString();
        setSessions([{ id: tempId, title: 'New Wobble', messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...loadedSessions]);
        setActiveSessionId(tempId);
      }
    } else {
      const tempId = Date.now().toString();
      setSessions([{ id: tempId, title: 'New Wobble', messages: [], createdAt: Date.now(), updatedAt: Date.now() }]);
      setActiveSessionId(tempId);
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.warn('localStorage quota exceeded, pruning old bob sessions');
        const pruned = sessions.slice(0, Math.max(5, Math.ceil(sessions.length / 2)));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        } catch (_) {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeSession?.messages, error, loading]);

  const createNewSession = () => {
    const existingEmptySession = sessions.find(s => s.messages.length === 0);
    if (existingEmptySession) {
      setActiveSessionId(existingEmptySession.id);
      setError('');
      if (window.innerWidth < 768) setIsSidebarOpen(false);
      return;
    }

    const newId = Date.now().toString();
    setSessions(prev => [{ id: newId, title: 'New Wobble', createdAt: Date.now(), updatedAt: Date.now(), messages: [] }, ...prev]);
    setActiveSessionId(newId);
    setError('');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const newId = Date.now().toString();
        setActiveSessionId(newId);
        localStorage.removeItem(STORAGE_KEY);
        return [{ id: newId, title: 'New Wobble', createdAt: Date.now(), updatedAt: Date.now(), messages: [] }];
      }
      if (activeSessionId === id) setActiveSessionId(remaining[0].id);
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
      setSessions(prev => prev.map(s => s.id === editingSessionId ? { ...s, title: editTitleBuffer.trim() } : s));
    }
    setEditingSessionId(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    else if (e.key === 'Escape') setEditingSessionId(null);
  };

  const handleApiConnection = async (questionText: string, isRetry: boolean = false) => {
    if (!activeSessionId) return;
    setError('');

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

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

      const newMsgId = (Date.now() + 1).toString();

      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, updatedAt: Date.now(), messages: [...session.messages, { id: newMsgId, role: 'bob', text: '' }] };
        }
        return session;
      }));

      let isFirstChunk = true;

      for await (const update of askYefrisStream(questionText, historyPayload, currentAbortController.signal, 'bob')) {
        if (isFirstChunk) { setLoading(false); isFirstChunk = false; }

        if (update.type === 'error') {
          throw new Error(update.error);
        } else if (update.type === 'metadata') {
          setSessions(prev => prev.map(session => {
            if (session.id === activeSessionId) {
              const msgs = [...session.messages];
              const mIdx = msgs.findIndex(m => m.id === newMsgId);
              if (mIdx !== -1) msgs[mIdx] = { ...msgs[mIdx], meta: update._oracle_meta };
              return { ...session, messages: msgs };
            }
            return session;
          }));
        } else if (update.type === 'content') {
          setSessions(prev => prev.map(session => {
            if (session.id === activeSessionId) {
              const msgs = [...session.messages];
              const mIdx = msgs.findIndex(m => m.id === newMsgId);
              if (mIdx !== -1) msgs[mIdx] = { ...msgs[mIdx], text: msgs[mIdx].text + update.text };
              return { ...session, messages: msgs };
            }
            return session;
          }));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || currentAbortController.signal.aborted) {
        console.log("Bob stream actively aborted by overlapping request.");
        return;
      }
      console.error(err);
      setError(err.message || 'b.o.b wandered off to find a snack. try again.');
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, messages: session.messages.filter(m => m.text !== '') };
        }
        return session;
      }));
    } finally {
      if (abortControllerRef.current === currentAbortController) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  };

  const submitQuestion = async () => {
    if (!question.trim() || !activeSessionId) return;

    if (question.length > 5000) { setCharLimitWarning(true); return; }

    const currentSession = sessions.find(s => s.id === activeSessionId);
    const lastMsg = currentSession?.messages[currentSession.messages.length - 1];

    if (lastMsg && lastMsg.role === 'user') {
      const updatedQuestion = question;
      setQuestion('');
      setError('');
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return {
            ...session,
            updatedAt: Date.now(),
            messages: session.messages.map((m, idx) => idx === session.messages.length - 1 ? { ...m, text: updatedQuestion } : m)
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

    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        const newTitle = session.messages.length === 0 && session.title === 'New Wobble'
          ? (newQuestion.length > 25 ? newQuestion.substring(0, 25) + '...' : newQuestion)
          : session.title;
        return { ...session, title: newTitle, updatedAt: Date.now(), messages: [...session.messages, userMsg] };
      }
      return session;
    }));

    await handleApiConnection(newQuestion, false);
  };

  const deleteLastMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeSessionId) return;
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) return { ...session, messages: session.messages.slice(0, -1) };
      return session;
    }));
    setError('');
  };

  const retryLastQuestion = async () => {
    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession || currentSession.messages.length === 0) return;
    const lastMsg = currentSession.messages[currentSession.messages.length - 1];
    if (lastMsg.role !== 'user') return;
    await handleApiConnection(lastMsg.text, true);
  };

  const handleInputTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submitQuestion(); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    if (isTouchDevice && e.key === 'Enter') return;
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(); }
  };

  return (
    <>
      <section id="ask-bob" className="w-full lg:py-20 px-4 py-0 bg-transparent text-white flex justify-center relative z-10 text-shadow-md">
        <div
          ref={oracleCardRef}
          className="max-w-6xl w-full bg-[#0b0b1e]/80 backdrop-blur-md text-[#EEF2FF] rounded-none lg:rounded-lg shadow-[0_0_50px_rgba(108,122,224,0.25)] border-y border-[#6C7AE0]/30 lg:border flex overflow-hidden lg:flex-row flex-col"
        >
          {/* Mobile Header Toggle */}
          <div className="lg:hidden p-4 border-b border-[#6C7AE0]/20 flex justify-between items-center bg-black/40">
            <h2 className="text-2xl font-bold display-font text-[#9AA9FF] drop-shadow-lg leading-none">The Blob Speaks</h2>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white hover:text-[#9AA9FF] focus:outline-none p-2 border border-[#6C7AE0]/30 rounded-md"
            >
              <span className="sr-only">Toggle Sidebar</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>

          {/* Mobile backdrop */}
          {isSidebarOpen && (
            <div className="lg:hidden fixed inset-0 bg-black/50 z-10" onClick={() => setIsSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <div className={`
            ${isSidebarOpen ? 'flex' : 'hidden'}
            flex-col w-full lg:w-64 bg-[#08081a]/90 border-r border-[#6C7AE0]/15 flex-shrink-0 z-20
            lg:relative absolute top-[73px] lg:top-0 h-[calc(100%-73px)] lg:h-full lg:translate-x-0
          `}>
            <div className="p-3 border-b border-[#6C7AE0]/15 hidden lg:block">
              <h2 className="text-2xl font-bold display-font text-[#9AA9FF] drop-shadow-lg leading-none mb-1">B.O.B.</h2>
              <div className="flex flex-col gap-0.5">
                <p className="text-[9px] tracking-widest uppercase text-[#C7D0FF]">The Goo Log</p>
                <p className="text-[8px] text-[#8A93C8] italic leading-tight">*b.o.b forgets across devices. saved on this one only.</p>
              </div>
            </div>

            <div className="p-3">
              <button
                onClick={createNewSession}
                className="w-full flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-bold bg-[#6C7AE0]/15 hover:bg-[#6C7AE0]/35 border border-[#6C7AE0]/40 text-[#EEF2FF] py-1.5 rounded transition-all drop-shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                New Wobble
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
                    ? 'bg-[#6C7AE0]/20 border-[#6C7AE0] text-[#C7D0FF]'
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
                      className="w-full bg-black/50 text-white outline-none border-b border-[#9AA9FF] text-xs py-0.5 font-medium px-1"
                    />
                  ) : (
                    <>
                      <div className="truncate text-xs font-medium pr-2">{session.title}</div>
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100 flex-shrink-0">
                        <button onClick={(e) => startEditing(e, session.id, session.title)} className="text-gray-400 hover:text-[#9AA9FF] p-0.5 transition-colors" title="Rename Wobble">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={(e) => deleteSession(e, session.id)} className="text-gray-400 hover:text-red-400 p-0.5 transition-colors" title="Delete Wobble">
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
          <div className="flex flex-col flex-grow w-full relative min-h-0">
            {/* Desktop Sidebar Toggle */}
            <div className="hidden lg:flex absolute top-4 left-4 z-10">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-400 hover:text-[#9AA9FF] focus:outline-none p-1.5 bg-black/40 border border-[#6C7AE0]/20 hover:border-[#9AA9FF]/50 rounded-md transition-colors backdrop-blur-sm"
                title="Toggle Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>

            {/* Chat Log */}
            <div ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-8 pt-12 lg:pt-12 space-y-5 custom-scrollbar lg:bg-gradient-to-br from-transparent to-[#6C7AE0]/5">
              {(!activeSession || activeSession.messages.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-70 px-6">
                  <img src="/bob/bob_main.webp" alt="B.O.B." className="w-24 h-24 object-contain mb-4 blob-float opacity-80" />
                  <p className="italic text-lg text-[#C7D0FF]">ask b.o.b anything...</p>
                  <p className="text-sm mt-2 font-medium text-[#9AA9FF]/70">he has no brain, but he has an idea.</p>
                </div>
              ) : (
                activeSession.messages.map((msg, index) => {
                  if (msg.role === 'bob' && !msg.text.trim()) return null;

                  const isLastUserMessage = msg.role === 'user' && index === activeSession.messages.length - 1;
                  const isErrorOnLastMessage = isLastUserMessage && error !== '';

                  return (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="relative group flex items-center gap-2 max-w-[95%] lg:max-w-[85%]">
                        {isLastUserMessage && !loading && (
                          <button onClick={deleteLastMessage} className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all duration-200" title="Remove stuck message">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}

                        <div
                          className={`p-4 lg:px-6 lg:py-5 rounded-2xl shadow-md ${msg.role === 'user'
                            ? 'bg-[#3A3F8F] border border-[#6C7AE0]/60 text-white rounded-br-sm'
                            : 'bg-[#141633] border border-[#6C7AE0]/25 text-[#EEF2FF]/90 rounded-bl-sm shadow-[0_0_15px_rgba(108,122,224,0.08)]'
                            } ${isErrorOnLastMessage ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : ''}`}
                        >
                          {msg.role === 'bob' && (
                            <div className="flex justify-between items-center mb-2 border-b border-[#6C7AE0]/15 pb-1">
                              <h3 className="text-xs tracking-wider uppercase font-bold text-[#9AA9FF] opacity-80 inline-block">B.O.B. Wobbles Back</h3>
                            </div>
                          )}
                          <div className="text-base leading-relaxed font-medium bob-markdown">
                            <ReactMarkdown>{msg.text.trimStart()}</ReactMarkdown>
                          </div>

                          {/* Grounding sources */}
                          {msg.meta && msg.meta.groundingStatus === "success" && msg.meta.sources.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-[#9AA9FF]/10">
                              <div className="flex items-center gap-1.5 mb-2 text-[#9AA9FF] text-[10px] font-bold uppercase tracking-widest opacity-70">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Stuff B.O.B. Found</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.meta.sources.filter(s => s.uri && (s.uri.startsWith('http://') || s.uri.startsWith('https://'))).map((source, idx) => (
                                  <a key={idx} href={source.uri} target="_blank" rel="noopener noreferrer" className="bg-[#6C7AE0]/5 hover:bg-[#6C7AE0]/15 border border-[#6C7AE0]/25 px-2 py-1 rounded text-[10px] text-[#9AA9FF] transition-colors truncate max-w-[200px]" title={source.title}>
                                    {source.title || 'Source'}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {msg.meta && msg.meta.groundingStatus.startsWith("failed") && (
                            <div className="mt-2 text-[8px] text-gray-400 italic opacity-50 text-right">*b.o.b got distracted*</div>
                          )}
                        </div>
                      </div>

                      {isLastUserMessage && !loading && (
                        <div className="mt-2 flex flex-col items-end w-full max-w-[90%] lg:max-w-[80%]">
                          {error && <span className="text-xs text-red-400 font-bold mb-1.5 px-1">{error}</span>}
                          <button onClick={retryLastQuestion} className="flex items-center gap-1 px-2.5 py-1 bg-[#3A3F8F]/70 hover:bg-[#3A3F8F] border border-[#6C7AE0]/50 text-[#C7D0FF] rounded text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            {error ? "Poke B.O.B. Again" : "Ask Again"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {loading && (
                <div className="flex flex-col items-start">
                  <div className="max-w-[85%] p-4 rounded-2xl bg-[#141633]/80 border border-[#6C7AE0]/15 text-[#EEF2FF]/90 rounded-bl-sm flex items-center shadow-[0_0_15px_rgba(108,122,224,0.08)]">
                    <LoadingSpinner className="mr-3 text-[#9AA9FF] h-5 w-5" />
                    <span className="italic font-medium text-white/70">{loadingText}<span style={{ animation: 'blink 0.7s step-end infinite' }}>|</span></span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-[#6C7AE0]/15 p-4 lg:p-6 bg-black/40 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex gap-3 items-end">
                <div className="flex-grow relative">
                  <textarea
                    id="bob-question"
                    rows={1}
                    className={`w-full px-4 py-3 min-h-[44px] max-h-[80px] sm:max-h-[150px] border ${question.length > 5000 ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500' : 'border-[#6C7AE0]/25 focus:ring-[#9AA9FF] focus:border-[#9AA9FF]'} rounded-lg resize-none sm:resize-y bg-black/60 text-white outline-none transition-all duration-200 pr-16`}
                    placeholder="ask the blob..."
                    value={question}
                    onChange={handleInputTextChange}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  />
                  {question.length > 4000 && (
                    <div className={`absolute right-3 bottom-3 text-[10px] font-bold tracking-tighter pointer-events-none bg-black/40 px-1 rounded ${question.length > 5000 ? 'text-red-400' : 'text-[#9AA9FF]/60'}`}>
                      {question.length}/5000
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="px-6 py-3 h-[50px] bg-[#6C7AE0] hover:bg-[#5563cc] text-white font-bold rounded-lg shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed uppercase flex-shrink-0 tracking-wider display-font flex items-center justify-center"
                >
                  Poke
                </button>
              </form>
              <div className="text-center mt-2 hidden lg:block">
                <span className="text-[10px] uppercase tracking-widest text-white/30">Shift + Enter to add a new line</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {charLimitWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setCharLimitWarning(false)}>
          <div className="bg-[#141633] border border-[#6C7AE0]/50 rounded-xl p-6 max-w-sm mx-4 shadow-[0_0_30px_rgba(108,122,224,0.25)] text-center" onClick={e => e.stopPropagation()}>
            <div className="text-[#9AA9FF] mb-3">
              <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 display-font">Too Many Words</h3>
            <p className="text-gray-300 text-sm mb-1">that's more than b.o.b can hold (5,000 char limit).</p>
            <p className="text-[#9AA9FF]/80 text-xs font-bold mb-4">{question.length.toLocaleString()} / 5,000</p>
            <button onClick={() => setCharLimitWarning(false)} className="px-5 py-2 bg-[#6C7AE0] hover:bg-[#5563cc] text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wider">Okay</button>
          </div>
        </div>
      )}
    </>
  );
};
