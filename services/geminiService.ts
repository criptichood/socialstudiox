/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Re-export modular services for absolute backward compatibility and clean architecture
export {
  generateInfographicImage,
  verifyInfographicAccuracy,
  fixInfographicImage,
  editInfographicImage
} from "./ai/imageService";

export {
  generateVeoVideo,
  generateVoiceOverAndVideoPrompt,
  pollVideoOperation
} from "./ai/videoService";
export type { VideoGenerationResult } from "./ai/videoService";

export {
  generateVoiceOverSpeech,
  generateImageToScript
} from "./ai/voiceService";

export {
  researchTopicForPrompt,
  generateSocialCampaign,
  generateSingleSocialPost,
  refineSingleSocialPost,
  conductResearchChat
} from "./ai/campaignService";
