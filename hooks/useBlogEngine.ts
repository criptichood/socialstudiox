import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { DBService } from '@/services/dbService';
import { nextCronRun } from '@/lib/cron';
import {
  generateBlogPostFromCampaign,
  generateInfographicImage,
  suggestBlogSeo,
  suggestBlogTopics,
  uploadImageToCloudinary,
  publishBlogToEndpoint,
  BlogPostResult,
  SectionImagePrompt,
  BlogTopicIdea,
} from '@/services/geminiService';
import {
  SavedCampaign,
  PublishEndpointConfig,
  SavedBlogDraft,
  CronScheduleItem,
} from '@/types';
import { curateResearchBrief, CuratedResearchBrief } from '@/services/ai/campaignService';

export const BLOG_DRAFTS_STORAGE_KEY = 'infogenius_saved_blog_drafts';
export const BLOG_ENDPOINTS_STORAGE_KEY = 'infogenius_publish_endpoints';
export const BLOG_CRON_STORAGE_KEY = 'infogenius_cron_schedules';
export const BLOG_CAMPAIGNS_STORAGE_KEY = 'social_studio_x_campaigns_v2';
export const BLOG_NODE_DIAGRAMS_KEY = 'infogenius_node_diagrams_enabled';

const DEFAULT_ENDPOINT: PublishEndpointConfig = {
  id: 'growency_main',
  name: 'Growency.ai Production Blog',
  endpointUrl: 'https://growency.ai/api/blog/publish',
  secretKey: '',
  headerName: 'Authorization',
  enabled: true,
  isDefault: true,
  updateMethod: 'PUT',
};

/** Strip unresolved [IMAGE_PROMPT: ...] placeholder lines so raw prompt text never ships to the blog endpoint. */
const sanitizeBodyForPublish = (markdown: string): string =>
  markdown
    .replace(/^[ \t]*\[?IMAGE_PROMPT:\s*[^\]\n]*\]?[ \t]*\n?/gim, '')
    .replace(/\[?IMAGE_PROMPT:\s*[^\]\n]*\]?/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

export type BlogViewMode = 'preview' | 'markdown' | 'drafts' | 'published' | 'schedules' | 'webhook-settings';

export interface BlogSeoSuggestions {
  titleOptions: string[];
  metaDescription: string;
  keywords: string[];
}

export interface UseBlogEngineOptions {
  /** Research-specific: builds a context summary from the active thread. */
  getThreadContext?: () => string;
  /** Research-specific: session to attach generated drafts to. */
  sessionId?: string;
  /** Initial topic override for the generator. */
  defaultTopic?: string;
}

export const useBlogEngine = (options: UseBlogEngineOptions = {}) => {
  // Generator controls
  const [savedCampaigns, setSavedCampaigns] = useState<SavedCampaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [blogTopicOverride, setBlogTopicOverride] = useState<string>(options.defaultTopic || '');
  const [blogTone, setBlogTone] = useState<string>('Informative, Authoritative & Actionable Guide');
  const [blogWordCount, setBlogWordCount] = useState<number>(1200);
  const [blogAudience, setBlogAudience] = useState<string>('General / Mixed Audience');
  const [blogSeoKeywords, setBlogSeoKeywords] = useState<string>('');

  // Generation state
  const [isGeneratingBlog, setIsGeneratingBlog] = useState<boolean>(false);
  const [blogResult, setBlogResult] = useState<BlogPostResult | null>(null);
  const [blogViewMode, setBlogViewMode] = useState<BlogViewMode>('preview');
  const [isBlogCopied, setIsBlogCopied] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState<boolean>(false);
  const [isDownloadingMd, setIsDownloadingMd] = useState<boolean>(false);

  // Drafts
  const [savedBlogDrafts, setSavedBlogDrafts] = useState<SavedBlogDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  // Cron schedules
  const [cronSchedules, setCronSchedules] = useState<CronScheduleItem[]>([]);
  const cronSchedulesRef = useRef<CronScheduleItem[]>([]);
  useEffect(() => {
    cronSchedulesRef.current = cronSchedules;
  }, [cronSchedules]);
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

  // Webhook endpoints
  const [publishEndpoints, setPublishEndpoints] = useState<PublishEndpointConfig[]>([DEFAULT_ENDPOINT]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('growency_main');
  const [editingEndpoint, setEditingEndpoint] = useState<PublishEndpointConfig | null>(null);
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState<boolean>(false);

  // Section images & inline edits
  const [generatingPromptId, setGeneratingPromptId] = useState<string | null>(null);
  const [uploadingPromptId, setUploadingPromptId] = useState<string | null>(null);
  const [customSectionPromptInput, setCustomSectionPromptInput] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [customTitleInput, setCustomTitleInput] = useState<string>('');

  // Publishing process
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);

  // AI SEO suggestions
  const [isSeoSuggesting, setIsSeoSuggesting] = useState<boolean>(false);
  const [seoSuggestions, setSeoSuggestions] = useState<BlogSeoSuggestions | null>(null);

  // New-post composer ("Add New Blog Post" + "I'm feeling lucky")
  // New-post composer ("Add New Post" + "I'm feeling lucky")
  const [isNewPostComposerOpen, setIsNewPostComposerOpen] = useState<boolean>(false);
  const [newPostIdeaInput, setNewPostIdeaInput] = useState<string>('');
  const [ideaOptions, setIdeaOptions] = useState<BlogTopicIdea[]>([]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState<boolean>(false);

  // When "Create Blog Post" is opened from a research reply, the composer is
  // shown immediately with the plain topic while the reply is curated into a
  // rich brief in the background. This flag drives the loading state in the
  // composer so the user sees the transition instead of a bare topic and a toast.
  const [isCuratingBlogBrief, setIsCuratingBlogBrief] = useState<boolean>(false);
  // Live mirror of newPostIdeaInput so async curation can check whether the user
  // edited the field while it was running (the closure's state value is stale).
  const newPostIdeaInputRef = useRef<string>('');
  useEffect(() => {
    newPostIdeaInputRef.current = newPostIdeaInput;
  }, [newPostIdeaInput]);

  // AI node-diagram rendering toggle (default ON)
  const [nodeDiagramsEnabled, setNodeDiagramsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.localStorage.getItem(BLOG_NODE_DIAGRAMS_KEY) !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(BLOG_NODE_DIAGRAMS_KEY, String(nodeDiagramsEnabled));
    } catch {
      /* no-op */
    }
  }, [nodeDiagramsEnabled]);

  const buildPublishedPostsContext = (): { title: string; slug?: string; metaDescription?: string; keywords?: string[] }[] =>
    savedBlogDrafts
      .filter(d => d.status === 'published')
      .map(d => ({
        title: d.title,
        slug: d.slug,
        metaDescription: d.metaDescription || d.excerpt,
        keywords: d.keywords,
      }));

  const getSiteBaseUrl = (): string => {
    const target = publishEndpoints.find(e => e.id === selectedEndpointId) || publishEndpoints[0];
    if (target?.blogBaseUrl?.trim()) return target.blogBaseUrl.trim();
    if (target?.endpointUrl) {
      const match = target.endpointUrl.match(/^(https?:\/\/[^/]+)/);
      if (match) return match[1];
    }
    return 'https://growency.ai';
  };

  const publishedBlogPosts = savedBlogDrafts.filter(d => d.status === 'published');

  const makeUniqueSlug = (title: string, excludeId?: string): string => {
    const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200) || 'blog-post';
    const taken = new Set(
      savedBlogDrafts
        .filter(d => d.id !== excludeId)
        .map(d => (d.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim())
        .filter(Boolean)
    );
    if (!taken.has(base)) return base;
    let counter = 2;
    let candidate = `${base.slice(0, 195)}-${counter}`;
    while (taken.has(candidate)) {
      counter += 1;
      candidate = `${base.slice(0, 195)}-${counter}`;
    }
    return candidate;
  };

  // Load all blog data from IndexedDB on mount
  useEffect(() => {
    const loadAllBlogData = async () => {
      try {
        const storedDrafts = await DBService.getItem<SavedBlogDraft[]>(BLOG_DRAFTS_STORAGE_KEY, []);
        if (storedDrafts && Array.isArray(storedDrafts)) setSavedBlogDrafts(storedDrafts);

        const storedEndpoints = await DBService.getItem<PublishEndpointConfig[]>(BLOG_ENDPOINTS_STORAGE_KEY, []);
        if (storedEndpoints && Array.isArray(storedEndpoints) && storedEndpoints.length > 0) {
          setPublishEndpoints(storedEndpoints);
          const defaultEp = storedEndpoints.find(e => e.isDefault) || storedEndpoints[0];
          setSelectedEndpointId(defaultEp.id);
        }

        const storedSchedules = await DBService.getItem<CronScheduleItem[]>(BLOG_CRON_STORAGE_KEY, []);
        if (storedSchedules && Array.isArray(storedSchedules)) setCronSchedules(storedSchedules);

        const camps = await DBService.getItem<SavedCampaign[]>(BLOG_CAMPAIGNS_STORAGE_KEY, []);
        if (camps && Array.isArray(camps)) setSavedCampaigns(camps);
      } catch (err) {
        console.error("Failed loading blog data from DBService:", err);
      }
    };

    loadAllBlogData();
  }, []);

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

  const handleSaveBlogDraft = useCallback(async (
    draftData: any,
    status: 'draft' | 'scheduled' | 'published' = 'draft',
    scheduledAt?: string,
    publishedToEndpointId?: string
  ) => {
    const existingIndex = savedBlogDrafts.findIndex(d => d.id === draftData.id || d.title === draftData.title);
    const nowISO = new Date().toISOString();
    let updatedDrafts: SavedBlogDraft[];

    const wordCount = (draftData.markdownContent || '').split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    const draftObj: SavedBlogDraft = {
      id: draftData.id || `draft_${Date.now()}`,
      sessionId: options.sessionId || draftData.sessionId || undefined,
      campaignId: draftData.campaignId || selectedCampaignId || undefined,
      campaignTitle: draftData.campaignTitle || savedCampaigns.find(c => c.id === selectedCampaignId)?.name || undefined,
      title: draftData.title || 'Untitled Blog Post',
      slug: draftData.slug || draftData.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200) || 'blog-post',
      excerpt: draftData.excerpt || draftData.metaDescription || (draftData.markdownContent || '').slice(0, 160).replace(/[#*`!\[\]()]/g, ''),
      metaDescription: draftData.metaDescription || draftData.excerpt || (draftData.markdownContent || '').slice(0, 160).replace(/[#*`!\[\]()]/g, ''),
      keywords: draftData.keywords || (typeof draftData.keywordSource === 'string' && draftData.keywordSource.trim()
        ? draftData.keywordSource.split(',').map((k: string) => k.trim()).filter(Boolean)
        : undefined),
      markdownContent: draftData.markdownContent || '',
      characterCount: draftData.markdownContent?.length || 0,
      readingTimeMinutes,
      embeddedImagesCount: (draftData.markdownContent || '').match(/!\[.*?\]\(.*?\)/g)?.length || 0,
      relatedPosts: draftData.relatedPosts ?? (existingIndex >= 0 ? savedBlogDrafts[existingIndex].relatedPosts : undefined),
      sectionImagePrompts: (draftData.sectionImagePrompts
        ? draftData.sectionImagePrompts.map((p: SectionImagePrompt) => {
            // Never persist raw base64 preview blobs — only the hosted Cloudinary URL.
            if (!p.previewDataUrl) return p;
            const { previewDataUrl, ...rest } = p;
            return rest;
          })
        : (existingIndex >= 0 ? savedBlogDrafts[existingIndex].sectionImagePrompts : [])),
      status,
      createdAt: existingIndex >= 0 ? savedBlogDrafts[existingIndex].createdAt : nowISO,
      updatedAt: nowISO,
      scheduledAt: scheduledAt || (existingIndex >= 0 ? savedBlogDrafts[existingIndex].scheduledAt : undefined),
      publishedAt: (existingIndex >= 0 && savedBlogDrafts[existingIndex].publishedAt)
        ? savedBlogDrafts[existingIndex].publishedAt
        : (status === 'published' ? nowISO : (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedAt : undefined)),
      publishedEndpointId: publishedToEndpointId || (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedEndpointId : undefined),
      publishedMarkdown: draftData.publishedMarkdown ?? (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedMarkdown : undefined),
      publishedTitle: draftData.publishedTitle ?? (existingIndex >= 0 ? savedBlogDrafts[existingIndex].publishedTitle : undefined)
    };

    if (existingIndex >= 0) {
      updatedDrafts = [...savedBlogDrafts];
      updatedDrafts[existingIndex] = draftObj;
    } else {
      updatedDrafts = [draftObj, ...savedBlogDrafts];
    }

    setSavedBlogDrafts(updatedDrafts);
    setActiveDraftId(draftObj.id);
    await DBService.setItem(BLOG_DRAFTS_STORAGE_KEY, updatedDrafts);
    return draftObj;
  }, [savedBlogDrafts, options.sessionId, selectedCampaignId, savedCampaigns]);

  const handleDeleteBlogDraft = useCallback(async (draftId: string) => {
    const updated = savedBlogDrafts.filter(d => d.id !== draftId);
    setSavedBlogDrafts(updated);
    if (activeDraftId === draftId) setActiveDraftId(null);
    await DBService.setItem(BLOG_DRAFTS_STORAGE_KEY, updated);
  }, [savedBlogDrafts, activeDraftId]);

  const handleSaveCronSchedule = useCallback(async (sched: CronScheduleItem) => {
    const updated = [sched, ...cronSchedules];
    setCronSchedules(updated);
    await DBService.setItem(BLOG_CRON_STORAGE_KEY, updated);
  }, [cronSchedules]);

  const handleDeleteCronSchedule = useCallback(async (id: string) => {
    const updated = cronSchedules.filter(c => c.id !== id);
    setCronSchedules(updated);
    await DBService.setItem(BLOG_CRON_STORAGE_KEY, updated);
  }, [cronSchedules]);

  const handleSaveEndpointsList = useCallback(async (newList: PublishEndpointConfig[]) => {
    setPublishEndpoints(newList);
    await DBService.setItem(BLOG_ENDPOINTS_STORAGE_KEY, newList);
  }, []);

  const handleDeleteEndpoint = useCallback(async (endpointId: string) => {
    if (publishEndpoints.length <= 1) return;
    const newList = publishEndpoints.filter(e => e.id !== endpointId);
    if (selectedEndpointId === endpointId) {
      setSelectedEndpointId(newList[0].id);
    }
    await handleSaveEndpointsList(newList);
  }, [publishEndpoints, selectedEndpointId, handleSaveEndpointsList]);

  const generateBlogPost = useCallback(async (
    forcedTopic?: string,
    forcedContext?: string
  ): Promise<BlogPostResult | null> => {
    setIsGeneratingBlog(true);

    try {
      let topicToUse = forcedTopic || blogTopicOverride.trim() || 'Comprehensive Tech Guide';
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
      }

      if (!campaignSummaryText) {
        const threadContext = forcedContext?.trim() || options.getThreadContext?.() || '';
        campaignSummaryText = threadContext
          ? `RESEARCH THREAD CONTEXT (use these findings as the factual basis of the article, elaborate on them, and keep the tone consistent with the assistant's style):\n\n${threadContext}`
          : `Topic: "${topicToUse}". Provide an in-depth, step-by-step master guide expanding on key principles, practical execution frameworks, and audience value propositions.`;
      }

      const result = await generateBlogPostFromCampaign(
        topicToUse,
        campaignSummaryText,
        imagesList,
        '',
        undefined,
        undefined,
        undefined,
        undefined,
        buildPublishedPostsContext(),
        undefined,
        undefined,
        getSiteBaseUrl(),
        nodeDiagramsEnabled
      );

      setBlogResult(result);
      setBlogViewMode('preview');

      await handleSaveBlogDraft({
        sessionId: options.sessionId || undefined,
        campaignId: selectedCampaignId || undefined,
        title: result.title,
        slug: result.slug,
        excerpt: result.excerpt,
        metaDescription: result.metaDescription,
        keywords: result.keywords,
        markdownContent: result.markdownContent,
        characterCount: result.characterCount,
        readingTimeMinutes: result.readingTimeMinutes,
        embeddedImagesCount: result.embeddedImagesCount,
        sectionImagePrompts: result.sectionImagePrompts,
        relatedPosts: result.relatedPosts
      }, 'draft');

      return result;
    } catch (err: any) {
      console.error("Failed to generate blog post:", err);
      toast.error("Failed to generate the blog post. Please try again.");
      return null;
    } finally {
      setIsGeneratingBlog(false);
    }
  }, [blogTopicOverride, selectedCampaignId, savedCampaigns, options.getThreadContext, options.sessionId, savedBlogDrafts, handleSaveBlogDraft, publishEndpoints, selectedEndpointId, nodeDiagramsEnabled]);

  const generateTopicIdeas = useCallback(async () => {
    if (isGeneratingIdeas) return;
    setIsGeneratingIdeas(true);
    try {
      const ideas = await suggestBlogTopics(buildPublishedPostsContext());
      setIdeaOptions(Array.isArray(ideas) ? ideas : []);
    } catch (err: any) {
      console.error("Failed to generate topic ideas:", err);
      toast.error("Failed to generate topic ideas. Please try again.");
      setIdeaOptions([]);
    } finally {
      setIsGeneratingIdeas(false);
    }
  }, [isGeneratingIdeas, savedBlogDrafts]);

  /**
   * Curate a research reply into a rich blog brief and prefill the composer's
   * idea field with it. Exposes the isCuratingBlogBrief flag so the composer
   * can show a loading state while it runs. Re-throws on failure so callers
   * can surface the error, and never clobbers text the user typed meanwhile.
   */
  const curateBlogBrief = useCallback(async (
    topic: string,
    context: string,
    companyContext?: string
  ): Promise<CuratedResearchBrief> => {
    setIsCuratingBlogBrief(true);
    try {
      const brief = await curateResearchBrief(topic || '', context, companyContext || '', 'blog');
      if (brief.objective && newPostIdeaInputRef.current === (topic || '')) {
        setNewPostIdeaInput(brief.objective);
      }
      return brief;
    } finally {
      setIsCuratingBlogBrief(false);
    }
  }, []);

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

  const buildPublishHeaders = (endpoint: PublishEndpointConfig): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (endpoint.secretKey.trim()) {
      const headerName = endpoint.headerName.trim() || 'Authorization';
      let keyVal = endpoint.secretKey.trim();
      if (headerName.toLowerCase() === 'authorization' && !keyVal.toLowerCase().startsWith('bearer ')) {
        keyVal = `Bearer ${keyVal}`;
      }
      headers[headerName] = keyVal;
    }
    return headers;
  };

  interface PublishPayloadInput {
    title: string;
    slug: string;
    markdownContent: string;
    excerpt?: string;
    metaDescription?: string;
    keywords?: string[];
  }

  /** Build the payload sent to a blog endpoint. The body is sanitized so
   *  unresolved [IMAGE_PROMPT: ...] placeholders never ship to the live site. */
  const buildPublishPayload = (post: PublishPayloadInput) => {
    const body = sanitizeBodyForPublish(post.markdownContent);
    const excerpt = post.excerpt || extractExcerptFromMarkdown(body).slice(0, 500);
    const metaDescription = post.metaDescription || excerpt.slice(0, 160);
    const keywords = post.keywords || [];
    const primaryImageUrl = extractPrimaryImageUrl(body);
    return {
      title: post.title,
      slug: post.slug,
      body,
      content: body,
      excerpt,
      metaDescription,
      keywords,
      image_url: primaryImageUrl,
      featuredImage: primaryImageUrl,
      author: 'AI Research Studio',
      publishedAt: new Date().toISOString(),
      source: 'Social Studio X AI Research Center'
    };
  };

  const stripPreviewBlobs = (prompts: SectionImagePrompt[] | undefined): SectionImagePrompt[] =>
    (prompts || []).map((p) => {
      if (!p.previewDataUrl) return p;
      const { previewDataUrl, ...rest } = p;
      return rest;
    });

  /** The saved record (if any) that represents the CURRENTLY EDITED post's published version. */
  const findPublishedRecord = useCallback((): SavedBlogDraft | undefined => {
    if (!blogResult) return undefined;
    const byId = activeDraftId
      ? savedBlogDrafts.find(d => d.id === activeDraftId && d.publishedEndpointId)
      : undefined;
    if (byId) return byId;
    const bySlug = blogResult.slug
      ? savedBlogDrafts.find(d => d.publishedEndpointId && d.slug === blogResult.slug)
      : undefined;
    if (bySlug) return bySlug;
    return savedBlogDrafts.find(d => d.publishedEndpointId && d.title === blogResult.title);
  }, [blogResult, activeDraftId, savedBlogDrafts]);

  /** Whether the currently edited post differs from what was last published to its endpoint. */
  const hasUnpublishedChanges = useCallback((): boolean => {
    const record = findPublishedRecord();
    if (!blogResult) return false;
    const baseline = sanitizeBodyForPublish(record?.publishedMarkdown ?? record?.markdownContent ?? '');
    const current = sanitizeBodyForPublish(blogResult.markdownContent);
    return current !== baseline || (record?.publishedTitle || '') !== blogResult.title;
  }, [blogResult, findPublishedRecord]);

  const handlePublishBlogToEndpoint = useCallback(async (customDraftToPublish?: SavedBlogDraft) => {
    const postToPublish = customDraftToPublish || (blogResult ? {
      id: activeDraftId || undefined,
      title: blogResult.title,
      slug: blogResult.slug,
      excerpt: blogResult.excerpt,
      metaDescription: blogResult.metaDescription,
      keywords: blogResult.keywords,
      markdownContent: blogResult.markdownContent,
      characterCount: blogResult.characterCount,
      readingTimeMinutes: blogResult.readingTimeMinutes
    } : null);

    if (!postToPublish) return;

    const targetEndpoint = publishEndpoints.find(e => e.id === selectedEndpointId) || publishEndpoints[0];
    const targetUrl = targetEndpoint?.endpointUrl.trim() || 'https://growency.ai/api/blog/publish';

    setIsPublishing(true);
    setPublishingDraftId(customDraftToPublish?.id || activeDraftId || 'current');

    try {
      const slug = (postToPublish as any).slug || postToPublish.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 200) || 'blog-post';

      const headers = buildPublishHeaders(targetEndpoint);
      const payload = buildPublishPayload({
        title: postToPublish.title,
        slug,
        markdownContent: postToPublish.markdownContent,
        excerpt: (postToPublish as any).excerpt,
        metaDescription: (postToPublish as any).metaDescription,
        keywords: (postToPublish as any).keywords
      });

      const result = await publishBlogToEndpoint(targetUrl, headers, payload, 'POST');

      const status = result.status;
      let resText = result.responseText;

      if (result.ok || status === 201 || status === 200) {
        const shortTitle = postToPublish.title.length > 60
          ? `${postToPublish.title.slice(0, 60)}…`
          : postToPublish.title;
        toast.success(`"${shortTitle}" published successfully to ${targetEndpoint.name}!`);

        await handleSaveBlogDraft({
          id: postToPublish.id,
          title: postToPublish.title,
          slug,
          excerpt: payload.excerpt,
          metaDescription: payload.metaDescription,
          keywords: payload.keywords,
          markdownContent: postToPublish.markdownContent,
          sectionImagePrompts: stripPreviewBlobs((postToPublish as any).sectionImagePrompts),
          publishedMarkdown: payload.body,
          publishedTitle: postToPublish.title
        }, 'published', undefined, targetEndpoint.id);
      } else {
        let errorDetail = resText || 'Publish failed.';
        if (status === 401) {
          errorDetail = `401 Unauthorized: Invalid or missing Bearer token. Check the secret key in Webhook settings.`;
        } else if (status === 409) {
          errorDetail = `409 Conflict: A blog post with slug "${slug}" already exists. Use "Update Published Post" to modify it instead.`;
        } else if (status === 400) {
          errorDetail = `400 Validation Error: ${resText || 'Check title, slug, excerpt, and body content.'}`;
        }

        toast.error(`Endpoint "${targetEndpoint.name}" returned HTTP ${status}: ${errorDetail}`);
      }
    } catch (err: any) {
      console.error("Blog publishing endpoint error:", err);
      toast.error(`Network Error connecting to ${targetEndpoint.name} (${targetUrl}): ${err?.message || 'Unable to connect.'}`);
    } finally {
      setIsPublishing(false);
      setPublishingDraftId(null);
    }
  }, [blogResult, activeDraftId, publishEndpoints, selectedEndpointId, handleSaveBlogDraft]);

  /** Update an already-published post in place (PUT/PATCH by slug) using the current editor content. */
  const handleUpdatePublishedPost = useCallback(async (customRecord?: SavedBlogDraft) => {
    const record = customRecord || findPublishedRecord();
    if (!record || !record.publishedEndpointId || !blogResult) return;

    const endpoint = publishEndpoints.find(e => e.id === record.publishedEndpointId) || publishEndpoints[0];
    const targetUrl = endpoint?.endpointUrl.trim();
    if (!targetUrl) return;

    const method = endpoint.updateMethod || 'PUT';
    const slug = record.slug || blogResult.slug || blogResult.title
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 200);

    setIsPublishing(true);
    setPublishingDraftId(record.id);

    try {
      const headers = buildPublishHeaders(endpoint);
      const payload = buildPublishPayload({
        title: blogResult.title,
        slug,
        markdownContent: blogResult.markdownContent,
        excerpt: blogResult.excerpt,
        metaDescription: blogResult.metaDescription,
        keywords: blogResult.keywords
      });

      const result = await publishBlogToEndpoint(targetUrl, headers, payload, method);
      const status = result.status;

      if (result.ok || status === 200 || status === 201) {
        const shortTitle = blogResult.title.length > 60
          ? `${blogResult.title.slice(0, 60)}…`
          : blogResult.title;
        toast.success(`"${shortTitle}" updated on ${endpoint.name}!`);

        const updated: SavedBlogDraft[] = savedBlogDrafts.map(d => d.id === record.id ? {
          ...d,
          title: blogResult.title,
          slug,
          excerpt: payload.excerpt,
          metaDescription: payload.metaDescription,
          keywords: payload.keywords,
          markdownContent: blogResult.markdownContent,
          characterCount: blogResult.markdownContent.length,
          readingTimeMinutes: Math.max(1, Math.ceil(blogResult.markdownContent.split(/\s+/).filter(Boolean).length / 200)),
          embeddedImagesCount: (blogResult.markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length,
          sectionImagePrompts: stripPreviewBlobs(blogResult.sectionImagePrompts),
          publishedMarkdown: payload.body,
          publishedTitle: blogResult.title,
          status: 'published',
          publishedEndpointId: endpoint.id,
          updatedAt: new Date().toISOString()
        } : d);
        setSavedBlogDrafts(updated);
        await DBService.setItem(BLOG_DRAFTS_STORAGE_KEY, updated);
      } else {
        let errorDetail = result.responseText || 'Update failed.';
        if (status === 404) {
          errorDetail = `404 Not Found: No post with slug "${slug}" exists on the endpoint. It may have been deleted — use "Publish Now" to publish it as a new post instead.`;
        } else if (status === 401) {
          errorDetail = `401 Unauthorized: Invalid or missing Bearer token. Check the secret key in Webhook settings.`;
        }
        toast.error(`Endpoint "${endpoint.name}" returned HTTP ${status}: ${errorDetail}`);
      }
    } catch (err: any) {
      console.error("Blog update endpoint error:", err);
      toast.error(`Network Error connecting to ${endpoint.name} (${targetUrl}): ${err?.message || 'Unable to connect.'}`);
    } finally {
      setIsPublishing(false);
      setPublishingDraftId(null);
    }
  }, [blogResult, findPublishedRecord, publishEndpoints, savedBlogDrafts]);

  /**
   * Advance `nextRunAt` for a recurring cron schedule (when the draft it points
   * to is missing, the schedule is completed instead). Returns the new
   * `nextRunAt` (or null when the schedule should stop recurring).
   */
  const advanceScheduleRun = useCallback((sched: CronScheduleItem): string | null => {
    if (!sched.cronExpression?.trim()) return null;
    const next = nextCronRun(sched.cronExpression, new Date());
    return next ? next.toISOString() : null;
  }, []);

  /** Apply a partial patch to one schedule and persist the list. */
  const updateOneSchedule = useCallback(async (id: string, patch: Partial<CronScheduleItem>) => {
    const next = cronSchedulesRef.current.map(s => s.id === id ? { ...s, ...patch } : s);
    cronSchedulesRef.current = next;
    setCronSchedules(next);
    await DBService.setItem(BLOG_CRON_STORAGE_KEY, next);
  }, []);

  /**
   * Execute a single schedule right now: publish the linked draft to its
   * webhook endpoint, then either advance the cron rule or mark the schedule
   * completed. Returns true when a post was published.
   */
  const executeSchedule = useCallback(async (sched: CronScheduleItem): Promise<boolean> => {
    const draft = sched.draftId
      ? savedBlogDrafts.find(d => d.id === sched.draftId)
      : savedBlogDrafts.find(d => d.title === sched.postTitle);

    if (!draft) {
      await updateOneSchedule(sched.id, { status: 'completed', updatedAt: Date.now() });
      toast.error(`Schedule "${sched.postTitle}" skipped: the linked draft was not found.`);
      return false;
    }

    const nextRunAt = advanceScheduleRun(sched);
    await updateOneSchedule(sched.id, {
      lastRunAt: new Date().toISOString(),
      nextRunAt: nextRunAt || undefined,
      status: nextRunAt ? 'active' : 'completed',
      updatedAt: Date.now()
    });

    const endpoint = publishEndpoints.find(e => e.id === sched.endpointId);
    await handlePublishBlogToEndpoint(draft);
    toast.success(`Scheduled post "${draft.title}" published to ${endpoint?.name || sched.endpointId}.`);
    return true;
  }, [savedBlogDrafts, publishEndpoints, handlePublishBlogToEndpoint, advanceScheduleRun, updateOneSchedule]);

  /**
   * Fire every schedule whose `nextRunAt` has passed: publish the linked draft
   * to its webhook endpoint, then either advance the cron rule or mark the
   * schedule completed. Returns the number of schedules executed.
   */
  const runDueSchedules = useCallback(async (): Promise<number> => {
    const now = Date.now();
    const due = cronSchedules.filter(
      s => s.status === 'active' && s.nextRunAt && new Date(s.nextRunAt).getTime() <= now
    );

    let executed = 0;
    for (const sched of due) {
      if (await executeSchedule(sched)) executed += 1;
    }
    if (executed > 0) {
      toast.success(executed === 1
        ? 'One scheduled post was due and has been published.'
        : `${executed} scheduled posts were due and have been published.`);
    }
    return executed;
  }, [cronSchedules, executeSchedule]);

  /** Publish a specific schedule's post immediately, regardless of due time. */
  const runScheduleNow = useCallback(async (scheduleId: string): Promise<boolean> => {
    const sched = cronSchedules.find(s => s.id === scheduleId);
    if (!sched) return false;
    return executeSchedule(sched);
  }, [cronSchedules, executeSchedule]);

  // Auto-run due schedules once a minute while the app is open.
  useEffect(() => {
    const timer = setInterval(() => {
      runDueSchedules().catch(err => console.error("Failed to run due blog schedules:", err));
    }, 60_000);
    return () => clearInterval(timer);
  }, [runDueSchedules]);

  /**
   * Phase 1 — generate the section image and keep it as a UI-only preview.
   * The raw base64 data URL is stored on `previewDataUrl` and is NEVER written into
   * the blog markdown. Phase 2 (`handleUploadSectionImage`) uploads it to Cloudinary
   * and only then inserts the hosted URL into the post.
   */
  const handleGenerateSectionImage = useCallback(async (promptObj: SectionImagePrompt) => {
    if (!blogResult || generatingPromptId) return;
    setGeneratingPromptId(promptObj.id);

    try {
      const aspectRatio = promptObj.aspectRatio || '16:9';
      const generatedDataUrl = await generateInfographicImage(promptObj.prompt, aspectRatio as any);

      // Regeneration of an ALREADY-EMBEDDED image (markdown contains the old hosted
      // URL): upload the new preview and swap the URL in place so the rendered
      // figure updates on screen. No extra upload click needed.
      const oldUrl = promptObj.generatedUrl;
      const isEmbedded = Boolean(oldUrl && blogResult.markdownContent.includes(oldUrl));

      if (isEmbedded) {
        const hostedUrl = await uploadImageToCloudinary(generatedDataUrl, 'blog-images');
        const updatedMarkdown = blogResult.markdownContent.split(oldUrl!).join(hostedUrl);
        const updatedPrompts = (blogResult.sectionImagePrompts || []).map((p: SectionImagePrompt) => {
          if (p.id === promptObj.id || p.prompt === promptObj.prompt) {
            return { ...p, generatedUrl: hostedUrl, previewDataUrl: undefined, aspectRatio };
          }
          return p;
        });
        const imageMatches = updatedMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];

        const updatedResult = {
          ...blogResult,
          markdownContent: updatedMarkdown,
          characterCount: updatedMarkdown.length,
          readingTimeMinutes: Math.max(1, Math.ceil(updatedMarkdown.split(/\s+/).filter(Boolean).length / 200)),
          embeddedImagesCount: imageMatches.length,
          sectionImagePrompts: updatedPrompts
        };
        setBlogResult(updatedResult);

        const record = activeDraftId
          ? savedBlogDrafts.find(d => d.id === activeDraftId)
          : savedBlogDrafts.find(d => d.publishedEndpointId && d.title === blogResult.title);
        await handleSaveBlogDraft({
          id: record?.id || activeDraftId || undefined,
          title: updatedResult.title,
          slug: updatedResult.slug,
          excerpt: updatedResult.excerpt,
          metaDescription: updatedResult.metaDescription,
          keywords: updatedResult.keywords,
          markdownContent: updatedResult.markdownContent,
          characterCount: updatedResult.characterCount,
          readingTimeMinutes: updatedResult.readingTimeMinutes,
          embeddedImagesCount: updatedResult.embeddedImagesCount,
          sectionImagePrompts: updatedResult.sectionImagePrompts,
          relatedPosts: updatedResult.relatedPosts
        }, record?.status === 'published' ? 'published' : 'draft');
        toast.success("Section image regenerated and replaced.");
      } else {
        // Fresh generation (or the prompt token is still in the markdown): keep the
        // result as a UI-only preview and drop any stale generatedUrl so the
        // preview + "Upload Image to Blog" card renders.
        const updatedPrompts = (blogResult.sectionImagePrompts || []).map((p: SectionImagePrompt) => {
          if (p.id === promptObj.id || p.prompt === promptObj.prompt) {
            const { generatedUrl: _staleUrl, ...rest } = p;
            return { ...rest, previewDataUrl: generatedDataUrl, aspectRatio };
          }
          return p;
        });

        setBlogResult({
          ...blogResult,
          sectionImagePrompts: updatedPrompts
        });
      }
    } catch (err: any) {
      console.error("Failed to generate section image:", err);
      toast.error("Failed to generate the section image. Please try again.");
    } finally {
      setGeneratingPromptId(null);
    }
  }, [blogResult, generatingPromptId, activeDraftId, savedBlogDrafts, handleSaveBlogDraft]);

  /**
   * Phase 2 — upload the generated preview to Cloudinary and only then embed the
   * returned hosted URL in the blog markdown (replacing the [IMAGE_PROMPT: ...] tag).
   */
  const handleUploadSectionImage = useCallback(async (promptObj: SectionImagePrompt) => {
    if (!blogResult || uploadingPromptId || !promptObj.previewDataUrl) return;
    setUploadingPromptId(promptObj.id);

    try {
      const hostedUrl = await uploadImageToCloudinary(promptObj.previewDataUrl, 'blog-images');

      let updatedMarkdown = blogResult.markdownContent;
      const markdownImageTag = `![Section Illustration: ${promptObj.prompt.slice(0, 35)}](${hostedUrl})`;

      if (promptObj.generatedUrl && updatedMarkdown.includes(promptObj.generatedUrl)) {
        updatedMarkdown = updatedMarkdown.split(promptObj.generatedUrl).join(hostedUrl);
      } else if (promptObj.tag && updatedMarkdown.includes(promptObj.tag)) {
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
        if (p.id === promptObj.id || p.prompt === promptObj.prompt) {
          return { ...p, generatedUrl: hostedUrl, previewDataUrl: undefined };
        }
        return p;
      });

      const imageMatches = updatedMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];

      const updatedResult = {
        ...blogResult,
        markdownContent: updatedMarkdown,
        characterCount: updatedMarkdown.length,
        readingTimeMinutes: Math.max(1, Math.ceil(updatedMarkdown.split(/\s+/).filter(Boolean).length / 200)),
        embeddedImagesCount: imageMatches.length,
        sectionImagePrompts: updatedPrompts
      };
      setBlogResult(updatedResult);

      // Persist immediately so an uploaded image is never lost by navigating away,
      // refreshing, or reopening the post from the Published list. Preserves the
      // record's published status/identity so published posts stay published.
      const record = activeDraftId
        ? savedBlogDrafts.find(d => d.id === activeDraftId)
        : savedBlogDrafts.find(d => d.publishedEndpointId && d.title === blogResult.title);
      await handleSaveBlogDraft({
        id: record?.id || activeDraftId || undefined,
        title: updatedResult.title,
        slug: updatedResult.slug,
        excerpt: updatedResult.excerpt,
        metaDescription: updatedResult.metaDescription,
        keywords: updatedResult.keywords,
        markdownContent: updatedResult.markdownContent,
        characterCount: updatedResult.characterCount,
        readingTimeMinutes: updatedResult.readingTimeMinutes,
        embeddedImagesCount: updatedResult.embeddedImagesCount,
        sectionImagePrompts: updatedResult.sectionImagePrompts,
        relatedPosts: updatedResult.relatedPosts
      }, record?.status === 'published' ? 'published' : 'draft');
    } catch (err: any) {
      console.error("Failed to upload section image:", err);
      toast.error("Failed to upload the section image. Check your connection and try again.");
    } finally {
      setUploadingPromptId(null);
    }
  }, [blogResult, uploadingPromptId, activeDraftId, savedBlogDrafts, handleSaveBlogDraft]);

  const handleMarkdownContentEdit = useCallback((newMarkdown: string) => {
    if (!blogResult) return;
    const wordCount = newMarkdown.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const imageMatches = newMarkdown.match(/!\[.*?\]\(.*?\)/g) || [];

    const promptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/gi;
    const existingPrompts = new Map(
      (blogResult.sectionImagePrompts || []).map(p => [p.prompt.trim().toLowerCase(), p])
    );
    const sectionImagePrompts: SectionImagePrompt[] = [];
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = promptRegex.exec(newMarkdown)) !== null) {
      count++;
      const promptText = match[1].trim();
      const prev = existingPrompts.get(promptText.toLowerCase());
      sectionImagePrompts.push(prev
        ? { ...prev, tag: match[0] }
        : { id: `img_prompt_edit_${Date.now()}_${count}`, prompt: promptText, tag: match[0] });
    }

    setBlogResult({
      ...blogResult,
      markdownContent: newMarkdown,
      characterCount: newMarkdown.length,
      readingTimeMinutes,
      embeddedImagesCount: imageMatches.length,
      sectionImagePrompts: sectionImagePrompts.length > 0 ? sectionImagePrompts : (blogResult.sectionImagePrompts || [])
    });
  }, [blogResult]);

  const handleAddCustomImagePrompt = useCallback(() => {
    if (!blogResult || !customSectionPromptInput.trim()) return;
    const promptText = customSectionPromptInput.trim();
    const tag = `[IMAGE_PROMPT: ${promptText}]`;
    const newMarkdown = `${blogResult.markdownContent}\n\n${tag}\n\n`;

    setCustomSectionPromptInput('');
    handleMarkdownContentEdit(newMarkdown);
  }, [blogResult, customSectionPromptInput, handleMarkdownContentEdit]);

  const handleSaveTitleEdit = useCallback(() => {
    if (!blogResult || !customTitleInput.trim()) return;
    const newTitle = customTitleInput.trim();
    const newSlug = makeUniqueSlug(newTitle, activeDraftId || undefined);
    const updated = { ...blogResult, title: newTitle, slug: newSlug };
    setBlogResult(updated);
    setIsEditingTitle(false);

    const existingRecord = activeDraftId
      ? savedBlogDrafts.find(d => d.id === activeDraftId)
      : undefined;
    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: newTitle,
      slug: newSlug,
      markdownContent: blogResult.markdownContent
    }, existingRecord?.status === 'published' ? 'published' : 'draft');
  }, [blogResult, customTitleInput, activeDraftId, handleSaveBlogDraft, savedBlogDrafts]);

  // AI SEO suggestions
  const suggestSeo = useCallback(async () => {
    if (!blogResult || isSeoSuggesting) return;
    setIsSeoSuggesting(true);
    try {
      const existingSlugs = savedBlogDrafts
        .map(d => (d.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim())
        .filter(Boolean);
      const suggestions = await suggestBlogSeo(blogResult.title, blogResult.markdownContent, existingSlugs);
      setSeoSuggestions(suggestions);
    } catch (err: any) {
      console.error("Failed to generate SEO suggestions:", err);
      toast.error("Failed to generate SEO suggestions. Please try again.");
      setSeoSuggestions(null);
    } finally {
      setIsSeoSuggesting(false);
    }
  }, [blogResult, isSeoSuggesting, savedBlogDrafts]);

  const applySeoTitle = useCallback((newTitle: string) => {
    if (!blogResult) return;
    const newSlug = makeUniqueSlug(newTitle, activeDraftId || undefined);
    const updated = { ...blogResult, title: newTitle, slug: newSlug };
    setBlogResult(updated);
    setSeoSuggestions(prev => prev ? { ...prev, titleOptions: prev.titleOptions.filter(t => t !== newTitle) } : prev);
    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: newTitle,
      slug: newSlug,
      markdownContent: blogResult.markdownContent
    }, 'draft');
  }, [blogResult, activeDraftId, handleSaveBlogDraft]);

  const applySeoMeta = useCallback((newMeta: string) => {
    if (!blogResult) return;
    const updated = { ...blogResult, metaDescription: newMeta, excerpt: newMeta };
    setBlogResult(updated);
    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: blogResult.title,
      metaDescription: newMeta,
      excerpt: newMeta,
      markdownContent: blogResult.markdownContent
    }, 'draft');
  }, [blogResult, activeDraftId, handleSaveBlogDraft]);

  const applySeoKeywords = useCallback((newKeywords: string[]) => {
    if (!blogResult) return;
    const updated = { ...blogResult, keywords: newKeywords };
    setBlogResult(updated);
    setBlogSeoKeywords(newKeywords.join(', '));
    handleSaveBlogDraft({
      id: activeDraftId || undefined,
      title: blogResult.title,
      keywords: newKeywords,
      markdownContent: blogResult.markdownContent
    }, 'draft');
  }, [blogResult, activeDraftId, handleSaveBlogDraft]);

  return {
    // generator controls
    savedCampaigns,
    selectedCampaignId,
    setSelectedCampaignId,
    blogTopicOverride,
    setBlogTopicOverride,
    blogTone,
    setBlogTone,
    blogWordCount,
    setBlogWordCount,
    blogAudience,
    setBlogAudience,
    blogSeoKeywords,
    setBlogSeoKeywords,
    // generation
    isGeneratingBlog,
    blogResult,
    setBlogResult,
    blogViewMode,
    setBlogViewMode,
    isBlogCopied,
    setIsBlogCopied,
    isSavingDraft,
    setIsSavingDraft,
    draftSaveSuccess,
    setDraftSaveSuccess,
    isDownloadingMd,
    setIsDownloadingMd,
    // drafts
    savedBlogDrafts,
    setSavedBlogDrafts,
    activeDraftId,
    setActiveDraftId,
    publishedBlogPosts,
    // schedules
    cronSchedules,
    newCronTitle,
    setNewCronTitle,
    newCronExpression,
    setNewCronExpression,
    selectedDraftForScheduleId,
    setSelectedDraftForScheduleId,
    scheduleDateTime,
    setScheduleDateTime,
    scheduleSuccessFeedback,
    setScheduleSuccessFeedback,
    // endpoints
    publishEndpoints,
    selectedEndpointId,
    setSelectedEndpointId,
    editingEndpoint,
    setEditingEndpoint,
    isEndpointModalOpen,
    setIsEndpointModalOpen,
    // section images / title edit
    generatingPromptId,
    uploadingPromptId,
    customSectionPromptInput,
    setCustomSectionPromptInput,
    isEditingTitle,
    setIsEditingTitle,
    customTitleInput,
    setCustomTitleInput,
    // publishing
    isPublishing,
    publishingDraftId,
    // SEO suggestions
    isSeoSuggesting,
    seoSuggestions,
    setSeoSuggestions,
    // new-post composer
    isNewPostComposerOpen,
    setIsNewPostComposerOpen,
    newPostIdeaInput,
    setNewPostIdeaInput,
    ideaOptions,
    setIdeaOptions,
    isGeneratingIdeas,
    isCuratingBlogBrief,
    setIsCuratingBlogBrief,
    curateBlogBrief,
    generateTopicIdeas,
    // node-diagram toggle
    nodeDiagramsEnabled,
    setNodeDiagramsEnabled,
    // handlers
    formatCronExpression,
    generateBlogPost,
    handleSaveBlogDraft,
    handleDeleteBlogDraft,
    handleSaveCronSchedule,
    handleDeleteCronSchedule,
    runDueSchedules,
    runScheduleNow,
    handleSaveEndpointsList,
    handleDeleteEndpoint,
    handlePublishBlogToEndpoint,
    handleUpdatePublishedPost,
    findPublishedRecord,
    hasUnpublishedChanges,
    handleGenerateSectionImage,
    handleUploadSectionImage,
    handleMarkdownContentEdit,
    handleAddCustomImagePrompt,
    handleSaveTitleEdit,
    suggestSeo,
    applySeoTitle,
    applySeoMeta,
    applySeoKeywords,
  };
};

export type UseBlogEngineReturn = ReturnType<typeof useBlogEngine>;
