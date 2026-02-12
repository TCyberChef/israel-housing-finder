# Technology Stack

**Analysis Date:** 2026-02-13

## Languages

**Primary:**
- JavaScript (ES6+) - Application code across all components

**Secondary:**
- CSS - Component and global styling
- HTML - Public entry point template

## Runtime

**Environment:**
- Node.js v25.3.0 (local), v18 (CI/CD)

**Package Manager:**
- npm (default)
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 18.2.0 - Frontend UI framework
- ReactDOM 18.2.0 - DOM rendering

**Testing:**
- @testing-library/react 13.4.0 - React component testing
- @testing-library/jest-dom 5.17.0 - Jest DOM matchers
- @testing-library/user-event 13.5.0 - User interaction simulation
- Jest (via react-scripts) - Test runner

**Build/Dev:**
- react-scripts 5.0.1 - Create React App tooling (includes webpack, babel, eslint)
- gh-pages 6.1.1 - GitHub Pages deployment tool

## Key Dependencies

**Critical:**
- react-scripts 5.0.1 - Provides complete build toolchain, dev server, and configuration without ejecting

**Infrastructure:**
- web-vitals 2.1.4 - Performance monitoring

**External Services (Configured but not active):**
- @supabase/supabase-js - Supabase client (imported in `src/config/supabase.js` but not used in current implementation)

## Configuration

**Environment:**
- Environment variables configured via Create React App pattern (`REACT_APP_*` prefix)
- Required variables referenced: `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`
- `.env*` files in `.gitignore` (not committed)

**Build:**
- `package.json` - NPM package configuration, scripts, and browserslist targets
- ESLint config embedded in `package.json` (extends `react-app` and `react-app/jest`)
- Browserslist targets: >0.2% browsers for production, latest Chrome/Firefox/Safari for development

## Platform Requirements

**Development:**
- Node.js 18+ (18 specified in CI, 25.3.0 used locally)
- npm (any recent version)

**Production:**
- Static hosting (GitHub Pages)
- No server-side runtime required
- Build artifacts in `/build` directory

---

*Stack analysis: 2026-02-13*
