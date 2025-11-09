# UI Architecture for SipStory

## 1. UI Structure Overview

The SipStory UI architecture is designed to be a responsive, mobile-first web application built on a modern tech stack. It leverages Astro for the static shell and server-side rendering, with interactive "islands" powered by React and Shadcn/ui components. This hybrid approach ensures fast page loads while providing a rich, dynamic user experience for core features like forms and filtering.

The structure is centered around a few key views: a dashboard for listing tasting notes, a detailed view for individual notes, a form for creation/editing, and specialized views for onboarding and comparison. Navigation is optimized for different viewports, using a top header on desktop and a combination of a header and a Floating Action Button (FAB) on mobile. The architecture prioritizes accessibility (WCAG 2.1 AA), security (leveraging Supabase RLS and proper authentication flows), and a seamless user experience through optimistic UI patterns and clear, consistent design.

## 2. View List

### 2.1. Authentication Views (Login/Register)

**Status:** ✅ **Implemented**

- **View Path**: `/login`, `/register`
- **Main Purpose**: To allow users to sign in to their existing account or create a new one.
- **Key Information to Display**: Email and password input fields, submission buttons, links to toggle between login and registration.
- **Key View Components**: `Input`, `Button`, `Label` (from Shadcn/ui).
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Clear error messages for invalid credentials or failed registration.
  - **Accessibility**: Proper form labeling, keyboard navigation, and visible focus states.
  - **Security**: All authentication is handled by Supabase Auth over HTTPS. These pages are the entry point to protected routes.

### 2.2. Onboarding Screen

**Status:** ✅ **Implemented**

- **View Path**: `/onboarding`
- **Main Purpose**: To educate first-time users on key matcha tasting concepts and guide them on how to create their first entry.
- **Key Information to Display**: Explanations of terms like 'umami' and 'foam quality', a brief guide to the app's functionality, and a "Get Started" call-to-action.
- **Key View Components**: `Button`, static text and informational graphics.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Displayed only when a user has zero tasting notes. Subsequently accessible via a "Help" link.
  - **Accessibility**: Content should be easily readable and navigable.
  - **Security**: This route is protected and only accessible to authenticated users.

### 2.3. Dashboard (Tasting Notes List)

**Status:** ✅ **Implemented**

- **View Path**: `/dashboard`
- **Main Purpose**: To display a list of the user's personal tasting notes and serve as the main hub for navigation and actions like filtering and comparison.
- **Key Information to Display**:
  - A list of tasting cards, each showing: Matcha Blend Name, Brand, Region, Overall Rating (stars), and Creation Date.
  - When no tasting notes, navigate to /onboarding
- **Key View Components**: `TastingCard`, `TastingCardSkeleton`, `FilterPanel`, `Button` (for "Add New" and "Compare"), `FloatingActionButton` (mobile), `Badge` (for active filter count).
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Skeleton screens provide loading feedback. Optimistic UI for deletions. A "Compare" mode is activated via a header icon, revealing checkboxes on cards.
  - **Accessibility**: Proper heading structure, ARIA labels for icon buttons, and keyboard-navigable filter controls.
  - **Security**: This is a protected route. Data is fetched based on the authenticated user's ID, enforced by Supabase RLS.

### 2.4. Tasting Detail View

**Status:** ✅ **Implemented**

- **View Path**: `/tastings/[id]`
- **Main Purpose**: To display all recorded information for a single tasting note.
- **Key Information to Display**: All fields from the tasting note, including brand, blend, region, all ratings (overall, umami, bitter, sweet, foam), koicha/milk notes, price, and purchase source.
- **Key View Components**: `StarRating`, `DotRating`, `Button` (for Edit/Delete), `DeleteConfirmDialog`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Empty optional fields are displayed with a "—" to maintain layout consistency. Purchase source is a clickable link if it's a valid URL. Deletion requires confirmation in a modal dialog.
  - **Accessibility**: Semantic HTML for content structure, ARIA attributes for interactive elements, and descriptive labels for all data points.
  - **Security**: Protected route. Supabase RLS ensures a user can only view their own notes.

### 2.5. Create/Edit Form

**Status:** ✅ **Implemented**

- **View Path**: `/tastings/new`, `/tastings/[id]/edit`
- **Main Purpose**: To provide a form for users to create a new tasting note or update an existing one.
- **Key Information to Display**: A form with inputs for all tasting note fields. Required fields are clearly marked.
- **Key View Components**: `TastingForm`, `AutocompleteInput` (Combobox), `StarRatingInput`, `DotRatingInput`, `Input`, `Textarea`, `Button`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: Autocomplete for brand, blend, and region suggests from the user's history. Validation errors are shown inline. A browser confirmation dialog prevents accidental navigation away from an unsaved form.
  - **Accessibility**: All form fields have labels. Required fields are indicated with an asterisk. Error messages are associated with their respective inputs.
  - **Security**: Input is validated on the client and server (via Zod schemas) to prevent invalid data submission.

### 2.6. Comparison View

**Status:** ✅ **Implemented**

- **View Path**: `/tastings/compare?ids=[id1],[id2]`
- **Main Purpose**: To display two selected tasting notes side-by-side for direct comparison.
- **Key Information to Display**: All fields for both selected tasting notes, arranged for easy comparison.
- **Key View Components**: `ComparisonView`, `ComparisonTable`, `ComparisonCard`, `ComparisonRow`, `StarRatingDisplay`, `DotRatingDisplay`.
- **UX, Accessibility, and Security Considerations**:
  - **UX**: On desktop, a two-column table layout is used. On mobile, a stacked vertical layout with cards for each tasting note ensures readability. Loading states and error messages provide clear feedback. "Back to Dashboard" button for easy navigation.
  - **Accessibility**: Table structure with proper headers for desktop. Definition lists for mobile. Data is laid out in a logical order that is understandable by screen readers. ARIA labels for interactive elements.
  - **Security**: Protected route. The backend validates that both requested note IDs belong to the authenticated user. Client-side UUID validation prevents malformed requests.

## 3. User Journey Map

The user journey is designed to be intuitive, guiding users from initial registration to core app functionality.

1.  **First-Time User Flow**:
    - A new user lands on the `/register` page.
    - After successful registration, they are redirected to the `/onboarding` screen.
    - Clicking the CTA takes them to `/tastings/new`.

2.  **Creating a Tasting Note**:
    - From the `/onboarding` (later from `/dashboard`), the user clicks the "Get Started" button (header on desktop, FAB on mobile).
    - They are navigated to the `/tastings/new` form.
    - They fill out the form, using autocomplete suggestions for brand, blend, and region.
    - Upon saving, they are redirected back to the `/dashboard`. The UI updates optimistically, showing the new note at the top of the list, followed by a success toast.

3.  **Viewing and Editing a Note**:
    - On the `/dashboard`, the user clicks a tasting card.
    - They are navigated to the detail view at `/tastings/[id]`.
    - From the detail view, they click "Edit", which takes them to `/tastings/[id]/edit` with the form pre-filled.
    - After saving changes, they are returned to the detail view at `/tastings/[id]`, where the UI has been optimistically updated.

4.  **Comparing Two Notes**:
    - On the `/dashboard`, the user clicks the "Compare" icon in the header.
    - Checkboxes appear on each tasting card.
    - The user selects two cards. A "Compare Selected" button appears.
    - Clicking the button navigates them to `/compare?ids=[id1],[id2]`, where they can see the side-by-side comparison.

5.  **Filtering the List**:
    - On the `/dashboard`, the user clicks the "Filter" icon.
    - A filter panel opens (bottom sheet on mobile, collapsible section on desktop).
    - The user applies filters (e.g., by brand, minimum rating).
    - The list on the dashboard updates to show only matching results, and a badge appears on the filter icon indicating the number of active filters.
    - In case of empty no matching tastings, shows an empty state with "No results found" and a CTA to create their specified tasting

## 4. Layout and Navigation Structure

The navigation is designed to be simple and viewport-adaptive, providing easy access to primary actions.

- **Desktop (≥768px)**:
  - A persistent top header contains:
    - **Left**: Logo (links to dashboard).
    - **Right**: User menu (for logout, help).
  - A Dashboard subheader contains:
    - **Left**: "Add New Tasting" button.
    - **Left** "Filter" icon button
    - **Right** "Compare" icon button,

- **Mobile (<768px)**:
  - A persistent top header contains:
    - **Left**: Logo (links to dashboard).
    - **Right**: User menu (for logout, help).
  - A Dashboard subheader contains:
    - **Left** "Filter" icon button
    - **Right** "Compare" icon button,
    - A **Floating Action Button (FAB)** with a "+" icon is fixed to the bottom-right of the screen for creating a new tasting note. This placement is optimized for thumb reachability.

- **Routing**: The application uses a file-based routing system provided by Astro. This enables deep linking to specific tasting notes (`/tastings/[id]`) and comparison views, ensuring predictable browser history behavior.

## 5. Key Components

These are the primary, reusable React components that will form the building blocks of the user interface.

- **`TastingCard`**: A component to display a summary of a tasting note on the dashboard. Includes brand, blend, overall rating, and date.
- **`TastingCardSkeleton`**: A skeleton/placeholder version of `TastingCard` used to indicate loading states on the dashboard.
- **`FilterPanel`**: The UI for filtering tasting notes by brand, region, and rating. Adapts its presentation for mobile and desktop.
- **`StarRating`**: An interactive 5-star component for setting and displaying the `overall_rating`.
- **`DotRating`**: An interactive 5-dot component for the detailed ratings (`umami`, `bitter`, `sweet`, `foam_quality`).
- **`AutocompleteInput`**: A text input combined with a dropdown (Shadcn/ui Combobox) that suggests previously used values for brand, blend, and region.
- **`DeleteConfirmDialog`**: A modal (Shadcn/ui AlertDialog) that asks for user confirmation before a destructive delete action.
- **`TastingForm`**: A comprehensive form component encapsulating all inputs and logic for creating and editing a tasting note.
- **`ComparisonView`**: A component that takes two tasting note objects and renders them in a comparative layout.
- **`FloatingActionButton`**: A mobile-only button for initiating the "create new tasting" flow.
