/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'urlscan.io',
            },
        ],
    },
};

module.exports = nextConfig;
