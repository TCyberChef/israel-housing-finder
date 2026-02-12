# Codebase Concerns

**Analysis Date:** 2026-02-13

## Tech Debt

**Missing Dependencies:**
- Issue: All npm dependencies are declared in `package.json` but not installed
- Files: `package.json`
- Impact: Application cannot run locally, build process fails, development workflow blocked
- Fix approach: Run `npm install` to install all dependencies. The `package-lock.json` exists but `node_modules/` is missing from the filesystem.

**Supabase Integration Incomplete:**
- Issue: Supabase client configured but package not in dependencies
- Files: `src/config/supabase.js`
- Impact: Application will fail at runtime when Supabase client is imported, build will fail due to missing `@supabase/supabase-js` package
- Fix approach: Add `@supabase/supabase-js` to `package.json` dependencies, create `.env` file with `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`, or remove the unused config file if Supabase is not needed yet

**Environment Configuration Missing:**
- Issue: Supabase config references environment variables that are not documented or provided
- Files: `src/config/supabase.js`
- Impact: Supabase client will be initialized with `undefined` values, API calls will fail silently
- Fix approach: Create `.env.example` template with required variables, add documentation for obtaining Supabase credentials, or gate Supabase usage until credentials are configured

**Unused Code:**
- Issue: Supabase client created but never imported or used anywhere in the application
- Files: `src/config/supabase.js`
- Impact: Dead code, potential confusion about whether Supabase is actually being used
- Fix approach: Either integrate Supabase into the application or remove the configuration file until needed

**Missing Test Implementation:**
- Issue: Testing dependencies installed but no actual tests written
- Files: `package.json` includes `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`
- Impact: No test coverage, changes can break functionality without detection
- Fix approach: Remove unused testing dependencies or write actual tests for components

**Missing Assets:**
- Issue: HTML references `logo192.png` for Apple touch icon but file does not exist
- Files: `public/index.html` line 12
- Impact: 404 error when users try to add site to iOS home screen, broken icon display
- Fix approach: Either create `public/logo192.png` or remove the `<link rel="apple-touch-icon">` tag from HTML

## Known Bugs

**Broken Apple Touch Icon:**
- Symptoms: 404 error for `logo192.png` when accessing site from iOS devices
- Files: `public/index.html`
- Trigger: Opening the site on iOS Safari, attempting to add to home screen
- Workaround: None, the asset is missing from the repository

## Security Considerations

**Environment Variables Not Protected:**
- Risk: No `.env` file exists, but if created, developers might commit secrets to git
- Files: `.gitignore` (correctly excludes `.env.*` files)
- Current mitigation: `.gitignore` is properly configured to exclude environment files
- Recommendations: Create `.env.example` with dummy values as a template, add documentation warning against committing real credentials

**No Supabase Credential Validation:**
- Risk: Application will fail silently if Supabase credentials are wrong or missing
- Files: `src/config/supabase.js`
- Current mitigation: None, credentials are not validated
- Recommendations: Add validation to check if environment variables are set, provide helpful error messages if credentials are missing or invalid

## Performance Bottlenecks

**No Performance Issues Detected:**
- Application is currently minimal with only a static landing page
- No data fetching, no complex computations, no rendering performance concerns at this stage

## Fragile Areas

**Supabase Configuration:**
- Files: `src/config/supabase.js`
- Why fragile: Hardcoded to use environment variables without fallbacks, no error handling, client will crash if package is missing
- Safe modification: Add try/catch around client creation, validate environment variables exist, provide clear error messages
- Test coverage: No tests for Supabase configuration

**Deployment Configuration:**
- Files: `.github/workflows/deploy.yml`, `package.json`
- Why fragile: Deployment depends on `npm ci || npm install` fallback which may hide dependency issues, uses `peaceiris/actions-gh-pages@v3` which may have breaking changes
- Safe modification: Pin exact versions of GitHub Actions, ensure `package-lock.json` stays in sync with `package.json`
- Test coverage: No automated tests for deployment workflow

## Scaling Limits

**GitHub Pages Static Hosting:**
- Current capacity: Static files only, no server-side rendering or API endpoints
- Limit: Cannot handle dynamic backend logic, database operations must go through external services like Supabase
- Scaling path: Current architecture supports this with Supabase as backend, but complex operations may require separate API server

## Dependencies at Risk

**react-scripts 5.0.1:**
- Risk: react-scripts is no longer actively maintained by Create React App team, future React versions may not be compatible
- Impact: Potential security vulnerabilities, inability to upgrade to newer React features, lack of bug fixes
- Migration plan: Consider migrating to Vite, Next.js, or other modern build tools when adding features

**No Version Pinning:**
- Risk: Dependencies use caret ranges (^) which allow minor and patch updates automatically
- Impact: Builds may break if dependencies release breaking changes in minor versions
- Migration plan: Use exact versions or consider using lockfile-only updates with `npm ci`

## Missing Critical Features

**No Error Boundaries:**
- Problem: Application has no error boundaries to catch runtime errors
- Blocks: Users see blank page on errors, no graceful degradation
- Priority: Medium, needed before adding complex features

**No Analytics or Error Tracking:**
- Problem: No way to monitor production errors or user behavior
- Blocks: Cannot detect issues users encounter, no data for optimization decisions
- Priority: Low for current "Coming Soon" stage, High before real launch

**No Loading States:**
- Problem: When Supabase integration is added, no loading indicators are implemented
- Blocks: Poor user experience during data fetching
- Priority: Medium, should be added with first data-fetching feature

**No Environment-Based Configuration:**
- Problem: No distinction between development, staging, and production configurations
- Blocks: Cannot test with different API endpoints or feature flags
- Priority: Medium, needed when adding backend integration

## Test Coverage Gaps

**Zero Test Coverage:**
- What's not tested: All components and configuration
- Files: `src/App.js`, `src/index.js`, `src/config/supabase.js`
- Risk: Any changes can break the application without detection
- Priority: Medium, should add basic smoke tests before expanding features

**No CI Test Runs:**
- What's not tested: GitHub Actions workflow does not run tests before deployment
- Files: `.github/workflows/deploy.yml`
- Risk: Broken code can be deployed to production
- Priority: Medium, add `npm test` step to CI workflow

**No Build Verification in Repository:**
- What's not tested: Application builds successfully locally but this is not verified in repository
- Files: Local development only
- Risk: Contributors may commit code that doesn't build
- Priority: Low, CI workflow does run build step

---

*Concerns audit: 2026-02-13*
