import { AspectRatio, ComplexityLevel, VisualStyle, ResearchResult, SearchResultItem, Language, SocialPostCampaignItem, ModelBackend, GATEWAY_TEXT_DEFAULT } from "../../types";
import { 
  getAi, 
  TEXT_MODEL, 
  SEARCH_MODEL, 
  getLevelInstruction, 
  getStyleInstruction, 
  getLanguageInstruction, 
  getResolutionInstruction 
} from "./config";
import { generateTextViaGateway } from "./gatewayText";

/** Parse a `data:image/...;base64,...` URL into an inline part for @google/genai. */
const imageDataUrlToInlinePart = (dataUrl: string): { mimeType: string; data: string } | null => {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
};

export const researchTopicForPrompt = async (
  topic: string, 
  level: ComplexityLevel, 
  style: VisualStyle,
  language: Language,
  resolution: AspectRatio,
  subOptions?: Record<string, string>,
  customApiKey?: string
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

  const response = await getAi(customApiKey).models.generateContent({
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
  slidesPerPost?: number,
  refinementInstructions?: string,
  templateName?: string,
  modelName: string = TEXT_MODEL,
  customApiKey?: string
): Promise<SocialPostCampaignItem[]> => {
  let templatePrompt = "";
  if (templateName) {
    switch (templateName) {
      case "carousel_step_by_step":
        templatePrompt = `Campaign Format Template: Step-by-Step Educational Carousel Deck. Each post MUST be a multi-slide Carousel Deck (set "isCarousel": true and provide 4 to 6 structured "slides"). Slide 1 is the Attention Hook Cover, Slides 2-5 breakdown actionable step-by-step methods with clear visual prompts and content text, and the final Slide is a Summary (a closing CTA only if the user's objective calls for one).`;
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
        templatePrompt = `Campaign Format Template: Product Launch & Feature Showcase. Each post should highlight a distinct core feature, solve specific customer pain points, and detail unique value propositions. Any CTA (registration, testing, demo) must only be used if it fits the user's stated objective — never force one.`;
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

  const effectiveSlidesPerPost = slidesPerPost && slidesPerPost >= 1 && slidesPerPost <= 12 ? Math.round(slidesPerPost) : 5;

  const prompt = `
    You are an expert Social Media Campaign Strategist and Visual Carousel Creator.
    Your goal is to research the following company/website: "${websiteUrl}"
    and plan a highly engaging, high-performing campaign about: "${mainTopic}" for platform: "${platform}".
    
    Generate exactly ${postCount} post(s). Do NOT generate extra posts beyond this count — each object in the response array is ONE post.
    
    **SLIDE COUNT (USER-SELECTED — OVERRIDES TEMPLATES)**: When a post is a carousel deck, its "slides" array must contain EXACTLY ${effectiveSlidesPerPost} slides — no more, no less. This is the number of carousel slides the user picked for each post; it overrides any slide-count range (e.g. "4 to 6 slides") mentioned in a Content Format Template.
    
    ${templatePrompt ? `**CONTENT FORMAT TEMPLATE (FORMAT-ONLY — NEVER REPLACES THE USER'S OBJECTIVE BELOW)**: ${templatePrompt}` : ""}
    
    **OBJECTIVE FIDELITY (CRITICAL — SINGLE SOURCE OF TRUTH)**:
    - The user's "Main Campaign Topic / Objective" (above) is the single source of truth for what this campaign is about and what it must accomplish. Everything you generate must serve exactly that stated objective.
    - If a Content Format Template is provided, it controls ONLY the structural/visual format (carousel vs single post, slide count, layout). It never defines the campaign's goal, tone, or CTAs. If a template instruction conflicts with the user's stated objective, the user's objective WINS.
    - Match the campaign objective to exactly what the user asked for and to what the topic itself implies. Do NOT invent a lead-generation, sales, or conversion objective.
    - Unless the user explicitly requested lead generation, sign-ups, demos, registrations, or sales, do NOT insert lead-conversion funnels, "30-day lead conversion" plans, demo-booking CTAs, "DM me for a quote", "link in bio to buy", or any sales-pitch framing in captions, visual prompts, or image text.
    - Keep every post in the register of the objective: educational, awareness, brand-building, community, thought-leadership, or entertainment content stays in that register. A call-to-action should only appear when it genuinely fits the objective (e.g. "follow for more", "share your thoughts", "save this guide", "tag a colleague"), never a forced sales push.
    - If the user DID ask for lead generation or sales, only then use conversion-focused CTAs.
    
    **IMPORTANT**: Use the Google Search tool to search for the company website "${websiteUrl}" and find exactly what they do, their branding style, colors, and key value propositions.
    Also search for high-trending ${platform} hashtags, trends, and viral angles relevant to this business sector.
    
    **CAMPAIGN NARRATIVE CONTINUITY**:
    Ensure that Post #1, Post #2, Post #3... form a cohesive, back-to-back narrative sequence where each post seamlessly builds upon the previous post's concepts without breaking topic context or branding tone.
    If the template is a Carousel or if the visual style is "Carousel", set "isCarousel": true for every post and generate exactly ${effectiveSlidesPerPost} detailed slides per post.

    
    You must return your response as a JSON array of post objects. Each object in the array MUST strictly follow this JSON structure:
    {
      "day": "Post Title/Day (e.g. Carousel Deck 1: Step-by-Step Breakdown)",
      "topic": "Clean topic name",
      "visualPrompt": "A highly detailed, professional-grade descriptive prompt for our cover visual knowledge generator. Tell it exactly how to illustrate this topic: central subject, layout composition, background, color theme, icons, and precise text labels matching the company branding. Tell it to render it in high-contrast.",
      "caption": "An engaging social media caption tailored for ${platform}. Include hooks, main benefits, and a call-to-action only if it genuinely fits the topic (see OBJECTIVE FIDELITY above).",
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
    If a post is a multi-slide carousel, set "isCarousel": true and include exactly ${effectiveSlidesPerPost} slides in the "slides" array.
    
    Return ONLY a valid JSON array. Do not include markdown wraps, code block symbols, or any introductory/concluding text.
  `;


  let response;
  try {
    response = await getAi(customApiKey).models.generateContent({
      model: modelName || TEXT_MODEL,
      contents: prompt,
      config: {
        // NOTE: responseMimeType MUST NOT be set when using Google Search grounding tools.
        // Combining tools + responseMimeType causes the API to return empty candidates (no text).
        // Instead we rely on prompt instructions + manual JSON parsing below.
        tools: [{ googleSearch: {} }],
      },
    });
  } catch (apiErr: any) {
    console.error("[Server Service] Gemini API generateContent call failed:", apiErr);
    throw new Error(`Gemini API Call failed: ${apiErr?.message || apiErr}`);
  }

  // IMPORTANT: Do NOT call response.text directly when using Google Search tools.
  // The @google/genai SDK throws "model output must contain either output text or tool calls"
  // if response.text is accessed when the response turn contains only a grounding tool-call part.
  // We must always extract safely from candidates.parts directly.
  const candidates = response.candidates || [];
  const parts = candidates[0]?.content?.parts || [];

  // Extract all text parts and join them
  let text = parts
    .filter((p: { text?: string }) => typeof p.text === 'string')
    .map((p: { text?: string }) => p.text ?? '')
    .join('');

  // If still no text but there are parts, try safe access on response.text as last resort
  if (!text) {
    try {
      text = response.text || '';
    } catch {
      text = '';
    }
  }

  text = text.trim() || '[]';

  try {
    const parsed = JSON.parse(text) as SocialPostCampaignItem[];
    return parsed;
  } catch {
    // Attempt cleaning if there are surrounding markdown ticks
    const cleanedText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    try {
      return JSON.parse(cleanedText) as SocialPostCampaignItem[];
    } catch (cleanErr: any) {
      console.error("[Campaign Service] JSON parse failed. Raw response snippet:", text.substring(0, 300));
      throw new Error(`Failed to parse AI response as JSON: ${cleanErr?.message || cleanErr}`);
    }
  }
};

export const generateSingleSocialPost = async (
  websiteUrl: string,
  campaignTopic: string,
  platform: string,
  customInstructions: string,
  existingPostsCount: number,
  modelName: string = TEXT_MODEL,
  customApiKey?: string
): Promise<SocialPostCampaignItem> => {
  const prompt = `
    You are an expert Social Media Campaign Strategist.
    We are running a campaign on ${platform} with the main topic/objective: "${campaignTopic}".
    The brand website is "${websiteUrl}".
    There are currently ${existingPostsCount} posts in this campaign.
    
    Your goal is to generate exactly ONE additional high-quality, high-performing post for this campaign.
    Focus specifically on this angle, instruction, or topic for the new post: "${customInstructions}".
    
    **OBJECTIVE FIDELITY (CRITICAL)**:
    - Match the post to the campaign topic and instructions exactly as provided. Do NOT invent a lead-generation, sales, or conversion objective.
    - Unless the user explicitly requested lead generation, sign-ups, demos, registrations, or sales, do NOT insert lead-conversion funnels, "30-day lead conversion" plans, demo-booking CTAs, "DM me for a quote", "link in bio to buy", or sales-pitch framing in captions, visual prompts, or image text.
    - Keep the post in the register of the topic (educational, awareness, brand-building, community, thought-leadership, or entertainment). A call-to-action only when it genuinely fits the topic (e.g. "follow for more", "share your thoughts", "save this guide"), never a forced sales push.
    
    You must return your response as a single JSON object. It MUST strictly follow this JSON structure:
    {
      "day": "Post Title/Day (e.g. Day ${existingPostsCount + 1}: Promo Special or Post #${existingPostsCount + 1})",
      "topic": "Clean topic name",
      "visualPrompt": "A highly detailed, professional-grade descriptive prompt for our visual knowledge generator. Tell it exactly how to illustrate this topic: central subject, layout composition, background, color theme, icons, and precise text labels matching the company branding. Tell it to render it in high-contrast.",
      "caption": "An engaging social media caption tailored for ${platform}. Include hooks, main benefits, and a call-to-action only if it genuinely fits the topic (see OBJECTIVE FIDELITY above).",
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

  const response = await getAi(customApiKey).models.generateContent({
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
  modelName: string = TEXT_MODEL,
  customApiKey?: string
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

  const response = await getAi(customApiKey).models.generateContent({
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

export type ResearchChatPhase =
  | { type: 'searching' }
  | { type: 'found'; count: number }
  | { type: 'synthesizing' }
  | { type: 'done' };

export const conductResearchChat = async (
  messages: { role: 'user' | 'model'; content: string }[],
  companyInfo?: string,
  mode: 'grounded' | 'deep' = 'grounded',
  competitorWebsite?: string,
  model?: string,
  customApiKey?: string,
  groundingEnabled: boolean = true,
  backend: ModelBackend = 'gemini',
  imageUrls: string[] = [],
  onPhase?: (phase: ResearchChatPhase) => void,
  nodeDiagramsEnabled: boolean = true
): Promise<{
  reply: string;
  searchResults?: SearchResultItem[];
  suggestedCampaignTopic?: string;
  suggestedPrompt?: string;
  suggestedVideoPrompt?: string;
  suggestedVideoScript?: string;
}> => {
  const isDeepMode = mode === 'deep';
  const useGrounding = groundingEnabled;

  const systemInstruction = `
    You are an elite AI Multipurpose Content, Video & Competitor Intelligence Strategist for Social Studio X.
    ${companyInfo ? `Target Brand / Website / Context: "${companyInfo}"` : ''}
    ${competitorWebsite ? `Target Competitor Website / Benchmark: "${competitorWebsite}"` : ''}
    RESEARCH MODE: ${isDeepMode ? '🔬 DEEP MARKET & COMPETITOR RESEARCH (Exhaustive Analysis)' : '⚡ REAL-TIME SEARCH GROUNDED (Fast Interactive Strategy)'}

    CRITICAL OPERATIONAL RULES:
    1. **Live Search Grounding**: Live Google search results (when present) are injected above and must be treated as the authoritative factual basis for current/external information. If the user greets you, engages in small talk, or asks a general question that does not require real-time facts, ignore the injected search results and simply respond conversationally.
    2. **Conversational Pacing & Matching**: Match the length and complexity of your response to the user's input. For a simple greeting (e.g. "hello"), respond with a warm, concise professional welcome (1-2 sentences) and ask how they can help with their brand strategy today. Do NOT dump your capabilities, list features, or write long essays unless explicitly asked.
    3. **Context & History Awareness**: Review the message history carefully. Avoid repeating greetings, instructions, summaries of capabilities, or general intros that have already occurred in the thread. Keep the conversation rolling naturally.
    4. **Conditional Strategy & Video Extractor Blocks**: Only append the campaign or video extractor markdown boxes (### 🚀 Recommended Campaign Strategy or ### 🎥 Recommended Video Script & Scene Setup) when the user is explicitly asking to generate, draft, or refine a campaign strategy or video script. Never append these boxes for greetings, casual talk, or standard research questions.
    5. ${nodeDiagramsEnabled ? `**Node Diagram Tool (OPTIONAL)**: If your answer explains a process, workflow, pipeline, architecture, decision flow, or numbered sequence where a visual flowchart would dramatically clarify the response, emit ONE compact inline diagram marker on its own line (between blank lines):
       [NODE_DIAGRAM: {"title":"Short Title","nodes":[{"id":"1","label":"Step one"},{"id":"2","label":"Step two","description":"Optional note"}],"edges":[{"source":"1","target":"2","label":"Optional label"}]}]
       - Every node id must be unique; every edge source/target must reference existing ids; 3-8 nodes; keep the whole marker on ONE line with no line breaks inside the JSON; optionally set node "type" to "input" | "process" | "decision" | "output".
       - Only use the diagram tool when a visual flow genuinely adds clarity. Never force one for simple conversational replies.` : `**Node Diagram Tool (DISABLED)**: Do NOT use the [NODE_DIAGRAM: ...] marker or any flowchart/node diagram syntax anywhere in your reply. If you describe a process, pipeline, or step-by-step sequence, explain it naturally in plain Markdown using numbered lists, tables, or subheadings instead.`}

    YOUR CORE CAPABILITIES & METHODOLOGY:
    1. **Multipurpose Video & Content Strategy**:
       - Research and generate viral short-form video concepts (Reels, TikTok, Shorts) and 3-minute video explainer scripts with visual scene directions, camera motions (e.g., cinematic zoom, orbit, macro tilt), voiceover scripts, and audio cues.
       - Outline multi-slide educational carousels, B2B thought leadership posts, and persuasive ad concepts.

    2. **Competitor & Market Intelligence**:
       - Leverage the injected live search results to scan competitor websites, social media content strategies, posting schedules, and viral hooks in the target industry.
       - If no competitor website is explicitly provided, infer top industry competitors and reason from the search results for best-performing social media campaigns in that niche.
       - Analyze how competitors drive audience growth and recommend strategies to resonate with the community.

    3. **Proactive & Conversational Agent Behavior**:
       - Never respond with a blank stub or demand endless inputs.
       - If the user provides a vague or brief idea (e.g. "I want to create video content for my business"), **proactively infer** standard target audiences, key pain points, and 3 viral video angles right away.
       - Offer 2-3 brief, helpful clarifying questions (e.g. target platform, primary CTA) while delivering immediate, complete research recommendations in the response.
       - Proactively suggest logical next steps aligned with the user's stated objective (e.g. a content calendar, a video campaign, or growth ideas) — but only when they naturally follow from what the user asked. Do not push paid ads, lead generation, or sales funnels unless the user's goal implies them.

    ${isDeepMode ? `
    DEEP RESEARCH REPORT STRUCTURE:
    Provide an exhaustive, multi-tier analysis structured with clean Markdown:
    - 🎯 **Market & Competitor Intelligence Matrix**: Competitor strategy breakdown, content gaps, viral angles.
    - 🎥 **Video & Visual Content Blueprint**: Hook options, script breakdown with timestamps, visual camera directions.
    - 🌐 **Audience Engagement & Growth Path**: How to turn attention into engagement, followers, and (only if the user asks) website traffic and sales.
    - 📈 **Proactive Next Steps & Campaign Recommendations**.
    ` : ''}

    CRITICAL STRATEGY & VIDEO EXTRACTOR BLOCKS (ONLY APPEND WHEN EXPLICITLY GENERATING/DRAFTING A CAMPAIGN OR VIDEO):
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
    - **Aspect Ratio**: [9:16 Portrait / 1:1 Square / 16:9 Landscape]
    ---
  `;

  // Step 1 (optional): Gather live search grounding via the dedicated Google
  // Search tool model. Results feed the selected model (Gemini or gateway) for
  // final synthesis, so grounding no longer requires the selected model to be a Gemini model.
  let searchResults: SearchResultItem[] = [];
  let groundingContext = '';

  if (useGrounding) {
    try {
      onPhase?.({ type: 'searching' });
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const query = [
        companyInfo ? `Company / Brand context: ${companyInfo}` : '',
        competitorWebsite ? `Competitor / Benchmark: ${competitorWebsite}` : '',
        lastUserMsg?.content
      ].filter(Boolean).join('\n');

      const searchResponse = await getAi(customApiKey).models.generateContent({
        model: SEARCH_MODEL,
        contents: [{
          role: 'user',
          parts: [
            ...imageUrls
              .map(imageDataUrlToInlinePart)
              .filter((p): p is { mimeType: string; data: string } => Boolean(p))
              .map((p) => ({
                inlineData: { mimeType: p.mimeType, data: p.data },
              })),
            { text: query },
          ],
        }],
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const candidate = searchResponse.candidates?.[0];
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

      if (searchResults.length > 0) {
        groundingContext = `
        LIVE GOOGLE SEARCH GROUNDING RESULTS (collected by ${SEARCH_MODEL}):
        ${searchResults.map((r, i) => `${i + 1}. ${r.title} — ${r.url}`).join('\n')}

        Use these search results as the factual basis for your response. Cite sources inline where relevant.`;
      }
      onPhase?.({ type: 'found', count: searchResults.length });
    } catch (e) {
      console.warn("Could not collect search grounding, continuing ungrounded", e);
      onPhase?.({ type: 'found', count: 0 });
    }
  }

  // Step 2: Final synthesis on the selected model (Gemini or gateway). The
  // googleSearch tool is intentionally NOT attached here — grounding context is
  // injected instead, so gateway text models work for grounded research too.
  onPhase?.({ type: 'synthesizing' });
  const groundingInstruction = systemInstruction + (groundingContext ? `\n${groundingContext}` : '');

  let text: string;
  if (backend === 'gateway') {
    const prompt = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    text = await generateTextViaGateway(
      model || GATEWAY_TEXT_DEFAULT,
      prompt,
      groundingInstruction,
      undefined,
      imageUrls
    );
  } else {
    type ResearchContent = { role: 'user' | 'model'; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> };
    const contents: ResearchContent[] = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));
    // Attach uploaded images to the latest user turn for vision-capable models.
    if (imageUrls.length > 0 && contents.length > 0) {
      const last = contents[contents.length - 1];
      if (last.role === 'user') {
        const imageParts = imageUrls
          .map(imageDataUrlToInlinePart)
          .filter((p): p is { mimeType: string; data: string } => Boolean(p))
          .map((p) => ({
            inlineData: { mimeType: p.mimeType, data: p.data },
          }));
        last.parts = [...imageParts, ...last.parts];
      }
    }
    const response = await getAi(customApiKey).models.generateContent({
      model: model || TEXT_MODEL,
      contents,
      config: {
        systemInstruction: groundingInstruction,
      },
    });
    text = response.text || "I have completed the market and video content research based on current intelligence.";
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

  onPhase?.({ type: 'done' });

  const replyText = nodeDiagramsEnabled
    ? text
    : (await import('@/lib/nodeDiagrams')).removeNodeDiagramMarkers(text);

  return {
    reply: replyText,
    searchResults,
    suggestedCampaignTopic,
    suggestedPrompt,
    suggestedVideoPrompt,
    suggestedVideoScript
  };
};

export interface SectionImagePrompt {
  id: string;
  prompt: string;
  tag: string;
  generatedUrl?: string;
}

export interface BlogPostResult {
  title: string;
  slug?: string;
  excerpt?: string;
  metaDescription?: string;
  keywords?: string[];
  markdownContent: string;
  characterCount: number;
  readingTimeMinutes: number;
  embeddedImagesCount: number;
  sectionImagePrompts: SectionImagePrompt[];
  relatedPosts?: BlogRelatedPost[];
}

export interface BlogRelatedPost {
  title: string;
  slug: string;
  url: string;
  reason?: string;
}

export interface PreviousBlogPost {
  title: string;
  slug?: string;
  metaDescription?: string;
  keywords?: string[];
}

/**
 * Deterministically pick up to `limit` published posts that are topically
 * related to the current post by scoring keyword/title overlap. These become
 * the SEO backlinks section. Returns [] when no site base URL is configured.
 */
const pickRelatedPosts = (
  topic: string,
  seoKeywords: string[],
  previousPosts: PreviousBlogPost[],
  siteBaseUrl: string,
  limit = 3
): BlogRelatedPost[] => {
  const base = siteBaseUrl.replace(/\/+$/, '');
  if (!base || previousPosts.length === 0) return [];

  const topicTerms = `${topic} ${(seoKeywords || []).join(' ')}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'your', 'about', 'guide', 'using', 'into', 'over'].includes(w));

  const scored = previousPosts
    .filter(p => p.slug)
    .map(p => {
      const haystack = `${p.title} ${p.metaDescription || ''} ${(p.keywords || []).join(' ')}`.toLowerCase();
      const score = topicTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);
      return { post: p, score };
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ post }) => ({
    title: post.title,
    slug: (post.slug || '').replace(/^\/+|\/+$/g, ''),
    url: `${base}/${(post.slug || '').replace(/^\/+|\/+$/g, '')}`,
  }));
};

const RELATED_HEADING_PATTERN = /^\s*#{2,3}\s*(related\s*(posts?|reading|articles)|read\s*next|keep\s*reading|you\s*may\s*also\s*like|further\s*reading|recommended\s*reading)\b.*$/i;

/** Pull already-generated backlinks out of the markdown, if the AI added them. */
const extractRelatedPostsFromMarkdown = (markdown: string): BlogRelatedPost[] => {
  const lines = markdown.split('\n');
  const found: BlogRelatedPost[] = [];
  let inSection = false;
  for (const line of lines) {
    if (/^\s*#{1,3}\s+/.test(line)) {
      if (RELATED_HEADING_PATTERN.test(line)) {
        inSection = true;
        continue;
      }
      inSection = false;
      continue;
    }
    if (!inSection) continue;
    const linkMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
    if (!linkMatch) continue;
    const title = linkMatch[1].trim();
    const url = linkMatch[2].trim();
    const slug = url.replace(/\/+$/, '').split('/').pop() || '';
    if (title && slug && url.startsWith('http')) {
      found.push({ title, slug, url });
    }
  }
  return found;
};

/** Append a Related Reading section to the markdown when the AI did not include one. */
const appendRelatedPostsSection = (markdown: string, related: BlogRelatedPost[]): string => {
  const section = [
    '',
    '## Related Reading',
    '',
    ...related.map(r => `- [${r.title}](${r.url})`),
    '',
  ].join('\n');
  return markdown.replace(/\s+$/, '') + '\n' + section;
};

export interface BlogTopicIdea {
  title: string;
  angle: string;
  /** Set when this topic would genuinely benefit from a node-diagram flowchart. */
  diagram?: 'process' | 'pipeline' | 'architecture' | 'funnel' | 'sequence' | 'none';
  /** Short human-readable hint describing what the diagram should visualize. */
  diagramHint?: string;
}

export const generateBlogPostFromCampaign = async (
  topic: string,
  campaignSummary: string,
  availableImages: { title: string; url: string }[] = [],
  companyContext: string = '',
  targetTone: string = 'Informative, Authoritative & Actionable Guide',
  targetWordCount: number = 1200,
  targetAudience: string = 'General / Mixed Audience',
  seoKeywords: string[] = [],
  previousPosts: PreviousBlogPost[] = [],
  customApiKey?: string,
  backend: ModelBackend = 'gemini',
  model?: string,
  siteBaseUrl: string = '',
  nodeDiagramsEnabled: boolean = true
): Promise<BlogPostResult> => {
  const imagesListText = availableImages.length > 0
    ? availableImages.map((img, i) => `Image #${i + 1}: Title: "${img.title}", URL: "${img.url}"`).join('\n')
    : 'No pre-generated images available.';

  const seoKeywordsText = seoKeywords.length > 0
    ? seoKeywords.map((k, i) => `#${i + 1} "${k}"`).join(', ')
    : 'auto-derive 3-5 relevant keywords from the topic';

  const existingContentText = previousPosts.length > 0
    ? previousPosts.map((p, i) => `${i + 1}. Title: "${p.title}"${p.slug ? ` | Slug: ${p.slug}` : ''}${p.metaDescription ? ` | Summary: ${p.metaDescription}` : ''}${p.keywords && p.keywords.length ? ` | Keywords: ${p.keywords.join(', ')}` : ''}`).join('\n')
    : 'No previously published posts yet.';

  const relatedPosts = pickRelatedPosts(topic, seoKeywords, previousPosts, siteBaseUrl);

  const backlinkInstruction = relatedPosts.length > 0
    ? `
    SEO BACKLINK RULES (CRITICAL):
    - The site's public base URL is "${siteBaseUrl.replace(/\/+$/, '')}".
    - Near the END of the article, add a final "## Related Reading" section that interlinks 1-3 of the most relevant previously published posts.
    - Use ONLY the exact slugs from the "Existing Published Content" list above. NEVER invent slugs or URLs.
    - Format each backlink as a bullet list item exactly like: - [Post Title](${siteBaseUrl.replace(/\/+$/, '')}/exact-slug)
    - Recommend these specific related posts where they fit: ${relatedPosts.map(r => `"${r.title}" (${r.url})`).join(', ')}.
    - If the article's topic has no genuinely related existing post, omit the section entirely; do not force unrelated links.`
    : '\n    - Do NOT add any "Related Reading" or backlink section since there are no previously published posts to link to.';

  const nodeDiagramInstruction = `
    NODE DIAGRAM TOOL (OPTIONAL - USE ONLY WHEN IT GENUINELY HELPS):
    - If the article explains a process, workflow, pipeline, architecture, decision flow, or step-by-step sequence that would be dramatically clearer as a visual flowchart, include ONE compact inline node diagram marker where it adds the most value.
    - Do NOT add a diagram to every post, and never add more than 1-2 per post. Only use it when a visual flow genuinely clarifies the content (e.g. data pipelines, signup funnels, step sequences, architecture, routing logic).
    - Emit the marker on its own line, as a single self-contained JSON block, using this exact shape (no code fences, no line breaks inside the JSON):
      [NODE_DIAGRAM: {"title":"Short Diagram Title","nodes":[{"id":"1","label":"Step one label"},{"id":"2","label":"Step two label","description":"Optional one-line note"}],"edges":[{"source":"1","target":"2","label":"Optional edge label"}]}]
    - RULES: every node id must be unique; every edge source and target must reference an existing node id; keep node labels short (3-6 words); optionally set each node's "type" to one of: "input", "process", "decision", "output"; include 3-8 nodes max; the whole marker must stay on a single line.
    - Place the marker between two blank lines so it renders as its own block.`;

  const disabledNodeDiagramInstruction = `
    NODE DIAGRAM TOOL (DISABLED):
    - Do NOT use the [NODE_DIAGRAM: ...] marker or any node/chart/flowchart diagram syntax anywhere in this post.
    - If the content naturally describes a process, pipeline, or step-by-step sequence, explain it naturally in plain Markdown (use numbered lists, tables, blockquotes, or subheadings instead). Never emit a NODE_DIAGRAM marker.`;

  const systemInstruction = `
    You are a world-class technology blogger, content strategist, and technical writer.
    Your task is to write an in-depth, authoritative, and engaging Markdown blog post based on a research topic or social campaign.

    CONTEXT & INPUTS:
    - Main Topic: "${topic}"
    - Business / Brand Context: "${companyContext || 'Innovative Tech & Digital Brand'}"
    - Tone / Style: "${targetTone}"
    - Target SEO Keywords: ${seoKeywordsText}
    - Research / Campaign Context:
    ${campaignSummary}
    
    AVAILABLE CAMPAIGN VISUAL ASSETS:
    ${imagesListText}

    EXISTING PUBLISHED CONTENT (MUST NOT REPLICATE):
    ${existingContentText}
    
    ANTI-DUPLICATION RULES (CRITICAL):
    - Carefully review the "Existing Published Content" above (titles, summaries, keywords, and slugs).
    - If "Main Topic" closely matches an existing post, choose a clearly distinct angle, sub-topic, or framing so the new article is genuinely NEW content, not a near-duplicate.
    - Produce a unique, descriptive H1 title that is not a close repeat of any existing title.
    - Do NOT reuse or closely mirror an existing slug pattern; the final slug is derived from your title and is automatically made unique server-side.
    ${backlinkInstruction}

    SEO KEYWORD RULES (CRITICAL):
    - Naturally weave the Target SEO Keywords into H2 headings and body copy where they fit without breaking reading flow. Do not keyword-stuff or force them.
    - If keywords are auto-derived, keep them relevant to the topic and H2 headings.

    PUNCTUATION & STYLE CONSTRAINT (CRITICAL):
    - NEVER use em-dashes (— or --) under ANY circumstances anywhere in the blog post. Use hyphens with spaces, colons, commas, or parentheses instead to ensure natural, human-grade prose.

    LENGTH & DENSITY GUIDELINES:
    - Write at a natural length that fully covers the topic. Do NOT force any specific word count: short, focused posts are fine for narrow topics, while broad topics should be explored more deeply.
    - Aim for a complete, authoritative article (typically 800 to 2,500 words) that reads like it was written by a human expert, not padded to hit a number.
    - Write for the topic's natural audience: adjust depth, jargon, and examples so the piece is genuinely useful and self-contained.
    - Focus on practical, structured value with distinct double-line breaks (\n\n) between all sections. Do NOT cut off mid-thought.

    FORMATTING & STRUCTURE REQUIREMENTS:
    1. **In-Depth Guide & Practical Reasoning**:
       Expand high-level concepts into actionable guides with foundational explanations.
       (e.g., If explaining AI Personas, detail HOW persona system prompts condition model attention, tone boundaries, and operational fidelity).
    2. **Section Spacing & Structure**:
       - ALWAYS place a double newline (\n\n) between paragraphs, headings, list blocks, quotes, and image blocks.
       - Start with a compelling H1 title: "# [Title]"
       - An engaging opening hook establishing the core problem & solution.
       - 3 to 5 clear H2 section headings ("## Section Title"). For longer posts use more H2s + H3 sub-sections.
       - Bulleted key insights or step-by-step framework takeaways with spaces before and after list groups.
       - A quote callout box ("> Key Insight...") or prompt code block if applicable.
        - A concluding summary, with a closing call-to-action only if one genuinely fits the article's purpose (e.g. "subscribe", "share your thoughts") — never a forced sales push.
    3. **Image Integration & Prompts**:
       - If pre-generated images exist above, embed them as markdown images:
         ![Slide Visual: Title](Image_URL)
       - If NO pre-generated images exist or for key sections needing visual illustrations, insert an explicit Image Prompt placeholder on its own line between sections with blank lines around it:
         
         [IMAGE_PROMPT: Detailed prompt describing a high-quality 16:9 infographic/illustration for this section]
         
       - Limit image prompts to 1 or 2 strategic section breaks so the user can generate images on demand (3 for very long posts).
    ${nodeDiagramsEnabled ? nodeDiagramInstruction : disabledNodeDiagramInstruction}
    Output ONLY the raw Markdown blog post. Do not add introductory conversational filler before or after the markdown text.
  `;

  let rawText = "";
  if (backend === 'gateway') {
    const { generateTextViaGateway } = await import("@/services/server/gatewayText");
    rawText = (await generateTextViaGateway(model || GATEWAY_TEXT_DEFAULT, systemInstruction)).trim();
  } else {
    const response = await getAi(customApiKey).models.generateContent({
      model: model || TEXT_MODEL,
      contents: systemInstruction,
    });
    rawText = (response.text || "").trim();
  }

  // Clean raw text and strictly eliminate any em-dashes
  rawText = rawText.replace(/—/g, ' - ').replace(/--/g, ' - ');
  // If node diagrams are disabled, strip any stray markers the model may have emitted anyway
  if (!nodeDiagramsEnabled) {
    const { removeNodeDiagramMarkers } = await import('@/lib/nodeDiagrams');
    rawText = removeNodeDiagramMarkers(rawText);
  }

  let markdownContent = rawText;

  // Extract Title from H1 if present
  const titleMatch = markdownContent.match(/^#\s*(.+)/m);
  const title = titleMatch ? titleMatch[1].trim().replace(/\*+/g, '') : `${topic}: In-Depth Guide`;

  const characterCount = markdownContent.length;
  const wordCount = markdownContent.split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Count embedded markdown images
  const imageMatches = markdownContent.match(/!\[.*?\]\(.*?\)/g) || [];

  // Extract section image prompts of form [IMAGE_PROMPT: ...]
  const promptRegex = /\[IMAGE_PROMPT:\s*([^\]]+)\]/gi;
  const sectionImagePrompts: SectionImagePrompt[] = [];
  let match: RegExpExecArray | null;

  let promptCount = 0;
  while ((match = promptRegex.exec(markdownContent)) !== null) {
    promptCount++;
    sectionImagePrompts.push({
      id: `img_prompt_${Date.now()}_${promptCount}`,
      prompt: match[1].trim(),
      tag: match[0]
    });
  }

  // Compute SEO slug, excerpt, metaDescription, and keywords
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 150) || 'blog-post';

  const existingSlugs = new Set(previousPosts.map(p => (p.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').trim()).filter(Boolean));
  let slug = baseSlug;
  let slugCounter = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug.slice(0, 145)}-${slugCounter}`;
    slugCounter += 1;
  }

  const cleanTextForExcerpt = markdownContent
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[IMAGE_PROMPT:.*?\]/gi, '')
    .replace(/#+\s+/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const excerpt = cleanTextForExcerpt.slice(0, 280) + (cleanTextForExcerpt.length > 280 ? '...' : '');
  const metaDescription = cleanTextForExcerpt.slice(0, 160);

  // Derive top keywords from topic and title
  const keywordCandidates = `${topic} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['with', 'from', 'that', 'this', 'your', 'about', 'guide', 'master'].includes(w));
  const keywords = Array.from(new Set(keywordCandidates)).slice(0, 8);

  // Resolve related posts: prefer backlinks the AI already wrote, else append the section deterministically.
  const extractedRelated = extractRelatedPostsFromMarkdown(markdownContent);
  let resolvedRelated = extractedRelated.length > 0 ? extractedRelated : relatedPosts;
  if (resolvedRelated.length > 0 && extractedRelated.length === 0) {
    markdownContent = appendRelatedPostsSection(markdownContent, resolvedRelated);
  }

  return {
    title,
    slug,
    excerpt,
    metaDescription,
    keywords,
    markdownContent,
    characterCount,
    readingTimeMinutes,
    embeddedImagesCount: imageMatches.length,
    sectionImagePrompts,
    relatedPosts: resolvedRelated
  };
};

export const suggestBlogSeo = async (
  title: string,
  markdownContent: string,
  existingSlugs: string[] = [],
  customApiKey?: string,
  backend: ModelBackend = 'gemini',
  model?: string
): Promise<{ titleOptions: string[]; metaDescription: string; keywords: string[] }> => {
  const excerptSource = markdownContent
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[IMAGE_PROMPT:.*?\]/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/#+\s+/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim();

  const existingSlugsText = existingSlugs.length > 0
    ? existingSlugs.map(s => `- /${s}`).join('\n')
    : '- None yet.';

  const instruction = `
    You are an SEO and content strategist. Given a blog post title and its body, produce strictly the following JSON (no markdown fences, no extra text):
    {
      "titleOptions": ["5", "optimized", "click-worthy", "headline", "variants"],
      "metaDescription": "a 150-160 character meta description",
      "keywords": ["4-6", "target", "keywords"]
    }
    EXISTING URL SLUGS ALREADY USED ON THE BLOG:
    ${existingSlugsText}
    Rules:
    - titleOptions: exactly 5 compelling title variants under 65 characters each, naturally including primary keywords, no clickbait.
    - Do NOT suggest a title variant that is a near-duplicate of the current title or would slugify into an existing URL slug above. Prefer distinct angles.
    - metaDescription: 150-160 characters, actionable, includes a primary keyword.
    - keywords: 4-6 lowercase SEO keywords derived from the content.
    - NEVER use em-dashes. Use hyphens with spaces, colons, or commas instead.

    BLOG POST TITLE:
    "${title}"

    BLOG POST BODY:
    ${excerptSource.slice(0, 6000)}
  `;

  let rawText = "";
  if (backend === 'gateway') {
    const { generateTextViaGateway } = await import("@/services/server/gatewayText");
    rawText = (await generateTextViaGateway(model || GATEWAY_TEXT_DEFAULT, instruction)).trim();
  } else {
    const response = await getAi(customApiKey).models.generateContent({
      model: model || TEXT_MODEL,
      contents: instruction,
    });
    rawText = (response.text || "").trim();
  }

  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').replace(/—/g, ' - ');

  try {
    const parsed = JSON.parse(rawText);
    return {
      titleOptions: Array.isArray(parsed.titleOptions) ? parsed.titleOptions.slice(0, 5).map(String) : [],
      metaDescription: typeof parsed.metaDescription === 'string' ? parsed.metaDescription : '',
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6).map(String) : [],
    };
  } catch (err) {
    console.error("Failed to parse SEO suggestions JSON, falling back to heuristics:", err);
    const fallbackTitle = `${title}`;
    const keywords = Array.from(new Set(
      `${title} ${excerptSource}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 4 && !['with', 'from', 'that', 'this', 'your', 'about', 'guide', 'master'].includes(w))
    )).slice(0, 6);
    return {
      titleOptions: [fallbackTitle],
      metaDescription: excerptSource.slice(0, 160),
      keywords,
    };
  }
};

export const suggestBlogTopics = async (
  previousPosts: PreviousBlogPost[] = [],
  customApiKey?: string,
  backend: ModelBackend = 'gemini',
  model?: string
): Promise<BlogTopicIdea[]> => {
  const existingContentText = previousPosts.length > 0
    ? previousPosts.map((p, i) => `${i + 1}. Title: "${p.title}"${p.slug ? ` | Slug: ${p.slug}` : ''}${p.metaDescription ? ` | Summary: ${p.metaDescription}` : ''}${p.keywords && p.keywords.length ? ` | Keywords: ${p.keywords.join(', ')}` : ''}`).join('\n')
    : 'None yet.';

  const instruction = `
    You are a creative content strategist and editor for a technology blog.
    Generate ${previousPosts.length > 0 ? '5' : '4'} fresh, compelling blog post ideas that will perform well for this brand.

    EXISTING PUBLISHED CONTENT ON THE BLOG (AVOID REPEATING THESE TOPICS, ANGLES, AND TITLES):
    ${existingContentText}

    NODE DIAGRAM AWARENESS:
    - Some blog posts benefit from a visual flowchart rendered inline (a "node diagram"). This is a first-class feature of the platform.
    - For each idea, judge whether a diagram would genuinely clarify the post: processes, step-by-step sequences, workflows, pipelines, architectures, funnels, or decision flows are ideal candidates.
    - When it would help, set "diagram" to one of: "process", "pipeline", "architecture", "funnel", "sequence". Otherwise set it to "none".
    - Also provide "diagramHint": one short sentence describing what the diagram should visualize (e.g. "A 4-step signup funnel from landing page to activated user"). Empty string when "diagram" is "none".
    - Do NOT force a diagram on every idea — only mark the ones where a visual flow adds real value. Aim for roughly half the ideas to be diagram-worthy.

    RULES (CRITICAL):
    - Each idea must be clearly distinct from the existing published content above. Do NOT suggest a topic, title, or angle that already exists.
    - Prioritize evergreen, search-friendly topics with real reader value.
    - Never repeat an existing title or slug pattern.
    - NEVER use em-dashes (— or --). Use hyphens with spaces, colons, or commas instead.
    - Output ONLY valid JSON, no markdown fences, no extra text, in this exact shape:
    {
      "ideas": [
        { "title": "A compelling working title", "angle": "One sentence on the unique angle, audience, and why it's different from existing posts", "diagram": "process", "diagramHint": "A 4-step funnel from landing page to activated user" }
      ]
    }
  `;

  let rawText = "";
  if (backend === 'gateway') {
    const { generateTextViaGateway } = await import("@/services/server/gatewayText");
    rawText = (await generateTextViaGateway(model || GATEWAY_TEXT_DEFAULT, instruction)).trim();
  } else {
    const response = await getAi(customApiKey).models.generateContent({
      model: model || TEXT_MODEL,
      contents: instruction,
    });
    rawText = (response.text || "").trim();
  }

  rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').replace(/—/g, ' - ');

  try {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed.ideas)) {
      return parsed.ideas
        .filter((i: any) => i && typeof i.title === 'string' && i.title.trim())
        .slice(0, 5)
        .map((i: any) => {
          const diagramRaw = typeof i.diagram === 'string' ? i.diagram.trim().toLowerCase() : '';
          const diagram = ['process', 'pipeline', 'architecture', 'funnel', 'sequence'].includes(diagramRaw)
            ? diagramRaw as BlogTopicIdea['diagram']
            : diagramRaw === 'none' ? 'none' as const : undefined;
          return {
            title: i.title.trim(),
            angle: typeof i.angle === 'string' ? i.angle.trim() : '',
            ...(diagram ? { diagram } : {}),
            ...(diagram && diagram !== 'none' && typeof i.diagramHint === 'string' && i.diagramHint.trim()
              ? { diagramHint: i.diagramHint.trim() }
              : {}),
          };
        });
    }
    return [];
  } catch (err) {
    console.error("Failed to parse topic ideas JSON, falling back to generic ideas:", err);
    return [
      { title: "The Beginner's Guide to [Topic]: Getting Started the Right Way", angle: "Foundational, search-friendly walkthrough for newcomers." },
      { title: "[Topic] Mistakes That Cost You Time and How to Avoid Them", angle: "Pain-point driven checklist with actionable fixes." },
      { title: "How Top Teams Execute [Topic]: A Step-by-Step Playbook", angle: "Process-focused deep dive with a repeatable framework." },
      { title: "[Topic] in 2026: What's Changed and What Still Works", angle: "Trend-driven refresh that positions the brand as current." },
    ];
  }
};

export interface CuratedResearchBrief {
  /** Short catchy campaign/blog title, derived from the reply — not the raw topic heading. */
  name: string;
  objective: string;
  styleGuide: string;
}

/**
 * Curate a research-chat reply into a concise, structured brief the moment the
 * user clicks "Send to Social Campaign" / "Create Blog Post". This keeps the
 * prefilled objective field rich and faithful to the reply instead of dumping
 * the raw topic name (or the entire noisy reply) into the composer.
 *
 * `target` tailors the extraction: 'campaign' returns a social campaign
 * objective (angle, coverage, visual/slide direction), 'blog' returns a
 * title-worthy blog idea (topic, angle, sections, audience).
 */
export const curateResearchBrief = async (
  topic: string,
  replyContent: string,
  website?: string,
  target: 'campaign' | 'blog' = 'campaign',
  modelName: string = TEXT_MODEL,
  customApiKey?: string
): Promise<CuratedResearchBrief> => {
  const source = replyContent.trim().slice(0, 12000);

  const targetInstruction = target === 'campaign'
    ? `"objective" must be a focused SOCIAL CAMPAIGN brief (3-6 sentences or short bullets) that:
       - States what the campaign is about and its core angle, derived from the reply content — not just the topic name "${topic}".
       - Captures the key points, structure, and "how to go about it" the reply actually covers.
       - Includes any visual/slide direction the reply describes (how the carousel deck should look, slide layouts, styling).
       - Never invents facts, lead-gen funnels, or CTAs that aren't in the reply.`
    : `"objective" must be a compelling BLOG POST idea (2-4 sentences) that:
       - Leads with a strong, title-worthy topic derived from the reply content — not just the topic name "${topic}".
       - States the core angle, the key sections the post should cover, and who it's for.
       - Never invents facts or claims that aren't in the reply.`;

  const styleGuideInstruction = target === 'campaign'
    ? `"styleGuide" must be a short (2-4 sentences) VISUAL direction string for image generation: branding/color cues, slide layout, illustration style — only what the reply says or reasonably implies. If the reply has no visual guidance, return "".`
    : `"styleGuide" must be an empty string "" (not used for blog posts).`;

  const nameInstruction = target === 'campaign'
    ? `"name" must be a short, catchy SOCIAL CAMPAIGN NAME (3-8 words, no trailing "Campaign") that captures the campaign's focus and angle — something a marketer would write on a project folder. Do NOT just reuse the raw topic heading "${topic}".`
    : `"name" must be a short WORKING BLOG TITLE (3-8 words) for the blog post, derived from the reply.`;

  const prompt = `
    You are an expert content strategist. A user researched a brand using an AI research chat and now wants to turn ONE of the research replies into content. Read the research reply below and extract a concise, high-quality brief that captures its substance.

    **TOPIC (short heading the user clicked)**: "${topic}"
    ${website ? `**BRAND WEBSITE**: "${website}"` : ""}

    **TARGET**: ${target}

    **REQUIREMENTS**:
    - Filter out the reply's noise (chat framing, meta commentary, disclaimers, repetition) and keep only what genuinely belongs in the target content.
    ${nameInstruction}
    ${targetInstruction}
    ${styleGuideInstruction}

    Return ONLY a valid JSON object with exactly these three keys:
    {
      "name": "...",
      "objective": "...",
      "styleGuide": "..."
    }
    Do not include markdown wraps or any text outside the JSON.
  `;

  const fallback: CuratedResearchBrief = {
    name: topic?.trim() || 'Research Insights',
    objective: topic?.trim() || 'Research Insights',
    styleGuide: ''
  };

  try {
    const response = await getAi(customApiKey).models.generateContent({
      model: modelName || TEXT_MODEL,
      contents: `${prompt}\n\n**RESEARCH REPLY**:\n${source}`,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const candidates = response.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    let text = parts
      .filter((p: { text?: string }) => typeof p.text === 'string')
      .map((p: { text?: string }) => p.text ?? '')
      .join('');

    if (!text) {
      try { text = response.text || ''; } catch { text = ''; }
    }

    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    if (!text) return fallback;

    const parsed = JSON.parse(text) as Partial<CuratedResearchBrief>;
    return {
      name: typeof parsed.name === 'string' && parsed.name.trim()
        ? parsed.name.trim()
        : fallback.name,
      objective: typeof parsed.objective === 'string' && parsed.objective.trim()
        ? parsed.objective.trim()
        : fallback.objective,
      styleGuide: typeof parsed.styleGuide === 'string' ? parsed.styleGuide.trim() : '',
    };
  } catch (err: any) {
    console.error("[Campaign Service] curateResearchBrief failed:", err?.message || err);
    return fallback;
  }
};

