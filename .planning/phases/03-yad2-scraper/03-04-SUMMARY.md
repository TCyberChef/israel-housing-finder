---
phase: 03-yad2-scraper
plan: 04
subsystem: scraper
tags: [supabase, github-actions, cron, deduplication, upsert, jsonb]
dependency_graph:
  requires:
    - phase: 03-03
      provides: scrapeYad2 function with stealth browser and DOM extraction
    - phase: 03-02
      provides: Listing types, generateDedupeHash utility, structured logger
    - phase: 03-01
      provides: is_active and last_seen columns on listings table
    - phase: 02-01
      provides: listings and dedupe_hashes tables with sources JSONB schema
  provides:
    - Supabase client initialization with service_role key
    - Database upsert operations with dedupe_hashes table deduplication
    - Sources JSONB array conversion from flat scraper fields
    - Stale listing detection (7-day is_active marking)
    - Main scraper entry point orchestrating scrape, upsert, stale marking
    - npm run scrape command for local and CI execution
    - GitHub Actions workflow with 6-hour cron schedule
  affects: [04-frontend-listings, monitoring, future-scrapers]
tech_stack:
  added: []
  patterns: [supabase-service-role-client, dedupe-hash-lookup-before-upsert, sources-jsonb-array-conversion, cron-scheduled-github-actions]
key_files:
  created:
    - src/scrapers/db/client.ts
    - src/scrapers/db/operations.ts
    - .github/workflows/scrape-yad2.yml
  modified:
    - src/scrapers/index.ts
    - package.json
key_decisions:
  - "Supabase service_role key for write access, not anon key"
  - "Sequential per-listing upsert for error isolation over batch operations"
  - "Sources array rebuilt on each scrape rather than appended to preserve simplicity"
patterns_established:
  - "Database operations in src/scrapers/db/ with client.ts and operations.ts separation"
  - "Entry point orchestrates scrape -> upsert -> stale mark pipeline"
  - "GitHub Actions workflow with both cron schedule and workflow_dispatch"
metrics:
  duration_seconds: 126
  tasks_completed: 3
  files_created: 3
  files_modified: 2
  commits: 3
  completed_at: 2026-02-14T12:19:54Z
---

# Phase 03 Plan 04: Scraper Integration Summary

**Supabase database upsert with dedupe_hashes deduplication, sources JSONB conversion, stale listing detection, and GitHub Actions 6-hour cron workflow**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-14T12:17:48Z
- **Completed:** 2026-02-14T12:19:54Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Built Supabase client with service_role key validation and helpful error messages
- Implemented upsert pipeline: check dedupe_hashes for content_hash, update existing or insert new listing + hash row
- Converts flat source_platform/source_url fields to sources JSONB array format matching Phase 2 schema
- Stale listing detection marks is_active=false for listings not seen in 7+ days
- Created main entry point orchestrating scrape -> database upsert -> stale marking
- Added npm run scrape command and GitHub Actions workflow with 6-hour cron schedule

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database client and operations** - `ee9ad9b` (feat)
2. **Task 2: Create scraper entry point and npm script** - `a1c0d1e` (feat)
3. **Task 3: Create GitHub Actions scheduled workflow** - `f973f3d` (feat)

## Files Created/Modified

- `src/scrapers/db/client.ts` - Supabase client initialization with service_role key validation
- `src/scrapers/db/operations.ts` - upsertListings (dedupe_hashes lookup, insert/update) and markStaleListings
- `src/scrapers/index.ts` - Main entry point orchestrating scrape, upsert, stale marking pipeline
- `package.json` - Added "scrape" script using tsx
- `.github/workflows/scrape-yad2.yml` - Cron schedule (0 */6 * * *), manual trigger, Supabase secrets

## Decisions Made

- **Service_role key over anon key:** Write access needed for insert/update on listings and dedupe_hashes tables, which RLS restricts for anon role
- **Sequential per-listing upsert:** Each listing processed individually rather than batch to isolate errors; a single bad listing does not block others
- **Sources array rebuilt per scrape:** Rather than merging with existing sources array, each scrape replaces it; keeps logic simple and avoids complex JSONB merge operations

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before the scraper workflow can run successfully, two GitHub Secrets must be configured:

1. **SUPABASE_URL** - From Supabase Dashboard -> Project Settings -> API -> Project URL
2. **SUPABASE_SERVICE_KEY** - From Supabase Dashboard -> Project Settings -> API -> service_role secret (NOT anon key)

Add these at: GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

## Next Phase Readiness

- End-to-end scraper pipeline complete: Yad2 -> Supabase with deduplication
- Workflow will fail until GitHub Secrets are configured (documented above)
- HTML selectors (from 2024 research) may need updating when tested against live Yad2
- Phase 3 complete; ready for Phase 4 frontend listing display
- Future scrapers (Facebook, etc.) can follow the same db/operations.ts pattern

---
*Phase: 03-yad2-scraper*
*Completed: 2026-02-14*

## Self-Check: PASSED

Verified all claims:
- FOUND: src/scrapers/db/client.ts
- FOUND: src/scrapers/db/operations.ts
- FOUND: src/scrapers/index.ts
- FOUND: .github/workflows/scrape-yad2.yml
- FOUND: scrape script in package.json
- FOUND: cron schedule (0 */6 * * *)
- FOUND: workflow_dispatch trigger
- FOUND: SUPABASE_URL secret reference
- FOUND: SUPABASE_SERVICE_KEY secret reference
- FOUND: commit ee9ad9b
- FOUND: commit a1c0d1e
- FOUND: commit f973f3d
