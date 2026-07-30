import React, { useState, useRef, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { 
  Search, 
  Sparkles, 
  Send, 
  Loader2, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Building2, 
  ArrowRight,
  ArrowLeft,
  FileText,
  Bot,
  User,
  Lightbulb,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Zap,
  Sun,
  Moon,
  Key,
  Video,
  Film,
  Compass,
  Layers,
  Flame
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { conductResearchChat } from '../services/geminiService';
import { ResearchSession, ChatMessageItem } from '../types';

const STORAGE_KEY = 'social_studio_x_research_sessions_v3';

interface ResearchCenterProps {
  onSendToSocialCampaign?: (topic: string, prompt: string, companyContext: string) => void;
  onSendToVideoStudio?: (videoPrompt: string, scriptText?: string) => void;
  onSaveToDraftPlanner?: (topic: string, prompt: string) => void;
  onBackToDashboard?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onSelectKey?: () => void;
}

export const ResearchCenter: React.FC<ResearchCenterProps> = ({
  onSendToSocialCampaign,
  onSendToVideoStudio,
  onSaveToDraftPlanner,
  onBackToDashboard,
  isDarkMode = true,
  onToggleDarkMode,
  onSelectKey
}) => {

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Chat input state
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const latestAiMsgRef = useRef<HTMLDivElement>(null);

  const handleSelectStarterPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // Persistence state
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [isSessionsLoaded, setIsSessionsLoaded] = useState<boolean>(false);

  // 1. Load persisted sessions from IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadSessionsFromIndexedDB = async () => {
      try {
        const saved = await DBService.getItem<ResearchSession[]>(STORAGE_KEY, []);
        if (isMounted) {
          if (Array.isArray(saved) && saved.length > 0) {
            const cleaned = saved.map(s => ({
              ...s,
              messages: (s.messages || []).filter(m => !m.id.startsWith('welcome-'))
            }));
            setSessions(cleaned);
            setActiveSessionId(cleaned[0].id);
            setIsSessionsLoaded(true);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to load research sessions from IndexedDB:", e);
      }

      if (isMounted) {
        const initialSession: ResearchSession = {
          id: `session-${Date.now()}`,
          title: 'Multipurpose Intelligence Research',
          companyContext: '',
          competitorWebsite: '',
          mode: 'grounded',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: []
        };
        setSessions([initialSession]);
        setActiveSessionId(initialSession.id);
        setIsSessionsLoaded(true);
      }
    };
    loadSessionsFromIndexedDB();
    return () => { isMounted = false; };
  }, []);

  // 2. Persist sessions whenever they change to IndexedDB
  useEffect(() => {
    if (isSessionsLoaded && sessions.length > 0) {
      DBService.setItem(STORAGE_KEY, sessions).catch(e => {
        console.error("Failed to save research sessions to IndexedDB:", e);
      });
    }
  }, [sessions, isSessionsLoaded]);

  // Active session object helper
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Handle creating a brand new research thread (empty state by default)
  const handleCreateNewSession = () => {
    const existingEmptySession = sessions.find(s => s.messages.length === 0);
    if (existingEmptySession) {
      setActiveSessionId(existingEmptySession.id);
      setInputMessage('');
      return;
    }

    const newSession: ResearchSession = {
      id: `session-${Date.now()}`,
      title: 'New Intelligence Research',
      companyContext: activeSession?.companyContext || '',
      competitorWebsite: activeSession?.competitorWebsite || '',
      mode: activeSession?.mode || 'grounded',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
  };

  // Handle deleting a session
  const handleDeleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewSession();
      setSessions(prev => prev.filter(s => s.id !== idToDelete));
      return;
    }

    const updated = sessions.filter(s => s.id !== idToDelete);
    setSessions(updated);
    if (activeSessionId === idToDelete) {
      setActiveSessionId(updated[0].id);
    }
  };

  // Handle updating company context
  const handleUpdateCompanyContext = (contextStr: string) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, companyContext: contextStr, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  // Handle updating competitor website
  const handleUpdateCompetitorWebsite = (competitorStr: string) => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, competitorWebsite: competitorStr, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  // Handle toggling research mode
  const handleToggleMode = (newMode: 'grounded' | 'deep') => {
    if (!activeSession) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return { ...s, mode: newMode, updatedAt: Date.now() };
      }
      return s;
    }));
  };

  // Handle sending a message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading || !activeSession) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now()
    };

    const existingMessages = activeSession.messages || [];
    const newMessages = [...existingMessages, userMsg];

    const isFirstUserQuery = existingMessages.length === 0;
    const newTitle = isFirstUserQuery 
      ? (query.length > 32 ? query.substring(0, 32) + '...' : query)
      : activeSession.title;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSession.id) {
        return {
          ...s,
          title: newTitle,
          messages: newMessages,
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    // Smoothly scroll to top of user message so user context remains clear
    setTimeout(() => {
      lastUserMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    try {
      const apiMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const currentMode = activeSession.mode || 'grounded';

      const res = await conductResearchChat(
        apiMessages,
        activeSession.companyContext,
        currentMode,
        activeSession.competitorWebsite
      );

      const aiMsg: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: Date.now(),
        searchResults: res.searchResults,
        suggestedCampaignTopic: res.suggestedCampaignTopic,
        suggestedPrompt: res.suggestedPrompt,
        suggestedVideoPrompt: res.suggestedVideoPrompt,
        suggestedVideoScript: res.suggestedVideoScript,
        isDeepResearch: currentMode === 'deep'
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          return {
            ...s,
            messages: [...s.messages, aiMsg],
            updatedAt: Date.now()
          };
        }
        return s;
      }));

      // Scroll smoothly to start of newly arrived AI response so user can read from top
      setTimeout(() => {
        latestAiMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (err: any) {
      console.error("Research chat error:", err);
      let errorText = err?.message || 'Unable to connect to Google Search Grounding API. Please check your API key.';
      
      if (errorText.includes('RESOURCE_EXHAUSTED') || errorText.includes('429') || errorText.includes('spending cap')) {
        errorText = `⚠️ **Gemini API Quota / Spending Cap Exceeded**\n\nThe project spending cap for the Gemini API has been reached.\n\n**How to fix:**\n- Manage or increase your project spend cap at [Google AI Studio](https://ai.studio/spend)\n- Or update your API key in project environment configuration.`;
      } else {
        errorText = `⚠️ **Research Error**: ${errorText}`;
      }

      const errorMsg: ChatMessageItem = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: errorText,
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSession.id) {
          return { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Complete, robust Markdown renderer using react-markdown + remark-gfm
  const renderMarkdownContent = (content: string) => {
    return (
      <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2 font-display">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2 font-display">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3 mb-1.5 font-display flex items-center gap-2">{children}</h3>,
            h4: ({ children }) => <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1 font-display">{children}</h4>,
            p: ({ children }) => <p className="mb-2 leading-relaxed text-slate-800 dark:text-slate-200">{children}</p>,
            strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20">{children}</strong>,
            em: ({ children }) => <em className="italic text-purple-600 dark:text-purple-300">{children}</em>,
            ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2 text-slate-800 dark:text-slate-200">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-800 dark:text-slate-200">{children}</ol>,
            li: ({ children }) => <li className="pl-1 leading-relaxed">{children}</li>,
            hr: () => <hr className="border-slate-200 dark:border-slate-800 my-4" />,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-purple-500 pl-4 py-2 italic text-slate-700 dark:text-slate-300 my-3 bg-purple-500/5 rounded-r-xl">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 shadow-xs">
                <table className="w-full text-left text-xs border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-purple-100 dark:bg-purple-950/60 border-b border-slate-200 dark:border-slate-800 text-purple-800 dark:text-purple-300 uppercase tracking-wider text-[10px] font-bold">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="p-3 font-bold text-slate-800 dark:text-slate-200">{children}</th>,
            td: ({ children }) => <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{children}</td>,
            code: ({ inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code className="px-1.5 py-0.5 bg-purple-500/15 text-purple-700 dark:text-purple-300 font-mono text-xs rounded border border-purple-500/20" {...props}>
                    {children}
                  </code>
                );
              }
              return (
                <pre className="p-3 my-3 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 text-purple-300 font-mono text-xs rounded-xl overflow-x-auto">
                  <code>{children}</code>
                </pre>
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
              >
                {children}
                <ExternalLink className="w-3 h-3 inline shrink-0" />
              </a>
            )
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Diverse Multipurpose Sample Prompts
  const samplePrompts = [
    {
      icon: Video,
      badge: "Reels & Shorts Script",
      title: "🎥 60-Sec Viral Video Script",
      prompt: "Research current trending video reel formats in our industry. Write a 60-second video script with visual scene directions, voiceover script, and high-converting hooks."
    },
    {
      icon: Globe,
      badge: "Competitor Audit",
      title: "🌐 Competitor Website & Social Audit",
      prompt: "Perform a web research audit on top competitors in our niche. Analyze their social media posting schedule, viral content hooks, and how they convert visitors into customers."
    },
    {
      icon: Flame,
      badge: "Viral Hooks",
      title: "📈 B2B/B2C Trend & Hook Discovery",
      prompt: "Search Google for the top trending viral hooks, real industry statistics, and audience pain points on LinkedIn and Instagram this month."
    },
    {
      icon: Layers,
      badge: "Story Carousel",
      title: "🎠 7-Slide Educational Carousel",
      prompt: "Outline a 7-slide educational story deck explaining how our platform/solution solves core user pain points. Include visual descriptions for each slide."
    },
    {
      icon: Compass,
      badge: "Paid Ad Strategy",
      title: "💰 High-Converting Video Ad Strategy",
      prompt: "Research best-performing paid video ad angles, target demographic breakdown, and campaign placement strategy for Instagram Reels & YouTube Shorts."
    }
  ];

  // Quick reply options for proactive continuation
  const quickPillSuggestions = [
    "🎥 Give me 3 Reel hooks for this idea",
    "🌐 Compare top 3 competitor websites in this niche",
    "📊 Outline a 7-slide Instagram Carousel",
    "💰 Suggest paid video ad ROI strategy"
  ];

  const messagesList = activeSession?.messages || [];
  const isSessionEmpty = messagesList.length === 0;
  const currentMode = activeSession?.mode || 'grounded';

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* FULL PAGE TOP NAVIGATION TOOLBAR */}
      <div className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between gap-4 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-600/30 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-purple-700 dark:hover:text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Back to Projects Space</span>
            </button>
          )}

          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block shrink-0" />

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            title={isSidebarOpen ? "Collapse research threads" : "Expand research threads"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-purple-500/20">
              <Search className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white font-display truncate leading-none">
                {activeSession?.title || 'Multipurpose Research & Intelligence'}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate hidden md:block">
                Video Scripts • Competitor Audits • Grounded Market Research
              </p>
            </div>
          </div>
        </div>

        {/* Mode Switcher & Right Tools */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Dual Mode Switcher Pill */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => handleToggleMode('grounded')}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMode === 'grounded'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Fast interactive research with live Google Search grounding"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>⚡ Fast Grounded</span>
            </button>
            <button
              onClick={() => handleToggleMode('deep')}
              className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                currentMode === 'deep'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Exhaustive multi-tier competitive analysis and video script breakdown"
            >
              <Sparkles className="w-3 h-3 text-cyan-300 animate-pulse" />
              <span>🔬 Deep Research</span>
            </button>
          </div>

          {onSelectKey && (
            <button
              onClick={onSelectKey}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer"
              title="API Key"
            >
              <Key className="w-4 h-4" />
            </button>
          )}

          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700/80 cursor-pointer"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* BODY CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
      
        {/* SIDEBAR DRAWER: RESEARCH SESSIONS HISTORY */}
        <div 
          className={`${
            isSidebarOpen ? 'w-72' : 'w-0 -ml-72 md:w-16 md:ml-0'
          } transition-all duration-300 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 flex flex-col shrink-0 overflow-hidden z-20`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            {isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Research Threads
                </span>
              </div>
            ) : (
              <Search className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto" />
            )}
          </div>

          {/* New Session Button */}
          <div className="p-3">
            <button
              onClick={handleCreateNewSession}
              className={`w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer ${
                !isSidebarOpen && 'md:px-0'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {isSidebarOpen && <span>New Intelligence Thread</span>}
            </button>
          </div>

          {/* Session List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const msgCount = (session.messages || []).filter(m => m.role === 'user').length;

              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSessionId(session.id);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all duration-150 group flex items-center justify-between gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-purple-100 dark:bg-purple-600/20 border border-purple-300 dark:border-purple-500/30 text-purple-900 dark:text-white font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500'}`} />
                    {isSidebarOpen && (
                      <div className="min-w-0">
                        <p className="text-xs truncate font-medium">{session.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          <span>• {msgCount} queries</span>
                          {session.mode === 'deep' && (
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1 rounded">Deep</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {isSidebarOpen && (
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 dark:hover:text-rose-400 transition-all rounded"
                      title="Delete research thread"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer */}
          {isSidebarOpen && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span className="truncate">Google Search Grounded Intelligence</span>
            </div>
          )}
        </div>

        {/* MAIN WORKSPACE VIEW */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900 relative">
          
          {/* TOP BAR INPUT CONTEXT STRIP */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/60 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer mr-1"
                  title="Open sidebar"
                >
                  <PanelLeft className="w-4 h-4" />
                </button>
              )}

              <div className="min-w-0 shrink-0">
                <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate font-display flex items-center gap-1.5">
                  <span>{activeSession?.title || 'Research Center'}</span>
                </h2>
              </div>
            </div>

            {/* Context Inputs (Business + Competitor Website) */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Target Business / Idea (e.g. Acme Fitness App)"
                  value={activeSession?.companyContext || ''}
                  onChange={(e) => handleUpdateCompanyContext(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Competitor Website (e.g. competitor.com)"
                  value={activeSession?.competitorWebsite || ''}
                  onChange={(e) => handleUpdateCompetitorWebsite(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
                />
              </div>
            </div>

            {/* Mode Tag */}
            <div className="hidden lg:flex items-center gap-1.5 shrink-0">
              <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                <span>{currentMode === 'deep' ? '🔬 Deep Mode' : '⚡ Grounded'}</span>
              </span>
            </div>
          </div>

          {/* CONTENT AREA: EMPTY STATE OR ACTIVE CHAT */}
          {isSessionEmpty ? (
            /* CLEAN EMPTY STATE VIEW */
            <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center max-w-4xl mx-auto w-full text-center space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-3 max-w-xl">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
                  <Search className="w-8 h-8" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                  Multipurpose AI Research Center
                </h1>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Real-time Google Search grounded research on market trends, video explainer scripts, competitor website audits, and viral hooks.
                </p>
              </div>

              {/* Starter Prompt Cards */}
              <div className="w-full space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Select a Starter Research Prompt</span>
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Click any prompt to launch research
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {samplePrompts.map((sample, idx) => {
                    const IconComp = sample.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(sample.prompt)}
                        disabled={isLoading}
                        className="p-4 bg-white dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-purple-950/30 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-500/50 rounded-2xl transition-all duration-200 group text-left flex flex-col justify-between cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors font-display flex items-center gap-1.5">
                              <IconComp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span>{sample.title}</span>
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-500/20">
                              {sample.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {sample.prompt}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                          <span>Launch Research</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            /* ACTIVE CHAT TIMELINE VIEW */
            <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
              {messagesList.map((msg, index) => {
                const isLastUser = msg.role === 'user' && index === messagesList.findIndex((m, i) => m.role === 'user' && i >= index);
                const isLatestAi = msg.role === 'model' && index === messagesList.length - 1;

                return (
                  <div
                    key={msg.id}
                    ref={isLastUser ? lastUserMsgRef : isLatestAi ? latestAiMsgRef : undefined}
                    className={`flex items-start gap-3 md:gap-4 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'model' && (
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                        <Bot className="w-5 h-5" />
                      </div>
                    )}

                    <div
                      className={`max-w-3xl rounded-3xl p-5 shadow-sm space-y-3 ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-xs'
                      }`}
                    >
                      {/* Header Tag */}
                      <div className="flex items-center justify-between gap-4 border-b pb-2 border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-purple-200' : 'text-purple-600 dark:text-purple-400'}`}>
                            {msg.role === 'user' ? 'You' : 'AI Multipurpose Intelligence'}
                          </span>
                          {msg.isDeepResearch && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-cyan-300 text-[9px] font-bold rounded border border-indigo-200 dark:border-indigo-500/30">
                              🔬 Deep Report
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Content with full Markdown GFM rendering */}
                      {msg.role === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                      ) : (
                        renderMarkdownContent(msg.content)
                      )}

                      {/* Grounding Search Results */}
                      {msg.searchResults && msg.searchResults.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Globe className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Google Search Grounding Sources ({msg.searchResults.length})</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.searchResults.map((sr, idx) => (
                              <a
                                key={idx}
                                href={sr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-500 transition-colors"
                              >
                                <span className="max-w-[180px] truncate">{sr.title || sr.url}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Card: Social / Carousel Strategy */}
                      {msg.role === 'model' && (msg.suggestedCampaignTopic || msg.suggestedPrompt) && (
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                              <span>Researched Social Strategy Recommendation</span>
                            </span>
                          </div>

                          {msg.suggestedCampaignTopic && (
                            <div>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Topic</span>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{msg.suggestedCampaignTopic}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {onSendToSocialCampaign && (
                              <button
                                onClick={() => {
                                  onSendToSocialCampaign(
                                    msg.suggestedCampaignTopic || 'Researched Campaign',
                                    msg.suggestedPrompt || msg.content,
                                    activeSession.companyContext || ''
                                  );
                                }}
                                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                                <span>🚀 Create Social Campaign</span>
                              </button>
                            )}

                            {onSaveToDraftPlanner && (
                              <button
                                onClick={() => {
                                  onSaveToDraftPlanner(
                                    msg.suggestedCampaignTopic || 'Researched Strategy',
                                    msg.suggestedPrompt || msg.content
                                  );
                                }}
                                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>📝 Save to Drafts</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyText(msg.id, msg.suggestedPrompt || msg.content)}
                              className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                copiedId === msg.id
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                              }`}
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied Strategy!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Card: Video Script & Scene Setup */}
                      {msg.role === 'model' && (msg.suggestedVideoPrompt || msg.suggestedVideoScript) && (
                        <div className="mt-3 p-4 bg-cyan-50 dark:bg-indigo-500/10 border border-cyan-200 dark:border-indigo-500/30 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                              <span>Recommended Video & Reel Blueprint</span>
                            </span>
                          </div>

                          {msg.suggestedVideoPrompt && (
                            <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Video Scene Prompt (VEO Ready)</span>
                              <p className="text-xs text-slate-900 dark:text-white font-mono">{msg.suggestedVideoPrompt}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {onSendToVideoStudio && (
                              <button
                                onClick={() => {
                                  onSendToVideoStudio(
                                    msg.suggestedVideoPrompt || msg.suggestedCampaignTopic || 'AI Video Scene',
                                    msg.suggestedVideoScript
                                  );
                                }}
                                className="px-3.5 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                              >
                                <Film className="w-3.5 h-3.5" />
                                <span>🎥 Send to Video Studio (VEO)</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleCopyText(`vid-${msg.id}`, msg.suggestedVideoScript || msg.suggestedVideoPrompt || '')}
                              className={`px-3 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                copiedId === `vid-${msg.id}`
                                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-cyan-400'
                              }`}
                            >
                              {copiedId === `vid-${msg.id}` ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied Script!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Video Script</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                    </div>

                    {msg.role === 'user' && (
                      <div className="w-9 h-9 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Quick Reply Continuation Pills */}
              {!isLoading && messagesList.length > 0 && (
                <div className="py-2 flex flex-wrap gap-2 animate-in fade-in duration-300">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 w-full mb-1">
                    <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                    <span>Quick Follow-up Angles</span>
                  </span>
                  {quickPillSuggestions.map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(pill)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-950 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-500/40 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-white transition-all cursor-pointer font-medium shadow-2xs"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (() => {
                const lastMsg = messagesList.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || '';
                const isCasual = lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('hey') || lastMsg.length < 15;
                return (
                  <div className="flex items-center gap-3 text-purple-700 dark:text-purple-400 p-4 bg-purple-50 dark:bg-purple-500/10 rounded-2xl border border-purple-200 dark:border-purple-500/20 max-w-md animate-in fade-in duration-200">
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold">
                        {currentMode === 'deep' ? '🔬 Conducting Deep Market & Competitor Audit...' : (isCasual ? 'AI Agent Synthesizing...' : 'Conducting Live Grounded Research...')}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        {currentMode === 'deep' ? 'Scanning competitor websites, viral video hooks, and demographic traffic funnels...' : 'Searching Google Grounding sources & structuring video/content hooks...'}
                      </p>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* INPUT PROMPT BOX AT BOTTOM */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-3 max-w-5xl mx-auto"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={
                    currentMode === 'deep'
                      ? "Enter topic or competitor for Deep Market & Video Research Report..."
                      : "Ask research agent for video scripts, competitor audits, or viral hooks..."
                  }
                  rows={2}
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500/40 outline-none transition-all resize-none font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <span className="absolute right-3 bottom-2.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium hidden sm:inline">
                  Shift + Enter for line break
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="p-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
