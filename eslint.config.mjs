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
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': 'error',
            // Three components genuinely call setState from a mount effect to
            // read an environment-only value (localStorage, matchMedia, user
            // agent, or an initial data fetch) that isn't available during
            // SSR - LanguageContext.tsx, InstallPrompt.tsx, app/status/page.tsx.
            // Left at 'warn' rather than restructured: React's own suggested
            // alternative (deriving state during render) isn't available for
            // any of these three, since none of the values can be computed
            // synchronously on the server.
            'react-hooks/set-state-in-effect': 'warn',
        },
    },
];

export default config;
