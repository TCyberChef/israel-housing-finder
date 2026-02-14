# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-13)

**Core value:** Find real, current rental apartments across all of Israel from one place, for free - no matter which site the listing was originally posted on.
**Current focus:** Phase 4 - Frontend Foundation

## Current Position

Phase: 4 of 10 (Frontend Foundation)
Plan: 3 of 3 in current phase - COMPLETE
Status: Phase complete
Last activity: 2026-02-14 - Completed 04-03-PLAN.md (Map and Listing UI)

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 10
- Average duration: 2.6 min
- Total execution time: 0.43 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-infrastructure-setup | 2 | 4 min | 2 min |
| 02-database-core-schema | 2 | 5 min | 2.5 min |
| 03-yad2-scraper | 4 | 7 min | 1.8 min |
| 04-frontend-foundation | 3 | 11 min | 3.7 min |

**Recent Trend:**
- Last 5 plans: 03-03 (2 min), 03-04 (2 min), 04-01 (1 min), 04-02 (1 min), 04-03 (9 min)
- Trend: Stable with UI complexity spike

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- **Vite over other build tools:** Industry standard for React, 40x faster builds than CRA (Plan 01-01)
- **TypeScript strict mode:** Catch type errors early, better IDE support (Plan 01-01)
- **GitHub Pages base path configured:** Set to `/israel-housing-finder/` in vite.config.ts (Plan 01-01)
- **Vite environment variables (import.meta.env):** Vite-specific pattern, type-safe, build-time validated (Plan 01-02)
- **Two-job deployment workflow:** Better separation of concerns, artifacts reusable, follows GitHub Actions best practices (Plan 01-02)
- **JSONB arrays for photos/sources:** Simpler schema than separate tables, efficient for variable-length lists (Plan 02-01)
- **SHA-256 hash for deduplication:** Industry standard with negligible collision risk, separate dedupe_hashes table (Plan 02-01)
- **RLS with public read, service write:** Database-enforced security, anon role read-only (Plan 02-01)
- **Defer lat/lng geocoding:** Address/city text sufficient for Phase 2, add geocoding in Phase 9 (Plan 02-01)
- **PostgreSQL trigger for updated_at:** Automatic timestamp maintenance, ensures consistency (Plan 02-01)
- **Hebrew text via Supabase SQL Editor:** Confirmed UTF-8 storage works correctly, no encoding corruption (Plan 02-02)
- **Multi-source JSONB with 2 platforms:** Validates cross-platform aggregation in sources array (Plan 02-02)
- **Separate tsconfig.scraper.json:** Node.js CommonJS context independent of Vite frontend config (Plan 03-02)
- **Pipe-delimited hash format:** address|rooms|size_sqm for deterministic deduplication matching DB schema (Plan 03-02)
- **Separate extractListingsFromDOM function:** Clean serialization boundary between Node.js and browser contexts for page.evaluate (Plan 03-03)
- **RawListing intermediate type:** Serializable DOM data mapped to Listing with platform-specific fields added post-extraction (Plan 03-03)
- **Supabase service_role key for write access:** Not anon key, needed for insert/update on RLS-protected tables (Plan 03-04)
- **Sequential per-listing upsert:** Error isolation over batch operations, single bad listing does not block others (Plan 03-04)
- **Sources array rebuilt per scrape:** Simpler than JSONB merge; each scrape replaces sources array (Plan 03-04)
- **React-leaflet v4.2.1 for React 18 compatibility:** v5.x requires React 19; v4.2.1 stable and provides same core functionality (Plan 04-01)
- **Hebrew as fallback language:** Project requirement for Israeli rental market (Plan 04-01)
- **localStorage for language persistence:** User language selection persists across page refresh with browser detection fallback (Plan 04-01)
- **City-level coordinates from lookup table:** Sufficient for Phase 4 map browsing without external API calls (Plan 04-02)
- **Optional latitude/longitude on Listing type:** Clean separation between database schema and frontend enrichment (Plan 04-02)
- **Leaflet CSS imports before React:** Prevents blank gray map container, must be imported in main.tsx before React components (Plan 04-03)
- **Israel center coordinates (31.5, 34.8) zoom 7:** Shows entire country on map load (Plan 04-03)
- **Filter valid coordinates before rendering:** City lookup may miss some cities, prevent map errors (Plan 04-03)
- **MarkerClusterGroup for performance:** Clusters markers for better performance with many listings (Plan 04-03)
- **Marker-to-card sync with scrollIntoView:** Marker click opens popup and scrolls to corresponding card with 2-second highlight (Plan 04-03)
- **60/40 desktop split, 50vh mobile:** Responsive layout per CONTEXT.md specifications (Plan 04-03)
- **CSS logical properties for RTL:** Ensures proper layout direction for Hebrew text (Plan 04-03)

### Pending Todos

None yet.

### Blockers/Concerns

**From Research:**
- Hebrew text encoding requires validation at every layer (HTTP, database, frontend)
- Israeli address geocoding needs free-tier testing with Mapbox/HERE APIs (Phase 9)
- Facebook scraping may require manual aggregation MVP due to auth complexity (Phase 7)
- Legal compliance for Israeli Privacy Protection Law needs validation before storing data (Phase 2)
- Supabase 500MB free tier requires aggressive deduplication from day one (Phase 2/3)

## Session Continuity

Last session: 2026-02-14 (plan execution)
Stopped at: Completed 04-03-PLAN.md (Map and Listing UI) - Phase 4 complete
Resume file: None
