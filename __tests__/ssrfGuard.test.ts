import { describe, it, expect, vi, beforeEach } from 'vitest';

const lookupMock = vi.fn();

vi.mock('dns', () => ({
    default: {
        promises: {
            lookup: (...args: any[]) => lookupMock(...args),
        },
    },
}));

import { assertPublicHttpUrl, SsrfBlockedError } from '@/lib/server/ssrfGuard';

describe('assertPublicHttpUrl', () => {
    beforeEach(() => {
        lookupMock.mockReset();
    });

    it('rejects non-http(s) protocols', async () => {
        await expect(assertPublicHttpUrl('ftp://example.com')).rejects.toThrow(SsrfBlockedError);
    });

    it('rejects non-standard ports', async () => {
        await expect(assertPublicHttpUrl('http://example.com:8080')).rejects.toThrow(SsrfBlockedError);
    });

    it('rejects private IPv4 literals', async () => {
        await expect(assertPublicHttpUrl('http://127.0.0.1')).rejects.toThrow(SsrfBlockedError);
        await expect(assertPublicHttpUrl('http://192.168.1.1')).rejects.toThrow(SsrfBlockedError);
        await expect(assertPublicHttpUrl('http://10.0.0.5')).rejects.toThrow(SsrfBlockedError);
        await expect(assertPublicHttpUrl('http://169.254.169.254')).rejects.toThrow(SsrfBlockedError);
    });

    it('rejects private IPv6 literals', async () => {
        await expect(assertPublicHttpUrl('http://[::1]')).rejects.toThrow(SsrfBlockedError);
    });

    it('rejects localhost-style hostnames', async () => {
        await expect(assertPublicHttpUrl('http://localhost')).rejects.toThrow(SsrfBlockedError);
        await expect(assertPublicHttpUrl('http://printer.local')).rejects.toThrow(SsrfBlockedError);
    });

    it('rejects a hostname that resolves to a private address', async () => {
        lookupMock.mockResolvedValueOnce([{ address: '10.1.2.3', family: 4 }]);
        await expect(assertPublicHttpUrl('http://internal.example.com')).rejects.toThrow(SsrfBlockedError);
    });

    it('allows a public IP literal without a DNS lookup', async () => {
        const url = await assertPublicHttpUrl('https://8.8.8.8');
        expect(url.hostname).toBe('8.8.8.8');
        expect(lookupMock).not.toHaveBeenCalled();
    });

    it('allows a hostname that resolves to a public address', async () => {
        lookupMock.mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }]);
        const url = await assertPublicHttpUrl('https://example.com/path');
        expect(url.hostname).toBe('example.com');
    });

    it('rejects when DNS resolution fails', async () => {
        lookupMock.mockRejectedValueOnce(new Error('ENOTFOUND'));
        await expect(assertPublicHttpUrl('https://does-not-exist.invalid')).rejects.toThrow(SsrfBlockedError);
    });
});
