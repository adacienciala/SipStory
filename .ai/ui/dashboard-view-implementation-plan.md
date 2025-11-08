# View Implementation Plan: Dashboard

## 1. Overview

The Dashboard View is the central hub for authenticated users to view, manage, and interact with their personal matcha tasting notes. It displays a list of all tasting entries, provides robust filtering and sorting capabilities, and serves as the entry point for creating new notes or comparing existing ones. The view is designed to be responsive, offering an optimal experience on both desktop and mobile devices, and includes loading and empty states for a smooth user experience.

## 2. View Routing

- **Path**: `/dashboard`
- **Access**: This is a protected route. Unauthenticated users attempting to access it will be redirected to the `/login` page. If an authenticated user has no tasting notes, they will be redirected to `/onboarding`.

## 3. Component Structure

The view will be composed of the following React components, organized within the Astro page (`/src/pages/dashboard.astro`).

```
- DashboardView (React Client Component)
  - Header
    - Title ("My Tastings")
    - AddNewButton (Links to new tasting note page)
    - CompareToggleButton (Activates/deactivates compare mode)
    - FilterToggleButton (Opens/closes filter panel on mobile)
  - FilterPanel (Desktop: sidebar, Mobile: drawer/modal)
    - BrandFilter (Multi-select dropdown)
    - RegionFilter (Multi-select dropdown)
    - RatingFilter (Star rating input)
    - ClearFiltersButton
  - TastingNotesGrid
    - if (loading):
      - TastingCardSkeleton (Array of skeletons)
    - if (has notes):
      - TastingCard (Array of cards, mapped from data)
  - FloatingActionButton (Mobile only, for "Add New")
```

## 4. Component Details

### `DashboardView`

- **Description**: The main container component that orchestrates the entire view. It fetches data, manages the overall state (filters, compare mode, loading status), and renders all child components.
- **Main Elements**: `div` container, `Header`, `FilterPanel`, `TastingNotesGrid`.
- **Handled Interactions**: Manages state changes from all child components.
- **Types**: `DashboardViewModel`, `TastingNoteResponseDTO`, `TastingNotesQueryDTO`.
- **Props**: None.

### `FilterPanel`

- **Description**: A form containing various filter controls. It allows users to refine the list of tasting notes. On desktop, it's a persistent sidebar; on mobile, it's a collapsible drawer.
- **Main Elements**: `form`, `BrandFilter` (custom select), `RegionFilter` (custom select), `RatingFilter` (star input), `Button` (for "Clear Filters").
- **Handled Interactions**:
  - `onBrandChange(brand_ids: string[])`: Updates the `brand_ids` filter.
  - `onRegionChange(region_ids: string[])`: Updates the `region_ids` filter.
  - `onRatingChange(min_rating: number)`: Updates the `min_rating` filter.
  - `onClearFilters()`: Resets all filters to their default state.
- **Types**: `FilterOptions`, `TastingNotesQueryDTO`.
- **Props**:
  - `filters: TastingNotesQueryDTO`
  - `onFilterChange: (newFilters: TastingNotesQueryDTO) => void`
  - `filterOptions: FilterOptions`

### `TastingNotesGrid`

- **Description**: Displays the grid of tasting notes. It handles rendering the loading state (skeletons) or the actual `TastingCard` components based on the current state.
- **Main Elements**: `div` (grid container).
- **Handled Interactions**:
  - `onSelectForCompare(noteId: string)`: Adds or removes a note ID from the comparison selection.
- **Types**: `TastingNoteResponseDTO`.
- **Props**:
  - `notes: TastingNoteResponseDTO[]`
  - `isLoading: boolean`
  - `isCompareMode: boolean`
  - `selectedNoteIds: string[]`
  - `onSelectNote: (noteId: string) => void`

### `TastingCard`

- **Description**: A card that displays a summary of a single tasting note. It includes a checkbox that is visible only in "compare mode".
- **Main Elements**: `Card` (Shadcn), `h3` (Blend Name), `p` (Brand & Region), `StarRatingDisplay`, `Checkbox` (for compare mode).
- **Handled Interactions**:
  - `onCheckboxChange()`: Triggers the `onSelectNote` prop.
  - `onClick`: Navigates to the detailed view for that tasting note.
- **Types**: `TastingNoteResponseDTO`.
- **Props**:
  - `note: TastingNoteResponseDTO`
  - `isCompareMode: boolean`
  - `isSelected: boolean`
  - `onSelect: (noteId: string) => void`

### `TastingCardSkeleton`

- **Description**: A skeleton loader component that mimics the layout of a `TastingCard` to provide visual feedback while data is being fetched.
- **Main Elements**: `div` with animated placeholder elements for text and ratings.
- **Props**: None.

## 5. Types

### `DashboardViewModel`

This new ViewModel will encapsulate all the state required for the `DashboardView` component.

```typescript
interface DashboardViewModel {
  notes: TastingNoteResponseDTO[];
  pagination: PaginationMetaDTO | null;
  isLoading: boolean;
  error: string | null;
  filters: TastingNotesQueryDTO;
  filterOptions: FilterOptions;
  isCompareMode: boolean;
  selectedForCompare: string[];
}
```

### `FilterOptions`

This type will hold the dynamic lists of brands and regions available for filtering, fetched from the user's data.

```typescript
interface FilterOptions {
  brands: { id: string; name: string }[];
  regions: { id: string; name: string }[];
}
```

## 6. State Management

State will be managed within the `DashboardView` component using React hooks. A custom hook, `useDashboardState`, will be created to encapsulate the logic for data fetching, state updates, and filter management.

### `useDashboardState`

- **Purpose**: To centralize all business logic for the dashboard, keeping the `DashboardView` component clean and focused on rendering.
- **Managed State**:
  - `notes`, `pagination`, `isLoading`, `error`: For the main data fetching.
  - `filters`: The current state of all query filters.
  - `filterOptions`: The available brands and regions for the filter dropdowns.
  - `isCompareMode`, `selectedForCompare`: For the comparison feature.
- **Exposed Functions**:
  - `setFilters`: A function to update filter values and trigger a data refetch.
  - `toggleCompareMode`: Toggles the comparison UI.
  - `handleSelectNote`: Manages the `selectedForCompare` array.

## 7. API Integration

The view will primarily interact with the `GET /api/tasting-notes` endpoint.

- **Request**: The `useDashboardState` hook will construct a request to this endpoint. The query parameters will be derived from the `filters` state object.
  - **Request Type**: `TastingNotesQueryDTO`
- **Response**: The fetched data will be used to update the `notes` and `pagination` state.
  - **Response Type**: `TastingNotesListResponseDTO`
- **Data Fetching**: An initial fetch will occur on component mount. Subsequent fetches will be triggered whenever the `filters` state changes. A debouncing mechanism will be applied to filter inputs to prevent excessive API calls.

## 8. User Interactions

- **Filtering**: User selects an option from a filter dropdown. The `onFilterChange` callback updates the `filters` state in `useDashboardState`, which triggers a debounced API call. The `TastingNotesGrid` re-renders with the new data.
- **Adding a Note**: User clicks the "Add New" button (header or FAB). The app navigates to the "create tasting note" page.
- **Comparing Notes**:
  1. User clicks the "Compare" toggle button in the header.
  2. `isCompareMode` state becomes `true`.
  3. `TastingCard` components re-render to show checkboxes.
  4. User selects two cards. `selectedForCompare` array is updated.
  5. A "Compare" button becomes enabled (not described in detail, but implied). Clicking it would navigate to the comparison view with the selected note IDs.
- **Viewing Details**: User clicks anywhere on a `TastingCard` (that isn't the checkbox). The app navigates to the detailed view for that specific note (e.g., `/tastings/[id]`).

## 9. Conditions and Validation

- **Authentication**: Handled by Astro middleware. If the user is not logged in, they are redirected before the page component loads.
- **Empty State**: On initial load, if the API returns an empty `data` array and it's the user's first visit (or they have no notes), the `dashboard.astro` page will perform a server-side redirect to `/onboarding`.
- **Filter Validation**: The `FilterPanel` will ensure that only valid filter values can be selected. For example, the rating filter will be constrained to 1-5.
- **Comparison Selection**: The UI will enforce that only two notes can be selected for comparison. The "Compare" action button will be disabled until exactly two notes are selected.

## 10. Error Handling

- **API Fetch Error**: If the `GET /api/tasting-notes` call fails, the `useDashboardState` hook will set an `error` message in the state. The `DashboardView` will display a user-friendly error message (e.g., "Could not load tastings. Please try again later.") instead of the notes grid.
- **No Results**: If the API call is successful but returns no notes matching the current filters, the `TastingNotesGrid` will display an empty state with "No results found" and a CTA to create their specified tasting.

## 11. Implementation Steps

1.  **Create File Structure**:
    - Create `src/pages/dashboard.astro`.
    - Create `src/components/dashboard/DashboardView.tsx`.
    - Create other required components: `FilterPanel.tsx`, `TastingNotesGrid.tsx`, `TastingCard.tsx`, `TastingCardSkeleton.tsx` inside `src/components/dashboard/`.
2.  **Implement `dashboard.astro`**:
    - Add logic to check for an authenticated user via `Astro.locals`. Redirect if not present.
    - Fetch initial tasting notes. If the list is empty, perform a redirect to `/onboarding`.
    - Render the `<DashboardView client:load />` component, passing initial data as props.
3.  **Develop `useDashboardState` Hook**:
    - Implement the state management logic using `useState` and `useEffect`.
    - Write the data fetching logic, including parameter construction for the API call.
    - Add functions for updating filters, toggling compare mode, and handling note selection.
    - Implement debouncing for filter changes.
4.  **Build UI Components**:
    - Start with the static components: `TastingCardSkeleton` and a basic `TastingCard`.
    - Implement the `TastingNotesGrid` to conditionally render skeletons or cards.
    - Build the `FilterPanel` with dropdowns and inputs, connecting them to the props passed from `DashboardView`.
    - Assemble the main `DashboardView` component, integrating the hook and all child components.
5.  **API and Type Integration**:
    - Ensure all components use the correct DTOs and ViewModel types from `src/types.ts` and the newly defined types.
    - Connect the `fetch` call to the `GET /api/tasting-notes` endpoint.
6.  **Refine and Test**:
    - Implement responsive styles for mobile and desktop layouts.
    - Add the `FloatingActionButton` for mobile.
    - Test all user interactions: filtering, clearing filters, entering/exiting compare mode, and selecting notes.
    - Test all states: loading, error, empty results, and populated list.
