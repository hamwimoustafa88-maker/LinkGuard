# Contributing to LinkGuard · المساهمة في LinkGuard

First off — **thank you!** 💚 LinkGuard is a community project, and every issue, idea, and pull
request makes it better. This guide explains how to contribute effectively.

*شكراً لك! LinkGuard مشروع مجتمعي، وكل مشكلة أو فكرة أو طلب دمج يجعله أفضل. يشرح هذا الدليل كيف
تساهم بفعالية.*

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Ways to Contribute](#-ways-to-contribute--طرق-المساهمة)
- [Development Setup](#-development-setup--إعداد-بيئة-التطوير)
- [Project Structure](#-project-structure--بنية-المشروع)
- [Making Changes](#-making-changes--إجراء-التغييرات)
- [Commit Convention](#-commit-convention--اصطلاح-الرسائل)
- [Pull Request Process](#-pull-request-process--عملية-طلب-الدمج)
- [Core Principles](#-core-principles--مبادئ-أساسية)

---

## 🤝 Code of Conduct

Be respectful, constructive, and welcoming. We build in **two languages (Arabic & English)** and
for a global audience — assume good intent and keep discussions friendly.

*كن محترماً وبنّاءً ومرحّباً. نبني بلغتين (عربي وإنجليزي) ولجمهور عالمي — افترض حسن النية وحافظ
على نقاش ودّي.*

---

## 💡 Ways to Contribute · طرق المساهمة

- 🐛 **Report a bug** — open a [Bug Report](https://github.com/hamwimoustafa88-maker/LinkGuard/issues/new?template=bug_report.yml).
- 💭 **Suggest a feature** — open a [Feature Request](https://github.com/hamwimoustafa88-maker/LinkGuard/issues/new?template=feature_request.yml).
- 🌐 **Improve translations** — refine Arabic/English copy or RTL layout.
- 📚 **Improve docs** — fix typos, clarify the README, or add examples.
- 🛡️ **Add a threat source** — integrate a new reputation API (see [Core Principles](#-core-principles--مبادئ-أساسية)).
- 🧪 **Write tests** — increase coverage in `__tests__/`.

---

## 🔧 Development Setup · إعداد بيئة التطوير

**Prerequisites:** Node.js `20.9+` and npm.

```bash
# Fork, then clone your fork
git clone https://github.com/<your-username>/LinkGuard.git
cd LinkGuard

npm install
cp .env.example .env.local   # PowerShell: Copy-Item .env.example .env.local
npm run dev                  # http://localhost:3000
```

> All API keys are **optional** — the app runs and scans without any of them.
> *(كل مفاتيح الـ API اختيارية — يعمل التطبيق ويفحص بدونها.)*

---

## 🗂️ Project Structure · بنية المشروع

```
LinkGuard/
├── app/                # Next.js App Router — pages + API routes
│   ├── api/            # Backend routes (resolve, virustotal, safebrowsing, domaininfo, …)
│   └── status/         # Live source-health page
├── components/         # React UI components
├── hooks/              # React hooks (useScan, …)
├── lib/                # Shared server/client helpers — scan.ts, verdictTheme.ts, server/apiHelpers.ts, …
├── utils/              # Core logic — scoring.ts, brandMatcher.ts, translations.ts, …
├── types/              # TypeScript type definitions
├── __tests__/          # Vitest test suite
├── scripts/            # Build/dev scripts (PWA icon generation)
├── public/             # Static assets
└── docs/               # Documentation & the logo master
```

---

## ✏️ Making Changes · إجراء التغييرات

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/short-description   # or fix/…, docs/…, test/…
   ```
2. Make your change with focused, readable commits.
3. **Run all checks before pushing** — the CI runs these too:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Add or update tests in `__tests__/` for any behavior change.

---

## 📝 Commit Convention · اصطلاح الرسائل

We follow [Conventional Commits](https://www.conventionalcommits.org/). Prefix your message:

| Prefix | When to use |
| :--- | :--- |
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `chore:` | Tooling, deps, config |

**Example:** `feat: add PhishTank source with graceful fallback`

---

## 🚀 Pull Request Process · عملية طلب الدمج

1. Open an **issue first** for anything non-trivial, so we can align on the approach.
2. Push your branch and open a PR against `main`, filling in the PR template.
3. Ensure `lint`, `typecheck`, and `test` all pass ✅.
4. Link the related issue (e.g. `Closes #12`).
5. A maintainer reviews, requests changes if needed, and merges. 🎉

---

## 🛡️ Core Principles · مبادئ أساسية

Please keep these invariants intact — they are what makes LinkGuard trustworthy:

1. **Graceful degradation** — a new or failing source must **never** break an existing scan. A
   missing API key skips the source and lowers confidence; it does not throw.
2. **Explainability** — every signal that affects the risk score must surface in the
   "Why this verdict?" panel with its source status.
3. **Privacy & safety** — never visit a link on the user's behalf beyond controlled resolution;
   keep the SSRF guard (`lib/server/ssrfGuard.ts`) intact wherever it's used — `/api/resolve`
   and `/api/domaininfo` today.
4. **Bilingual UX** — new UI text must be provided in both Arabic and English, with correct RTL.
5. **Reuse the shared route helpers** — a new source route should build on
   `lib/server/apiHelpers.ts` (timeouts, caching, rate limiting, request validation) rather
   than reimplementing them.

*حافظ على هذه الثوابت: التدهور الآمن، قابلية التفسير، الخصوصية والأمان، والواجهة ثنائية اللغة.*

---

<div align="center">

Questions? Open a [Discussion or Issue](https://github.com/hamwimoustafa88-maker/LinkGuard/issues).

**Happy hacking! 🛡️**

</div>
