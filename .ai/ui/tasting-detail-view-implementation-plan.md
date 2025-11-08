# View Implementation Plan: Tasting Detail

## 1. Overview

This document outlines the implementation plan for the "Tasting Detail" view. This view serves to display all the recorded information for a single, specific tasting note selected by the user. It will fetch the data from the backend and present it in a clear, read-only format. The view will also provide options for the user to edit or delete the tasting note, with appropriate confirmation for destructive actions.

## 2. View Routing

- **Path**: `/tastings/[id].astro`
- **Accessibility**: This is a protected route. Only authenticated users who own the tasting note should be able to access it. The page should handle cases where the note is not found or the user is not authorized.

## 3. Component Structure

The view will be structured using a main Astro page that fetches data and passes it to a client-side React component for rendering.

```
/src/pages/tastings/[id].astro
└── /src/components/tasting-detail/TastingDetailView.tsx
    ├── HeaderSection (React sub-component)
    │   ├── h1 (Brand & Blend Name)
    │   └── /src/components/ui/button.tsx (Edit, Delete)
    ├── MainDetailsSection (React sub-component)
    │   ├── OverallRatingSection
    │   │   └── /src/components/dashboard/StarRatingDisplay.tsx
    │   ├── ConceptsRatingsSection
    │   │   └── DotRatingDisplay (New component)
    │   └── GeneralInfoSection (Region, Price, Source)
    ├── NotesSection (React sub-component)
    │   ├── KoichaNotes
    │   └── MilkNotes
    └── /src/components/tasting-detail/DeleteConfirmDialog.tsx (New component)
        └── /src/components/ui/dialog.tsx
```

## 4. Component Details

### `[id].astro` (Astro Page)

- **Description**: Server-side page responsible for fetching the tasting note data based on the URL's `id` parameter. It handles authentication, data fetching, and passing the data to the main React component. It also handles loading and error states.
- **Main Elements**: `Layout`, `TastingDetailView`.
- **Handled Logic**:
  - Extracts `id` from `Astro.params`.
  - Redirects to `/login` if the user is not authenticated.
  - Calls `/api/tasting-notes/[id]` to fetch data.
  - Renders a loading state while fetching.
  - Renders an error message if the fetch fails (e.g., 404 Not Found).
  - Passes the fetched `TastingNoteResponseDTO` to `TastingDetailView` on success.

### `TastingDetailView.tsx`

- **Description**: The main client-side component that renders the entire detail view. It receives the tasting note data as a prop and manages the state for the delete confirmation dialog.
- **Main Elements**: `HeaderSection`, `MainDetailsSection`, `NotesSection`, `DeleteConfirmDialog`.
- **Handled Interactions**:
  - Opens the `DeleteConfirmDialog` when the "Delete" button is clicked.
  - Navigates to the edit page when the "Edit" button is clicked.
- **Types**: `TastingDetailViewModel`.
- **Props**:
  - `note: TastingDetailViewModel`

### `DotRatingDisplay.tsx` (New Component)

- **Description**: A small, reusable component to display a rating from 1 to 5 using filled and empty dots.
- **Main Elements**: A `div` containing five `span` elements styled as dots.
- **Handled Validation**: Displays "—" if the `value` prop is `null` or `undefined`.
- **Types**: `number | null | undefined`.
- **Props**:
  - `label: string`
  - `value: number | null | undefined`

### `DeleteConfirmDialog.tsx` (New Component)

- **Description**: A modal dialog that asks the user to confirm the deletion of a tasting note. It handles the API call for deletion.
- **Main Elements**: Uses Shadcn's `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`, `Button`.
- **Handled Interactions**:
  - `onConfirm`: Makes a `DELETE` request to `/api/tasting-notes/[id]`. On success, redirects to the dashboard. On failure, shows an error message.
  - `onCancel`: Closes the dialog.
- **Types**: `string` (for `noteId`).
- **Props**:
  - `isOpen: boolean`
  - `onClose: () => void`
  - `noteId: string`

## 5. Types

### `TastingDetailViewModel`

A new ViewModel will be created to represent the data in a display-friendly format.

```typescript
// To be created in /src/components/tasting-detail/types.ts
export interface TastingDetailViewModel {
  id: string;
  blendName: string;
  brandName: string;
  regionName: string;
  overallRating: number;
  umami: number | null;
  bitter: number | null;
  sweet: number | null;
  foam: number | null;
  notesKoicha: string | null;
  notesMilk: string | null;
  pricePln: string | null; // Formatted as "123 PLN" or "—"
  purchaseSource: {
    text: string;
    isUrl: boolean;
  };
  updatedAt: string; // Formatted as "Month Day, Year"
}
```

This ViewModel will be derived from `TastingNoteResponseDTO` in the `[id].astro` page before being passed to the React component.

## 6. State Management

- **Server-side**: The Astro page will manage the data fetching state (loading, error, success).
- **Client-side**: `TastingDetailView.tsx` will manage the visibility of the `DeleteConfirmDialog` using a simple `useState` hook.
  ```typescript
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  ```

## 7. API Integration

- **GET `/api/tasting-notes/[id]`**:
  - **Request**: The `id` is taken from the URL parameter. The request is made server-side in `[id].astro`.
  - **Response**: The page expects a `TastingNoteResponseDTO` object on success.
- **DELETE `/api/tasting-notes/[id]`**:
  - **Request**: Made from the `DeleteConfirmDialog` component when the user confirms deletion.
  - **Response**: Expects a `204 No Content` on success. The component will then redirect the user to `/dashboard`.

## 8. User Interactions

- **View Data**: The user views all tasting note details, which are statically displayed.
- **Edit Note**: User clicks the "Edit" button, which navigates them to `/tastings/[id]/edit`.
- **Delete Note**:
  1. User clicks the "Delete" button.
  2. The `DeleteConfirmDialog` opens.
  3. If the user clicks "Confirm," the `DELETE` API call is made.
  4. If the user clicks "Cancel," the dialog closes.

## 9. Conditions and Validation

- **Data Presence**: Optional fields (`umami`, `bitter`, `sweet`, `foam`, notes, price, source) that are `null` in the DTO will be displayed as "—" to ensure a consistent layout.
- **Purchase Source**: The `purchase_source` string will be validated to check if it is a valid URL. If it is, it will be rendered as a clickable `<a>` tag; otherwise, it will be plain text.
- **Authentication**: The Astro page will check for an active user session. If none exists, it will redirect to `/login`.
- **Authorization**: The backend API (Supabase RLS) ensures a user can only fetch notes they own. The Astro page will handle a 404 error from the API by displaying a "Not Found" message, which covers both non-existent notes and notes owned by other users.

## 10. Error Handling

- **Note Not Found (404)**: If the API returns a 404, the `[id].astro` page will render a dedicated error component or message (e.g., "Tasting note not found.").
- **Unauthorized (401/403)**: If the user is not logged in, the Astro page middleware will redirect to `/login`.
- **Server Error (500)**: If the API returns a 500 error, a generic "An unexpected error occurred" message will be displayed.
- **Deletion Failure**: If the `DELETE` request fails from the dialog, a toast notification or an inline error message will inform the user that the deletion failed.

## 11. Implementation Steps

1.  **Create Astro Page**: Create `/src/pages/tastings/[id].astro`. Implement server-side data fetching logic, including loading and error states.
2.  **Create ViewModel**: Define the `TastingDetailViewModel` in `/src/components/tasting-detail/types.ts`. Create a mapper function in the Astro page to convert the DTO to the ViewModel.
3.  **Create `DotRatingDisplay` Component**: Build the new reusable `DotRatingDisplay.tsx` component for displaying dot-based ratings.
4.  **Create `DeleteConfirmDialog` Component**: Build the `DeleteConfirmDialog.tsx` component, including the API call logic for deletion and subsequent redirection.
5.  **Create `TastingDetailView` Component**: Build the main `TastingDetailView.tsx` component that receives the ViewModel and arranges all the data for display.
    - Implement the header with brand/blend and action buttons.
    - Implement the section for overall and structured ratings.
    - Implement the section for general info (region, price, source), ensuring the purchase source is a conditional link.
    - Implement the section for Koicha and Milk notes.
6.  **Integrate Components**: Import and use all the created React components within the `[id].astro` page, passing the fetched and mapped data as props.
7.  **Update Dashboard Link**: Ensure that each `TastingCard` on the dashboard page links to the correct detail page (e.g., `/tastings/${note.id}`).
8.  **Styling**: Apply Tailwind CSS for layout and styling to ensure the view is responsive and matches the application's design system.
9.  **Testing**: Manually test all user interactions, including successful data display, handling of optional fields, edit navigation, and the full delete-and-confirm flow. Test error states like 404s.
