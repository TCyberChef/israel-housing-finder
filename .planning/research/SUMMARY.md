# Project Research Summary

**Project:** Israeli Rental Apartment Aggregator
**Domain:** Real Estate Aggregator with Multi-Source Scraping
**Researched:** 2026-02-13
**Confidence:** HIGH

## Executive Summary

This project is a cross-platform rental apartment aggregator for the Israeli market, combining listings from Yad2, Homeless, and Facebook groups into a unified, map-based search interface. The core differentiator is intelligent deduplication (same apartment appears on multiple platforms) combined with a free, ad-free experience. Research reveals this is best built as a serverless architecture: React frontend on GitHub Pages, Supabase for database/backend, and GitHub Actions for scheduled scraping (Cloudflare Workers as alternative for scale).

The recommended approach prioritizes getting the scraping pipeline and deduplication working first, since these are the foundational differentiators. Without robust deduplication, the product becomes "just another listing site" rather than a time-saving aggregator. The stack is entirely free-tier compatible: React 18 + Vite + Leaflet for frontend, Supabase free tier (500MB database), GitHub Actions for scraping (unlimited on public repos), styled-components with RTL support for Hebrew-first UI. Critical migrations needed: CRA to Vite (deprecated as of Feb 2025), TypeScript adoption for maintainability.

Key risks center on free-tier constraints and scraping stability. Supabase's 500MB limit requires aggressive deduplication and data lifecycle management from day one. Scraping Yad2/Homeless risks IP blocking without proper rate limiting and proxy rotation. Hebrew text encoding must be validated at every layer (HTTP, database, frontend) to avoid gibberish. Israeli address geocoding is expensive ($5/1000 requests on Google Maps) and requires normalization layer for Hebrew addresses. Legal compliance is critical: avoid storing personal data (phone/email/names) to stay within Israeli Privacy Protection Law boundaries.

## Key Findings

### Recommended Stack

The stack is optimized for free-tier deployment with Hebrew-first internationalization. All components have proven compatibility and generous free tiers.

**Core technologies:**
- **React 18.2.0 + Vite**: Already in use for React, but must migrate from deprecated CRA to Vite (1-2 day migration, essential for modern dev workflow)
- **Supabase (PostgreSQL + REST API + Realtime)**: Free tier provides 500MB database, auto-generated REST API, WebSocket subscriptions, Row-Level Security for read-only public access
- **React Leaflet 5.0.0 + Leaflet**: Free map library (no API keys), OpenStreetMap tiles, mobile-friendly, excellent marker clustering via react-leaflet-cluster
- **TanStack Query 5.x**: Server state management, perfect for Supabase integration, handles caching/refetch/deduplication automatically
- **styled-components 6.x + stylis-plugin-rtl v1**: Hebrew RTL support with automatic CSS mirroring (critical: use v1 not v2 for compatibility)
- **GitHub Actions**: Scheduled scraping (free unlimited minutes on public repos), 6hr max runtime per job, built-in logging
- **Cheerio (alternative: Playwright)**: HTML parsing for static sites, Playwright if sites require JavaScript rendering (Yad2 is SPA, may need browser automation)

**Critical version compatibility:**
- React Leaflet 5.0.0 requires React 18+ (not yet tested with React 19, stick with 18.2.0)
- stylis-plugin-rtl v1 works with styled-components v5/v6 (v2 does NOT work)
- Supabase JS 2.58.0+ compatible with TanStack Query 5.x

**What NOT to use:**
- Create React App (deprecated Feb 2025, use Vite)
- Redux Toolkit (overkill, use Zustand for client state + TanStack Query for server state)
- Google Maps API (costs money, use React Leaflet + OpenStreetMap)
- Firebase Firestore (not as good for relational data with geo queries, use Supabase PostgreSQL + PostGIS)
- Moment.js (deprecated, use date-fns)

### Expected Features

Research shows clear feature hierarchy based on Israeli rental market expectations and competitive analysis.

**Must have (table stakes):**
- **Map-based search** - Core interaction model for all major Israeli platforms (Yad2, Homeless, OnMap). Users expect to browse visually and draw on map
- **Advanced filters** - Price range, room count, square meters, floor level, entry date, furnished/unfurnished. Users need to narrow thousands of listings
- **Hebrew-first UI with English toggle** - Primary market is Hebrew speakers, but expats/olim need English. Must support RTL layout
- **Mobile responsive** - 60%+ of Israeli apartment hunters use mobile, non-negotiable in 2026
- **Listing photos** - All major platforms require photos, users skip no-photo listings
- **Price display** - Upfront monthly rent in ILS (₪), no hidden "contact for price"
- **Basic listing details** - Address/neighborhood, room count, size, floor, elevator, entry date, contact info
- **Direct contact** - Phone/WhatsApp link (Israelis use WhatsApp for everything, don't add another chat platform)
- **Listing freshness** - Show "posted 2 days ago", users want to avoid wasting time on stale listings

**Should have (competitive differentiators):**
- **Cross-platform deduplication** - THE killer feature. Same apartment appears on Yad2, Homeless, Facebook. Show once. Fuzzy matching on address + price + rooms + photo similarity
- **Facebook group integration** - Homeless/Yad2 miss Facebook groups which have exclusive listings for expat communities
- **Unified favorites across sources** - Save apartment from Yad2, see it marked when browsing Homeless view
- **Transparent source attribution** - "Found on: Yad2, Homeless" builds trust, shows aggregation value
- **Zero paywalls** - Competitors gate features. We don't. Clear positioning as free aggregator
- **Price history tracking** - Track price changes over time, "This listing reduced price 3 times" signals motivated landlord
- **Listing comparison tool** - Side-by-side comparison of saved favorites (ForRent/Apartments.com have this, Israeli platforms don't)
- **Smart notifications** - "New listing matching your search in Florentin" via email

**Defer (v2+):**
- **Agent spam detection** - Flag listings that appear to be spam (same phone on many listings, price outliers). Useful but not launch blocker
- **Neighborhood ratings/info** - Yad2 has user ratings, Madlan has market data. Nice-to-have context
- **WhatsApp bot notifications** - Requires WhatsApp Business API setup, defer until traction
- **Chrome extension** - Overlay dedup info on Yad2/Homeless directly. Cool but complex

**Anti-features (explicitly avoid):**
- **User accounts required** - Friction kills adoption. Allow localStorage favorites, optional account for cross-device sync
- **Chatbot/messaging through platform** - Israelis use WhatsApp. Don't add chat nobody checks
- **Premium listings** - Violates "fully free" value prop
- **Native mobile apps** - 10x development cost, use mobile-first responsive web

### Architecture Approach

Standard serverless aggregator pattern: scrapers feed database, frontend queries database with real-time updates. All components run on free tiers.

**Major components:**
1. **GitHub Actions Scrapers** - Python scripts with BeautifulSoup4/Playwright run every 6 hours via cron, extract listing data from Yad2/Homeless/Facebook, generate deduplication hashes, insert to Supabase
2. **Deduplication Engine** - Hash-based fingerprinting (normalized address + rooms + size + price range), runs during scraper insert to prevent duplicate writes, uses composite hash with 4-decimal lat/lng for location matching
3. **Supabase Database** - PostgreSQL with auto-generated REST API, Row-Level Security (public read-only, service_role write), pg_cron for maintenance (mark stale listings inactive after 7 days)
4. **React Frontend** - Map visualization with Leaflet, search/filter UI, listing cards, deployed to GitHub Pages as static site
5. **Supabase-JS Client** - Real-time WebSocket subscriptions for new listings, TanStack Query for caching/refetch, respects RLS policies automatically

**Key patterns:**
- **Hash-based deduplication**: Generate SHA256 from `normalized_address|rooms|size_sqm`, check dedupe_hashes table before insert
- **Scheduled scraping with atomic writes**: GitHub Actions cron runs every 6 hours, inserts only new listings (dedupe check), updates last_seen_at for existing
- **Client-side filtering with server-side queries**: Initial data fetch via Supabase query (price/city filters), React state for interactive refinement
- **pg_cron maintenance tasks**: Daily job to mark listings inactive if last_seen_at > 7 days ago

**Data flow:**
1. GitHub Actions trigger → Scraper extracts HTML → Parse to listing objects → Generate hash → Check dedupe_hashes → Insert new or update last_seen_at → Database triggers RLS → Real-time subscription notifies frontend → React updates map markers
2. User adjusts filters → React state updates → Triggers useListings hook → Build Supabase query → Execute with RLS → Return filtered results → Re-render map/list

### Critical Pitfalls

These are the top risks that will break the product if not addressed proactively.

1. **Supabase free tier database goes read-only without warning** - Exceeding 500MB causes INSERT/UPDATE to fail. At 10,000 listings with photos/descriptions, you hit 500MB-1GB quickly. PREVENTION: Store only image URLs (never download to storage), implement aggressive deduplication, archive listings >60 days old, set alerts at 400MB (80% threshold), run VACUUM FULL regularly

2. **Hebrew text encoding breaks during scraping/storage** - Hebrew displays as gibberish or reverses (RTL issues). Multiple encoding layers (HTTP → Python → PostgreSQL → React) each can corrupt text. PREVENTION: Set `response.encoding = 'utf-8'` explicitly in scraper, verify PostgreSQL is UTF-8, add `<meta charset="UTF-8">` and `dir="auto"` in HTML, use `unicode-bidi: plaintext` CSS for mixed Hebrew/English, test with real Yad2 addresses like "דרך מנחם בגין 132"

3. **IP blocking from aggressive scraping** - Yad2/Homeless use Cloudflare, GitHub Actions uses Azure data center IPs with bad reputation. Blocked at 50-200 requests. PREVENTION: Use rotating residential proxies, implement exponential backoff (start at 5 sec/request), rotate User-Agent strings, add jitter to timing (random 5-15 sec), respect robots.txt, monitor for 403/429 errors and pause 15+ minutes on detection

4. **Duplicate listings not deduplicated** - Same apartment appears 3-5 times with variations in title/address/price. No single unique ID across platforms. PREVENTION: Generate composite hash from geocoded lat/lng (rounded to 4 decimals), price range (±5%), rooms (exact), size (±10%), use perceptual hashing (pHash) on photos, implement tiered matching (exact hash 99% confidence, photo similarity + fuzzy address 85% confidence)

5. **Israeli address geocoding fails or costs exceed budget** - Google Maps costs $5/1000 requests, free tier ended Feb 2025 for new accounts. Hebrew addresses lack vowels, have multiple transliteration standards. PREVENTION: Use Mapbox (100k free/month) or HERE Maps (250k free/month), build Israeli address normalization layer (transliterate Hebrew to standard Latin, expand abbreviations "רח׳" → "רחוב"), implement caching (same address geocodes once), batch requests, store results permanently

6. **GitHub Actions exceeds 2000 minutes/month** - Scrapers run 30 min each, 3x/day = 2,700 min/month (exceeds free tier). PREVENTION: Optimize workflow duration (use connection pooling, concurrent scraping with asyncio, incremental scraping not full table scans), schedule strategically (2x/day during peak hours 9am/6pm IST), monitor minutes usage, use self-hosted runner for heavy workloads

7. **Legal violations - scraping personal data** - Storing phone numbers/emails/names violates Israel's Privacy Protection Law (Amendment 13, Aug 2025). ToS violations from Yad2/Facebook. PREVENTION: Scrape only non-personal fields (property details, public photos, metadata), redirect users to original listing for contact details, add privacy policy explaining data sources, respect robots.txt, don't scrape private Facebook groups

## Implications for Roadmap

Research strongly indicates the following phase structure based on dependencies and risk mitigation.

### Phase 1: Foundation - Database & Scraping Pipeline
**Rationale:** Everything depends on stable data. Scrapers and frontend both need working database schema. Deduplication is the core differentiator and must be built into the pipeline from day one, not added later.

**Delivers:**
- Supabase project with listings table (id, source, url, address, city, price, rooms, size_sqm, last_seen_at, active, created_at)
- dedupe_hashes table (hash, listing_id)
- RLS policies (public read-only, service_role write)
- Yad2 scraper with deduplication logic
- GitHub Actions workflow (runs every 6 hours)

**Addresses:**
- Pitfall #1 (database size) via aggressive deduplication from start
- Pitfall #2 (Hebrew encoding) via explicit UTF-8 at every layer
- Pitfall #3 (IP blocking) via rate limiting and jitter
- Pitfall #7 (legal) via storing only non-personal data

**Avoids:** Storing full HTML (bloats database), no deduplication (database fills with duplicates)

**Research flag:** SKIP - Supabase and BeautifulSoup4 are well-documented, established patterns

---

### Phase 2: Core UI - Map & Search
**Rationale:** Need working scraper from Phase 1 to populate database with real listings. Map-based search is table stakes for Israeli rental platforms (user expectation). This phase makes the aggregated data accessible and useful.

**Delivers:**
- React frontend with Vite build tool (migrate from CRA)
- Leaflet map with OpenStreetMap tiles
- Marker clustering (react-leaflet-cluster) for performance
- Basic filters (city, price range, room count)
- Listing detail cards
- GitHub Pages deployment

**Uses:**
- React 18.2.0 + Vite from STACK.md
- React Leaflet 5.0.0 + Leaflet 1.9.x
- TanStack Query for Supabase integration
- styled-components with stylis-plugin-rtl v1 for Hebrew RTL

**Addresses:**
- Table stakes features: map-based search, filters, listing details
- Pitfall #2 (Hebrew) via RTL layout with stylis-plugin-rtl

**Avoids:** MapBox (costs money), Google Maps (not free-tier-only)

**Research flag:** SKIP - React + Leaflet is well-documented pattern

---

### Phase 3: Deduplication V2 - Geocoding & Advanced Matching
**Rationale:** Phase 1 has basic hash deduplication (address + rooms + size). Phase 3 adds geocoding for location-based matching and photo similarity for higher confidence. This is the key differentiator and requires careful cost management.

**Delivers:**
- Israeli address normalization layer (Hebrew transliteration, abbreviation expansion)
- Geocoding integration (Mapbox or HERE Maps, not Google)
- Geocoding cache to stay within free tier
- Photo perceptual hashing (pHash) for duplicate detection
- Tiered matching confidence scores
- "Show all instances" UI toggle for duplicates

**Addresses:**
- Pitfall #4 (duplicate listings) via advanced matching
- Pitfall #5 (geocoding costs) via caching and normalization
- Differentiator: cross-platform deduplication with high confidence

**Avoids:** Using Google Maps (expensive), no caching (burns API credits), simple exact-match (too many false positives/negatives)

**Research flag:** NEEDS RESEARCH - Israeli address normalization and Hebrew geocoding are niche, may need trial-and-error with Mapbox/HERE

---

### Phase 4: Additional Sources - Homeless & Facebook
**Rationale:** Once Yad2 pipeline is stable and deduplication works, add more sources to increase value. Homeless uses similar scraping pattern as Yad2. Facebook groups are higher complexity (auth, rate limits, privacy).

**Delivers:**
- Homeless scraper (reuse Yad2 structure)
- GitHub Actions workflow for Homeless
- Facebook public groups scraper (or manual aggregation MVP)
- Multi-source deduplication validation
- Source attribution badges in UI ("Found on: Yad2, Homeless")

**Addresses:**
- Differentiator: Facebook group integration (competitors don't have this)
- Unified favorites across sources

**Avoids:** Scraping private Facebook groups (legal/auth issues)

**Research flag:** NEEDS RESEARCH for Facebook - Auth and rate limiting strategies need investigation

---

### Phase 5: Polish & Real-Time - UX Improvements
**Rationale:** Core functionality works from Phases 1-4. This phase makes the experience delightful and production-ready.

**Delivers:**
- Supabase Realtime subscriptions (new listings appear without refresh)
- Hebrew/English i18n (react-i18next)
- Mobile UX improvements (touch-friendly filters, swipe galleries)
- Loading states, error handling
- SEO meta tags for GitHub Pages
- Favorites with localStorage (optional account for sync)
- Listing freshness indicators ("posted 2 days ago")

**Addresses:**
- Table stakes: mobile responsive, Hebrew UI, listing freshness
- Differentiator: zero paywalls (favorites without account)

**Research flag:** SKIP - i18n and UX polish are standard patterns

---

### Phase 6: Advanced Features - Price History & Notifications
**Rationale:** Defer until core product validates. These features require user accounts and historical data collection (start collecting in Phase 1, expose in Phase 6).

**Delivers:**
- User accounts (Supabase Auth with magic links)
- Saved searches
- Email notifications for new matches
- Price history tracking and trend graphs
- Listing comparison tool (side-by-side)

**Addresses:**
- Differentiator: price history (competitors don't show rental price changes)
- Differentiator: smart notifications (more granular than Yad2's daily digest)

**Research flag:** SKIP - Supabase Auth and email notifications are documented

---

### Phase Ordering Rationale

- **Phase 1 before everything:** Database schema is dependency for both scrapers and frontend. Deduplication built into pipeline from day one prevents technical debt (can't bolt it on later without data migration)
- **Phase 2 depends on Phase 1:** Frontend needs real data from scraper to test map/filters
- **Phase 3 can partially overlap Phase 2:** Geocoding setup can start while frontend is being built, but needs Phase 1 data to test
- **Phase 4 is independent after Phase 1:** Additional scrapers reuse Phase 1 patterns, can build in parallel with Phase 3
- **Phase 5 is polish layer:** Needs working product from Phases 1-2, can add incrementally
- **Phase 6 is post-validation:** Only build after user traction validates need for accounts/notifications

**Critical path:** Phase 1 → Phase 2 → Phase 3 (dedup quality gate) → Phase 4 (more sources) → Phase 5 (polish) → Phase 6 (accounts/notifications)

**Parallelization opportunity:** After Phase 1 completes, Phase 2 (frontend) and Phase 4 (additional scrapers) can be built simultaneously

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Geocoding):** Israeli address normalization and Hebrew geocoding are niche. Need to test Mapbox/HERE with real Hebrew addresses, validate cost stays within free tier. May need custom normalization rules
- **Phase 4 (Facebook Groups):** Facebook scraping has auth complexities and rate limiting. Need to investigate: can we use Graph API for public groups? Do we need manual aggregation MVP? What are ToS risks?

Phases with standard patterns (skip research-phase):
- **Phase 1 (Database & Scraping):** Supabase, PostgreSQL, BeautifulSoup4 all well-documented
- **Phase 2 (Frontend):** React, Leaflet, TanStack Query established patterns
- **Phase 5 (Polish):** i18n, UX improvements standard frontend work
- **Phase 6 (Accounts):** Supabase Auth is documented, email notifications straightforward

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified from npm/official docs. React Leaflet 5.0.0 confirmed latest, Supabase free tier limits documented, Vite migration path clear |
| Features | MEDIUM | Table stakes features validated against Yad2/Homeless/OnMap. Deduplication importance clear. Facebook group integration demand inferred from Nefesh B'Nefesh forums (expat community) but not quantified |
| Architecture | HIGH | Serverless aggregator pattern well-established (multiple examples in research). Supabase + GitHub Pages integration proven. Hash-based deduplication documented strategy |
| Pitfalls | MEDIUM-HIGH | Supabase free tier limits confirmed (500MB). IP blocking risks validated from scraping guides. Hebrew encoding issues documented. Geocoding costs verified. Legal risks (Israel Privacy Law Amendment 13) confirmed but compliance details need lawyer review |

**Overall confidence:** HIGH for technical feasibility, MEDIUM for product-market fit

### Gaps to Address

Areas where research was inconclusive or needs validation during implementation:

- **Israeli address geocoding quality with free-tier services:** Research confirms Mapbox/HERE have free tiers (100k-250k requests/month), but quality of Hebrew address geocoding is unknown. Need to test with sample Yad2 addresses ("דרך מנחם בגין 132, תל אביב") to validate accuracy. May need custom normalization rules discovered through trial-and-error

- **Facebook Graph API for public groups:** Research shows Facebook scraping is hard (auth, rate limits). Unclear if Graph API provides sufficient access to public group posts. May need manual aggregation MVP or user-submitted links as fallback. Investigate during Phase 4 planning

- **Deduplication false positive/negative rates:** Research provides strategies (hash-based, photo similarity, fuzzy matching) but actual accuracy unknown until testing with real data. May need tuning thresholds (±5% price tolerance? ±10% size tolerance?) based on observed duplicate patterns. Build feedback mechanism to track accuracy

- **CRA to Vite migration effort:** Research says 1-2 days for small projects. Need to validate this estimate with actual migration attempt. Current codebase is minimal (simple React app) so should be straightforward, but Hebrew/RTL styling may have compatibility issues to test

- **Legal compliance details:** Research confirms Israel Privacy Protection Law Amendment 13 (Aug 2025) requires careful handling of personal data. Clear that we must NOT store phone/email/names. Unclear if storing property addresses counts as personal data (it's public info but tied to landlords). NEEDS lawyer review before Phase 1

## Sources

### Primary (HIGH confidence)
- **Context7 Libraries:**
  - /websites/react-leaflet_js - 331 code snippets, High reputation
  - /supabase/supabase-js - 639 code snippets, High reputation, v2.58.0
  - /tanstack/query - 1650 code snippets, High reputation, v5.60.5+
  - /cheeriojs/cheerio - 292 code snippets, Medium reputation

- **Official Documentation:**
  - [Supabase Realtime](https://supabase.com/docs/guides/realtime)
  - [React Leaflet v4.x docs](https://react-leaflet.js.org/docs/v4/example-popup-marker)
  - [TanStack Query Latest](https://tanstack.com/query/latest)
  - [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
  - [GitHub Actions Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)

### Secondary (MEDIUM confidence)
- **Israeli Platforms:**
  - [Yad2 - Nefesh B'Nefesh](https://www.nbn.org.il/yad2/)
  - [OnMap Real Estate Listings](https://www.onmap.co.il/en)
  - [What Are The Best Online Platforms For Finding Apartments In Israel? - Semerenko Group](https://semerenkogroup.com/what-are-the-best-online-platforms-for-finding-apartments-in-israel/)

- **Market Data:**
  - [Exact Rents in Tel Aviv (2026) - Sands Of Wealth](https://sandsofwealth.com/blogs/news/tel-aviv-rents)
  - [Tel Aviv Real Estate Market Analysis (2026) - Sands Of Wealth](https://sandsofwealth.com/blogs/news/tel-aviv-real-estate-market)

- **Technical Guides:**
  - [CRA to Vite Migration](https://oneuptime.com/blog/post/2026-01-15-migrate-create-react-app-to-vite/view)
  - [Vite vs CRA 2026](https://www.mol-tech.us/blog/vite-vs-create-react-app-2026)
  - [How to Bypass Cloudflare When Web Scraping in 2025](https://scrapfly.io/blog/posts/how-to-bypass-cloudflare-anti-scraping)
  - [Real Estate Data Scraping: The 2026 Investor's Edge](https://use-apify.com/blog/real-estate-data-scraping-2026)

- **Legal & Compliance:**
  - [Data Protection Laws and Regulations Report 2025-2026 Israel](https://iclg.com/practice-areas/data-protection-laws-and-regulations/israel)
  - [Web Scraping Legal Issues: 2025 Enterprise Compliance Guide](https://groupbwt.com/blog/is-web-scraping-legal/)

### Tertiary (LOW confidence, needs validation)
- [Yad2 scraping examples](https://github.com/zahidadeel/yad2scrapper) - Multiple OSS projects exist, but code quality varies
- [Facebook Groups scraping](https://medium.com/@anadilkhalil786/how-to-scrape-facebook-posts-pages-groups-public-data-in-2026-568d58f214c0) - Auth strategies unclear
- [Israeli Address Transliteration](https://www.geopostcodes.com/blog/address-transliteration/) - General guidance, needs Israeli-specific testing

---
*Research completed: 2026-02-13*
*Ready for roadmap: yes*
