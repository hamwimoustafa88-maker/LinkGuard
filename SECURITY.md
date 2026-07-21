# Security Policy · سياسة الأمان

## 🛡️ Reporting a Vulnerability · الإبلاغ عن ثغرة

**Please do NOT report security vulnerabilities through public GitHub issues.**

*يرجى **عدم** الإبلاغ عن الثغرات الأمنية عبر مشاكل GitHub العامة.*

Instead, report them privately via GitHub's
[**Security Advisories**](https://github.com/hamwimoustafa88-maker/LinkGuard/security/advisories/new).
This lets us assess and fix the issue before it becomes public.

*بدلاً من ذلك، أبلغ عنها بشكل خاص عبر
[**التنبيهات الأمنية**](https://github.com/hamwimoustafa88-maker/LinkGuard/security/advisories/new)
في GitHub، مما يتيح لنا تقييم المشكلة وإصلاحها قبل أن تصبح علنية.*

When reporting, please include:

- A description of the vulnerability and its impact.
- Steps to reproduce (a proof of concept if possible).
- Affected version / commit and environment.
- Any suggested remediation.

*عند الإبلاغ، أرفق: وصف الثغرة وأثرها، خطوات إعادة الإنتاج، النسخة/الـ commit المتأثر، وأي حل مقترح.*

## ⏱️ Response Expectations · ما تتوقعه

- **Acknowledgement:** within **72 hours**. · تأكيد الاستلام خلال 72 ساعة.
- **Assessment & triage:** within **7 days**. · تقييم وفرز خلال 7 أيام.
- We will keep you informed of progress and credit you in the fix (unless you prefer to remain
  anonymous). · سنبقيك على اطلاع وننسب لك الفضل في الإصلاح (ما لم تفضّل عدم الكشف عن هويتك).

## 📌 Scope · النطاق

LinkGuard is a client + Next.js API scanner. Security-relevant areas include:

- **SSRF protection** in `/api/resolve` (redirect resolution must not reach internal networks).
- **API key handling** — keys are server-side only and must never be exposed to the client.
- **Input handling** of user-supplied URLs across all API routes.
- **Dependency vulnerabilities** in the npm supply chain.

*مناطق الأمان المهمة: حماية SSRF في `/api/resolve`، التعامل مع مفاتيح الـ API من جهة الخادم فقط،
معالجة الروابط المُدخلة، وثغرات الاعتماديات.*

## ✅ Supported Versions · النسخ المدعومة

Security fixes are applied to the latest `main` branch. Please ensure you are running the most
recent version before reporting.

*تُطبَّق الإصلاحات الأمنية على أحدث فرع `main`. تأكد من استخدامك أحدث نسخة قبل الإبلاغ.*

---

Thank you for helping keep LinkGuard and its users safe. 🙏
*شكراً لمساعدتك في الحفاظ على أمان LinkGuard ومستخدميه.*
