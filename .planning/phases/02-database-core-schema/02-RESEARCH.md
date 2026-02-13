# Phase 02: Database & Core Schema - Research

**Researched:** 2026-02-13
**Domain:** PostgreSQL database schema design with Supabase
**Confidence:** HIGH

## Summary

Phase 2 establishes the database foundation for the Israel Housing Finder application. The primary technical focus is creating a PostgreSQL schema via Supabase that handles rental listings with deduplication, Hebrew text storage, multi-source attribution, and public read access.

Supabase provides PostgreSQL with built-in UTF-8 support for Hebrew text, Row Level Security (RLS) for access control, and modern tooling via Supabase CLI for migration management. The recommended approach uses SQL migrations in version control, hash-based deduplication with a separate hash table, JSONB for flexible arrays (photo URLs, sources), and standard text types for Hebrew content.

Critical considerations: Hebrew text works natively in PostgreSQL text columns with UTF-8 encoding (no special configuration needed), RLS must be enabled on all public schema tables with explicit policies for anonymous read and service_role write, and deduplication should use SHA-256 content hashing stored in a dedicated table with indexed hash columns for performance.

**Primary recommendation:** Use Supabase CLI migrations for schema versioning, create listings and dedupe_hashes tables with appropriate RLS policies, store photo URLs in JSONB array, use text type for Hebrew fields, and implement hash-based deduplication with composite unique index on normalized address fields as backup constraint.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95.3 (installed) | Supabase client library | Official client, provides type-safe database access, handles authentication |
| Supabase CLI | Latest | Migration management, local development | Official tooling for schema versioning and database operations |
| PostgreSQL | 15+ (via Supabase) | Relational database | Supabase managed PostgreSQL, native UTF-8, JSONB support, RLS built-in |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | Phase uses native PostgreSQL features only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase CLI migrations | Supabase Dashboard SQL editor | Dashboard is fine for exploration, but CLI migrations provide version control, rollback capability, and deployment automation |
| JSONB for photo URLs | Separate photos table | Separate table offers better normalization but adds complexity; JSONB works well for variable-length arrays with simple read patterns |
| SHA-256 hash for deduplication | MD5 or composite unique index only | SHA-256 is industry standard with negligible collision risk; MD5 is cryptographically broken; composite index alone misses fuzzy duplicates |

**Installation:**
```bash
# Supabase CLI (if not installed)
npm install -g supabase

# Client library already installed in package.json
# @supabase/supabase-js: ^2.95.3
```

## Architecture Patterns

### Recommended Database Structure
```
supabase/
├── migrations/               # Timestamped SQL files
│   ├── YYYYMMDDHHMMSS_create_listings_table.sql
│   ├── YYYYMMDDHHMMSS_create_dedupe_hashes_table.sql
│   └── YYYYMMDDHHMMSS_enable_rls_policies.sql
└── config.toml              # Supabase project configuration
```

### Pattern 1: Hash-Based Deduplication Table
**What:** Separate table storing content hashes with foreign key to listings
**When to use:** When same listing appears on multiple platforms with slight variations in text/formatting
**Example:**
```sql
-- Source: PostgreSQL best practices + Supabase patterns
-- Listings table
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text not null,
  price integer not null,
  rooms numeric(3,1),
  size_sqm integer,
  floor integer,
  photos jsonb default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,  -- Array of source platforms
  description text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Dedupe hashes table
create table public.dedupe_hashes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade not null,
  content_hash text not null,  -- SHA-256 hash of normalized listing data
  created_at timestamptz default now() not null,
  constraint unique_hash unique (content_hash)
);

-- Index for fast hash lookups
create index idx_dedupe_hashes_content_hash on public.dedupe_hashes(content_hash);
create index idx_dedupe_hashes_listing_id on public.dedupe_hashes(listing_id);
```

### Pattern 2: Row Level Security for Public Read, Service Write
**What:** RLS policies allowing anonymous users to read all data, only service_role to write
**When to use:** Always - required for security on all public schema tables in Supabase
**Example:**
```sql
-- Source: https://supabase.com/docs/guides/database/postgres/row-level-security
-- Enable RLS on tables
alter table public.listings enable row level security;
alter table public.dedupe_hashes enable row level security;

-- Public read access (anonymous users can SELECT)
create policy "Public can read listings"
  on public.listings
  for select
  to anon
  using (true);

create policy "Public can read dedupe hashes"
  on public.dedupe_hashes
  for select
  to anon
  using (true);

-- Note: Service role bypasses RLS by default
-- No explicit write policies needed - service_role writes via backend only
-- Frontend uses anon key (read-only), backend uses service_role key (full access)
```

### Pattern 3: JSONB for Variable Arrays
**What:** Store photo URLs and source platforms as JSONB arrays
**When to use:** For variable-length lists that don't need complex relational queries
**Example:**
```sql
-- Source: https://www.postgresql.org/docs/current/datatype-json.html
-- JSONB storage for flexible arrays
photos jsonb default '[]'::jsonb,
sources jsonb not null default '[]'::jsonb,

-- Example data:
-- photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"]
-- sources: [{"platform": "yad2", "url": "https://yad2.co.il/...", "scraped_at": "2026-02-13T10:00:00Z"}]

-- Query example: Find listings from specific source
SELECT * FROM listings
WHERE sources @> '[{"platform": "yad2"}]'::jsonb;

-- GIN index for efficient JSONB queries
create index idx_listings_sources on public.listings using gin(sources);
```

### Pattern 4: Migration File Structure
**What:** Timestamped SQL migration files managed by Supabase CLI
**When to use:** Always - all schema changes should go through migrations for version control
**Example:**
```bash
# Source: https://supabase.com/docs/guides/deployment/database-migrations
# Create new migration
supabase migration new create_listings_table

# Creates: supabase/migrations/20260213120000_create_listings_table.sql
# Edit file with CREATE TABLE, indexes, RLS policies

# Apply locally
supabase migration up

# Push to remote
supabase db push
```

### Anti-Patterns to Avoid
- **Storing Hebrew text in bytea or varchar with encoding specification:** PostgreSQL text type handles UTF-8 natively, no special encoding needed
- **Using composite unique index alone for deduplication:** Misses fuzzy duplicates like "Tel Aviv" vs "Tel-Aviv" or slight price variations
- **Bypassing migrations and editing schema directly in Dashboard:** Breaks version control, deployment automation, and rollback capability
- **Storing each photo URL in separate table row:** Overkill for simple URL list, creates N+1 query problem, JSONB array is simpler
- **Not enabling RLS on public schema tables:** Critical security flaw in Supabase - all exposed tables MUST have RLS enabled
- **Creating policies for each CRUD operation when only SELECT needed:** Overcomplicates security model, anon role only needs SELECT policy

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Database migrations | Custom SQL scripts in /scripts folder | Supabase CLI migrations | Handles versioning, timestamps, rollback, tracks applied migrations, integrates with CI/CD |
| UTF-8 encoding for Hebrew | Custom encoding logic or bytea storage | PostgreSQL text type (default UTF-8) | PostgreSQL handles UTF-8 transparently, no manual encoding/decoding needed |
| Access control logic | Application-layer permission checks | Row Level Security (RLS) policies | Database-enforced security, works across all API access methods, prevents bypass |
| Deduplication hash generation | Custom string concatenation for comparison | SHA-256 content hash with normalized data | Industry standard, negligible collision risk, fast lookup with indexed hash column |
| Photo URL storage | Custom delimited string parsing (comma-separated) | JSONB array with GIN index | Native JSON support, efficient queries with containment operators, type safety |

**Key insight:** PostgreSQL + Supabase provides production-grade solutions for common problems (migrations, access control, JSON storage, text encoding). Using built-in features is more reliable, performant, and maintainable than custom implementations.

## Common Pitfalls

### Pitfall 1: Forgetting to Enable RLS on New Tables
**What goes wrong:** Tables in public schema without RLS are fully accessible to anonymous users for ALL operations (SELECT, INSERT, UPDATE, DELETE), even without policies
**Why it happens:** Supabase requires explicit `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` - it's not enabled by default
**How to avoid:** Make RLS enablement part of every table creation migration, create template that includes it
**Warning signs:** Supabase Dashboard shows "RLS disabled" warning, integration tests can write data with anon key

### Pitfall 2: Mixing Schema Changes Between Dashboard and Migrations
**What goes wrong:** Schema drift between local/remote environments, lost changes during deployments, inability to rollback
**Why it happens:** Dashboard SQL editor is convenient for quick tests, developers forget to capture changes in migration files
**How to avoid:** Use Dashboard for read-only queries only, all schema changes via `supabase migration new`, pull remote schema to migration if emergency changes made
**Warning signs:** `supabase db diff` shows unexpected differences, deployment fails with "table already exists" errors

### Pitfall 3: Not Indexing Columns Used in RLS Policies
**What goes wrong:** Severe performance degradation as table grows, queries perform full table scans to evaluate RLS policy
**Why it happens:** RLS policies reference columns (e.g., `auth.uid() = user_id`) but developers forget indexes are needed for performance
**How to avoid:** Add indexes on all columns referenced in RLS policy `USING` and `WITH CHECK` clauses
**Warning signs:** Slow queries even with proper application indexes, EXPLAIN shows sequential scan with RLS filter

### Pitfall 4: Using Wrong Data Types for Numbers
**What goes wrong:** Price stored as text requires casting for comparisons, or using float/real causes rounding errors for currency
**Why it happens:** Quick prototyping with text, or assuming float is fine for prices
**How to avoid:** Use integer for prices (store agorot/cents), numeric(precision,scale) for rooms (e.g., 2.5 rooms), integer for size/floor
**Warning signs:** Sorting by price gives wrong order ("9000" > "10000" as strings), currency calculations produce rounding errors

### Pitfall 5: JSONB Arrays Without Constraints
**What goes wrong:** Invalid data inserted (empty strings, malformed URLs, duplicate platforms), application errors on read
**Why it happens:** JSONB is flexible, developers skip validation assuming application will handle it
**How to avoid:** Add CHECK constraints on JSONB structure, validate in application before insert, use TypeScript types
**Warning signs:** Frontend crashes on malformed URLs, duplicate source entries, empty or null array items

### Pitfall 6: Composite Unique Index on Wrong Column Order
**What goes wrong:** Index not used for queries, duplicate detection fails, poor query performance
**Why it happens:** PostgreSQL B-tree indexes are left-to-right, only usable if query matches leftmost columns
**How to avoid:** Put most selective (unique) columns first, analyze query patterns before creating index
**Warning signs:** EXPLAIN shows sequential scan despite index existing, duplicate entries bypass unique constraint

## Code Examples

Verified patterns from official sources:

### Complete Table Creation with RLS
```sql
-- Source: Supabase documentation + PostgreSQL best practices
-- Create listings table
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

-- Create indexes for common queries
create index idx_listings_city on public.listings(city);
create index idx_listings_price on public.listings(price);
create index idx_listings_created_at on public.listings(created_at desc);
create index idx_listings_sources on public.listings using gin(sources);

-- Enable RLS
alter table public.listings enable row level security;

-- Create public read policy
create policy "Public can read all listings"
  on public.listings
  for select
  to anon
  using (true);

-- Add comments for documentation
comment on table public.listings is 'Rental listings aggregated from multiple platforms across Israel';
comment on column public.listings.sources is 'JSONB array of source objects with platform, url, and scraped_at timestamp';
comment on column public.listings.photos is 'JSONB array of photo URLs';
```

### Dedupe Hash Table with Constraints
```sql
-- Source: PostgreSQL deduplication best practices
create table public.dedupe_hashes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  content_hash text not null check (length(content_hash) = 64),  -- SHA-256 is always 64 hex chars
  created_at timestamptz not null default now(),
  constraint unique_content_hash unique (content_hash)
);

-- Indexes for deduplication lookup
create index idx_dedupe_hashes_content_hash on public.dedupe_hashes(content_hash);
create index idx_dedupe_hashes_listing_id on public.dedupe_hashes(listing_id);

-- Enable RLS
alter table public.dedupe_hashes enable row level security;

-- Public read policy
create policy "Public can read dedupe hashes"
  on public.dedupe_hashes
  for select
  to anon
  using (true);

-- Comment for documentation
comment on table public.dedupe_hashes is 'SHA-256 content hashes for listing deduplication across platforms';
comment on column public.dedupe_hashes.content_hash is 'SHA-256 hash of normalized listing data (address, city, price, rooms, size, floor)';
```

### Migration File Template
```sql
-- Migration: create_core_schema
-- Created: 2026-02-13
-- Description: Create listings and dedupe_hashes tables with RLS policies
-- Source: Supabase migration best practices

-- ==========================================
-- TABLES
-- ==========================================

create table public.listings (
  -- schema here
);

create table public.dedupe_hashes (
  -- schema here
);

-- ==========================================
-- INDEXES
-- ==========================================

create index idx_listings_city on public.listings(city);
-- additional indexes

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.listings enable row level security;
alter table public.dedupe_hashes enable row level security;

create policy "Public can read all listings"
  on public.listings for select to anon using (true);

create policy "Public can read dedupe hashes"
  on public.dedupe_hashes for select to anon using (true);

-- ==========================================
-- COMMENTS (documentation)
-- ==========================================

comment on table public.listings is 'Rental listings aggregated from multiple platforms across Israel';
-- additional comments
```

### Querying JSONB Sources
```sql
-- Source: https://www.postgresql.org/docs/current/datatype-json.html
-- Find listings from specific platform
SELECT id, address, city, price, sources
FROM public.listings
WHERE sources @> '[{"platform": "yad2"}]'::jsonb;

-- Find listings from multiple sources (true duplicates found across platforms)
SELECT id, address, city, price, jsonb_array_length(sources) as source_count
FROM public.listings
WHERE jsonb_array_length(sources) > 1
ORDER BY source_count DESC;

-- Extract all platform names from a listing
SELECT id, address, jsonb_agg(source->'platform') as platforms
FROM public.listings,
     jsonb_array_elements(sources) as source
GROUP BY id, address;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SQL scripts in /scripts | Supabase CLI migrations with timestamps | Supabase v1.0 (2020) | Version control, automatic tracking, rollback capability |
| Application-layer access control | Row Level Security (RLS) policies | PostgreSQL 9.5 (2016), Supabase default | Database-enforced security, cannot be bypassed |
| JSON text storage with manual parsing | JSONB with GIN indexes | PostgreSQL 9.4 (2014) | Native JSON support, efficient querying, binary format |
| MD5 for content hashing | SHA-256 or SHA-512 | ~2012 (MD5 cryptographically broken) | Collision resistance, security standard |
| Separate photos table with rows per URL | JSONB array for simple lists | PostgreSQL 9.4+ (JSONB support) | Simpler schema for variable-length lists, fewer joins |
| varchar(N) with encoding specification | text type (unlimited, UTF-8 default) | PostgreSQL 7.x (UTF-8 default) | No length limits, UTF-8 transparent, no encoding config |

**Deprecated/outdated:**
- **Manual migration tracking in changelog table:** Supabase CLI handles this automatically in `supabase_migrations` schema
- **JSON type (not JSONB):** Always use JSONB for binary format, indexing support, and better performance
- **Creating RLS policies with hardcoded role names without TO clause:** Modern pattern explicitly specifies role with `to anon` or `to authenticated`
- **Using service_role key in frontend:** Never expose service key to client, only use in secure backend/edge functions

## Open Questions

1. **Geocoding for map display:**
   - What we know: Address and city stored as text, free-tier Supabase (500MB limit)
   - What's unclear: Should we store lat/lng coordinates? If so, when/how to geocode? PostGIS extension available in Supabase but adds complexity
   - Recommendation: Defer to Phase 3+ (Map View). For Phase 2, store address/city as text only, add lat/lng columns later if needed. PostGIS point type vs separate lat/lng numeric columns TBD.

2. **Hebrew text collation for sorting:**
   - What we know: PostgreSQL text type handles UTF-8 Hebrew storage correctly
   - What's unclear: Does default collation sort Hebrew alphabetically correctly? Do we need `he_IL.UTF-8` locale?
   - Recommendation: Use default collation for now (sufficient for display), test sorting in Phase 3. Add explicit COLLATE clause if Hebrew alphabetical order needed.

3. **Photo URL validation:**
   - What we know: Storing URLs in JSONB array, could add CHECK constraint for validation
   - What's unclear: Should we validate URL format at database level? Risk of blocking valid URLs with complex regex
   - Recommendation: Validate in application before insert (TypeScript), skip database CHECK constraint to avoid false positives. Add constraint later if data quality issues emerge.

4. **Source platform enumeration:**
   - What we know: Sources stored as JSONB array with platform name
   - What's unclear: Should we create enum type for platform names? Separate platforms table?
   - Recommendation: Start with JSONB string values (flexible for new platforms), add enum or reference table in Phase 4+ if needed for constraints.

5. **Updated_at timestamp trigger:**
   - What we know: Need updated_at to track when listing was last modified
   - What's unclear: Should we create trigger function to auto-update, or handle in application?
   - Recommendation: Create PostgreSQL trigger for automatic updated_at maintenance (standard pattern), ensures consistency across all update paths.

## Sources

### Primary (HIGH confidence)
- Context7: /supabase/supabase - Table creation patterns, RLS policies, JSONB usage
- Context7: /supabase/cli - Migration management, CLI commands, workflow
- [PostgreSQL JSON Types Documentation](https://www.postgresql.org/docs/current/datatype-json.html) - JSONB vs separate tables, indexing, performance
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Service role behavior, policy patterns, best practices
- [Supabase Tables Documentation](https://supabase.com/docs/guides/database/tables) - Table creation, data types, UTF-8 handling

### Secondary (MEDIUM confidence)
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - Migration file naming, versioning, workflow best practices
- [PostgreSQL Unique Indexes](https://www.postgresql.org/docs/current/indexes-unique.html) - Composite indexes, null handling, deduplication
- [PostgreSQL B-tree Deduplication](https://www.cybertec-postgresql.com/en/b-tree-index-deduplication/) - Index deduplication feature, performance benefits
- [PostgreSQL Data Deduplication Methods](https://www.alibabacloud.com/blog/postgresql-data-deduplication-methods_596032) - Hash-based strategies, fingerprinting patterns
- [Supabase JSON Management](https://supabase.com/docs/guides/database/json) - JSONB recommendations, when to use vs structured tables

### Tertiary (LOW confidence - WebSearch only)
- [Schema.org RealEstateListing](https://schema.org/RealEstateListing) - Standard schema for real estate, could inform future structure
- [Deduplication at Scale](https://www.moderntreasury.com/journal/deduplication-at-scale) - Advanced deduplication strategies, multi-hash approaches (cuckoo hashing pattern)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Supabase tools already in use, PostgreSQL is Supabase foundation
- Architecture patterns: HIGH - Verified with official Supabase docs, Context7 examples, and PostgreSQL documentation
- Hebrew text handling: HIGH - PostgreSQL UTF-8 text type is standard, verified in official docs
- RLS patterns: HIGH - Directly from Supabase RLS documentation with official examples
- Deduplication strategy: MEDIUM - Hash-based approach is standard, but specific implementation (SHA-256, separate table) is recommendation based on best practices rather than official guidance
- JSONB usage: HIGH - Official PostgreSQL docs provide clear guidance on JSONB vs tables tradeoffs
- Migration workflow: HIGH - Supabase CLI is official tooling with documented patterns
- Pitfalls: MEDIUM - Based on common community issues and documentation warnings, not exhaustive list

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - Supabase and PostgreSQL are stable, slow-moving updates)
