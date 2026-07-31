import React, { useState, useEffect } from 'react';
import { DBService } from '../services/dbService';
import { conductResearchChat, generateBlogPostFromCampaign, generateInfographicImage, BlogPostResult, SectionImagePrompt } from '../services/geminiService';
import { ResearchSession, ChatMessageItem, SavedCampaign, PublishEndpointConfig, SavedBlogDraft, CronScheduleItem } from '../types';

import { ResearchSidebar } from './research/ResearchSidebar';
import { ResearchChatArea } from './research/ResearchChatArea';
import { ResearchInputBar } from './research/ResearchInputBar';
import { BlogStudioModal } from './research/BlogStudioModal';

import { 
  Video, 
  Globe 
} from 'lucide-react';

const STORAGE_KEY = 'social_studio_x_research_sessions_v3';
const WEBHOOK_SETTINGS_KEY = 'blog_publish_webhook_settings';
const DRAFTS_STORAGE_KEY = 'infogenius_saved_blog_drafts';
const ENDPOINTS_STORAGE_KEY = 'infogenius_publish_endpoints';
const CRON_STORAGE_KEY = 'infogenius_cron_schedules';

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

  // Campaign to Blog Post Converter & Webhook Publishing State
  const [isBlogStudioOpen, setIsBlogStudioOpen] = useState<boolean>(false);
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [blogTopicOverride, setBlogTopicOverride] = useState<string>('');
  const [blogTone, setBlogTone] = useState<string>('Informative, Authoritative & Actionable Guide');
  const [isGeneratingBlog, setIsGeneratingBlog] = useState<boolean>(false);
  const [blogResult, setBlogResult] = useState<BlogPostResult | null>(null);
  const [blogViewMode, setBlogViewMode] = useState<'preview' | 'markdown' | 'drafts' | 'schedules' | 'webhook-settings'>('preview');
  const [isBlogCopied, setIsBlogCopied] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState<boolean>(false);
  const [isDownloadingMd, setIsDownloadingMd] = useState<boolean>(false);

  // Inline Message Edit State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageContent, setEditingMessageContent] = useState<string>('');

  // Saved Blog Drafts & Schedules State
  const [savedBlogDrafts, setSavedBlogDrafts] = useState<SavedBlogDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Cron Job & Timed Schedules State
  const [cronSchedules, setCronSchedules] = useState<CronScheduleItem[]>([]);
  const [newCronTitle, setNewCronTitle] = useState<string>('');
  const [newCronExpression, setNewCronExpression] = useState<string>('0 9 * * 1');
  const [selectedDraftForScheduleId, setSelectedDraftForScheduleId] = useState<string>('');

  const getDefaultTomorrowDateTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };
  const [scheduleDateTime, setScheduleDateTime] = useState<string>(getDefaultTomorrowDateTime());
  const [scheduleSuccessFeedback, setScheduleSuccessFeedback] = useState<string | null>(null);

  // Multi-Endpoint Webhook Settings State
  const [publishEndpoints, setPublishEndpoints] = useState<PublishEndpointConfig[]>([
    {
      id: 'growency_main',
      name: 'Growency.ai Production Blog',
      endpointUrl: 'https://growency.ai/api/blog/publish',
      secretKey: '',
      headerName: 'Authorization',
      enabled: true,
      isDefault: true
    }
  ]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('growency_main');
  const [editingEndpoint, setEditingEndpoint] = useState<PublishEndpointConfig | null>(null);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState<boolean>(false);

  // Section Image Prompt & Live Content Edit State
  const [generatingPromptId, setGeneratingPromptId] = useState<string | null>(null);
  const [customSectionPromptInput, setCustomSectionPromptInput] = useState<string>('');

  // Webhook publishing process state
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishResponse, setPublishResponse] = useState<{ success: boolean; message: string; status?: number } | null>(null);

  // AI model settings
  const [selectedModelAlias, setSelectedModelAlias] = useState<string>('gemini-2.5-flash');
  const [useGoogleSearchGrounding, setUseGoogleSearchGrounding] = useState<boolean>(true);

  // Inline Title Edit State
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [customTitleInput, setCustomTitleInput] = useState<string>('');

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

        const storedDrafts = await DBService.getItem<SavedBlogDraft[]>(DRAFTS_STORAGE_KEY, []);
        if (storedDrafts && Array.isArray(storedDrafts)) {
          setSavedBlogDrafts(storedDrafts);
        }

        const storedEndpoints = await DBService.getItem<PublishEndpointConfig[]>(ENDPOINTS_STORAGE_KEY, []);
        if (storedEndpoints && Array.isArray(storedEndpoints) && storedEndpoints.length > 0) {
          setPublishEndpoints(storedEndpoints);
          const defaultEp = storedEndpoints.find(e => e.isDefault) || storedEndpoints[0];
          setSelectedEndpointId(defaultEp.id);
        }

        const storedSchedules = await DBService.getItem<CronScheduleItem[]>(CRON_STORAGE_KEY, []);
        if (storedSchedules && Array.isArray(storedSchedules)) {
          setCronSchedules(storedSchedules);
        }

        const camps = await DBService.getItem<SavedCampaign[]>('social_studio_x_campaigns_v2', []);
        if (camps && Array.isArray(camps)) {
          setSavedCampaigns(camps);
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

  // Handlers for session management
  const handleNewSession = async () => {
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

    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    const userMsg: ChatMessageItem = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: promptToUse,
      timestamp: Date.now()
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
        'grounded',
        currentSession.competitorWebsite || ''
      );

      const aiMsg: ChatMessageItem = {
        id: `msg_ai_${Date.now()}`,
        role: 'model',
        content: response.reply,
        timestamp: Date.now(),
        searchResults: response.searchResults,
        suggestedCampaignTopic: response.suggestedCampaignTopic || updatedTitle
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

  // Helper to save blog draft to IndexedDB
  const handleSaveBlogDraft = async (draftData: any, status: 'draft' | 'scheduled' | 'published' = 'draft', scheduledAt?: string, publishedToEndpointId?: string) => {
    const existingIndex = savedBlogDrafts.findIndex(d => d.id === draftData.id || d.title === draftData.title);
    const nowISO = new Date().toISOString();
    let updatedDrafts: SavedBlogDraft[];

    const wordCount = (draftData.markdownContent || '').split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const draftObj: SavedBlogDraft = {
      id: draftData.id || `draft_${Date.now()}`,
      sessionId: activeSessionId || undefined,
      campaignId: selectedCampaignId || undefined,
      campaignTitle: savedCampaigns.find(c => c.id === selectedCampaignId)?.name || undefined,
      title: draftData.title || 'Untitled Blog Post',
      slug: draftData.slug || draftData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200) || 'blog-post',
      excerpt: draftData.excerpt || draftData.metaDescription || (draftData.markdownContent || '').slice(0, 160).replace(/[#*`!\[\]()]/g, ''),
      metaDescription: draftData.metaDescription || draftData.excerpt || (draftData.markdownContent || '').slice(0, 160).replace(/[#*`!\[\]()]/g, ''),
      markdownContent: draftData.markdownContent || '',
      characterCount: draftData.markdownContent?.length || 0,
      readingTimeMinutes,
      embeddedImagesCount: (draftData.markdownContent || '').match(/!\[.*?\]\(.*?\)/g)?.length || 0,
      sectionImagePrompts: draftData.sectionImagePrompts || [],
      status,
      createdAt: existingIndex >= 0 ? savedBlogDrafts[existingIndex].createdAt : nowISO,
      updatedAt: nowISO,
      scheduledAt: scheduledAt || (existingIndex >= 0 ? savedBlogDrafts[existingIndex].scheduledAt : undefined),
      publishedAt: status === 'published' ? nowISO : (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedAt : undefined),
      publishedEndpointId: publishedToEndpointId || (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedEndpointId : undefined)
    };

    if (existingIndex >= 0) {
      updatedDrafts = [...savedBlogDrafts];
      updatedDrafts[existingIndex] = draftObj;
    } else {
      updatedDrafts = [draftObj, ...savedBlogDrafts];
    }

    setSavedBlogDrafts(updatedDrafts);
    setActiveDraftId(draftObj.id);
    await DBService.setItem(DRAFTS_STORAGE_KEY, updatedDrafts);
    return draftObj;
  };

  const handleDeleteBlogDraft = async (draftId: string) => {
    const updated = savedBlogDrafts.filter(d => d.id !== draftId);
    setSavedBlogDrafts(updated);
    if (activeDraftId === draftId) setActiveDraftId(null);
    await DBService.setItem(DRAFTS_STORAGE_KEY, updated);
  };

  const handleSaveCronSchedule = async (sched: CronScheduleItem) => {
    const updated = [sched, ...cronSchedules];
    setCronSchedules(updated);
    await DBService.setItem(CRON_STORAGE_KEY, updated);
  };

  const handleDeleteCronSchedule = async (id: string) => {
    const updated = cronSchedules.filter(c => c.id !== id);
    setCronSchedules(updated);
    await DBService.setItem(CRON_STORAGE_KEY, updated);
  };

  const handleSaveEndpointsList = async (newList: PublishEndpointConfig[]) => {
    setPublishEndpoints(newList);
    await DBService.setItem(ENDPOINTS_STORAGE_KEY, newList);
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    if (publishEndpoints.length <= 1) return;
    const newList = publishEndpoints.filter(e => e.id !== endpointId);
    if (selectedEndpointId === endpointId) {
      setSelectedEndpointId(newList[0].id);
    }
    await handleSaveEndpointsList(newList);
  };

  const handleGenerateBlogPost = async (forcedTopic?: string) => {
    setIsGeneratingBlog(true);
    setPublishResponse(null);

    try {
      let topicToUse = forcedTopic || blogTopicOverride.trim() || activeSession?.title || 'Comprehensive Tech Guide';
      let campaignSummaryText = '';
      let imagesList: { title: string; url: string }[] = [];

      if (selectedCampaignId) {
        const selectedCamp = savedCampaigns.find(c => c.id === selectedCampaignId);
        if (selectedCamp) {
          if (!forcedTopic && !blogTopicOverride.trim()) {
            topicToUse = selectedCamp.mainTopic || selectedCamp.name;
          }
          const lines: string[] = [`Campaign Title: ${selectedCamp.name}`, `Main Topic: ${selectedCamp.mainTopic}`, `Platform: ${selectedCamp.platform}`];
          selectedCamp.posts?.forEach((p, idx) => {
            lines.push(`\nPost #${idx + 1}: ${p.topic || p.day}`);
            if (p.caption) lines.push(`Caption: ${p.caption}`);
            if (p.imageUrl) imagesList.push({ title: p.topic || `Campaign Post ${idx + 1}`, url: p.imageUrl });
            p.slides?.forEach(s => {
              lines.push(`  - Slide ${s.slideNumber}: ${s.title || ''} (${s.contentText || ''})`);
              if (s.imageUrl) imagesList.push({ title: s.title || `Slide ${s.slideNumber}`, url: s.imageUrl });
            });
          });
          campaignSummaryText = lines.join('\n');
        }
      } else {
        campaignSummaryText = `Topic: "${topicToUse}". Provide an in-depth, step-by-step master guide expanding on key principles, practical execution frameworks, and audience value propositions.`;
      }

      const result = await generateBlogPostFromCampaign(
        topicToUse,
        campaignSummaryText,
        imagesList,
        activeSession?.companyContext || '',
        blogTone
      );

      setBlogResult(result);

      await handleSaveBlogDraft({
        sessionId: activeSessionId || undefined,
        campaignId: selectedCampaignId || undefined,
        title: result.title,
        markdownContent: result.markdownContent,
        characterCount: result.characterCount,
        readingTimeMinutes: result.readingTimeMinutes,
        embeddedImagesCount: result.embeddedImagesCount,
        sectionImagePrompts: result.sectionImagePrompts
      }, 'draft');

      if (activeSessionId) {
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
      }

    } catch (err: any) {
      console.error("Failed to generate blog post:", err);
    } finally {
      setIsGeneratingBlog(false);
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

  const extractExcerptFromMarkdown = (markdown: string): string => {
    const cleanText = markdown
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[IMAGE_PROMPT:.*?\]/gi, '')
      .replace(/#+\s+/g, '')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/>\s+/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim();

    return cleanText.slice(0, 480) || 'Authoritative guide and actionable insights.';
  };

  const extractPrimaryImageUrl = (markdown: string): string | undefined => {
    const imageMatch = markdown.match(/!\[.*?\]\((.*?)\)/);
    if (imageMatch && imageMatch[1]) {
      const url = imageMatch[1].trim();
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image/')) {
        return url;
      }
    }
    return undefined;
  };

  const handlePublishBlogToEndpoint = async (customDraftToPublish?: SavedBlogDraft) => {
    const postToPublish = customDraftToPublish || (blogResult ? {
      id: activeDraftId || undefined,
      title: blogResult.title,
      markdownContent: blogResult.markdownContent,
      characterCount: blogResult.characterCount,
      readingTimeMinutes: blogResult.readingTimeMinutes
    } : null);

    if (!postToPublish) return;

    const targetEndpoint = publishEndpoints.find(e => e.id === selectedEndpointId) || publishEndpoints[0];
    const targetUrl = targetEndpoint?.endpointUrl.trim() || 'https://growency.ai/api/blog/publish';

    setIsPublishing(true);
    setPublishResponse(null);

    try {
      const slug = (postToPublish as any).slug || postToPublish.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 200) || 'blog-post';

      const excerpt = (postToPublish as any).excerpt || extractExcerptFromMarkdown(postToPublish.markdownContent).slice(0, 500);
      const metaDescription = (postToPublish as any).metaDescription || excerpt.slice(0, 160);
      const keywords = (postToPublish as any).keywords || [];
      const primaryImageUrl = extractPrimaryImageUrl(postToPublish.markdownContent);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (targetEndpoint.secretKey.trim()) {
        const headerName = targetEndpoint.headerName.trim() || 'Authorization';
        let keyVal = targetEndpoint.secretKey.trim();

        if (headerName.toLowerCase() === 'authorization' && !keyVal.toLowerCase().startsWith('bearer ')) {
          keyVal = `Bearer ${keyVal}`;
        }

        headers[headerName] = keyVal;
      }

      const payload = {
        title: postToPublish.title,
        slug,
        content: postToPublish.markdownContent,
        excerpt,
        metaDescription,
        keywords,
        author: 'AI Research Studio',
        publishedAt: new Date().toISOString(),
        featuredImage: primaryImageUrl,
        source: 'Social Studio X AI Research Center'
      };

      const res = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const status = res.status;
      let resText = '';
      try {
        const data = await res.json();
        resText = data?.message || data?.error || JSON.stringify(data);
      } catch {
        resText = await res.text();
      }

      if (res.ok || status === 201 || status === 200) {
        setPublishResponse({
          success: true,
          status,
          message: `Published successfully to ${targetEndpoint.name} (${targetUrl})! (HTTP ${status})`
        });

        await handleSaveBlogDraft({
          id: postToPublish.id,
          title: postToPublish.title,
          markdownContent: postToPublish.markdownContent
        }, 'published', undefined, targetEndpoint.id);

      } else {
        let errorDetail = resText || 'Publish failed.';
        if (status === 401) {
          errorDetail = `401 Unauthorized: Invalid or missing Bearer token. Please check your secret key in endpoint settings.`;
        } else if (status === 409) {
          errorDetail = `409 Conflict: A blog post with slug "${slug}" already exists.`;
        } else if (status === 400) {
          errorDetail = `400 Validation Error: ${resText || 'Check title, slug, excerpt, and body content.'}`;
        }

        setPublishResponse({
          success: false,
          status,
          message: `Endpoint "${targetEndpoint.name}" returned HTTP ${status}: ${errorDetail}`
        });
      }
    } catch (err: any) {
      console.error("Blog publishing endpoint error:", err);
      setPublishResponse({
        success: false,
        message: `Network Error connecting to ${targetEndpoint.name} (${targetUrl}): ${err?.message || 'Unable to connect.'}`
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateSectionImage = async (promptObj: SectionImagePrompt) => {
    if (!blogResult || generatingPromptId) return;
    setGeneratingPromptId(promptObj.id);

    try {
      const generatedDataUrl = await generateInfographicImage(promptObj.prompt, '16:9');

      let updatedMarkdown = blogResult.markdownContent;
      const markdownImageTag = `![Section Illustration: ${promptObj.prompt.slice(0, 35)}](${generatedDataUrl})`;

      if (promptObj.tag && updatedMarkdown.includes(promptObj.tag)) {
        updatedMarkdown = updatedMarkdown.replace(promptObj.tag, markdownImageTag);
      } else {
        const fallbackRegex = new RegExp(`\\[IMAGE_PROMPT:\\s*${promptObj.prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'i');
        if (fallbackRegex.test(updatedMarkdown)) {
          updatedMarkdown = updatedMarkdown.replace(fallbackRegex, markdownImageTag);
        } else {
          updatedMarkdown += `\n\n${markdownImageTag}\n\n`;
        }
      }

      const updatedPrompts = (blogResult.sectionImagePrompts || []).map((p: SectionImagePrompt) => {
        if (p.id === promptObj.id) {
          return { ...p, generatedUrl: generatedDataUrl };
        }
        return p;
      });

      const imageMatches = updatedMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];

      setBlogResult({
        ...blogResult,
        markdownContent: updatedMarkdown,
        characterCount: updatedMarkdown.length,
        embeddedImagesCount: imageMatches.length,
        sectionImagePrompts: updatedPrompts
      });
    } catch (err: any) {
      console.error("Failed to generate section image:", err);
    } finally {
      setGeneratingPromptId(null);
    }
  };

  const handleMarkdownContentEdit = (newMarkdown: string) => {
    if (!blogResult) return;
    const wordCount = newMarkdown.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const imageMatches = newMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];

    const promptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/gi;
    const sectionImagePrompts: SectionImagePrompt[] = [];
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = promptRegex.exec(newMarkdown)) !== null) {
      count++;
      sectionImagePrompts.push({
        id: `img_prompt_edit_${Date.now()}_${count}`,
        prompt: match[1].trim(),
        tag: match[0]
      });
    }

    setBlogResult({
      ...blogResult,
      markdownContent: newMarkdown,
      characterCount: newMarkdown.length,
      readingTimeMinutes,
      embeddedImagesCount: imageMatches.length,
      sectionImagePrompts: sectionImagePrompts.length > 0 ? sectionImagePrompts : (blogResult.sectionImagePrompts || [])
    });
  };

  const handleAddCustomImagePrompt = () => {
    if (!blogResult || !customSectionPromptInput.trim()) return;
    const promptText = customSectionPromptInput.trim();
    const tag = `[IMAGE_PROMPT: ${promptText}]`;
    const newMarkdown = `${blogResult.markdownContent}\n\n${tag}\n\n`;

    setCustomSectionPromptInput('');
    handleMarkdownContentEdit(newMarkdown);
  };

  const handleSaveTitleEdit = () => {
    if (!blogResult || !customTitleInput.trim()) return;
    const newTitle = customTitleInput.trim();
    const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200);
    const updated = { ...blogResult, title: newTitle, slug: newSlug };
    setBlogResult(updated);
    setIsEditingTitle(false);

    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: newTitle,
      slug: newSlug,
      markdownContent: blogResult.markdownContent
    }, 'draft');
  };

  const formatCronExpression = (cronExpr: string): string => {
    const parts = cronExpr.trim().split(/\s+/);
    if (parts.length !== 5) return 'Custom Cron Schedule';
    const [min, hour, dom, mon, dow] = parts;

    if (min === '0' && hour === '9' && dow === '1') return 'Every Monday at 9:00 AM';
    if (min === '0' && hour === '12') return 'Daily at 12:00 PM';
    if (min === '0' && hour === '9' && dom === '1') return '1st Day of Month at 9:00 AM';
    if (min === '0' && dow === '5') return 'Every Friday at 9:00 AM';

    return `Cron Rule: ${cronExpr}`;
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
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
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
        savedBlogDrafts={savedBlogDrafts}
        cronSchedules={cronSchedules}
        setIsBlogStudioOpen={setIsBlogStudioOpen}
        setBlogViewMode={setBlogViewMode}
        onBackToDashboard={onBackToDashboard}
      />

      {/* Main Chat & Research Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-950">
        <ResearchChatArea
          activeSession={activeSession}
          isLoading={isLoading}
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
          useGoogleSearchGrounding={useGoogleSearchGrounding}
          setUseGoogleSearchGrounding={setUseGoogleSearchGrounding}
          selectedModelAlias={selectedModelAlias}
          setSelectedModelAlias={setSelectedModelAlias}
          handleSendMessage={handleSendMessage}
          samplePrompts={samplePrompts}
        />
      </div>

      {/* Blog Studio Drawer Modal */}
      <BlogStudioModal
        isOpen={isBlogStudioOpen}
        onClose={() => setIsBlogStudioOpen(false)}
        blogResult={blogResult}
        setBlogResult={setBlogResult}
        blogViewMode={blogViewMode}
        setBlogViewMode={setBlogViewMode}
        isGeneratingBlog={isGeneratingBlog}
        savedCampaigns={savedCampaigns}
        selectedCampaignId={selectedCampaignId}
        setSelectedCampaignId={setSelectedCampaignId}
        blogTopicOverride={blogTopicOverride}
        setBlogTopicOverride={setBlogTopicOverride}
        blogTone={blogTone}
        setBlogTone={setBlogTone}
        handleGenerateBlogPost={handleGenerateBlogPost}
        isBlogCopied={isBlogCopied}
        setIsBlogCopied={setIsBlogCopied}
        isSavingDraft={isSavingDraft}
        setIsSavingDraft={setIsSavingDraft}
        draftSaveSuccess={draftSaveSuccess}
        setDraftSaveSuccess={setDraftSaveSuccess}
        isDownloadingMd={isDownloadingMd}
        setIsDownloadingMd={setIsDownloadingMd}
        handleSaveBlogDraft={handleSaveBlogDraft}
        handleDeleteBlogDraft={handleDeleteBlogDraft}
        savedBlogDrafts={savedBlogDrafts}
        activeDraftId={activeDraftId}
        setActiveDraftId={setActiveDraftId}
        cronSchedules={cronSchedules}
        handleSaveCronSchedule={handleSaveCronSchedule}
        handleDeleteCronSchedule={handleDeleteCronSchedule}
        newCronTitle={newCronTitle}
        setNewCronTitle={setNewCronTitle}
        newCronExpression={newCronExpression}
        setNewCronExpression={setNewCronExpression}
        selectedDraftForScheduleId={selectedDraftForScheduleId}
        setSelectedDraftForScheduleId={setSelectedDraftForScheduleId}
        scheduleDateTime={scheduleDateTime}
        setScheduleDateTime={setScheduleDateTime}
        scheduleSuccessFeedback={scheduleSuccessFeedback}
        setScheduleSuccessFeedback={setScheduleSuccessFeedback}
        publishEndpoints={publishEndpoints}
        selectedEndpointId={selectedEndpointId}
        setSelectedEndpointId={setSelectedEndpointId}
        editingEndpoint={editingEndpoint}
        setEditingEndpoint={setEditingEndpoint}
        isEndpointModalOpen={isEndpointModalOpen}
        setIsEndpointModalOpen={setIsEndpointModalOpen}
        handleSaveEndpointsList={handleSaveEndpointsList}
        handleDeleteEndpoint={handleDeleteEndpoint}
        handlePublishBlogToEndpoint={handlePublishBlogToEndpoint}
        isPublishing={isPublishing}
        publishResponse={publishResponse}
        generatingPromptId={generatingPromptId}
        handleGenerateSectionImage={handleGenerateSectionImage}
        handleMarkdownContentEdit={handleMarkdownContentEdit}
        customSectionPromptInput={customSectionPromptInput}
        setCustomSectionPromptInput={setCustomSectionPromptInput}
        handleAddCustomImagePrompt={handleAddCustomImagePrompt}
        isEditingTitle={isEditingTitle}
        setIsEditingTitle={setIsEditingTitle}
        customTitleInput={customTitleInput}
        setCustomTitleInput={setCustomTitleInput}
        handleSaveTitleEdit={handleSaveTitleEdit}
        formatCronExpression={formatCronExpression}
      />
    </div>
  );
};
