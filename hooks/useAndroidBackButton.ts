'use client';

import { useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Wires Android's hardware back button (and edge-swipe gesture) to sensible
 * app behavior. @capacitor/app's listener disables the platform's own
 * default handling entirely once attached, so this restores it manually:
 *
 *  1. `onIntercept`, if given, gets first refusal - e.g. "close the QR
 *     scanner if it's open" - returning true means it handled the press.
 *  2. Otherwise fall back to the WebView's own navigation history.
 *  3. With nothing left to go back to, exit the app rather than leaving a
 *     frozen screen the back button can no longer do anything on.
 *
 * A no-op on web and iOS - the platform's own back navigation already
 * works there, and this event only ever fires on Android.
 */
export function useAndroidBackButton(onIntercept?: () => boolean) {
    // A ref keeps the listener registered exactly once: `onIntercept`
    // typically closes over per-render state (e.g. a modal's open flag),
    // so a new function identity every render would otherwise tear down and
    // re-add the native listener on every render instead. Updated from its
    // own effect (not inline during render) since refs must not be written
    // during render.
    const interceptRef = useRef(onIntercept);
    useEffect(() => {
        interceptRef.current = onIntercept;
    });

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;

        const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
            if (interceptRef.current?.()) return;

            if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });

        return () => {
            listenerPromise.then((handle) => handle.remove());
        };
    }, []);
}
