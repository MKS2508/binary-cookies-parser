# binary-cookies-parser

[![npm version](https://img.shields.io/npm/v/@mks2508/binary-cookies-parser.svg)](https://www.npmjs.com/package/@mks2508/binary-cookies-parser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-f472b6.svg)](https://bun.sh)

A modern, TypeScript-native parser for macOS binary cookies files (`.binarycookies`). Parse Safari and macOS app cookies with full type safety and zero dependencies.

## Features

- 🚀 **Zero Dependencies** - Pure TypeScript implementation
- 📦 **Dual Package** - ESM and CommonJS support
- 🔒 **Type Safe** - Full TypeScript definitions included
- ⚡ **Fast** - Built with Bun, works with Node.js
- 🍎 **macOS Native** - Handles Safari and native app cookies
- 🎯 **Simple API** - One function to parse cookies

## Installation

```bash
# npm
npm install binary-cookies-parser

# bun
bun add binary-cookies-parser

# yarn
yarn add binary-cookies-parser

# pnpm
pnpm add binary-cookies-parser
```

## Quick Start

```typescript
import { parseBinaryCookies } from 'binary-cookies-parser';

const cookies = await parseBinaryCookies('/path/to/Cookies.binarycookies');
console.log(cookies);
```

## Usage

### Basic Parsing

```typescript
import { parseBinaryCookies } from 'binary-cookies-parser';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Parse Safari cookies
const safariCookies = await parseBinaryCookies(
  join(homedir(), 'Library/Cookies/Cookies.binarycookies')
);

// Each cookie has:
// - name: string
// - value: string
// - url: string (domain)
// - path: string
// - flags: number (0=none, 1=secure, 4=httpOnly, 5=both)
// - expiration: Date
// - creation: Date
```

### Filtering Cookies

```typescript
// Filter by domain
const googleCookies = cookies.filter(c => c.url.includes('google.com'));

// Filter by secure flag
const secureCookies = cookies.filter(c => c.flags & 1);

// Filter by expiration
const validCookies = cookies.filter(c => c.expiration > new Date());
```

### Converting to Playwright Format

```typescript
const playwrightCookies = cookies.map(c => ({
  name: c.name,
  value: c.value,
  domain: c.url,
  path: c.path,
  expires: Math.floor(c.expiration.getTime() / 1000),
  httpOnly: !!(c.flags & 4),
  secure: !!(c.flags & 1),
  sameSite: 'Lax' as const
}));

// Use with Playwright
await context.addCookies(playwrightCookies);
```

### Using the Class API

```typescript
import { BinaryCookiesParser } from 'binary-cookies-parser';

const parser = new BinaryCookiesParser();
const cookies = await parser.parse('/path/to/Cookies.binarycookies');
```

## API Reference

### `parseBinaryCookies(cookiePath: string): Promise<BinaryCookie[]>`

Parses a binary cookies file and returns an array of cookies.

**Parameters:**
- `cookiePath` - Absolute path to the `.binarycookies` file

**Returns:**
- `Promise<BinaryCookie[]>` - Array of parsed cookies

**Throws:**
- `Error` if file doesn't exist
- `Error` if file format is invalid

### `BinaryCookie` Interface

```typescript
interface BinaryCookie {
  name: string;        // Cookie name
  value: string;       // Cookie value
  url: string;         // Domain (e.g., ".apple.com")
  path: string;        // Path (e.g., "/")
  flags: number;       // Flags (0=none, 1=secure, 4=httpOnly, 5=both)
  expiration: Date;    // Expiration date
  creation: Date;      // Creation date
}
```

### Cookie Flags

| Flag | Meaning |
|------|---------|
| 0 | No flags |
| 1 | Secure cookie |
| 4 | HttpOnly cookie |
| 5 | Secure + HttpOnly |

## Common Use Cases

### Extract Safari Cookies for Automation

```typescript
import { parseBinaryCookies } from 'binary-cookies-parser';
import { homedir } from 'node:os';
import { join } from 'node:path';

const cookies = await parseBinaryCookies(
  join(homedir(), 'Library/Cookies/Cookies.binarycookies')
);

// Use with Puppeteer, Playwright, etc.
```

### Parse macOS App Cookies

```typescript
import { parseBinaryCookies } from 'binary-cookies-parser';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Example: Amazon Prime Video app
const primeCookies = await parseBinaryCookies(
  join(
    homedir(),
    'Library/Containers/com.amazon.aiv.AIVApp/Data/Library/Cookies/Cookies.binarycookies'
  )
);
```

### Cookie Migration

```typescript
// Export cookies from Safari
const cookies = await parseBinaryCookies('/path/to/safari/cookies');

// Convert to JSON for backup
await Bun.write('cookies-backup.json', JSON.stringify(cookies, null, 2));

// Filter and import to another browser
const importCookies = cookies.filter(c =>
  c.url.includes('important-domain.com')
);
```

## Platform Support

- **macOS** - ✅ Full support (Safari, native apps)
- **Linux** - ❌ Not applicable (no .binarycookies files)
- **Windows** - ❌ Not applicable (no .binarycookies files)

This library is specifically for parsing macOS binary cookies files. For cross-platform cookie management, consider using browser automation tools.

## Examples

See the [`examples/`](./examples) directory for complete working examples:

- [`basic-usage.ts`](./examples/basic-usage.ts) - Parse Safari cookies and convert to Playwright format

Run examples:

```bash
bun run examples/basic-usage.ts
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build for npm
bun run build

# Generate types
bun run types
```

## Technical Details

### Binary Format

The `.binarycookies` format is a proprietary Apple format used by Safari and macOS applications. This parser implements the complete specification:

- File header validation (`cook` magic bytes)
- Multi-page cookie storage
- Mac epoch time conversion (978307200 offset)
- Cookie flag parsing
- Null-terminated string extraction

### Performance

- Zero external dependencies
- Single-pass parsing
- Efficient buffer operations
- Minimal memory allocations

## Credits

Inspired by the original [node-binary-cookies](https://github.com/jlipps/node-binary-cookies) by Jonathan Lipps, but completely rewritten in modern TypeScript with:

- Full type safety
- Async/await API
- Zero dependencies
- Dual ESM/CJS support
- Bun optimization

## License

MIT © 2025 MKS2508

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Links

- [npm package](https://www.npmjs.com/package/@mks2508/binary-cookies-parser)
- [GitHub repository](https://github.com/mks2508/binary-cookies-parser)
- [Issue tracker](https://github.com/mks2508/binary-cookies-parser/issues)
