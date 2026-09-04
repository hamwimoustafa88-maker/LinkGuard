import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

// Binding for the native ShareTargetPlugin (android/app/src/main/java/dev/
// scouthub/linkguard/ShareTargetPlugin.java). On the web (no such native
// plugin registered) Capacitor's web fallback makes getSharedUrl() resolve
// to `{ url: null }` and addListener() a no-op - ShareTargetListener.tsx
// works unmodified in both environments.
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
