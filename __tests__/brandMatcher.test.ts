import { describe, it, expect } from 'vitest';
import { analyzeBrandMismatch, analyzeUrlHeuristics } from '@/utils/brandMatcher';

describe('analyzeBrandMismatch', () => {
    it('does not flag legitimate brand domains', () => {
        expect(analyzeBrandMismatch('https://www.facebook.com').detected).toBe(false);
        expect(analyzeBrandMismatch('https://www.google.com').detected).toBe(false);
        expect(analyzeBrandMismatch('https://accounts.google.com/login').detected).toBe(false);
    });

    it('flags brand keyword on a suspicious foreign domain as high severity', () => {
        const result = analyzeBrandMismatch('http://face-book-login.xyz');
        expect(result.detected).toBe(true);
        expect(result.brandName).toBe('Facebook');
        expect(result.severity).toBe('high');
    });

    it('flags a suspicious-TLD brand keyword domain', () => {
        const result = analyzeBrandMismatch('http://paypal-secure.tk');
        expect(result.detected).toBe(true);
        expect(result.brandName).toBe('PayPal');
    });

    it('flags typosquatted domains (1-2 char edits from a legit brand)', () => {
        const result = analyzeBrandMismatch('http://paypa1.com');
        expect(result.detected).toBe(true);
        expect(result.brandName).toBe('PayPal');
        expect(result.severity).toBe('high');
    });

    it('flags subdomain spoofing (brand domain embedded as a subdomain)', () => {
        const result = analyzeBrandMismatch('http://paypal.com.evil-site.tk');
        expect(result.detected).toBe(true);
        expect(result.brandName).toBe('PayPal');
    });

    it('flags punycode/homograph hostnames', () => {
        const result = analyzeBrandMismatch('http://xn--pypal-4ve.com');
        expect(result.detected).toBe(true);
        expect(result.severity).toBe('high');
    });

    it('returns not-detected for invalid input without throwing', () => {
        expect(() => analyzeBrandMismatch('')).not.toThrow();
    });
});

describe('analyzeUrlHeuristics', () => {
    it('returns no evidence for a clean legitimate URL', () => {
        expect(analyzeUrlHeuristics('https://www.google.com')).toHaveLength(0);
    });

    it('produces homograph evidence for punycode hosts', () => {
        const evidence = analyzeUrlHeuristics('http://xn--pypal-4ve.com');
        expect(evidence.some(e => e.id === 'homograph')).toBe(true);
    });

    it('produces typosquat evidence', () => {
        const evidence = analyzeUrlHeuristics('http://paypa1.com');
        expect(evidence.some(e => e.id === 'typosquat')).toBe(true);
    });

    it('produces suspiciousTld and suspiciousKeyword evidence together', () => {
        const evidence = analyzeUrlHeuristics('http://random-shop.xyz/verify-account');
        const ids = evidence.map(e => e.id);
        expect(ids).toContain('suspiciousTld');
        expect(ids).toContain('suspiciousKeyword');
    });
});
