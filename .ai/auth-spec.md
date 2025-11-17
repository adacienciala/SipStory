# Authentication Module - Technical Specification

**Status: ✅ IMPLEMENTED & DEPLOYED**

This document outlines the technical architecture for user authentication in the SipStory application, based on the requirements from the PRD and the existing technology stack.

## 1. User Interface Architecture

The frontend will use a combination of Astro pages for structure and server-side logic, and React components for interactive UI elements like forms.

### 1.1. Pages (✅ Implemented)

- **`/login` (`src/pages/login.astro`)** ✅
  - **Purpose:** Allows existing users to sign in.
  - **Mode:** Publicly accessible.
  - **Content:** Hosts the `AuthForm` React component, configured for "login" mode.
  - **Server-Side Logic:**
    - If an authenticated user (session cookie present) tries to access this page, they are redirected to the `/dashboard`.
    - Handles POST requests from the `AuthForm` to perform the login action via an API route.

- **`/register` (`src/pages/register.astro`)** ✅
  - **Purpose:** Allows new users to create an account.
  - **Mode:** Publicly accessible.
  - **Content:** Hosts the `AuthForm` React component, configured for "register" mode.
  - **Server-Side Logic:**
    - If an authenticated user tries to access this page, they are redirected to the `/dashboard`.
    - Handles POST requests for registration.

- **`/reset-password` (`src/pages/reset-password.astro`)** ✅
  - **Purpose:** A two-step flow for password recovery.
  - **Step 1 (Request Reset):** A form where the user enters their email to receive a password reset link.
  - **Step 2 (Set New Password):** A page (linked from the email) where the user can set a new password, handled by Supabase Auth.

- **`/dashboard` (`src/pages/dashboard.astro`)** ✅
  - **Mode:** Protected. Access is controlled by `src/middleware/index.ts`.
  - **Enhancement:** Displays user-specific data.

### 1.2. Components (✅ Implemented)

- **`AuthForm.tsx` (`src/components/AuthForm.tsx`)** ✅
  - **Responsibility:** Manages all client-side logic for authentication forms, including state, validation, and submission.
  - **Props:**
    - `mode`: `"login" | "register" | "password-recovery"` to render the correct fields and logic.
    - `redirectTo?`: `string` (optional) URL to redirect to after successful authentication.
  - **Client-Side Validation:**
    - **Email:** Must be a valid email format.
    - **Password (Registration):** Must meet complexity requirements (e.g., minimum length, special characters).
    - Error messages are displayed inline for each field.
  - **API Interaction:**
    - Uses `fetch` to send form data to dedicated API endpoints (`/api/auth/login`, `/api/auth/register`).
    - Handles API responses, displaying success or error messages to the user.

- **`UserNav.tsx` (`src/components/UserNav.tsx`)** ✅
  - **Responsibility:** Displays user status and authentication-related actions in the main layout.
  - **States:**
    - **Authenticated:** Shows the user's avatar with a menu containing a "Logout" button. The logout button calls the `/api/auth/logout` endpoint.
    - **Unauthenticated:** Shows "Login" and "Register" links.
  - **Integration:** Placed in `src/layouts/Layout.astro`.

### 1.3. Layouts (✅ Implemented)

- **`Layout.astro` (`src/layouts/Layout.astro`)** ✅
  - Includes the `UserNav` component in the header.
  - Receives the user's session status from the page context (`Astro.locals.session`) to correctly render the `UserNav` component.

### 1.4. Scenarios

- **Login:**
  1.  User navigates to `/login`.
  2.  Fills email/password in `AuthForm`.
  3.  `AuthForm` validates input client-side.
  4.  On submit, `AuthForm` POSTs to `/api/auth/login`.
  5.  API route validates credentials with Supabase.
  6.  On success, the API route sets a session cookie and returns a success response. The client-side script then redirects to `/dashboard`.
  7.  On failure, the API returns an error, which `AuthForm` displays.

- **Unauthenticated Access to Protected Route:**
  1.  User attempts to access `/dashboard`.
  2.  `src/middleware/index.ts` intercepts the request.
  3.  No valid session is found.
  4.  Middleware redirects the user to `/login`, storing the originally requested URL (`/dashboard`) to redirect back to after login.

## 2. Backend Logic

Backend logic will be implemented using Astro API routes and middleware.

### 2.1. API Endpoints (`src/pages/api/auth/`) (✅ Implemented)

- **`login.ts` (`POST`)** ✅
  - **Purpose:** Handle user login.
  - **Input:** `{ email, password }`.
  - **Validation:** Uses Zod to validate input shape and types.
  - **Logic:**
    1.  Calls `supabase.auth.signInWithPassword()`.
    2.  If successful, retrieves the session and sets the access and refresh tokens in secure, `HttpOnly` cookies using `Astro.cookies.set()`.
    3.  Returns a `200 OK` response.
  - **Error Handling:** Catches errors from Supabase (e.g., invalid credentials) and returns an appropriate `401 Unauthorized` or `400 Bad Request` status with a JSON error message.

- **`register.ts` (`POST`)** ✅
  - **Purpose:** Handle new user registration.
  - **Input:** `{ email, password }`.
  - **Validation:** Zod schema for email and password.
  - **Logic:**
    1.  Calls `supabase.auth.signUp()`. Supabase handles sending a confirmation email.
    2.  Returns a `201 Created` response with a message instructing the user to check their email.
  - **Error Handling:** Catches errors (e.g., user already exists) and returns a `409 Conflict` or `400 Bad Request` status.

- **`logout.ts` (`POST`)** ✅
  - **Purpose:** Log the user out.
  - **Logic:**
    1.  Calls `supabase.auth.signOut()`.
    2.  Deletes the session cookies using `Astro.cookies.delete()`.
    3.  Returns a `200 OK` response, which triggers a client-side redirect to the home page (`/`).

- **`reset-password.ts` (`POST`)** ✅
  - **Purpose:** Initiate the password reset flow.
  - **Input:** `{ email }`.
  - **Logic:**
    1.  Calls `supabase.auth.resetPasswordForEmail()`.
    2.  Returns a `200 OK` response, regardless of whether the email exists, to prevent user enumeration attacks.

### 2.2. Data Models & Validation (✅ Implemented)

- **Zod Schemas (`src/lib/validators/auth.ts`)** ✅
  - `LoginSchema`: `{ email: z.string().email(), password: z.string() }`
  - `RegisterSchema`: `{ email: z.string().email(), password: z.string().min(8) }`
  - These schemas are used in the API routes to validate incoming data.

## 3. Authentication System

The core authentication mechanism relies on Supabase Auth, integrated with Astro's server-side capabilities.

### 3.1. Middleware (`src/middleware/index.ts`) (✅ Implemented)

- **Responsibility:** Central point for route protection and session management.
- **Logic on Every Request:**
  1.  Check for the presence of session cookies (`access-token`, `refresh-token`).
  2.  If no tokens are present, `Astro.locals.session` is set to `null`.
  3.  If tokens exist, use the refresh token to get a new session from Supabase via `supabase.auth.setSession()` and `supabase.auth.getSession()`. This keeps the user logged in.
  4.  The user's session and user object are stored in `Astro.locals` for access in server-side page and API route logic (`Astro.locals.session`, `Astro.locals.user`).
  5.  **Route Protection:**
      - Defines an array of protected routes (e.g., `['/dashboard', '/tastings']`).
      - If the requested path is in the protected list and `Astro.locals.session` is `null`, redirects to `/login`.
      - The original URL is appended as a query parameter (`/login?redirectTo=/dashboard`) for a better user experience.

### 3.2. Supabase Integration (✅ Implemented)

- **Client (`src/db/supabase.client.ts`):** ✅ The Supabase client is configured and in use.
- **Server-Side Auth:** ✅ A server-side Supabase client is initialized in the middleware, with most auth handled by passing the user's JWTs from cookies.
- **Email Templates:** ✅ Custom branded email templates have been configured for "Confirm Email" and "Reset Password" actions in `supabase/templates/`.
- **OAuth Providers (Future):** The architecture supports adding OAuth providers (e.g., Google, GitHub) by adding corresponding buttons to `AuthForm.tsx` and creating API endpoints to handle the `supabase.auth.signInWithOAuth()` flow.
