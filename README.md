# Social Studio X
> A premium, modular AI-powered Social Media Post Generator, Brand Graphic Workspace, and Dynamic Image Editor.
>
> **Build with ❤️ by [@criptichood](https://github.com/criptichood)**

---

## 🚀 Overview

**Social Studio X** is an all-in-one AI creative studio — research trends, write high-converting copy, design eye-catching brand posts, generate custom AI visual assets, edit graphics on the fly, and produce AI video and voiceovers. Everything runs in a single-page Next.js 15 (App Router) app: Gemini calls execute server-side through API route handlers, while the browser hosts one client bundle. Google Gemini is the default backend, with an optional **AI Gateway** mode that unlocks curated third-party text, image, voice, and video models.

---

## 💎 Features & Capabilities

### 📡 1. Research Center (Live Search Grounded)
- **Real-Time Search Grounding**: Uses a dedicated Gemini search-tool model (`SEARCH_MODEL`) to gather live Google results, which are injected as grounding into whichever text model you select — Gemini **or** gateway models.
- **Deep Research Mode**: Exhaustive market, competitor, and content-strategy reports.
- **Vision Uploads**: Attach up to 4 images for vision-capable models (client-side downscaled to keep payloads lean); non-vision models warn instead.
- **Live Phase Streaming (SSE)**: The loading bubble is driven by real server-side phases — *searching → found N sources → synthesizing → done* — so you always see what the assistant is actually doing, on any backend.
- **Grounding Toggle**: Flip a dedicated Live Search switch on/off per message.

### 🧠 2. Model Management
- **Per-Modality Defaults**: Choose your default model for Text, Image, Image Edit, Voiceover, and Video (via `/models`).
- **Curated Catalog**: Gemini-native models plus a curated gateway list for text/image/voice/video, each flagged with capabilities (vision, image input, aspect ratios, etc.).
- **Live Testing & Refresh**: Test any model directly, or pull the gateway's live language model list.

### 🎨 3. Visual Canvas & Post Prompt Studio
- **Curated Trend Grounding**: Queries Google search and curates validated factual bullet points before generating social copywriting or imagery.
- **Style and Brand Fine-Tuning**: Select visual styles (e.g., *3D Render*, *Minimalist Vector*, *Neon Cyberpunk*), complexity levels, aspect ratios (e.g., Square 1:1, Story 9:16, Landscape 16:9), and language translations.
- **Interactive Prompt Studio**: Preview, refine, and customize image prompts or write direct edit commands to iterate on generated visuals on the fly.

### ✏️ 4. Multi-Layer Image Editor & Annotation Studio
- **On-The-Fly Editing Tools**: Draw directly on your generated base graphics with high-fidelity vector shapes, lines, arrows, and brush paths.
- **Text & Brand Layering**: Add stylized text, descriptions, handles, or callouts on top of images with point-and-click placement.
- **Persistent States**: Saved canvas edits are stored with full vector state back to Local IndexedDB.

### 📽️ 5. Video Studio
- **Registry-Driven Models**: Capability metadata in `VIDEO_MODEL_CATALOG` drives the UI — text-to-video, image-to-video, reference-to-video, first/last-frame control, audio, resolutions, durations, and aspect ratios.
- **Backends**: Gemini-native (Veo long-running ops, Omni synchronous) or AI Gateway video jobs, both polled via `/api/video/poll`.
- **Voiceovers & Narration**: Per-asset audio, voiceover synthesis, and image-to-script.

### 🎙️ 6. Voiceover Studio
- AI-cast narration guidelines, tone and speed control, and script enhancement.

### ⚙️ 7. Campaigns, Blogs & Scheduling
- Campaign workspaces, blog generation from campaigns, webhook publishing, and timed schedules.

### 🏗️ 8. Clean & Performant Architecture
- **Three-Layered AI**: thin client `fetch()` wrappers → Next.js API route handlers → real `@google/genai` / AI SDK implementations in `services/server/*`. Keep the parallel files in sync.
- **State Separation**: Business logic lives in `/hooks/useAppEngine.ts`; components stay visual.
- **IndexedDB Sync**: Persists complex image streams, custom layouts, and research sessions locally.

---

## 🛠️ Architecture and File Guide

```bash
├── app/
│   ├── page.tsx                  # Dynamically imports the client app (ssr: false)
│   └── api/                      # Route handlers (thin JSON/SSE pass-through)
│       ├── campaign/             # generate, blog, research, research-chat (SSE)
│       ├── image/                # generate, edit
│       ├── video/                # generate, poll, models, assets, segment, …
│       ├── voice/                # synthesize, image-to-script
│       └── models/               # catalog, refresh, verify
├── components/                   # App, Sidebar, ResearchCenter, VideoStudio,
│                                 # VoiceoverStudio, ModelsSettings, …
├── hooks/
│   └── useAppEngine.ts           # Central state controller (business logic)
├── services/
│   ├── ai/                       # Client-side fetch() wrappers (browser)
│   │   ├── imageService.ts       # campaignService.ts, videoService.ts, …
│   ├── server/                   # Real Gemini / AI SDK implementations (server-only)
│   │   ├── config.ts             # Model names + getAi() + gateway credentials
│   │   ├── modelRouter.ts        # Builds the full model catalog
│   │   ├── gatewayText.ts        # gatewayImage.ts, gatewaySpeech.ts,
│   │   │                         # gatewayVideo.ts (share gatewayClient.ts)
│   │   └── campaignService.ts    # Research grounding + phase callbacks
│   └── geminiService.ts          # Back-compat re-exports of the modular services
├── types.ts                      # Client-safe model catalogs & shared types
├── next.config.ts                # serverExternalPackages + Windows watchOptions.poll
└── .env.local                    # (gitignored) API keys, see .env.example
```

---

## 🛠️ Getting Started

### Prerequisites
- Node.js and npm
- A Google AI API key (`GEMINI_API_KEY`) — required for the Gemini backend

### Installation

```bash
# Install dependencies
npm install

# Configure environment (copy the template)
cp .env.example .env.local
# → set GEMINI_API_KEY (required)
# → optionally set AI_GATEWAY_API_KEY + AI_GATEWAY_BASE_URL to enable third-party models

# Start development server
npm run dev
```

The application automatically runs on port **3000**. Open [http://localhost:3000](http://localhost:3000) to view the development preview.

### Verification

```bash
npm run build   # Typecheck (tsc) + production build + lint gate
npm run lint    # next lint (there is no ESLint config; Next defaults apply)
```

---

*Created as a production-grade social and brand visualization tool, engineered with clean code paradigms and elegant typography.*
