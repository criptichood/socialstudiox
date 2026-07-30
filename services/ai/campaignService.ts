import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, SocialPostCampaignItem } from "../../types";
import { 
  getAi, 
  TEXT_MODEL, 
  getLevelInstruction, 
  getStyleInstruction, 
  getLanguageInstruction, 
  getResolutionInstruction 
} from "./config";

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language,
  resolution: AspectRatio,
  subOptions?: Record<string, string>
): Promise<ResearchResult> => {
  
  const levelInstr = getLevelInstruction(level);
  const styleInstr = getStyleInstruction(style, subOptions);
  const langInstr = getLanguageInstruction(language);
  const resInstr = getResolutionInstruction(resolution);

  const systemPrompt = `
    You are an expert production-grade visual researcher and premium prompt engineer.
    Your goal is to research the topic: "${topic}" and create a highly professional plan for an infographic/educational visual.
    
    **IMPORTANT: Use the Google Search tool to find the most accurate, up-to-date scientific, historic, or factual information about this topic.**
    
    Target Settings & Constraints:
    - ${levelInstr}
    - ${styleInstr}
    - ${langInstr}
    - ${resInstr}
    
    You must output your response in the following format EXACTLY:
    
    FACTS:
    - [Factual Bullet 1: Clear, educational point discovered via search grounding, written in the target language]
    - [Factual Bullet 2: Second critical educational point]
    - [Factual Bullet 3: Third critical educational point]
    - [Factual Bullet 4: Key takeaway point]
    
    IMAGE_PROMPT:
    [Construct a highly descriptive, professional-grade visual prompt for an image generator. 
     Describe the exact visual composition: what is in the center, what is around it, the background layout, 
     specific design markers, colors, and textures based on the aesthetic guidelines provided above. 
     Write the prompt as a clean, self-contained description. Do not use quotes or citation symbols. 
     Specify that labels and titles should be written in the specified target language and that the image orientation is strictly ${resolution}.]
  `;

  const response = await getAi().models.generateContent({
    model: TEXT_MODEL,
    contents: systemPrompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  
  // Parse Facts
  const factsMatch = text.match(/FACTS:\s*([\s\S]*?)(?=IMAGE_PROMPT:|$)/i);
  const factsRaw = factsMatch ? factsMatch[1].trim() : "";
  const facts = factsRaw.split('\n')
    .map(f => f.replace(/^-\s*/, '').trim())
    .filter(f => f.length > 0)
    .slice(0, 5);

  // Parse Prompt
  const promptMatch = text.match(/IMAGE_PROMPT:\s*([\s\S]*?)$/i);
  const imagePrompt = promptMatch ? promptMatch[1].trim() : `Create a detailed illustration about ${topic}. ${levelInstr} ${styleInstr}`;

  // Extract Grounding (Search Results)
  const searchResults: SearchResultItem[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  
  if (chunks) {
    chunks.forEach(chunk => {
      if (chunk.web?.uri && chunk.web?.title) {
        searchResults.push({
          title: chunk.web.title,
          url: chunk.web.uri
        });
      }
    });
  }

  // Remove duplicates based on URL
  const uniqueResults = Array.from(new Map(searchResults.map(item => [item.url, item])).values());

  return {
    imagePrompt: imagePrompt,
    facts: facts,
    searchResults: uniqueResults
  };
};

export const generateSocialCampaign = async (
  websiteUrl: string,
  mainTopic: string,
  platform: string,
  postCount: number,
  refinementInstructions?: string,
  templateName?: string,
  modelName: string = TEXT_MODEL
): Promise<SocialPostCampaignItem[]> => {
  let templatePrompt = "";
  if (templateName) {
    switch (templateName) {
      case "carousel_step_by_step":
        templatePrompt = `Campaign Format Template: Step-by-Step Educational Carousel Deck. Each post MUST be a multi-slide Carousel Deck (set "isCarousel": true and provide 4 to 6 structured "slides"). Slide 1 is the Attention Hook Cover, Slides 2-5 breakdown actionable step-by-step methods with clear visual prompts and content text, and the final Slide is a Summary & CTA.`;
        break;
      case "carousel_product_feature":
        templatePrompt = `Campaign Format Template: Feature Deep-Dive Storyboard Carousel. Each post MUST be a multi-slide Carousel Deck (set "isCarousel": true and provide 4 to 5 structured "slides") detailing unique feature highlights, real dashboard callouts, visual diagrams, and customer benefits across sequential slides.`;
        break;
      case "carousel_infographic_story":
        templatePrompt = `Campaign Format Template: Infographic & Data Visual Carousel Deck. Each post MUST be a multi-slide Carousel Deck (set "isCarousel": true and provide 4 to 6 structured "slides") breaking down statistics, visual charts, before-and-after metrics, and key data points across slides.`;
        break;
      case "carousel_listicle_quotes":
        templatePrompt = `Campaign Format Template: Top Tips & Listicle Carousel Deck. Each post MUST be a multi-slide Carousel Deck (set "isCarousel": true and provide 4 to 6 structured "slides") sharing actionable tips, framework pillars, or quote callouts per slide.`;
        break;
      case "product_launch":
        templatePrompt = `Campaign Format Template: Product Launch & Feature Showcase. Each post should highlight a distinct core feature, solve specific customer pain points, detail unique value propositions, and contain compelling CTA hooks to drive product registration or testing.`;
        break;
      case "educational":
        templatePrompt = `Campaign Format Template: Educational Carousel & Deep Dive. Focus on high-value industry educational concepts, breakdown complex workflows step-by-step, set "isCarousel": true with 4 to 6 structured "slides" per carousel post.`;
        break;
      case "viral":
        templatePrompt = `Campaign Format Template: Relatable Viral Angles & Trendjacking. Craft fun, highly engaging, conversational brand humor, sector-wide debates, or thought-provoking questions designed to drive massive comments, shares, and bookmarks.`;
        break;
      case "roundup":
        templatePrompt = `Campaign Format Template: Weekly Industry News & Roundup. Curate the latest sector events, tech updates, industry changes, and expert commentary from the field.`;
        break;
      case "success":
        templatePrompt = `Campaign Format Template: Case Study & Customer Success. Focus on real-world problem solving, customer testimonial quotes, performance metrics, and direct before-and-after case analyses.`;
        break;
      case "qa":
        templatePrompt = `Campaign Format Template: Interactive FAQ & Community Q&A. Focus on answering common customer questions, quick interactive quizzes, and hosting community feedback loops.`;
        break;
    }
  }

  const prompt = `
    You are an expert Social Media Campaign Strategist, Visual Carousel Creator, and Premium Growth Marketer.
    Your goal is to research the following company/website: "${websiteUrl}"
    and plan a highly engaging, high-performing campaign about: "${mainTopic}" for platform: "${platform}".
    
    Generate exactly ${postCount} highly tailored posts/carousels.
    
    ${templatePrompt ? `**CRITICAL TEMPLATE GOAL**: ${templatePrompt}` : ""}
    
    **IMPORTANT**: Use the Google Search tool to search for the company website "${websiteUrl}" and find exactly what they do, their branding style, colors, and key value propositions.
    Also search for high-trending ${platform} hashtags, trends, and viral angles relevant to this business sector.
    
    **CAMPAIGN NARRATIVE CONTINUITY**:
    Ensure that Post #1, Post #2, Post #3... form a cohesive, back-to-back narrative sequence where each post seamlessly builds upon the previous post's concepts without breaking topic context or branding tone.
    If the template is a Carousel or if the visual style is "Carousel", set "isCarousel": true for every post and generate 3 to 6 detailed slides per post.

    
    You must return your response as a JSON array of post objects. Each object in the array MUST strictly follow this JSON structure:
    {
      "day": "Post Title/Day (e.g. Carousel Deck 1: Step-by-Step Breakdown)",
      "topic": "Clean topic name",
      "visualPrompt": "A highly detailed, professional-grade descriptive prompt for our cover visual knowledge generator. Tell it exactly how to illustrate this topic: central subject, layout composition, background, color theme, icons, and precise text labels matching the company branding. Tell it to render it in high-contrast.",
      "caption": "An engaging, high-converting social media caption tailored for ${platform}. Include hooks, main benefits, and clear calls-to-action.",
      "hashtags": ["tag1", "tag2"],
      "suggestedStyle": "Carousel",
      "aspectRatio": "1:1",
      "isCarousel": true,
      "voiceOver": "A professional 10-15 second spoken voiceover script that fits this post perfectly, written in the company tone.",
      "videoPrompt": "A detailed visual scene-by-scene script/prompt for an AI video generator (like VEO) that describes the motion, lighting, and transitions of this post/scene in detail.",
      "slides": [
        {
          "slideNumber": 1,
          "title": "Slide Cover Title / Hook",
          "visualPrompt": "Detailed visual prompt for generating slide 1 image...",
          "contentText": "Short punchy text on slide 1",
          "voiceOver": "A professional 5-10 second spoken voiceover script that fits this slide perfectly.",
          "videoPrompt": "A detailed visual scene script/prompt for an AI video generator (like VEO) that describes the motion, panning, zooming, and animations of this specific slide/scene."
        },
        {
          "slideNumber": 2,
          "title": "Slide 2 Title / Key Insight",
          "visualPrompt": "Detailed visual prompt for generating slide 2 image...",
          "contentText": "Actionable explanation or data point",
          "voiceOver": "A professional 5-10 second spoken voiceover script that fits this slide perfectly.",
          "videoPrompt": "A detailed visual scene script/prompt for an AI video generator (like VEO) that describes the motion, panning, zooming, and animations of this specific slide/scene."
        }
      ]
    }

    The "suggestedStyle" property MUST be one of: "Default", "Minimalist", "Realistic", "Cartoon", "Vintage", "Futuristic", "3D Render", "Sketch", "Carousel".
    The "aspectRatio" property MUST be one of: "16:9", "9:16", "1:1".
    If a post is a multi-slide carousel, set "isCarousel": true and include 3 to 6 slides in the "slides" array.
    
    Return ONLY a valid JSON array. Do not include markdown wraps, code block symbols, or any introductory/concluding text.
  `;

  const response = await getAi().models.generateContent({
    model: modelName || TEXT_MODEL,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: 'application/json'
    },
  });

  const text = response.text || "[]";
  try {
    return JSON.parse(text) as SocialPostCampaignItem[];
  } catch (err) {
    console.error("Failed to parse campaign JSON, falling back", err);
    // Attempt cleaning if there are surrounding markdown ticks
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as SocialPostCampaignItem[];
  }
};

export const generateSingleSocialPost = async (
  websiteUrl: string,
  campaignTopic: string,
  platform: string,
  customInstructions: string,
  existingPostsCount: number,
  modelName: string = TEXT_MODEL
): Promise<SocialPostCampaignItem> => {
  const prompt = `
    You are an expert Social Media Campaign Strategist and Premium Growth Marketer.
    We are running a campaign on ${platform} with the main topic/objective: "${campaignTopic}".
    The brand website is "${websiteUrl}".
    There are currently ${existingPostsCount} posts in this campaign.
    
    Your goal is to generate exactly ONE additional high-quality, high-performing post for this campaign.
    Focus specifically on this angle, instruction, or topic for the new post: "${customInstructions}".
    
    You must return your response as a single JSON object. It MUST strictly follow this JSON structure:
    {
      "day": "Post Title/Day (e.g. Day ${existingPostsCount + 1}: Promo Special or Post #${existingPostsCount + 1})",
      "topic": "Clean topic name",
      "visualPrompt": "A highly detailed, professional-grade descriptive prompt for our visual knowledge generator. Tell it exactly how to illustrate this topic: central subject, layout composition, background, color theme, icons, and precise text labels matching the company branding. Tell it to render it in high-contrast.",
      "caption": "An engaging, high-converting social media caption tailored for ${platform}. Include hooks, main benefits, and clear calls-to-action.",
      "hashtags": ["tag1", "tag2"],
      "suggestedStyle": "Default",
      "aspectRatio": "1:1",
      "voiceOver": "A professional 10-15 second spoken voiceover script that fits this post perfectly, written in the company tone.",
      "videoPrompt": "A detailed visual scene-by-scene script/prompt for an AI video generator (like VEO) that describes the motion, lighting, and transitions of this post/scene in detail."
    }

    The "suggestedStyle" property MUST be one of: "Default", "Minimalist", "Realistic", "Cartoon", "Vintage", "Futuristic", "3D Render", "Sketch".
    The "aspectRatio" property MUST be one of: "16:9", "9:16", "1:1".
    
    Return ONLY a valid JSON object. Do not include markdown wraps, code block symbols, or any introductory/concluding text.
  `;

  const response = await getAi().models.generateContent({
    model: modelName || TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as SocialPostCampaignItem;
  } catch (err) {
    console.error("Failed to parse single post JSON, falling back", err);
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as SocialPostCampaignItem;
  }
};

export const refineSingleSocialPost = async (
  currentPost: SocialPostCampaignItem,
  refineInstruction: string,
  platform: string,
  modelName: string = TEXT_MODEL
): Promise<SocialPostCampaignItem> => {
  const prompt = `
    You are an expert Social Media Copywriter and Creative Director.
    We have a current social media post for ${platform}:
    Title/Topic: "${currentPost.topic}"
    Visual Prompt: "${currentPost.visualPrompt}"
    Caption: "${currentPost.caption}"
    Hashtags: ${JSON.stringify(currentPost.hashtags)}

    The user wants to refine/modify this specific post with the following instructions:
    "${refineInstruction}"

    Generate an updated and improved version of this post incorporating the user's instructions.
    Return ONLY a single valid JSON object following this exact structure:
    {
      "day": "${currentPost.day || 'Post Item'}",
      "topic": "Updated or preserved topic name",
      "visualPrompt": "Updated detailed visual prompt",
      "caption": "Updated engaging caption",
      "hashtags": ["tag1", "tag2"],
      "suggestedStyle": "${currentPost.suggestedStyle || 'Default'}",
      "aspectRatio": "${currentPost.aspectRatio || '1:1'}",
      "voiceOver": "Updated or preserved spoken voiceover script that fits this post perfectly",
      "videoPrompt": "Updated or preserved detailed visual scene-by-scene script/prompt for an AI video generator (like VEO)"
    }
  `;

  const response = await getAi().models.generateContent({
    model: modelName || TEXT_MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    },
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as SocialPostCampaignItem;
  } catch (err) {
    console.error("Failed to parse refined single post JSON, falling back", err);
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText) as SocialPostCampaignItem;
  }
};

export const conductResearchChat = async (
  messages: { role: 'user' | 'model'; content: string }[],
  companyInfo?: string,
  mode: 'grounded' | 'deep' = 'grounded',
  competitorWebsite?: string
): Promise<{
  reply: string;
  searchResults?: SearchResultItem[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
}> => {
  const isDeepMode = mode === 'deep';

  const systemInstruction = `
    You are an elite AI Multipurpose Content, Video & Competitor Intelligence Strategist for Social Studio X.
    ${companyInfo ? `Target Brand / Website / Context: "${companyInfo}"` : ''}
    ${competitorWebsite ? `Target Competitor Website / Benchmark: "${competitorWebsite}"` : ''}
    RESEARCH MODE: ${isDeepMode ? '🔬 DEEP MARKET & COMPETITOR RESEARCH (Exhaustive Analysis)' : '⚡ REAL-TIME SEARCH GROUNDED (Fast Interactive Strategy)'}

    YOUR CORE CAPABILITIES & METHODOLOGY:
    1. **Multipurpose Video & Content Strategy**:
       - Research and generate viral short-form video concepts (Reels, TikTok, Shorts) and 3-minute video explainer scripts with visual scene directions, camera motions (e.g., cinematic zoom, orbit, macro tilt), voiceover scripts, and audio cues.
       - Outline multi-slide educational carousels, B2B thought leadership posts, and high-converting ad concepts.

    2. **Competitor & Market Intelligence**:
       - Actively search Google using your integrated Google Search tool to scan competitor websites, social media content strategies, posting schedules, and viral hooks in the target industry.
       - If no competitor website is explicitly provided, infer top industry competitors and perform search queries for best-performing social media campaigns in that niche.
       - Analyze how competitors drive audience growth and recommend strategies to resonate with the community.

    3. **Proactive & Conversational Agent Behavior**:
       - Never respond with a blank stub or demand endless inputs.
       - If the user provides a vague or brief idea (e.g. "I want to create video content for my business"), **proactively infer** standard target audiences, key pain points, and 3 viral video angles right away.
       - Offer 2-3 brief, helpful clarifying questions (e.g. target platform, primary CTA) while delivering immediate, complete research recommendations in the response.
       - Proactively suggest logical next steps, such as launching a Video Campaign or running paid social ads.

    ${isDeepMode ? `
    DEEP RESEARCH REPORT STRUCTURE:
    Provide an exhaustive, multi-tier analysis structured with clean Markdown:
    - 🎯 **Market & Competitor Intelligence Matrix**: Competitor strategy breakdown, content gaps, viral angles.
    - 🎥 **Video & Visual Content Blueprint**: Hook options, script breakdown with timestamps, visual camera directions.
    - 🌐 **Audience Traffic & Conversion Funnel**: How to turn video views into website traffic and sales.
    - 📈 **Proactive Next Steps & Campaign Recommendations**.
    ` : ''}

    CRITICAL STRATEGY & VIDEO EXTRACTOR BLOCKS:
    Conclude your response with dedicated extractor boxes whenever suggesting social campaigns or video scripts:

    For Social / Carousel Campaigns:
    ---
    ### 🚀 Recommended Campaign Strategy
    - **Topic**: [Short clean campaign name]
    - **Visual & Campaign Prompt**: [Comprehensive prompt describing post objective, visual layout, and slide structure]
    - **Target Platform**: [Instagram / LinkedIn / TikTok / Twitter]
    - **Aspect Ratio**: [9:16 Portrait / 1:1 Square / 16:9 Landscape]
    - **Visual Style**: [Carousel / Minimalist / Realistic / 3D Render]
    ---

    For Video / Reel / VEO Generation:
    ---
    ### 🎥 Recommended Video Script & Scene Setup
    - **Video Scene Prompt**: [Detailed camera motion & visual description for AI video rendering, e.g., "Cinematic slow motion macro shot of..."]
    - **Full Video Script**: [Voiceover narration & text overlay script with timestamps]
    ---
  `;

  // Format chat history for Gemini API
  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }]
  }));

  const response = await getAi().models.generateContent({
    model: TEXT_MODEL,
    contents,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "I have completed the market and video content research based on current intelligence.";

  // Extract grounding metadata search results if present
  const searchResults: SearchResultItem[] = [];
  try {
    const candidate = response.candidates?.[0];
    const groundingChunks = (candidate as any)?.groundingMetadata?.groundingChunks;
    if (Array.isArray(groundingChunks)) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          searchResults.push({
            title: chunk.web.title,
            url: chunk.web.uri
          });
        }
      });
    }
  } catch (e) {
    console.warn("Could not extract search grounding metadata", e);
  }

  // Parse suggested strategy from text if structured section exists
  let suggestedCampaignTopic: string | undefined;
  let suggestedPrompt: string | undefined;
  let suggestedVideoPrompt: string | undefined;
  let suggestedVideoScript: string | undefined;

  const topicMatch = text.match(/\*\*Topic\*\*:\s*(.+)/i);
  if (topicMatch) {
    suggestedCampaignTopic = topicMatch[1].trim();
  }

  const promptMatch = text.match(/\*\*Visual & Campaign Prompt\*\*:\s*(.+)/i);
  if (promptMatch) {
    suggestedPrompt = promptMatch[1].trim();
  }

  const videoPromptMatch = text.match(/\*\*Video Scene Prompt\*\*:\s*(.+)/i);
  if (videoPromptMatch) {
    suggestedVideoPrompt = videoPromptMatch[1].trim();
  }

  const videoScriptMatch = text.match(/\*\*Full Video Script\*\*:\s*([\s\S]+?)(?:---|$$)/i);
  if (videoScriptMatch) {
    suggestedVideoScript = videoScriptMatch[1].trim();
  }

  return {
    reply: text,
    searchResults,
    suggestedCampaignTopic,
    suggestedPrompt,
    suggestedVideoPrompt,
    suggestedVideoScript
  };
};
