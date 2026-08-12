/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export modular services for absolute backward compatibility and clean architecture
export {
  generateInfographicImage,
  verifyInfographicAccuracy,
  fixInfographicImage,
  editInfographicImage,
  uploadImageToCloudinary
} from "./ai/imageService";

export {
  fetchVideoModelCatalog,
  startVideoGeneration,
  pollVideoGeneration,
  generateVoiceOverAndVideoPrompt,
  enhanceVoiceOverWithGuidelines
} from "./ai/videoService";
export type { VideoGenerationResult } from "@/types";

export {
  generateVoiceOverSpeech,
  generateImageToScript
} from "./ai/voiceService";

export {
  researchTopicForPrompt,
  generateSocialCampaign,
  generateSingleSocialPost,
  refineSingleSocialPost,
  conductResearchChat,
  generateBlogPostFromCampaign,
  suggestBlogSeo,
  suggestBlogTopics
} from "./ai/campaignService";
export type { BlogPostResult, SectionImagePrompt } from "@/types";

export {
  publishBlogToEndpoint
} from "./ai/blogService";
export type { PublishBlogResult } from "./ai/blogService";
