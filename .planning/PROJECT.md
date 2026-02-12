# Israel Housing Finder

## What This Is

A free rental apartment aggregator for Israel. It pulls listings from multiple Israeli real estate sources (Yad2, Homeless, Facebook groups, free APIs), deduplicates them, and presents them in a single searchable interface with map view, smart filters, and detailed listing pages. Hebrew-focused with English support.

## Core Value

Find real, current rental apartments across all of Israel from one place, for free - no matter which site the listing was originally posted on.

## Requirements

### Validated

(None yet - ship to validate)

### Active

- [ ] Aggregate rental listings from multiple Israeli sources (Yad2, Homeless, etc.)
- [ ] Deduplicate listings that appear on multiple platforms
- [ ] Search apartments by city or area name
- [ ] Interactive map showing available rentals with pins
- [ ] Filter by price range, number of rooms, area/neighborhood, size
- [ ] Show full listing details with photos and contact info
- [ ] Link back to original source post
- [ ] Save favorite listings for comparison
- [ ] Compare saved listings side by side
- [ ] Hebrew-first UI with English language support
- [ ] Real-time-ish data freshness (updates every few hours)
- [ ] Cover all of Israel from day one
- [ ] Fully free to use, no paywalls

### Out of Scope

- Sales listings (buy/sell) - rentals only for v1
- Native mobile app - web-first, responsive design instead
- User-posted listings - aggregation only, not a marketplace
- Premium/paid tiers - completely free
- Real-time chat with landlords - link to original post or show contact info

## Context

- Existing codebase is a React "Coming Soon" page deployed to GitHub Pages
- Supabase is already configured as a dependency (connection set up in `src/config/supabase.js`)
- Target audience includes olim (new immigrants) who may not know all the Israeli real estate sites
- Israeli rental market is fragmented across Yad2, Homeless, Facebook groups, and smaller sites
- Most listings are in Hebrew; English translations would be a major differentiator
- GitHub Pages is static-only; scraping/backend needs serverless (Vercel/Netlify functions, GitHub Actions, Supabase Edge Functions)

## Constraints

- **Cost**: Must be fully free - use free tiers only (Supabase free, Vercel/Netlify free, GitHub Actions free minutes)
- **Hosting**: Currently on GitHub Pages; backend via serverless functions on free tiers
- **Legal**: Scraping Israeli real estate sites - need to be respectful (rate limiting, caching, no hammering)
- **Data freshness**: Target updates every few hours, not true real-time
- **Language**: Hebrew is primary UI language; English as secondary

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Rentals only (no sales) | Focused scope, most common need for target users | - Pending |
| Free serverless architecture | No budget, leverage free tiers | - Pending |
| Hebrew-first bilingual | Primary audience is Hebrew speakers, but olim need English | - Pending |
| Aggregate + deduplicate model | Single source of truth across fragmented market | - Pending |
| All of Israel from start | Users search nationwide; limiting geography limits value | - Pending |

---
*Last updated: 2026-02-13 after initialization*
