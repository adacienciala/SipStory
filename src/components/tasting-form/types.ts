/**
 * Type definitions for Tasting Form components
 */

import type { TastingNoteResponseDTO } from "../../types";

/**
 * ViewModel for the tasting form state
 * Flattens the nested structure from the API for easier form handling
 */
export interface TastingNoteFormViewModel {
  brandId: string | null;
  brandName: string;
  blendId: string | null;
  blendName: string;
  regionId: string | null;
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

/**
 * Props for the TastingForm component
 */
export interface TastingFormProps {
  /** Pre-populated data for edit mode (undefined = create mode) */
  initialData?: TastingNoteResponseDTO;
}

/**
 * Autocomplete option with ID and name
 */
export interface AutocompleteOption {
  id: string;
  name: string;
}

/**
 * Props for AutocompleteInput component
 */
export interface AutocompleteInputProps {
  /** Current value of the input */
  value: string;
  /** Callback when value changes */
  onChange: (id: string | null, name: string) => void;
  /** List of suggestions to display */
  suggestions: AutocompleteOption[];
  /** Placeholder text */
  placeholder: string;
  /** Label for accessibility */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** Whether component is loading data */
  isLoading?: boolean;
}

/**
 * Props for StarRatingInput component
 */
export interface StarRatingInputProps {
  /** Current rating value (1-5) */
  value: number | null;
  /** Callback when rating changes */
  onChange: (value: number) => void;
  /** Label for accessibility */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Props for DotRatingInput component
 */
export interface DotRatingInputProps {
  /** Current rating value (1-5) */
  value: number | null;
  /** Callback when rating changes */
  onChange: (value: number | null) => void;
  /** Label for accessibility */
  label: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
}

/**
 * Form validation errors
 */
export interface TastingFormErrors {
  brandName?: string;
  blendName?: string;
  regionName?: string;
  overallRating?: string;
  umami?: string;
  bitter?: string;
  sweet?: string;
  foam?: string;
  notesKoicha?: string;
  notesMilk?: string;
  pricePln?: string;
  purchaseSource?: string;
}
