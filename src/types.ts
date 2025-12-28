/**
 * Universal cookie interface that works across all cookie formats
 * (Netscape, JSON, Binary Safari)
 */
export interface UniversalCookie {
    /** Cookie name */
    name: string;
    /** Cookie value */
    value: string;
    /** Domain the cookie belongs to (e.g., ".youtube.com") */
    domain: string;
    /** Cookie path (e.g., "/") */
    path: string;
    /** Whether the cookie is secure (HTTPS only) */
    secure: boolean;
    /** Whether the cookie is HTTP-only (not accessible via JavaScript) */
    httpOnly: boolean;
    /** Cookie expiration date */
    expires?: Date;
    /** Cookie creation date */
    creation?: Date;
    /** SameSite attribute for cross-site requests */
    sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Supported cookie file formats
 */
export type CookieFormat = 'netscape' | 'json' | 'binary';

/**
 * Result from parsing a cookie file
 */
export interface ParseResult {
    /** Detected format of the input */
    format: CookieFormat;
    /** Array of parsed cookies */
    cookies: UniversalCookie[];
}

/**
 * Represents a parsed binary cookie from macOS .binarycookies file
 */
export interface BinaryCookie {
    /** Cookie name */
    name: string;
    /** Cookie value */
    value: string;
    /** Domain the cookie belongs to (e.g., ".apple.com") */
    url: string;
    /** Cookie path (e.g., "/") */
    path: string;
    /** Cookie flags (0=none, 1=secure, 4=httpOnly, 5=both) */
    flags: number;
    /** Cookie expiration date */
    expiration: Date;
    /** Cookie creation date */
    creation: Date;
}

/**
 * Internal representation of a cookie page
 * @internal
 */
export interface CookiePage {
    buffer: Buffer;
    bufferPosition: number;
    numCookies: number;
    cookieOffsets: number[];
    cookies: Array<{ buffer: Buffer; data?: BinaryCookie }>;
}
