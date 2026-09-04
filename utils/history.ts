import type { VerdictType } from '@/types';

export interface HistoryEntry {
    url: string;
    finalUrl: string;
    verdict: VerdictType;
    score: number;
    timestamp: number;
}

const STORAGE_KEY = 'linkguard.history.v1';
const MAX_ENTRIES = 50;
const EMPTY: HistoryEntry[] = [];

function readFromStorage(): HistoryEntry[] {
    if (typeof window === 'undefined') return EMPTY;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : EMPTY;
    } catch {
        return EMPTY;
    }
}

// Cached so getSnapshot() returns a stable reference between writes -
// useSyncExternalStore compares snapshots with Object.is and would loop
// forever if this parsed a fresh array/object out of localStorage on every
// call, since JSON.parse never returns the same reference twice.
let cachedSnapshot: HistoryEntry[] | null = null;
const listeners = new Set<() => void>();

function refresh(): void {
    cachedSnapshot = readFromStorage();
    listeners.forEach((listener) => listener());
}

export function getHistory(): HistoryEntry[] {
    if (cachedSnapshot === null) {
        cachedSnapshot = readFromStorage();
    }
    return cachedSnapshot;
}

export function appendHistory(entry: HistoryEntry): void {
    if (typeof window === 'undefined') return;
    try {
        const current = readFromStorage();
        const next = [entry, ...current].slice(0, MAX_ENTRIES);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        cachedSnapshot = next;
        listeners.forEach((listener) => listener());
    } catch {
        // localStorage unavailable (private mode, quota) — history is best-effort
    }
}

export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
        cachedSnapshot = EMPTY;
        listeners.forEach((listener) => listener());
    } catch {
        // ignore
    }
}

/** For useSyncExternalStore: notifies subscribers on same-tab writes
 * (appendHistory/clearHistory above) and on cross-tab changes (the
 * `storage` event, which only fires in *other* tabs, never the tab that
 * made the change - hence needing the same-tab path too). */
export function subscribe(listener: () => void): () => void {
    listeners.add(listener);

    const onStorage = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('storage', onStorage);
    }

    return () => {
        listeners.delete(listener);
        if (typeof window !== 'undefined') {
            window.removeEventListener('storage', onStorage);
        }
    };
}

export function getSnapshot(): HistoryEntry[] {
    return getHistory();
}

export function getServerSnapshot(): HistoryEntry[] {
    return EMPTY;
}
