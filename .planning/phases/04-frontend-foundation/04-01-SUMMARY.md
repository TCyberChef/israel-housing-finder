---
phase: 04-frontend-foundation
plan: 01
subsystem: frontend-infrastructure
tags: [i18n, mapping, configuration, RTL]
requires: [vite, react, typescript]
provides: [i18next-config, leaflet-setup, hebrew-english-support]
affects: [src/main.tsx, src/i18n/*, src/lib/*]
tech-stack:
  added:
    - react-i18next@16.5.4
    - i18next@25.8.7
    - i18next-browser-languagedetector@8.2.1
    - react-leaflet@4.2.1
    - leaflet@1.9.4
    - react-leaflet-cluster@3.1.1
    - "@types/leaflet@1.9.21"
  patterns:
    - i18next with Hebrew default and RTL support
    - localStorage-based language persistence
    - Leaflet icon path fix for Vite bundler
key-files:
  created:
    - src/i18n/config.ts
    - src/i18n/locales/he/common.json
    - src/i18n/locales/en/common.json
    - src/lib/leaflet-icons.ts
  modified:
    - src/main.tsx
    - package.json
decisions:
  - "React-leaflet v4.2.1 instead of v5.x for React 18 compatibility"
  - "React-leaflet-cluster v3.1.1 instead of v4.x for React 18 compatibility"
  - "Hebrew as fallback language per project requirements"
  - "localStorage for language persistence with browser detection fallback"
metrics:
  duration: 165
  completed_date: "2026-02-14"
---

# Phase 04 Plan 01: I18n & Mapping Infrastructure Summary

**One-liner:** Installed react-i18next with Hebrew/English bilingual support, RTL layout foundation, and fixed Leaflet marker icons for Vite bundling.

## What Was Built

Established internationalization and mapping infrastructure for the frontend:

1. **Dependencies installed:**
   - i18n: react-i18next@16.5.4, i18next@25.8.7, i18next-browser-languagedetector@8.2.1
   - Mapping: react-leaflet@4.2.1, leaflet@1.9.4, react-leaflet-cluster@3.1.1
   - TypeScript: @types/leaflet@1.9.21

2. **i18next configuration:**
   - Hebrew default with English toggle
   - Browser language detection with localStorage persistence
   - Translation files for UI labels (header, map, listings)

3. **Leaflet icon fix:**
   - Explicit marker icon path configuration for Vite bundler
   - Prevents 404 errors on marker-icon.png with hashed filenames

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] React 18 compatibility for mapping libraries**
- **Found during:** Task 1 - dependency installation
- **Issue:** react-leaflet@5.0.0 and react-leaflet-cluster@4.0.0 require React 19, but project uses React 18.3.1
- **Fix:** Installed compatible versions: react-leaflet@4.2.1 and react-leaflet-cluster@3.1.1 (both support React 18)
- **Files modified:** package.json, package-lock.json
- **Commit:** 722d01c
- **Rationale:** Project cannot upgrade to React 19 at this stage without extensive testing. v4.2.1 is stable, well-tested, and provides the same core functionality.

## Implementation Details

**i18n Configuration (src/i18n/config.ts):**
- Uses i18next LanguageDetector plugin
- Detection order: localStorage → navigator (browser language)
- Fallback language: Hebrew (project requirement)
- Translation namespace: common (UI labels)

**Translation Structure:**
- header.title, header.languageToggle
- map.loading, map.noListings
- listing.price, listing.rooms, listing.sqm, listing.floor

**Leaflet Setup (src/lib/leaflet-icons.ts):**
- Deletes default _getIconUrl method (broken in bundlers)
- Explicitly sets iconUrl, iconRetinaUrl, shadowUrl
- Imports marker images from leaflet/dist/images/

**main.tsx imports (execution order):**
1. i18n config (before React)
2. Leaflet icons (before React)
3. React and ReactDOM

## Verification Results

- [x] All dependencies installed (verified via npm list)
- [x] i18n config exists with Hebrew default and localStorage persistence
- [x] Hebrew translation file contains UI labels
- [x] English translation file contains UI labels
- [x] Leaflet icon configuration exists with marker path fix
- [x] main.tsx imports i18n and leaflet-icons before React
- [x] TypeScript build succeeds (npm run build)

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Install i18n and mapping dependencies | 722d01c | package.json, package-lock.json |
| 2 | Configure i18next with Hebrew/English and RTL support | 05d87db | src/i18n/config.ts, src/i18n/locales/he/common.json, src/i18n/locales/en/common.json, src/main.tsx |
| 3 | Fix Leaflet marker icons for Vite bundler | bb35e14 | src/lib/leaflet-icons.ts, src/main.tsx |

## Next Steps

- **04-02-PLAN.md:** Component library setup (shadcn/ui, Tailwind utilities)
- **Future integration:** Use i18next hooks in React components (useTranslation)
- **Future integration:** Build map components using react-leaflet

## Self-Check: PASSED

**Created files verified:**
- FOUND: src/i18n/config.ts
- FOUND: src/i18n/locales/he/common.json
- FOUND: src/i18n/locales/en/common.json
- FOUND: src/lib/leaflet-icons.ts

**Commits verified:**
- FOUND: 722d01c (chore(04-01): install i18n and mapping dependencies)
- FOUND: 05d87db (feat(04-01): configure i18next with Hebrew/English and RTL support)
- FOUND: bb35e14 (chore(04-01): fix Leaflet marker icons for Vite bundler)

**Build verification:**
- npm run build: SUCCESS (no TypeScript errors)
