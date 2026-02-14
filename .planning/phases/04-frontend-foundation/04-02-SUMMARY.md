---
phase: 04-frontend-foundation
plan: 02
subsystem: frontend-data-layer
tags: [data-layer, supabase, react-hooks, typescript, geocoding]
dependency_graph:
  requires:
    - phase: 02
      plan: 01
      reason: "Database schema with listings table"
    - phase: 03
      plan: 01
      reason: "is_active column for filtering"
    - phase: 01
      plan: 02
      reason: "Supabase client configuration"
  provides:
    - "City-level coordinate lookup for Israeli cities"
    - "TypeScript types matching database schema"
    - "React hook for fetching active listings"
  affects:
    - phase: 04
      plan: 03
      reason: "Map component will use coordinate-enriched listings"
tech_stack:
  added:
    - name: "Israeli cities coordinate lookup"
      type: "data"
      purpose: "Temporary city-level geocoding until Phase 9"
  patterns:
    - name: "React hooks pattern"
      context: "useListings for data fetching"
    - name: "Type enrichment"
      context: "Add latitude/longitude to database types"
key_files:
  created:
    - path: "src/lib/cities.ts"
      purpose: "35+ Israeli cities with OpenStreetMap coordinates"
      exports: ["CITY_COORDINATES", "getCityCoordinates"]
    - path: "src/types/listing.ts"
      purpose: "TypeScript interfaces matching database schema"
      exports: ["Listing", "Source", "ListingRow"]
    - path: "src/hooks/useListings.ts"
      purpose: "React hook for fetching and enriching listings"
      exports: ["useListings"]
  modified: []
decisions:
  - context: "Database has no lat/lng columns (deferred to Phase 9)"
    decision: "Use city-level coordinates from lookup table"
    rationale: "Sufficient for Phase 4 map browsing without external API calls"
    alternatives: ["Full geocoding API now (premature)", "No map display (defeats purpose)"]
  - context: "Listings in same city will have identical coordinates"
    decision: "Accept clustering until Phase 9 adds precise geocoding"
    rationale: "City-level accuracy acceptable for initial browsing"
    alternatives: ["Add jitter to coordinates (misleading)", "Skip map display (bad UX)"]
  - context: "Frontend needs to merge database types with enriched coordinates"
    decision: "Optional latitude/longitude fields on Listing interface"
    rationale: "Clean separation between database schema and frontend enrichment"
    alternatives: ["Separate type for enriched listings (redundant)", "Always require coordinates (impossible)"]
metrics:
  duration_minutes: 1.4
  tasks_completed: 3
  files_created: 3
  files_modified: 0
  commits: 3
  lines_added: 149
  completed_at: "2026-02-14T14:14:14Z"
---

# Phase 04 Plan 02: Listings Data Layer Summary

**One-liner:** React hook fetching active listings from Supabase with city-level coordinate enrichment using Israeli cities lookup table

## What Was Built

Created the data layer for fetching and displaying rental listings:

1. **City Coordinate Lookup (`src/lib/cities.ts`)**: 35+ Israeli cities with OpenStreetMap coordinates, providing temporary city-level geocoding until Phase 9 adds full address geocoding
2. **TypeScript Types (`src/types/listing.ts`)**: Listing interface matching Phase 2 database schema, with optional latitude/longitude fields for frontend enrichment
3. **Listings Hook (`src/hooks/useListings.ts`)**: React hook fetching active listings from Supabase and enriching with city coordinates for map display

## Implementation Details

### City Coordinates Lookup

Created `CITY_COORDINATES` lookup table with:
- **Major cities**: Tel Aviv, Jerusalem, Haifa, Rishon LeZion, Petah Tikva, Ashdod, Netanya, Beer Sheva, etc.
- **Peripheral cities**: Eilat, Tiberias, Tzfat, Acre, Kiryat Shmona, etc.
- **Fallback**: Israel center (31.5, 34.8) for unknown cities
- **Source**: OpenStreetMap city center coordinates

### TypeScript Types

**Listing Interface:**
- Matches Phase 2 database schema exactly
- Fields: id, address, city, price, rooms, size_sqm, floor, photos, sources, description, contact_info, created_at, updated_at
- Optional latitude/longitude for frontend-only enrichment

**Source Interface:**
- platform, listing_id, url, scraped_at
- Matches sources JSONB array structure

**ListingRow Type:**
- Raw database query result before coordinate enrichment
- Omits latitude/longitude fields

### useListings Hook

**Query pattern:**
```typescript
supabase
  .from('listings')
  .select('*')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

**Enrichment:**
- Maps city name to coordinates via `getCityCoordinates(row.city)`
- Adds latitude/longitude to each listing
- Returns { listings, loading, error } state

**Error handling:**
- Logs errors to console
- Sets error state for component handling
- Always sets loading to false

## Deviations from Plan

None - plan executed exactly as written.

## Files Changed

### Created Files

| File | Purpose | Lines | Exports |
|------|---------|-------|---------|
| `src/lib/cities.ts` | Israeli cities coordinate lookup | 55 | CITY_COORDINATES, getCityCoordinates |
| `src/types/listing.ts` | Listing TypeScript types | 37 | Listing, Source, ListingRow |
| `src/hooks/useListings.ts` | React hook for listings | 57 | useListings |

**Total:** 3 files created, 149 lines added

### Modified Files

None

## Verification Results

All verification criteria passed:

- [x] src/lib/cities.ts contains 35+ Israeli cities with coordinates
- [x] src/lib/cities.ts exports getCityCoordinates with fallback to Israel center
- [x] src/types/listing.ts interface matches Phase 2 database schema
- [x] src/types/listing.ts includes optional latitude/longitude fields
- [x] src/hooks/useListings.ts fetches active listings from Supabase
- [x] src/hooks/useListings.ts enriches listings with city coordinates
- [x] npm run build completes without TypeScript errors

## Key Integration Points

**Connects to:**
- `src/lib/supabase.ts`: Supabase client for database queries
- Phase 2 database schema: listings table with is_active filter
- Phase 3 scraper: Sources JSONB array structure

**Provides to:**
- Phase 04 Plan 03: Map component will consume coordinate-enriched listings
- Future components: Reusable useListings hook for listing data

## Technical Notes

### City-Level Geocoding Limitations

**Current behavior:**
- All listings in same city have identical coordinates
- Listings will cluster on map at city center
- Acceptable for Phase 4 browsing experience

**Future improvement (Phase 9):**
- Add precise address geocoding
- Migrate from city lookup to lat/lng database columns
- Update useListings to use database coordinates instead of enrichment

### Type Safety

TypeScript types provide:
- Compile-time validation of database schema
- IDE autocomplete for listing fields
- Type-safe coordinate enrichment

### Performance

**Query optimization:**
- Single query fetches all active listings
- Client-side coordinate enrichment (O(n) lookup)
- No external API calls

**Future considerations:**
- Add pagination for large listing counts
- Consider server-side coordinate enrichment
- Add real-time subscriptions for live updates

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| `a35ca7b` | feat | Create Israeli cities coordinate lookup table |
| `7620ff0` | feat | Create TypeScript types matching database schema |
| `9ad5c32` | feat | Create useListings React hook with coordinate enrichment |

## Self-Check

**Verifying created files exist:**
- [x] src/lib/cities.ts exists (55 lines)
- [x] src/types/listing.ts exists (37 lines)
- [x] src/hooks/useListings.ts exists (57 lines)

**Verifying commits exist:**
- [x] a35ca7b exists (city coordinates)
- [x] 7620ff0 exists (TypeScript types)
- [x] 9ad5c32 exists (useListings hook)

**Verifying TypeScript compilation:**
- [x] npm run build succeeds without errors
- [x] All imports resolve correctly
- [x] No type errors

## Self-Check: PASSED

All files created, all commits exist, TypeScript compilation succeeds.
