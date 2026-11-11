// Plain (non-'use client') module so both server code (app/layout.tsx's
// JSON-LD, app/sitemap.ts) and client components (SiteFooter) can import it -
// a value exported from a 'use client' file reaches a server component as an
// opaque client reference, not the actual data.

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN || 'https://linkguard.scouthub.dev';
export const PLATFORM_URL = 'https://scouthub.dev/';
export const REPO_URL = 'https://github.com/hamwimoustafa88-maker/LinkGuard';
export const AUTHOR_NAME = 'Moustafa Hamwi';
export const AUTHOR_URL = 'https://www.linkedin.com/in/moustafa-hamwi/';

export type SocialName = 'LinkedIn' | 'YouTube' | 'Facebook' | 'Instagram' | 'Telegram' | 'Threads';

/** ScoutHub's official accounts - rendered in the footer and published as
 * the Organization's `sameAs` in structured data. */
export const SOCIAL_LINKS: ReadonlyArray<{ name: SocialName; href: string }> = [
    { name: 'LinkedIn', href: 'https://www.linkedin.com/company/scouthub-lab/' },
    { name: 'YouTube', href: 'https://www.youtube.com/@ScoutHubLab' },
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61595883873134' },
    { name: 'Instagram', href: 'https://www.instagram.com/scouthub.lab/' },
    { name: 'Telegram', href: 'https://t.me/scouthublab' },
    { name: 'Threads', href: 'https://www.threads.com/@scouthub.lab' },
];

/** Every public page, used by app/sitemap.ts. */
export const PUBLIC_ROUTES = ['/', '/about', '/terms', '/privacy', '/status'] as const;
