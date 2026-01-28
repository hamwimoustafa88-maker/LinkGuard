**Purpose**
- Help AI coding agents become productive quickly by summarizing architecture, workflows, conventions, and integration points.

**Big picture**
- Next.js (app directory, Next 14). UI in `components/`, server routes in `app/api/` (serverless-style handlers).
- Core helpers in `utils/` (see [utils/brandMatcher.ts](utils/brandMatcher.ts#L1)); domain code in `LinkGuard/`.

**External integrations**
- Required env vars (optional at runtime but recommended): `UNSHORTEN_API_KEY`, `URLSCAN_API_KEY`, `VIRUSTOTAL_API_KEY`.
- Behavior differences: `unshorten` and `urlscan` degrade to the original URL / null screenshot on failure; `virustotal` performs strict polling and returns 408 on timeout. See [app/api/virustotal/route.ts](app/api/virustotal/route.ts#L1).
- Respect 429 responses and treat them as temporary service-unavailable.

**Developer workflows**
- Install: `npm install`.
- Dev server: `npm run dev` (Next runs on port 3000).
- Build / start: `npm run build` then `npm run start` for production.
- Lint: `npm run lint` (Next.js ESLint config).

**Conventions & patterns**
- API routes use `NextRequest` / `NextResponse` and should return graceful fallbacks rather than throwing on external failure.
- Long polling (VirusTotal) must use `maxAttempts` and sleep intervals to avoid blocking serverless timeouts.
- UI components are presentational under `components/`; prefer small helpers in `utils/`.

**Quick example**
Call local unshorten API:

```bash
curl -X POST http://localhost:3000/api/unshorten \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://bit.ly/example"}'
```

**Files to check when changing behavior**
- [app/api/unshorten/route.ts](app/api/unshorten/route.ts#L1)
- [app/api/urlscan/route.ts](app/api/urlscan/route.ts#L1)
- [app/api/virustotal/route.ts](app/api/virustotal/route.ts#L1)
- [utils/brandMatcher.ts](utils/brandMatcher.ts#L1)

If anything here is unclear or you want translations / extra examples, tell me which part to expand.
**Purpose**
- **Goal:** Help AI coding agents become immediately productive in this repository by describing architecture, critical workflows, conventions, and integration points.

**Big Picture**
- **Framework:** Next.js (app directory, Next 14) — pages and server logic live under `app/`.
- **API surface:** Server routes are under [app/api](app/api) as Next.js route handlers (e.g. [app/api/unshorten/route.ts](../app/api/unshorten/route.ts), [app/api/virustotal/route.ts](../app/api/virustotal/route.ts), [app/api/urlscan/route.ts](../app/api/urlscan/route.ts)). Treat these as small serverless services.
- **UI:** Reusable UI lives in [components/](components) (examples: `QrScannerModal.tsx`, `SandboxWindow.tsx`, `StatusTerminal.tsx`).
- **Core logic:** Utility and decision logic is in `utils/` (see [utils/brandMatcher.ts](utils/brandMatcher.ts#L1)) and the `LinkGuard/` folder which contains domain-specific code.

**Integration Points & Behaviors**
- **External APIs:** `UNSHORTEN_API_KEY`, `URLSCAN_API_KEY`, `VIRUSTOTAL_API_KEY` are required for full behavior. Routes check these env vars and degrade gracefully when missing.
- **Degraded/strict behaviors:** `unshorten` and `urlscan` will fall back to returning the original URL or null screenshot to avoid breaking flows; `virustotal` implements strict polling and returns 408 if results aren't ready (see [app/api/virustotal/route.ts](../app/api/virustotal/route.ts#L1)).
- **Rate limits:** Code explicitly checks for 429 responses and treats them as busy conditions — mirror that behavior when adding integrations.

**Developer Workflows**
- **Install:** `npm install` (project uses `next`, `react`, `tailwindcss`, `typescript`).
- **Dev server:** `npm run dev` — starts Next.js on default port 3000.
- **Build / start:** `npm run build` and `npm run start` for production testing.
- **Lint:** `npm run lint` (uses Next.js ESLint setup).
- **No tests found:** There is no test runner configured — add tests alongside code if introducing them.

**Editing Patterns & Conventions**
- **API handlers:** Use `NextRequest` / `NextResponse` from `next/server` (see `app/api/*/route.ts`). Maintain non-blocking, user-friendly fallbacks for external failures.
- **Long-polling caution:** `virustotal` uses polling loops with explicit timeouts — avoid unbounded loops and respect the existing `maxAttempts` pattern.
- **UI components:** Keep presentational components in `components/` and share small helpers in `utils/`.
- **Environment:** Keep secrets in environment variables (local `.env.local` during dev). The repo expects API keys named exactly as above.

**Examples**
- Call the local unshorten API:

```bash
curl -X POST http://localhost:3000/api/unshorten \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://bit.ly/example"}'
```

- When updating an API route, run the dev server to iterate and test: `npm run dev`. Run `npm run build` to catch TypeScript / Next errors before merging.

**Files to review when changing behavior**
- API rules: [app/api/unshorten/route.ts](app/api/unshorten/route.ts#L1), [app/api/urlscan/route.ts](app/api/urlscan/route.ts#L1), [app/api/virustotal/route.ts](app/api/virustotal/route.ts#L1)
- Core helpers: [utils/brandMatcher.ts](utils/brandMatcher.ts#L1)
- UI surfaces: [components/](components)

**When in doubt**
- Prefer non-fatal degradation for any external integration so the primary UX (returning a URL) is preserved.
- Respect rate-limits and treat 429 responses as temporary service unavailability.

Please review — I can iterate on wording or add missing files/commands. 
