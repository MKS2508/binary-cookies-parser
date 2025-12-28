import type { CookieFormat } from './types';
import { isNetscapeFormat } from './parsers/netscape';
import { isJSONFormat } from './parsers/json';
import { isBinaryFormat } from './parsers/binary';

/**
 * Auto-detect the format of cookie data
 *
 * Detection order:
 * 1. Binary format: Buffer starting with 'cook' magic bytes
 * 2. JSON format: String starting with '{' or '['
 * 3. Netscape format: Tab-separated values with TRUE/FALSE flags
 *
 * @example
 * ```typescript
 * import { detectFormat } from '@mks2508/binary-cookies-parser';
 *
 * const format = detectFormat('.youtube.com\tTRUE\t/\tTRUE\t0\tSID\tabc');
 * console.log(format); // 'netscape'
 * ```
 *
 * @param content - String or Buffer containing cookie data
 * @returns Detected format type
 * @throws {Error} If format cannot be detected
 */
export function detectFormat(content: string | Buffer): CookieFormat {
    if (Buffer.isBuffer(content)) {
        if (isBinaryFormat(content)) {
            return 'binary';
        }

        const stringContent = content.toString('utf8');
        if (isJSONFormat(stringContent)) {
            return 'json';
        }
        if (isNetscapeFormat(stringContent)) {
            return 'netscape';
        }
    } else {
        if (isJSONFormat(content)) {
            return 'json';
        }
        if (isNetscapeFormat(content)) {
            return 'netscape';
        }
    }

    throw new Error('Unable to detect cookie format. Supported formats: netscape (cookies.txt), json, binary (.binarycookies)');
}

/**
 * Try to detect the format without throwing
 *
 * @param content - String or Buffer containing cookie data
 * @returns Detected format or null if detection fails
 */
export function tryDetectFormat(content: string | Buffer): CookieFormat | null {
    try {
        return detectFormat(content);
    } catch {
        return null;
    }
}
