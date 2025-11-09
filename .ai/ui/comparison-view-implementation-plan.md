# View Implementation Plan: Comparison View

## 1. Overview

The Comparison View is a dedicated page that allows authenticated users to see a side-by-side comparison of two of their tasting notes. The view fetches data for the two selected notes from the API and displays all their attributes in a clear, comparable format. The layout is responsive, showing a two-column table on desktop and a stacked, scrollable view on mobile devices. This view is a protected route and requires user authentication.

## 2. View Routing

The Comparison View will be accessible at the following path:

- **Path**: `/tastings/compare`
- **Query Parameters**: `ids` (a comma-separated string of two tasting note UUIDs)
- **Example**: `/tastings/compare?ids=uuid1,uuid2`

## 3. Component Structure

The view will be composed of the following React components, rendered within an Astro page (`/src/pages/tastings/compare.astro`).

```
- ComparisonView (Client-side React Component)
  - ComparisonTable
    - ComparisonRow
    - DotRatingDisplay
    - StarRatingDisplay
  - ComparisonCard (for mobile view)
    - DotRatingDisplay
    - StarRatingDisplay
  - LoadingSpinner
  - ErrorMessage
```

## 4. Component Details

### `ComparisonView`

- **Component Description**: The main container component that orchestrates data fetching, state management, and conditional rendering of its children based on the data loading status (loading, success, error). It handles the responsive switch between the desktop table view and the mobile card view.
- **Main Elements**: A container `div` that conditionally renders `LoadingSpinner`, `ErrorMessage`, `ComparisonTable` (desktop), or two `ComparisonCard` components (mobile).
- **Handled Interactions**: None directly. It passes data down to child components.
- **Handled Validation**:
  - Checks if the `ids` query parameter from the URL contains exactly two valid UUIDs before fetching data.
  - Displays an error message if validation fails.
- **Types**: `ComparisonViewModel`, `TastingNoteResponseDTO`
- **Props**: None. It reads `ids` from the URL query parameters.

### `ComparisonTable` (Desktop)

- **Component Description**: A table that presents the data for two tasting notes in a side-by-side, two-column layout. Each row of the table represents a specific attribute (e.g., Brand, Umami, Price), making direct comparison easy.
- **Main Elements**: An HTML `<table>` element. The first column serves as the header for the attribute being compared. The second and third columns display the values for the first and second tasting notes, respectively.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: `ComparisonViewModel`
- **Props**:
  - `viewModel: ComparisonViewModel`: The data object containing the two notes to display.

### `ComparisonRow`

- **Component Description**: A reusable row component for the `ComparisonTable`. It displays a label and the corresponding values for both tasting notes. It can render simple text, `StarRatingDisplay`, or `DotRatingDisplay` based on the attribute.
- **Main Elements**: A `<tr>` containing three `<td>` elements: one for the label and two for the values.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: `ComparisonRowViewModel`
- **Props**:
  - `row: ComparisonRowViewModel`: The data for the row, including the label and values for both notes.

### `ComparisonCard` (Mobile)

- **Component Description**: A card component used for the mobile layout. Two cards will be rendered vertically. Each card displays all the information for a single tasting note in a structured list format.
- **Main Elements**: A `Card` component from Shadcn/ui containing a `CardHeader` with the blend name and a `CardContent` with a definition list (`<dl>`) of all tasting note attributes.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: `TastingNoteResponseDTO`
- **Props**:
  - `note: TastingNoteResponseDTO`: The tasting note data to display.

## 5. Types

### `ComparisonViewModel`

This new ViewModel will structure the data for easy rendering in the comparison table.

```typescript
export interface ComparisonViewModel {
  note1: TastingNoteResponseDTO;
  note2: TastingNoteResponseDTO;
}
```

### `ComparisonRowViewModel`

This type will define the data structure for a single row in the `ComparisonTable`.

```typescript
export interface ComparisonRowViewModel {
  label: string;
  value1: string | number | React.ReactNode | null;
  value2: string | number | React.ReactNode | null;
  type: "text" | "star" | "dot";
}
```

## 6. State Management

State will be managed within the `ComparisonView` component using a custom hook, `useComparisonState`.

### `useComparisonState`

- **Purpose**: To encapsulate the logic for fetching, validating, and managing the state of the comparison data.
- **State Variables**:
  - `viewModel: ComparisonViewModel | null`: Stores the successfully fetched and processed comparison data.
  - `isLoading: boolean`: Tracks the data fetching status.
  - `error: string | null`: Stores any error messages from API calls or validation.
- **Functions**:
  - `fetchComparisonNotes(ids: string[])`: The function responsible for calling the API endpoint `/api/tasting-notes/select` and updating the state variables based on the response.

## 7. API Integration

- **Endpoint**: `GET /api/tasting-notes/select`
- **Request**: The `fetchComparisonNotes` function in `useComparisonState` will make a `GET` request to this endpoint.
  - **Query Parameter**: `ids` (e.g., `?ids=uuid1,uuid2`)
- **Response Types**:
  - **Success (200)**: `SelectNotesResponseDTO` which is `{ notes: [TastingNoteResponseDTO, TastingNoteResponseDTO] }`. The hook will process this into the `ComparisonViewModel`.
  - **Error (4xx, 5xx)**: `ErrorResponseDTO` which is `{ error: string }`. The hook will capture the error message and store it in the `error` state.

## 8. User Interactions

The primary interaction is the user arriving at the page. The component then automatically fetches and displays the data. There are no interactive elements like buttons or forms in this view. The user's main action is to read and compare the displayed information.

## 9. Conditions and Validation

- **URL Parameter Validation**: On component mount, the `useComparisonState` hook will parse the `ids` from the URL's query string.
  - It will verify that there are exactly two IDs.
  - It will use a regex or a library like Zod to validate that both IDs are in UUID format.
  - If validation fails, the `error` state will be set, and an error message will be displayed to the user, preventing an unnecessary API call.
- **Authentication**: The Astro page (`compare.astro`) will check for an authenticated user. If the user is not logged in, it will redirect them to the `/login` page.

## 10. Error Handling

- **Invalid URL**: If the `ids` parameter is missing, malformed, or does not contain two valid UUIDs, the UI will display an error message like "Invalid comparison request. Please select two tasting notes from the dashboard."
- **API Errors**:
  - **401 Unauthorized**: The Astro middleware should handle this by redirecting to the login page.
  - **404 Not Found**: The UI will display a message like "One or more tasting notes could not be found."
  - **500 Internal Server Error**: The UI will display a generic error message like "An unexpected error occurred. Please try again later."
- **Loading State**: While data is being fetched, a loading spinner will be displayed to provide feedback to the user.

## 11. Implementation Steps

1.  **Create Astro Page**: Create the file `/src/pages/tastings/compare.astro`. Implement authentication logic to protect the route and redirect unauthenticated users. Render the `ComparisonView` component with `client:load`.
2.  **Create ViewModels**: Add the `ComparisonViewModel` and `ComparisonRowViewModel` types to a new file at `/src/components/comparison/types.ts`.
3.  **Implement `useComparisonState` Hook**: Create the file `/src/components/hooks/useComparisonState.ts`. Implement the state logic, URL validation, and the `fetchComparisonNotes` function to call the API.
4.  **Implement Child Components**: Create the `ComparisonTable`, `ComparisonRow`, and `ComparisonCard` components. These will be simple, presentational components that receive data via props.
5.  **Implement `ComparisonView` Component**: Create the main component file `/src/components/comparison/ComparisonView.tsx`.
    - Use the `useComparisonState` hook to manage state.
    - Implement conditional rendering for loading, error, and success states.
    - Use Tailwind CSS media queries (`md:`, `lg:`) to switch between rendering `ComparisonTable` on desktop and `ComparisonCard`s on mobile.
6.  **Update Dashboard (Separate Task)**: Ensure the dashboard page has the functionality to select two tasting notes and navigate to the `/tastings/compare` URL with the correct `ids` query parameter.
7.  **Styling**: Apply Tailwind CSS classes to all components to match the application's design system, ensuring the view is responsive and accessible.
8.  **Testing**: Manually test all scenarios: successful data load, loading state, invalid UUIDs, missing notes (404), and server errors.
