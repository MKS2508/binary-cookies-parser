#!/usr/bin/env bun
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseBinaryCookies } from '../src/index';

/**
 * Example: Extract Safari cookies from macOS
 */
async function extractSafariCookies() {
    try {
        // Safari cookies location on macOS
        const cookiesPath = join(
            homedir(),
            'Library/Cookies/Cookies.binarycookies'
        );

        console.log(`📁 Parsing: ${cookiesPath}\n`);

        // Parse the binary cookies file
        const cookies = await parseBinaryCookies(cookiesPath);
        console.log(`✅ Found ${cookies.length} cookies\n`);

        // Display first 5 cookies
        console.log('🔍 First 5 cookies:');
        cookies.slice(0, 5).forEach((cookie, i) => {
            console.log(`  ${i + 1}. ${cookie.name}`);
            console.log(`     Domain: ${cookie.url}`);
            console.log(`     Value: ${cookie.value.slice(0, 30)}...`);
            console.log(`     Expires: ${cookie.expiration.toISOString()}`);
            console.log(`     Flags: ${cookie.flags} (${getFlagsString(cookie.flags)})`);
            console.log();
        });

        // Filter cookies by domain
        const googleCookies = cookies.filter(c => c.url.includes('google.com'));
        console.log(`\n🔍 Google cookies: ${googleCookies.length}`);

        // Convert to Playwright format
        const playwrightCookies = cookies.slice(0, 10).map(c => ({
            name: c.name,
            value: c.value,
            domain: c.url,
            path: c.path,
            expires: Math.floor(c.expiration.getTime() / 1000),
            httpOnly: !!(c.flags & 4),
            secure: !!(c.flags & 1),
            sameSite: 'Lax' as const
        }));

        console.log('\n📋 Playwright format (first 10):');
        console.log(JSON.stringify(playwrightCookies, null, 2));

    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        console.log('\n💡 Make sure Safari has been run at least once on this system');
    }
}

/**
 * Convert cookie flags to human-readable string
 */
function getFlagsString(flags: number): string {
    if (flags === 0) return 'none';
    if (flags === 1) return 'secure';
    if (flags === 4) return 'httpOnly';
    if (flags === 5) return 'secure + httpOnly';
    return `custom (${flags})`;
}

// Run example
extractSafariCookies();
