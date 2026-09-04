'use client';

import { useEffect, useRef } from 'react';

const PULL_THRESHOLD = 70;

/** A minimal pull-to-refresh gesture for the app shell. Capacitor's WebView
 * (unlike Chrome for Android) has no built-in swipe-to-refresh, so without
 * this a downward swipe at the top of the page does nothing. Reloads the
 * page - the simplest "refresh" a single-page app can offer, and it also
 * works in a regular web browser. */
export function usePullToRefresh() {
    const startY = useRef<number | null>(null);

    useEffect(() => {
        const onTouchStart = (e: TouchEvent) => {
            const touch = e.touches[0];
            startY.current = touch && window.scrollY <= 0 ? touch.clientY : null;
        };

        const onTouchMove = (e: TouchEvent) => {
            if (startY.current === null) return;
            const touch = e.touches[0];
            if (!touch) return;
            const deltaY = touch.clientY - startY.current;
            if (deltaY > PULL_THRESHOLD && window.scrollY <= 0) {
                startY.current = null;
                window.location.reload();
            }
        };

        const onTouchEnd = () => {
            startY.current = null;
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, []);
}
