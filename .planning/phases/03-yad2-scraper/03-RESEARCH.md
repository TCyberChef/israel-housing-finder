# Phase 3: Yad2 Scraper - Research

**Researched:** 2026-02-13
**Domain:** Web scraping with headless browsers, GitHub Actions automation
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 requires scraping Yad2 rental listings using GitHub Actions scheduled workflows, with automatic deduplication and database storage. Research reveals that Yad2 employs aggressive anti-scraping measures (ShieldSquare, reCAPTCHA, Cloudflare) requiring headless browsers with stealth plugins rather than simple HTML parsers.

The standard approach uses Puppeteer or Playwright with stealth evasion, running in GitHub Actions on a 6-hour schedule. Puppeteer-extra with stealth plugins provides the best balance of compatibility, performance, and anti-detection capability. TypeScript provides type safety for the scraper logic, Supabase JS client handles database operations with built-in upsert support, and hash-based deduplication using SHA-256 prevents duplicate listings.

**Primary recommendation:** Use Puppeteer-extra with stealth plugin in TypeScript, running on GitHub Actions scheduled workflows, with Supabase JS client for database operations and SHA-256 hash-based deduplication.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| puppeteer-extra | ^3.3.6 | Headless browser automation with plugin support | Plugin architecture enables stealth evasion, widely used for scraping protected sites |
| puppeteer-extra-plugin-stealth | ^2.11.2 | Anti-detection evasion (17 techniques) | Bypasses common bot detection methods, essential for sites with anti-scraping |
| @supabase/supabase-js | ^2.58.0 | Database client for Node.js/TypeScript | Official Supabase client, supports upsert operations for deduplication |
| TypeScript | ^5.x | Type-safe scraping logic | Prevents runtime errors, improves maintainability for complex scraping logic |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| axios-retry | ^4.x | HTTP retry logic with exponential backoff | Handling temporary network failures during scraping |
| dotenv | ^16.x | Local environment variables for testing | Development/testing with Supabase credentials locally |
| tsx | ^4.x | TypeScript execution for scripts | Running scraper locally during development |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Puppeteer-extra | Playwright | Playwright has better cross-browser support but less mature stealth ecosystem, slightly higher resource usage |
| Puppeteer-extra | Cheerio | 70% faster for static HTML but cannot handle JavaScript-rendered content or bypass anti-scraping (Yad2 requires full browser) |
| Puppeteer | Puppeteer-core | Puppeteer-core is 10MB smaller but requires manual browser management (not ideal for GitHub Actions) |

**Installation:**
```bash
npm install puppeteer-extra puppeteer-extra-plugin-stealth @supabase/supabase-js
npm install -D typescript tsx @types/node
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── scrapers/           # Scraper implementations
│   ├── yad2.ts        # Yad2-specific scraping logic
│   └── base.ts        # Shared scraper utilities
├── db/                # Database operations
│   ├── client.ts      # Supabase client initialization
│   └── operations.ts  # Insert/upsert operations
├── utils/             # Cross-cutting utilities
│   ├── hash.ts        # SHA-256 deduplication hashing
│   ├── retry.ts       # Exponential backoff retry logic
│   └── logger.ts      # Structured logging
└── index.ts           # Entry point for GitHub Actions
```

### Pattern 1: Stealth Browser Initialization
**What:** Launch Puppeteer with stealth plugin to evade bot detection
**When to use:** Every scraping session, before navigating to target site
**Example:**
```typescript
// Source: https://github.com/berstend/puppeteer-extra
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Critical for GitHub Actions limited memory
  ],
});

const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });

// Set realistic user agent
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
```

### Pattern 2: Upsert with Hash-Based Deduplication
**What:** Insert new listings or update existing ones based on unique hash
**When to use:** After scraping listings, before database insertion
**Example:**
```typescript
// Source: https://context7.com/supabase/supabase-js/llms.txt
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Generate deduplication hash
function generateHash(listing: Listing): string {
  const content = `${listing.address}|${listing.rooms}|${listing.size}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Upsert with deduplication
const { data, error } = await supabase
  .from('listings')
  .upsert({
    id: listing.id,
    dedupe_hash: generateHash(listing),
    address: listing.address,
    price: listing.price,
    rooms: listing.rooms,
    photos: listing.photos,
    last_seen: new Date().toISOString(),
  }, {
    onConflict: 'dedupe_hash',
    ignoreDuplicates: false, // Update existing on conflict
  })
  .select();
```

### Pattern 3: Retry Logic with Exponential Backoff
**What:** Retry failed requests with increasing delays to handle temporary failures
**When to use:** Network requests, page navigation, database operations
**Example:**
```typescript
// Source: https://www.webdevtutor.net/blog/typescript-retry (pattern verified across sources)
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}

// Usage
await withRetry(() => page.goto('https://www.yad2.co.il/realestate/rent'));
```

### Pattern 4: GitHub Actions Scheduled Workflow
**What:** Run scraper on schedule with cron syntax, manage secrets securely
**When to use:** Production deployment, automated recurring scraping
**Example:**
```yaml
# Source: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
name: Scrape Yad2 Listings

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours at minute 0
  workflow_dispatch:  # Manual trigger for testing

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v6
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Run scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: npm run scrape
```

### Anti-Patterns to Avoid
- **Scraping too fast:** Rapid sequential requests trigger rate limiting. Use delays (1-3 seconds) between page navigations.
- **Ignoring errors silently:** Failed scrapes without logging make debugging impossible. Always log errors with context.
- **Hard-coded selectors without fallbacks:** Websites change HTML structure. Use multiple selector strategies or XPath alternatives.
- **Running without headless mode locally:** Testing with `headless: false` helps debug, but always test with `headless: true` before deployment.
- **Not handling stale listings:** Listings disappear from Yad2 when rented. Mark as inactive if not seen in 7 days (requirement).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot detection evasion | Custom WebDriver property hiding | puppeteer-extra-plugin-stealth | Plugin implements 17+ evasion techniques, handles edge cases like WebGL fingerprinting, canvas noise |
| Retry logic | Manual setTimeout loops | axios-retry or custom typed retry utility | Handles exponential backoff, jitter, conditional retries based on error type |
| Hash generation | Custom string hashing | Node.js crypto.createHash('sha256') | Cryptographically secure, standard library, negligible collision risk |
| Database upserts | SELECT then INSERT/UPDATE logic | Supabase .upsert() with onConflict | Atomic operation prevents race conditions, simpler code, PostgreSQL optimized |
| Environment secrets | Hardcoded credentials | GitHub Secrets + dotenv | Security best practice, prevents credential leaks in version control |

**Key insight:** Web scraping anti-detection is a cat-and-mouse game with constant updates. Using maintained libraries (puppeteer-extra) ensures you benefit from community-driven evasion updates without manual maintenance.

## Common Pitfalls

### Pitfall 1: GitHub Actions Memory Limits Causing Browser Crashes
**What goes wrong:** Puppeteer consumes 150-300MB per instance; GitHub Actions runners have limited shared memory (/dev/shm), causing Chrome to crash with "Out of Memory" errors.
**Why it happens:** Default Chrome uses /dev/shm for shared memory, but GitHub Actions limits this to 64MB.
**How to avoid:** Add `--disable-dev-shm-usage` to browser launch args, forces Chrome to use /tmp instead.
**Warning signs:** Crashes with "DevToolsActivePort file doesn't exist" or "Browser closed unexpectedly".

### Pitfall 2: Scheduled Workflows Disabled After 60 Days Inactivity
**What goes wrong:** GitHub automatically disables scheduled workflows in public repos after 60 days of no repository activity, stopping scraping silently.
**Why it happens:** GitHub policy to reduce compute abuse on inactive projects.
**How to avoid:** Set up monitoring/alerts for missing data updates, make regular commits, or manually re-enable workflows.
**Warning signs:** No new listings appearing in database, GitHub Actions tab shows "Workflow disabled".

### Pitfall 3: Yad2 IP Blocking on Repeated Scraping
**What goes wrong:** Yad2 uses ShieldSquare and Cloudflare to detect scraping patterns, blocking GitHub Actions IP ranges after repeated access.
**Why it happens:** GitHub Actions IPs are known and shared across users, making them easy to block.
**How to avoid:**
- Use stealth plugins (puppeteer-extra-plugin-stealth)
- Rotate user agents
- Add random delays (1-3 seconds) between requests
- Respect robots.txt where possible
- Consider proxy rotation if blocking persists (requires paid service)
**Warning signs:** 403 Forbidden errors, CAPTCHA challenges, empty results, "Access Denied" pages.

### Pitfall 4: Stale Data from Unchanged Deduplication Hashes
**What goes wrong:** Price updates or room changes don't trigger new records because dedupe hash remains the same (only checks address+rooms+size).
**Why it happens:** Hash includes structural attributes but not mutable fields like price.
**How to avoid:**
- Use `ignoreDuplicates: false` in upsert to UPDATE existing records
- Store `last_seen` timestamp and `updated_at` (trigger-managed)
- Compare previous price/data and update in-place
**Warning signs:** Old prices showing for listings, no price history tracking.

### Pitfall 5: Scraper Breaks When Yad2 Changes HTML Structure
**What goes wrong:** CSS selectors fail when Yad2 updates their site layout, scraper returns empty results without errors.
**Why it happens:** Web scraping relies on fragile HTML structure assumptions.
**How to avoid:**
- Use multiple selector strategies (CSS, XPath, text content)
- Validate scraped data (check required fields exist)
- Log warnings when selectors return no results
- Add GitHub Actions notifications on failure
- Test scraper weekly, not just when it breaks
**Warning signs:** Suddenly empty results, missing fields in database, "Cannot read property of undefined" errors.

### Pitfall 6: Secrets Exposed in Logs or Error Messages
**What goes wrong:** Supabase URL/keys appear in error stack traces or debug logs, exposing credentials.
**Why it happens:** Error messages include variable context, console.log statements in development code.
**How to avoid:**
- Use GitHub Actions secret masking (automatic for ${{ secrets.X }})
- Never log full Supabase client objects
- Sanitize error messages before logging
- Use structured logging with safe fields only
**Warning signs:** API keys visible in GitHub Actions logs, unauthorized database access.

## Code Examples

Verified patterns from official sources:

### Complete Scraper Entry Point
```typescript
// Source: Combined from Context7 sources and standard patterns
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';

puppeteer.use(StealthPlugin());

interface Listing {
  id: string;
  address: string;
  city: string;
  price: number;
  rooms: number;
  size?: number;
  photos: string[];
}

async function scrapeYad2(): Promise<Listing[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  try {
    await page.goto('https://www.yad2.co.il/realestate/rent', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Extract listings - selectors need to be discovered from actual Yad2 site
    const listings = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.feeditem'));
      return items.map(item => ({
        id: item.getAttribute('data-id') || '',
        address: item.querySelector('.address')?.textContent?.trim() || '',
        city: item.querySelector('.city')?.textContent?.trim() || '',
        price: parseInt(item.querySelector('.price')?.textContent?.replace(/\D/g, '') || '0'),
        rooms: parseFloat(item.querySelector('.rooms')?.textContent || '0'),
        size: parseInt(item.querySelector('.size')?.textContent?.replace(/\D/g, '') || '0'),
        photos: Array.from(item.querySelectorAll('img')).map(img => img.src),
      }));
    });

    return listings;
  } finally {
    await browser.close();
  }
}

async function saveListings(listings: Listing[]) {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  for (const listing of listings) {
    const dedupeHash = crypto
      .createHash('sha256')
      .update(`${listing.address}|${listing.rooms}|${listing.size}`)
      .digest('hex');

    const { error } = await supabase
      .from('listings')
      .upsert({
        ...listing,
        dedupe_hash: dedupeHash,
        last_seen: new Date().toISOString(),
        source_platform: 'yad2',
      }, {
        onConflict: 'dedupe_hash',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Insert failed:', error.message, { listing_id: listing.id });
    }
  }
}

// Entry point
(async () => {
  try {
    console.log('Starting Yad2 scraper...');
    const listings = await scrapeYad2();
    console.log(`Scraped ${listings.length} listings`);

    await saveListings(listings);
    console.log('Listings saved successfully');
  } catch (error) {
    console.error('Scraper failed:', error);
    process.exit(1);
  }
})();
```

### Marking Stale Listings Inactive
```typescript
// Run this after scraping to mark listings not seen in 7 days as inactive
async function markStaleListings() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { error } = await supabase
    .from('listings')
    .update({ is_active: false })
    .eq('source_platform', 'yad2')
    .lt('last_seen', sevenDaysAgo.toISOString())
    .eq('is_active', true);

  if (error) {
    console.error('Failed to mark stale listings:', error.message);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer default headless | Puppeteer with 'shell' mode or stealth plugins | 2022-2024 | Puppeteer v22+ uses new headless mode; 'shell' mode (chrome-headless-shell) is 20-30% faster for automation but stealth plugins still use full Chrome |
| Simple User-Agent rotation | Full browser fingerprint randomization | 2023-2025 | Modern anti-bot (ShieldSquare, Cloudflare) detects WebGL, canvas, fonts; requires comprehensive fingerprint tools like Apify fingerprint-suite |
| GitHub Actions ubuntu-latest (Ubuntu 22.04) | ubuntu-24.04 available | 2024-2026 | Newer runner images, faster startup, but Puppeteer dependencies must be updated |
| Scheduled workflows only | schedule + workflow_dispatch | 2021-present | Manual triggers essential for testing scrapers without waiting for cron |

**Deprecated/outdated:**
- **PhantomJS:** Discontinued in 2018, replaced by headless Chrome/Firefox via Puppeteer/Playwright
- **Old Puppeteer headless mode:** Puppeteer v22 changed default headless implementation; use `headless: 'shell'` for old behavior if needed
- **Nightmare.js:** Unmaintained since 2019, Electron-based scraping replaced by Playwright/Puppeteer

## Open Questions

1. **What are Yad2's exact HTML selectors for listings in 2026?**
   - What we know: Historical scrapers use `.feeditem` class, exclude `.feed-list-platinum` premium listings
   - What's unclear: Current selectors (Yad2 likely changed structure since 2024)
   - Recommendation: Manual inspection required; implement fallback selectors; validate during Phase 3 Task 1 (scraper development)

2. **Will GitHub Actions IPs be blocked by Yad2's anti-scraping?**
   - What we know: Yad2 uses ShieldSquare + Cloudflare, GitHub Actions IPs are shared/known
   - What's unclear: Current blocking severity, whether stealth plugins alone suffice
   - Recommendation: Start with stealth plugin only; monitor for 403s/CAPTCHAs; add proxy rotation if needed (deferred to Phase 3 execution)

3. **What is acceptable scraping frequency to avoid rate limiting?**
   - What we know: Requirement specifies 6-hour intervals, web scraping best practices suggest 1-3 second delays between requests
   - What's unclear: Yad2's specific rate limit thresholds, whether pagination triggers stricter limits
   - Recommendation: Start conservative (3-second delays), monitor for blocks, adjust based on empirical data

4. **Should we scrape paginated results or just first page?**
   - What we know: First page shows ~20-30 listings, pagination may have hundreds
   - What's unclear: Product requirement scope (all listings vs. sample), blocking risk with deep pagination
   - Recommendation: Start with first 2-3 pages (60-90 listings), evaluate data coverage vs. blocking risk; document decision in Phase 3 plan

5. **How to handle Yad2's reCAPTCHA challenges if they appear?**
   - What we know: Yad2 uses reCAPTCHA as part of anti-bot measures
   - What's unclear: Frequency of CAPTCHA challenges, whether headless detection triggers them
   - Recommendation: Detect CAPTCHA presence in scraper; fail gracefully with alert; consider CAPTCHA solving service if blocking is severe (out of scope for Phase 3, defer to future phase)

## Sources

### Primary (HIGH confidence)
- **/puppeteer/puppeteer** (Context7) - Headless browser automation, GitHub Actions CI/CD setup
- **/microsoft/playwright** (Context7) - Alternative browser automation, performance comparison
- **/cheeriojs/cheerio** (Context7) - HTML parsing, when NOT to use (JavaScript-heavy sites)
- **/supabase/supabase-js** (Context7) - Database client, upsert operations, error handling
- **/berstend/puppeteer-extra** (Context7) - Stealth plugin usage, anti-detection patterns
- **/websites/github_en_actions** (Context7) - Scheduled workflows, cron syntax, secrets management
- [GitHub Actions Documentation](https://docs.github.com/en/actions) - Official workflow syntax, limits, billing

### Secondary (MEDIUM confidence)
- [Web Scraping Best Practices 2026](https://www.scrapingbee.com/blog/web-scraping-without-getting-blocked/) - Rate limiting, anti-blocking techniques, user agent strategies
- [Playwright vs Puppeteer Comparison 2026](https://www.browsercat.com/post/playwright-vs-puppeteer-web-scraping-comparison) - Performance metrics, memory usage, tool selection
- [TypeScript Web Scraping Guide](https://scrapfly.io/blog/posts/ultimate-intro-to-web-scraping-with-typescript) - Project structure, error handling patterns
- [GitHub Actions Free Tier Limits](https://docs.github.com/en/actions/reference/limits) - Runtime constraints, scheduled workflow policies
- [Hash-Based Deduplication Best Practices](https://airbyte.com/data-engineering-resources/data-deduplication) - Collision prevention, verification methods

### Tertiary (LOW confidence - requires validation)
- [Yad2 Puppeteer Scraper Examples](https://github.com/SaraW011/Yad-2-Puppeteer-Rental-Scraper) - Historical HTML selectors (`.feeditem`), may be outdated
- [Real Estate Smart Agent](https://github.com/MaorBezalel/real-estate-smart-agent) - Architecture reference for Yad2 scraping, limited implementation details
- [Cloudflare Bypass Techniques 2026](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping) - General Cloudflare bypass (not Yad2-specific)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Puppeteer-extra and Supabase JS are well-documented in Context7, widely adopted
- Architecture: MEDIUM-HIGH - Patterns verified from official sources, but Yad2-specific selectors require validation
- Pitfalls: MEDIUM - GitHub Actions limits and anti-scraping measures confirmed from docs, but Yad2 specifics require empirical testing
- Yad2 anti-scraping severity: LOW - Relying on 2024 GitHub examples and general web search, needs real-world testing

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - web scraping anti-detection evolves rapidly, Yad2 may change structure)
