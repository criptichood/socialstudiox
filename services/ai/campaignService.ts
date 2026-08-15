import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, Language, SocialPostCampaignItem, BlogPostResult, SearchResultItem, gatewayBackendForId } from "@/types";
import { loadModelSettings } from "@/services/ai/modelService";

export type { BlogPostResult, SearchResultItem };

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language,
  resolution: AspectRatio,
  subOptions?: Record<string, string>
): Promise<ResearchResult> => {
  const response = await fetch("/api/campaign/research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      level,
      style,
      language,
      resolution,
      subOptions
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Factual research failed");
  }

  return await response.json();
};

export const generateSocialCampaign = async (
  websiteUrl: string,
  mainTopic: string,
  platform: string,
  postCount: number,
  refinementInstructions?: string,
  templateName?: string,
  modelName?: string
): Promise<SocialPostCampaignItem[]> => {
  console.log("[Client] Sending campaign generation request:", {
    websiteUrl,
    mainTopic,
    platform,
    postCount,
    refinementInstructions,
    templateName,
    modelName
  });

  try {
    const response = await fetch("/api/campaign/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        websiteUrl,
        mainTopic,
        platform,
        postCount,
        refinementInstructions,
        templateName,
        modelName
      })
    });

    console.log("[Client] Campaign generation HTTP response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Client] Campaign generation failed on server:", errorData);
      throw new Error(errorData.error || "Campaign generation failed");
    }

    const data = await response.json();
    console.log("[Client] Campaign generation succeeded, posts count:", data.posts?.length || 0);
    return data.posts;
  } catch (error) {
    console.error("[Client] Error in generateSocialCampaign fetch:", error);
    throw error;
  }
};

export const generateSingleSocialPost = async (
  websiteUrl: string,
  campaignTopic: string,
  platform: string,
  customInstructions: string,
  existingPostsCount: number,
  modelName?: string
): Promise<SocialPostCampaignItem> => {
  const response = await fetch("/api/campaign/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "generate",
      websiteUrl,
      campaignTopic,
      platform,
      customInstructions,
      existingPostsCount,
      modelName
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate single post");
  }

  const data = await response.json();
  return data.post;
};

export const refineSingleSocialPost = async (
  currentPost: SocialPostCampaignItem,
  refineInstruction: string,
  platform: string,
  modelName?: string
): Promise<SocialPostCampaignItem> => {
  const response = await fetch("/api/campaign/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "refine",
      currentPost,
      refineInstruction,
      platform,
      modelName
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to refine post");
  }

  const data = await response.json();
  return data.post;
};

export type ResearchChatPhaseEvent =
  | { type: 'searching' }
  | { type: 'found'; count: number }
  | { type: 'synthesizing' }
  | { type: 'done' };

export interface ResearchChatResult {
  reply: string;
  searchResults?: SearchResultItem[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
}

export const conductResearchChat = async (
  messages: { role: 'user' | 'model'; content: string }[],
  companyInfo?: string,
  mode: 'grounded' | 'deep' = 'grounded',
  competitorWebsite?: string,
  model?: string,
  groundingEnabled: boolean = true,
  backend?: 'gemini' | 'gateway',
  imageUrls?: string[],
  onPhase?: (phase: ResearchChatPhaseEvent) => void,
  nodeDiagramsEnabled: boolean = true
): Promise<ResearchChatResult> => {
  const response = await fetch("/api/campaign/research-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages,
      companyInfo,
      mode,
      competitorWebsite,
      model,
      groundingEnabled,
      backend,
      imageUrls,
      nodeDiagramsEnabled
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Research chat failed");
  }
  if (!response.body) {
    throw new Error("Research chat failed: no response stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: ResearchChatResult | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const line = event.trim().replace(/^data: ?/, '');
      if (!line) continue;
      let data: any;
      try {
        data = JSON.parse(line);
      } catch {
        continue;
      }
      if (data.phase) {
        onPhase?.(data.phase);
        continue;
      }
      if (data.error) {
        throw new Error(data.error);
      }
      result = data;
    }
  }

  if (!result?.reply) {
    throw new Error("Research chat failed: no reply");
  }
  return result;
};

export const generateBlogPostFromCampaign = async (
  topic: string,
  campaignSummary: string,
  availableImages: { title: string; url: string }[] = [],
  companyContext: string = '',
  targetTone: string = 'Informative, Authoritative & Actionable Guide',
  targetWordCount: number = 1200,
  targetAudience: string = 'General / Mixed Audience',
  seoKeywords: string[] = [],
  previousPosts: { title: string; slug?: string; metaDescription?: string; keywords?: string[] }[] = [],
  modelName?: string,
  backend?: 'gemini' | 'gateway',
  siteBaseUrl?: string,
  nodeDiagramsEnabled?: boolean
): Promise<BlogPostResult> => {
  const effModel = modelName || loadModelSettings().text || 'gemini-3.5-flash';
  const response = await fetch("/api/campaign/blog", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      topic,
      campaignSummary,
      availableImages,
      companyContext,
      targetTone,
      targetWordCount,
      targetAudience,
      seoKeywords,
      previousPosts,
      model: effModel,
      backend: backend || gatewayBackendForId('text', effModel),
      siteBaseUrl,
      nodeDiagramsEnabled
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Blog post generation failed");
  }

  return await response.json();
};

export interface BlogSeoSuggestionResult {
  titleOptions: string[];
  metaDescription: string;
  keywords: string[];
}

export const suggestBlogSeo = async (
  title: string,
  markdownContent: string,
  existingSlugs: string[] = [],
  modelName?: string,
  backend?: 'gemini' | 'gateway'
): Promise<BlogSeoSuggestionResult> => {
  const effModel = modelName || loadModelSettings().text || 'gemini-3.5-flash';
  const response = await fetch("/api/campaign/blog-seo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      markdownContent,
      existingSlugs,
      model: effModel,
      backend: backend || gatewayBackendForId('text', effModel)
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "SEO suggestions failed");
  }

  const data = await response.json();
  return {
    titleOptions: data.titleOptions || [],
    metaDescription: data.metaDescription || '',
    keywords: data.keywords || []
  };
};

export interface BlogTopicIdea {
  title: string;
  angle: string;
  /** Set when this topic would genuinely benefit from a node-diagram flowchart. */
  diagram?: 'process' | 'pipeline' | 'architecture' | 'funnel' | 'sequence' | 'none';
  /** Short human-readable hint describing what the diagram should visualize. */
  diagramHint?: string;
}

export const suggestBlogTopics = async (
  previousPosts: { title: string; slug?: string; metaDescription?: string; keywords?: string[] }[] = [],
  modelName?: string,
  backend?: 'gemini' | 'gateway'
): Promise<BlogTopicIdea[]> => {
  const effModel = modelName || loadModelSettings().text || 'gemini-3.5-flash';
  const response = await fetch("/api/campaign/blog-topics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      previousPosts,
      model: effModel,
      backend: backend || gatewayBackendForId('text', effModel)
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Blog topic suggestions failed");
  }

  const data = await response.json();
  return Array.isArray(data.ideas) ? data.ideas : [];
};
