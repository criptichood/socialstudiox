/**
 * Cross-view prefill handoff.
 *
 * App view navigation (e.g. /research -> /campaign/social) remounts the App
 * component (Next.js App Router re-renders the route tree), which wipes any
 * React state. So "send to" flows hand their payload off via sessionStorage:
 * the source view writes it, the destination view consumes (and clears) it on
 * mount.
 */
export const PENDING_CAMPAIGN_KEY = 'social_studio_x_pending_campaign_v1';
export const PENDING_VIDEO_KEY = 'social_studio_x_pending_video_v1';

export interface PendingCampaignPrefill {
  /** Short human-readable campaign name (from the clicked message heading). */
  name?: string;
  /** Curated objective — prefilled into the Main Campaign Topic / Objective field. */
  topic: string;
  prompt: string;
  website: string;
}
