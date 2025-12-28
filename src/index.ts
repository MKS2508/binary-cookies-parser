import { parseNetscape, isNetscapeFormat } from './parsers/netscape';
import { parseJSON, isJSONFormat } from './parsers/json';
import {
    BinaryCookiesParser,
    parseBinaryCookies,
    parseBinaryToUniversal,
    binaryToUniversal,
    isBinaryFormat
} from './parsers/binary';
import { detectFormat, tryDetectFormat } from './detector';
import type {
    UniversalCookie,
    CookieFormat,
    ParseResult,
    BinaryCookie,
    CookiePage
} from './types';

export type {
    UniversalCookie,
    CookieFormat,
    ParseResult,
    BinaryCookie,
    CookiePage
};

export {
    parseNetscape,
    isNetscapeFormat,
    parseJSON,
    isJSONFormat,
    BinaryCookiesParser,
    parseBinaryCookies,
    parseBinaryToUniversal,
    binaryToUniversal,
    isBinaryFormat,
    detectFormat,
    tryDetectFormat
};

/**
 * Parse cookies from any supported format with auto-detection
 *
 * Supports:
 * - Netscape/Mozilla cookies.txt format (used by yt-dlp, browsers)
 * - JSON format (Chrome extensions, various exporters)
 * - Binary Safari format (.binarycookies files)
 *
 * @example
 * ```typescript
 * import { parseCookies } from '@mks2508/binary-cookies-parser';
 *
 * // Auto-detect and parse
 * const netscape = parseCookies('.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc');
 * const json = parseCookies('[{"name":"SID","value":"abc","domain":".youtube.com"}]');
 * const binary = parseCookies(binaryBuffer);
 * ```
 *
 * @param content - Cookie data as string or Buffer
 * @returns ParseResult with detected format and array of cookies
 * @throws {Error} If format cannot be detected or parsing fails
 */
export function parseCookies(content: string | Buffer): ParseResult {
    const format = detectFormat(content);

    switch (format) {
        case 'netscape':
            return {
                format,
                cookies: parseNetscape(content as string)
            };
        case 'json':
            return {
                format,
                cookies: parseJSON(Buffer.isBuffer(content) ? content.toString('utf8') : content)
            };
        case 'binary':
            return {
                format,
                cookies: parseBinaryToUniversal(Buffer.isBuffer(content) ? content : Buffer.from(content))
            };
    }
}

/**
 * Filter cookies by domain
 *
 * Matches cookies where:
 * - Domain exactly equals the filter
 * - Domain ends with the filter (for subdomain matching)
 * - Filter starts with '.' and domain ends with filter (e.g., '.youtube.com')
 *
 * @example
 * ```typescript
 * import { parseCookies, filterByDomain } from '@mks2508/binary-cookies-parser';
 *
 * const { cookies } = parseCookies(cookieData);
 * const ytCookies = filterByDomain(cookies, '.youtube.com');
 * ```
 *
 * @param cookies - Array of cookies to filter
 * @param domain - Domain to filter by (e.g., '.youtube.com', 'google.com')
 * @returns Filtered array of cookies matching the domain
 */
export function filterByDomain(cookies: UniversalCookie[], domain: string): UniversalCookie[] {
    const normalizedDomain = domain.toLowerCase();

    return cookies.filter(cookie => {
        const cookieDomain = cookie.domain.toLowerCase();

        if (cookieDomain === normalizedDomain) {
            return true;
        }

        if (normalizedDomain.startsWith('.')) {
            return cookieDomain === normalizedDomain ||
                   cookieDomain.endsWith(normalizedDomain);
        }

        return cookieDomain === normalizedDomain ||
               cookieDomain === `.${normalizedDomain}` ||
               cookieDomain.endsWith(`.${normalizedDomain}`);
    });
}

/**
 * Filter out expired cookies
 *
 * @param cookies - Array of cookies to filter
 * @returns Array of non-expired cookies (includes session cookies without expiry)
 */
export function filterExpired(cookies: UniversalCookie[]): UniversalCookie[] {
    const now = new Date();

    return cookies.filter(cookie => {
        if (!cookie.expires) {
            return true;
        }
        return cookie.expires > now;
    });
}

/**
 * Convert cookies to Netscape format string
 *
 * @example
 * ```typescript
 * import { parseCookies, toNetscapeFormat } from '@mks2508/binary-cookies-parser';
 *
 * const { cookies } = parseCookies(jsonCookies);
 * const netscapeString = toNetscapeFormat(cookies);
 * ```
 *
 * @param cookies - Array of cookies to convert
 * @returns Netscape format string (cookies.txt compatible)
 */
export function toNetscapeFormat(cookies: UniversalCookie[]): string {
    const lines = ['# Netscape HTTP Cookie File'];

    for (const cookie of cookies) {
        const includeSubdomains = cookie.domain.startsWith('.') ? 'TRUE' : 'FALSE';
        const secure = cookie.secure ? 'TRUE' : 'FALSE';
        const expires = cookie.expires
            ? Math.floor(cookie.expires.getTime() / 1000)
            : 0;

        lines.push([
            cookie.domain,
            includeSubdomains,
            cookie.path,
            secure,
            expires,
            cookie.name,
            cookie.value
        ].join('\t'));
    }

    return lines.join('\n');
}

/**
 * Convert cookies to JSON format string
 *
 * @param cookies - Array of cookies to convert
 * @returns JSON string representation of cookies
 */
export function toJSONFormat(cookies: UniversalCookie[]): string {
    return JSON.stringify(cookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        ...(cookie.expires && { expirationDate: Math.floor(cookie.expires.getTime() / 1000) }),
        ...(cookie.sameSite && { sameSite: cookie.sameSite.toLowerCase() })
    })), null, 2);
}

/**
 * Convert cookies to Cookie header string
 *
 * @example
 * ```typescript
 * const header = toCookieHeader(cookies);
 * fetch(url, { headers: { Cookie: header } });
 * ```
 *
 * @param cookies - Array of cookies to convert
 * @returns String suitable for Cookie HTTP header (name=value; name2=value2)
 */
export function toCookieHeader(cookies: UniversalCookie[]): string {
    return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}
