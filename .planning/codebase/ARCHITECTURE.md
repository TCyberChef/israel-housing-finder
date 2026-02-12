# Architecture

**Analysis Date:** 2026-02-13

## Pattern Overview

**Overall:** Single Page Application (SPA) with React

**Key Characteristics:**
- Component-based UI architecture
- Client-side rendering with React 18
- Minimal backend integration (Supabase client prepared but not yet implemented)
- Static hosting deployment model (GitHub Pages)

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/`
- Contains: React components, CSS styling
- Depends on: React runtime, Supabase client (planned)
- Used by: Browser via static HTML entry point

**Configuration Layer:**
- Purpose: External service clients and environment configuration
- Location: `src/config/`
- Contains: Supabase client initialization
- Depends on: Environment variables (`process.env`)
- Used by: Application components (planned)

**Static Assets:**
- Purpose: HTML shell, favicon, manifest
- Location: `public/`
- Contains: Entry HTML, PWA manifest, robots.txt
- Depends on: Nothing
- Used by: Browser as initial load

## Data Flow

**Initial Page Load:**

1. Browser requests `/index.html` from GitHub Pages
2. HTML shell loads with `<div id="root">`
3. React runtime bootstraps via `src/index.js`
4. `ReactDOM.createRoot()` mounts `<App />` component
5. App component renders "Coming Soon" placeholder

**State Management:**
- Currently no state management (static placeholder page)
- React component state will be used for future features
- No Redux, Context API, or other state libraries detected

## Key Abstractions

**React Component:**
- Purpose: Reusable UI building blocks
- Examples: `src/App.js`
- Pattern: Functional components with hooks

**Supabase Client:**
- Purpose: Backend-as-a-Service abstraction
- Examples: `src/config/supabase.js`
- Pattern: Singleton client initialized from environment variables

## Entry Points

**Browser Entry:**
- Location: `public/index.html`
- Triggers: User navigates to site URL
- Responsibilities: Load React bundle, provide mount point

**JavaScript Entry:**
- Location: `src/index.js`
- Triggers: Loaded by bundled React Scripts
- Responsibilities: Create React root, render App in StrictMode

**Application Entry:**
- Location: `src/App.js`
- Triggers: Rendered by `src/index.js`
- Responsibilities: Top-level UI component, eventual routing and layout

## Error Handling

**Strategy:** React error boundaries (not yet implemented)

**Patterns:**
- No explicit error handling in current codebase
- React StrictMode enabled for development warnings
- Build process handles compile-time errors

## Cross-Cutting Concerns

**Logging:** Browser console (no structured logging)

**Validation:** Not implemented

**Authentication:** Prepared via Supabase client, not yet active

---

*Architecture analysis: 2026-02-13*
