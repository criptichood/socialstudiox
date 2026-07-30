import React from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Building2, 
  MessageSquare, 
  PanelLeftClose, 
  PanelLeft, 
  Zap, 
  BookOpen, 
  Clock, 
  Bot, 
  ArrowLeft 
} from 'lucide-react';
import { ResearchSession, SavedBlogDraft, CronScheduleItem } from '../../types';

interface ResearchSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  sessions: ResearchSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string) => void;
  handleNewSession: () => void;
  handleDeleteSession: (id: string) => void;
  handleClearAllSessions: () => void;
  activeSession: ResearchSession | undefined;
  savedBlogDrafts: SavedBlogDraft[];
  cronSchedules: CronScheduleItem[];
  setIsBlogStudioOpen: (val: boolean) => void;
  setBlogViewMode: (mode: any) => void;
  onBackToDashboard?: () => void;
}

export const ResearchSidebar: React.FC<ResearchSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewSession,
  handleDeleteSession,
  handleClearAllSessions,
  activeSession,
  savedBlogDrafts,
  cronSchedules,
  setIsBlogStudioOpen,
  setBlogViewMode,
  onBackToDashboard,
}) => {
  if (!isSidebarOpen) {
    return (
      <div className="p-3 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-slate-500 hover:text-purple-600 dark:hover:text-purple-300 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleNewSession}
          className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-sm cursor-pointer"
          title="New Research Session"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 flex flex-col h-full shrink-0 animate-in slide-in-from-left-2 duration-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-purple-500/20">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white font-display uppercase tracking-wider">
              Research Center
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              AI Multi-Model Grounded Search
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Action Buttons */}
      <div className="p-3 space-y-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={handleNewSession}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Research Topic</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsBlogStudioOpen(true);
            setBlogViewMode('drafts');
          }}
          className="w-full py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            <span>Blog Drafts & Cron</span>
          </div>
          <span className="px-1.5 py-0.5 bg-purple-600 text-white rounded-md text-[10px] font-mono">
            {savedBlogDrafts.length + cronSchedules.length}
          </span>
        </button>
      </div>

      {/* Active Session Company Context Badge */}
      {activeSession?.companyContext && (
        <div className="px-3 py-2 bg-purple-50 dark:bg-purple-950/40 border-b border-purple-200 dark:border-purple-900/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate">Context: {activeSession.companyContext}</span>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
        <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          <span>Saved Research Threads ({sessions.length})</span>
          {sessions.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllSessions}
              className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Clear All Sessions"
            >
              Clear All
            </button>
          )}
        </div>

        {sessions.map(s => {
          const isActive = s.id === activeSessionId;
          return (
            <div
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`p-3 rounded-2xl transition-all cursor-pointer group flex items-center justify-between gap-2 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border border-purple-500/50 shadow-xs'
                  : 'hover:bg-slate-200/50 dark:hover:bg-slate-900/50 border border-transparent'
              }`}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-purple-500' : 'text-slate-400'}`} />
                  <h4 className={`text-xs font-bold truncate ${isActive ? 'text-slate-900 dark:text-white font-display' : 'text-slate-700 dark:text-slate-300'}`}>
                    {s.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span>{s.messages.length} msgs</span>
                  <span>• {new Date(s.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {sessions.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(s.id);
                  }}
                  className="p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete Session"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
