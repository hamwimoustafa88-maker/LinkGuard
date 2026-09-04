import { describe, it, expect } from 'vitest';
import { translations } from '@/utils/translations';

describe('translations', () => {
    it('has an identical key set in ar and en', () => {
        const arKeys = Object.keys(translations.ar).sort();
        const enKeys = Object.keys(translations.en).sort();
        expect(enKeys).toEqual(arKeys);
    });

    it('has no empty string values in either language', () => {
        for (const [lang, dict] of Object.entries(translations)) {
            for (const [key, value] of Object.entries(dict)) {
                expect(value, `${lang}.${key} should not be empty`).not.toBe('');
            }
        }
    });
});
