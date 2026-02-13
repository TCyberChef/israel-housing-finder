# Phase 1: Infrastructure Setup - Research

**Researched:** 2026-02-13
**Domain:** Modern React build tooling, static hosting, backend-as-a-service
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundation for a modern React application using Vite as the build tool, GitHub Pages for free static hosting, Supabase for backend services, and GitHub Actions for automated deployment. This is the current industry-standard stack for greenfield React projects in 2026.

Vite has become the de facto build tool for React, replacing Create React App due to 40x faster builds and superior developer experience. The react-ts template provides TypeScript support out of the box with minimal configuration. GitHub Pages offers free static hosting but requires specific configuration for SPAs, particularly around base paths and client-side routing fallback. Supabase provides a complete backend solution (PostgreSQL, Auth, Storage, Realtime) with a generous free tier suitable for development and small production apps.

The main complexity lies in correctly configuring the base path for GitHub Pages subdirectory deployment and handling SPA routing with the 404.html fallback technique.

**Primary recommendation:** Use `npm create vite@latest` with react-ts template, configure base path in vite.config.ts to match repository name, use official GitHub Actions workflow with separate build/deploy jobs, and copy index.html to 404.html in public folder for SPA routing support.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | 7.3.1+ | Build tool and dev server | Industry standard for React, 40x faster than CRA, official recommendation |
| react | 18.3+ | UI framework | Latest stable, required for all modern React features |
| typescript | 5.x | Type safety | Essential for maintainable React projects, built into vite templates |
| @vitejs/plugin-react | 5.1.4+ | Vite React integration | Official plugin, enables Fast Refresh, JSX/TSX support |
| @supabase/supabase-js | 2.x | Supabase client | Official SDK, fastest way to integrate Supabase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router-dom | 6.x | Client-side routing | When app has multiple pages/routes (likely needed) |
| @types/react | 18.x | React TypeScript types | Automatically included with react-ts template |
| @types/react-dom | 18.x | ReactDOM TypeScript types | Automatically included with react-ts template |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | Next.js | Next.js adds SSR/SSG complexity, overkill for static GitHub Pages |
| GitHub Pages | Vercel/Netlify | Commercial platforms offer more features but GitHub Pages is free, simple, integrated with repo |
| Supabase | Firebase | Firebase pricing less predictable, Supabase gives direct PostgreSQL access |
| GitHub Actions | Manual gh-pages package | GitHub Actions is more robust, handles permissions properly, scales better |

**Installation:**
```bash
# Create project
npm create vite@latest israel-housing-finder -- --template react-ts
cd israel-housing-finder

# Install Supabase client
npm install @supabase/supabase-js

# Install React Router (if needed)
npm install react-router-dom
```

## Architecture Patterns

### Recommended Project Structure
```
israel-housing-finder/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── public/
│   └── 404.html                # SPA fallback (copy of index.html)
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Page-level components (if using routing)
│   ├── lib/                    # Utilities, helpers, configs
│   │   └── supabase.ts         # Supabase client initialization
│   ├── App.tsx                 # Root component
│   └── main.tsx                # Entry point
├── .env.local                  # Local environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript base config
├── tsconfig.app.json           # TypeScript app-specific config
├── tsconfig.node.json          # TypeScript Node.js config
└── vite.config.ts              # Vite configuration
```

### Pattern 1: Vite Configuration for GitHub Pages
**What:** Configure base path to match repository structure on GitHub Pages
**When to use:** Always, when deploying to GitHub Pages project (not user/org page)
**Example:**
```typescript
// Source: https://vite.dev/guide/static-deploy
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/israel-housing-finder/', // Must match repository name
})
```

### Pattern 2: Supabase Client Initialization
**What:** Create singleton Supabase client using environment variables
**When to use:** Always, at app initialization
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Pattern 3: Environment Variables Configuration
**What:** Use VITE_ prefix for client-exposed variables, .env.local for secrets
**When to use:** Always, for any configuration values
**Example:**
```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

### Pattern 4: GitHub Actions Workflow (Two-Job Pattern)
**What:** Separate build and deploy jobs for artifact management
**When to use:** Always, for GitHub Pages deployment
**Example:**
```yaml
# Source: https://github.com/sitek94/vite-deploy-demo
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  build:
    name: Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4

      - name: Install dependencies
        uses: bahmutov/npm-install@v1

      - name: Build project
        run: npm run build

      - name: Upload production-ready build files
        uses: actions/upload-artifact@v4
        with:
          name: production-files
          path: ./dist

  deploy:
    name: Deploy
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: production-files
          path: ./dist

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Pattern 5: SPA Routing Fallback
**What:** Copy index.html to 404.html for client-side routing support
**When to use:** When using React Router or any client-side routing
**Example:**
```bash
# Place 404.html in public/ folder
# Vite automatically copies public/ contents to dist/ during build
cp public/index.html public/404.html
```

### Pattern 6: React Router with GitHub Pages
**What:** Configure basename to match Vite base path
**When to use:** When using React Router
**Example:**
```typescript
// Source: https://medium.com/@karinamisnik94/deploying-react-vite-with-routing-on-github-pages-68385676b788
// src/main.tsx
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/israel-housing-finder/">
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

Or use `import.meta.env.BASE_URL`:
```typescript
<BrowserRouter basename={import.meta.env.BASE_URL}>
```

### Anti-Patterns to Avoid
- **Hardcoding base path**: Use environment variables or import.meta.env.BASE_URL instead of hardcoding repository name
- **Forgetting to build before deploy**: GitHub Pages needs static files, not source code with .jsx references
- **Using anchor tags instead of Link components**: Causes page reload and 404 errors with client-side routing
- **Exposing service_role key to frontend**: Only use publishable/anon keys (VITE_ prefixed) in client code
- **Committing .env files**: Always gitignore .env, .env.local, .env.*.local

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Build tooling | Custom webpack config | Vite with react-ts template | Vite handles dev server, HMR, production bundling, TypeScript, all with zero config |
| GitHub Pages deployment | Custom deployment scripts | GitHub Actions with official actions | Handles permissions, artifacts, caching correctly; maintained by GitHub |
| Backend infrastructure | Custom Express server | Supabase free tier | Provides PostgreSQL, Auth, Storage, Realtime, API auto-generation, all managed |
| Environment variable loading | Custom .env parser | Vite's built-in import.meta.env | Type-safe, automatic, follows web standards |
| SPA routing on static host | Custom routing logic | 404.html fallback + React Router | Well-tested pattern, works reliably with GitHub Pages limitations |

**Key insight:** Infrastructure setup has well-established solutions in 2026. Custom tooling adds maintenance burden without benefit. Use official tools and follow documented patterns.

## Common Pitfalls

### Pitfall 1: Incorrect or Missing Base Path
**What goes wrong:** App deploys successfully but shows blank page or 404 errors for assets (CSS, JS). Browser console shows "Failed to load module script" or 404 for `/assets/index-xxx.js`.
**Why it happens:** GitHub Pages serves project repos at `username.github.io/repo-name/`, but Vite defaults to root path `/`. Assets reference `/assets/file.js` instead of `/repo-name/assets/file.js`.
**How to avoid:** Always set `base: '/repo-name/'` in vite.config.ts to match repository name exactly. Verify after first deploy by checking browser DevTools Network tab.
**Warning signs:** Blank page after deploy despite successful GitHub Actions workflow, 404 errors in browser console for asset files.

### Pitfall 2: Base Path and Router Basename Mismatch
**What goes wrong:** App loads but routing doesn't work. Clicking navigation links shows 404 page. Direct URL access to routes fails.
**Why it happens:** Vite's base path and React Router's basename must match exactly. If base is `/repo-name/` but basename is `/` or vice versa, routing breaks.
**How to avoid:** Use `basename={import.meta.env.BASE_URL}` in BrowserRouter to automatically sync with Vite's base config. Alternatively, ensure manual values match exactly.
**Warning signs:** Homepage loads but navigation fails, 404 on route changes, URL changes but component doesn't render.

### Pitfall 3: Missing 404.html for SPA Fallback
**What goes wrong:** Direct navigation to routes (e.g., `/about`) or page refresh shows GitHub's 404 page instead of app content.
**Why it happens:** GitHub Pages looks for `/about.html` or `/about/index.html`. When not found, shows 404. Without 404.html fallback, SPA never boots.
**How to avoid:** Create 404.html as copy of index.html in public/ folder. Vite copies public/ to dist/ during build. GitHub Pages serves 404.html for unknown routes, allowing SPA to boot and handle routing.
**Warning signs:** Homepage works but direct URL access to routes shows GitHub 404 page, page refresh on route shows 404.

### Pitfall 4: Insufficient GitHub Actions Permissions
**What goes wrong:** GitHub Actions workflow runs but fails at deployment step with permission error: "Resource not accessible by integration" or "pages: write permission required".
**Why it happens:** Default GITHUB_TOKEN lacks pages:write and id-token:write permissions needed for GitHub Pages deployment.
**How to avoid:** Two options: (1) Use peaceiris/actions-gh-pages@v4 which handles permissions automatically, or (2) Add explicit permissions to workflow file: `permissions: { pages: write, id-token: write }`.
**Warning signs:** Workflow succeeds through build step but fails on deploy, error message mentions permissions or tokens.

### Pitfall 5: Committing .env Files with Secrets
**What goes wrong:** Supabase keys, API tokens, or other secrets get committed to git and exposed publicly.
**Why it happens:** Forgetting to add .env to .gitignore before committing, or using .env instead of .env.local.
**How to avoid:** Create .gitignore before any commits with `.env`, `.env.local`, `.env.*.local`. Use .env.local for actual secrets. Only commit .env.example with placeholder values.
**Warning signs:** Git shows .env as modified/untracked, secrets visible in GitHub repository.

### Pitfall 6: Using Service Role Key in Frontend
**What goes wrong:** Security vulnerability - anyone can extract service role key from frontend bundle and bypass Row Level Security.
**Why it happens:** Confusion between anon/publishable key (safe for frontend) and service_role key (backend only).
**How to avoid:** Only use VITE_SUPABASE_PUBLISHABLE_KEY (or anon key) in frontend. Never expose service_role key to client. Verify .env.local contains correct key type (starts with `sb_publishable_` or `eyJhbGciOi...` for anon).
**Warning signs:** Supabase dashboard shows "anon key used in 0 requests" despite app working, security warnings in Supabase logs.

### Pitfall 7: Inactive Project Pausing on Free Tier
**What goes wrong:** App suddenly becomes unavailable, Supabase returns errors. No database connectivity.
**Why it happens:** Supabase free tier pauses projects after 7 days of inactivity (no API requests, auth events, or database queries).
**How to avoid:** For development, just unpause manually when needed. For production, upgrade to Pro ($25/month) for always-on guarantee, or implement keepalive ping (not recommended, violates spirit of free tier).
**Warning signs:** "Project is paused" error from Supabase client, 403/401 responses from API.

## Code Examples

Verified patterns from official sources:

### Complete vite.config.ts
```typescript
// Source: https://vite.dev/guide/static-deploy
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/israel-housing-finder/', // Match repository name exactly
})
```

### Complete .gitignore
```
# Source: https://github.com/vitejs/vite and community best practices
# Dependencies
node_modules/

# Build output
dist/

# Environment variables
.env
.env.local
.env.*.local

# Logs
*.log

# Vite cache
.vite/

# Editor directories
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
```

### TypeScript Configuration (tsconfig.app.json)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

### Supabase Integration Example
```typescript
// Source: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Usage in component:
// import { supabase } from './lib/supabase'
// const { data, error } = await supabase.from('table_name').select()
```

### Environment Variables Template
```bash
# .env.example (commit this)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# .env.local (DO NOT commit)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx_OR_eyJhbGciOi...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite | 2022-2023 | 40x faster builds, modern ESM-based dev server, active maintenance |
| Webpack configuration | Zero-config Vite | 2023+ | No build config needed for standard React apps |
| gh-pages npm package | GitHub Actions | 2023+ | Better CI/CD integration, proper permissions handling, artifact management |
| Firebase | Supabase | 2021+ | Direct PostgreSQL access, more predictable pricing, better DX for SQL |
| Anon key only | Publishable key (sb_publishable_*) | 2024+ | Improved security model, backward compatible with anon keys |
| Single tsconfig.json | Split configs (app/node/base) | Vite 5+ (2024) | Clearer separation of concerns, better IDE support |

**Deprecated/outdated:**
- **Create React App**: No longer maintained, replaced by Vite/Next.js/Remix
- **gh-pages package for deployment**: GitHub Actions is more robust and integrated
- **Manual webpack config for React**: Vite provides better defaults with zero config
- **HashRouter for GitHub Pages**: BrowserRouter + 404.html fallback is cleaner (no # in URLs)

## Open Questions

1. **Custom domain for GitHub Pages**
   - What we know: GitHub Pages supports custom domains, requires DNS configuration
   - What's unclear: Whether custom domain is needed for this project
   - Recommendation: Start with default `username.github.io/repo-name`, add custom domain later if needed (simple CNAME file in public/)

2. **Supabase project organization**
   - What we know: Free tier allows 2 projects total
   - What's unclear: Whether to use separate Supabase projects for dev/staging/prod or single project with different tables
   - Recommendation: Start with single project, use Row Level Security for isolation if needed. Free tier limitation makes multi-project setup impractical.

3. **Monitoring inactive project pausing**
   - What we know: Free tier projects pause after 7 days inactivity
   - What's unclear: Whether to implement keepalive or accept manual unpausing
   - Recommendation: Accept manual unpausing during development. If app goes to production, budget for Pro tier ($25/month) for reliability.

## Sources

### Primary (HIGH confidence)
- [Vite Official Guide](https://vite.dev/guide/) - Getting started, scaffolding, configuration
- [Vite Static Deploy Guide](https://vite.dev/guide/static-deploy) - GitHub Pages deployment patterns
- [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) - Official integration guide
- [Supabase Pricing](https://supabase.com/pricing) - Free tier limits and features
- [GitHub Actions Deploy Pages](https://github.com/actions/deploy-pages) - Official deployment action
- [sitek94/vite-deploy-demo](https://github.com/sitek94/vite-deploy-demo) - Complete working example with workflow

### Secondary (MEDIUM confidence)
- [Complete Guide to Setting Up React with TypeScript and Vite (2026)](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2) - Project structure and configuration
- [Deploy Vite React with React Router App to GitHub Pages](https://paulserban.eu/blog/post/deploy-vite-react-with-react-router-app-to-github-pages/) - Router basename configuration
- [Supabase Pricing 2026 Full Breakdown](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance) - Detailed free tier analysis
- [Handling Environment Variables in Vite with React and Supabase](https://medium.com/@focusgid/handling-environment-variables-in-vite-with-react-and-supabase-eaa4b3c9a0a4) - Security best practices

### Tertiary (LOW confidence)
- Community discussions about common deployment issues (verified against official docs)
- WebSearch results for pitfalls (cross-referenced with official documentation)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are industry standard with official documentation and active maintenance
- Architecture: HIGH - Patterns verified from official Vite, Supabase, GitHub docs and working examples
- Pitfalls: HIGH - Common issues well-documented across official sources and recent community discussions (2025-2026)

**Research date:** 2026-02-13
**Valid until:** 2026-03-15 (30 days - stack is stable, but Vite releases frequently)
