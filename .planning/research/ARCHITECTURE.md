# Architecture Research

**Domain:** Rental Apartment Aggregator
**Researched:** 2026-02-13
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (GitHub Pages)              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Map    │  │  Search  │  │  Filter  │  │  List    │        │
│  │   View   │  │   Bar    │  │  Panel   │  │  View    │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       └─────────────┴──────────────┴──────────────┘             │
│                          │                                       │
│                    Supabase-JS Client                            │
│                          │                                       │
├──────────────────────────┼───────────────────────────────────────┤
│                 BACKEND LAYER (Supabase)                         │
├──────────────────────────┼───────────────────────────────────────┤
│                          ↓                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Edge Functions (API Layer)              │       │
│  │  ┌──────────────┐  ┌──────────────┐                 │       │
│  │  │   Search     │  │  Dedupe      │                 │       │
│  │  │   Handler    │  │  Checker     │                 │       │
│  │  └──────────────┘  └──────────────┘                 │       │
│  └──────────────────────┬───────────────────────────────┘       │
│                         │                                        │
├─────────────────────────┼────────────────────────────────────────┤
│             DATA LAYER (PostgreSQL + RLS)                        │
├─────────────────────────┼────────────────────────────────────────┤
│                         ↓                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Listings │  │  Sources │  │ Dedupe   │  │  Scrape  │        │
│  │  Table   │  │  Table   │  │  Hashes  │  │   Logs   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│           SCRAPING LAYER (GitHub Actions)                        │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐        │
│  │        Scheduled Cron Workflow (every N hours)      │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │        │
│  │  │   Yad2   │  │ Homeless │  │   Other  │          │        │
│  │  │ Scraper  │  │ Scraper  │  │ Scrapers │          │        │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘          │        │
│  │       └─────────────┴──────────────┘                │        │
│  │                     │                                │        │
│  │           Push via Supabase Client                  │        │
│  │                     │                                │        │
│  │                     ↓                                │        │
│  │           Dedupe + Insert Listings                  │        │
│  └─────────────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **GitHub Actions Scrapers** | Extract raw listing data from rental sites (Yad2, Homeless, etc.) on schedule | Python scripts with BeautifulSoup4/Playwright, runs every 4-6 hours via cron |
| **Deduplication Engine** | Identify same property across sources using fingerprinting | Hash-based comparison (address + size + rooms), runs during scraper insert |
| **Supabase Database** | Store listings, scrape logs, source metadata with RLS | PostgreSQL with auto-generated REST API, 500MB free tier |
| **Edge Functions** | Optional API layer for complex queries/transformations | Deno-based serverless functions, 500K invocations/month free |
| **React Frontend** | Map visualization, search/filter UI, listing display | React with Leaflet for maps, hosted on GitHub Pages |
| **Supabase-JS Client** | Real-time subscriptions, CRUD operations, auth | NPM package, runs in browser, respects RLS policies |

## Recommended Project Structure

```
israel-housing-finder/
├── .github/
│   └── workflows/
│       ├── scrape-yad2.yml        # Scheduled scraper for Yad2
│       ├── scrape-homeless.yml     # Scheduled scraper for Homeless
│       └── deploy.yml              # Deploy frontend to GitHub Pages
├── scrapers/
│   ├── common/
│   │   ├── deduplication.py       # Hash generation, duplicate detection
│   │   ├── supabase_client.py     # Supabase insert/update helpers
│   │   └── schema.py              # Listing data structure
│   ├── yad2/
│   │   ├── scraper.py             # Yad2-specific extraction logic
│   │   └── selectors.py           # CSS/XPath selectors for Yad2
│   └── homeless/
│       ├── scraper.py             # Homeless-specific extraction logic
│       └── selectors.py           # CSS/XPath selectors for Homeless
├── supabase/
│   ├── migrations/                # Database schema versions
│   │   ├── 001_create_listings.sql
│   │   ├── 002_create_sources.sql
│   │   └── 003_create_dedupe_hashes.sql
│   ├── functions/                 # Edge Functions (optional)
│   │   └── advanced-search/       # Complex search if needed
│   └── seed.sql                   # Test data for development
├── src/
│   ├── components/
│   │   ├── Map/                   # Leaflet map with markers
│   │   │   ├── MapView.js
│   │   │   ├── ListingMarker.js
│   │   │   └── ClusterGroup.js
│   │   ├── Search/                # Search bar component
│   │   ├── Filters/               # Price, rooms, area filters
│   │   └── ListingCard/           # Individual listing display
│   ├── hooks/
│   │   ├── useListings.js         # Supabase query hook
│   │   └── useRealtime.js         # Real-time subscriptions
│   ├── config/
│   │   └── supabase.js            # Supabase client initialization
│   └── utils/
│       └── filters.js             # Client-side filter helpers
├── public/
│   └── index.html
└── package.json
```

### Structure Rationale

- **scrapers/**: Isolated from frontend; runs in GitHub Actions, not in browser. Each site gets own folder for maintainability since scraping logic breaks frequently.
- **supabase/**: Database schema, migrations, and optional edge functions. Keeps backend logic organized separately from frontend.
- **src/components/**: UI organized by feature (Map, Search, Filters). Each component encapsulates its own logic and styling.
- **src/hooks/**: Reusable Supabase query logic. Centralizes data fetching patterns, makes RLS enforcement consistent.

## Architectural Patterns

### Pattern 1: Hash-Based Deduplication

**What:** Generate stable fingerprints for listings to identify duplicates across sources

**When to use:** During scraper insert, before writing to database

**Trade-offs:**
- Pros: Fast lookups, works across sources, handles slight variations
- Cons: Requires stable address parsing, may miss genuine duplicates if addresses differ

**Example:**
```python
import hashlib

def generate_listing_hash(listing):
    """Generate stable hash from core attributes"""
    # Normalize address (remove whitespace, lowercase)
    normalized_address = listing['address'].strip().lower()
    # Combine stable attributes
    fingerprint = f"{normalized_address}|{listing['rooms']}|{listing['size_sqm']}"
    return hashlib.sha256(fingerprint.encode()).hexdigest()

def check_duplicate(supabase, listing_hash):
    """Check if listing hash already exists"""
    result = supabase.table('dedupe_hashes').select('listing_id').eq('hash', listing_hash).execute()
    return len(result.data) > 0
```

### Pattern 2: Scheduled Scraper with Atomic Writes

**What:** GitHub Actions workflow runs scrapers on cron, inserts listings atomically with deduplication

**When to use:** For all rental site scrapers running on schedule

**Trade-offs:**
- Pros: Free tier (public repos), simple orchestration, logs built-in
- Cons: 5-minute minimum interval, scheduled jobs can be delayed/dropped under load, no state between runs

**Example:**
```yaml
# .github/workflows/scrape-yad2.yml
name: Scrape Yad2 Listings
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Manual trigger
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install beautifulsoup4 requests supabase-py
      - name: Run scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: python scrapers/yad2/scraper.py
```

### Pattern 3: Client-Side Filtering with Server-Side Queries

**What:** Use Supabase queries for initial data fetch, React state for interactive filtering

**When to use:** Search/filter UI where users adjust criteria frequently

**Trade-offs:**
- Pros: Instant UI feedback, reduces API calls, works within free tier limits
- Cons: Large datasets may require pagination, client must re-filter on new data

**Example:**
```javascript
// src/hooks/useListings.js
import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

export function useListings(filters) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      let query = supabase
        .from('listings')
        .select('*')
        .eq('active', true);

      // Server-side filters (reduce data transfer)
      if (filters.minPrice) query = query.gte('price', filters.minPrice);
      if (filters.maxPrice) query = query.lte('price', filters.maxPrice);
      if (filters.city) query = query.eq('city', filters.city);

      const { data, error } = await query;
      if (!error) setListings(data);
      setLoading(false);
    }

    fetchListings();
  }, [filters.minPrice, filters.maxPrice, filters.city]);

  return { listings, loading };
}
```

### Pattern 4: pg_cron Scheduled Database Tasks

**What:** Use Supabase's pg_cron extension to schedule maintenance tasks (e.g., mark stale listings inactive)

**When to use:** Background jobs that operate on database data (cleanup, status updates)

**Trade-offs:**
- Pros: Runs inside database, no external scheduler needed, free tier supported
- Cons: Limited to SQL operations, harder to debug than application code

**Example:**
```sql
-- Mark listings inactive if not seen in last 7 days
SELECT cron.schedule(
  'mark-stale-listings-inactive',
  '0 2 * * *', -- Daily at 2 AM
  $$
  UPDATE listings
  SET active = false
  WHERE last_seen_at < NOW() - INTERVAL '7 days'
    AND active = true;
  $$
);
```

## Data Flow

### Scraping to Display Flow

```
[GitHub Actions Trigger]
    ↓
[Scraper extracts HTML] → [Parse into listing objects]
    ↓
[Generate hash for each listing]
    ↓
[Check dedupe_hashes table] ─┐
    │                         │
    ├─ Duplicate? ───────────→ Update last_seen_at
    │                         │
    └─ New? ─────────────────→ Insert listing + hash
                              ↓
                    [Database triggers RLS checks]
                              ↓
                    [Real-time subscription notifies frontend]
                              ↓
                    [React component updates map markers]
                              ↓
                    [User sees new listing on map]
```

### User Search Flow

```
[User adjusts filters]
    ↓
[React state updates] → [Triggers useListings hook]
    ↓
[Build Supabase query with filters]
    ↓
[Execute query (respects RLS)] ─→ [PostgreSQL executes WHERE clauses]
    ↓
[Return filtered results]
    ↓
[React re-renders map markers + list]
    ↓
[User clicks marker] → [Show listing detail card]
```

### Key Data Flows

1. **Scraping Pipeline:** GitHub Actions → Python scraper → Deduplication → Supabase insert → Real-time broadcast → Frontend update
2. **Search/Filter:** User input → React state → Supabase query (server-side filters) → Client-side refinement → UI render
3. **Real-time Updates:** Database change → pg_notify → Supabase Realtime → WebSocket → React subscription → Map marker added

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10K listings | Current architecture works perfectly. Single-region Supabase, no caching needed. Leaflet handles clustering. |
| 10K-100K listings | Add Supabase Edge Functions for complex aggregations. Implement marker clustering (react-leaflet-cluster). Consider pagination for list view. Still within free tier if scraping stays under 500K function invocations/month. |
| 100K+ listings | Need paid Supabase tier (database size exceeds 500MB). Add Redis/Upstash for caching popular queries. Move to serverless scrapers (Cloudflare Workers/Vercel) to avoid GitHub Actions job limits. Consider dedicated scraping service. |

### Scaling Priorities

1. **First bottleneck:** Database size (500MB free tier). Solution: Purge old inactive listings (>30 days), store only essential fields, compress images to URLs only.
2. **Second bottleneck:** Supabase Edge Functions invocations (500K/month free). Solution: Cache frequent queries client-side, batch scraper writes, use pg_cron for cleanup instead of functions.
3. **Third bottleneck:** GitHub Actions scraping reliability. Solution: Move to Cloudflare Workers cron triggers or Vercel cron jobs (both have generous free tiers).

## Anti-Patterns

### Anti-Pattern 1: Scraping in Edge Functions

**What people do:** Put scraper logic inside Supabase Edge Functions, invoke on user request or schedule via HTTP cron

**Why it's wrong:**
- Edge Functions have 15-second timeout (too short for scraping)
- Burns through 500K monthly invocations fast
- No retry logic or state management
- Harder to debug than GitHub Actions logs

**Do this instead:** Use GitHub Actions for scraping (free for public repos, better logging, longer timeouts), only use Edge Functions for API transformations if needed

### Anti-Pattern 2: Storing Full HTML in Database

**What people do:** Save entire scraped HTML page to database for "reference" or "re-parsing later"

**Why it's wrong:**
- Blows through 500MB database limit instantly
- Violates copyright (storing others' content)
- Slow queries, expensive backups
- Should parse and extract data immediately

**Do this instead:** Parse during scraping, store only structured data (price, address, rooms, URL to original). If need raw data for debugging, log to GitHub Actions artifacts (temporary).

### Anti-Pattern 3: Client-Side Deduplication

**What people do:** Fetch all listings, deduplicate in React component using JavaScript

**Why it's wrong:**
- Wastes bandwidth (downloads duplicates)
- Slow for users (processing in browser)
- Duplicates written to database unnecessarily
- Inconsistent results across users

**Do this instead:** Deduplicate during scraper insert (server-side), store dedupe hashes in database, only unique listings reach frontend

### Anti-Pattern 4: Using MapBox for Free-Tier Project

**What people do:** Choose MapBox GL JS because it's "modern" and has nice tutorials

**Why it's wrong:**
- MapBox free tier is 50K map loads/month (can exhaust quickly)
- Proprietary license since 2020 requires payment for commercial use
- Larger bundle size than Leaflet (212KB vs 30KB)
- Unnecessary complexity for simple marker maps

**Do this instead:** Use Leaflet (truly open-source, no usage limits, smaller bundle, excellent plugin ecosystem including react-leaflet-cluster for free marker clustering)

### Anti-Pattern 5: Over-Normalizing Database Schema

**What people do:** Create separate tables for every attribute (cities, neighborhoods, property_types, amenities) with foreign keys

**Why it's wrong:**
- Premature optimization for rental aggregator
- Requires complex joins (slow queries, burns Supabase read quota)
- Harder to change schema during rapid iteration
- Rental sites don't use consistent taxonomies anyway

**Do this instead:** Start with denormalized listings table (city as TEXT, amenities as JSONB array). Normalize only when you have real data showing consistent patterns. Use PostgreSQL's JSONB for flexible attributes.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Yad2** | HTTP scraping via BeautifulSoup4/Playwright in GitHub Actions | Selector-based extraction, requires user-agent rotation, may block IPs |
| **Homeless** | HTTP scraping via BeautifulSoup4/Playwright in GitHub Actions | Similar to Yad2, check robots.txt, respect rate limits |
| **Supabase** | Official supabase-js client (browser) and supabase-py (scrapers) | Auto-generated REST API + realtime WebSocket, RLS enforced automatically |
| **GitHub Pages** | Static hosting via gh-pages npm package or GitHub Actions | SPA requires 404.html redirect trick for client-side routing |
| **Leaflet** | react-leaflet wrapper components | Use CDN for Leaflet CSS, npm for JS, requires tile provider (OpenStreetMap free) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Scrapers ↔ Database** | Supabase REST API via supabase-py | Use service_role key in GitHub Actions secrets (bypasses RLS for writes) |
| **Frontend ↔ Database** | Supabase REST API + Realtime via supabase-js | Use anon key (public), RLS enforces read-only access for unauthenticated users |
| **Frontend ↔ Map** | React props/state to react-leaflet components | MapView receives listings array, renders markers, handles click events |
| **Database ↔ Scrapers (scheduled)** | pg_cron + pg_net extension calling Edge Functions (optional) | Only needed if want database to invoke external jobs, usually GitHub Actions cron sufficient |

## Free Tier Constraints & Architecture Implications

### Supabase Free Tier (as of 2026)
- **Database:** 500MB storage
  - **Implication:** Must purge old listings, store only URLs to images (not blobs), compress JSONB fields
- **Edge Functions:** 500K invocations/month
  - **Implication:** Use sparingly; prefer GitHub Actions for scraping, client-side filtering for search
- **Bandwidth:** 2GB egress/month
  - **Implication:** Paginate results, lazy-load images, use CDN for map tiles
- **Realtime:** 2 concurrent connections (free tier), 200 max per project
  - **Implication:** Sufficient for low-traffic MVP, upgrade if >200 simultaneous users
- **Projects pause after 1 week inactivity**
  - **Implication:** Keep-alive ping or accept cold starts

### GitHub Actions Free Tier
- **Public repos:** Unlimited minutes
  - **Implication:** Keep repo public, scraping is free
- **Private repos:** 2000 minutes/month
  - **Implication:** If repo goes private, optimize scraper runtime or upgrade
- **Scheduled jobs:** Can be delayed/dropped under load
  - **Implication:** Don't rely on exact timing; add timestamps to detect missed runs

### GitHub Pages Free Tier
- **Storage:** 1GB repo size, 1GB/month bandwidth (soft limit)
  - **Implication:** No hosting images on GitHub Pages; use Supabase storage or external CDN
- **Build time:** 10 minutes max
  - **Implication:** Keep frontend build fast; CRA builds should be <5 min

### Architecture Optimizations for Free Tiers

1. **Scraping Frequency:** Run scrapers every 6 hours instead of hourly (reduces writes, function calls)
2. **Data Retention:** Auto-delete listings inactive >30 days (via pg_cron) to stay under 500MB
3. **Image Handling:** Store only URLs, never blobs; use listing site's CDN
4. **Query Optimization:** Add indexes on (city, price, rooms), use RLS policies for read-only public access
5. **Edge Functions:** Only use if absolutely needed (complex geo queries, data transformations too heavy for client)

## Build Order & Dependencies

### Phase 1: Database Foundation (Build First)
**Why first:** Everything depends on schema; scrapers and frontend both need stable data structure

**Components:**
1. Create Supabase project
2. Design listings table schema (id, source, url, address, city, price, rooms, size_sqm, last_seen_at, active, created_at)
3. Create dedupe_hashes table (hash, listing_id, created_at)
4. Create sources table (id, name, base_url, last_scraped_at)
5. Add RLS policies (public read-only, service_role write)
6. Create indexes (city, price, rooms for filtering)

**Validation:** Can insert/query test data via Supabase dashboard

---

### Phase 2: Scraping Pipeline (Build Second)
**Why second:** Need database schema from Phase 1; frontend can wait for real data

**Components:**
1. Common deduplication module (hash generation)
2. Supabase client wrapper (insert with retry, update last_seen_at)
3. Yad2 scraper (extract listings, generate hashes, insert)
4. GitHub Actions workflow (scheduled cron, runs Yad2 scraper)
5. Add scrape_logs table (track runs, errors, counts)

**Validation:** Scraper runs successfully, listings appear in Supabase dashboard, duplicates not re-inserted

---

### Phase 3: Basic Frontend (Build Third)
**Why third:** Requires database + sample data from Phase 2; shows scraped listings

**Components:**
1. Supabase client setup in React
2. useListings hook (fetch listings from Supabase)
3. Simple list view (display listings as cards)
4. Basic filters (city dropdown, price range)
5. Deploy to GitHub Pages

**Validation:** Can see scraped listings in browser, filters work, deploys successfully

---

### Phase 4: Map Visualization (Build Fourth)
**Why fourth:** Requires working frontend from Phase 3; adds visual layer

**Components:**
1. Add Leaflet + react-leaflet dependencies
2. MapView component (renders map with OpenStreetMap tiles)
3. ListingMarker component (pins for each listing)
4. Clustering (react-leaflet-cluster for performance)
5. Map-list sync (click marker → highlight card)

**Validation:** Listings show as markers on map, clustering works, click events synchronized

---

### Phase 5: Additional Scrapers (Build Fifth)
**Why fifth:** Repeat Phase 2 pattern for new sources; independent of frontend

**Components:**
1. Homeless scraper (same structure as Yad2)
2. GitHub Actions workflow for Homeless
3. Update sources table with Homeless metadata

**Validation:** Multiple sources feeding into same listings table, deduplication across sources works

---

### Phase 6: Real-Time & Polish (Build Last)
**Why last:** Nice-to-have features; core functionality already works

**Components:**
1. Supabase Realtime subscription (new listings appear without refresh)
2. Loading states, error handling
3. Hebrew/English i18n
4. Responsive design improvements
5. SEO meta tags

**Validation:** New listings appear in real-time, UI polished, works on mobile

---

### Dependency Graph

```
Phase 1 (Database)
    ↓
    ├──→ Phase 2 (Scraping) ──→ Phase 5 (More Scrapers)
    │         ↓
    └──→ Phase 3 (Frontend) ──→ Phase 4 (Map) ──→ Phase 6 (Polish)
```

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Phase 4
**Parallel After Phase 3:** Phase 5 (scrapers) can be built while Phase 4 (map) is in progress

## Sources

### Rental Aggregator Architecture
- [Real Estate Data Scraping: The 2026 Investor's Edge](https://use-apify.com/blog/real-estate-data-scraping-2026)
- [Real Estate Aggregator on Apify](https://apify.com/tri_angle/real-estate-aggregator)
- [Web Scraping Rentals Website Using Beautiful Soup and Pandas](https://medium.com/swlh/web-scraping-rentals-website-using-beautiful-soup-and-pandas-99e255f27052)

### Serverless Scraping Architecture
- [Serverless Architecture for a Web Scraping Solution (AWS)](https://aws.amazon.com/blogs/architecture/serverless-architecture-for-a-web-scraping-solution/)
- [Create a serverless scraping architecture (Scaleway)](https://www.scaleway.com/en/docs/tutorials/create-serverless-scraping/)
- [Automated Serverless Web Scraping ETL Pipeline with GitHub Actions](https://medium.com/@pasan.eecs/automated-serverless-web-scraping-etl-pipeline-with-github-actions-25ffbbad6a10)

### Supabase Architecture & Free Tier
- [Supabase Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)
- [Supabase Pricing 2026: Complete Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)
- [About billing on Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase)
- [Semantic Text Deduplication (Supabase)](https://supabase.com/docs/guides/ai/quickstarts/text-deduplication)

### GitHub Pages + Supabase Integration
- [Building a Static Website with GitHub Pages, Cloudflare & Supabase](https://www.milangupta.io/blog/static-website-github-pages-cloudflare-supabase/)
- [Dynamic Jamstack with Stencil and Supabase](https://ionic.io/blog/dynamic-jamstack-with-stencil-and-supabase)

### GitHub Actions Scheduling & Limitations
- [How to Run Scheduled Cron Jobs in GitHub Workflows for Free](https://dylanbritz.dev/writing/scheduled-cron-jobs-github/)
- [GitHub Actions: Key Limitations and Essential Tips](https://medium.com/@alex.ivenin/understanding-and-overcoming-limitations-of-github-actions-52956e9e2823)
- [Web Scraping Automation: How to Run Scrapers on a Schedule](https://www.firecrawl.dev/blog/automated-web-scraping-free-2025)

### Deduplication Strategies
- [Deduplication at Scale](https://www.moderntreasury.com/journal/deduplication-at-scale)
- [How to Build Alert Deduplication Logic](https://oneuptime.com/blog/post/2026-01-30-alert-deduplication/view)
- [Document Deduplication with Locality Sensitive Hashing](https://mattilyra.github.io/2017/05/23/document-deduplication-with-lsh.html)

### React + Leaflet Architecture
- [React Leaflet Official Documentation](https://react-leaflet.js.org/)
- [A Leaflet Developer's Guide to High-Performance Map Visualizations in React](https://andrejgajdos.com/leaflet-developer-guide-to-high-performance-map-visualizations-in-react/)
- [Leaflet or Mapbox? Choosing the Right Tool for Interactive Maps](https://medium.com/visarsoft-blog/leaflet-or-mapbox-choosing-the-right-tool-for-interactive-maps-53dea7cc3c40)

### Rental Data Models
- [A Data Model for Listing Apartments and Other Rental Units](https://www.red-gate.com/blog/a-data-model-for-listing-apartments-and-other-rental-units)
- [How to Design a Relational Database for Property Rental Platforms](https://www.geeksforgeeks.org/sql/how-to-design-a-relational-database-for-property-rental-and-vacation-booking-platforms/)

---
*Architecture research for: Israeli Rental Apartment Aggregator*
*Researched: 2026-02-13*
