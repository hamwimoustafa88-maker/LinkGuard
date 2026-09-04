import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'dev.scouthub.linkguard',
    appName: 'LinkGuard',
    webDir: 'out',
    android: {
        backgroundColor: '#0a0e27',
        // Prevents accidental pinch/double-tap zoom on a layout that's
        // already sized for the viewport.
        zoomEnabled: false,
    },
    server: {
        // Origin becomes https://localhost - a secure context, so
        // getUserMedia (the QR scanner) works inside the WebView.
        androidScheme: 'https',
    },
    plugins: {
        SplashScreen: {
            launchAutoHide: false, // hidden manually after first paint - see components/Providers.tsx
            backgroundColor: '#0a0e27',
            androidSplashResourceName: 'splash',
            splashFullScreen: true,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0a0e27',
        },
    },
};

export default config;
