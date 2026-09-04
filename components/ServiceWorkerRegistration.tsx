'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        // Inside the Android app, out/ is already local (no network round
        // trip to save), and public/sw.js's own precache of '/' + '/status'
        // would just be a second, conflicting cache layer on top of that.
        if (Capacitor.isNativePlatform()) return;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Registration failures (unsupported browser, blocked storage) are
                // non-fatal — the app works fine without offline/install support.
            });
        }
    }, []);

    return null;
}
