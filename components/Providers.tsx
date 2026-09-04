'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { LanguageProvider } from './LanguageContext';
import OfflineOverlay from './OfflineOverlay';

export default function Providers({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // Matches the dark cyber theme (#0a0e27 - see capacitor.config.ts,
        // app/manifest.ts's theme_color, and the splash image itself) so
        // there's no flash of a mismatched color at either end.
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#0a0e27' }).catch(() => {});

        // launchAutoHide is false in capacitor.config.ts, so the splash
        // stays up (no white flash) until this fires after first paint.
        SplashScreen.hide().catch(() => {});
    }, []);

    return (
        <LanguageProvider>
            {children}
            <OfflineOverlay />
        </LanguageProvider>
    );
}
