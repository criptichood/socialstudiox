# AGENTS.md

Next.js 15 (App Router) single-page AI creative studio. All Gemini calls run server-side through API route handlers; the browser UI is one client bundle.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run build` — the typecheck gate (Next runs `tsc` during build); run this to verify TS changes
- **Do NOT run `npm run lint`.** There is no ESLint config file, so `next lint` hangs on an interactive "configure ESLint?" prompt. Verification is `npm run build` alone.
- No test framework exists.
- Both `bun.lock` and `package-lock.json` are committed. Use `npm`.

## Architecture (read this first)

- `app/[[...slug]]/page.tsx` (catch-all route) dynamically imports `components/App.tsx` with `ssr: false` — the whole app is client-side. Almost everything under `components/`, `hooks/`, `services/ai/`, `lib/` runs in the browser. `useAppEngine` reads the pathname to restore state on refresh.
- Gemini calls are **three-layered**. Adding a Gemini feature means touching all three:
  1. `services/ai/*` — client-side `fetch()` wrappers (e.g. POST to `/api/image/generate`)
  2. `app/api/**/route.ts` — Next.js route handlers, thin JSON pass-through, `{ error }` + 500 on failure
  3. `services/server/*` — the actual `@google/genai` implementations
  - `services/ai/` and `services/server/` have parallel files (`imageService.ts`, `campaignService.ts`, `videoService.ts`, `voiceService.ts`, `blogService.ts`). Keep them in sync. `services/server/` also holds server-only modules with no client twin (`modelRegistry.ts`, `modelRouter.ts`, `gateway*.ts`, `blogPublishService.ts`, `cloudinaryService.ts`). There is no `services/ai/config.ts` — model names and `getAi()` live only server-side in `services/server/config.ts`; client wrappers are thin `fetch()` calls.
- `hooks/useAppEngine.ts` is the central state controller (business logic; components stay visual). Route changes, project state, and panel state all flow through it.
- `@google/genai`, the AI SDK (`ai`, `@ai-sdk/gateway`), and `cloudinary` are listed in `serverExternalPackages` in `next.config.ts` — they must only be imported from server-side files (`services/server/*`, `app/api/*`). Never import them in client code.
- **Video models are registry-driven.** Capability metadata lives in `VIDEO_MODEL_CATALOG` (`types.ts`, client-safe); `services/server/modelRegistry.ts` adds server-only lookup helpers. Every model declares `backend: 'gemini' | 'gateway'` plus capabilities (t2v/i2v/r2v/first-last-frame), image input mode, audio, resolutions/durations/aspect ratios. The UI (`components/VideoStudio.tsx`) fetches the catalog from `GET /api/video/models` (which also reports `gatewayConfigured`) and renders controls conditionally. Keep catalog metadata in sync with the adapter implementations.
- `@/*` path alias maps to the repo root.
- Style prompt guides live in `services/stylesGuide.ts`; shared types in `types.ts`.
- **User feedback goes through sonner toasts.** `<Toaster />` is mounted once in `components/App.tsx` (theme-aware). Use the helpers in `lib/feedback.ts` (`notifyError`, `notifySuccess`, `beginLoading`/`resolveToast`, `withErrorToast`) or `toast` from `sonner` directly. Route thrown errors through `toFriendlyError`/`classifyError` from `lib/errors.ts` so users see a readable message while the technical detail goes to the console — don't leave bare `console.error` + silent `return null` or ad-hoc inline error banners for new features.
- Blog scheduling is **client-side only**: schedules live in IndexedDB (`useBlogEngine.ts`), and `runDueSchedules` fires on a 60s `setInterval` **only while the app is open**. There is no server-side cron. Due posts publish immediately when the app reopens. Recurring cron next-run math lives in `lib/cron.ts` (`nextCronRun`/`describeCron`).

## Env & Gemini

- `GEMINI_API_KEY` (in `.env.local`, gitignored) is required; the server falls back to legacy `API_KEY`. See `.env.example`.
- Optional `AI_GATEWAY_API_KEY` (+ `AI_GATEWAY_BASE_URL`) enables third-party models routed through the Vercel AI Gateway — not just video. The AI SDK gateway adapters live in `services/server/gatewayVideo.ts`, `gatewayText.ts`, `gatewayImage.ts`, `gatewaySpeech.ts`, all sharing `gatewayClient.ts` (`buildGateway()` + 15-min timeout). `services/server/config.ts` centralizes the credential reads (`getGatewayConfig`, `isGatewayConfigured`). Gemini stays the default backend; the Model Management view (`/models`, `components/ModelsSettings.tsx`) picks per-modality defaults and can live-test any model via `POST /api/models/verify`.
- `GET /api/models` returns the full model catalog (`buildModelCatalog()` in `services/server/modelRouter.ts`): Gemini-native + curated gateway entries for text/image/voice, plus the video catalog. `POST /api/models/refresh` lists the gateway's live language models via the SDK's `getAvailableModels()`.
- Model catalogs are client-safe in `types.ts`: `GATEWAY_TEXT_MODELS`, `GATEWAY_IMAGE_MODELS`, `GATEWAY_VOICE_MODELS` (curated from `@ai-sdk/gateway` ID lists) plus `VIDEO_MODEL_CATALOG`. `gatewayBackendForId(modality, id)` derives the runtime backend; client wrappers send `backend` with each request and the routes dispatch. Text models declare `vision: boolean` (image-input support) in the catalogs; `textModelSupportsVision(id)` is the client-safe lookup. Research chat works on any curated text model: grounding runs through a dedicated `googleSearch` tool model (`SEARCH_MODEL`, Gemini), injecting results into the selected model, and image uploads are passed to vision-capable models as inline parts (`gatewayText.ts` supports AI SDK image parts).
- Route handlers accept an optional `x-gemini-api-key` header override (used when a user supplies their own key).
- Model names are defined in `services/server/config.ts` (`gemini-3.5-flash` text, `gemini-3.1-flash-image` image/edit) and in `VIDEO_MODEL_CATALOG` (`types.ts`) for video models. Change them in those files.

## Video generation flow

- `POST /api/video/generate` dispatches by `backend` from the model registry: `gemini` → Veo (long-running op, polled) or Omni (synchronous); `gateway` → `services/server/gatewayVideo.ts`, which runs the **synchronous** AI SDK `experimental_generateVideo` call as a fire-and-forget job and returns an `operationName`. The client polls `POST /api/video/poll` with `{ operationName, provider }`.
- Gateway video jobs live in an in-memory `Map` (like Veo operations) — lost on server restart; the poll route then returns a clear error. Gateway calls exceed undici's default 5-min timeout, so a 15-min `AbortSignal.timeout` fetch wrapper is applied.

## Gotchas

- `next.config.ts` sets webpack `watchOptions.poll` for Windows hot-reload — a deliberate workaround, don't remove it.
- Tailwind uses `darkMode: 'class'`; theme toggling is handled in `components/App.tsx`.
- The README's file tree predates the Vite→Next migration and is stale. Trust the code.
- **Do NOT stop/restart the dev server just because you made changes.** `next dev` hot-reloads client and server code (including `app/api/**` route handlers) on its own. Only restart when it is absolutely necessary, e.g. the running server is serving a corrupted `.next` cache (the `Cannot find module './NNN.js'` / stale chunk error). `next build` and `next dev` share `.next`, so prefer verifying via `npm run build` without touching a running dev server; if a restart is genuinely required, say why.
