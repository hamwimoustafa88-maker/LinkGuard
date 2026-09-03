import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

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
            // ratchet against regression, not a target. Four routes
            // (blocklists/domaininfo/safebrowsing/urlscan) have no dedicated
            // test file yet and sit at 0%, which is most of the gap between
            // this and utils/lib/server's 80-95% - a natural next PR.
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
        projects: [
            {
                resolve: { alias: { '@': path.resolve(__dirname, './') } },
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['__tests__/**/*.test.ts'],
                },
            },
            {
                plugins: [react()],
                resolve: { alias: { '@': path.resolve(__dirname, './') } },
                test: {
                    name: 'dom',
                    environment: 'jsdom',
                    include: ['__tests__/**/*.test.tsx'],
                    setupFiles: ['./__tests__/setup.ts'],
                },
            },
        ],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
        },
    },
});
