import React, { useState, useRef, useEffect } from 'react';
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
  TrendingUp,
  FileText,
  Bot,
  User,
  Lightbulb,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Clock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { conductResearchChat } from '../services/geminiService';
import { ResearchSession, ChatMessageItem, SearchResultItem } from '../types';

const STORAGE_KEY = 'social_studio_x_research_sessions_v1';

interface ResearchCenterProps {
  onSendToSocialCampaign?: (topic: string, prompt: string, companyContext: string) => void;
  onSaveToDraftPlanner?: (topic: string, prompt: string) => void;
}

const DEFAULT_WELCOME_TEXT = `### Welcome to the Active AI Research Center! 🔍\n\nI am your **Social Studio X Research & Market Intelligence Specialist**. Unlike standard passive generators, I conduct active real-time market research using Google Search grounding.\n\n**What we can explore together:**\n- 🏗️ **Industry Deep Dives**: Uncover how tech & AI solve domain problems (e.g. Construction, Project Management, Tax Automation).\n- 📈 **Viral Hook & Trend Discovery**: Find trending topics, real statistics, and viral angles for Instagram, LinkedIn, and Twitter.\n- 🎠 **Multi-Slide Carousel Outlines**: Structure 5-10 slide educational storyboards.\n- 🎥 **Video Explainer Scripts**: Write high-converting 3-minute video scripts tailored for mobile reels and shorts.\n\n*Select a starter prompt below or enter a research query to begin!*`;

export const ResearchCenter: React.FC<ResearchCenterProps> = ({
  onSendToSocialCampaign,
  onSaveToDraftPlanner
}) => {
  // Persistence state
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Chat input state
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSelectStarterPrompt = (promptText: string) => {
    setInputMessage(promptText);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  // 1. Load persisted sessions on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ResearchSession[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to load research sessions from localStorage", e);
    }

    // Create default initial session if none exist
    const initialSession: ResearchSession = {
      id: `session-${Date.now()}`,
      title: 'New Market Research',
      companyContext: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'welcome-1',
          role: 'model',
          content: DEFAULT_WELCOME_TEXT,
          timestamp: Date.now()
        }
      ]
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, []);

  // 2. Persist sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch (e) {
        console.error("Failed to save research sessions", e);
      }
    }
  }, [sessions]);

  // Active session object helper
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeSession?.messages?.length > 1) {
      scrollToBottom();
    }
  }, [activeSession?.messages?.length, isLoading]);

  // Handle creating a brand new research thread
  const handleCreateNewSession = () => {
    const newSession: ResearchSession = {
      id: `session-${Date.now()}`,
      title: 'New Market Research',
      companyContext: activeSession?.companyContext || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          role: 'model',
          content: DEFAULT_WELCOME_TEXT,
          timestamp: Date.now()
        }
      ]
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInputMessage('');
  };

  // Handle deleting a session
  const handleDeleteSession = (e: React.MouseEvent, idToDelete: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Just reset the single session
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

    // Calculate updated messages list
    const existingMessages = activeSession.messages || [];
    const newMessages = [...existingMessages, userMsg];

    // Auto-update session title if it's the first real user query
    const isFirstUserQuery = !existingMessages.some(m => m.role === 'user');
    const newTitle = isFirstUserQuery 
      ? (query.length > 32 ? query.substring(0, 32) + '...' : query)
      : activeSession.title;

    // Update session state locally immediately
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

    try {
      // Prepare API message payload
      const apiMessages = newMessages
        .filter(m => !m.id.startsWith('welcome-'))
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await conductResearchChat(
        apiMessages.length > 0 ? apiMessages : [{ role: 'user', content: query }],
        activeSession.companyContext
      );

      const aiMsg: ChatMessageItem = {
        id: `model-${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: Date.now(),
        searchResults: res.searchResults,
        suggestedCampaignTopic: res.suggestedCampaignTopic,
        suggestedPrompt: res.suggestedPrompt
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

  // Helper renderer for clean markdown formatting
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          if (trimmed.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1 font-display flex items-center gap-1.5">
                <span>{trimmed.replace('### ', '')}</span>
              </h3>
            );
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-4 mb-2 font-display">
                {trimmed.replace('## ', '')}
              </h2>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const listContent = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(listContent) }} />
              </div>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            const listContent = trimmed.replace(/^\d+\.\s/, '');
            const num = trimmed.match(/^\d+/)?.[0] || '1';
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs rounded shrink-0">
                  {num}
                </span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineStyles(listContent) }} />
              </div>
            );
          }
          if (trimmed === '---') {
            return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-4" />;
          }
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineStyles(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineStyles = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-mono text-xs rounded">$1</code>');
  };

  const samplePrompts = [
    {
      title: "🏗️ Construction AI Automation",
      prompt: "Research how AI is automating project management, site safety tracking, and materials estimation in construction. Provide 5 viral post angles."
    },
    {
      title: "🎠 7-Slide Instagram Carousel",
      prompt: "Outline a 7-slide educational carousel explaining how small businesses can automate accounting and tax workflows using AI."
    },
    {
      title: "📈 Trending B2B Growth Hooks",
      prompt: "Perform a web search for the top trending B2B marketing viral hooks and audience pain points on LinkedIn this month."
    },
    {
      title: "🎥 3-Min Video Explainer Script",
      prompt: "Write a high-converting 3-minute video explainer script on 'AI Agents vs Traditional Software' tailored for Reels/Shorts."
    }
  ];

  // Determine if active session has any real user messages
  const userMessagesCount = activeSession?.messages?.filter(m => m.role === 'user').length || 0;
  const isSessionEmpty = userMessagesCount === 0;

  return (
    <div className="flex h-[calc(100vh-120px)] min-h-[600px] bg-slate-900 text-slate-100 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl animate-in fade-in duration-300">
      
      {/* SIDEBAR DRAWER: RESEARCH SESSIONS HISTORY */}
      <div 
        className={`${
          isSidebarOpen ? 'w-72' : 'w-0 -ml-72 md:w-16 md:ml-0'
        } transition-all duration-300 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden z-20`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold font-display uppercase tracking-wider text-slate-200">
                Research Threads
              </span>
            </div>
          ) : (
            <Search className="w-5 h-5 text-purple-400 mx-auto" />
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
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
            {isSidebarOpen && <span>New Research Thread</span>}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const msgCount = session.messages.filter(m => m.role === 'user').length;

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
                    ? 'bg-purple-600/20 border border-purple-500/30 text-white font-medium'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
                  {isSidebarOpen && (
                    <div className="min-w-0">
                      <p className="text-xs truncate font-medium">{session.title}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(session.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>• {msgCount} queries</span>
                      </p>
                    </div>
                  )}
                </div>

                {isSidebarOpen && (
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-all rounded"
                    title="Delete research thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer info */}
        {isSidebarOpen && (
          <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Google Search Grounded</span>
          </div>
        )}
      </div>

      {/* MAIN WORKSPACE VIEW */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900 relative">
        
        {/* TOP BAR */}
        <div className="h-14 px-4 md:px-6 border-b border-slate-800 bg-slate-950/60 backdrop-blur-md flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer mr-1"
                title="Open sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white truncate font-display flex items-center gap-2">
                <span>{activeSession?.title || 'Research Center'}</span>
              </h2>
            </div>
          </div>

          {/* Company Context Input inside Topbar */}
          <div className="hidden sm:flex items-center gap-2 max-w-md w-full">
            <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <input
              type="text"
              placeholder="Target Business Context (e.g. Acme Tech - Project Management AI)"
              value={activeSession?.companyContext || ''}
              onChange={(e) => handleUpdateCompanyContext(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Active AI</span>
            </span>
          </div>
        </div>

        {/* CONTENT AREA: EMPTY STATE OR ACTIVE CHAT */}
        {isSessionEmpty ? (
          /* CLEAN EMPTY STATE VIEW */
          <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center max-w-4xl mx-auto w-full text-center space-y-8 animate-in fade-in duration-200">
            
            <div className="space-y-3 max-w-xl">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-500/20">
                <Search className="w-8 h-8" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
                Social Studio X Research Center
              </h1>
              <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                Conduct real-time Google Search grounded research on market trends, audience pain points, viral hooks, and video explainer scripts.
              </p>
            </div>

            {/* Mobile Company Context Field */}
            <div className="sm:hidden w-full text-left space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Target Business Context</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Tech - Construction AI Software"
                value={activeSession?.companyContext || ''}
                onChange={(e) => handleUpdateCompanyContext(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 outline-none"
              />
            </div>

            {/* Starter Prompt Cards */}
            <div className="w-full space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block text-left">
                Select a Starter Research Prompt
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {samplePrompts.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectStarterPrompt(sample.prompt)}
                    disabled={isLoading}
                    className="p-4 bg-slate-950 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-500/50 rounded-2xl transition-all duration-200 group text-left flex flex-col justify-between cursor-pointer disabled:opacity-50"
                  >
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors block font-display">
                        {sample.title}
                      </span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {sample.prompt}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                      <span>Use Prompt</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ACTIVE CHAT TIMELINE VIEW */
          <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
            {activeSession.messages.map((msg) => (
              <div
                key={msg.id}
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
                      : 'bg-slate-950 text-slate-100 border border-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Header Tag */}
                  <div className="flex items-center justify-between gap-4 border-b pb-2 border-white/10">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-purple-200' : 'text-purple-400'}`}>
                      {msg.role === 'user' ? 'You' : 'AI Research Intelligence'}
                    </span>
                    <span className={`text-[10px] ${msg.role === 'user' ? 'text-purple-200' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Formatted Content */}
                  {msg.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    renderFormattedMarkdown(msg.content)
                  )}

                  {/* Grounding Search Results */}
                  {msg.searchResults && msg.searchResults.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <Globe className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Google Search Grounding Sources ({msg.searchResults.length})</span>
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.searchResults.map((sr, idx) => (
                          <a
                            key={idx}
                            href={sr.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-medium text-slate-300 hover:text-purple-400 hover:border-purple-500 transition-colors"
                          >
                            <span className="max-w-[180px] truncate">{sr.title || sr.url}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Cards */}
                  {msg.role === 'model' && (msg.suggestedCampaignTopic || msg.suggestedPrompt) && (
                    <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Lightbulb className="w-4 h-4 text-amber-400" />
                          <span>Researched Strategy Recommendation</span>
                        </span>
                        {copiedId === msg.id && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Copied Strategy
                          </span>
                        )}
                      </div>

                      {msg.suggestedCampaignTopic && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Topic</span>
                          <p className="text-xs font-bold text-white">{msg.suggestedCampaignTopic}</p>
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
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>📝 Save to Drafts</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyText(msg.id, msg.suggestedPrompt || msg.content)}
                          className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 hover:border-purple-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Prompt</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-slate-800 text-slate-200 flex items-center justify-center shrink-0 border border-slate-700">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-purple-400 p-4 bg-purple-500/10 rounded-2xl border border-purple-500/20 max-w-md">
                <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-xs font-bold">Conducting Live Market Research...</span>
                  <p className="text-[11px] text-slate-400">Searching Google Grounding sources & structuring campaign hooks...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* INPUT PROMPT BOX AT BOTTOM */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-md shrink-0">
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
                placeholder="Ask Research Agent: e.g. How can AI automate project management in construction? Give me 7 viral carousel angles..."
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-900 text-white border border-slate-800 rounded-2xl text-xs focus:ring-2 focus:ring-purple-500/40 outline-none transition-all resize-none font-medium placeholder:text-slate-500"
              />
              <span className="absolute right-3 bottom-2.5 text-[10px] text-slate-500 font-medium hidden sm:inline">
                Shift + Enter for line break
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs">Research</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
