'use client';

import { useEffect, useRef } from 'react';
import ShareTarget from '@/lib/nativeShareTarget';

interface ShareTargetListenerProps {
    onUrl: (url: string) => void;
}

/** Bridges Android's share sheet into the scan flow: a link shared into
 * LinkGuard from WhatsApp/Telegram/Chrome (or picked from the text-selection
 * menu) is scanned immediately, whether it launched the app (cold start) or
 * arrived while the app was already open (warm start). See
 * android/app/src/main/java/dev/scouthub/linkguard/ShareTargetPlugin.java
 * and lib/nativeShareTarget.ts. A no-op on the web - Capacitor's web
 * fallback resolves getSharedUrl() to `{ url: null }` and addListener() to
 * a harmless no-op handle. */
export default function ShareTargetListener({ onUrl }: ShareTargetListenerProps) {
    // A ref keeps the effect below subscribing exactly once: `onUrl` (the
    // useScan hook's `scan`) is a new function identity every render, and
    // depending on it directly would tear down and re-add the native
    // listener on every render instead. Updated from its own effect (not
    // inline during render) since refs must not be written during render.
    const onUrlRef = useRef(onUrl);
    useEffect(() => {
        onUrlRef.current = onUrl;
    });

    useEffect(() => {
        let cancelled = false;

        ShareTarget.getSharedUrl().then(({ url }) => {
            if (!cancelled && url) onUrlRef.current(url);
        });

        const listenerPromise = ShareTarget.addListener('shareReceived', ({ url }) => {
            onUrlRef.current(url);
        });

        return () => {
            cancelled = true;
            listenerPromise.then((handle) => handle.remove());
        };
    }, []);

    return null;
}
