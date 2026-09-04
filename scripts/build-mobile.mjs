// Next.js refuses `output: 'export'` with any non-GET/force-static route
// handler, and app/api/* is all POST. So the mobile build temporarily parks
// app/api out of the App Router (a directory prefixed with `_` is excluded
// from routing entirely, but still type-checked), builds the static export,
// then always restores it - the mobile app never talks to these routes
// directly; it calls the hosted backend via NEXT_PUBLIC_API_BASE instead
// (see lib/apiBase.ts).
import { rename, access, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const API = 'app/api';
const PARKED = 'app/_api_offline';
const MOBILE_ENV_FILE = '.env.mobile';

const exists = (path) => access(path).then(() => true, () => false);

// Deliberately NOT named .env.production: Next.js auto-loads any
// *.production file for every production build (the plain web `next build`
// included), which would prefix the web app's own same-origin /api/* calls
// with NEXT_PUBLIC_API_BASE too. Parsing it here and injecting only into
// this child process keeps it mobile-build-only.
async function loadMobileEnv() {
    if (!(await exists(MOBILE_ENV_FILE))) return {};

    const contents = await readFile(MOBILE_ENV_FILE, 'utf8');
    const env = {};
    for (const line of contents.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
}

async function main() {
    // Safety net: a previous run that was killed mid-build (Ctrl-C, or a
    // crash) can leave app/api parked - restore it before doing anything else.
    if ((await exists(PARKED)) && !(await exists(API))) {
        await rename(PARKED, API);
    }

    await rename(API, PARKED);

    // Note: never call process.exit() inside this try - that terminates the
    // process immediately, before the async rename() in `finally` below can
    // run, leaving app/api stuck parked. Track the exit code instead and
    // exit only after the restore has completed.
    let exitCode = 0;
    try {
        const mobileEnv = await loadMobileEnv();
        const result = spawnSync('npx', ['next', 'build'], {
            stdio: 'inherit',
            shell: true,
            env: { ...process.env, ...mobileEnv, MOBILE_BUILD: '1' },
        });
        exitCode = result.status ?? 1;
    } finally {
        await rename(PARKED, API);
    }

    if (exitCode !== 0) {
        process.exit(exitCode);
    }
}

main();
