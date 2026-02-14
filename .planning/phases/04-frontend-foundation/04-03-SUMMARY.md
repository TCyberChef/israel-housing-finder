---
phase: 04-frontend-foundation
plan: 03
subsystem: ui
tags: [react, leaflet, react-leaflet, react-leaflet-cluster, i18next, typescript, rtl]

# Dependency graph
requires:
  - phase: 04-01
    provides: "i18next configuration with Hebrew/English, Leaflet icon fixes, city coordinate lookup"
  - phase: 04-02
    provides: "useListings hook, Listing TypeScript types with optional lat/lng"
provides:
  - "Interactive Leaflet map with OpenStreetMap tiles and clustered markers"
  - "Listing card and list components with i18n support"
  - "Responsive split layout (60/40 desktop, stacked mobile)"
  - "AppHeader with language toggle"
  - "RTL/LTR document direction switching"
  - "Marker-to-card synchronization with scroll and highlight"
affects: [05-city-filtering, 06-deployment, 07-facebook-scraper]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Leaflet CSS imported before React components to prevent blank map"
    - "MarkerClusterGroup for performance with many markers"
    - "scrollIntoView for marker-to-card sync"
    - "useRTL hook with document.documentElement.dir for RTL layout"
    - "CSS logical properties for RTL compatibility"
    - "60/40 split layout (map/list) on desktop, vertical stack on mobile"

key-files:
  created:
    - src/components/Map/LeafletMap.tsx
    - src/components/Map/ClusterMarkers.tsx
    - src/components/Listings/ListingCard.tsx
    - src/components/Listings/ListingList.tsx
    - src/components/Layout/AppHeader.tsx
    - src/components/Layout/SplitLayout.tsx
    - src/hooks/useRTL.ts
  modified:
    - src/main.tsx
    - src/App.tsx
    - src/App.css

key-decisions:
  - "Leaflet CSS imports before React in main.tsx to prevent blank gray map container"
  - "Israel center coordinates (31.5, 34.8) with zoom 7 to show entire country"
  - "Filter listings with valid coordinates before rendering markers"
  - "Popup shows brief summary (address, price, rooms, size) in Hebrew"
  - "Marker click opens popup AND scrolls to card with smooth behavior"
  - "Highlight timeout of 2 seconds after marker click"
  - "60/40 desktop split, 50vh map on mobile per CONTEXT.md and RESEARCH.md"
  - "CSS logical properties for RTL compatibility"

patterns-established:
  - "Leaflet map with Israel bounds and OpenStreetMap tiles"
  - "MarkerClusterGroup for clustering performance"
  - "Marker click handler that syncs with listing card scroll and highlight"
  - "useRTL hook pattern for document direction switching"
  - "Responsive split layout with mobile-first breakpoint at 768px"
  - "Listing card design with photo, price, specs, address, description"

# Metrics
duration: 9min
completed: 2026-02-14
---

# Phase 04 Plan 03: Map and Listing UI Summary

**Interactive Leaflet map with clustered markers, responsive listing cards, bilingual header with language toggle, and RTL/LTR layout switching**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-14T14:22:02Z
- **Completed:** 2026-02-14T14:31:47Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Leaflet map showing entire Israel with OpenStreetMap tiles
- Clustered markers with popups and card synchronization
- Listing cards with photos, i18n text, and highlight animation
- Responsive layout (60/40 desktop split, vertical mobile stack)
- AppHeader with bilingual language toggle
- RTL/LTR document direction switching on language change

## Task Commits

Each task was committed atomically:

1. **Task 1: Create map components with clustering** - `60abf57` (feat)
2. **Task 2: Create listing card and list components** - `efbea84` (feat)
3. **Task 3: Create layout components and wire everything together** - `71110e6` (feat)

## Files Created/Modified
- `src/main.tsx` - Added Leaflet and cluster CSS imports before React
- `src/components/Map/LeafletMap.tsx` - MapContainer with Israel center and OpenStreetMap tiles
- `src/components/Map/ClusterMarkers.tsx` - MarkerClusterGroup with marker-to-card sync
- `src/components/Listings/ListingCard.tsx` - Card with photo, price, specs, address, description, i18n
- `src/components/Listings/ListingList.tsx` - List container with loading/error/empty states
- `src/components/Layout/AppHeader.tsx` - Header with title and language toggle
- `src/components/Layout/SplitLayout.tsx` - Responsive map/list split layout
- `src/hooks/useRTL.ts` - RTL/LTR document direction switching hook
- `src/App.tsx` - Wired all components with useListings and useRTL hooks
- `src/App.css` - Complete responsive layout styles with RTL support

## Decisions Made
- **Leaflet CSS imports in main.tsx:** Per RESEARCH.md Pitfall 1, CSS must be imported before React components to prevent blank gray map container
- **Israel center (31.5, 34.8) zoom 7:** Shows entire country per CONTEXT.md specification
- **Filter valid coordinates:** City lookup may miss some cities, filter before rendering to prevent map errors
- **Marker click syncs with card:** Opens popup on map AND scrolls to card with smooth behavior and 2-second highlight
- **60/40 desktop split, 50vh mobile:** Per CONTEXT.md and RESEARCH.md responsive layout patterns
- **CSS logical properties for RTL:** Ensures proper layout direction for Hebrew text

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all components implemented as specified, build succeeded without TypeScript errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Map and listing UI complete, ready for city filtering (Phase 5)
- All components use i18n, RTL/LTR switching works correctly
- Build succeeds with chunk size warning (expected for Leaflet bundle)
- Ready for deployment configuration (Phase 6)

---
*Phase: 04-frontend-foundation*
*Completed: 2026-02-14*

## Self-Check: PASSED

All files and commits verified:
- ✓ src/components/Map/LeafletMap.tsx
- ✓ src/components/Map/ClusterMarkers.tsx
- ✓ src/components/Listings/ListingCard.tsx
- ✓ src/components/Listings/ListingList.tsx
- ✓ src/components/Layout/AppHeader.tsx
- ✓ src/components/Layout/SplitLayout.tsx
- ✓ src/hooks/useRTL.ts
- ✓ Commit 60abf57 (Task 1)
- ✓ Commit efbea84 (Task 2)
- ✓ Commit 71110e6 (Task 3)
- ✓ npm run build succeeded
