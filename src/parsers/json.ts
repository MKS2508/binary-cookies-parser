import type { UniversalCookie } from '../types';

/**
 * Raw cookie format from JSON export (Chrome extension style)
 */
interface RawJSONCookie {
    name?: string;
    value?: string;
    domain?: string;
    hostOnly?: boolean;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: string;
    session?: boolean;
    expirationDate?: number;
    expires?: number | string;
    expiry?: number;
    creation?: number | string;
    creationDate?: number;
}

/**
 * Parse cookies from JSON format
 *
 * Supports multiple JSON structures:
 * - Direct array of cookies: [{ name, value, domain, ... }]
 * - Object with cookies property: { cookies: [...] }
 * - Chrome extension export format
 * - Firefox export format
 *
 * @example
 * ```typescript
 * import { parseJSON } from '@mks2508/binary-cookies-parser';
 *
 * const content = JSON.stringify([
 *   { name: 'SID', value: 'abc', domain: '.youtube.com', path: '/', secure: true }
 * ]);
 * const cookies = parseJSON(content);
 * ```
 *
 * @param content - JSON string containing cookies
 * @returns Array of parsed cookies
 * @throws {SyntaxError} If content is not valid JSON
 */
export function parseJSON(content: string): UniversalCookie[] {
    const parsed = JSON.parse(content);

    let rawCookies: RawJSONCookie[];

    if (Array.isArray(parsed)) {
        rawCookies = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.cookies)) {
        rawCookies = parsed.cookies;
    } else if (parsed && typeof parsed === 'object') {
        rawCookies = [parsed];
    } else {
        return [];
    }

    const cookies: UniversalCookie[] = [];

    for (const raw of rawCookies) {
        if (!raw.name) {
            continue;
        }

        const expiresValue = raw.expirationDate ?? raw.expires ?? raw.expiry;
        let expires: Date | undefined;

        if (expiresValue !== undefined) {
            if (typeof expiresValue === 'number') {
                if (expiresValue > 9999999999) {
                    expires = new Date(expiresValue);
                } else {
                    expires = new Date(expiresValue * 1000);
                }
            } else if (typeof expiresValue === 'string') {
                expires = new Date(expiresValue);
            }
        }

        const creationValue = raw.creation ?? raw.creationDate;
        let creation: Date | undefined;

        if (creationValue !== undefined) {
            if (typeof creationValue === 'number') {
                if (creationValue > 9999999999) {
                    creation = new Date(creationValue);
                } else {
                    creation = new Date(creationValue * 1000);
                }
            } else if (typeof creationValue === 'string') {
                creation = new Date(creationValue);
            }
        }

        const cookie: UniversalCookie = {
            name: raw.name,
            value: raw.value ?? '',
            domain: raw.domain ?? '',
            path: raw.path ?? '/',
            secure: raw.secure ?? false,
            httpOnly: raw.httpOnly ?? false
        };

        if (expires && !isNaN(expires.getTime())) {
            cookie.expires = expires;
        }

        if (creation && !isNaN(creation.getTime())) {
            cookie.creation = creation;
        }

        if (raw.sameSite) {
            const sameSite = raw.sameSite.toLowerCase();
            if (sameSite === 'strict' || sameSite === 'lax' || sameSite === 'none') {
                cookie.sameSite = sameSite.charAt(0).toUpperCase() + sameSite.slice(1) as 'Strict' | 'Lax' | 'None';
            }
        }

        cookies.push(cookie);
    }

    return cookies;
}

/**
 * Check if content appears to be JSON format
 *
 * @param content - String content to check
 * @returns true if content starts with { or [
 */
export function isJSONFormat(content: string): boolean {
    const trimmed = content.trim();
    return trimmed.startsWith('{') || trimmed.startsWith('[');
}
