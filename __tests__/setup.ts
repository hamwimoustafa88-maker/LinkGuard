import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// @testing-library/react doesn't auto-register its DOM cleanup for Vitest
// the way it did under Jest's preset - without this, each test's rendered
// tree stays mounted into the next test's jsdom document.
afterEach(() => {
    cleanup();
});
