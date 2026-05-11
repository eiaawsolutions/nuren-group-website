# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on `:3000` (host `0.0.0.0`). Does **not** run the Express server, so `/api/*` and `/admin/*` are unavailable in dev — chat/enquiry features only work against `npm start`.
- `npm run build` — `vite build` then `node scripts/prerender.mjs`. The prerender step is required for SEO (see Architecture). Use `npm run build:client` to skip prerendering when iterating locally.
- `npm run prerender` — re-run the prerender pass against an existing `dist/`.
- `npm start` — boots `server.js` (Express). This is the production entry point used by Railway and the only way to exercise chat / enquiry / admin endpoints. Needs `dist/` to exist.
- `npm run lint` — `tsc --noEmit`. Type-check only; there is no ESLint config.
- `node scripts/test-detect-lang.mjs` — runs the language-detection fixtures used by the chatbot. The regexes here must stay in sync with the ones in `server.js`.

There is no test runner configured beyond the language-detection script.

## Architecture

This is a hybrid **SPA + prerendered HTML + Express API** site, not a pure SPA and not SSR.

**Frontend (`src/`)** — React 19 + Vite + Tailwind 4 + Motion + react-router-dom + react-helmet-async. The entire site is a single `BrowserRouter` defined in `src/App.tsx:2780-2820`. Routes: `/`, `/ecosystem`, `/products`, `/investors`, `/investors/corporate-governance`, `/investors/governance-documents` (+ `:docId`), `/board-of-directors`, `/media-hub`, `/careers`, and `/admin`. Almost every page-level component lives inline in `App.tsx` (~2800 lines) — `Home`, `EcosystemPage`, `ProductsPage`, `InvestorsPage`, `MediaHubPage`, `CorporateGovernancePage`, `GovernanceDocumentsPage`, `BoardOfDirectorsPage`, `CareersPage`, plus shared `Header`/`Footer`/modals. Only the `Chatbot` and `AdminPage` are extracted to `src/components/`. When making page edits, expect to grep within `App.tsx` rather than hunting for separate files.

**Build pipeline** — `vite.config.ts` configures path alias `@/*` → repo root and **manual chunk splitting** for `react`/`react-router`, `motion`, `react-helmet-async`, `lucide-react`. Don't collapse those chunks back into the main bundle: a deploy that only changes `App.tsx` would otherwise invalidate ~140KB of vendor cache (the comment in `vite.config.ts:14-19` explains why).

**Prerender step (`scripts/prerender.mjs`)** — after `vite build`, Puppeteer walks each route in `ROUTES` and writes `dist/<route>/index.html` files containing the fully-rendered DOM (with Helmet meta and JSON-LD already painted). Express serves these via `express.static` so Googlebot, ClaudeBot, GPTBot, etc. get real content instead of an empty `<div id="root">`. **When adding a new route in `App.tsx`, also add it to `ROUTES` in `scripts/prerender.mjs` and to `public/sitemap.xml`** — otherwise it won't be indexed. Routes with dynamic params (e.g. `:docId`) intentionally stay client-rendered and rely on the SPA fallback in `server.js:806-811`.

**Backend (`server.js`)** — single-file Express app. Responsibilities:

- `POST /api/chat` — calls Anthropic (`claude-haiku-4-5-20251001`) with the `NUREN_KNOWLEDGE` system prompt baked into `server.js:17-239`. The full Nura sales playbook (positioning, ecosystem, audience stats, services, sales flow, objection handling, push-to-form triggers, guardrails, 2026 media kit facts) lives in this string — **edit it directly to update the chatbot's behaviour, not from the admin UI** (the admin UI shows it read-only). The frontend uses Gemini-style `role: 'user' | 'model'` history; `toAnthropicMessages` maps `model` → `assistant` at the boundary.
- **Language override** (`server.js:436-522`) — Haiku 4.5 has a stubborn English default for marketing-context replies, so we don't trust the model to follow the in-prompt LANGUAGE rule. `detectReplyLanguage` runs hard regex heuristics (`HAN_RE` for Han characters → Mandarin; `BM_MARKERS` word list → Bahasa Malaysia) over the current message and last 3 user turns, then `languageDirective` appends a CRITICAL OVERRIDE block to the system prompt. The detected language is exposed via the `X-Nura-Lang` response header for debugging. If you change the BM marker list, update `scripts/test-detect-lang.mjs` to match.
- `POST /api/enquiry` — validates the chat enquiry form, delivers via Resend (`RESEND_API_KEY` env var), falls back to logging if not configured. Includes a `website` honeypot field, CR/LF stripping on `topic` (header injection), and a per-IP hourly rate limit. The in-memory `enquiryLog` ring buffer **only stores hashed emails + minimal preview** — full PII is sent to Petrina via Resend and dropped server-side (see `server.js:622-631`).
- `/admin/*` — Basic Auth (against `SUPERADMIN_PASSWORD`) with timing-safe compare, 5-failure / 15-minute IP lockout, and a generic "Admin access unavailable" 503 when the password env var is unset (deliberately doesn't name the env var to avoid giving an attacker the exact key to look for).
- **Rate limiting** uses `lru-cache` with TTL — there is no Redis, so limits are per-process and reset on restart. Three independent buckets: chat (20/min), enquiry (5/hr), admin (10/min). `app.set('trust proxy', true)` is required so `req.ip` walks `X-Forwarded-For` correctly behind Railway — don't read `X-Forwarded-For` directly (spoofable).
- **Security headers** via Helmet with a hand-tuned CSP that allows YouTube/Instagram iframes; `connectSrc` is `'self'` only because the chat call is server-side, never browser → Anthropic. `referrerPolicy` is `strict-origin-when-cross-origin` (not Helmet's `no-referrer` default) because YouTube embeds need a Referer to validate origin.
- **Static serving** sets `Cache-Control: max-age=0, must-revalidate` on `.html` (so deploys propagate immediately) and `max-age=31536000, immutable` on hashed `assets/*.{js,css,woff2}`. The path-normalisation regex is built to work on Windows (`\\` → `/`). The SPA fallback adds `X-Robots-Tag: noindex, nofollow` for `/admin` and `/api` paths.

**Deployment** — `railway.json` defines the Railway build (`npm install && npm run build`) and start (`node server.js`) with `/healthz` as the healthcheck. **Ignore the Netlify instructions in README.md** — those are stale; production runs on Railway via the Express server. Required env vars: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `SUPERADMIN_PASSWORD`. Optional: `ENQUIRY_FROM_EMAIL` (must be from a Resend-verified domain — fallback uses Resend's sandbox sender which only delivers to the Resend account owner), `ENQUIRY_RECIPIENT`, `PORT`, `DISABLE_HMR`.

**TypeScript config** — `noEmit: true`, `allowImportingTsExtensions: true`, `jsx: react-jsx`. `tsconfig.json` is the only config; there's no `tsconfig.node.json` for the scripts (they're `.mjs`).
