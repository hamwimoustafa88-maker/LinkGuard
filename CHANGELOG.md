# Changelog · سجل التغييرات

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased] — Open-source modernization

A full pass to prepare LinkGuard for its public release: the toolchain, the API layer, and
the client were each brought current and hardened. Highlights below; see the git history for
the complete, commit-by-commit record.

### ⚠️ Behavior change · تغيير في السلوك

- **`/api/resolve` no longer silently passes through an unresolved URL as a "clean" result.**
  Previously, if redirect resolution failed for any reason (network error, timeout, a host
  refusing HEAD/GET) and no `UNSHORTEN_API_KEY` fallback was configured, the route returned
  `success: true` with the *original, unscanned* URL — so a link that failed to resolve could
  end up reported as safe. It now returns `success: false` with a `resolve_failed` code, and
  the UI surfaces an explicit error instead. *(`app/api/resolve/route.ts`)*

  *لم يعد `/api/resolve` يمرّر الرابط الأصلي كنتيجة "آمنة" بصمت عند فشل التتبّع — أصبح يُرجع
  خطأً صريحاً بدلاً من ذلك.*

### Upgraded

- Next.js 14 → 16, React 18 → 19, Tailwind CSS 3 → 4, ESLint 8 → 9 (flat config), Vitest 1 → 4.
- Node.js `18+` → `20.9+`; toolchain now tested on Node 20/22/24 in CI.

### Fixed

- **SSRF**: the redirect follower could return an unvalidated URL as `finalUrl` when the
  8-hop budget ran out mid-redirect; it's now re-validated before being handed to the other
  scan sources.
- **VirusTotal engine list was always empty in the UI** (`vtDetails.scans` was never actually
  populated by the API) even when detections existed — fixed at the source; the response now
  returns `vtEngines`/`vtUrlMeta` as distinct, correctly-shaped fields.
- `font-cairo` was silently falling back to a system sans-serif font — a Tailwind config
  mismatch with the `next/font` variable it was supposed to reference.
- `/api/health` was evaluated at build time under Next 14 (no explicit caching directive), so
  `/status` could show a stale, build-time snapshot; now explicitly `force-dynamic`.
- Two of the five threat-intel API routes (`virustotal`, `urlscan`) had no fetch timeout at
  all; a hung upstream could pin a server invocation for its full `maxDuration`.
- The rate limiter was a fixed window despite being documented as "sliding" (allowed a 2×
  burst at the window boundary); now a real sliding-window approximation. All 7 API routes are
  now rate-limited (previously only `/api/resolve` was).
- Cached error/partial results from `/api/blocklists` and `/api/domaininfo` were pinned for
  the full TTL (up to 6 hours); now capped at 60 seconds for anything but a clean result.
- Removed a broken `.agents/` gitlink configuration that made `git clone --recurse-submodules`
  fail for every contributor.

### Changed

- Scoring policy (`utils/scoring.ts`) and scan orchestration (`lib/scan.ts`) are now pure,
  independently testable functions, extracted out of `app/page.tsx`'s 178-line `handleScan`.
- Server-side duplication (env-key sanitizing, fetch timeouts, cache preambles, request
  validation) consolidated into `lib/server/apiHelpers.ts`.
- Translation keys (`utils/translations.ts`) are now statically typed — a key present in one
  language but missing from the other is a build error, not a silent runtime fallback.
- `components/ScanHistory.tsx` now subscribes to live history updates instead of snapshotting
  once on mount, so a scan completed in the current session appears immediately.

## [1.0.0]

Initial public release, prior to the open-source modernization pass above.
