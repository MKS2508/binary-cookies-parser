import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { BinaryCookie, CookiePage } from './types';

export type { BinaryCookie, CookiePage } from './types';

/**
 * Parser for macOS binary cookies files (.binarycookies)
 *
 * These files are used by Safari and other macOS applications to store cookies
 * in a binary format that's more efficient than plain text.
 *
 * @example
 * ```typescript
 * import { BinaryCookiesParser } from 'binary-cookies-parser';
 *
 * const parser = new BinaryCookiesParser();
 * const cookies = await parser.parse('/path/to/Cookies.binarycookies');
 * console.log(cookies);
 * ```
 */
export class BinaryCookiesParser {
    private cookiePath: string | null = null;
    private currentBufferPosition = 0;
    private data: Buffer | null = null;
    private numPages = 0;
    private bufferSize = 0;
    private pages: CookiePage[] = [];
    private pageSizes: number[] = [];
    private cookies: BinaryCookie[] = [];

    /**
     * Parse a binary cookies file and return an array of cookies
     *
     * @param cookiePath - Absolute path to the .binarycookies file
     * @returns Array of parsed cookies
     * @throws {Error} If file doesn't exist or has invalid format
     *
     * @example
     * ```typescript
     * const parser = new BinaryCookiesParser();
     * const cookies = await parser.parse('/Users/user/Library/Cookies/Cookies.binarycookies');
     * ```
     */
    async parse(cookiePath: string): Promise<BinaryCookie[]> {
        this.reset();
        this.cookiePath = cookiePath;

        if (!existsSync(cookiePath)) {
            throw new Error(`Cookie file not found: ${cookiePath}`);
        }

        await this.openFile();
        this.getNumPages();
        this.getPageSizes();
        this.getPages();

        for (let i = 0; i < this.pages.length; i++) {
            this.getNumCookies(i);
            this.getCookieOffsets(i);
            this.getCookieData(i);

            for (let j = 0; j < this.pages[i].cookies.length; j++) {
                const cookieData = this.parseCookieData(i, j);
                this.cookies.push(cookieData);
            }
        }

        return this.cookies;
    }

    private reset(): void {
        this.cookiePath = null;
        this.currentBufferPosition = 0;
        this.data = null;
        this.numPages = 0;
        this.bufferSize = 0;
        this.pages = [];
        this.pageSizes = [];
        this.cookies = [];
    }

    private async openFile(): Promise<void> {
        if (!this.cookiePath) {
            throw new Error('Cookie path not set');
        }

        const fileData = await fs.readFile(this.cookiePath);
        this.data = fileData;
        this.bufferSize = fileData.length;

        const header = this.readSlice(4).toString();
        if (header !== 'cook') {
            throw new Error(
                'Invalid binary cookies file format (missing "cook" header)'
            );
        }
    }

    private readSlice(length: number): Buffer {
        if (!this.data) {
            throw new Error('No data loaded');
        }

        const slice = this.data.subarray(
            this.currentBufferPosition,
            this.currentBufferPosition + length
        );
        this.currentBufferPosition += length;
        return slice;
    }

    private readIntBE(): number {
        if (!this.data) {
            throw new Error('No data loaded');
        }

        const value = this.data.readInt32BE(this.currentBufferPosition);
        this.currentBufferPosition += 4;
        return value;
    }

    private readIntLE(): number {
        if (!this.data) {
            throw new Error('No data loaded');
        }

        const value = this.data.readInt32LE(this.currentBufferPosition);
        this.currentBufferPosition += 4;
        return value;
    }

    private getNumPages(): number {
        this.numPages = this.readIntBE();
        return this.numPages;
    }

    private getPageSizes(): number[] {
        for (let i = 0; i < this.numPages; i++) {
            this.pageSizes.push(this.readIntBE());
        }
        return this.pageSizes;
    }

    private getPages(): CookiePage[] {
        for (const pageSize of this.pageSizes) {
            this.pages.push({
                buffer: this.readSlice(pageSize),
                bufferPosition: 0,
                numCookies: 0,
                cookieOffsets: [],
                cookies: []
            });
        }
        return this.pages;
    }

    private getNumCookies(pageIndex: number): number {
        const page = this.pages[pageIndex];
        page.bufferPosition = 0;

        const pageHeader = page.buffer.readInt32BE(page.bufferPosition);
        page.bufferPosition += 4;

        if (pageHeader !== 256) {
            throw new Error(`Invalid page header: expected 256, got ${pageHeader}`);
        }

        page.numCookies = page.buffer.readInt32LE(page.bufferPosition);
        page.bufferPosition += 4;

        return page.numCookies;
    }

    private getCookieOffsets(pageIndex: number): number[] {
        const page = this.pages[pageIndex];
        page.cookieOffsets = [];

        for (let i = 0; i < page.numCookies; i++) {
            page.cookieOffsets.push(page.buffer.readInt32LE(page.bufferPosition));
            page.bufferPosition += 4;
        }

        return page.cookieOffsets;
    }

    private getCookieData(pageIndex: number): Array<{ buffer: Buffer }> {
        const page = this.pages[pageIndex];
        page.cookies = [];

        for (const offset of page.cookieOffsets) {
            const cookieSize = page.buffer.readInt32LE(offset);

            try {
                page.cookies.push({
                    buffer: page.buffer.subarray(offset, offset + cookieSize)
                });
            } catch {
                page.cookies.push({
                    buffer: page.buffer.subarray(offset)
                });
            }
        }

        return page.cookies;
    }

    private parseCookieData(pageIndex: number, cookieIndex: number): BinaryCookie {
        const page = this.pages[pageIndex];
        const cookie = page.cookies[cookieIndex];
        const buffer = cookie.buffer;

        const MAC_EPOCH_OFFSET = 978307200;
        let bufPos = 0;

        // Read unknown (4 bytes)
        const unknown = buffer.readInt32LE(bufPos);

        // Read flags (4 bytes)
        bufPos += 4;
        const flags = buffer.readInt32LE(bufPos);

        // Read unknown2 (4 bytes) - but skip 8 bytes total
        bufPos += 8;
        const unknown2 = buffer.readUInt32LE(bufPos);

        // Read offsets for url, name, path, value (4 bytes each)
        const offsets: Record<string, number> = {};
        const offsetKeys = ['url', 'name', 'path', 'value'];

        for (const key of offsetKeys) {
            bufPos += 4;
            offsets[key] = buffer.readInt32LE(bufPos);
        }

        // Read end of cookie marker (4 bytes)
        bufPos += 4;
        const endOfCookie = buffer.readUInt32LE(bufPos);

        // Read expiration date (8 bytes double) - skip 8 bytes first
        bufPos += 8;
        const expirationTimestamp = buffer.readDoubleLE(bufPos) + MAC_EPOCH_OFFSET;
        const expiration = new Date(expirationTimestamp * 1000);

        // Read creation date (8 bytes double) - skip 8 bytes first
        bufPos += 8;
        const creationTimestamp = buffer.readDoubleLE(bufPos) + MAC_EPOCH_OFFSET;
        const creation = new Date(creationTimestamp * 1000);

        // Read string values
        const data: Partial<BinaryCookie> = {
            flags,
            expiration,
            creation
        };

        for (const [key, offset] of Object.entries(offsets)) {
            let str = '';
            let currentOffset = offset;
            let currentChar = '';

            do {
                currentChar = buffer.toString('utf8', currentOffset, currentOffset + 1);
                str += currentChar;
                currentOffset++;
            } while (currentChar !== '\u0000');

            // Clean the string
            data[key as keyof BinaryCookie] = str.replace(/\u0000/g, '').trim() as any;
        }

        return data as BinaryCookie;
    }
}

/**
 * Convenience function to parse a binary cookies file
 *
 * @param cookiePath - Absolute path to the .binarycookies file
 * @returns Array of parsed cookies
 *
 * @example
 * ```typescript
 * import { parseBinaryCookies } from 'binary-cookies-parser';
 *
 * const cookies = await parseBinaryCookies('/path/to/Cookies.binarycookies');
 * console.log(cookies);
 * ```
 */
export async function parseBinaryCookies(cookiePath: string): Promise<BinaryCookie[]> {
    const parser = new BinaryCookiesParser();
    return parser.parse(cookiePath);
}
