# Coding Conventions

**Analysis Date:** 2026-02-13

## Naming Patterns

**Files:**
- Components: PascalCase, e.g., `App.js`
- Stylesheets: Match component name with `.css`, e.g., `App.css`, `index.css`
- Config modules: camelCase, e.g., `supabase.js`

**Functions:**
- React components: PascalCase function declarations
  ```javascript
  function App() { ... }
  ```

**Variables:**
- Constants: camelCase
  ```javascript
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  ```
- React roots: camelCase
  ```javascript
  const root = ReactDOM.createRoot(document.getElementById('root'));
  ```

**Types:**
- Not applicable (JavaScript, no TypeScript)

## Code Style

**Formatting:**
- Default Create React App settings
- No explicit Prettier config detected
- Standard 2-space indentation observed in source files

**Linting:**
- ESLint via Create React App
- Config in `package.json`:
  ```json
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  }
  ```
- Extends `react-app` and `react-app/jest` presets

## Import Organization

**Order:**
1. React imports
2. External libraries
3. Local CSS
4. Local components

**Example from `src/index.js`:**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
```

**Example from `src/App.js`:**
```javascript
import React from 'react';
import './App.css';
```

**Path Aliases:**
- None configured
- Relative imports used (`./App`, `./index.css`)

## Error Handling

**Patterns:**
- Not yet established (minimal codebase)
- No error boundaries detected
- No try/catch blocks in current code

## Logging

**Framework:** Standard `console` (presumed)

**Patterns:**
- No logging statements found in current codebase
- Production logging not yet implemented

## Comments

**When to Comment:**
- Inline comments for configuration/credentials context
  ```javascript
  // These will be replaced with your actual Supabase credentials
  ```

**JSDoc/TSDoc:**
- Not used in current codebase

## Function Design

**Size:** Small, focused functions (current examples are <15 lines)

**Parameters:** Minimal (React components currently take no props)

**Return Values:**
- React components return JSX
- Config modules export named constants
  ```javascript
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```

## Module Design

**Exports:**
- Default exports for React components
  ```javascript
  export default App;
  ```
- Named exports for config/utilities
  ```javascript
  export const supabase = createClient(...);
  ```

**Barrel Files:** Not used

---

*Convention analysis: 2026-02-13*
