# 📱 دليل نشر LinkGuard على أندرويد · Android Deployment Guide

هذا الدليل يغطي تحويل LinkGuard (تطبيق Next.js) إلى تطبيق أندرويد عبر
**Capacitor 8**، وبناء حزمة **Android App Bundle (.aab)** موقّعة جاهزة لرفعها
على Google Play Console، بالإضافة إلى **Release APK** للاختبار الداخلي.

*This guide covers converting LinkGuard into an Android app via
**Capacitor 8**, building a signed **Android App Bundle (.aab)** ready for
Google Play Console, plus a **Release APK** for internal testing.*

---

## 🏗️ المعمارية · Architecture

LinkGuard يحتوي 7 مسارات API سرية (VirusTotal, urlscan.io, Safe Browsing,
URLhaus, AbuseIPDB, ...) لا يجوز تحزيمها داخل تطبيق موبايل — أي APK قابل
للتفكيك بسهولة، فتُسرَق المفاتيح. لذلك التطبيق هجين:

*LinkGuard holds 7 API routes carrying secret keys - these can never ship
inside a mobile bundle (any APK is trivially decompiled). So the app is
hybrid:*

```
LinkGuard.aab / .apk
 ├─ out/            ← Next.js static export (UI only, no app/api)
 └─ Capacitor 8 plugins: App / Network / StatusBar / SplashScreen / Camera
        │  fetch(NEXT_PUBLIC_API_BASE + '/api/*')
        ▼
   Vercel (or any Node host) — same repo, normal `next build`,
   secret keys as server-side Environment Variables
```

الـ backend مُستضاف بالفعل على `https://linkguard.scouthub.dev`. الجزء
المتحرك الوحيد المتبقي هو **دفع هذا الكود** حتى يصل `proxy.ts` (CORS) إلى
ذلك الموقع (انظر أدناه) — كل شيء آخر جاهز ومبني بالفعل في هذا المستودع.

*The backend is already hosted at `https://linkguard.scouthub.dev`. The one
remaining moving part is **pushing this code** so `proxy.ts` (CORS) reaches
that site (below) - everything else is already wired up and building in
this repo.*

---

## ✅ الحالة الحالية · Current State

| البند · Item | الحالة · Status |
|---|---|
| Capacitor 8 + منصة أندرويد · Android platform | ✅ مُهيّأ في `android/` · configured |
| Share Target (WhatsApp/Telegram/Chrome) | ✅ `ShareTargetPlugin.java` + `ShareTargetListener.tsx` |
| إذن الكاميرا لماسح QR · Camera permission | ✅ في `AndroidManifest.xml` |
| شاشة Offline · Offline screen | ✅ `components/OfflineOverlay.tsx` |
| زر الرجوع الفيزيائي · Hardware back button | ✅ `hooks/useAndroidBackButton.ts` |
| السحب للتحديث · Pull-to-refresh | ✅ `hooks/usePullToRefresh.ts` |
| Status bar / edge-to-edge (Android 15+) | ✅ `components/Providers.tsx` + `app/globals.css` |
| الأيقونات وشاشة البداية · Icons & splash | ✅ مولّدة لكل الكثافات · generated for every density |
| CORS على `/api/*` | ✅ `proxy.ts` (محلياً فقط · locally only - لم يُدفَع بعد · not pushed yet) |
| مفتاح توقيع تجريبي · Test signing key | ✅ مولَّد محلياً - **راجع القسم أدناه** · generated locally - **see below** |
| **دفع الكود إلى `linkguard.scouthub.dev` · Pushing the code live** | ⚠️ **لم يتم بعد - مطلوب منك** · **not done yet - your action** |
| اختبار على جهاز/محاكي · Device/emulator test | ⚠️ لا يوجد محاكٍ يعمل في هذه البيئة · no working emulator in this environment |

---

## ⚠️ الخطوة المطلوبة منك: دفع الكود إلى `linkguard.scouthub.dev`

المشروع مُستضاف بالفعل على Vercel على `https://linkguard.scouthub.dev` - لا
حاجة لأي استضافة جديدة أو مشروع Vercel جديد. الخطوة المتبقية الوحيدة هي دفع
هذه التغييرات (الفرع `feature/android-app`) حتى يعيد Vercel نشر **نفس**
الموقع تلقائياً بالكود الجديد:

```bash
git push origin feature/android-app
# ثم افتح Pull Request وادمجه في main (أو ادفع مباشرة لـ main إن كان هذا تدفق عملك)
```

الملف الوحيد الذي يهم فعلياً لعمل تطبيق الأندرويد ضد هذا الدومين هو
[`proxy.ts`](../proxy.ts) - يضيف رؤوس CORS التي يحتاجها `/api/*` للرد على
طلبات WebView (أصل `https://localhost`). **تحققت فعلياً أن الموقع الحالي
لا يملكها بعد:**

```bash
curl -i -X OPTIONS https://linkguard.scouthub.dev/api/resolve \
  -H "Origin: https://localhost" -H "Access-Control-Request-Method: POST"
# الرد الحالي: 204 بلا أي رأس Access-Control-Allow-Origin
```

بعد الدمج والنشر، أعد نفس الأمر وتحقق من ظهور
`Access-Control-Allow-Origin: https://localhost` في الرد.

`.env.mobile` مضبوط بالفعل على النطاق الحقيقي:

```
NEXT_PUBLIC_API_BASE=https://linkguard.scouthub.dev
NEXT_PUBLIC_SITE_ORIGIN=https://linkguard.scouthub.dev
```

بدون هذه الخطوة، التطبيق يُثبَّت ويعمل (الواجهة، QR، Share Target، Offline
screen) لكن أي فحص فعلي لرابط سيفشل لأن الـ WebView يحظر قراءة الرد بسبب
غياب رؤوس CORS.

---

## 🔑 مفتاح التوقيع · Signing Key

**تم توليد مفتاح توقيع تجريبي بالفعل** في هذه الجلسة لإتاحة بناء واختبار
APK/AAB موقَّعين فوراً:

- الملف · File: `C:\keys\linkguard-upload.jks`
- كلمة المرور · Password: محفوظة في `C:\keys\linkguard-upload.password.txt`
- الإعداد · Config: `android/keystore.properties` (مُستبعد من git)
- البصمة · SHA-256 fingerprint:
  `08:B8:60:E2:4C:F1:6A:F6:4B:4A:57:B9:D1:B2:73:08:90:D0:37:2A:D2:BE:40:58:29:6E:E7:40:E9:5A:B4:D9`

**قبل أي رفع فعلي لـ Google Play، افعل واحداً مما يلي:**
1. احتفظ بهذا المفتاح كمفتاح رفع رسمي (انسخه لمكان آمن مع نسخة احتياطية)، أو
2. ولّد مفتاحك الخاص واستبدله:
   ```bash
   keytool -genkeypair -v -keystore linkguard-upload.jks \
     -alias linkguard -keyalg RSA -keysize 4096 -validity 10000
   ```
   ثم حدّث `android/keystore.properties` بالمسار وكلمتي المرور الجديدتين.

**فقدان هذا الملف بعد أول رفع على Play = فقدان القدرة على تحديث التطبيق.**
احفظ نسخة احتياطية مشفّرة خارج هذا الجهاز.

*A test signing key already exists so a signed APK/AAB could be built and
verified today. Before any real Play Store upload: either keep this key as
your official upload key (back it up securely) or generate your own with the
command above and update `android/keystore.properties`. **Losing this file
after the first Play upload means losing the ability to update the app** -
keep an encrypted backup off this machine.*

---

## 🔨 أوامر البناء · Build Commands

```bash
npm run build:mobile   # Next.js static export (out/), app/api excluded
npm run cap:sync       # + npx cap sync android
npm run android:apk    # → android/app/build/outputs/apk/release/app-release.apk
npm run android:aab    # → android/app/build/outputs/bundle/release/app-release.aab
```

كلاهما تم بناؤهما والتحقق من التوقيع في هذه الجلسة:

*Both were already built and signature-verified in this session:*

```
android/app/build/outputs/apk/release/app-release.apk     (~13.1 MB, موقَّع · signed)
android/app/build/outputs/bundle/release/app-release.aab  (~14.4 MB, موقَّع · signed)
```

### Universal APK من الـ AAB (اختياري) · Universal APK from the AAB (optional)
يطابق تماماً ما يستلمه المستخدم من Play - يتطلب تنزيل `bundletool` (لم يُثبَّت
في هذه الجلسة):
```bash
java -jar bundletool.jar build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=linkguard.apks --mode=universal \
  --ks=C:/keys/linkguard-upload.jks --ks-key-alias=linkguard
```

---

## 🧪 التحقق على جهاز حقيقي · On-Device Verification

**لم يتم اختبار التطبيق على جهاز/محاكٍ في هذه الجلسة** — الـ AVD الموجود
(`Pixel_9`) ناقص صورة النظام، ولا يوجد جهاز فعلي متصل. ثبّت الـ APK وتحقق من:

*The app was **not** tested on a device/emulator in this session - the
existing AVD (`Pixel_9`) is missing its system image, and no physical device
was connected. Install the APK and verify:*

```bash
"C:/Android/platform-tools/adb.exe" install android/app/build/outputs/apk/release/app-release.apk
```

| # | السيناريو · Scenario | المتوقع · Expected |
|---|---|---|
| 1 | فتح بلا شبكة · Open offline | shell محلي فوري + طبقة Offline |
| 2 | فحص رابط (بعد دفع `proxy.ts`) · Scan a link | يعمل عبر `linkguard.scouthub.dev` |
| 3 | مشاركة رابط من WhatsApp/Chrome (تطبيق مغلق) · Share (cold start) | يفتح ويفحص فوراً |
| 4 | نفس الشيء والتطبيق مفتوح · Same, warm start | يفحص دون فقدان الحالة |
| 5 | ماسح QR + رفض/قبول الكاميرا · QR scanner permission | رسالة عربية عند الرفض |
| 6 | زر الرجوع أثناء فتح الماسح · Back button, scanner open | يغلق الماسح فقط |
| 7 | زر الرجوع بالشاشة الرئيسية · Back button, home screen | يخرج من التطبيق |
| 8 | السحب للتحديث · Pull-to-refresh | يحدّث الصفحة |
| 9 | شريط الحالة/التنقل · Status/nav bar | `#0a0e27`، لا قص للمحتوى (edge-to-edge) |
| 10 | `/status` | يعرض حالة الخدمات من الـ backend |

---

## 🏪 Google Play Console

1. **App Signing:** ارفع الـ AAB؛ Play App Signing يتولى الباقي تلقائياً.
2. **Data safety:** صرّح أن التطبيق يرسل الروابط المفحوصة إلى VirusTotal /
   urlscan.io / Google Safe Browsing / URLhaus / AbuseIPDB لأغراض أمنية.
   **الإخفاء هنا سبب رفض شائع.**
3. **إذن الكاميرا · Camera permission:** برر بـ "مسح رموز QR لاستخراج الرابط
   قبل فحصه".
4. **سياسة الخصوصية · Privacy policy:** رابط عام إلزامي - **غير موجود بعد،
   يحتاج إنشاء صفحة `/privacy` ونشرها.**
5. **أصول المتجر · Store assets:** أيقونة 512×512 جاهزة
   (`public/icons/icon-512.png`)؛ Feature graphic 1024×500 **يحتاج تصميم**؛
   لقطتا شاشة موجودتان (`docs/assets/screenshot-*.png`) وتحتاجان تصديراً
   بأبعاد هاتف.
6. ابدأ بمسار **Internal testing** قبل الترقية إلى Production.

---

## 📂 ملخص الملفات · File Summary

**جديدة · New:** `lib/apiBase.ts`, `lib/nativeShareTarget.ts`, `proxy.ts`,
`scripts/build-mobile.mjs`, `capacitor.config.ts`, `.env.mobile`,
`components/ShareTargetListener.tsx`, `components/OfflineOverlay.tsx`,
`hooks/useAndroidBackButton.ts`, `hooks/usePullToRefresh.ts`, `android/`,
`assets/{icon,splash,splash-dark}.png`

**معدَّلة · Modified:** `next.config.js`, `package.json`, `.gitignore`,
`.env.example`, `eslint.config.mjs`, `lib/scan.ts`, `app/status/page.tsx`,
`app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `app/page.tsx`,
`components/{Providers,QrScannerModal,ServiceWorkerRegistration,InstallPrompt,HeroSection}.tsx`,
`utils/translations.ts`

**غير مُمَسَّة · Untouched:** كل `app/api/*`، `lib/server/*`، منطق التقييم
والأمان (`utils/scoring.ts`, `utils/brandMatcher.ts`) — بقي كما هو حرفياً.
