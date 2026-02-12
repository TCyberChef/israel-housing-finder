# External Integrations

**Analysis Date:** 2026-02-13

## APIs & External Services

**Database/Backend (Configured but not active):**
- Supabase - Planned backend-as-a-service
  - SDK/Client: `@supabase/supabase-js` (imported but not in `package.json` dependencies)
  - Auth: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
  - Configuration file: `src/config/supabase.js`
  - Status: Client created but not used in current implementation

## Data Storage

**Databases:**
- None currently active
- Supabase planned - PostgreSQL-based backend
  - Connection: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
  - Client: `@supabase/supabase-js`

**File Storage:**
- Local filesystem only (static assets in `public/`)
- No external storage integration

**Caching:**
- None

## Authentication & Identity

**Auth Provider:**
- None currently implemented
- Supabase Auth planned (via `@supabase/supabase-js`)

## Monitoring & Observability

**Error Tracking:**
- None

**Logs:**
- Browser console only
- No external logging service

**Analytics:**
- web-vitals 2.1.4 - Performance metrics (Core Web Vitals)
  - Client-side measurement only
  - No external analytics platform configured

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
  - URL: https://tcyberchef.github.io/israel-housing-finder/
  - Static site deployment

**CI Pipeline:**
- GitHub Actions
  - Workflow: `.github/workflows/deploy.yml`
  - Trigger: Push to `main` branch or manual dispatch
  - Actions used:
    - `actions/checkout@v3` - Repository checkout
    - `actions/setup-node@v3` - Node.js 18 setup
    - `peaceiris/actions-gh-pages@v3` - GitHub Pages deployment
  - Build artifacts published from `./build` directory

## Environment Configuration

**Required env vars:**
- `REACT_APP_SUPABASE_URL` - Supabase project URL (referenced but not required for current implementation)
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous API key (referenced but not required for current implementation)

**Secrets location:**
- Local development: `.env.local` (gitignored)
- GitHub Actions: Uses `GITHUB_TOKEN` (automatically provided by GitHub)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

---

*Integration audit: 2026-02-13*
