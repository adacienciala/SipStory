# View Implementation Plan: Onboarding

## 1. Overview

The Onboarding view is a crucial, one-time informational screen for new authenticated users. Its primary purpose is to educate users on key matcha tasting concepts (like 'umami' and 'foam quality') and provide a brief guide on how to use the application to log their first tasting note. This view ensures users understand the app's value and core functionality before they begin, improving user retention and engagement. It will feature static informational text and a single call-to-action button to navigate them to the "create new tasting note" page.

## 2. View Routing

- **Path**: `/onboarding`
- **Access Control**: This is a protected route accessible only to authenticated users. Middleware will be responsible for redirecting users to this page if they are authenticated but have zero tasting notes in their account.

## 3. Component Structure

The view will be composed of a main Astro page component that orchestrates the layout and several child components for structure and interactivity.

```
/src/pages/onboarding.astro
└── /src/layouts/Layout.astro
    └── OnboardingView (React, client component)
        ├── Header (h1, p)
        ├── TastingConceptsSection
        │   ├── ConceptCard (for Umami)
        │   │   └── (h3, p)
        │   └── ConceptCard (for Foam Quality)
        │       └── (h3, p)
        ├── HowToLogSection
        │   └── (h2, p, ol/li)
        └── GetStartedButton (React, client component)
            └── Button (Shadcn/ui)
```

## 4. Component Details

### `onboarding.astro`

- **Component Description**: The main Astro page file that defines the route. It sets up the overall page structure, imports the main React view component, and applies the site-wide layout.
- **Main Elements**: `<Layout>`, `<OnboardingView />`
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

### `OnboardingView.tsx`

- **Component Description**: This is the main client-side React component that renders the entire content of the onboarding screen. It organizes the informational sections and includes the final call-to-action.
- **Main Elements**: `div` (main container), `Header`, `TastingConceptsSection`, `HowToLogSection`, `GetStartedButton`.
- **Handled Interactions**: None directly, but it composes the `GetStartedButton`.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

### `GetStartedButton.tsx`

- **Component Description**: A client-side React component that renders a button. When clicked, it navigates the user to the page for creating a new tasting note.
- **Main Elements**: `<Button>` from Shadcn/ui.
- **Handled Interactions**:
  - `onClick`: Handles the button click event.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

## 5. Types

This view is primarily static and does not require any new custom `ViewModel` or data-intensive types. It is a presentational view triggered by application state (user's tasting note count) handled by the middleware.

## 6. State Management

State management for this view is minimal and external.

- **View-level State**: No internal state is required within the `OnboardingView` component itself.
- **Navigation**: The `GetStartedButton` component will use Astro's `navigate` function from its `v-trans` (View Transitions) module to perform a client-side redirection to `/tasting-notes/new`.

## 7. API Integration

There is no direct API integration within the onboarding view itself. The logic to display this view is handled by the application's middleware (`src/middleware/index.ts`). The middleware will check if an authenticated user has `0` tasting notes by making a `GET` request to the `/api/tasting-notes` endpoint. If the returned array of tasting notes has a length of zero, it will redirect the user to `/onboarding`. This logic is outside the scope of the view's implementation but is a key part of the user flow.

## 8. User Interactions

- **User Clicks "Get Started" Button**:
  - **Action**: The `onClick` event handler in the `GetStartedButton` component is triggered.
  - **Outcome**: The application performs a client-side navigation to the `/tasting-notes/new` page, where the user can create their first entry.

## 9. Conditions and Validation

The primary condition for this view to be displayed is managed by the middleware, not the component itself.

- **Condition**: The user is authenticated AND their total count of tasting notes is zero.
- **Verification**: This check is performed server-side within the Astro middleware before the page is rendered.
- **Effect**: If the condition is met and the user is not already on the `/login`, `/register`, or `/onboarding` page, they are redirected to `/onboarding`.

## 10. Error Handling

Since this view is static and does not perform API calls, the potential for errors is minimal.

- **Navigation Failure**: In the unlikely event that client-side navigation fails, the user would remain on the onboarding page. A standard browser `<a>` tag can be used as a fallback within the `GetStartedButton` component to ensure navigation works even if JavaScript fails. Example: `<a href="/tasting-notes/new"><Button>Get Started</Button></a>`.

## 11. Implementation Steps

1.  **Create Page File**: Create the Astro page file at `src/pages/onboarding.astro`.
2.  **Create React View Component**: Create the main React component file at `src/components/views/OnboardingView.tsx`.
3.  **Structure the View**: Inside `OnboardingView.tsx`, add JSX for the main sections: a header, a section for "Key Concepts" with cards for 'Umami' and 'Foam Quality', and a section for "How to Log an Entry". Use appropriate HTML semantics (e.g., `h1`, `h2`, `p`, `section`).
4.  **Style the View**: Apply Tailwind CSS classes to style the `OnboardingView` component for a clean, readable, and responsive layout that works on both mobile and desktop screens.
5.  **Create Button Component**: Create the `src/components/GetStartedButton.tsx` file.
6.  **Implement Button Logic**: Inside `GetStartedButton.tsx`, import the `Button` from `shadcn/ui`. Add an `onClick` handler that uses Astro's `navigate()` function to redirect to `/tasting-notes/new`.
7.  **Assemble the Page**: In `onboarding.astro`, import and render the `OnboardingView` component within the main `Layout`. Ensure the component is loaded with `client:load`.
8.  **Update Middleware**: Modify `src/middleware/index.ts` to include the redirection logic. For authenticated users, if a call to the database reveals they have 0 tasting notes, redirect them to `/onboarding`.
9.  **Testing**: Manually test the flow by creating a new user. Verify they are redirected to `/onboarding` after their first login. Click the "Get Started" button and confirm it navigates to the correct page.
