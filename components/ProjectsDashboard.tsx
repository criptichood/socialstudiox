import React, { useState } from 'react';
import { 
  FolderPlus, 
  Folder, 
  Calendar, 
  ArrowRight, 
  Trash2, 
  Layers, 
  Sparkles, 
  Clock,
  LayoutGrid,
  Pencil,
  Play
} from 'lucide-react';
import { Project, GeneratedImage } from '../types';

interface ProjectsDashboardProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, description: string) => void;
  onUpdateProject: (id: string, name: string, description: string) => void;
  onDeleteProject: (id: string) => void;
  onPresentProject: (project: Project) => void;
  images: GeneratedImage[];
  onViewChange: (view: 'dashboard' | 'canvas' | 'drafts' | 'gallery') => void;
}

const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onPresentProject,
  images,
  onViewChange
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Editing Project State
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDesc, setEditProjectDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim(), newProjectDesc.trim());
    setNewProjectName('');
    setNewProjectDesc('');
    setShowCreateModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editProjectName.trim()) return;
    onUpdateProject(editingProject.id, editProjectName.trim(), editProjectDesc.trim());
    setEditingProject(null);
    setEditProjectName('');
    setEditProjectDesc('');
  };

  // Helper stats
  const totalGenerations = images.length;
  const projectStats = projects.map(proj => {
    // In Phase 2, we will filter images belonging to this specific project ID
    // For Phase 1 layout, we can distribute them or show counts
    const projImages = images.filter(img => img.subOptions?.projectId === proj.id);
    return {
      ...proj,
      count: projImages.length
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Visual Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-indigo-500/5 to-transparent"></div>
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative max-w-2xl">
          <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-widest rounded-full">
            Workspace Hub
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mt-4 font-display">
            Your Creative Projects Directory
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-3 leading-relaxed">
            Organize complex designs, customized visuals, and prompt architectures into compartmentalized workspace projects. Start a new topic or revisit your saved directories.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
            <button
              onClick={() => onViewChange('canvas')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
            >
              <span>Launch Canvas</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Quick-Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Active Projects</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{projects.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Rendered Infographics</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalGenerations}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 dark:bg-purple-500/5 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Recent Update</p>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-1.5">
              {totalGenerations > 0 ? 'Generations Active' : 'No entries yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Projects List Deck */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-cyan-500" />
            <span>Active Project Hubs</span>
          </h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {projects.length} Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectStats.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div 
                key={proj.id}
                className={`group border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? 'border-cyan-500/50 dark:border-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/10 shadow-lg' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
                }`}
              >
                {/* Visual Top Glow */}
                {isSelected && (
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center">
                      <Folder className={`w-5 h-5 ${isSelected ? 'text-cyan-500' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Edit project button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(proj);
                          setEditProjectName(proj.name);
                          setEditProjectDesc(proj.description || '');
                        }}
                        className="p-1.5 text-slate-400 hover:text-cyan-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Rename & Edit Project Info"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      {/* Delete project button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm('Are you sure you want to delete this project? Images under this project will lose association.')) {
                            onDeleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-4 line-clamp-1">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 min-h-[32px] leading-relaxed">
                    {proj.description || 'No visual directive defined.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{proj.count} Graphics</span>
                    </div>

                    {proj.count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPresentProject(proj);
                        }}
                        className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 rounded-md transition-colors cursor-pointer"
                        title="Present Workspace Slideshow Deck"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      onSelectProject(proj.id);
                      onViewChange('canvas');
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 ${
                      isSelected 
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/10' 
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{isSelected ? 'Active' : 'Select'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Edit Project Details</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modify the title and descriptive directives of this workspace.</p>
            
            <form onSubmit={handleEditSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Visualizations"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Workspace Directive / Notes</label>
                <textarea
                  placeholder="e.g. Researching Roman Aqueducts and structural mechanics layout."
                  value={editProjectDesc}
                  onChange={(e) => setEditProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Create Project Workspace</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Isolate research topics and styled blueprints.</p>
            
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Visualizations"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Workspace Directive / Notes</label>
                <textarea
                  placeholder="e.g. Researching Roman Aqueducts and structural mechanics layout in realistic 16:9 visual format."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-950 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsDashboard;
