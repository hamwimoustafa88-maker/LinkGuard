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

export function getHistory(): HistoryEntry[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function appendHistory(entry: HistoryEntry): void {
    if (typeof window === 'undefined') return;
    try {
        const current = getHistory();
        const next = [entry, ...current].slice(0, MAX_ENTRIES);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
        // localStorage unavailable (private mode, quota) — history is best-effort
    }
}

export function clearHistory(): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}
