/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SelectNotesResponseDTO } from "../../types";
import { useComparisonState } from "./useComparisonState";

// Mock global fetch
global.fetch = vi.fn();

// Mock window.location
delete (window as any).location;
window.location = { search: "", href: "" } as any;

describe("useComparisonState", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.location.search = "";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("URL Validation", () => {
    it("should show error when no ids parameter in URL", async () => {
      window.location.search = "";

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(
        "Invalid comparison request. Please select two tasting notes from the dashboard."
      );
      expect(result.current.viewModel).toBeNull();
    });

    it("should show error when ids parameter has wrong count", async () => {
      window.location.search = "?ids=id1";

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(
        "Invalid comparison request. Please select two tasting notes from the dashboard."
      );
    });

    it("should show error when ids parameter has more than 2 ids", async () => {
      window.location.search = "?ids=id1,id2,id3";

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(
        "Invalid comparison request. Please select two tasting notes from the dashboard."
      );
    });

    it("should show error when ids are not valid UUIDs", async () => {
      window.location.search = "?ids=invalid-id-1,invalid-id-2";

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(
        "Invalid comparison request. Please select two tasting notes from the dashboard."
      );
    });

    it("should accept valid UUIDs", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      const mockResponse: SelectNotesResponseDTO = {
        notes: [
          {
            id: validUUID1,
            user_id: "user-1",
            blend: {
              id: "blend-1",
              name: "Ceremonial Grade",
              brand: { id: "brand-1", name: "Ippodo" },
              region: { id: "region-1", name: "Uji" },
            },
            overall_rating: 5,
            umami: 5,
            bitter: 2,
            sweet: 3,
            foam: 4,
            notes_koicha: "Rich",
            notes_milk: "Smooth",
            price_pln: 150,
            purchase_source: "https://example.com",
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
          },
          {
            id: validUUID2,
            user_id: "user-1",
            blend: {
              id: "blend-2",
              name: "Premium",
              brand: { id: "brand-2", name: "Marukyu Koyamaen" },
              region: { id: "region-2", name: "Kyoto" },
            },
            overall_rating: 4,
            umami: 4,
            bitter: 3,
            sweet: 2,
            foam: 5,
            notes_koicha: "Bold",
            notes_milk: "Creamy",
            price_pln: 200,
            purchase_source: null,
            created_at: "2025-01-02T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.viewModel).toEqual({
        note1: mockResponse.notes[0],
        note2: mockResponse.notes[1],
      });
    });
  });

  describe("API Fetching", () => {
    it("should fetch comparison notes with valid IDs", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      const mockResponse: SelectNotesResponseDTO = {
        notes: [
          {
            id: validUUID1,
            user_id: "user-1",
            blend: {
              id: "blend-1",
              name: "Test Blend 1",
              brand: { id: "brand-1", name: "Test Brand 1" },
              region: { id: "region-1", name: "Test Region 1" },
            },
            overall_rating: 3,
            umami: null,
            bitter: null,
            sweet: null,
            foam: null,
            notes_koicha: null,
            notes_milk: null,
            price_pln: null,
            purchase_source: null,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
          },
          {
            id: validUUID2,
            user_id: "user-1",
            blend: {
              id: "blend-2",
              name: "Test Blend 2",
              brand: { id: "brand-2", name: "Test Brand 2" },
              region: { id: "region-2", name: "Test Region 2" },
            },
            overall_rating: 4,
            umami: null,
            bitter: null,
            sweet: null,
            foam: null,
            notes_koicha: null,
            notes_milk: null,
            price_pln: null,
            purchase_source: null,
            created_at: "2025-01-02T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(`/api/tasting-notes/select?ids=${validUUID1},${validUUID2}`);
      expect(result.current.viewModel).toBeDefined();
    });

    it("should handle 404 error from API", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("One or more tasting notes could not be found.");
    });

    it("should redirect on 401 error", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });
    });

    it("should handle generic API errors", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("An unexpected error occurred. Please try again later.");
    });

    it("should handle network errors", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe("An unexpected error occurred. Please try again later.");
    });
  });

  describe("Loading States", () => {
    it("should start with loading state", () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ notes: [] }),
                } as Response),
              100
            )
          )
      );

      const { result } = renderHook(() => useComparisonState());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.viewModel).toBeNull();
    });

    it("should set loading to false after successful fetch", async () => {
      const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
      const validUUID2 = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
      window.location.search = `?ids=${validUUID1},${validUUID2}`;

      const mockResponse: SelectNotesResponseDTO = {
        notes: [
          {
            id: validUUID1,
            user_id: "user-1",
            blend: {
              id: "blend-1",
              name: "Test",
              brand: { id: "brand-1", name: "Brand" },
              region: { id: "region-1", name: "Region" },
            },
            overall_rating: 3,
            umami: null,
            bitter: null,
            sweet: null,
            foam: null,
            notes_koicha: null,
            notes_milk: null,
            price_pln: null,
            purchase_source: null,
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
          },
          {
            id: validUUID2,
            user_id: "user-1",
            blend: {
              id: "blend-2",
              name: "Test 2",
              brand: { id: "brand-2", name: "Brand 2" },
              region: { id: "region-2", name: "Region 2" },
            },
            overall_rating: 4,
            umami: null,
            bitter: null,
            sweet: null,
            foam: null,
            notes_koicha: null,
            notes_milk: null,
            price_pln: null,
            purchase_source: null,
            created_at: "2025-01-02T00:00:00Z",
            updated_at: "2025-01-02T00:00:00Z",
          },
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { result } = renderHook(() => useComparisonState());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.viewModel).not.toBeNull();
    });
  });
});
