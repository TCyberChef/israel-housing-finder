# Testing Patterns

**Analysis Date:** 2026-02-13

## Test Framework

**Runner:**
- Jest (via Create React App)
- Version: Bundled with `react-scripts@5.0.1`
- Config: Embedded in Create React App

**Assertion Library:**
- Jest built-in assertions
- React Testing Library matchers (`@testing-library/jest-dom@^5.17.0`)

**Run Commands:**
```bash
npm test              # Run all tests in watch mode
npm test -- --coverage # Run with coverage
```

## Test File Organization

**Location:**
- Not yet established (no test files found in `src/`)
- Standard Create React App pattern would be co-located

**Naming:**
- Create React App convention: `*.test.js` or `*.spec.js`
- No test files currently present

**Structure:**
```
src/
  App.js
  App.test.js          # (not yet created)
  config/
    supabase.js
    supabase.test.js   # (not yet created)
```

## Test Structure

**Suite Organization:**
- Testing libraries installed but no tests written yet
- Expected pattern (based on Create React App defaults):
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
```

**Patterns:**
- Standard Jest `test()` or `describe()`/`test()` blocks expected
- React Testing Library render pattern for components

## Mocking

**Framework:** Jest mocking (built-in)

**Patterns:**
- Not yet established in codebase
- Standard Jest mocks expected:
```javascript
jest.mock('./supabase');
```

**What to Mock:**
- External API calls (Supabase client)
- Environment variables

**What NOT to Mock:**
- React rendering
- DOM interactions (use Testing Library queries)

## Fixtures and Factories

**Test Data:**
- Not yet established

**Location:**
- No fixtures directory present

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
npm test -- --coverage
```

## Test Types

**Unit Tests:**
- Not yet implemented
- Expected for component logic and utilities

**Integration Tests:**
- Not yet implemented
- Expected for Supabase integration when features are built

**E2E Tests:**
- Not configured
- No Cypress, Playwright, or similar detected

## Common Patterns

**Async Testing:**
- Not yet established
- React Testing Library async utilities available:
```javascript
import { waitFor } from '@testing-library/react';
```

**Error Testing:**
- Not yet established

---

*Testing analysis: 2026-02-13*
