import { useCallback, useEffect, useState } from "react";
import type { TastingNotesListResponseDTO, TastingNotesQueryDTO } from "../../types";
import type { DashboardViewModel } from "./types";

/**
 * Custom hook for managing dashboard state
 *
 * Centralizes all business logic for the dashboard:
 * - Data fetching with debouncing
 * - Filter state management
 * - Compare mode logic
 * - Loading and error states
 */
export function useDashboardState(initialData?: TastingNotesListResponseDTO) {
  const [state, setState] = useState<DashboardViewModel>({
    notes: initialData?.data || [],
    pagination: initialData?.pagination || null,
    isLoading: false,
    error: null,
    filters: {
      page: 1,
      limit: 12,
      sort_by: "created_at",
      sort_order: "desc",
    },
    filterOptions: {
      brands: [],
      regions: [],
    },
    isCompareMode: false,
    selectedForCompare: [],
  });

  // Fetch filter options (brands and regions)
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [brandsResponse, regionsResponse] = await Promise.all([
        fetch("/api/brands?limit=100"),
        fetch("/api/regions?limit=100"),
      ]);

      if (!brandsResponse.ok || !regionsResponse.ok) {
        throw new Error("Failed to fetch filter options");
      }

      const brandsData = await brandsResponse.json();
      const regionsData = await regionsResponse.json();

      setState((prev) => ({
        ...prev,
        filterOptions: {
          brands: brandsData.data.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })),
          regions: regionsData.data.map((r: { id: string; name: string }) => ({ id: r.id, name: r.name })),
        },
      }));
    } catch {
      // Failed to fetch filter options - continue with empty options
      setState((prev) => ({
        ...prev,
        filterOptions: { brands: [], regions: [] },
      }));
    }
  }, []);

  // Fetch tasting notes with current filters
  const fetchTastingNotes = useCallback(async (filters: TastingNotesQueryDTO) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams();

      // Add pagination
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());

      // Add filters
      if (filters.brand_ids?.length) {
        filters.brand_ids.forEach((id) => params.append("brand_ids", id));
      }
      if (filters.region_ids?.length) {
        filters.region_ids.forEach((id) => params.append("region_ids", id));
      }
      if (filters.min_rating) params.append("min_rating", filters.min_rating.toString());

      // Add sorting
      if (filters.sort_by) params.append("sort_by", filters.sort_by);
      if (filters.sort_order) params.append("sort_order", filters.sort_order);

      const response = await fetch(`/api/tasting-notes?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch tasting notes");
      }

      const data: TastingNotesListResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        notes: data.data,
        pagination: data.pagination,
        isLoading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "An error occurred",
      }));
    }
  }, []);

  // Debounced filter update
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTastingNotes(state.filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.filters, fetchTastingNotes]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<TastingNotesQueryDTO>) => {
    setState((prev) => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters,
        // Reset to page 1 when filters change (except when changing page)
        page: newFilters.page !== undefined ? newFilters.page : 1,
      },
    }));
  }, []);

  // Toggle compare mode
  const toggleCompareMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCompareMode: !prev.isCompareMode,
      selectedForCompare: [], // Clear selection when toggling
    }));
  }, []);

  // Handle note selection for comparison
  const handleSelectNote = useCallback((noteId: string) => {
    setState((prev) => {
      const isSelected = prev.selectedForCompare.includes(noteId);

      if (isSelected) {
        // Deselect
        return {
          ...prev,
          selectedForCompare: prev.selectedForCompare.filter((id) => id !== noteId),
        };
      }

      // Select (max 2 notes)
      if (prev.selectedForCompare.length >= 2) {
        // Replace the first selected note
        return {
          ...prev,
          selectedForCompare: [prev.selectedForCompare[1], noteId],
        };
      }

      return {
        ...prev,
        selectedForCompare: [...prev.selectedForCompare, noteId],
      };
    });
  }, []);

  return {
    state,
    setFilters,
    toggleCompareMode,
    handleSelectNote,
  };
}
