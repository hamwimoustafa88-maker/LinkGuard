'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Registration failures (unsupported browser, blocked storage) are
                // non-fatal — the app works fine without offline/install support.
            });
        }
    }, []);

    return null;
}
