# Requirements: Israel Housing Finder

**Defined:** 2026-02-13
**Core Value:** Find real, current rental apartments across all of Israel from one place, for free - no matter which site the listing was originally posted on.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Search & Discovery

- [ ] **SRCH-01**: User can search apartments by city or neighborhood name
- [ ] **SRCH-02**: User can browse apartments on an interactive map with location pins
- [ ] **SRCH-03**: Map clusters nearby listings when zoomed out
- [ ] **SRCH-04**: User can filter by price range (min/max)
- [ ] **SRCH-05**: User can filter by number of rooms
- [ ] **SRCH-06**: User can filter by apartment size (square meters)
- [ ] **SRCH-07**: User can filter by floor number
- [ ] **SRCH-08**: User can filter by entry date (move-in availability)
- [ ] **SRCH-09**: User can filter by furnished/unfurnished
- [ ] **SRCH-10**: User can filter by pets allowed
- [ ] **SRCH-11**: User can filter by parking availability
- [ ] **SRCH-12**: User can filter by elevator
- [ ] **SRCH-13**: User can filter by mamad (safe room)
- [ ] **SRCH-14**: User can sort results by price, date posted, or relevance

### Data Aggregation

- [ ] **DATA-01**: System scrapes rental listings from Yad2
- [ ] **DATA-02**: System scrapes rental listings from Homeless
- [ ] **DATA-03**: System scrapes rental listings from Facebook groups
- [ ] **DATA-04**: System deduplicates listings that appear on multiple platforms
- [ ] **DATA-05**: System updates listings every few hours (real-time-ish freshness)
- [ ] **DATA-06**: System covers all of Israel (not limited to specific cities)
- [ ] **DATA-07**: Each listing shows which source(s) it was found on

### Listing Details

- [ ] **LIST-01**: User can view full listing details (photos, description, price, rooms, size, floor)
- [ ] **LIST-02**: User can see contact information for the listing
- [ ] **LIST-03**: User can click through to the original source post
- [ ] **LIST-04**: Listing detail view is mobile-responsive

### User Features

- [ ] **USER-01**: User can save favorite listings (stored in browser, no account needed)
- [ ] **USER-02**: User can compare saved listings side by side

### Localization

- [ ] **I18N-01**: UI is Hebrew-first with right-to-left layout
- [ ] **I18N-02**: User can switch to English language

### Infrastructure

- [ ] **INFR-01**: Frontend hosted on GitHub Pages (static)
- [ ] **INFR-02**: Backend uses only free-tier services (Supabase, GitHub Actions, serverless)
- [ ] **INFR-03**: Application is fully free to use with no paywalls

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### User Accounts

- **ACCT-01**: User can create account with email
- **ACCT-02**: User favorites sync across devices via account
- **ACCT-03**: User can create saved searches with filters
- **ACCT-04**: User receives email alerts when new listings match saved searches

### Advanced Features

- **ADVN-01**: Listing shows price history over time
- **ADVN-02**: Agent fee transparency indicator on listings
- **ADVN-03**: WhatsApp notifications for saved searches
- **ADVN-04**: Proximity search (near transit stops, schools)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Sales listings (buy/sell) | Rentals only - focused scope for v1 |
| Native mobile app | Web-first with responsive design instead |
| User-posted listings | Aggregation only, not a marketplace |
| Premium/paid tiers | Completely free, no paywalls ever |
| Real-time chat with landlords | Link to original post or show contact info |
| Chrome extension | Adds complexity without core value |
| ML-based spam detection | Too complex for v1, manual review if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRCH-01 | Phase 5 | Pending |
| SRCH-02 | Phase 4 | Pending |
| SRCH-03 | Phase 4 | Pending |
| SRCH-04 | Phase 5 | Pending |
| SRCH-05 | Phase 5 | Pending |
| SRCH-06 | Phase 5 | Pending |
| SRCH-07 | Phase 5 | Pending |
| SRCH-08 | Phase 5 | Pending |
| SRCH-09 | Phase 5 | Pending |
| SRCH-10 | Phase 5 | Pending |
| SRCH-11 | Phase 5 | Pending |
| SRCH-12 | Phase 5 | Pending |
| SRCH-13 | Phase 5 | Pending |
| SRCH-14 | Phase 5 | Pending |
| DATA-01 | Phase 3 | Pending |
| DATA-02 | Phase 7 | Pending |
| DATA-03 | Phase 7 | Pending |
| DATA-04 | Phase 2, Phase 9 | Pending |
| DATA-05 | Phase 3 | Pending |
| DATA-06 | Phase 2 | Pending |
| DATA-07 | Phase 2 | Pending |
| LIST-01 | Phase 6 | Pending |
| LIST-02 | Phase 6 | Pending |
| LIST-03 | Phase 6 | Pending |
| LIST-04 | Phase 4 | Pending |
| USER-01 | Phase 8 | Pending |
| USER-02 | Phase 8 | Pending |
| I18N-01 | Phase 4 | Pending |
| I18N-02 | Phase 4 | Pending |
| INFR-01 | Phase 1 | Pending |
| INFR-02 | Phase 1 | Pending |
| INFR-03 | Phase 10 | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

**Notes:**
- DATA-04 (deduplication) is addressed in Phase 2 (basic hash-based) and enhanced in Phase 9 (geocoding + photo similarity)
- INFR-03 (fully free) is validated in Phase 10 but enforced throughout via free-tier constraints

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after roadmap creation*
