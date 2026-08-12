import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ComplexityLevel, VisualStyle, Language } from "@/types";
import { STYLE_GUIDES } from "@/services/stylesGuide";

export const getGeminiApiKey = (customApiKey?: string) =>
  customApiKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

/** Process-wide in-memory store shared across route handler bundles (dev compiles each route separately). */
export const getGlobalMap = <T = any>(key: string): Map<string, T> => {
  const g = globalThis as any;
  if (!g.__socialStudioGlobalMaps) g.__socialStudioGlobalMaps = {};
  if (!g.__socialStudioGlobalMaps[key]) g.__socialStudioGlobalMaps[key] = new Map<string, T>();
  return g.__socialStudioGlobalMaps[key] as Map<string, T>;
};

export const getAi = (customApiKey?: string) => {
  return new GoogleGenAI({ apiKey: getGeminiApiKey(customApiKey) });
};

/** Vercel AI Gateway credentials. `AI_GATEWAY_API_KEY` matches the AI SDK default; `AI_GATEWAY_BASE_URL` overrides the hosted gateway. */
export const getGatewayConfig = () => ({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: process.env.AI_GATEWAY_BASE_URL
});

export const isGatewayConfigured = () => Boolean(getGatewayConfig().apiKey);

/** Cloudinary image-hosting credentials (optional — used to host generated blog images). */
export const getCloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET
});

export const isCloudinaryConfigured = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
};

export const getMimeTypeAndData = (base64DataString: string) => {
  const match = base64DataString.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.*)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2]
    };
  }
  return {
    mimeType: "image/png",
    data: base64DataString.replace(/^data:image\/(png|jpeg|jpg);base64,/, "")
  };
};

export const TEXT_MODEL = 'gemini-3.5-flash';
export const IMAGE_MODEL = 'gemini-3.1-flash-image';
export const EDIT_MODEL = 'gemini-3.1-flash-image';
/** Google Search tool model — runs the googleSearch tool on behalf of any selected model (incl. gateway text models). */
export const SEARCH_MODEL = 'gemini-2.5-flash';

export const getLevelInstruction = (level: ComplexityLevel): string => {
  switch (level) {
    case 'Elementary':
      return "Target Audience & Complexity: Elementary School (Ages 6-10). The visual and factual concept should be extremely bright, simplified, and fun. Use large clear recognizable shapes, huge icons, and minimal brief text labels suitable for kids. Avoid any overly complex charts, graphs, or dense text.";
    case 'High School':
      return "Target Audience & Complexity: High School students. Style should match an interactive modern educational textbook. Clean lines, clearly readable diagram labels, accurate simplified maps, clear hierarchy. Avoid both overly childish elements and overly dense professional mathematical formulas.";
    case 'College':
      return "Target Audience & Complexity: College/University level. Style should mimic an academic journal illustration or a high-quality infographic from Scientific American. High factual detail, rich data presentation, clear cross-sections, complex schematics, and precise specialized terminology.";
    case 'Expert':
      return "Target Audience & Complexity: Industry Expert. Style is a rigorous, authoritative technical blueprint, detailed patent drawing, or professional schematic. Extremely dense functional details, rigorous annotations, monochrome or specialized high-key technical coloring, precise line indicators.";
    case 'Default':
    default:
      return "Target Audience & Complexity: Adaptive / Follow Prompt. Let the inherent subject matter in the user's prompt dictate the complexity and details. Do not inject artificial simplicity or academic density unless requested.";
  }
};

export const getStyleInstruction = (style: VisualStyle, subOptions?: Record<string, string>): string => {
  const guide = STYLE_GUIDES[style] || STYLE_GUIDES.Default;
  let textGuide = `${guide.systemPromptGuide}\n`;
  
  if (subOptions && guide.options.length > 0) {
    const activeDirectives: string[] = [];
    guide.options.forEach(opt => {
      const selectedVal = subOptions[opt.id];
      if (selectedVal) {
        const choice = opt.choices.find(c => c.value === selectedVal);
        if (choice) {
          activeDirectives.push(`${opt.label}: ${choice.promptSegment}`);
        }
      }
    });
    if (activeDirectives.length > 0) {
      textGuide += `\nCRITICAL DESIGN PARAMETERS:\n` + activeDirectives.map(d => `- ${d}`).join('\n') + `\n`;
    }
  }
  return textGuide;
};

export const getResolutionInstruction = (resolution: AspectRatio): string => {
  switch (resolution) {
    case '9:16':
      return "Layout & Composition: Portrait / Mobile Story structure (9:16 aspect ratio). Stack informational graphics, boxes, and icons vertically, optimizing the design for tall mobile screens with a clear top-to-bottom logical flow. Everything must be proportioned for smartphone viewing.";
    case '1:1':
      return "Layout & Composition: Square badge/sticker structure (1:1 aspect ratio). Symmetrical layout with a dominant centered focal graphic, surrounding icons, and compact, beautifully balanced boundaries. Perfect for avatars, social media badges, or single stickers.";
    case '16:9':
    default:
      return "Layout & Composition: Landscape widescreen presentation structure (16:9 aspect ratio). Distribute data graphics, flowcharts, and labels horizontally across the workspace with balanced left-to-right reading flow, perfect for slides and desktop screens.";
  }
};

export const getLanguageInstruction = (language: Language): string => {
  if (!language || language === 'Default') {
    return "Language setting: Follow prompt instruction. Use the language specified or implied by the prompt. If not specified, default to clear English text labels and annotations.";
  }
  return `Language setting: STRIKT ${language}. Every single piece of text, title, label, tag, or informational text rendered inside the image MUST be written cleanly and correctly in the ${language} language. No English fallbacks for label text.`;
};
