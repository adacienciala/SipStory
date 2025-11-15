/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BlendResponseDTO } from "../../types";
import { useAutocompleteData } from "./useAutocompleteData";

// Mock global fetch
global.fetch = vi.fn();

/**
 * Unit tests for useAutocompleteData hook
 * Tests cascading data fetching and filtering logic for brands, regions, and blends
 */
describe("useAutocompleteData", () => {
  const mockBrandsResponse = {
    data: [
      { id: "brand-1", name: "Ippodo" },
      { id: "brand-2", name: "Marukyu Koyamaen" },
      { id: "brand-3", name: "Hoshino" },
    ],
  };

  const mockRegionsResponse = {
    data: [
      { id: "region-1", name: "Uji" },
      { id: "region-2", name: "Kyoto" },
      { id: "region-3", name: "Nishio" },
    ],
  };

  const mockBlendsResponse: { data: BlendResponseDTO[] } = {
    data: [
      {
        id: "blend-1",
        name: "Sayaka",
        created_at: "2024-01-01",
        brand: { id: "brand-1", name: "Ippodo" },
        region: { id: "region-1", name: "Uji" },
      },
      {
        id: "blend-2",
        name: "Ummon",
        created_at: "2024-01-01",
        brand: { id: "brand-1", name: "Ippodo" },
        region: { id: "region-2", name: "Kyoto" },
      },
    ],
  };

  const mockFilteredBlendsResponse: { data: BlendResponseDTO[] } = {
    data: [
      {
        id: "blend-1",
        name: "Sayaka",
        created_at: "2024-01-01",
        brand: { id: "brand-1", name: "Ippodo" },
        region: { id: "region-1", name: "Uji" },
      },
    ],
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
      if (url.includes("/api/blends")) {
        // Check if filtering by brand and region
        if (url.includes("brand_id=brand-1") && url.includes("region_id=region-1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFilteredBlendsResponse),
          });
        }
        // Check if filtering by brand only
        if (url.includes("brand_id=brand-1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBlendsResponse),
          });
        }
        // Check if filtering by region only
        if (url.includes("region_id=region-1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFilteredBlendsResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockBlendsResponse),
        });
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should fetch brands on mount", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.brands).toEqual([
        { id: "brand-1", name: "Ippodo" },
        { id: "brand-2", name: "Marukyu Koyamaen" },
        { id: "brand-3", name: "Hoshino" },
      ]);
    });

    it("should fetch all regions when no brand is selected", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.regions).toEqual([
        { id: "region-1", name: "Uji" },
        { id: "region-2", name: "Kyoto" },
        { id: "region-3", name: "Nishio" },
      ]);
    });

    it("should fetch all blends when no filters are applied", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blends).toHaveLength(2);
      expect(result.current.blends[0].name).toBe("Sayaka");
    });

    it("should set loading state initially", () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("Brand Selection", () => {
    it("should fetch regions from blends when brand is selected", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: "brand-1",
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should extract unique regions from blends of selected brand
      expect(result.current.regions).toHaveLength(2);
      expect(result.current.regions.map((r) => r.name)).toContain("Uji");
      expect(result.current.regions.map((r) => r.name)).toContain("Kyoto");
    });

    it("should filter blends by selected brand", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: "brand-1",
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blends.every((b) => b.brand.id === "brand-1")).toBe(true);
    });

    it("should update regions when brand selection changes", async () => {
      const { result, rerender } = renderHook(
        ({ selectedBrandId, selectedRegionId }) => useAutocompleteData({ selectedBrandId, selectedRegionId }),
        {
          initialProps: {
            selectedBrandId: null as string | null,
            selectedRegionId: null as string | null,
          },
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially all regions
      expect(result.current.regions).toHaveLength(3);

      // Select a brand
      rerender({ selectedBrandId: "brand-1", selectedRegionId: null });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should now have filtered regions
      expect(result.current.regions).toHaveLength(2);
    });
  });

  describe("Region Selection", () => {
    it("should filter blends by selected region", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: "region-1",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blends.every((b) => b.region.id === "region-1")).toBe(true);
    });

    it("should filter blends by both brand and region", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: "brand-1",
          selectedRegionId: "region-1",
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.blends).toHaveLength(1);
      expect(result.current.blends[0].name).toBe("Sayaka");
      expect(result.current.blends[0].brand.id).toBe("brand-1");
      expect(result.current.blends[0].region.id).toBe("region-1");
    });
  });

  describe("Error Handling", () => {
    it("should handle brands fetch error", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/brands")) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch brands");
      });
    });

    it("should handle regions fetch error", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/brands")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBrandsResponse),
          });
        }
        if (url.includes("/api/regions")) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch regions");
      });
    });

    it("should handle blends fetch error", async () => {
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
        if (url.includes("/api/blends")) {
          return Promise.resolve({
            ok: false,
            status: 500,
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBe("Failed to fetch blends");
      });
    });

    it("should handle network errors gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe("Data Transformation", () => {
    it("should sort regions alphabetically when extracted from blends", async () => {
      const unsortedBlendsResponse = {
        data: [
          {
            id: "blend-1",
            name: "Blend A",
            created_at: "2024-01-01",
            brand: { id: "brand-1", name: "Ippodo" },
            region: { id: "region-2", name: "Kyoto" },
          },
          {
            id: "blend-2",
            name: "Blend B",
            created_at: "2024-01-01",
            brand: { id: "brand-1", name: "Ippodo" },
            region: { id: "region-1", name: "Uji" },
          },
          {
            id: "blend-3",
            name: "Blend C",
            created_at: "2024-01-01",
            brand: { id: "brand-1", name: "Ippodo" },
            region: { id: "region-3", name: "Nishio" },
          },
        ],
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/brands")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBrandsResponse),
          });
        }
        if (url.includes("/api/blends") && url.includes("brand_id=brand-1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(unsortedBlendsResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: "brand-1",
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const regionNames = result.current.regions.map((r) => r.name);
      expect(regionNames).toEqual(["Kyoto", "Nishio", "Uji"]);
    });

    it("should deduplicate regions when extracted from blends", async () => {
      const duplicateRegionsResponse = {
        data: [
          {
            id: "blend-1",
            name: "Blend A",
            created_at: "2024-01-01",
            brand: { id: "brand-1", name: "Ippodo" },
            region: { id: "region-1", name: "Uji" },
          },
          {
            id: "blend-2",
            name: "Blend B",
            created_at: "2024-01-01",
            brand: { id: "brand-1", name: "Ippodo" },
            region: { id: "region-1", name: "Uji" },
          },
        ],
      };

      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes("/api/brands")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBrandsResponse),
          });
        }
        if (url.includes("/api/blends") && url.includes("brand_id=brand-1")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(duplicateRegionsResponse),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      });

      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: "brand-1",
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.regions).toHaveLength(1);
      expect(result.current.regions[0].name).toBe("Uji");
    });

    it("should include brand and region in blend options", async () => {
      const { result } = renderHook(() =>
        useAutocompleteData({
          selectedBrandId: null,
          selectedRegionId: null,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const blend = result.current.blends[0];
      expect(blend).toHaveProperty("brand");
      expect(blend).toHaveProperty("region");
      expect(blend.brand).toHaveProperty("id");
      expect(blend.brand).toHaveProperty("name");
      expect(blend.region).toHaveProperty("id");
      expect(blend.region).toHaveProperty("name");
    });
  });
});
