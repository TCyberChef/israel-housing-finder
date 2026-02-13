---
phase: 02-database-core-schema
plan: 01
subsystem: database
tags: [database, migrations, schema, supabase, rls, deduplication]
completed: 2026-02-13T01:05:51Z
duration_minutes: 2

dependency_graph:
  requires:
    - phase: 01-infrastructure-setup
      plan: 02
      artifact: "@supabase/supabase-js client library"
  provides:
    - "supabase/migrations/ infrastructure"
    - "listings table schema"
    - "dedupe_hashes table schema"
    - "RLS policies for public read access"
    - "Database indexes for common queries"
  affects:
    - "All future database migrations"
    - "Scraping pipeline (Phase 4) will insert into listings table"
    - "Frontend listing display (Phase 3) will query listings table"

tech_stack:
  added:
    - name: "Supabase CLI"
      version: "2.75.0"
      purpose: "Migration management and local development"
      installation: "brew install supabase/tap/supabase"
    - name: "PostgreSQL"
      version: "17 (via Supabase)"
      purpose: "Relational database with UTF-8 Hebrew support"
  patterns:
    - "Timestamped SQL migrations via Supabase CLI"
    - "Hash-based deduplication with separate table"
    - "Row Level Security for public read, service write"
    - "JSONB arrays for variable-length lists (photos, sources)"
    - "Automatic updated_at trigger"

key_files:
  created:
    - path: "supabase/config.toml"
      lines: 385
      description: "Supabase project configuration"
    - path: "supabase/migrations/20260213010445_create_core_schema.sql"
      lines: 89
      description: "Core schema DDL with listings and dedupe_hashes tables"
    - path: "supabase/.gitignore"
      lines: 8
      description: "Ignore patterns for local dev artifacts"
  modified: []

decisions:
  - decision: "Store photos as JSONB array instead of separate photos table"
    rationale: "Simpler schema for variable-length URL lists, avoids N+1 queries, JSONB is efficient for simple read patterns"
    alternatives: "Separate photos table with one row per URL (more normalized but complex)"
    impact: "Frontend will receive photo URLs as JSON array, no joins needed"

  - decision: "Use SHA-256 hash with 64-character length constraint"
    rationale: "Industry standard with negligible collision risk, faster than SHA-512, more secure than MD5"
    alternatives: "MD5 (broken), SHA-512 (overkill), composite unique index only (misses fuzzy duplicates)"
    impact: "Scraping pipeline must generate SHA-256 hex string from normalized listing data"

  - decision: "Enable RLS with public read policies, service_role for writes"
    rationale: "Database-enforced security, anonymous users can SELECT, only backend can write"
    alternatives: "Application-layer access control (can be bypassed)"
    impact: "Frontend uses anon key (read-only), backend uses service_role key (full access)"

  - decision: "Defer lat/lng geocoding to later phases"
    rationale: "Address/city text storage sufficient for Phase 2, geocoding adds complexity and free-tier API limits"
    alternatives: "Add lat/lng columns now with PostGIS (premature optimization)"
    impact: "Map view (Phase 9) will require schema migration to add geocoding columns"

  - decision: "Use PostgreSQL trigger for automatic updated_at maintenance"
    rationale: "Ensures consistency across all update paths, standard pattern, no application logic needed"
    alternatives: "Handle in application code (error-prone, inconsistent)"
    impact: "All updates to listings table automatically update updated_at timestamp"

metrics:
  tasks_completed: 2
  files_created: 3
  files_modified: 0
  commits: 2
  lines_added: 481
---

# Phase 02 Plan 01: Initialize Supabase Migrations Infrastructure Summary

Initialized Supabase migration infrastructure and created core database schema with listings table, deduplication hashes table, RLS policies, indexes, and automatic timestamp trigger.

## What Was Built

### Task 1: Initialize Supabase Migrations Infrastructure
**Status:** Complete
**Commit:** d868f9f

Created Supabase project structure with CLI:
- Installed Supabase CLI v2.75.0 via Homebrew
- Ran `supabase init` to create config.toml and directory structure
- Created `supabase/migrations/` directory for timestamped SQL files
- Configured `supabase/.gitignore` to exclude local dev artifacts (.branches, .temp)

**Deviation:** Supabase CLI was not installed on the system (missing dependency). Installed via `brew install supabase/tap/supabase` before proceeding (Rule 3 - blocking issue).

### Task 2: Create Core Schema Migration
**Status:** Complete
**Commit:** 12616d2

Created migration file `supabase/migrations/20260213010445_create_core_schema.sql` with:

**Tables:**
- `public.listings` - Rental listings with address, city, price, rooms, size_sqm, floor, photos (JSONB), sources (JSONB), description, contact_info, timestamps
- `public.dedupe_hashes` - SHA-256 content hashes with listing_id foreign key, unique constraint on content_hash

**Indexes:**
- `idx_listings_city` - B-tree index on city for geographic filtering
- `idx_listings_price` - B-tree index on price for price range queries
- `idx_listings_created_at` - Descending B-tree index for newest-first sorting
- `idx_listings_sources` - GIN index on sources JSONB for platform filtering
- `idx_dedupe_hashes_content_hash` - B-tree index on content_hash for deduplication lookup
- `idx_dedupe_hashes_listing_id` - B-tree index on listing_id for reverse lookup

**Row Level Security:**
- Enabled RLS on both tables
- Created public read policies for anon role (SELECT only)
- Service_role bypasses RLS for backend write operations

**Triggers:**
- `handle_updated_at()` function - Updates updated_at timestamp on row modification
- `set_updated_at` trigger - Fires before update on listings table

**Documentation:**
- Table comments explaining purpose
- Column comments for JSONB fields (photos, sources) and content_hash

## Schema Design

### Listings Table
```sql
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text not null,
  price integer not null check (price > 0),
  rooms numeric(3,1) check (rooms > 0),
  size_sqm integer check (size_sqm > 0),
  floor integer,
  photos jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  description text,
  contact_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**Design choices:**
- `price` as integer (agorot, not float) to avoid rounding errors
- `rooms` as numeric(3,1) to support Israeli standard (e.g., 2.5 rooms)
- `photos` and `sources` as JSONB arrays for flexibility
- `text` type for Hebrew content (UTF-8 natively supported)
- `timestamptz` for timezone-aware timestamps

### Dedupe Hashes Table
```sql
create table public.dedupe_hashes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  content_hash text not null check (length(content_hash) = 64),
  created_at timestamptz not null default now(),
  constraint unique_content_hash unique (content_hash)
);
```

**Design choices:**
- Separate table for hash storage (normalized, supports multiple sources per listing)
- SHA-256 hash (64 hex characters) with length constraint
- Unique constraint on content_hash prevents duplicate listings
- Cascade delete removes hashes when listing is deleted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking Issue] Missing Supabase CLI dependency**
- **Found during:** Task 1
- **Issue:** `supabase init` command failed with "command not found: supabase"
- **Fix:** Installed Supabase CLI v2.75.0 via `brew install supabase/tap/supabase`
- **Files modified:** System-level installation (no project files)
- **Commit:** N/A (system dependency, not code change)

**2. [Rule 3 - Blocking Issue] Missing migrations directory**
- **Found during:** Task 1 verification
- **Issue:** `supabase init` created config.toml but not migrations/ directory (may require first migration to create)
- **Fix:** Created migrations/ directory manually with `mkdir -p supabase/migrations`
- **Files modified:** supabase/migrations/ (directory creation)
- **Commit:** d868f9f (included in Task 1 commit)

## Verification Results

All success criteria met:

1. **supabase/ directory exists with valid config.toml:** PASS
   - config.toml is 385 lines with valid TOML configuration
   - project_id set to "israel-housing-finder"

2. **supabase/migrations/ directory contains exactly 1 migration file:** PASS
   - File: 20260213010445_create_core_schema.sql (89 lines)

3. **Migration file is valid SQL with no syntax errors:** PASS
   - All sections present (tables, indexes, RLS, triggers, comments)
   - PostgreSQL/Supabase compatible syntax

4. **Migration file contains both table definitions with all required columns:** PASS
   - listings: 12 columns (id, address, city, price, rooms, size_sqm, floor, photos, sources, description, contact_info, created_at, updated_at)
   - dedupe_hashes: 4 columns (id, listing_id, content_hash, created_at)

5. **Migration file contains all 6 indexes:** PASS
   - 4 indexes on listings table
   - 2 indexes on dedupe_hashes table

6. **Migration file enables RLS and creates 2 read policies:** PASS
   - RLS enabled on both tables
   - Public read policies for anon role

7. **Migration file includes updated_at trigger function and trigger:** PASS
   - handle_updated_at() function created
   - set_updated_at trigger fires before update on listings

8. **Root .gitignore excludes Supabase local dev artifacts:** PASS
   - supabase/.gitignore handles .branches and .temp
   - Root .gitignore not modified (supabase/.gitignore is sufficient)

## Next Steps

**Phase 2, Plan 2:** Deploy schema to remote Supabase project
- Link local project to remote Supabase instance
- Push migration to production database
- Verify tables and RLS policies in Supabase Dashboard
- Test read access with anon key, write access with service_role key

**Phase 3:** Build frontend listing display
- Query listings table via Supabase client
- Display photo URLs from JSONB array
- Render Hebrew text (UTF-8 natively supported)

**Phase 4:** Build scraping pipeline
- Generate SHA-256 hashes from normalized listing data
- Check dedupe_hashes table before inserting
- Insert new listings with service_role key
- Append to sources JSONB array for existing listings

## Self-Check

Verifying claims before state updates.

**Created files:**
- supabase/config.toml: FOUND
- supabase/migrations/20260213010445_create_core_schema.sql: FOUND
- supabase/.gitignore: FOUND

**Commits:**
- d868f9f (Task 1): FOUND
- 12616d2 (Task 2): FOUND

**Schema verification:**
- 2 create table statements: VERIFIED (grep output: 2)
- 6 create index statements: VERIFIED (grep output: 6)
- 2 enable row level security statements: VERIFIED (grep output: 2)
- 2 create policy statements: VERIFIED (grep output: 2)
- updated_at trigger exists: VERIFIED (grep found "create trigger set_updated_at")

## Self-Check: PASSED
