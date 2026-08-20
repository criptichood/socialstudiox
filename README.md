# Social Studio X

> A premium, modular AI-powered Social Media Post Generator, Brand Graphic Workspace, Dynamic Image Editor, Video Studio, Voiceover Studio, and Research Center.
>
> **Build with ❤️ by [@criptichood](https://github.com/criptichood)**

---

## 🚀 Overview

**Social Studio X** is an all-in-one AI creative studio — research trends, write high-converting copy, design eye-catching brand posts, generate custom AI visual assets, edit graphics on the fly, produce AI video and voiceovers, and run a full blog publishing pipeline. Everything runs in a single-page **Next.js 15 (App Router)** app: AI calls execute **server-side through API route handlers**, while the browser hosts one client bundle (`components/App.tsx`, imported with `ssr: false`).

**Google Gemini** is the default backend. An optional **AI Gateway** mode (`@ai-sdk/gateway`) unlocks curated third-party text, image, voice, and video models, selectable per modality from the Model Management view.

---

## 💎 Features & Capabilities

### 📡 1. Research Center (Live Search Grounded)
- **Real-Time Search Grounding**: a dedicated Gemini search-tool model (`SEARCH_MODEL`) gathers live Google results that get injected as grounding into whichever text model you select — Gemini **or** gateway models.
- **Deep Research Mode**: exhaustive market, competitor, and content-strategy reports.
- **Vision Uploads**: attach up to 4 images for vision-capable models (client-side downscaled to keep payloads lean).
- **Live Phase Streaming (SSE)**: the loading bubble reflects real server-side phases — *searching → found N sources → synthesizing → done* — on any backend.
- **Grounding Toggle**: flip a dedicated Live Search switch on/off per message.

### 🧠 2. Model Management (`/models`)
- **Per-Modality Defaults**: pick default models for Text, Image, Image Edit, Voiceover, and Video.
- **Curated Catalog**: Gemini-native models plus a curated gateway list, each flagged with capabilities (vision, image input, aspect ratios, backends).
- **Live Testing & Refresh**: test any model directly, or pull the gateway's live language-model list.

### 🎨 3. Visual Canvas & Post Prompt Studio
- **Curated Trend Grounding**: Google search results are curated into validated factual bullet points before generating social copywriting or imagery.
- **Style & Brand Fine-Tuning**: visual styles (3D Render, Minimalist Vector, Neon Cyberpunk, …), complexity levels, aspect ratios (1:1, 4:5, 9:16, 16:9), and language translations.
- **Interactive Prompt Studio**: preview, refine, and customize image prompts or issue direct edit commands.

### ✏️ 4. Multi-Layer Image Editor & Annotation Studio
- **On-The-Fly Editing Tools**: vector shapes, lines, arrows, and brush paths drawn directly on generated graphics.
- **Text & Brand Layering**: add stylized text, handles, or callouts with point-and-click placement.
- **Persistent States**: canvas edits are stored with full vector state in Local IndexedDB.

### 📽️ 5. Video Studio
- **Registry-Driven Models**: capability metadata in `VIDEO_MODEL_CATALOG` (`types.ts`) drives the UI — t2v/i2v/r2v, first/last-frame control, audio, resolutions, durations, aspect ratios.
- **Backends**: Gemini-native (Veo long-running ops, Omni synchronous) or AI Gateway video jobs, both polled via `/api/video/poll`.
- **Voiceovers & Narration**: per-asset audio, voiceover synthesis, and image-to-script.

### 🎙️ 6. Voiceover Studio
- AI-cast narration guidelines, tone/speed control, and script enhancement.

### ✍️ 7. Blog Studio (AI Research Center)
- **Full Pipeline**: generate → preview → raw-markdown editing → section image generation → webhook publishing → cron scheduling.
- **Section Image Prompts**: AI inserts `[IMAGE_PROMPT: ...]` placeholders; generate an image, upload it to Cloudinary, and it is embedded as a hosted URL. Unresolved placeholders are stripped before publishing — raw prompt text never ships to the live site.
- **Publish & Update**: publish to an external blog endpoint via webhooks, then **update existing posts in place (PUT/PATCH by slug)** with edited-since-publish detection and an old-vs-new comparison.
- **Scheduling**: recurring cron schedules (client-side, runs while the app is open).

### 🏗️ 8. Clean & Performant Architecture
- **Three-Layered AI**: thin client `fetch()` wrappers → Next.js API route handlers → real `@google/genai` / AI SDK implementations in `services/server/*`. Keep parallel files in sync.
- **State Separation**: business logic lives in `hooks/useAppEngine.ts` (app) and `hooks/useBlogEngine.ts` (blog); components stay visual.
- **IndexedDB Sync**: persists drafts, campaigns, research sessions, image streams, and blog data locally.

---

## 🛠️ Architecture & File Guide

```bash
├── app/
│   ├── [[...slug]]/page.tsx        # Catch-all route → dynamically imports App.tsx (ssr: false)
│   └── api/                        # Route handlers — thin JSON/SSE pass-through
│       ├── campaign/               # generate, blog, blog-seo, blog-topics, curate, research, research-chat (SSE)
│       ├── image/                  # generate, edit, upload (Cloudinary)
│       ├── video/                  # generate, poll, models, assets, segment, segment/continue, voice-*
│       ├── voice/                  # synthesize, image-to-script
│       ├── blog/                   # publish (POST/PUT/PATCH webhook proxy)
│       └── models/                 # catalog, refresh, verify
├── components/                     # App, Sidebar, ResearchCenter, VideoStudio,
│                                   # VoiceoverStudio, ModelsSettings, drafts/*, research/blog/*
├── hooks/
│   ├── useAppEngine.ts             # Central state controller (business logic)
│   └── useBlogEngine.ts            # Blog engine: generation, drafts, images, publish, schedules
├── services/
│   ├── ai/                         # Client-side fetch() wrappers (browser only)
│   │   ├── imageService.ts         # campaignService.ts, videoService.ts, voiceService.ts, blogService.ts
│   ├── server/                     # Real Gemini / AI SDK implementations (server-only)
│   │   ├── config.ts               # Model names + getAi() + env credentials
│   │   ├── modelRegistry.ts        # modelRouter.ts — build the model catalog
│   │   ├── gateway*.ts             # gatewayClient.ts, gatewayText/Image/Speech/Video.ts
│   │   ├── cloudinaryService.ts    # Hosts generated blog images
│   │   ├── blogPublishService.ts   # Webhook proxy (POST/PUT/PATCH)
│   │   └── campaignService.ts      # Research grounding + blog generation
│   └── geminiService.ts            # Back-compat re-exports of the modular services
├── lib/                            # feedback.ts (toasts), errors.ts, cron.ts, asciiTable.ts, nodeDiagrams.ts
├── types.ts                        # Client-safe model catalogs (VIDEO_MODEL_CATALOG, gateway catalogs) & types
├── next.config.ts                  # serverExternalPackages + Windows watchOptions.poll
└── .env.local                      # (gitignored) API keys — see .env.example
```

> **Server-only packages** (`@google/genai`, the AI SDK, `cloudinary`) are listed in `serverExternalPackages` in `next.config.ts` — import them only from `services/server/*` and `app/api/**`, never from client code.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js and npm
- A Google AI API key (`GEMINI_API_KEY`) — **required** for the Gemini backend

### Installation

```bash
# Install dependencies
npm install

# Configure environment (copy the template)
cp .env.example .env.local
# → set GEMINI_API_KEY (required)
# → optionally set AI_GATEWAY_API_KEY + AI_GATEWAY_BASE_URL for third-party models
# → optionally set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
#   to host generated blog section images (recommended for the Blog Studio)

# Start development server
npm run dev
```

The app runs on **port 3000**. Open [http://localhost:3000](http://localhost:3000).

### Verification

```bash
npm run build   # Typecheck (tsc) + production build — this is the verification gate
```

> Do **not** rely on `npm run lint` — there is no ESLint config file, so `next lint` hangs on an interactive prompt. Use `npm run build` alone. There is no test framework.

---

## ✍️ Blog Publishing

1. **Webhooks** (`⚙️ Webhooks` tab): configure one or more publish endpoints — URL, auth header/secret, and **Update Method** (`PUT` or `PATCH`). A post is sent to the endpoint as JSON (`title`, `slug`, `body`/`content`, `excerpt`, `metaDescription`, `keywords`, `image_url`/`featuredImage`, `author`, `publishedAt`, `source`).
2. **Publish**: POST creates a new post (409 = slug already exists).
3. **Update**: after publishing, "Update Published Post" sends **PUT/PATCH by slug** to replace/update the existing post. The endpoint must accept that method — otherwise you'll see a clear 405/501 error.
4. **Images**: generated section images are uploaded to Cloudinary and embedded as hosted URLs. If Cloudinary isn't configured, the upload action won't run — point `/api/image/upload` + `services/server/cloudinaryService.ts` at any other image host you prefer.

---

## 🔐 Environment Variables

See [`.env.example`](.env.example) for the full annotated list:

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google Gemini backend (text/image/edit/voice/video) |
| `API_KEY` | legacy | Used only if `GEMINI_API_KEY` is unset |
| `AI_GATEWAY_API_KEY` | optional | Enables third-party gateway models |
| `AI_GATEWAY_BASE_URL` | optional | Overrides the hosted gateway URL |
| `CLOUDINARY_CLOUD_NAME` | optional* | Hosts generated blog images |
| `CLOUDINARY_API_KEY` | optional* | Cloudinary credential |
| `CLOUDINARY_API_SECRET` | optional* | Cloudinary credential |

\* Optional for the app, but **required for "Upload Image to Blog"** in the Blog Studio.

---

## 📄 License

[MIT](LICENSE)

---

*Created as a production-grade social and brand visualization tool, engineered with clean code paradigms and elegant typography.*
