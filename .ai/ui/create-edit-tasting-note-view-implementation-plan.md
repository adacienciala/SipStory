# View Implementation Plan: Create/Edit Tasting Note

## 1. Overview

This document outlines the implementation plan for the "Create/Edit Tasting Note" view. This view provides a form for users to add new tasting notes or modify existing ones. The form will operate in two modes: "create" for new entries and "edit" for updating existing ones. It will feature autocomplete for brand and region fields, client-side validation, and a clean, accessible user interface.

## 2. View Routing

- **Create Mode:** `/tastings/new`
- **Edit Mode:** `/tastings/[id]/edit`

The view will be rendered by two Astro pages (`new.astro` and `edit.astro`) that import and render the main React form component. The `edit.astro` page will be responsible for fetching the initial tasting note data.

## 3. Component Structure

The view will be composed of the following React components in a hierarchical structure:

```
- TastingForm (Main container component)
  - AutocompleteInput (for Brand)
  - Input (for Blend)
  - AutocompleteInput (for Region)
  - StarRatingInput (for Overall Rating)
  - DotRatingInput (for Umami, Bitter, Sweet, Foam)
  - Textarea (for Notes as Koicha, Notes with Milk)
  - Input (for Price, Purchase Source)
  - Button (for Submit)
  - Spinner (for loading states)
```

## 4. Component Details

### TastingForm

- **Component Description:** The main form component that orchestrates all form inputs and handles state management, validation, and API submission. It adapts its behavior for "create" and "edit" modes based on the `initialData` prop.
- **Main Elements:** A `<form>` element containing various input components from Shadcn/ui and custom components like `AutocompleteInput` and `StarRatingInput`.
- **Handled Interactions:**
  - Form field changes (updates component state).
  - Form submission (triggers validation and API call).
  - Handles loading and error states during submission.
- **Handled Validation:**
  - `brandName`: Required, string, max 255 chars.
  - `blendName`: Required, string, max 255 chars.
  - `overallRating`: Required, number, 1-5.
  - Other fields are validated based on the DTO constraints (e.g., max length, numeric, etc.).
- **Types:** `TastingNoteFormViewModel`, `TastingNoteResponseDTO`, `CreateTastingNoteDTO`, `UpdateTastingNoteDTO`.
- **Props:**
  - `initialData?: TastingNoteResponseDTO`: Pre-populates the form for edit mode. If undefined, the form is in create mode.
  - `brands: string[]`: A list of unique brand names for autocomplete.
  - `regions: string[]`: A list of unique region names for autocomplete.

### AutocompleteInput

- **Component Description:** A reusable combobox component built using Shadcn/ui's `Command` and `Popover` components. It provides a text input with a dropdown list of suggestions that filters as the user types.
- **Main Elements:** `Input`, `Popover`, `Command`.
- **Handled Interactions:**
  - Typing in the input filters the suggestion list.
  - Selecting an item from the list populates the input.
  - Opening/closing the popover.
- **Handled Validation:** None directly; validation is handled by the parent `TastingForm`.
- **Types:** `string`.
- **Props:**
  - `value: string`: The current value of the input.
  - `onChange: (value: string) => void`: Callback when the value changes.
  - `suggestions: string[]`: The list of strings to display as suggestions.
  - `placeholder: string`: Placeholder text for the input.
  - `disabled?: boolean`: Disables the input.

### StarRatingInput / DotRatingInput

- **Component Description:** A visual rating component that allows users to select a rating from 1 to 5 by clicking on stars or dots.
- **Main Elements:** A series of `button` elements, each representing a star or dot.
- **Handled Interactions:**
  - Clicking a star/dot sets the rating.
  - Hovering over stars/dots provides visual feedback.
- **Handled Validation:** None directly.
- **Types:** `number | null`.
- **Props:**
  - `value: number | null`: The current rating value.
  - `onChange: (value: number) => void`: Callback when the rating changes.
  - `disabled?: boolean`: Disables the input.

## 5. Types

### TastingNoteFormViewModel

This ViewModel represents the form's state. It differs from the DTOs by flattening the nested structure and using simple string fields for brand, blend, and region, which is more suitable for form handling.

```typescript
export interface TastingNoteFormViewModel {
  brandName: string;
  blendName: string;
  regionName: string;
  overallRating: number;
  umami: number | null;
  bitter: number | null;
  sweet: number | null;
  foam: number | null;
  notesKoicha: string | null;
  notesMilk: string | null;
  pricePln: number | null;
  purchaseSource: string | null;
}
```

## 6. State Management

A custom hook, `useTastingForm`, will be created to encapsulate the form's logic.

### `useTastingForm(initialData?: TastingNoteResponseDTO)`

- **State:**
  - `formData: TastingNoteFormViewModel`: Holds the current state of all form fields.
  - `errors: Record<keyof TastingNoteFormViewModel, string>`: Stores validation errors for each field.
  - `isSubmitting: boolean`: A flag to indicate when an API call is in progress.
  - `apiError: string | null`: Stores any general error message from the API.
- **Functions:**
  - `handleInputChange`: A generic function to update the `formData` state.
  - `handleSubmit`: A function that validates the form data, and if valid, calls the appropriate API endpoint (create or update). It manages the `isSubmitting` and `apiError` states.
- **Initialization:** The hook will initialize its state from `initialData` if provided (edit mode), otherwise it will use default empty values (create mode).

## 7. API Integration

- **Create Note:**
  - **Action:** On form submission in "create" mode.
  - **Endpoint:** `POST /api/tasting-notes`
  - **Request Type:** `CreateTastingNoteDTO` (transformed from `TastingNoteFormViewModel`).
  - **Response Type:** `TastingNoteResponseDTO`.
  - **Success:** Redirect to the dashboard (`/dashboard`).
- **Update Note:**
  - **Action:** On form submission in "edit" mode.
  - **Endpoint:** `PATCH /api/tasting-notes/[id]`
  - **Request Type:** `UpdateTastingNoteDTO` (transformed from `TastingNoteFormViewModel`).
  - **Response Type:** `TastingNoteResponseDTO`.
  - **Success:** Redirect to the tasting note's detail page (`/tastings/[id]`).

## 8. User Interactions

- **Typing in Fields:** The `formData` state is updated on every keystroke or selection.
- **Field Blur:** Validation can be triggered on blur for instant feedback (optional enhancement).
- **Submitting Form:** Clicking the "Save" button triggers the `handleSubmit` function. The button is disabled, and a spinner is shown while `isSubmitting` is true.
- **Autocomplete Selection:** Selecting an item from the `AutocompleteInput` dropdown updates the corresponding field in the `formData`.
- **Navigating Away:** A `beforeunload` event listener can be used to prompt the user for confirmation if they try to navigate away with unsaved changes.

## 9. Conditions and Validation

- **Required Fields:** `brandName`, `blendName`, and `overallRating` must not be empty. The UI will mark these fields with an asterisk.
- **Ratings:** `overallRating`, `umami`, `bitter`, `sweet`, and `foam` must be integers between 1 and 5.
- **Text Length:** `brandName`, `blendName`, `regionName`, `notesKoicha`, `notesMilk`, and `purchaseSource` must not exceed their respective maximum lengths defined in the API.
- **Price:** `pricePln` must be a non-negative integer.
- **Edit Mode Restrictions:** The `brandName`, `blendName`, and `regionName` fields will be disabled in edit mode, as they cannot be changed via the `PATCH` endpoint.

Validation messages will be displayed below each respective input field when an error is present in the `errors` state object.

## 10. Error Handling

- **Client-Side Validation Errors:** Displayed inline next to the corresponding form fields upon submission (or on blur). The form submission is blocked until all errors are resolved.
- **API Errors (4xx):** If the API returns a validation error (400), the `details` array will be used to populate the `errors` state object. For other client errors (e.g., 401, 404), a general error message will be displayed at the top of the form.
- **Server Errors (5xx):** A generic, user-friendly error message (e.g., "An unexpected error occurred. Please try again.") will be displayed at the top of the form. The full error will be logged to the console for debugging.
- **Network Errors:** A generic error message will be displayed, indicating a potential connectivity issue.

## 11. Implementation Steps

1.  **Create Astro Pages:**
    - Create `src/pages/tastings/new.astro`. This page will fetch the lists of existing brands and regions to pass as props for the autocomplete feature.
    - Create `src/pages/tastings/[id]/edit.astro`. This page will fetch the specific tasting note by its ID, along with the brand/region lists.
2.  **Develop `useTastingForm` Hook:**
    - Implement the state management logic for `formData`, `errors`, `isSubmitting`, and `apiError`.
    - Create the `handleInputChange` and `handleSubmit` functions.
    - Implement the logic to transform the `TastingNoteFormViewModel` into the correct DTO (`CreateTastingNoteDTO` or `UpdateTastingNoteDTO`) before submission.
3.  **Develop UI Components:**
    - Create the reusable `AutocompleteInput` component.
    - Create the reusable `StarRatingInput` and `DotRatingInput` components.
4.  **Develop `TastingForm` Component:**
    - Assemble the form layout using the developed UI components and standard Shadcn/ui inputs.
    - Integrate the `useTastingForm` hook to manage state and actions.
    - Conditionally disable the brand, blend, and region fields based on whether `initialData` is provided.
    - Display loading indicators and error messages.
5.  **Integrate into Astro Pages:**
    - In `new.astro` and `edit.astro`, import and render the `TastingForm` component, passing the fetched data as props.
6.  **Refine and Test:**
    - Thoroughly test both "create" and "edit" modes.
    - Test all validation rules and error handling scenarios.
    - Verify accessibility and responsiveness.
    - Implement the `beforeunload` check for unsaved changes.
