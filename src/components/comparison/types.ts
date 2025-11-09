import type { TastingNoteResponseDTO } from "../../types";

/**
 * View model for comparison data
 * Contains exactly two tasting notes to be compared side-by-side
 */
export interface ComparisonViewModel {
  note1: TastingNoteResponseDTO;
  note2: TastingNoteResponseDTO;
}

/**
 * View model for a single row in the comparison table
 * Represents one attribute being compared across both notes
 */
export interface ComparisonRowViewModel {
  label: string;
  value1: string | number | React.ReactNode | null;
  value2: string | number | React.ReactNode | null;
  type: "text" | "star" | "dot";
}
