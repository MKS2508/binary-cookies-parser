import type { UniversalCookie } from '../types';

/**
 * Parse cookies from Netscape/Mozilla cookies.txt format
 *
 * Format specification:
 * domain\tflag\tpath\tsecure\texpiration\tname\tvalue
 *
 * - domain: The domain that created and can read the cookie
 * - flag: TRUE if subdomains can access, FALSE otherwise (column 2)
 * - path: The path within the domain for which the cookie is valid
 * - secure: TRUE if HTTPS only, FALSE otherwise
 * - expiration: Unix timestamp (seconds since epoch), 0 for session cookies
 * - name: The cookie name
 * - value: The cookie value
 *
 * Lines starting with # are comments
 *
 * @example
 * ```typescript
 * import { parseNetscape } from '@mks2508/binary-cookies-parser';
 *
 * const content = `.youtube.com\tTRUE\t/\tTRUE\t1735689600\tSID\tabcdef123`;
 * const cookies = parseNetscape(content);
 * ```
 *
 * @param content - Content of the cookies.txt file
 * @returns Array of parsed cookies
 */
export function parseNetscape(content: string): UniversalCookie[] {
    const cookies: UniversalCookie[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const fields = trimmed.split('\t');

        if (fields.length < 7) {
            continue;
        }

        const [domain, , path, secureStr, expiresStr, name, value] = fields;

        if (!domain || !name) {
            continue;
        }

        const expiresTimestamp = parseInt(expiresStr || '0', 10);
        const expires = expiresTimestamp > 0
            ? new Date(expiresTimestamp * 1000)
            : undefined;

        const cookie: UniversalCookie = {
            name: name,
            value: value || '',
            domain: domain,
            path: path || '/',
            secure: secureStr?.toUpperCase() === 'TRUE',
            httpOnly: false
        };

        if (expires) {
            cookie.expires = expires;
        }

        cookies.push(cookie);
    }

    return cookies;
}

/**
 * Check if content appears to be in Netscape format
 *
 * @param content - String content to check
 * @returns true if content looks like Netscape format
 */
export function isNetscapeFormat(content: string): boolean {
    const lines = content.split('\n');
    let validLines = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const fields = trimmed.split('\t');
        if (fields.length >= 7) {
            const [domain, flag, , secure, expires] = fields;

            if (domain &&
                (flag === 'TRUE' || flag === 'FALSE') &&
                (secure === 'TRUE' || secure === 'FALSE') &&
                !isNaN(parseInt(expires || '0', 10))) {
                validLines++;
            }
        }

        if (validLines >= 1) {
            return true;
        }
    }

    return false;
}
