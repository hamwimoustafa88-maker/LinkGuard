import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

const alias = { '@': path.resolve(__dirname, './') };

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            // Scoped to the layers with real test investment (server logic,
            // scoring, API routes) rather than the whole app - components/
            // and hooks/ are mostly untested UI shells (only VerdictDashboard
            // has a test), so folding them in would make any single
            // threshold either trivially easy or impossible to hold.
            include: ['lib/**', 'utils/**', 'app/api/**'],
            // Set to the measured baseline (a few points of margin below the
            // actual run) rather than an aspirational number - this is a
            // ratchet against regression, not a target.
            thresholds: {
                statements: 65,
                branches: 58,
                functions: 60,
                lines: 65,
            },
        },
        // Two projects instead of one shared environment: most tests are
        // pure logic (server routes, scoring, helpers) and run fastest under
        // node; a handful render components and need a DOM. Keeping them
        // split means the majority of the suite never pays jsdom's setup
        // cost, and a *.test.ts file never accidentally needs a DOM stub.
        // Each project is an independent Vite config and does not inherit
        // resolve/plugins from this top-level object, so `alias` is repeated
        // per project rather than declared once at the root.
        projects: [
            {
                resolve: { alias },
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['__tests__/**/*.test.ts'],
                },
            },
            {
                plugins: [react()],
                resolve: { alias },
                test: {
                    name: 'dom',
                    environment: 'jsdom',
                    include: ['__tests__/**/*.test.tsx'],
                    setupFiles: ['./__tests__/setup.ts'],
                },
            },
        ],
    },
});
