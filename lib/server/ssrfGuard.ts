// Guards against SSRF: rejects URLs that point at private/internal network ranges
// before the server ever fetches them (used by /api/resolve and /api/domaininfo).
//
// Known limitation: this validates the resolved IP at call time, then lets `fetch`
// re-resolve the hostname itself, leaving a small DNS-rebinding window. Full
// mitigation (pin the resolved IP and set the Host header) is out of scope for
// this threat model — accepted risk, not fixed here.

import dns from 'dns';
import net from 'net';

const dnsLookup = dns.promises.lookup;

export class SsrfBlockedError extends Error {
    constructor(reason: string) {
        super(`Blocked potentially unsafe target: ${reason}`);
        this.name = 'SsrfBlockedError';
    }
}

function isPrivateIPv4(ip: string): boolean {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4 || parts.some(p => Number.isNaN(p))) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10/8
    if (a === 127) return true; // 127/8
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64/10 (CGNAT)
    if (a === 169 && b === 254) return true; // 169.254/16 (link-local)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16/12
    if (a === 192 && b === 168) return true; // 192.168/16
    if (a === 192 && b === 0 && parts[2] === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18/15 (benchmark)
    if (a >= 224) return true; // multicast + reserved
    return false;
}

function isPrivateIPv6(ip: string): boolean {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') return true; // loopback
    if (normalized === '::') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // fc00::/7 unique local
    if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true; // fe80::/10 link-local
    if (normalized.startsWith('::ffff:')) {
        // IPv4-mapped address
        const mapped = normalized.replace('::ffff:', '');
        if (net.isIPv4(mapped)) return isPrivateIPv4(mapped);
    }
    return false;
}

function isPrivateIp(ip: string): boolean {
    if (net.isIPv4(ip)) return isPrivateIPv4(ip);
    if (net.isIPv6(ip)) return isPrivateIPv6(ip);
    return true; // unknown format: fail closed
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new SsrfBlockedError('invalid URL');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new SsrfBlockedError(`unsupported protocol ${url.protocol}`);
    }

    if (url.port && !['80', '443', ''].includes(url.port)) {
        throw new SsrfBlockedError(`unsupported port ${url.port}`);
    }

    const hostname = url.hostname;
    // WHATWG URL keeps brackets around literal IPv6 hosts (e.g. "[::1]") — strip
    // them before handing the value to net.isIP()/dns, which don't expect them.
    const bareHost = hostname.startsWith('[') && hostname.endsWith(']')
        ? hostname.slice(1, -1)
        : hostname;

    if (bareHost === 'localhost' || bareHost.endsWith('.localhost') || bareHost.endsWith('.local')) {
        throw new SsrfBlockedError('localhost/mDNS hostname');
    }

    // Literal IP in the URL itself
    if (net.isIP(bareHost)) {
        if (isPrivateIp(bareHost)) {
            throw new SsrfBlockedError(`private IP literal ${bareHost}`);
        }
        return url;
    }

    let addresses: { address: string }[];
    try {
        addresses = await dnsLookup(bareHost, { all: true });
    } catch {
        throw new SsrfBlockedError(`DNS resolution failed for ${bareHost}`);
    }

    if (!addresses || addresses.length === 0) {
        throw new SsrfBlockedError(`no DNS records for ${bareHost}`);
    }

    for (const { address } of addresses) {
        if (isPrivateIp(address)) {
            throw new SsrfBlockedError(`${bareHost} resolves to private address ${address}`);
        }
    }

    return url;
}
