-- Migration: create_core_schema
-- Created: 2026-02-13
-- Description: Create listings and dedupe_hashes tables with RLS policies, indexes, and triggers

-- ==========================================
-- TABLES
-- ==========================================

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

create table public.dedupe_hashes (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  content_hash text not null check (length(content_hash) = 64),
  created_at timestamptz not null default now(),
  constraint unique_content_hash unique (content_hash)
);

-- ==========================================
-- INDEXES
-- ==========================================

create index idx_listings_city on public.listings(city);
create index idx_listings_price on public.listings(price);
create index idx_listings_created_at on public.listings(created_at desc);
create index idx_listings_sources on public.listings using gin(sources);

create index idx_dedupe_hashes_content_hash on public.dedupe_hashes(content_hash);
create index idx_dedupe_hashes_listing_id on public.dedupe_hashes(listing_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.listings enable row level security;
alter table public.dedupe_hashes enable row level security;

create policy "Public can read all listings"
  on public.listings
  for select
  to anon
  using (true);

create policy "Public can read dedupe hashes"
  on public.dedupe_hashes
  for select
  to anon
  using (true);

-- ==========================================
-- TRIGGERS
-- ==========================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.listings
  for each row
  execute function public.handle_updated_at();

-- ==========================================
-- COMMENTS (documentation)
-- ==========================================

comment on table public.listings is 'Rental listings aggregated from multiple platforms across Israel';
comment on column public.listings.sources is 'JSONB array of source objects with platform, url, and scraped_at timestamp';
comment on column public.listings.photos is 'JSONB array of photo URLs';
comment on table public.dedupe_hashes is 'SHA-256 content hashes for listing deduplication across platforms';
comment on column public.dedupe_hashes.content_hash is 'SHA-256 hash of normalized listing data (address, city, price, rooms, size, floor)';
