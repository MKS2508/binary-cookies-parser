import { test, expect, describe } from 'bun:test';
import { BinaryCookiesParser, parseBinaryCookies } from '../src/index';
import type { BinaryCookie } from '../src/types';

describe('BinaryCookiesParser', () => {
    test('should export BinaryCookiesParser class', () => {
        expect(BinaryCookiesParser).toBeDefined();
        expect(typeof BinaryCookiesParser).toBe('function');
    });

    test('should export parseBinaryCookies function', () => {
        expect(parseBinaryCookies).toBeDefined();
        expect(typeof parseBinaryCookies).toBe('function');
    });

    test('should throw error for non-existent file', async () => {
        const parser = new BinaryCookiesParser();
        await expect(
            parser.parse('/non/existent/file.binarycookies')
        ).rejects.toThrow('Cookie file not found');
    });

    test('should throw error for invalid file format', async () => {
        // Create a temporary invalid file
        const tmpPath = '/tmp/invalid-cookies.binarycookies';
        await Bun.write(tmpPath, 'invalid data');

        const parser = new BinaryCookiesParser();
        await expect(
            parser.parse(tmpPath)
        ).rejects.toThrow('Invalid binary cookies file format');
    });

    test('BinaryCookie interface should have correct structure', () => {
        const mockCookie: BinaryCookie = {
            name: 'test',
            value: 'value',
            url: '.example.com',
            path: '/',
            flags: 0,
            expiration: new Date(),
            creation: new Date()
        };

        expect(mockCookie).toHaveProperty('name');
        expect(mockCookie).toHaveProperty('value');
        expect(mockCookie).toHaveProperty('url');
        expect(mockCookie).toHaveProperty('path');
        expect(mockCookie).toHaveProperty('flags');
        expect(mockCookie).toHaveProperty('expiration');
        expect(mockCookie).toHaveProperty('creation');
    });

    test('should parse real binary cookies file if available', async () => {
        const cookiesPath = process.env.TEST_COOKIES_PATH;

        if (cookiesPath) {
            const cookies = await parseBinaryCookies(cookiesPath);
            expect(Array.isArray(cookies)).toBe(true);
            expect(cookies.length).toBeGreaterThan(0);

            const firstCookie = cookies[0];
            expect(firstCookie).toHaveProperty('name');
            expect(firstCookie).toHaveProperty('value');
            expect(firstCookie).toHaveProperty('url');
            expect(firstCookie).toHaveProperty('flags');
            expect(firstCookie.expiration).toBeInstanceOf(Date);
            expect(firstCookie.creation).toBeInstanceOf(Date);
        } else {
            console.log('⚠️  Skipping real file test (set TEST_COOKIES_PATH to test)');
        }
    });
});
