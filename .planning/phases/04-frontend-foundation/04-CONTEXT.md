# Phase 4: Frontend Foundation - Context

**Gathered:** 2026-02-14
**Status:** Ready for planning

<domain>
## Phase Boundary

React app displays rental listings on an interactive map with bilingual Hebrew/English UI. Users can view listings as map pins and browse listing cards. Search, filtering, and listing detail views are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Map experience
- Leaflet + OpenStreetMap - free, no API key needed
- Initial view shows all of Israel, user zooms into areas of interest
- Clicking a pin shows a brief popup on the map AND highlights/scrolls to the matching listing card
- Pin clustering when zoomed out for performance

### Layout structure
- Desktop: map on the left (~60%), scrollable listing cards on the right
- Minimal header bar with app name and language toggle only - maximize content space
- Mobile layout and map/list proportions are Claude's discretion

### Listing cards
- Each card shows: small photo thumbnail, rent price, room count, square meters, address + city, floor, entry date
- Source badges skipped for now - only one source exists (Yad2), revisit in Phase 7
- Card visual style is Claude's discretion (clean, modern)

### Language & RTL
- Hebrew is the default language, with RTL layout
- English toggle available - only UI labels/buttons translate, listing data stays in Hebrew
- Auto-detect language from browser settings, with manual override saved to localStorage
- RTL/LTR handling approach is Claude's discretion for bilingual content

### Claude's Discretion
- Map pin style (price labels vs dots)
- Mobile layout pattern (toggle view vs bottom sheet)
- Map/list split proportions and whether resizable
- Card visual style (shadows, borders, spacing)
- RTL/LTR strategy for mixed Hebrew content in English mode
- Language toggle UI (button vs dropdown)

</decisions>

<specifics>
## Specific Ideas

No specific requirements - open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- Source badges on listing cards - revisit when multiple sources exist (Phase 7)

</deferred>

---

*Phase: 04-frontend-foundation*
*Context gathered: 2026-02-14*
