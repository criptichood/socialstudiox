import React from 'react';
import { 
  Bot, 
  User, 
  Search, 
  Copy, 
  Check, 
  Edit3, 
  Globe, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Video, 
  Share2, 
  BookOpen, 
  Compass, 
  Loader2 
} from 'lucide-react';
import { ChatMessageItem, ResearchSession } from '../../types';
import { BlogMarkdownRenderer } from './blog/BlogMarkdownRenderer';

interface ResearchChatAreaProps {
  activeSession: ResearchSession | undefined;
  isLoading: boolean;
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
  editingMessageId: string | null;
  setEditingMessageId: (id: string | null) => void;
  editingMessageContent: string;
  setEditingMessageContent: (val: string) => void;
  handleSaveMessageEdit: (msgId: string) => void;
  onSendToSocialCampaign?: (topic: string, prompt: string, companyContext: string) => void;
  onSendToVideoStudio?: (videoPrompt: string, scriptText?: string) => void;
  onSaveToDraftPlanner?: (topic: string, prompt: string) => void;
  handleGenerateBlogPost: (forcedTopic?: string) => Promise<void>;
  setIsBlogStudioOpen: (val: boolean) => void;
  setBlogViewMode: (mode: any) => void;
  samplePrompts: { icon: any; badge: string; title: string; prompt: string }[];
  handleSendMessage: (prompt?: string) => void;
}

export const ResearchChatArea: React.FC<ResearchChatAreaProps> = ({
  activeSession,
  isLoading,
  copiedId,
  setCopiedId,
  editingMessageId,
  setEditingMessageId,
  editingMessageContent,
  setEditingMessageContent,
  handleSaveMessageEdit,
  onSendToSocialCampaign,
  onSendToVideoStudio,
  onSaveToDraftPlanner,
  handleGenerateBlogPost,
  setIsBlogStudioOpen,
  setBlogViewMode,
  samplePrompts,
  handleSendMessage,
}) => {
  const isSessionEmpty = !activeSession || activeSession.messages.length === 0;

  if (isSessionEmpty) {
    return (
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
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
      {activeSession.messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isEditingThis = editingMessageId === msg.id;

        return (
          <div
            key={msg.id}
            className={`flex items-start gap-3 max-w-4xl mx-auto ${isUser ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
              isUser
                ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
            }`}>
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Container */}
            <div className={`flex-1 space-y-2 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
              <div className={`p-4 md:p-5 rounded-2xl border space-y-3 shadow-xs ${
                isUser
                  ? 'bg-purple-600 text-white border-purple-500 ml-auto max-w-2xl'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
              }`}>
                {/* Content rendering or inline editing */}
                {isEditingThis ? (
                  <div className="space-y-2 text-left">
                    <textarea
                      value={editingMessageContent}
                      onChange={(e) => setEditingMessageContent(e.target.value)}
                      className="w-full p-3 bg-slate-900 text-purple-200 rounded-xl text-xs font-mono outline-none border border-purple-500/50"
                      rows={4}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveMessageEdit(msg.id)}
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold"
                      >
                        Save Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMessageId(null);
                          setEditingMessageContent('');
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {isUser ? (
                      <p className="text-xs sm:text-sm font-medium whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <BlogMarkdownRenderer content={msg.content} />
                    )}
                  </div>
                )}

                {/* Grounding Sources Box */}
                {!isUser && ((msg.searchResults && msg.searchResults.length > 0) || (msg.groundingSources && msg.groundingSources.length > 0)) && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-900 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google Search Grounded Web Sources ({((msg.searchResults || msg.groundingSources) || []).length})</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
                      {((msg.searchResults || msg.groundingSources) || []).map((src: any, sIdx: number) => (
                        <a
                          key={sIdx}
                          href={src.url || src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/50 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] font-medium shrink-0 flex items-center gap-1.5 transition-colors"
                        >
                          <span className="truncate max-w-[140px]">{src.title || src.url || src.uri}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar Bar under AI Responses */}
              {!isUser && !isEditingThis && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditingMessageContent(msg.content);
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Text</span>
                  </button>

                  {onSendToSocialCampaign && (
                    <button
                      type="button"
                      onClick={() => onSendToSocialCampaign(msg.suggestedCampaignTopic || activeSession.title, msg.content, activeSession.companyContext || '')}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Send to Social Campaign</span>
                    </button>
                  )}

                  {onSendToVideoStudio && (
                    <button
                      type="button"
                      onClick={() => onSendToVideoStudio(msg.suggestedCampaignTopic || activeSession.title, msg.content)}
                      className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Video className="w-3 h-3" />
                      <span>Send to Video Studio</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsBlogStudioOpen(true);
                      setBlogViewMode('preview');
                      handleGenerateBlogPost(msg.suggestedCampaignTopic || activeSession.title);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <BookOpen className="w-3 h-3 text-amber-300" />
                    <span>Create Blog Post</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isLoading && (
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm animate-pulse">
            <Bot className="w-4 h-4" />
          </div>
          <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Searching Google & synthesizing multi-source analysis...</span>
          </div>
        </div>
      )}
    </div>
  );
};
