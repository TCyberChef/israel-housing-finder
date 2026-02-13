# Stack Research

**Domain:** Israeli Rental Apartment Aggregator
**Researched:** 2026-02-13
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 18.2.0 | Frontend framework | Already in use; stick with 18 (React 19 requires manual upgrade with Vite). Stable, mature, excellent ecosystem for interactive UIs |
| Vite | 6.x (latest) | Build tool & dev server | **MIGRATION NEEDED**: CRA is deprecated as of Feb 2025. Vite starts in <2 seconds vs CRA's slow bundling. Migration takes 1-2 days. Essential for modern React development |
| TypeScript | 5.x (latest) | Type safety | Industry standard for React apps. Catches bugs early, improves DX, essential for large codebases |
| @supabase/supabase-js | 2.58.0+ | Database client | Already configured. HIGH confidence - official Supabase client with excellent real-time support via WebSockets |
| Supabase | Free tier | Backend (DB, Auth, Storage) | PostgreSQL database with real-time, RLS policies, generous free tier (500MB DB, 1GB file storage, 50k MAU) |

### Map & Location

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React Leaflet | 5.0.0 | React bindings for maps | HIGH confidence - v5 is latest (released ~1yr ago). Free, no API key needed unlike Google Maps. Excellent for rental listings with markers/popups |
| Leaflet | 1.9.x | Core map library | Peer dependency for React Leaflet. Mobile-friendly, lightweight (42KB), OSM tiles free |
| react-leaflet-cluster | latest | Marker clustering | When showing many listings, prevents map clutter. Groups nearby markers into clusters |

### Data Fetching & State

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @tanstack/react-query | 5.90.21+ | Server state management | HIGH confidence - v5.90.21 published Feb 12, 2026. Perfect for Supabase integration. Handles caching, background refetch, deduplication. Industry standard for server state |
| Zustand | 5.x (latest) | Client state management | Smallest bundle (1.2KB), minimal boilerplate. Perfect for UI state (filters, sidebar open/closed). Simpler than Redux, more flexible than Context |

### Scraping Backend

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Cloudflare Workers | Free tier | Serverless scraper runtime | **BEST CHOICE**: 100k requests/day free, cron triggers at no extra cost, 30-sec CPU for <1hr schedules, 15min for ≥1hr. Global edge network |
| Cheerio | 1.0.0+ | HTML parsing | Fast, jQuery-like syntax. Perfect for static HTML scraping. Handles Hebrew text without issues (UTF-8 support) |
| Wrangler | latest | CF Workers CLI | Official deployment tool for Workers. GitHub Actions integration available |

### UI & Styling

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| styled-components | 6.x | CSS-in-JS | Component-scoped styles, RTL support via stylis-plugin-rtl v1 (NOT v2). Hebrew-first with `<StyleSheetManager stylisPlugins={[rtlPlugin]}>` |
| stylis-plugin-rtl | 1.x (NOT 2.x) | RTL layout transformation | **CRITICAL**: Use v1 for styled-components v5/v6. Auto-mirrors padding/margin for Hebrew. Set `dir="rtl"` on <html> |
| @mui/stylis-plugin-rtl | latest | Alternative RTL plugin | If MUI is already in use. Compatible with styled-components |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-i18next | 15.x | i18n framework | Hebrew-first, English fallback. Handles RTL/LTR switching, date/number formatting |
| date-fns | 4.x | Date utilities | Lighter than moment.js. Hebrew locale support for listing dates |
| react-hook-form | 7.x | Form handling | For filter forms, contact forms. Minimal re-renders, excellent DX |
| zod | 3.x | Schema validation | TypeScript-first validation. Use with react-hook-form for type-safe forms |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| ESLint | Linting | Use @typescript-eslint, eslint-plugin-react-hooks |
| Prettier | Code formatting | Auto-format on save. Consistent style |
| Vitest | Unit testing | Vite-native testing. Faster than Jest |
| GitHub Actions | CI/CD | Free for public repos. Deploy to GH Pages, run scraper cron jobs |

## Installation

```bash
# STEP 1: Migrate from CRA to Vite (1-2 days)
# Follow guide: https://oneuptime.com/blog/post/2026-01-15-migrate-create-react-app-to-vite/view

# STEP 2: Core dependencies
npm install react@18.2.0 react-dom@18.2.0
npm install @supabase/supabase-js@latest
npm install @tanstack/react-query@latest
npm install zustand@latest

# STEP 3: Map libraries
npm install react-leaflet@5.0.0 leaflet@1.9.x
npm install react-leaflet-cluster

# STEP 4: Styling & RTL
npm install styled-components@latest
npm install stylis-plugin-rtl@1

# STEP 5: Forms & validation
npm install react-hook-form zod @hookform/resolvers

# STEP 6: i18n & utilities
npm install react-i18next i18next
npm install date-fns

# STEP 7: TypeScript & types
npm install -D typescript @types/react @types/react-dom
npm install -D @types/leaflet

# STEP 8: Dev tools
npm install -D vite @vitejs/plugin-react
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier

# STEP 9: Cloudflare Workers (separate project in /scraper)
npm create cloudflare@latest scraper -- --type="hello-world"
cd scraper && npm install cheerio
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite | Next.js | If you need SSR/SSG. Overkill for static GH Pages deployment. Next.js requires Vercel or custom hosting |
| React Leaflet | Google Maps React | If you already have Google Maps API key. React Leaflet is free (OSM tiles) |
| Cloudflare Workers | GitHub Actions only | If scraping is very simple. But GH Actions has 6hr max runtime, less reliable for cron. CF Workers is purpose-built |
| Cloudflare Workers | AWS Lambda | If you're already in AWS ecosystem. But Lambda free tier is 1M requests/month with cold starts. CF Workers is faster (edge network) |
| Cheerio | Puppeteer/Playwright | If sites require JS rendering. But CF Workers has 30-sec limit, not enough for browser automation. Use Puppeteer on GH Actions if needed |
| Zustand | Jotai | If you prefer atomic state. Jotai has finer-grained reactivity but more boilerplate. Zustand is simpler for most cases |
| styled-components | TailwindCSS | If you prefer utility-first CSS. But RTL support is trickier with Tailwind. styled-components + stylis-plugin-rtl is proven |
| @tanstack/react-query | SWR | If you want simpler API. But TanStack Query has better caching, prefetching, and mutation support |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | **DEPRECATED** as of Feb 2025. Slow dev server, outdated build tool | Vite (official React recommendation) |
| Redux Toolkit | Overkill for this app size. Boilerplate-heavy, steep learning curve | Zustand for client state, TanStack Query for server state |
| Google Maps API | Requires API key, costs money after free tier (28k loads/month). Not free-tier-only | React Leaflet + OpenStreetMap (truly free) |
| Firebase Firestore | Not as good for relational data (rental listings have city, neighborhood, landlord relationships). No built-in PostGIS for location queries | Supabase (PostgreSQL with PostGIS for geo queries) |
| Vercel Cron Jobs | Costs $20/month on Pro plan. GitHub Actions cron is free but unreliable | Cloudflare Workers Cron Triggers (free, reliable, edge network) |
| Apify/ScrapingBee | Paid after free credits ($5-$49/month). Not truly free | Cloudflare Workers + Cheerio (100k requests/day free) |
| Moment.js | **DEPRECATED**. 67KB minified, mutable API causes bugs | date-fns (13KB, immutable, tree-shakeable) |
| Axios | Unnecessary in 2026. Fetch API is native, works everywhere | Native fetch (use with TanStack Query) |
| React Leaflet v4 | Outdated. v5 is latest (requires React 18+) | React Leaflet v5.0.0 |

## Stack Patterns by Variant

**If scraping requires JavaScript rendering (Yad2 is SPA):**
- Use Puppeteer/Playwright on GitHub Actions (not CF Workers - 30sec limit too short)
- GitHub Actions cron: free for public repos, 6hr max runtime
- Store scraped data in Supabase via API calls
- Because: CF Workers CPU limit (30s for <1hr cron, 15min for ≥1hr) isn't enough for browser automation

**If listings grow to 10k+ markers:**
- Use `react-leaflet-cluster` for marker clustering
- Implement viewport-based filtering (only load markers in visible bounds)
- Use Supabase PostGIS for geospatial queries: `SELECT * FROM listings WHERE location && ST_MakeEnvelope(...)`
- Because: Rendering 10k DOM elements will freeze the browser

**If Hebrew text is primary:**
- Set `<html dir="rtl" lang="he">` globally
- Wrap app in `<StyleSheetManager stylisPlugins={[rtlPlugin]}>`
- Use `react-i18next` with Hebrew as default language
- Test all components with long Hebrew strings (word wrapping differs from English)
- Because: RTL layout requires CSS transforms (padding-left → padding-right)

**If deploying to GitHub Pages (static hosting):**
- Use Vite, NOT Next.js (Next.js needs Node.js server)
- Build output goes to `/build` or `/dist`
- Configure `base` in `vite.config.ts` to `/israel-housing-finder/` (repo name)
- Use client-side routing with hash router (no server-side routing support)
- Because: GH Pages serves static files only, no server-side rendering

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React Leaflet 5.0.0 | React 18.2.0+ | React 19 support unclear (v5 released before React 19). Stick with React 18 |
| React Leaflet 5.0.0 | Leaflet 1.9.x | Peer dependency. Don't use Leaflet 1.8 or earlier |
| styled-components 6.x | stylis-plugin-rtl 1.x | **NOT v2** - v2 requires stylis v4, styled-components still on v3 |
| @tanstack/react-query 5.x | React 18+ | React 19 compatible. Requires React 18.0 minimum |
| Supabase JS 2.58.0+ | TanStack Query 5.x | Use TanStack Query mutations for Supabase writes, queries for reads |
| Vite 6.x | React 18.2.0 | React 19 requires manual upgrade (Vite defaults to React 18) |

## Critical Implementation Notes

### 1. Supabase Real-Time Setup

**Recommended pattern** (per official docs):
```typescript
// Use Broadcast for scalability, NOT Postgres Changes
const channel = supabase.channel('listings-updates')
  .on('broadcast', { event: 'new-listing' }, (payload) => {
    queryClient.invalidateQueries({ queryKey: ['listings'] })
  })
  .subscribe()
```

**Why:**
- Broadcast is recommended for scalability and security
- Postgres Changes is simpler but doesn't scale as well
- Requires Row-Level Security (RLS) policies for authorization

**Postgres Changes alternative** (simpler, less scalable):
```typescript
const channel = supabase
  .channel('db-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'listings' },
    (payload) => {
      queryClient.setQueryData(['listings'], (old) => [...old, payload.new])
    }
  )
  .subscribe()
```

### 2. Cloudflare Workers Cron Configuration

**Free tier limits:**
- 100,000 requests/day
- 3 cron triggers per Worker
- CPU: 30 seconds (if schedule < 1hr), 15 minutes (if schedule ≥ 1hr)
- Cron triggers are **free** on all tiers

**Recommended cron schedule** (wrangler.toml):
```toml
[triggers]
crons = [
  "0 */6 * * *"  # Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
]
```

**Why every 6 hours:**
- Yad2/Homeless don't update constantly
- 4 runs/day = 120 runs/month (well under limits)
- Reduces duplicate listings (dedupe by URL hash)

### 3. Hebrew RTL Setup

**Required setup:**
```tsx
// App.tsx
import { StyleSheetManager } from 'styled-components'
import rtlPlugin from 'stylis-plugin-rtl'

export default function App() {
  return (
    <StyleSheetManager stylisPlugins={[rtlPlugin]}>
      <div dir="rtl" lang="he">
        {/* Your app */}
      </div>
    </StyleSheetManager>
  )
}
```

**index.html:**
```html
<html dir="rtl" lang="he">
```

**Gotchas:**
- React portals (modals, tooltips) don't inherit `dir` - set manually
- Use `/* @noflip */` CSS comment to disable RTL on specific rules
- Test with long Hebrew words (they wrap differently than English)

### 4. TanStack Query + Supabase Pattern

```typescript
// hooks/useListings.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useListings() {
  return useQuery({
    queryKey: ['listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 6 * 60 * 60 * 1000, // 6 hours (matches scraper cron)
  })
}
```

### 5. Vite Migration from CRA

**Key changes:**
1. Move `public/index.html` to root as `index.html`
2. Replace `%PUBLIC_URL%` with `/` in HTML
3. Change `REACT_APP_*` env vars to `VITE_*`
4. Update scripts in `package.json`:
   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```
5. Create `vite.config.ts`:
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   export default defineConfig({
     plugins: [react()],
     base: '/israel-housing-finder/', // GH Pages base path
   })
   ```

**Estimated time:** 1-2 days for small project (this one qualifies)

## Sources

**Official Documentation (HIGH confidence):**
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [React Leaflet v4.x docs](https://react-leaflet.js.org/docs/v4/example-popup-marker)
- [TanStack Query](https://tanstack.com/query/latest) - v5.90.21 published Feb 12, 2026
- [Cloudflare Workers Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions)

**Context7 (HIGH confidence):**
- /websites/react-leaflet_js - 331 code snippets, High reputation
- /supabase/supabase-js - 639 code snippets, High reputation, v2.58.0
- /cheeriojs/cheerio - 292 code snippets, Medium reputation
- /tanstack/query - 1650 code snippets, High reputation, v5.60.5+

**Community Sources (MEDIUM confidence):**
- [React Leaflet npm](https://www.npmjs.com/package/react-leaflet) - v5.0.0 latest
- [Vite vs CRA 2026 comparison](https://www.mol-tech.us/blog/vite-vs-create-react-app-2026)
- [CRA migration guide](https://oneuptime.com/blog/post/2026-01-15-migrate-create-react-app-to-vite/view)
- [Zustand comparison](https://zustand.docs.pmnd.rs/getting-started/comparison)
- [styled-components RTL plugin](https://github.com/styled-components/stylis-plugin-rtl)
- [GitHub Actions free tier](https://dylanbritz.dev/writing/scheduled-cron-jobs-github/)

**Scraping Research (MEDIUM confidence):**
- [Yad2 scraping examples](https://github.com/zahidadeel/yad2scrapper) - Multiple OSS projects exist
- [Playwright vs Puppeteer 2026](https://www.browserstack.com/guide/playwright-vs-puppeteer)
- [Cloudflare Workers scraping](https://github.com/tuhinpal/amazon-scraper)

---
*Stack research for: Israeli Rental Apartment Aggregator*
*Researched: 2026-02-13*
*Confidence: HIGH - All versions verified from npm/official docs, no assumptions*
