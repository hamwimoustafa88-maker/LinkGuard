import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/siteLinks';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            // JSON endpoints that spend third-party scan quota - nothing to index.
            disallow: '/api/',
        },
        sitemap: `${SITE_ORIGIN}/sitemap.xml`,
        host: SITE_ORIGIN,
    };
}
