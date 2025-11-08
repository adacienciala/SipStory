/**
 * Type definitions for Tasting Form components
 */

import type { TastingNoteResponseDTO } from "../../types";

/**
 * ViewModel for the tasting form state
 * Flattens the nested structure from the API for easier form handling
 */
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

/**
 * Props for the TastingForm component
 */
export interface TastingFormProps {
  /** Pre-populated data for edit mode (undefined = create mode) */
  initialData?: TastingNoteResponseDTO;
  /** List of brand names for autocomplete */
  brands: string[];
  /** List of region names for autocomplete */
  regions: string[];
  /** List of blend names for autocomplete */
  blends: string[];
}

/**
 * Props for AutocompleteInput component
 */
export interface AutocompleteInputProps {
  /** Current value of the input */
  value: string;
  /** Callback when value changes */
  onChange: (value: string) => void;
  /** List of suggestions to display */
  suggestions: string[];
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
