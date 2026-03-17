# Project Overview / Code Review Summary

## Summary
VibePass appears to be a mobile-first ticketing web app for discovering movies/events, viewing theatres/showtimes, selecting seats, and completing bookings, with Firebase-based login and a custom Node/Express backend for movie/theatre data aggregation. The likely audience is end users booking entertainment tickets and developers experimenting with a full-stack booking UX. **(assumption)** The project is currently oriented toward prototype/demo usage: several backend behaviors are mocked or in-memory, and many standalone scraping/test scripts indicate active experimentation rather than hardened production operations.

## Architecture
The project is a TypeScript/React SPA plus a Node/Express server in a single codebase.

Frontend:
- `src/main.tsx` mounts the React app.
- `src/App.tsx` defines route structure, auth/onboarding guards, and animated transitions.
- `src/pages/*` contains page-level flows: home discovery, event details, showtimes, booking, checkout, ticket, profile, etc.
- `src/components/*` contains reusable UI parts (theatre list, cards, nav, city selector).
- State is centralized in `src/store/useStore.ts` (Zustand + persistence).
- Auth and Firestore are initialized in `src/firebase.ts`.

Backend:
- `server.ts` boots Express + Vite middleware (dev), exposes `/api/*` routes, and proxies/scrapes Paytm/YouTube data.
- Seat inventory and reservations are in memory (`Map`) with SSE updates for real-time seat status.
- Caching uses `node-cache`.

Data flow (high level): UI (`fetch`) -> local Express API -> external providers (Paytm/YouTube/TMDB) -> transformed response -> UI state/render.

## Entry Points & Key Modules
- Primary server entry: `server.ts` (`startServer()`).
- Primary frontend entry: `src/main.tsx` -> `src/App.tsx`.
- Important APIs in `server.ts`:
  - `GET /api/movies`, `GET /api/movies/:id`
  - `GET /api/movies/:id/showtimes`
  - `GET /api/theatres`, `GET /api/theatres/:id/showtimes`
  - Seat lifecycle: `GET /api/events/:id/seats`, `.../stream`, `POST .../reserve`, `POST .../commit`
- Core client services:
  - `src/services/tmdb.ts` (movie/trailer fetch logic)
  - `src/services/api.ts` (Axios client + token refresh interceptor, currently mocked refresh behavior)

## Dependencies & Build
Detected stack: Node.js + TypeScript + React + Vite + Express.

Key dependencies: `react`, `react-router-dom`, `zustand`, `firebase`, `express`, `axios`, `node-cache`, `cheerio`, `puppeteer`, `framer-motion`, `vite`, `tsx`.

Exact commands:
- Install: `npm install`
- Local run (recommended): `npm run dev`
  - This runs `tsx server.ts`, and the server mounts Vite middleware in non-production mode.
- Type-check/lint step: `npm run lint`
- Frontend build: `npm run build`
- Preview built frontend: `npm run preview`

Environment/config:
- `.env.example` references `GEMINI_API_KEY`, `APP_URL`, and `VITE_TMDB_API_KEY`.
- `vite.config.ts` injects `process.env.GEMINI_API_KEY` from env.

## Tests & Coverage
- No formal test framework is configured in `package.json` scripts (no `test` script).
- Repository includes many standalone diagnostic scripts at root (`test-*.js`, `test-*.ts`) aimed at scraping/parsing/API checks.
- No CI workflows detected under `.github/workflows/`.
- Coverage tooling/artifacts are not configured.

## Identified TODOs & Improvements
1. Add a standardized test runner (Vitest/Jest) and formal `npm test` workflow; current ad hoc scripts do not provide reliable regression safety.
2. Replace in-memory seat/reservation stores with persistent backing (Redis/DB) to survive restarts and support concurrency.
3. Implement real authz checks for booking APIs (`reserve/commit`) instead of trusting client-provided `userId`.
4. Externalize all API keys/secrets to environment variables and remove hardcoded keys from source.
5. Add CI pipeline (type-check + tests + build) to prevent broken merges.
6. Split backend routes/services in `server.ts` into modules for maintainability and safer changes.
7. Replace mock token refresh flow in `src/services/api.ts` with real backend refresh endpoint.
8. Improve docs beyond AI Studio quickstart: architecture, API contract, and operational setup.

## Risks & Security Concerns
- **(risk)** Hardcoded TMDB key in `src/services/tmdb.ts` (`TMDB_API_KEY`) should be treated as sensitive and moved to env config.
- **(risk)** Firebase config in `firebase-applet-config.json` includes an API key value; while Firebase web keys are often public, storing credentials in tracked files increases accidental exposure risk.
- **(risk)** `server.ts` sets `Access-Control-Allow-Origin: *`; permissive CORS can enable abuse if this is deployed without stricter controls.
- **(risk)** Booking endpoints accept client `userId` and do not verify authenticated identity.
- **(risk)** Seat/reservation state is in-memory only; restarts can invalidate reservations/bookings and create consistency issues.
- `dangerouslySetInnerHTML` exists in `src/pages/CinematicPreview.tsx`, but currently injects static CSS (low immediate exploit risk).

## File Map
- `src/` — Frontend application code (routes, pages, components, services, Zustand store).
- `server.ts` — Express API server + Vite middleware + scraping/proxy logic + seat reservation flow.
- `app/` — Additional applet/testing folder (`app/applet/test-paytm2.ts`).
- `test-*.js` / `test-*.ts` — Standalone experiment scripts for scraping/API parsing.
- `firebase-applet-config.json` — Firebase project/app configuration consumed by frontend.
- `package.json` — Dependencies and scripts (`dev`, `build`, `preview`, `lint`).
- `README.md` — AI Studio-oriented setup notes.

## Quick Wins (≤1 day each)
1. Move TMDB key usage to env (`VITE_TMDB_API_KEY`) and remove hardcoded value from source — **small**.
2. Add `npm test` script with a minimal smoke suite for critical booking paths — **medium**.
3. Add a basic GitHub Actions CI (`npm ci`, `npm run lint`, `npm run build`) — **small**.
4. Tighten CORS to known frontend origin(s) via env configuration — **small**.
5. Document API endpoints and payloads in `README.md` (or dedicated docs section) — **trivial**.

## Onboarding Checklist for New Contributors
- [ ] Install Node.js (LTS) and clone the repository.
- [ ] Run `npm install`.
- [ ] Copy `.env.example` to `.env.local` and set required values (`GEMINI_API_KEY`, optional TMDB key vars).
- [ ] Start local app: `npm run dev` (backend + Vite middleware on `http://localhost:3000`).
- [ ] Run static checks: `npm run lint`.
- [ ] Build once to validate frontend packaging: `npm run build`.
- [ ] Review routing/auth flow in `src/App.tsx` and global state in `src/store/useStore.ts`.
- [ ] Review backend endpoints in `server.ts`, especially booking and showtime APIs.

## Suggested Commit Message
`docs: add project intake summary and architecture overview`

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
