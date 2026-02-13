# Pitfalls Research

**Domain:** Israeli Rental Apartment Aggregator with Web Scraping
**Researched:** 2026-02-13
**Confidence:** MEDIUM-HIGH

## Critical Pitfalls

### Pitfall 1: Supabase Free Tier Database Goes Read-Only Without Warning

**What goes wrong:**
Your Supabase database enters read-only mode when you exceed 500MB, causing INSERT and UPDATE operations to fail with "cannot execute INSERT in a read-only transaction" errors. Users can't save searches, scrapers can't store new listings, and the entire application appears broken to end users.

**Why it happens:**
Scraped real estate data grows faster than expected. A single listing with 10 high-res photos (stored as URLs), full Hebrew/English descriptions, location data, and historical price changes can consume 50-100KB. At 10,000 listings, you've already used 500MB-1GB. Developers often store raw HTML, duplicate photos across sources, or fail to implement proper data lifecycle management.

**How to avoid:**
- Store only image URLs, never download images to Supabase Storage (keep under 1GB storage limit)
- Implement aggressive deduplication before INSERT (hash-based matching)
- Set up automated alerts at 400MB (80% threshold) via Supabase dashboard
- Archive listings older than 60 days to a JSON export (cold storage)
- Use VACUUM FULL regularly to reclaim deleted row space
- Monitor database size daily via scheduled GitHub Action

**Warning signs:**
- Dashboard shows 300MB+ usage after first week
- Database size grows >50MB/day consistently
- No automated cleanup jobs running
- Storing full listing history instead of current state + changes

**Phase to address:**
Phase 1 (Data Pipeline) - Build with size constraints from day one, implement archival strategy in Phase 2 (Data Management)

---

### Pitfall 2: Hebrew Text Encoding Breaks During Scraping/Storage

**What goes wrong:**
Hebrew text displays as gibberish (�������), gets reversed in the UI (RTL issues), or mixes incorrectly with English/numbers. Scraped addresses like "רחוב הרצל 15" become unreadable, breaking search functionality and user trust.

**Why it happens:**
Multiple encoding layers cause corruption: HTTP response (might be windows-1255 or ISO-8859-8), Python scraper (needs explicit UTF-8), Supabase PostgreSQL (must specify UTF-8 encoding), React frontend (meta charset). A single misconfiguration in the chain corrupts all downstream data. Bidirectional text (mixing RTL Hebrew with LTR numbers/English) requires explicit Unicode direction markers that are often missing.

**How to avoid:**
- Set HTTP scraper to decode as UTF-8 explicitly: `response.encoding = 'utf-8'`
- Store in PostgreSQL with UTF-8 encoding verified: `SHOW SERVER_ENCODING;`
- Add `<meta charset="UTF-8">` and `dir="auto"` to HTML elements containing Hebrew
- Use CSS `unicode-bidi: plaintext;` for mixed Hebrew/English text
- Test with real Yad2 listings containing addresses like "דרך מנחם בגין 132, תל אביב"
- Never rely on default encodings - always specify explicitly

**Warning signs:**
- Question marks or boxes appearing in scraped data
- Hebrew text displaying right-to-left in database but left-to-right in UI
- Numbers separating from Hebrew text incorrectly ("15 רחוב" instead of "רחוב 15")
- Search failing to match Hebrew queries

**Phase to address:**
Phase 1 (Scraper Setup) - Validate encoding at every step before writing production code

---

### Pitfall 3: IP Blocking from Aggressive Scraping (Cloudflare/Rate Limits)

**What goes wrong:**
Your scraper gets blocked after 50-200 requests. Yad2, Homeless, and Facebook use Cloudflare or similar anti-bot systems that detect automated traffic patterns (consistent timing, data center IPs, missing browser fingerprints). Your GitHub Actions workflow fails with 403 Forbidden or Cloudflare challenge pages, stopping all data collection.

**Why it happens:**
Scraping from GitHub Actions uses Microsoft Azure data center IPs with terrible reputation scores. Making requests every 2 seconds (30/min) triggers rate limits designed for humans (5-10/min). Missing browser headers (User-Agent, Accept-Language, Referer) make requests obvious bots. Cloudflare Turnstile (2025+ standard) requires JavaScript execution that simple HTTP libraries can't handle.

**How to avoid:**
- Use rotating residential proxy pool (avoid free proxies - they're burned)
- Implement exponential backoff: start at 5 sec/request, increase if rate limited
- Rotate User-Agent strings from real browsers
- Run scrapers from different IPs: GitHub Actions (low volume), personal server (main), cloud functions (backup)
- Respect robots.txt even though it's not legally required
- Add jitter to request timing: random.uniform(5, 15) seconds between requests
- For Facebook Groups: use official APIs where possible (public groups only)
- Monitor for 429/403 responses and pause for 15+ minutes on detection

**Warning signs:**
- 403 Forbidden errors in scraper logs
- Cloudflare challenge pages in response HTML
- Success rate drops below 80%
- Scraper runs getting slower over time (retry delays)
- All requests from same IP failing

**Phase to address:**
Phase 1 (Scraper POC) - Test rate limits early, Phase 3 (Production Scraping) - Implement robust retry logic

---

### Pitfall 4: Duplicate Listings Across Platforms Not Deduplicated

**What goes wrong:**
Same apartment appears 3-5 times with slight variations: "2BR Florentin" on Yad2, "דירת 2 חדרים בפלורנטין" on Homeless, "Florentin 2 rooms" on Facebook. Users lose trust when they see obvious duplicates. Database fills with redundant data, wasting space and degrading search quality.

**Why it happens:**
No single unique identifier exists across platforms. Same apartment has different:
- IDs (each site uses own)
- Titles (Hebrew vs English, abbreviations)
- Prices (including vs excluding vaad bayit)
- Addresses ("Herzl 15" vs "רחוב הרצל 15" vs "15 Herzl St.")
- Contact info (agent posts to multiple sites with different numbers)

Simple exact-match deduplication fails. Fuzzy matching on titles/addresses has too many false positives (multiple apartments in same building).

**How to avoid:**
- Generate composite hash from normalized data:
  - Geocoded lat/lng (rounded to 4 decimals = ~10m accuracy)
  - Price range (±5% tolerance)
  - Rooms count (exact match)
  - Square meters (±10% tolerance)
- Use perceptual hashing on listing photos (pHash algorithm)
- Implement tiered matching:
  1. Exact hash match (99% confidence)
  2. Photo similarity + address fuzzy match (85% confidence)
  3. Manual review queue for borderline cases
- Update existing listings when scraping finds duplicates (don't create new)
- Track "seen on" platforms as array field to show users cross-posting

**Warning signs:**
- Database has >20,000 listings after first week (Israeli rental market isn't that big)
- Same photos appearing multiple times in UI
- User complaints about duplicates
- No deduplication logic in codebase

**Phase to address:**
Phase 2 (Deduplication Logic) - Critical for data quality before user-facing features

---

### Pitfall 5: Israeli Address Geocoding Fails or Costs Exceed Budget

**What goes wrong:**
Google Maps Geocoding API costs $5 per 1,000 requests. At 10,000 listings/month, you're spending $50/month (exceeds free tier). Alternatively, free alternatives fail to geocode Hebrew addresses or neighborhood names correctly, returning null coordinates or wrong locations. "רמת אביב ג׳" geocodes to Ramat Aviv A or generic city center instead of specific neighborhood.

**Why it happens:**
Hebrew addresses lack vowels, have multiple transliteration standards (ISO vs BGN/PCGN), and include neighborhood names not in standard geocoding databases. "Rehov HaShalom" vs "רחוב השלום" may return different coordinates. Google Maps free tier ($200/month credit) ended February 2025 for new accounts. Free alternatives (Nominatim, LocationIQ) struggle with non-Latin scripts.

**How to avoid:**
- Pre-build Israeli address normalization layer:
  - Transliterate Hebrew to standard Latin (use ICU library)
  - Expand abbreviations: "רח׳" → "רחוב", "ת״א" → "תל אביב"
  - Map neighborhood aliases: "רמת אביב ג׳" → "Ramat Aviv Gimel"
- Use Mapbox Geocoding (100k free/month) or HERE Maps (250k free/month) instead of Google
- Implement caching: same address across listings geocodes once
- Batch geocoding: group 100 addresses per API call (if supported)
- Fall back to city-level geocoding + neighborhood offset for unknowns
- Store geocoded results permanently, never re-geocode same address

**Warning signs:**
- 30%+ of listings have null coordinates
- Same address returns different lat/lng on different scrapes
- Geocoding costs >$20/month on free tier
- All Tel Aviv apartments showing same pin on map
- No caching layer in architecture

**Phase to address:**
Phase 3 (Map Integration) - Build geocoding with cost monitoring from start

---

### Pitfall 6: GitHub Actions Exceeds 2000 Minutes/Month Free Tier

**What goes wrong:**
Scraper workflows run 30 min each, 3x per day, consuming 2,700 minutes/month (exceeds free tier by 35%). GitHub blocks workflows mid-month, data collection stops, users see stale listings. Or worse, billing kicks in at $0.008/min = $5.60/month unexpected cost.

**Why it happens:**
Scrapers run longer than estimated due to:
- Rate limiting causing retries/delays
- Inefficient HTTP requests (no connection pooling)
- Sequential scraping instead of concurrent
- Running full scrapes when incremental would work
- No optimization for GitHub Actions billing

**How to avoid:**
- Optimize workflow duration:
  - Use connection pooling (requests.Session())
  - Scrape concurrently (asyncio with rate limits)
  - Implement incremental scraping (track last-scraped timestamp)
  - Cache responses during development/testing
- Schedule strategically: 2x/day during peak listing hours (9am, 6pm IST)
- Monitor minutes usage in GitHub Settings → Billing
- Set up spending limit alert at 1,800 minutes (90%)
- Use self-hosted runner for heavy workloads (Raspberry Pi at home)
- Profile workflows: add timing logs to identify bottlenecks

**Warning signs:**
- Workflows taking >20 minutes consistently
- No concurrency in scraper code
- Scraping all listings every run (no incremental logic)
- Running on schedule without usage monitoring
- Over 1,500 minutes used by day 20 of month

**Phase to address:**
Phase 1 (Scraper Development) - Optimize before production deployment

---

### Pitfall 7: Legal Violations - Scraping Private Data or Violating ToS

**What goes wrong:**
Your scraper collects personal data (phone numbers, names, emails) from listings without consent, violating Israel's Privacy Protection Law (Amendment 13, effective August 2025). Yad2 or Facebook sends cease & desist letter for ToS violations. Worst case: Privacy Protection Authority fines or legal action against you personally.

**Why it happens:**
Real estate listings contain personal data (contact info, owner names). Israel Amendment 13 requires:
- Data Protection Officer appointment
- Explicit consent for personal data processing
- Breach notification requirements
- Regular compliance reporting

Terms of Service for all sites explicitly prohibit automated scraping. Developers assume "public data = fair game" but legally it's not. GDPR (EU regulation) applies if serving EU users.

**How to avoid:**
- Scrape only non-personal fields:
  - Property details (rooms, size, price, address)
  - Public photos
  - Listing metadata (post date, platform)
  - EXCLUDE: contact info, names, user profiles
- Redirect users to original listing for contact details (don't store)
- Add clear privacy policy explaining data sources and usage
- Respect robots.txt and platform ToS as good faith effort
- Don't scrape private Facebook groups (login required)
- Monitor legal developments: subscribe to PPA updates
- Consider Terms of Use allowing data aggregation with attribution

**Warning signs:**
- Storing phone numbers, email addresses, or names
- No privacy policy on website
- No robots.txt compliance checking
- Scraping private/gated content
- No legal review of ToS implications

**Phase to address:**
Phase 0 (Legal Review) - Before writing any scraper code, consult legal guidelines

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing full HTML instead of parsed data | Faster scraper development | 10-50x database bloat, can't query efficiently, hits 500MB limit in days | Never - always parse before storing |
| No geocoding cache layer | Simpler architecture | Wasted API credits, slow performance, rate limit issues | Never - cache is critical |
| Single scraper instance (no parallelization) | Easier debugging | Takes 4+ hours to scrape all sites, can't scale | Acceptable for MVP, must fix in Phase 2 |
| Hardcoded CSS selectors without fallback | Fast scraper implementation | Breaks when sites redesign, no error handling | Acceptable with monitoring alerts |
| Storing images in Supabase Storage | Keeps everything in one place | Exceeds 1GB storage limit quickly, expensive to scale | Never - use external CDN or just URLs |
| No listing expiration logic | Don't have to track staleness | Database fills with expired listings, misleads users | Acceptable for MVP, critical in Phase 3 |
| Running scrapers on fixed schedule without checks | Simple cron setup | Wastes resources when sites don't update, exceeds GitHub Actions limits | Acceptable for MVP, optimize in Phase 2 |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Yad2 scraping | Assuming stable CSS selectors | Use data attributes or multiple selector fallbacks, implement change detection alerts |
| Homeless scraping | Not handling pagination correctly | Homeless uses infinite scroll (JavaScript required), need Selenium/Playwright |
| Facebook Groups | Using unofficial scraper APIs | Only scrape public groups via official Graph API when possible, accept limitations |
| Supabase Auth | Storing user passwords | Use Supabase Auth built-in (magic links, OAuth), never roll your own |
| Google Maps Geocoding | Not batching requests | Use Geocoding API batching or cache aggressively |
| React deployment to GitHub Pages | Hard-coded localhost URLs | Use environment variables for API endpoints, configure homepage in package.json |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Loading all listings on map at once | Map freezes with >1000 markers | Implement viewport-based clustering (Leaflet.markercluster) | >500 listings |
| No database indexes on search fields | Queries take 3+ seconds | Index: price, rooms, neighborhood, created_at | >5,000 listings |
| Fetching all listing photos on search results | Page loads 50MB of images | Lazy load images, use thumbnails in results | >100 listings/page |
| Running full table scans for deduplication | Dedup takes 5+ minutes | Use hash indexes on composite keys, batch processing | >10,000 listings |
| Not using connection pooling in scraper | Each request creates new TCP connection | Use requests.Session() or connection pool | Noticeable at 100+ req/run |
| Storing uncompressed JSON in text fields | Database bloat from metadata | Use JSONB type in Postgres, compress large fields | >20,000 listings |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Hardcoding Supabase anon key in frontend | Key exposed in public repo/bundle | Use environment variables, rotate keys if leaked |
| No rate limiting on API endpoints | Scraper abuse, bill shock | Implement Supabase RLS + rate limiting middleware |
| Storing scraper credentials in GitHub repo | Credential theft, account compromise | Use GitHub Secrets, never commit .env files |
| Allowing unrestricted database writes | Malicious users can pollute data | Enable Row Level Security (RLS) on all Supabase tables |
| No HTTPS enforcement | Man-in-the-middle attacks | GitHub Pages enforces HTTPS by default, verify in production |
| Exposing admin endpoints publicly | Unauthorized access to management functions | Use Supabase Auth roles, restrict admin routes |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing stale listings (removed from source sites) | Users contact landlords for unavailable apartments, lose trust | Mark listings as "last verified" timestamp, hide after 7 days unconfirmed |
| No indication which platform listing came from | Users can't report issues or verify legitimacy | Display source badge (Yad2/Homeless/Facebook) with link to original |
| Hebrew-only interface for English speakers | Excludes non-Hebrew speakers (olim, expats) | i18n from day one (Hebrew/English toggle), detect browser language |
| Map-only view without list option | Hard to compare details side-by-side | Provide toggle between map, list, and split views |
| No "new since last visit" indicator | Users manually check for updates daily | Track user's last visit timestamp, highlight new listings |
| Requiring account creation to view listings | High friction, users leave immediately | Allow browsing without account, require auth only for saved searches |

## "Looks Done But Isn't" Checklist

- [ ] **Scraping:** Handles pagination/infinite scroll, not just first page
- [ ] **Scraping:** Error handling for timeouts/rate limits with exponential backoff
- [ ] **Scraping:** Respects robots.txt (even if not legally required)
- [ ] **Data Storage:** UTF-8 encoding verified at every layer (HTTP → DB → Frontend)
- [ ] **Data Storage:** Deduplication runs BEFORE insert, not after
- [ ] **Data Storage:** Database has indexes on all filterable fields
- [ ] **Geocoding:** Results cached permanently, never geocode same address twice
- [ ] **Geocoding:** Fallback strategy when geocoding fails (city-level pins)
- [ ] **Map Display:** Clustering enabled for >50 markers
- [ ] **Map Display:** Mobile-responsive touch controls
- [ ] **Search:** Works with both Hebrew and transliterated English ("רמת גן" and "Ramat Gan")
- [ ] **Search:** Handles common misspellings and abbreviations
- [ ] **Monitoring:** Database size alerts at 400MB (80% of free tier)
- [ ] **Monitoring:** GitHub Actions minutes usage tracking
- [ ] **Monitoring:** Scraper success rate monitoring (alert if <80%)
- [ ] **Legal:** Privacy policy published explaining data sources
- [ ] **Legal:** No personal data (phone/email/names) stored
- [ ] **Legal:** Attribution links to original listings
- [ ] **Performance:** API responses under 500ms for search queries
- [ ] **Performance:** Page loads under 3 seconds on mobile (3G network)
- [ ] **Accessibility:** RTL layout for Hebrew, LTR for English
- [ ] **Accessibility:** Keyboard navigation works on map
- [ ] **Production:** Environment variables configured (not hardcoded)
- [ ] **Production:** Error logging/monitoring set up (Sentry or similar)

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Database hits 500MB read-only mode | MEDIUM | 1) Export data to JSON backup 2) Delete old/duplicate listings 3) Run VACUUM FULL 4) Re-enable writes at <475MB 5) Implement archival cron job |
| Scraped data has encoding corruption | HIGH | 1) Identify corruption point in pipeline 2) Fix encoding at source 3) Re-scrape all corrupted data 4) Implement encoding tests in CI |
| IP banned from scraping site | LOW-MEDIUM | 1) Wait 24-48 hours 2) Use different IP/proxy 3) Reduce request rate 4) Add more jitter to timing |
| GitHub Actions exceeds free tier | LOW | 1) Optimize workflow duration 2) Reduce scrape frequency 3) Use self-hosted runner 4) Accept billing ($6-10/mo) |
| Duplicate listings pollute database | MEDIUM | 1) Build deduplication script 2) Run batch job to merge duplicates 3) Implement proper dedup before next scrape 4) Add unique constraints |
| Geocoding costs exceed budget | MEDIUM | 1) Switch to free tier provider (Mapbox/HERE) 2) Implement caching layer 3) Batch requests 4) Accept lower geocoding coverage |
| Legal complaint from scraped site | HIGH | 1) Immediately pause scraper 2) Consult lawyer 3) Remove personal data if stored 4) Negotiate API access or cease scraping that source |
| Lost user trust from stale listings | MEDIUM | 1) Mark all listings "unverified" 2) Implement daily freshness checks 3) Hide listings >7 days old 4) Re-scrape to confirm current state |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Supabase free tier exceeded | Phase 1 (Data Pipeline) | Monitor dashboard size daily, alert at 400MB |
| Hebrew encoding corruption | Phase 1 (Scraper Setup) | Test with real Yad2 data containing Hebrew addresses |
| IP blocking from aggressive scraping | Phase 1 (Scraper POC) | Track success rate, must stay >90% |
| Duplicate listings | Phase 2 (Deduplication) | Manual review of 50 random listings, <5% dupes |
| Geocoding costs exceed budget | Phase 3 (Map Integration) | Track API costs weekly, must stay under free tier |
| GitHub Actions minutes exceeded | Phase 1 (Scraper Development) | Monitor minutes usage, optimize if >60 min/day |
| Legal violations (personal data) | Phase 0 (Legal Review) | Code review: no phone/email/name fields stored |
| No database indexes | Phase 2 (Data Optimization) | EXPLAIN ANALYZE on all search queries, <500ms |
| Stale listings misleading users | Phase 4 (Freshness Logic) | Automated test: scrape known expired listing, verify hidden |
| Poor mobile performance | Phase 5 (Performance Tuning) | Lighthouse score >80 on mobile |

## Sources

### Web Scraping & Anti-Bot
- [How to Bypass Cloudflare When Web Scraping in 2025](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping)
- [Top 7 Bot Blockers in 2025: Challenges for Modern Web Scraping](https://www.scraperapi.com/blog/top-bot-blockers/)
- [Rate Limit in Web Scraping: How It Works and 5 Bypass Methods](https://scrape.do/blog/web-scraping-rate-limit/)
- [Real Estate Scraping: Benefits, Challenges, and How-To](https://decodo.com/blog/real-estate-scraping)

### Hebrew Text & RTL Handling
- [Get Rid of Gibberish Data: Handle Language Encoding in Web Scraping](https://www.scrapehero.com/language-encoding-web-scraping/)
- [RTL websites design and development - mistakes & best practices](https://www.reffine.com/en/blog/rtl-website-design-and-development-mistakes-best-practices)
- [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)

### Israeli Address Geocoding
- [Israel Address Format With Examples](https://www.postgrid.com/global-address-format/israel-address-format/)
- [What is Address Transliteration?](https://www.geopostcodes.com/blog/address-transliteration/)
- [Top 5 Challenges in Geocoding Accuracy and How to Solve Them](https://www.lightboxre.com/insight/top-5-challenges-in-geocoding-accuracy-and-how-to-solve-them/)

### Deduplication Strategies
- [Building intelligent duplicate detection with Elasticsearch and AI](https://www.elastic.co/search-labs/blog/detect-duplicates-ai-elasticsearch)
- [Practical Tips and Strategies for Managing Data Duplication in Large Datasets](https://www.cloudthat.com/resources/blog/practical-tips-and-strategies-for-managing-data-duplication-in-large-datasets)
- [CRM Deduplication Guide (2025): How to Clean & Prevent Duplicate Data](https://www.rtdynamic.com/blog/crm-deduplication-guide-2025/)

### Legal & Data Protection
- [Data Protection Laws and Regulations Report 2025-2026 Israel](https://iclg.com/practice-areas/data-protection-laws-and-regulations/israel)
- [Web Scraping Legal Issues: 2025 Enterprise Compliance Guide](https://groupbwt.com/blog/is-web-scraping-legal/)
- [Web Scraping in 2025: The €20 Million GDPR Mistake You Can't Afford to Make](https://medium.com/deep-tech-insights/web-scraping-in-2025-the-20-million-gdpr-mistake-you-cant-afford-to-make-07a3ce240f4f)

### Supabase Free Tier
- [Understanding Database and Disk Size - Supabase Docs](https://supabase.com/docs/guides/platform/database-size)
- [Supabase Pricing 2026 - Complete Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [Supabase Free Tier: What Are The Limits?](https://experience.rockfeller.com.br/key-speak/supabase-free-tier-what-are-the-limits-1764803123)

### GitHub Actions Optimization
- [GitHub Actions Pricing Changes 2026: What DevOps Geeks Need to Know](https://devops-geek.net/devops-lab/github-actions-pricing-changes-2026-what-devops-geeks-need-to-know/)
- [GitHub Actions billing - GitHub Docs](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)

### Geocoding APIs
- [Guide To Geocoding API Pricing - February 12, 2026](https://mapscaping.com/guide-to-geocoding-api-pricing/)
- [7 Google Maps API Alternatives for 2026](https://www.wpgmaps.com/7-google-maps-api-alternatives-for-2026/)
- [Geocoding API Usage and Billing - Google for Developers](https://developers.google.com/maps/documentation/geocoding/usage-and-billing)

### Database Schema Design
- [Database Schema Design Simplified: Normalization vs Denormalization](https://blog.bytebytego.com/p/database-schema-design-simplified)
- [Normalization in DBMS: A Complete Guide with SQL Examples](https://www.datacamp.com/tutorial/normalization-in-dbms)

### Facebook Scraping
- [How to Scrape Facebook Posts, Pages, Groups & Public Data in 2026](https://medium.com/@anadilkhalil786/how-to-scrape-facebook-posts-pages-groups-public-data-in-2026-568d58f214c0)
- [5 Best Facebook Scrapers in 2026 & Python Tutorial](https://research.aimultiple.com/facebook-scraping/)

---
*Pitfalls research for: Israeli Rental Apartment Aggregator*
*Researched: 2026-02-13*
