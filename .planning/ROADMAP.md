# Roadmap: Israel Housing Finder

## Overview

Build a free rental apartment aggregator for Israel by establishing the scraping infrastructure and data pipeline first, then layering on search, discovery, and user features. Start with Yad2 as the foundation, add deduplication and additional sources, polish the UX with real-time updates and favorites, then enhance matching quality with advanced geocoding.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Infrastructure Setup** - Project foundation and deployment pipeline (2026-02-13)
- [x] **Phase 2: Database & Core Schema** - Supabase database with listings tables and RLS (2026-02-13)
- [x] **Phase 3: Yad2 Scraper** - First data source with basic deduplication (2026-02-14)
- [x] **Phase 4: Frontend Foundation** - React app with map and bilingual UI (2026-02-14)
- [ ] **Phase 5: Search & Filters** - Core discovery with all filter criteria
- [ ] **Phase 6: Listing Details** - Full listing view with contact and source links
- [ ] **Phase 7: Additional Sources** - Homeless and Facebook scrapers
- [ ] **Phase 8: User Features** - Favorites and comparison tools
- [ ] **Phase 9: Advanced Deduplication** - Geocoding and photo-based matching
- [ ] **Phase 10: Polish & Production** - Real-time updates, performance, error handling

## Phase Details

### Phase 1: Infrastructure Setup
**Goal**: Project foundation is configured with modern tooling and deployment pipeline works end-to-end
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02
**Success Criteria** (what must be TRUE):
  1. React app builds successfully with Vite
  2. App deploys to GitHub Pages automatically on push to main
  3. Supabase project is created and connection works from frontend
  4. GitHub Actions workflow runs without errors
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md - Migrate to Vite + TypeScript build system
- [x] 01-02-PLAN.md - Setup Supabase client and GitHub Actions deployment
- [x] 01-03-PLAN.md - Verify deployment pipeline and Supabase connection

### Phase 2: Database & Core Schema
**Goal**: Database schema supports listings with deduplication, Hebrew text, and public read access
**Depends on**: Phase 1
**Requirements**: DATA-04, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):
  1. Listings table exists with all required fields (address, city, price, rooms, size, floor, photos, etc.)
  2. Dedupe hashes table exists with hash and listing_id columns
  3. RLS policies allow public read-only access and service_role write access
  4. Hebrew text stores and retrieves correctly without encoding corruption
  5. Source attribution field tracks which platform(s) found each listing
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md - Initialize Supabase migrations and create core schema
- [x] 02-02-PLAN.md - Deploy and verify schema with Hebrew text testing

### Phase 3: Yad2 Scraper
**Goal**: Listings from Yad2 appear in database with automatic updates and basic deduplication
**Depends on**: Phase 2
**Requirements**: DATA-01, DATA-05
**Success Criteria** (what must be TRUE):
  1. GitHub Actions workflow scrapes Yad2 rental listings every 6 hours
  2. New listings appear in database with complete data (address, price, rooms, photos)
  3. Duplicate listings (same address + rooms + size) are detected and not re-inserted
  4. Stale listings (not seen in 7 days) are marked inactive
  5. Scraper respects rate limits and avoids IP blocking
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md - Add scraper columns (is_active, last_seen) to listings table
- [x] 03-02-PLAN.md - Set up scraper infrastructure with Puppeteer and TypeScript
- [x] 03-03-PLAN.md - Build Yad2 scraper with stealth and HTML parsing
- [x] 03-04-PLAN.md - Integrate database operations and GitHub Actions workflow

### Phase 4: Frontend Foundation
**Goal**: Users can view listings on an interactive map in Hebrew or English
**Depends on**: Phase 2
**Requirements**: SRCH-02, SRCH-03, I18N-01, I18N-02, LIST-04
**Success Criteria** (what must be TRUE):
  1. User sees interactive map with rental listings as pins
  2. Map clusters nearby pins when zoomed out for performance
  3. UI displays in Hebrew with RTL layout by default
  4. User can switch to English language via toggle
  5. Map and listing cards are mobile-responsive
**Plans**: TBD

Plans:
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md - Install dependencies and configure i18n/RTL
- [x] 04-02-PLAN.md - Create city geocoding and data layer
- [x] 04-03-PLAN.md - Build map and listing UI components

### Phase 5: Search & Filters
**Goal**: Users can search and filter listings by all relevant criteria
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08, SRCH-09, SRCH-10, SRCH-11, SRCH-12, SRCH-13, SRCH-14
**Success Criteria** (what must be TRUE):
  1. User can search apartments by typing city or neighborhood name
  2. User can filter by price range (min/max)
  3. User can filter by number of rooms
  4. User can filter by apartment size (square meters)
  5. User can filter by floor number, entry date, furnished/unfurnished, pets, parking, elevator, and mamad
  6. User can sort results by price, date posted, or relevance
  7. Filters update map pins and listing results in real-time
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Listing Details
**Goal**: Users can view complete listing information and contact landlords
**Depends on**: Phase 5
**Requirements**: LIST-01, LIST-02, LIST-03
**Success Criteria** (what must be TRUE):
  1. User can click a listing to see full details (photos, description, price, rooms, size, floor)
  2. User can see contact information (phone, WhatsApp link)
  3. User can click through to original Yad2 post
  4. Detail view includes all listing attributes (entry date, furnished, pets, parking, etc.)
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Additional Sources
**Goal**: Listings from Homeless and Facebook groups appear alongside Yad2 with source attribution
**Depends on**: Phase 3
**Requirements**: DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. GitHub Actions scrapes Homeless rental listings every 6 hours
  2. Facebook group listings are aggregated (manual or automated)
  3. Multi-source deduplication works (same listing from Yad2 and Homeless shows once)
  4. UI shows "Found on: Yad2, Homeless" badges for cross-platform listings
  5. All scrapers run on free-tier infrastructure without exceeding limits
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

### Phase 8: User Features
**Goal**: Users can save favorite listings and compare them side-by-side
**Depends on**: Phase 6
**Requirements**: USER-01, USER-02
**Success Criteria** (what must be TRUE):
  1. User can save listings to favorites (stored in browser localStorage)
  2. Favorites persist across page refreshes
  3. User can view all saved favorites in dedicated page
  4. User can compare up to 4 saved listings side-by-side
  5. Comparison view shows key attributes in table format
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Advanced Deduplication
**Goal**: Deduplication accuracy improves with geocoding and photo similarity matching
**Depends on**: Phase 7
**Requirements**: DATA-04 (enhancement)
**Success Criteria** (what must be TRUE):
  1. Israeli addresses are geocoded to lat/lng coordinates using free-tier API
  2. Geocoding cache prevents duplicate API calls for same address
  3. Photo perceptual hashing detects duplicate listings with different addresses
  4. Deduplication shows confidence score (exact match vs. fuzzy match)
  5. User can toggle "show all instances" to see deduplicated listings separately
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Polish & Production
**Goal**: Application is production-ready with real-time updates, performance optimizations, and robust error handling
**Depends on**: Phase 8
**Requirements**: INFR-03 (constraint validation)
**Success Criteria** (what must be TRUE):
  1. New listings appear in UI automatically via Supabase Realtime subscriptions
  2. Map performance is optimized (lazy loading, marker clustering)
  3. Error states display helpful messages (no data, scraper down, network issues)
  4. Loading states show during data fetches
  5. Application is fully free to use with no paywalls or feature gating
  6. SEO meta tags are configured for discoverability
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure Setup | 3/3 | ✓ Complete | 2026-02-13 |
| 2. Database & Core Schema | 2/2 | ✓ Complete | 2026-02-13 |
| 3. Yad2 Scraper | 4/4 | ✓ Complete | 2026-02-14 |
| 4. Frontend Foundation | 3/3 | ✓ Complete | 2026-02-14 |
| 5. Search & Filters | 0/TBD | Not started | - |
| 6. Listing Details | 0/TBD | Not started | - |
| 7. Additional Sources | 0/TBD | Not started | - |
| 8. User Features | 0/TBD | Not started | - |
| 9. Advanced Deduplication | 0/TBD | Not started | - |
| 10. Polish & Production | 0/TBD | Not started | - |
