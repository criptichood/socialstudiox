import React, { useState, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { conductResearchChat } from '../services/geminiService';
import { loadModelSettings } from '@/services/ai/modelService';
import { gatewayBackendForId, textModelSupportsVision } from '@/types';
import { ResearchSession, ChatMessageItem } from '../types';
import { useBlogEngine } from '@/hooks/useBlogEngine';

import { ResearchSidebar } from './research/ResearchSidebar';
import { ResearchChatArea } from './research/ResearchChatArea';
import { ResearchInputBar } from './research/ResearchInputBar';
import { BlogStudioModal } from './research/BlogStudioModal';

import { 
  Video, 
  Globe 
} from 'lucide-react';

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
  const [loadingStatus, setLoadingStatus] = useState<string>('Thinking…');

  // Campaign to Blog Post Converter popup visibility
  const [isBlogStudioOpen, setIsBlogStudioOpen] = useState<boolean>(false);

  // Inline Message Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState<string>('');

  // AI model settings
  const [selectedModelAlias, setSelectedModelAlias] = useState<string>(() => loadModelSettings().text || 'gemini-3.6-flash');
  const [researchMode, setResearchMode] = useState<'grounded' | 'deep'>('grounded');
  const [groundingEnabled, setGroundingEnabled] = useState<boolean>(true);
  const [nodeDiagramsEnabled, setNodeDiagramsEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('infogenius_node_diagrams_enabled') !== 'false';
    } catch {
      return true;
    }
  });
  const [attachedImages, setAttachedImages] = useState<string[]>([]);

  // Adaptive loading status: derived from real server-side phases emitted via
  // SSE (searching → found → synthesizing → done), so the user always sees what
  // the assistant is actually doing on any backend model.
  useEffect(() => {
    if (!isLoading) setLoadingStatus('Thinking…');
  }, [isLoading]);

  // Sessions state
  const [sessions, setSessions] = useState<ResearchSession[]>([]);

  // Load sessions and endpoints from IndexedDB
  useEffect(() => {
    const loadAllInitialData = async () => {
      try {
        const storedSessions = await DBService.getItem<ResearchSession[]>(STORAGE_KEY, []);
        if (storedSessions && Array.isArray(storedSessions) && storedSessions.length > 0) {
          setSessions(storedSessions);
          setActiveSessionId(storedSessions[0].id);
        } else {
          const initialSession: ResearchSession = {
            id: `session_${Date.now()}`,
            title: 'Multipurpose AI Search & Strategy',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: []
          };
          setSessions([initialSession]);
          setActiveSessionId(initialSession.id);
          await DBService.setItem(STORAGE_KEY, [initialSession]);
        }
      } catch (err) {
        console.error("Failed loading data from DBService:", err);
      }
    };

    loadAllInitialData();
  }, []);

  // Sync sessions to IndexedDB
  useEffect(() => {
    if (sessions.length > 0) {
      DBService.setItem(STORAGE_KEY, sessions);
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Load the session's AI model + mode when switching sessions.
  useEffect(() => {
    if (activeSession?.model) setSelectedModelAlias(activeSession.model);
    if (activeSession?.mode) setResearchMode(activeSession.mode);
  }, [activeSessionId]);

  // Handlers for session management
  const MAX_ATTACH_DIMENSION = 1280;
  const ATTACH_JPEG_QUALITY = 0.85;

  /** Downscale + re-encode an image client-side so uploads stay small and fast. */
  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, MAX_ATTACH_DIMENSION / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', ATTACH_JPEG_QUALITY));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = dataUrl;
    });
  };

  const handleAddImages = (files: FileList) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;
    const readers = fileList.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers)
      .then((urls) => Promise.all(urls.map(compressImage)))
      .then((compressed) => setAttachedImages(prev => [...prev, ...compressed].slice(0, 4)))
      .catch((err) => console.error("Failed to read attachment(s):", err));
  };

  const handleRemoveImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNewSession = async () => {
    setAttachedImages([]);
    const newSession: ResearchSession = {
      id: `session_${Date.now()}`,
      title: 'New Research Topic',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newSession.id);
    await DBService.setItem(STORAGE_KEY, updated);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (sessions.length <= 1) return;
    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
    await DBService.setItem(STORAGE_KEY, filtered);
  };

  const handleClearAllSessions = async () => {
    const fresh: ResearchSession = {
      id: `session_${Date.now()}`,
      title: 'Multipurpose AI Search',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    setSessions([fresh]);
    setActiveSessionId(fresh.id);
    await DBService.setItem(STORAGE_KEY, [fresh]);
  };

  // Chat send message handler
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || inputMessage.trim();
    if (!promptToUse || isLoading || !activeSessionId) return;

    const visionSupported = textModelSupportsVision(selectedModelAlias);
    if (attachedImages.length > 0 && !visionSupported) {
      const warnMsg: ChatMessageItem = {
        id: `msg_warn_${Date.now()}`,
        role: 'model',
        content: `⚠️ **Image input not supported**: The selected model (${selectedModelAlias}) does not accept image uploads. Switch to a vision-capable model (e.g. a Gemini or GPT model) or remove the attached image(s) to continue.`,
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, updatedAt: Date.now(), messages: [...s.messages, warnMsg] };
        }
        return s;
      }));
      return;
    }

    const imageUrlsForSend = [...attachedImages];
    if (!customPrompt) setInputMessage('');
    setAttachedImages([]);
    setIsLoading(true);

    const userMsg: ChatMessageItem = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptToUse,
      timestamp: Date.now(),
      imageUrls: imageUrlsForSend.length > 0 ? imageUrlsForSend : undefined
    };

    const currentSession = sessions.find(s => s.id === activeSessionId) || activeSession;
    const isFirstMsg = currentSession.messages.length === 0;
    const updatedTitle = isFirstMsg ? promptToUse.slice(0, 45) : currentSession.title;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: updatedTitle,
          updatedAt: Date.now(),
          mode: researchMode,
          model: selectedModelAlias,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    try {
      const chatHistory = [
        ...currentSession.messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        { role: 'user' as const, content: promptToUse }
      ];

      const response = await conductResearchChat(
        chatHistory,
        currentSession.companyContext || '',
        researchMode,
        currentSession.competitorWebsite || '',
        selectedModelAlias,
        groundingEnabled,
        gatewayBackendForId('text', selectedModelAlias),
        imageUrlsForSend,
        (phase) => {
          switch (phase.type) {
            case 'searching':
              setLoadingStatus('Searching Google for the latest information…');
              break;
            case 'found':
              setLoadingStatus(
                phase.count > 0
                  ? `Found ${phase.count} live source${phase.count === 1 ? '' : 's'} — reviewing…`
                  : 'No live sources found — reasoning from knowledge…'
              );
              break;
            case 'synthesizing':
              setLoadingStatus('Synthesizing findings into a response…');
              break;
            case 'done':
              setLoadingStatus('Finalizing response…');
              break;
          }
        },
        nodeDiagramsEnabled
      );

      const aiMsg: ChatMessageItem = {
        id: `msg_ai_${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: Date.now(),
        searchResults: response.searchResults,
        suggestedCampaignTopic: response.suggestedCampaignTopic || updatedTitle,
        isDeepResearch: researchMode === 'deep'
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, aiMsg]
          };
        }
        return s;
      }));
    } catch (err: any) {
      console.error("Failed research chat:", err);
      const errorMsg: ChatMessageItem = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        content: `⚠️ **Research Error**: Unable to complete search grounding request. Details: ${err?.message || 'Server error'}`,
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, errorMsg]
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const blogEngine = useBlogEngine({
    getThreadContext: () => buildResearchThreadSummary(),
    sessionId: activeSessionId ?? undefined
  });
  const setBlogViewMode = blogEngine.setBlogViewMode;

  const buildResearchThreadSummary = (): string => {
    if (!activeSession || activeSession.messages.length === 0) return '';
    return activeSession.messages
      .filter((m) =>
        (m.role === 'user' || m.role === 'model') &&
        !m.content.startsWith('### 📝') &&
        !m.content.startsWith('⚠️')
      )
      .slice(-5)
      .map((m) => `${m.role === 'user' ? 'User asked' : 'AI Research Assistant answered'}: ${m.content.replace(/\s+/g, ' ').trim()}`)
      .join('\n\n');
  };

  const handleGenerateBlogPost = async (forcedTopic?: string, forcedContext?: string) => {
    const result = await blogEngine.generateBlogPost(forcedTopic, forcedContext);

    if (result && activeSessionId) {
      const blogMsg: ChatMessageItem = {
        id: `msg_blog_${Date.now()}`,
        role: 'model',
        content: `### 📝 **Generated Blog Post Draft**: ${result.title}\n\n*Character Count: ${result.characterCount.toLocaleString()} | Est. Reading Time: ${result.readingTimeMinutes} mins*\n\n${result.markdownContent}`,
        timestamp: Date.now(),
        suggestedCampaignTopic: result.title
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, blogMsg]
          };
        }
        return s;
      }));

      setIsBlogStudioOpen(true);
      setBlogViewMode('preview');
    }
  };

  const handleSaveMessageEdit = (msgId: string) => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          updatedAt: Date.now(),
          messages: s.messages.map(m => m.id === msgId ? { ...m, content: editingMessageContent } : m)
        };
      }
      return s;
    }));
    setEditingMessageId(null);
    setEditingMessageContent('');
  };

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
    }
  ];

  return (
    <div className="flex h-full w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Component */}
      <ResearchSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        sessions={sessions}
        activeSessionId={activeSessionId}
        setActiveSessionId={setActiveSessionId}
        handleNewSession={handleNewSession}
        handleDeleteSession={handleDeleteSession}
        handleClearAllSessions={handleClearAllSessions}
        activeSession={activeSession}
        savedBlogDrafts={blogEngine.savedBlogDrafts}
        cronSchedules={blogEngine.cronSchedules}
        setIsBlogStudioOpen={setIsBlogStudioOpen}
        setBlogViewMode={setBlogViewMode}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Main Chat & Research Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-950">
        <ResearchChatArea
          activeSession={activeSession}
          isLoading={isLoading}
          loadingStatus={loadingStatus}
          copiedId={copiedId}
          setCopiedId={setCopiedId}
          editingMessageId={editingMessageId}
          setEditingMessageId={setEditingMessageId}
          editingMessageContent={editingMessageContent}
          setEditingMessageContent={setEditingMessageContent}
          handleSaveMessageEdit={handleSaveMessageEdit}
          onSendToSocialCampaign={onSendToSocialCampaign}
          onSendToVideoStudio={onSendToVideoStudio}
          onSaveToDraftPlanner={onSaveToDraftPlanner}
          handleGenerateBlogPost={handleGenerateBlogPost}
          setIsBlogStudioOpen={setIsBlogStudioOpen}
          setBlogViewMode={setBlogViewMode}
          samplePrompts={samplePrompts}
          handleSendMessage={handleSendMessage}
        />

        <ResearchInputBar
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          isLoading={isLoading}
          researchMode={researchMode}
          setResearchMode={setResearchMode}
          selectedModelAlias={selectedModelAlias}
          setSelectedModelAlias={setSelectedModelAlias}
          groundingEnabled={groundingEnabled}
          setGroundingEnabled={setGroundingEnabled}
          nodeDiagramsEnabled={nodeDiagramsEnabled}
          setNodeDiagramsEnabled={setNodeDiagramsEnabled}
          handleSendMessage={handleSendMessage}
          samplePrompts={samplePrompts}
          attachedImages={attachedImages}
          onAddImages={handleAddImages}
          onRemoveImage={handleRemoveImage}
        />
      </div>

      {/* Blog Studio Drawer Modal */}
      <BlogStudioModal
        isOpen={isBlogStudioOpen}
        onClose={() => setIsBlogStudioOpen(false)}
        handleGenerateBlogPost={handleGenerateBlogPost}
        engine={blogEngine}
      />
    </div>
  );
};
