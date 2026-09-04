// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerdictType } from '@/types';

// utils/history.ts caches its snapshot at module scope, so re-import fresh
// per test to get a clean cache alongside the cleared localStorage mock.
async function freshHistoryModule() {
    vi.resetModules();
    return import('@/utils/history');
}

const entry = (n: number) => ({
    url: `https://example.com/${n}`,
    finalUrl: `https://example.com/${n}`,
    verdict: VerdictType.SAFE,
    score: 0,
    timestamp: n,
});

describe('utils/history', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('starts empty', async () => {
        const { getHistory } = await freshHistoryModule();
        expect(getHistory()).toEqual([]);
    });

    it('prepends new entries (most recent first)', async () => {
        const { appendHistory, getHistory } = await freshHistoryModule();
        appendHistory(entry(1));
        appendHistory(entry(2));
        expect(getHistory().map((e) => e.timestamp)).toEqual([2, 1]);
    });

    it('caps at 50 entries', async () => {
        const { appendHistory, getHistory } = await freshHistoryModule();
        for (let i = 0; i < 55; i++) appendHistory(entry(i));
        const history = getHistory();
        expect(history).toHaveLength(50);
        expect(history[0]!.timestamp).toBe(54);
    });

    it('clearHistory empties the store', async () => {
        const { appendHistory, clearHistory, getHistory } = await freshHistoryModule();
        appendHistory(entry(1));
        clearHistory();
        expect(getHistory()).toEqual([]);
    });

    it('recovers to an empty list on corrupt JSON rather than throwing', async () => {
        window.localStorage.setItem('linkguard.history.v1', '{not valid json');
        const { getHistory } = await freshHistoryModule();
        expect(getHistory()).toEqual([]);
    });

    it('notifies subscribers on append and on clear', async () => {
        const { appendHistory, clearHistory, subscribe } = await freshHistoryModule();
        const listener = vi.fn();
        const unsubscribe = subscribe(listener);

        appendHistory(entry(1));
        expect(listener).toHaveBeenCalledTimes(1);

        clearHistory();
        expect(listener).toHaveBeenCalledTimes(2);

        unsubscribe();
        appendHistory(entry(2));
        expect(listener).toHaveBeenCalledTimes(2);
    });

    it('getSnapshot returns a stable reference across calls with no writes', async () => {
        const { appendHistory, getSnapshot } = await freshHistoryModule();
        appendHistory(entry(1));
        expect(getSnapshot()).toBe(getSnapshot());
    });

    it('getServerSnapshot is always an empty array', async () => {
        const { appendHistory, getServerSnapshot } = await freshHistoryModule();
        appendHistory(entry(1));
        expect(getServerSnapshot()).toEqual([]);
    });
});
