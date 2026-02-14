# Phase 04: Frontend Foundation - Research

**Researched:** 2026-02-14
**Domain:** React mapping application with Leaflet, bilingual UI (Hebrew/English), RTL layout
**Confidence:** HIGH

## Summary

This phase builds an interactive map-based rental listing browser using Leaflet with React. The user has locked in key technical decisions: Leaflet + OpenStreetMap for the map (no API key needed), react-leaflet as the React binding, react-leaflet-cluster for pin clustering, and a bilingual Hebrew-first UI with RTL support.

The standard stack is well-established and mature. Leaflet is the industry-standard open-source mapping library (used by GitHub, Pinterest, Etsy), react-leaflet v5.x provides React bindings, and react-i18next is the de facto choice for React internationalization with RTL support. The main technical challenges are: proper CSS imports for Leaflet (a common beginner pitfall), marker icon path configuration in build tools, RTL/LTR layout switching without full page reloads, and coordinating map interactions with listing card UI.

**Primary recommendation:** Use react-leaflet v5 with react-leaflet-cluster for clustering, react-i18next with i18next-browser-languagedetector for bilingual UI, and CSS logical properties for RTL/LTR layouts. Critical setup: manually import all required CSS files and configure marker icon paths to avoid broken markers.

## User Constraints

### Locked Decisions (from CONTEXT.md)

**Map experience:**
- Leaflet + OpenStreetMap - free, no API key needed
- Initial view shows all of Israel, user zooms into areas of interest
- Clicking a pin shows a brief popup on the map AND highlights/scrolls to the matching listing card
- Pin clustering when zoomed out for performance

**Layout structure:**
- Desktop: map on the left (~60%), scrollable listing cards on the right
- Minimal header bar with app name and language toggle only - maximize content space
- Mobile layout and map/list proportions are Claude's discretion

**Listing cards:**
- Each card shows: small photo thumbnail, rent price, room count, square meters, address + city, floor, entry date
- Source badges skipped for now - only one source exists (Yad2), revisit in Phase 7
- Card visual style is Claude's discretion (clean, modern)

**Language & RTL:**
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

### Deferred Ideas (OUT OF SCOPE)

- Source badges on listing cards - revisit when multiple sources exist (Phase 7)

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-leaflet | 5.x | React bindings for Leaflet | Official React wrapper, 2.8M+ weekly downloads, maintained by Leaflet community |
| leaflet | 1.9.x | Interactive map library | Industry standard (40kb, used by GitHub/Pinterest/Etsy), no API key needed |
| react-leaflet-cluster | Latest | Marker clustering for react-leaflet | Modern wrapper for Leaflet.markercluster, supports React 19 + react-leaflet 5 |
| react-i18next | 15.x+ | React internationalization | De facto i18n standard for React (6M+ weekly downloads), built-in RTL support |
| i18next | 24.x+ | Core i18n framework | Powers react-i18next, flexible translation management |
| i18next-browser-languagedetector | Latest | Auto-detect user language | Standard plugin for browser language detection + localStorage persistence |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/leaflet | 1.9.x | TypeScript types for Leaflet | TypeScript projects (react-leaflet-cluster provides own types) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Leaflet + OpenStreetMap | Google Maps / Mapbox | Leaflet: free, no API key. Google/Mapbox: better imagery, paid/quota limits |
| react-i18next | react-intl (FormatJS) | react-i18next: more flexible, better RTL. react-intl: more opinionated, smaller API surface |

**Installation:**
```bash
npm install react-leaflet leaflet react-leaflet-cluster
npm install react-i18next i18next i18next-browser-languagedetector
npm install --save-dev @types/leaflet
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── Map/                 # Map-related components
│   │   ├── LeafletMap.tsx   # Main map container
│   │   ├── ClusterMarkers.tsx # Clustered markers
│   │   └── MapPopup.tsx     # Popup on marker click
│   ├── Listings/            # Listing display
│   │   ├── ListingCard.tsx  # Individual listing card
│   │   └── ListingList.tsx  # Scrollable list container
│   └── Layout/              # Layout components
│       ├── AppHeader.tsx    # Header with language toggle
│       └── SplitLayout.tsx  # Map/list split container
├── i18n/
│   ├── config.ts            # i18next configuration
│   └── locales/
│       ├── he/              # Hebrew translations
│       │   └── common.json
│       └── en/              # English translations
│           └── common.json
├── hooks/
│   ├── useListings.ts       # Fetch listings from Supabase
│   └── useMapSync.ts        # Sync map click to listing card scroll
├── lib/
│   └── supabase.ts          # Existing Supabase client
└── styles/
    ├── rtl.css              # RTL-specific overrides
    └── leaflet-custom.css   # Custom Leaflet styling
```

### Pattern 1: MapContainer Setup with Clustering

**What:** Configure react-leaflet MapContainer with clustering and proper CSS imports
**When to use:** Initial map setup

**Example:**
```typescript
// Source: https://react-leaflet.js.org/docs/start-setup/
// Required CSS imports - MUST be at top of file or in main entry
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';

import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

// Israel bounds: approximately 29-34°N, 34-37°E
const ISRAEL_CENTER: [number, number] = [31.5, 34.8];
const ISRAEL_ZOOM = 7;

function LeafletMap({ listings }: { listings: Listing[] }) {
  return (
    <MapContainer
      center={ISRAEL_CENTER}
      zoom={ISRAEL_ZOOM}
      style={{ height: '100%', width: '100%' }}
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      <MarkerClusterGroup>
        {listings.map(listing => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
          >
            <Popup>{listing.address}</Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

### Pattern 2: Fix Default Marker Icons

**What:** Explicitly configure Leaflet marker icon paths for Vite/Webpack builds
**When to use:** Always in bundled apps (Vite, Webpack, etc.)

**Example:**
```typescript
// Source: https://github.com/Leaflet/Leaflet/issues/4968
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default marker icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});
```

### Pattern 3: i18next Setup with RTL and localStorage

**What:** Configure i18next with browser detection, localStorage persistence, and RTL direction
**When to use:** Initial i18n setup

**Example:**
```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
// i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import heCommon from './locales/he/common.json';
import enCommon from './locales/en/common.json';

i18n
  .use(LanguageDetector) // Detects browser language
  .use(initReactI18next)
  .init({
    resources: {
      he: { common: heCommon },
      en: { common: enCommon },
    },
    fallbackLng: 'he', // Hebrew default
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'], // Check localStorage first
      caches: ['localStorage'], // Persist selection
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
```

### Pattern 4: RTL Layout Switching

**What:** Switch document direction (RTL/LTR) when language changes
**When to use:** Language toggle component or useEffect on language change

**Example:**
```typescript
// Source: https://leancode.co/blog/right-to-left-in-react
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function useRTL() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set document direction based on language
    const dir = i18n.dir(); // Returns 'rtl' for Hebrew, 'ltr' for English
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
}

// In App.tsx or root component
function App() {
  useRTL();
  return <div>...</div>;
}
```

### Pattern 5: Supabase React Hook for Listings

**What:** Fetch listings from Supabase with React state management
**When to use:** Loading listing data on mount

**Example:**
```typescript
// Source: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Listing {
  id: string;
  rent_price: number;
  room_count: number;
  square_meters: number;
  address: string;
  city: string;
  floor: number;
  entry_date: string;
  latitude: number;
  longitude: number;
  photos: string[];
}

export function useListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('status', 'active');

        if (error) throw error;
        setListings(data || []);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  return { listings, loading, error };
}
```

### Pattern 6: Programmatic Popup Open + Scroll to Card

**What:** Open map popup programmatically and scroll to corresponding listing card
**When to use:** When user clicks a marker

**Example:**
```typescript
// Source: https://maxschmitt.me/posts/react-leaflet-open-popup-programmatically
import { useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';

function ListingMarker({ listing, onMarkerClick }: Props) {
  const markerRef = useRef<LeafletMarker>(null);

  const handleClick = () => {
    // Open popup
    markerRef.current?.openPopup();

    // Scroll to corresponding card
    const cardElement = document.getElementById(`listing-${listing.id}`);
    cardElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight card briefly
    onMarkerClick(listing.id);
  };

  return (
    <Marker
      ref={markerRef}
      position={[listing.latitude, listing.longitude]}
      eventHandlers={{ click: handleClick }}
    >
      <Popup>{listing.address}</Popup>
    </Marker>
  );
}
```

### Anti-Patterns to Avoid

- **Relying on auto-detection for marker icons:** Bundle tools break default paths. Always explicitly configure icon URLs.
- **Not importing Leaflet CSS:** Map renders as blank gray box without `leaflet/dist/leaflet.css`.
- **Using physical CSS properties for RTL:** `margin-left` doesn't flip in RTL. Use logical properties (`margin-inline-start`) or CSS variables.
- **Rendering 10k+ markers without clustering:** Performance degrades rapidly. Always use MarkerClusterGroup for 100+ markers.
- **Missing map container dimensions:** Leaflet requires explicit `height` and `width`. Container with no height = invisible map.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Map marker clustering | Custom cluster algorithm based on viewport bounds | `react-leaflet-cluster` | Handles 10k-50k markers efficiently, animated zoom transitions, touch/drag events, spiderfying at max zoom |
| RTL layout detection | Manually flip all margins/paddings per language | CSS logical properties + `i18n.dir()` | Browser-native RTL, handles mixed directionality, reduces CSS duplication |
| Language detection + persistence | Custom browser locale parsing + localStorage logic | `i18next-browser-languagedetector` | Handles 10+ detection sources, fallback chain, persistence config, well-tested edge cases |
| Marker icon configuration | Dynamic imports or webpack loaders | Explicit import + `L.Icon.Default.mergeOptions()` | Works across all bundlers, predictable paths, TypeScript-safe |
| Map + list scroll sync | Manual scroll calculations + intersection observers | `scrollIntoView()` + marker refs | Native smooth scrolling, handles all container types, better accessibility |

**Key insight:** Leaflet's ecosystem has solved common mapping UI problems over 13+ years. Custom solutions miss edge cases like: touch device clustering, RTL text overflow in popups, marker z-index stacking, map resize on container changes. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Missing Leaflet CSS Imports

**What goes wrong:** Map renders as blank gray container, tiles don't display, markers invisible or broken.

**Why it happens:** Leaflet relies on its core CSS for layout, z-indexing, and default styles. Build tools don't auto-import it.

**How to avoid:**
```typescript
// ALWAYS at top of file that uses MapContainer, or in main.tsx
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
```

**Warning signs:** Gray box instead of map, console errors about missing styles, markers without icons.

### Pitfall 2: Broken Default Marker Icons

**What goes wrong:** Markers render as broken image icons (missing marker-icon.png 404 errors).

**Why it happens:** Leaflet auto-detects icon paths by looking for `marker-icon.png` in the DOM. Vite/Webpack bundle these as hashed assets, breaking detection.

**How to avoid:** Explicitly import and configure marker icons before rendering any maps (see Pattern 2 above).

**Warning signs:** Console 404 errors for `marker-icon-2x.png`, broken image icons on map.

### Pitfall 3: Map Container Without Dimensions

**What goes wrong:** Map is invisible, no height, can't interact with tiles.

**Why it happens:** Leaflet calculates tile rendering based on container size. CSS with no explicit height = 0px height.

**How to avoid:**
```css
.map-container {
  height: 100vh; /* or specific px/% */
  width: 100%;
}
```
Or inline style: `<MapContainer style={{ height: '600px', width: '100%' }}>`.

**Warning signs:** Map not visible, can't pan or zoom, inspector shows 0px height.

### Pitfall 4: RTL Layout Breaks with Physical CSS Properties

**What goes wrong:** Switching to RTL leaves margins/padding on wrong side, layout looks broken.

**Why it happens:** CSS properties like `margin-left`, `padding-right`, `text-align: left` don't flip direction. Only elements flip, not property names.

**How to avoid:** Use CSS logical properties:
- `margin-left` → `margin-inline-start`
- `padding-right` → `padding-inline-end`
- `left: 0` → `inset-inline-start: 0`
- `text-align: left` → `text-align: start`

**Warning signs:** Buttons stuck on wrong side in RTL, scrollbars on wrong edge, text alignment incorrect.

### Pitfall 5: localStorage Language Overwritten on Init

**What goes wrong:** User selects language, refreshes page, language resets to browser default instead of saved choice.

**Why it happens:** `i18next-browser-languagedetector` detection order wrong, or localStorage not in `caches` config.

**How to avoid:** Configure detection order with localStorage FIRST:
```typescript
detection: {
  order: ['localStorage', 'navigator'], // localStorage takes priority
  caches: ['localStorage'], // Persist to localStorage
}
```

**Warning signs:** Language doesn't persist across page reloads, manual selection gets overridden.

### Pitfall 6: Performance Degradation with Many Markers

**What goes wrong:** Map becomes sluggish, zoom/pan lag, browser freezes with 1000+ markers.

**Why it happens:** Rendering individual DOM elements for each marker is expensive. React-leaflet adds overhead vs native Leaflet.

**How to avoid:** ALWAYS wrap markers in `<MarkerClusterGroup>` when displaying 100+ listings. Consider filtering to show only markers in current viewport bounds for 10k+ listings.

**Warning signs:** Slow zoom animations, choppy panning, high CPU usage in browser.

### Pitfall 7: Missing OpenStreetMap Attribution

**What goes wrong:** Violation of OpenStreetMap's Open Database License, potential legal issues.

**Why it happens:** Developers hide or remove attribution to "clean up" UI.

**How to avoid:** NEVER remove attribution. Style it minimally but keep visible:
```typescript
<TileLayer
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
/>
```
Attribution must be readable, not hidden behind toggles or off-screen.

**Warning signs:** No attribution text visible on map, custom controls covering it.

## Code Examples

Verified patterns from official sources:

### Complete MapContainer with TypeScript

```typescript
// Source: https://react-leaflet.js.org/docs/start-setup/
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

interface Listing {
  id: string;
  latitude: number;
  longitude: number;
  address: string;
  rent_price: number;
}

interface MapProps {
  listings: Listing[];
  onMarkerClick: (listingId: string) => void;
}

export function ListingMap({ listings, onMarkerClick }: MapProps) {
  return (
    <MapContainer
      center={[31.5, 34.8]} // Israel center
      zoom={7}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup>
        {listings.map(listing => (
          <Marker
            key={listing.id}
            position={[listing.latitude, listing.longitude]}
            eventHandlers={{
              click: () => onMarkerClick(listing.id)
            }}
          >
            <Popup>
              <div>
                <p>{listing.address}</p>
                <p>₪{listing.rent_price}/month</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
```

### Language Toggle with RTL Switching

```typescript
// Source: https://react.i18next.com/latest/using-with-hooks
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function LanguageToggle() {
  const { i18n, t } = useTranslation('common');

  const toggleLanguage = () => {
    const newLang = i18n.language === 'he' ? 'en' : 'he';
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    // Update document direction when language changes
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <button onClick={toggleLanguage}>
      {i18n.language === 'he' ? 'English' : 'עברית'}
    </button>
  );
}
```

### Responsive Split Layout (Desktop/Mobile)

```css
/* Source: https://simplemaps.com/docs/responsive-map */
.app-container {
  display: flex;
  height: 100vh;
  direction: inherit; /* Inherits from <html dir="rtl|ltr"> */
}

.map-container {
  flex: 0 0 60%; /* 60% width on desktop */
  height: 100%;
}

.listings-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .app-container {
    flex-direction: column;
  }

  .map-container {
    flex: 0 0 50vh; /* 50% of viewport height */
  }

  .listings-container {
    flex: 1;
  }
}

/* RTL-specific adjustments using logical properties */
.listing-card {
  padding-inline-start: 1rem; /* Flips automatically in RTL */
  margin-inline-end: 0.5rem;
  text-align: start; /* left in LTR, right in RTL */
}
```

### Vite Environment Variables TypeScript Definition

```typescript
// Source: https://vite.dev/guide/env-and-mode
// src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-leaflet v3 | react-leaflet v5 | 2023 | Requires React 18+, better TypeScript support, breaking API changes |
| Manual clustering | react-leaflet-cluster | 2023 | Replaced react-leaflet-markercluster (deprecated), React 19 support |
| react-intl | react-i18next | N/A (preference) | react-i18next more popular for RTL-heavy apps, better flexibility |
| CSS-in-JS for RTL | CSS logical properties | 2020+ | Native browser support, no runtime overhead, cleaner code |
| Global CSS imports | CSS modules / scoped imports | Ongoing | Vite supports both, scoped imports prevent conflicts |

**Deprecated/outdated:**
- **react-leaflet-markercluster:** Use react-leaflet-cluster instead (supports react-leaflet v5)
- **Manually loading Leaflet from CDN:** Use npm packages for proper bundling and TypeScript support
- **Physical CSS properties for bidirectional layouts:** Use logical properties (margin-inline-start, etc.)

## Open Questions

1. **Optimal cluster radius for Israel map**
   - What we know: Default Leaflet.markercluster radius is 80px
   - What's unclear: Whether this works well for Israel's geography (small country, dense cities)
   - Recommendation: Start with default, add `maxClusterRadius` prop to MarkerClusterGroup if needed

2. **Listing card sync on cluster click**
   - What we know: Clicking cluster zooms to bounds, clicking single marker opens popup
   - What's unclear: Should clicking a cluster scroll to show cards for all listings in cluster?
   - Recommendation: Phase 1 - only sync single marker clicks. Revisit cluster behavior based on user feedback.

3. **Mobile map interaction patterns**
   - What we know: Desktop has 60/40 split, mobile could be toggle or bottom sheet
   - What's unclear: Best pattern for Israeli users (no user research data)
   - Recommendation: Start with 50/50 vertical split (map top, list bottom), add toggle later if needed.

## Sources

### Primary (HIGH confidence)

- [React Leaflet Official Docs](https://react-leaflet.js.org/) - Setup, installation, API reference
- [react-leaflet npm package](https://www.npmjs.com/package/react-leaflet) - v5.0.0, peer dependencies
- [react-leaflet-cluster GitBook](https://akursat.gitbook.io/marker-cluster) - Installation, API, CSS imports
- [react-leaflet-cluster GitHub](https://github.com/akursat/react-leaflet-cluster) - React 19 + react-leaflet 5 support
- [react-i18next Official Docs](https://react.i18next.com/) - Setup guide, TypeScript integration
- [i18next-browser-languagedetector GitHub](https://github.com/i18next/i18next-browser-languagedetector) - Configuration options
- [Vite Environment Variables Guide](https://vite.dev/guide/env-and-mode) - TypeScript setup, import.meta.env
- [Supabase React Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs) - Client setup, data fetching
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) - Attribution requirements
- [MDN CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/direction) - RTL layout

### Secondary (MEDIUM confidence)

- [Leaflet Developer Guide to High Performance](https://andrejgajdos.com/leaflet-developer-guide-to-high-performance-map-visualizations-in-react/) - Performance patterns
- [React-Leaflet Marker Files Not Found Fix](https://medium.com/@rivaifnasution/fixing-react-leaflet-marker-files-not-found-error-in-your-project-dc968878a4d5) - Icon path fixes
- [Right to Left in React Developer Guide](https://leancode.co/blog/right-to-left-in-react) - RTL implementation
- [Map UI Patterns](https://mapuipatterns.com/mobile-map/) - Mobile responsive patterns
- [Right to Left Styling 101](https://rtlstyling.com/posts/rtl-styling/) - CSS RTL best practices

### Tertiary (LOW confidence)

- WebSearch results for specific technical queries - verified against official docs where possible

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries are industry-standard, version info verified from npm/official docs
- Architecture: HIGH - Patterns verified from official documentation and established community practices
- Pitfalls: HIGH - Common issues documented across official GitHub issues and Stack Overflow
- Israel-specific map bounds: MEDIUM - No official source, using general geographic knowledge (needs validation)

**Research date:** 2026-02-14
**Valid until:** 2026-03-16 (30 days - stable ecosystem, infrequent breaking changes)
