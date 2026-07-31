import React from 'react';
import { ViewType, Project } from '@/types';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  Images, 
  Search,
  ChevronLeft, 
  ChevronRight,
  Atom,
  Presentation,
  Mic,
  Film,
  Music
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isOpen: boolean;
  onToggle: () => void;
  projects?: Project[];
  selectedProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  isOpen, 
  onToggle,
  projects = [],
  selectedProjectId = null,
  onSelectProject = () => {}
}) => {
  const menuItems = [
    { 
      id: 'dashboard' as const, 
      label: 'Projects Space', 
      description: 'Manage design directories',
      icon: LayoutDashboard 
    },
    { 
      id: 'canvas' as const, 
      label: 'Image Generator', 
      description: 'Generate & edit visual assets',
      icon: Sparkles 
    },
    { 
      id: 'research' as const, 
      label: 'Research', 
      description: 'Research Center',
      icon: Search 
    },
    { 
      id: 'presenter-studio' as const, 
      label: 'Presenter Studio', 
      description: 'Slide deck & Audio presentation',
      icon: Presentation 
    },
    { 
      id: 'voiceover-studio' as const, 
      label: 'Voiceover Studio', 
      description: 'High-fidelity TTS synthesizer',
      icon: Mic 
    },
    { 
      id: 'video-studio' as const, 
      label: 'Video Studio', 
      description: 'Veo 3.1 & Omni motion graphics',
      icon: Film 
    },
    { 
      id: 'sound-studio' as const, 
      label: 'Sound Effects Studio', 
      description: 'Ambient tracks & WAV exporter',
      icon: Music 
    },
    { 
      id: 'drafts' as const, 
      label: 'Draft Planner', 
      description: 'Tweak visual blueprints',
      icon: BookOpen 
    },
    { 
      id: 'gallery' as const, 
      label: 'Gallery Vault', 
      description: 'Your compiled archives',
      icon: Images 
    },
  ];


  return (
    <>
      {/* Mobile Backdrop Overlay when sidebar is open */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-200"
        />
      )}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-40 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col transition-all duration-300 ${
          isOpen 
            ? 'w-64 translate-x-0' 
            : 'w-0 -translate-x-full md:w-20 md:translate-x-0 overflow-hidden'
        }`}
      >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 dark:border-slate-800/80 gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500"></div>
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Atom className="w-5 h-5 text-white animate-pulse" />
        </div>
        
        {isOpen && (
          <div className="flex flex-col animate-in fade-in duration-200">
            <span className="font-bold font-display text-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent tracking-wide leading-none">
              SOCIAL STUDIO X
            </span>
            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 font-semibold tracking-[0.15em] mt-0.5 uppercase">
              Brand & Post Workspace
            </span>
          </div>
        )}

        {/* Floating Collapse toggle button */}
        <button
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hidden md:flex items-center justify-center"
          title={isOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Project Selector inside Sidebar */}
      {isOpen && projects && projects.length > 0 && (
        <div className="px-4 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-800/80 shrink-0 animate-in fade-in duration-200">
          <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mb-1.5">
            Active Workspace
          </label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => onSelectProject(e.target.value || null)}
            className="w-full text-xs font-semibold px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-1 focus:ring-cyan-500 text-slate-850 dark:text-slate-200 cursor-pointer"
          >
            <option value="">Standalone Space</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full group flex items-center gap-3.5 p-3 rounded-xl transition-all relative ${
                isActive 
                  ? 'bg-cyan-50 dark:bg-slate-800/90 dark:bg-gradient-to-r dark:from-cyan-950/70 dark:to-indigo-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30 shadow-xs' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-transparent'
              }`}
            >
              {/* Highlight active left-accent */}
              {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-cyan-500 dark:bg-cyan-400 rounded-r-full"></div>
              )}

              <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive 
                  ? 'bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' 
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 group-hover:bg-slate-200 dark:group-hover:bg-slate-800'
              }`}>
                <Icon className="w-5 h-5" />
              </div>

              {isOpen && (
                <div className="flex flex-col items-start text-left animate-in fade-in duration-200">
                  <span className={`text-xs font-bold tracking-wide transition-colors ${
                    isActive 
                      ? 'text-cyan-900 dark:text-cyan-200' 
                      : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  <span className={`text-[10px] mt-0.5 line-clamp-1 font-medium leading-none ${
                    isActive 
                      ? 'text-cyan-700/80 dark:text-cyan-400/80' 
                      : 'text-slate-500 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400'
                  }`}>
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50">
        <div className="flex flex-col gap-2">
          <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'} gap-2`}>
            {isOpen ? (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700/50">
                  AI
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">AI Studio User</span>
                  <span className="text-[9px] text-slate-500 dark:text-slate-500 mt-1 leading-none">Creator Access</span>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-slate-700/50">
                AI
              </div>
            )}
          </div>
          {isOpen && (
            <div className="text-center pt-2 border-t border-slate-200 dark:border-slate-800/40 animate-in fade-in duration-300">
              <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1 font-medium">
                Build with ❤️ <span className="text-cyan-600 dark:text-cyan-400 font-semibold font-mono hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors">@criptichood</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
