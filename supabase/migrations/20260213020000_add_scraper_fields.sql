-- Migration: add_scraper_fields
-- Created: 2026-02-13
-- Description: Add is_active and last_seen columns to listings table for scraper staleness tracking

-- Add scraper tracking columns
alter table public.listings
  add column is_active boolean not null default true,
  add column last_seen timestamptz not null default now();

-- Create indexes for scraper queries
create index idx_listings_last_seen on public.listings(last_seen desc);
create index idx_listings_is_active on public.listings(is_active) where is_active = true;

-- Add comments
comment on column public.listings.is_active is 'Listing active status; set to false when not seen for 7+ days';
comment on column public.listings.last_seen is 'Timestamp of most recent scrape seeing this listing';
