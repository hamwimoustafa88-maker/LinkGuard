const isMobile = process.env.MOBILE_BUILD === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        // Static export has no server to run the Image Optimization API -
        // required by Next.js whenever output: 'export' is set.
        unoptimized: isMobile,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'urlscan.io',
            },
        ],
    },
    ...(isMobile && {
        output: 'export',
        // Emits out/status/index.html, which Capacitor's local web server
        // resolves for the /status route. Output lands in the default
        // out/ dir (webDir in capacitor.config.ts) - Next.js repurposes
        // `distDir` as the export destination itself under output:
        // 'export', so it's deliberately left unset here.
        trailingSlash: true,
        // scripts/build-mobile.mjs temporarily parks app/api (not part of
        // the mobile bundle) so `__tests__/*` importing those routes fail
        // type-check here even though the real tree is already verified by
        // `npm run typecheck` against app/api in place.
        typescript: { ignoreBuildErrors: true },
    }),
};

module.exports = nextConfig;
