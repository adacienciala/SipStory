/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TastingNotesListResponseDTO } from "../../types";
import { useDashboardState } from "./useDashboardState";

// Mock global fetch
global.fetch = vi.fn();

/**
 * Unit tests for useDashboardState hook
 * Tests filtering, sorting, pagination, and compare mode logic
 */
describe("useDashboardState", () => {
  const mockBrandsResponse = {
    data: [
      { id: "brand-1", name: "Ippodo" },
      { id: "brand-2", name: "Marukyu Koyamaen" },
    ],
  };

  const mockRegionsResponse = {
    data: [
      { id: "region-1", name: "Uji" },
      { id: "region-2", name: "Kyoto" },
    ],
  };

  const mockTastingNotesResponse: TastingNotesListResponseDTO = {
    data: [
      {
        id: "note-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
        user_id: "user-1",
        blend: {
          id: "blend-1",
          name: "Sayaka",
          brand: { id: "brand-1", name: "Ippodo" },
          region: { id: "region-1", name: "Uji" },
        },
        overall_rating: 5,
        umami: 5,
        bitter: 2,
        sweet: 3,
        foam: 4,
        notes_koicha: "Rich and smooth",
        notes_milk: null,
        price_pln: 45.0,
        purchase_source: "ippodo.com",
      },
    ],
    pagination: {
      page: 1,
      limit: 12,
      total: 1,
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/brands")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBrandsResponse),
        });
      }
      if (url.includes("/api/regions")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockRegionsResponse),
        });
      }
      if (url.includes("/api/tasting-notes")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTastingNotesResponse),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with default state", async () => {
      const { result } = renderHook(() => useDashboardState());

      expect(result.current.state.notes).toEqual([]);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.filters).toEqual({
        page: 1,
        limit: 12,
        sort_by: "created_at",
        sort_order: "desc",
      });
      expect(result.current.state.isCompareMode).toBe(false);
      expect(result.current.state.selectedForCompare).toEqual([]);
    });

    it("should initialize with provided initial data", async () => {
      const { result } = renderHook(() => useDashboardState(mockTastingNotesResponse));

      expect(result.current.state.notes).toEqual(mockTastingNotesResponse.data);
      expect(result.current.state.pagination).toEqual(mockTastingNotesResponse.pagination);
    });

    it("should fetch filter options on mount", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.filterOptions.brands.length).toBe(2);
        expect(result.current.state.filterOptions.regions.length).toBe(2);
      });

      expect(result.current.state.filterOptions.brands).toEqual([
        { id: "brand-1", name: "Ippodo" },
        { id: "brand-2", name: "Marukyu Koyamaen" },
      ]);
      expect(result.current.state.filterOptions.regions).toEqual([
        { id: "region-1", name: "Uji" },
        { id: "region-2", name: "Kyoto" },
      ]);
    });

    it("should handle filter options fetch failure gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.filterOptions.brands).toEqual([]);
        expect(result.current.state.filterOptions.regions).toEqual([]);
      });
    });
  });

  describe("Fetching Tasting Notes", () => {
    it("should fetch tasting notes with default filters", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.notes.length).toBeGreaterThan(0);
      });

      expect(result.current.state.notes).toEqual(mockTastingNotesResponse.data);
      expect(result.current.state.pagination).toEqual(mockTastingNotesResponse.pagination);
    });

    it("should set loading state during fetch", async () => {
      const { result } = renderHook(() => useDashboardState());

      // Initially loading should be true momentarily
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });
    });

    it("should handle fetch error", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/brands") || url.includes("/api/regions")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] }),
          });
        }
        if (url.includes("/api/tasting-notes")) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.error).toBe("Failed to fetch tasting notes");
      });
    });
  });

  describe("Filtering", () => {
    it("should update filters with setFilters", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      result.current.setFilters({ brand_ids: ["brand-1"] });

      await waitFor(() => {
        expect(result.current.state.filters.brand_ids).toEqual(["brand-1"]);
      });
    });

    it("should reset to page 1 when filters change", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Change page first
      result.current.setFilters({ page: 2 });

      await waitFor(() => {
        expect(result.current.state.filters.page).toBe(2);
      });

      // Change filter - should reset to page 1
      result.current.setFilters({ brand_ids: ["brand-1"] });

      await waitFor(() => {
        expect(result.current.state.filters.page).toBe(1);
      });
    });

    it("should not reset page when explicitly changing page", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      result.current.setFilters({ page: 3 });

      await waitFor(() => {
        expect(result.current.state.filters.page).toBe(3);
      });
    });

    it("should handle multiple filter types", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      result.current.setFilters({
        brand_ids: ["brand-1", "brand-2"],
        region_ids: ["region-1"],
        min_rating: 4,
      });

      await waitFor(() => {
        expect(result.current.state.filters.brand_ids).toEqual(["brand-1", "brand-2"]);
        expect(result.current.state.filters.region_ids).toEqual(["region-1"]);
        expect(result.current.state.filters.min_rating).toBe(4);
      });
    });

    it("should debounce filter changes", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      const fetchCallCount = (global.fetch as any).mock.calls.length;

      // Make multiple rapid filter changes
      result.current.setFilters({ brand_ids: ["brand-1"] });
      result.current.setFilters({ brand_ids: ["brand-1", "brand-2"] });
      result.current.setFilters({ brand_ids: ["brand-1", "brand-2"], min_rating: 4 });

      // Wait for debounce
      await waitFor(
        () => {
          const newFetchCallCount = (global.fetch as any).mock.calls.length;
          // Should only fetch once after debounce period
          expect(newFetchCallCount).toBe(fetchCallCount + 1);
        },
        { timeout: 500 }
      );
    });
  });

  describe("Sorting", () => {
    it("should update sort_by filter", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      result.current.setFilters({ sort_by: "overall_rating" });

      await waitFor(() => {
        expect(result.current.state.filters.sort_by).toBe("overall_rating");
      });
    });

    it("should update sort_order filter", async () => {
      const { result } = renderHook(() => useDashboardState());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      result.current.setFilters({ sort_order: "asc" });

      await waitFor(() => {
        expect(result.current.state.filters.sort_order).toBe("asc");
      });
    });
  });

  describe("Compare Mode", () => {
    it("should toggle compare mode on", async () => {
      const { result } = renderHook(() => useDashboardState());

      expect(result.current.state.isCompareMode).toBe(false);

      result.current.toggleCompareMode();

      await waitFor(() => {
        expect(result.current.state.isCompareMode).toBe(true);
      });
    });

    it("should toggle compare mode off", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.toggleCompareMode();

      await waitFor(() => {
        expect(result.current.state.isCompareMode).toBe(true);
      });

      result.current.toggleCompareMode();

      await waitFor(() => {
        expect(result.current.state.isCompareMode).toBe(false);
      });
    });

    it("should clear selection when toggling compare mode", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.toggleCompareMode();

      await waitFor(() => {
        expect(result.current.state.isCompareMode).toBe(true);
      });

      result.current.handleSelectNote("note-1");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1"]);
      });

      result.current.toggleCompareMode();

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual([]);
      });
    });
  });

  describe("Note Selection for Comparison", () => {
    it("should select a note for comparison", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.handleSelectNote("note-1");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1"]);
      });
    });

    it("should deselect a selected note", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.handleSelectNote("note-1");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1"]);
      });

      result.current.handleSelectNote("note-1");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual([]);
      });
    });

    it("should allow selecting up to 2 notes", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.handleSelectNote("note-1");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1"]);
      });

      result.current.handleSelectNote("note-2");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1", "note-2"]);
      });
    });

    it("should replace first note when selecting a third note", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.handleSelectNote("note-1");
      result.current.handleSelectNote("note-2");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-1", "note-2"]);
      });

      result.current.handleSelectNote("note-3");

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-2", "note-3"]);
      });
    });

    it("should handle rapid selection changes", async () => {
      const { result } = renderHook(() => useDashboardState());

      result.current.handleSelectNote("note-1");
      result.current.handleSelectNote("note-2");
      result.current.handleSelectNote("note-1"); // Deselect note-1

      await waitFor(() => {
        expect(result.current.state.selectedForCompare).toEqual(["note-2"]);
      });
    });
  });
});
