import type { MetadataRoute } from 'next';
import { SITE_ORIGIN, PUBLIC_ROUTES } from '@/lib/siteLinks';

// Built once at build time (no request-time APIs), so it also works in the
// mobile static export.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return PUBLIC_ROUTES.map((route) => ({
        url: `${SITE_ORIGIN}${route}`,
        lastModified,
        changeFrequency: route === '/' ? 'weekly' : 'monthly',
        priority: route === '/' ? 1 : 0.6,
    }));
}
