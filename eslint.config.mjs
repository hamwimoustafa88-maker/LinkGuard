import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const config = [
    {
        ignores: ['.next/**', 'node_modules/**', 'coverage/**', '.agents/**'],
    },
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        rules: {
            // Not yet flipped to 'error' - the codebase still has a handful of
            // any's left to remove in the follow-up typing pass.
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            // eslint-config-next 16 ships React Compiler readiness rules as
            // errors. A few components genuinely call setState from a mount
            // effect (data fetch on load) - real findings, tracked for the
            // upcoming refactor (page.tsx's handleScan extraction, and
            // ScanHistory/status page effect cleanup) rather than fixed here.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn',
        },
    },
];

export default config;
