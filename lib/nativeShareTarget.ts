import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

// Binding for the native ShareTargetPlugin (android/app/src/main/java/dev/
// scouthub/linkguard/ShareTargetPlugin.java). On the web (no such native
// plugin registered) every call rejects with "not implemented on web", so
// callers must check Capacitor.isNativePlatform() first (see
// ShareTargetListener.tsx).
export interface ShareTargetPlugin {
    /** Resolves the URL the app was most recently shared, or null - a
     * cold-start share (the share sheet is what launched the app) surfaces
     * here exactly once; call again and it's gone. */
    getSharedUrl(): Promise<{ url: string | null }>;
    /** Fires for a warm-start share (a new one arrives while the app is
     * already running). */
    addListener(
        eventName: 'shareReceived',
        listenerFunc: (data: { url: string }) => void
    ): Promise<PluginListenerHandle>;
}

const ShareTarget = registerPlugin<ShareTargetPlugin>('ShareTarget');

export default ShareTarget;
