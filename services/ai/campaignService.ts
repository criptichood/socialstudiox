import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, Language, SocialPostCampaignItem, BlogPostResult, SearchResultItem } from "@/types";

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

export const conductResearchChat = async (
  messages: { role: 'user' | 'model'; content: string }[],
  companyInfo?: string,
  mode: 'grounded' | 'deep' = 'grounded',
  competitorWebsite?: string,
  model?: string
): Promise<{
  reply: string;
  searchResults?: SearchResultItem[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
}> => {
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
      model
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Research chat failed");
  }

  return await response.json();
};

export const generateBlogPostFromCampaign = async (
  topic: string,
  campaignSummary: string,
  availableImages: { title: string; url: string }[] = [],
  companyContext: string = '',
  targetTone: string = 'Informative, Authoritative & Actionable Guide',
  targetWordCount: number = 1200,
  targetAudience: string = 'General / Mixed Audience',
  seoKeywords: string[] = []
): Promise<BlogPostResult> => {
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
      seoKeywords
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Blog post generation failed");
  }

  return await response.json();
};
