# Test Plan: SipStory

## 1. Introduction and Testing Objectives

This document outlines the comprehensive testing plan for SipStory, a web application for matcha tasting notes.

The primary objectives of this testing phase are:

- To verify that all functional requirements of the MVP are met and work as expected.
- To ensure the application provides a stable, secure, and seamless user experience on both desktop and mobile platforms.
- To identify and rectify bugs, inconsistencies, and performance issues before deployment.
- To validate the integrity of the data flow between the frontend, backend (Supabase), and the database.
- To confirm that the user interface is intuitive, accessible, and adheres to the design specifications.

## 2. Scope of Testing

### In-Scope Features:

- User authentication (registration, login, password reset, protected routes).
- First-time user onboarding process.
- Full CRUD (Create, Read, Update, Delete) functionality for tasting notes.
- Core features: side-by-side comparison of two tasting notes.
- Dashboard features: filtering and sorting of tasting notes.
- UI/UX responsiveness and consistency across supported viewports (mobile and desktop).
- API endpoint functionality and security.
- Data integrity and validation.

### Out-of-Scope Features:

- Photo uploads.
- Community and social features.
- Administrative moderation panels.
- Third-party integrations not specified in the tech stack.
- Advanced features listed as "NOT in MVP Scope" in the project documentation.

## 3. Types of Testing

A multi-layered testing approach will be adopted:

- **Unit Testing:** To test individual React components, hooks, and utility functions in isolation.
- **Integration Testing:** To test the interaction between components, services, and API endpoints. For example, testing the flow from a form submission to the API call and database update.
- **End-to-End (E2E) Testing:** To simulate real user scenarios from start to finish, covering critical user flows.
- **API Testing:** To directly test the API endpoints for correctness, performance, and security.
- **UI & Compatibility Testing:** To ensure visual consistency and functionality across different browsers and screen sizes.
- **Security Testing:** To identify potential security vulnerabilities, particularly in authentication and data handling.

## 4. Test Scenarios for Key Functionalities

### 4.1. Authentication

- **TC-AUTH-01:** A new user can successfully register with a valid email and password.
- **TC-AUTH-02:** A registered user can log in with correct credentials.
- **TC-AUTH-03:** A user cannot log in with incorrect credentials and receives a clear error message.
- **TC-AUTH-04:** A logged-in user can successfully log out.
- **TC-AUTH-05:** An unauthenticated user is redirected from a protected route (e.g., `/dashboard`) to the login page.
- **TC-AUTH-06:** A user can successfully reset their password via the "forgot password" flow.

### 4.2. Onboarding

- **TC-ONB-01:** A newly registered, first-time user is mandatorily redirected to the onboarding screen after login.
- **TC-ONB-02:** The user can successfully complete the onboarding and is then redirected to the dashboard.
- **TC-ONB-03:** A returning user is not shown the onboarding screen.

### 4.3. Tasting Notes (CRUD)

- **TC-CRUD-01:** A logged-in user can create a new tasting note with all mandatory fields.
- **TC-CRUD-02:** A logged-in user can create a new tasting note with all optional fields filled.
- **TC-CRUD-03:** The system prevents the creation of a tasting note if mandatory fields are missing.
- **TC-CRUD-04:** A user can view a list of their tasting notes on the dashboard.
- **TC-CRUD-05:** A user can open and view the full details of a single tasting note.
- **TC-CRUD-06:** A user can edit and successfully save changes to an existing tasting note.
- **TC-CRUD-07:** A user can delete a tasting note after confirming the action in a dialog.

### 4.4. Dashboard & Filtering

- **TC-DASH-01:** The dashboard correctly displays all tasting notes for the logged-in user, sorted chronologically by default.
- **TC-DASH-02:** The filter panel allows filtering by brand, and the grid updates accordingly.
- **TC-DASH-03:** The filter panel allows filtering by region, and the grid updates accordingly.
- **TC-DASH-04:** The filter panel allows filtering by minimum star rating (e.g., >= 4 stars), and the grid updates accordingly.

### 4.5. Comparison Feature

- **TC-COMP-01:** A user can select two tasting notes for comparison.
- **TC-COMP-02:** The comparison view displays the data of the two selected notes in a side-by-side layout.
- **TC-COMP-03:** A user can exit the comparison view and return to the dashboard.

## 5. Test Environment

- **Browsers:** Latest stable versions of Chrome, Firefox, and Safari.
- **Viewports:**
  - Mobile: 390x844 (iPhone 12/13 Pro)
  - Desktop: 1440x900
- **Backend:** Supabase development environment.
- **Database:** Supabase Postgres database seeded with `supabase/seed.sql`.

## 6. Testing Tools

- **Unit/Integration Testing:** Vitest, React Testing Library.
- **E2E Testing:** Playwright.
- **API Testing:** REST Client (VS Code Extension) with `.http` files, Postman.
- **Code Coverage:** Vitest Coverage (via `c8`).
- **Linting:** ESLint.

## 7. Test Schedule

- **Phase 1 (Development):** Unit and integration tests will be written concurrently with feature development.
- **Phase 2 (Pre-Release):** A dedicated week for intensive E2E, API, and compatibility testing before the target launch date.
- **Phase 3 (Regression):** Automated tests will be run via CI/CD pipeline on every push to the main branches to prevent regressions.

## 8. Test Acceptance Criteria

- **Unit Tests:** 80% code coverage for critical components and business logic.
- **Integration & E2E Tests:** 100% pass rate for all defined test scenarios.
- **Bugs:** No open "Blocker" or "Critical" severity bugs.
- **Performance:** Page load times (Largest Contentful Paint) under 2.5 seconds on a standard connection.
- **CI/CD:** The automated build and test pipeline must pass successfully for a release to be approved.

## 9. Roles and Responsibilities

- **QA Engineer:** Responsible for creating and executing the test plan, writing E2E tests, and reporting bugs.
- **Developers:** Responsible for writing unit and integration tests for their code, fixing reported bugs, and maintaining the CI/CD pipeline.
- **Project Owner:** Responsible for final acceptance testing (UAT) and approving the release.

## 10. Bug Reporting Procedure

- **Tool:** GitHub Issues will be used for bug tracking.
- **Template:** A standardized bug report template will be used, including:
  - **Title:** A clear, concise summary of the bug.
  - **Description:** Detailed steps to reproduce the bug.
  - **Expected Result:** What should have happened.
  - **Actual Result:** What actually happened.
  - **Environment:** Browser, OS, viewport size.
  - **Severity:** Blocker, Critical, Major, Minor, Trivial.
  - **Screenshots/Videos:** Attached to illustrate the issue.
- **Lifecycle:** New -> In Progress -> In Review -> Closed/Done.
