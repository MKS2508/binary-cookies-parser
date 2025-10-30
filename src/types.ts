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
