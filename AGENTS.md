# AGENTS.md

Next.js 15 (App Router) single-page AI creative studio. All Gemini calls run server-side through API route handlers; the browser UI is one client bundle.

## Commands

- `npm run dev` — dev server on port 3000
- `npm run lint` — `next lint` (there is no ESLint config file; Next defaults apply)
- `npm run build` — the typecheck gate (Next runs `tsc` during build); run this to verify TS changes
- No test framework exists. Verification is `npm run build` + `npm run lint`.
- Both `bun.lock` and `package-lock.json` are committed. Use `npm`.

## Architecture (read this first)

- `app/page.tsx` dynamically imports `components/App.tsx` with `ssr: false` — the whole app is client-side. Almost everything under `components/`, `hooks/`, `services/ai/` runs in the browser.
- Gemini calls are **three-layered**. Adding a Gemini feature means touching all three:
  1. `services/ai/*` — client-side `fetch()` wrappers (e.g. POST to `/api/image/generate`)
  2. `app/api/**/route.ts` — Next.js route handlers, thin JSON pass-through, `{ error }` + 500 on failure
  3. `services/server/*` — the actual `@google/genai` implementations
  - `services/ai/` and `services/server/` have parallel files (`config.ts`, `imageService.ts`, `campaignService.ts`, `videoService.ts`, `voiceService.ts`). Keep them in sync.
- `hooks/useAppEngine.ts` is the central state controller (business logic; components stay visual). Route changes, project state, and panel state all flow through it.
- `@google/genai` is listed in `serverExternalPackages` in `next.config.ts` — it must only be imported from server-side files (`services/server/*`, `app/api/*`). Never import it in client code.
- `@/*` path alias maps to the repo root.
- Style prompt guides live in `services/stylesGuide.ts`; shared types in `types.ts`.

## Env & Gemini

- `GEMINI_API_KEY` (in `.env.local`, gitignored) is required; the server falls back to legacy `API_KEY`. See `.env.example`.
- Route handlers accept an optional `x-gemini-api-key` header override (used when a user supplies their own key).
- Model names are defined in `services/{ai,server}/config.ts`: `gemini-3.5-flash` (text), `gemini-3.1-flash-image` (image + edit). Change them in both files.

## Gotchas

- `next.config.ts` sets webpack `watchOptions.poll` for Windows hot-reload — a deliberate workaround, don't remove it.
- Tailwind uses `darkMode: 'class'`; theme toggling is handled in `components/App.tsx`.
- The README's file tree predates the Vite→Next migration and is stale. Trust the code.
