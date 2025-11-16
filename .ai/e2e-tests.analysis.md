# E2E Tests Analysis for SipStory MVP

**Document Version:** 1.0  
**Date:** November 15, 2025  
**Status:** Ready for Implementation

---

## Executive Summary

This document provides a comprehensive analysis of which user flows should be tested with E2E tests for the SipStory MVP, based on:

- Product Requirements Document (PRD) - #file:./prd.md
- Test Plan - #file:./test-plan.md
- Current codebase implementation
- CI/CD requirements

The analysis identifies **11 critical flows** worth testing with E2E tests, prioritized by business impact, user value, and technical risk.

**Current Status:** The three MVP-required E2E tests (01-login-create-tasting, 02-view-edit-tasting, 03-view-delete-tasting) have been removed as they were implemented incorrectly and need to be rewritten using the Page Object Model pattern.

---

## Methodology

### Analysis Criteria

Each flow was evaluated against:

1. **Business Criticality**: Impact on core MVP functionality
2. **User Value**: Frequency of use and importance to user experience
3. **Technical Complexity**: Risk of integration issues or regressions
4. **PRD Coverage**: Alignment with documented requirements
5. **CI/CD Requirement**: Specified in technical requirements

### Priority Levels

- **P0 (Critical)**: Required for MVP launch; blocks deployment if failing
- **P1 (High)**: Core functionality; should be tested before release
- **P2 (Medium)**: Important but not blocking; can be added post-launch
- **P3 (Low)**: Nice-to-have; may be covered by other tests

---

## Critical Flows Analysis

### 1. Authentication & Access Control

#### Flow 1A: User Registration (P1)

**PRD Reference:** US-001, TC-AUTH-01  
**Why Test:**

- First user interaction with the application
- Sets up user account for all subsequent features
- Complex validation (email format, password requirements)
- Email confirmation dependency

**Flow Steps:**

1. Navigate to `/register`
2. Enter valid email and password (≥8 characters)
3. Submit registration form
4. Verify success message displays
5. Verify user receives confirmation email notification

**Technical Considerations:**

- Tests Supabase Auth integration
- Validates client-side and server-side validation
- Checks error handling for duplicate emails
- Verifies redirect behavior

**Existing Coverage:** ✅ Partially covered in `login-flow.spec.ts`

**Recommendation:** Create dedicated test suite `registration-flow.spec.ts` with comprehensive scenarios:

- Successful registration
- Duplicate email handling
- Invalid email format
- Weak password rejection
- Form validation feedback

---

#### Flow 1B: User Login (P0) ✅

**PRD Reference:** US-002, TC-AUTH-02, TC-AUTH-03  
**Why Test:**

- **Required by CI/CD**: Specified in technical requirements
- Gateway to all authenticated features
- Most frequent user action
- Critical security boundary

**Flow Steps:**

1. Navigate to `/login`
2. Enter email and password
3. Submit login form
4. Verify redirect to `/dashboard`
5. Verify session established

**Technical Considerations:**

- Tests session cookie management
- Validates middleware authentication
- Checks error messaging for invalid credentials
- Tests "Remember me" functionality (if implemented)

**Existing Coverage:** ✅ Good coverage in `login-flow.spec.ts` (17 tests)

**Recommendation:** Current coverage is comprehensive for login form interactions. Need to add full login-to-dashboard flow for CI/CD requirement.

---

#### Flow 1C: Password Reset Flow (P2)

**PRD Reference:** TC-AUTH-06  
**Why Test:**

- Critical recovery mechanism
- Complex multi-step flow (email → token → reset)
- Involves external email system
- Security-sensitive operation

**Flow Steps:**

1. Navigate to `/login`
2. Click "Forgot password?" link → `/reset-password`
3. Enter email address
4. Submit reset request
5. Verify success message
6. (Simulate) Click reset link in email → `/reset-password-confirm?code=...`
7. Enter new password (twice)
8. Submit password change
9. Verify redirect to `/login`
10. Verify can login with new password

**Technical Considerations:**

- Tests Supabase password recovery flow
- Validates token expiration handling
- Checks password confirmation matching
- Tests error cases (invalid token, expired token)

**Existing Coverage:** ❌ Not covered

**Recommendation:** Add `password-reset-flow.spec.ts` with:

- Request reset email
- Invalid/expired token handling
- Password mismatch validation
- Successful password update and login

---

#### Flow 1D: Logout (P1)

**PRD Reference:** TC-AUTH-04  
**Why Test:**

- Security requirement
- Session cleanup verification
- Prevents unauthorized access

**Flow Steps:**

1. Login as authenticated user
2. Navigate to dashboard
3. Click user menu → "Logout"
4. Verify redirect to `/` (landing page)
5. Attempt to access `/dashboard` → verify redirect to `/login`

**Technical Considerations:**

- Tests session cookie deletion
- Validates middleware protection after logout
- Checks cleanup of client-side state

**Existing Coverage:** ❌ Not covered

**Recommendation:** Add as part of `authentication-flow.spec.ts` or `login-flow.spec.ts`

---

#### Flow 1E: Protected Route Access (P0)

**PRD Reference:** TC-AUTH-05  
**Why Test:**

- **Critical security requirement**
- Prevents unauthorized data access
- Validates middleware implementation
- Tests redirect with return URL

**Flow Steps:**

1. Ensure not logged in (clear cookies)
2. Attempt to access `/dashboard` directly
3. Verify redirect to `/login?redirectTo=/dashboard`
4. Login with valid credentials
5. Verify redirect back to `/dashboard`

**Technical Considerations:**

- Tests Astro middleware
- Validates session verification
- Checks redirect parameter handling

**Existing Coverage:** ❌ Not covered explicitly

**Recommendation:** Add to `authentication-flow.spec.ts` as high priority

---

### 2. Tasting Notes Management (CRUD)

#### Flow 2A: Create Tasting Note (P0) ✅ COMPLETED

**PRD Reference:** US-005, TC-CRUD-01, TC-CRUD-02, TC-CRUD-03  
**Why Test:**

- **Required by CI/CD**: Specified as critical user flow
- Core MVP functionality
- Tests entire data creation pipeline
- Validates form interactions and API integration

**Flow Steps:**

1. Login as authenticated user
2. Navigate to dashboard
3. Click "Add New" button
4. Fill mandatory fields (Brand, Blend, Rating)
5. Optionally fill other fields
6. Submit form
7. Verify redirect to dashboard
8. Verify new tasting appears in list

**Technical Considerations:**

- Tests autocomplete functionality
- Validates rating inputs (stars and dots)
- Checks form validation
- Tests API integration
- Validates database insertion

**Existing Coverage:** ✅ **IMPLEMENTED** in `01-login-create-tasting.spec.ts` using POM pattern

**Implementation Details:**

- 11 comprehensive test scenarios covering:
  - Successful creation with mandatory fields only
  - Successful creation with all fields
  - Validation errors for empty form
  - Validation errors for missing individual fields (brand, blend, rating)
  - Cancel form functionality
  - Submit button disabled state during submission
  - All rating types (star and dot ratings)
  - Page heading verification
  - Complete step-by-step scenario
- Uses LoginPage, DashboardPage, and TastingFormPage POMs
- All components have proper data-testid attributes:
  - TastingCard: `data-testid="tasting-note-card"`
  - Form fields already have proper data-testid
  - Rating inputs have data-testid for individual stars/dots

---

#### Flow 2B: View Tasting Note (P1) ✅ COMPLETED

**PRD Reference:** US-007, TC-CRUD-05  
**Why Test:**

- Users need to review their entries
- Tests data retrieval and display
- Validates detail view navigation
- Required as part of edit/delete flows

**Flow Steps:**

1. Login and navigate to dashboard
2. Click on existing tasting note card
3. Verify navigation to `/tastings/[id]`
4. Verify all fields displayed correctly
5. Verify ratings displayed properly

**Technical Considerations:**

- Tests dynamic routing
- Validates data fetching by ID
- Checks UI rendering of all field types

**Existing Coverage:** ✅ Covered in `02-view-edit-tasting.spec.ts`

**Implementation Details:**

- View functionality is tested as part of the edit flow
- TastingDetailPage POM provides comprehensive detail view interaction
- All tests navigate through detail view before editing
- Data display and navigation verified in multiple scenarios

---

#### Flow 2C: Edit Tasting Note (P0) ✅ COMPLETED

**PRD Reference:** US-008, TC-CRUD-06  
**Why Test:**

- **Required by CI/CD**: Specified as critical user flow
- Users need to correct/update entries
- Complex form pre-population
- Tests update API endpoint

**Flow Steps:**

1. Login and navigate to dashboard
2. Click on existing tasting note
3. Click "Edit" button
4. Verify form pre-populated with existing data
5. Modify one or more fields
6. Submit changes
7. Verify redirect to detail view
8. Verify changes reflected

**Technical Considerations:**

- Tests form initialization with existing data
- Validates autocomplete with pre-selected values
- Checks optimistic UI updates
- Tests API PATCH/PUT endpoint

**Existing Coverage:** ✅ **IMPLEMENTED** in `02-view-edit-tasting.spec.ts` using POM pattern

**Implementation Details:**

- 7 comprehensive test scenarios covering:
  - Successful edit with data verification
  - Pre-populated data display
  - Cancel edit without saving
  - Validation maintenance in edit mode
  - Update only modified fields
  - Edit with all optional fields
  - Complete step-by-step scenario
- Uses LoginPage, DashboardPage, TastingDetailPage, and TastingFormPage POMs
- All components have proper data-testid attributes:
  - TastingDetailView: Edit/Delete buttons, heading, data fields
  - DeleteConfirmDialog: Dialog, confirm/cancel buttons
  - TastingFormPage: Enhanced with getter methods for pre-populated data verification
- TastingDetailPage POM created with full navigation and action support

---

#### Flow 2D: Delete Tasting Note (P0) ✅

**PRD Reference:** US-009, TC-CRUD-07  
**Why Test:**

- **Required by CI/CD**: Specified as critical user flow
- Destructive operation requiring confirmation
- Tests data removal
- Important for data management

**Flow Steps:**

1. Login and navigate to dashboard
2. Click on existing tasting note
3. Click "Delete" button
4. Verify confirmation dialog appears
5. Click "Confirm Delete"
6. Verify redirect to dashboard
7. Verify tasting note no longer appears

**Technical Considerations:**

- Tests confirmation dialog interaction
- Validates API DELETE endpoint
- Checks database cascade operations
- Tests UI removal/rerender

**Existing Coverage:** ❌ Not covered (previous implementation was incorrect and removed)

**Recommendation:** Need to rewrite `03-view-delete-tasting.spec.ts` using POM pattern. Must include:

- Confirmation dialog interaction
- Cancel scenario (dialog dismissed, entry preserved)
- Successful deletion scenario
- Dashboard state update verification

---

### 3. Dashboard Features

#### Flow 3A: Filtering Tasting Notes (P1)

**PRD Reference:** US-011, TC-DASH-02, TC-DASH-03, TC-DASH-04  
**Why Test:**

- Core dashboard functionality
- Complex state management
- Multiple filter combinations
- Important for users with many entries

**Flow Steps:**

1. Login and navigate to dashboard
2. Open filter panel
3. Select brand filter
4. Verify grid updates with filtered results
5. Add region filter
6. Verify grid shows combined filter results
7. Set minimum rating (e.g., 4 stars)
8. Verify grid shows only matching entries
9. Clear filters
10. Verify all entries visible again

**Technical Considerations:**

- Tests filter state management
- Validates API query parameters
- Checks multiple filter combinations
- Tests desktop sidebar vs mobile drawer
- Validates "Clear All" functionality

**Existing Coverage:** ❌ Not covered

**Recommendation:** Create `dashboard-filtering-flow.spec.ts` with:

- Single filter scenarios (brand, region, rating)
- Combined filter scenarios
- Clear filters functionality
- Mobile and desktop layouts
- Empty state when no matches

**Priority:** High - This is a key feature per PRD US-011

---

#### Flow 3B: Comparison Feature (P1)

**PRD Reference:** US-010, TC-COMP-01, TC-COMP-02, TC-COMP-03  
**Why Test:**

- **Key differentiating feature** per PRD
- Complex multi-step interaction
- Tests comparison view implementation
- Important for user decision-making

**Flow Steps:**

1. Login and navigate to dashboard
2. Click "Compare" mode toggle
3. Verify checkboxes appear on cards
4. Select first tasting note
5. Verify selection state
6. Select second tasting note
7. Verify "Compare Selected" button enabled
8. Click "Compare Selected"
9. Verify navigation to `/tastings/compare?ids=id1,id2`
10. Verify side-by-side comparison display
11. Verify all fields compared correctly
12. Click "Back to Dashboard"
13. Verify return to dashboard, compare mode off

**Technical Considerations:**

- Tests compare mode state management
- Validates multi-select logic
- Checks URL parameter handling
- Tests comparison view rendering
- Validates responsive layouts (table vs cards)

**Existing Coverage:** ❌ Not covered

**Recommendation:** Create `comparison-flow.spec.ts` with:

- Enter/exit compare mode
- Select exactly 2 notes (test 0, 1, 2, 3+ selections)
- Navigate to comparison view
- Verify data accuracy in comparison
- Mobile vs desktop layouts
- Error handling (invalid IDs, deleted notes)

**Priority:** High - This is a core MVP feature per PRD 3.4.1

---

#### Flow 3C: First-Time User Onboarding (P1)

**PRD Reference:** US-004, TC-ONB-01, TC-ONB-02  
**Why Test:**

- Critical first impression
- Validates onboarding trigger logic
- Tests educational content delivery
- One-time flow requiring special handling

**Flow Steps:**

1. Register new user
2. Login for first time
3. Verify automatic redirect to `/onboarding`
4. Verify all onboarding content visible
5. Read through educational content
6. Click "Get Started" button
7. Verify redirect to `/tastings/new`
8. Create first tasting note
9. Logout and login again
10. Verify direct access to `/dashboard` (no onboarding)

**Technical Considerations:**

- Tests first-time user detection
- Validates onboarding bypass for returning users
- Checks educational content display
- Tests navigation flow

**Existing Coverage:** ✅ Partially covered in `example-pom.spec.ts`

**Recommendation:** Expand coverage to include:

- Onboarding trigger conditions
- Skip/bypass behavior
- Navigation from onboarding

---

### 4. Input Assistance Features

#### Flow 4A: Autocomplete Functionality (P2)

**PRD Reference:** US-012, Feature 3.4.3  
**Why Test:**

- Improves data consistency
- Complex cascading behavior
- Tests API integration
- Important UX enhancement

**Flow Steps:**

1. Login and navigate to new tasting form
2. Start typing in Brand field
3. Verify suggestions appear from user's history
4. Select a brand from suggestions
5. Verify brand field populated
6. Start typing in Region field
7. Verify suggestions filtered by selected brand
8. Select region from suggestions
9. Start typing in Blend field
10. Verify suggestions filtered by brand and region
11. Complete form and submit

**Technical Considerations:**

- Tests cascading autocomplete logic
- Validates API calls for suggestions
- Checks debouncing behavior
- Tests keyboard navigation

**Existing Coverage:** ❌ Not covered in E2E

**Recommendation:** Add to `tasting-form-interactions.spec.ts`:

- Basic autocomplete behavior
- Cascading filters (brand → region → blend)
- Keyboard navigation
- Empty state (no suggestions)

**Priority:** Medium - Nice UX feature but not blocking

---

## Summary of Recommendations

### Currently Covered (1 flow) ✅

1. **Login Form Interactions** - Comprehensive form testing (17 tests in `login-flow.spec.ts`)

### High Priority - CI/CD Required (3 flows) 🔴🔴🔴

**BLOCKING MVP DEPLOYMENT:**

1. **Login → Create Tasting** (P0) - Required by PRD Technical Requirements 3.5.3
2. **View → Edit Tasting** (P0) - Required by PRD Technical Requirements 3.5.3
3. **View → Delete Tasting** (P0) - Required by PRD Technical Requirements 3.5.3

### High Priority - Critical Features (4 flows) 🔴

1. **Comparison Feature** (P1) - Core differentiating feature
2. **Dashboard Filtering** (P1) - Key usability feature
3. **Protected Route Access** (P0) - Critical security
4. **Logout** (P1) - Security requirement

### Medium Priority - Recommended (2 flows) 🟡

1. **User Registration** (P1) - Extend existing coverage
2. **Password Reset** (P2) - Recovery mechanism

### Lower Priority - Nice to Have (1 flow) 🟢

1. **Autocomplete Interactions** (P2) - UX enhancement

---

## Implementation Plan

### Phase 0: CI/CD Blockers (IMMEDIATE - MVP Cannot Launch Without These)

**Timeline:** 1-2 days  
**Priority:** 🔴🔴🔴 CRITICAL - BLOCKING DEPLOYMENT

These three tests are explicitly required by PRD Section 3.5.3 for the CI/CD pipeline:

1. **`01-login-create-tasting.spec.ts`** (REWRITE REQUIRED)
   - Use LoginPage POM for authentication
   - Use DashboardPage POM for navigation
   - Use TastingFormPage POM for form interactions
   - Test minimum required fields only
   - Test validation errors for empty fields
   - Verify entry appears in dashboard after creation

2. **`02-view-edit-tasting.spec.ts`** (REWRITE REQUIRED)
   - Use LoginPage + DashboardPage + TastingFormPage POMs
   - Navigate to existing tasting detail view
   - Click Edit button
   - Verify form pre-population
   - Modify fields
   - Test Save Changes and Cancel
   - Verify changes reflected in detail view

3. **`03-view-delete-tasting.spec.ts`** (REWRITE REQUIRED)
   - Use LoginPage + DashboardPage POMs
   - Navigate to existing tasting detail view
   - Click Delete button
   - Test confirmation dialog
   - Test both Confirm Delete and Cancel scenarios
   - Verify entry removed from dashboard

**Notes:**

- Previous implementations were incorrect and have been removed
- Must follow Page Object Model pattern (see `e2e/page-objects/`)
- Must use proper data-testid selectors
- Reference `example-pom.spec.ts` for correct patterns

### Phase 1: Critical Gaps (Before MVP Launch)

**Timeline:** 2-3 days

1. **Protected Route Access** (`authentication-security.spec.ts`)
   - Unauthenticated access to protected routes
   - Redirect with return URL
   - Session verification

2. **Logout Flow** (add to `authentication-flow.spec.ts`)
   - Complete logout process
   - Session cleanup verification
   - Access prevention after logout

3. **Comparison Feature** (`comparison-flow.spec.ts`)
   - Complete comparison workflow
   - Selection validation
   - Comparison view rendering
   - Error scenarios

4. **Dashboard Filtering** (`dashboard-filtering-flow.spec.ts`)
   - Single filter types
   - Combined filters
   - Clear filters
   - Empty states

### Phase 2: Enhanced Coverage (Post-Launch)

**Timeline:** 1-2 days

1. **Registration Flow** (`registration-flow.spec.ts`)
   - Comprehensive registration scenarios
   - Validation edge cases
   - Error handling

2. **Password Reset** (`password-reset-flow.spec.ts`)
   - Complete reset workflow
   - Token handling
   - Error scenarios

### Phase 3: Polish (Future Enhancement)

**Timeline:** 1 day

1. **Autocomplete Interactions** (`tasting-form-interactions.spec.ts`)
   - Cascading autocomplete
   - Keyboard navigation
   - Edge cases

---

## Test Data Strategy

### Required Test Users

```typescript
// Existing user with data
{
  email: "with-data@e2e.com",
  password: "Test123!",
  tastings: 10+ entries
}

// New user for registration tests
{
  email: "newuser-{timestamp}@test.com",
  password: "Test123!"
}

// User for reset password tests
{
  email: "old-user@e2e.com",
  password: "OldPassword123!"
}
```

### Test Data Requirements

- Multiple brands (5+)
- Multiple regions (5+)
- Multiple blends per brand (3+ each)
- Tastings with various ratings (1-5 stars)
- Tastings with optional fields filled/empty

---

## CI/CD Integration

### Required Tests for Deployment Gate

Per PRD Technical Requirements 3.5.3, the following must pass:

1. ✅ **Login → Create a new tasting** - **IMPLEMENTED** in `01-login-create-tasting.spec.ts` (11 test scenarios)
2. ❌ **Get a tasting → Edit the tasting** (NEEDS IMPLEMENTATION)
3. ❌ **Get a tasting → Delete the tasting** (NEEDS IMPLEMENTATION)

**Status:** �� **PARTIALLY BLOCKING MVP DEPLOYMENT** - Two remaining tests are required before the application can be deployed to production per PRD requirements.

**Additional Recommended Gates:** 4. 🔴 Protected route access (security) 5. 🔴 Comparison feature (core functionality)

### Test Execution Strategy

- Run on every PR to main branch
- Run before production deployment
- Use Playwright in CI mode (headless)
- Generate HTML report for failures
- Store video recordings for failed tests

---

## Metrics and KPIs

### Coverage Goals

- **Authentication:** 100% of critical paths
- **CRUD Operations:** 100% of user stories
- **Dashboard Features:** 80% coverage (comparison + filtering)
- **Overall E2E Coverage:** 85% of user stories

### Success Criteria

- All P0 tests pass consistently (>99% pass rate)
- Test execution time < 10 minutes for full suite
- No flaky tests (run 10 times, 0 failures without code changes)
- Clear error messages for debugging failures

---

## Rationale for Each Flow

### Why Comparison Feature is High Priority

1. **Explicitly mentioned in PRD** as a "Key Feature" (Section 3.3)
2. **User Story US-010** specifically describes this flow
3. **Unique value proposition** - differentiates from generic tea apps
4. **Complex interaction** - multi-step with state management
5. **Business critical** - directly addresses user pain point

### Why Filtering is High Priority

1. **User Story US-011** defines this requirement
2. **Test Cases TC-DASH-02, 03, 04** require validation
3. **Scalability requirement** - critical for users with many entries
4. **Data integrity** - ensures query parameters work correctly
5. **Multiple integration points** - API, state management, UI

### Why Protected Routes are Critical

1. **Security requirement** - prevents unauthorized access
2. **Test Case TC-AUTH-05** explicitly requires this
3. **Foundation for all features** - if broken, everything is vulnerable
4. **Middleware validation** - core architecture component
5. **Data privacy** - protects user's personal tasting data

### Why Registration is Lower Priority

1. Already partially covered in `login-flow.spec.ts`
2. Similar validation logic to login
3. Less frequent operation than login
4. Can be tested manually during QA
5. Supabase handles most complexity

### Why Autocomplete is Lower Priority

1. **UX enhancement**, not blocking functionality
2. Users can still type values manually
3. Complex to test reliably (timing, debouncing)
4. Already covered in unit tests (`useAutocompleteData.test.ts`)
5. Can be validated through manual testing

---

## Risk Assessment

### High-Risk Areas Requiring E2E Tests

1. **Authentication** - Security boundary, session management
2. **Data Persistence** - CRUD operations, database integrity
3. **Multi-step Workflows** - Comparison, password reset
4. **State Management** - Filters, compare mode

### Lower-Risk Areas (Unit Tests Sufficient)

1. **Form Validation** - Covered by unit tests
2. **UI Components** - Covered by component tests
3. **Utility Functions** - Covered by unit tests
4. **API Response Formatting** - Covered by integration tests

---

## Conclusion

The recommended E2E test suite should include:

**🔴 CRITICAL - BLOCKING DEPLOYMENT (Phase 0):**

- ✅ **COMPLETED** `01-login-create-tasting.spec.ts` (implemented using POM)
- ❌ 2 CI/CD-required flows **MUST BE IMPLEMENTED**
  - `02-view-edit-tasting.spec.ts` (rewrite using POM)
  - `03-view-delete-tasting.spec.ts` (rewrite using POM)

**High Priority (Phase 1 - Pre-Launch):**

- 🔴 4 critical flows to implement
  - Protected route access (security)
  - Logout flow (security)
  - Comparison feature (core MVP feature)
  - Dashboard filtering (core MVP feature)

**Medium Priority (Phase 2 - Post-Launch):**

- 🟡 2 enhancement flows
  - User registration (extend coverage)
  - Password reset (recovery)

**Total E2E Coverage Target:** 10 critical flows covering:

- Complete authentication lifecycle
- Full CRUD operations with proper POM pattern
- Core dashboard features (filtering, comparison)
- Security boundaries

**Current Status:** � **DEPLOYMENT PARTIALLY BLOCKED**

- Current E2E coverage: **20% complete** (2 of 10 flows - login form + create tasting)
- CI/CD required tests: **33% complete** (1 of 3) ✅
- The application **CANNOT be deployed** until the remaining 2 CI/CD-required tests are properly implemented

**Immediate Action Required:**

1. ✅ ~~Implement `01-login-create-tasting.spec.ts` using POM pattern~~ **COMPLETED**
2. Implement the 2 remaining CI/CD tests using Page Object Model pattern:
   - `02-view-edit-tasting.spec.ts`
   - `03-view-delete-tasting.spec.ts`
3. Use existing POMs: LoginPage, DashboardPage, TastingFormPage
4. Ensure all tests use data-testid selectors
5. Verify tests pass consistently (run 10 times with 0 failures)

Once Phase 0 is complete, implementing the 4 remaining high-priority flows (Phase 1) will bring coverage to **80% of critical paths**, ensuring a stable and reliable MVP launch.
