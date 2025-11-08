/**
 * Dashboard View Types
 *
 * This file contains all type definitions specific to the Dashboard view.
 */

import type { PaginationMetaDTO, TastingNoteResponseDTO, TastingNotesQueryDTO } from "../../types";

/**
 * Dashboard ViewModel
 * Encapsulates all state required for the DashboardView component
 */
export interface DashboardViewModel {
  notes: TastingNoteResponseDTO[];
  pagination: PaginationMetaDTO | null;
  isLoading: boolean;
  error: string | null;
  filters: TastingNotesQueryDTO;
  filterOptions: FilterOptions;
  isCompareMode: boolean;
  selectedForCompare: string[];
}

/**
 * Filter Options
 * Dynamic lists of brands and regions available for filtering
 */
export interface FilterOptions {
  brands: { id: string; name: string }[];
  regions: { id: string; name: string }[];
}
