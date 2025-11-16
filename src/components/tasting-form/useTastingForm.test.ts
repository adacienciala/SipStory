/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TastingNoteResponseDTO } from "../../types";
import { useTastingForm } from "./useTastingForm";

// Mock global fetch
global.fetch = vi.fn();

// Mock window.location with replace method
delete (window as any).location;
window.location = {
  href: "",
  replace: vi.fn(),
} as any;

/**
 * Unit tests for useTastingForm hook
 * Tests form initialization, validation, submission, and state management
 */
describe("useTastingForm", () => {
  const mockExistingNote: TastingNoteResponseDTO = {
    id: "note-123",
    user_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    overall_rating: 4,
    umami: 4,
    bitter: 2,
    sweet: 3,
    foam: 5,
    notes_koicha: "Rich and smooth",
    notes_milk: "Creamy and balanced",
    price_pln: 150.0,
    purchase_source: "https://example.com",
    blend: {
      id: "blend-1",
      name: "Premium Blend",
      brand: {
        id: "brand-1",
        name: "Ippodo",
      },
      region: {
        id: "region-1",
        name: "Uji",
      },
    },
  };

  beforeEach(() => {
    vi.resetAllMocks();
    window.location.href = "";
    (window.location.replace as any).mockClear();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with empty form state for new entry (create mode)", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      expect(result.current.formData).toEqual({
        brandId: null,
        brandName: "",
        blendId: null,
        blendName: "",
        regionId: null,
        regionName: "",
        overallRating: 0,
        umami: null,
        bitter: null,
        sweet: null,
        foam: null,
        notesKoicha: null,
        notesMilk: null,
        pricePln: null,
        purchaseSource: null,
      });
      expect(result.current.isEditMode).toBe(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.apiError).toBeNull();
    });

    it("should initialize with existing data for edit mode", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: mockExistingNote }));

      expect(result.current.formData).toEqual({
        brandId: "brand-1",
        brandName: "Ippodo",
        blendId: "blend-1",
        blendName: "Premium Blend",
        regionId: "region-1",
        regionName: "Uji",
        overallRating: 4,
        umami: 4,
        bitter: 2,
        sweet: 3,
        foam: 5,
        notesKoicha: "Rich and smooth",
        notesMilk: "Creamy and balanced",
        pricePln: 150.0,
        purchaseSource: "https://example.com",
      });
      expect(result.current.isEditMode).toBe(true);
    });
  });

  describe("Validation", () => {
    it("should require brand name field", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.brandName).toBe("Brand name is required");
    });

    it("should require blend name field", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.blendName).toBe("Blend name is required");
    });

    it("should require overall rating between 1-5", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium");
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.overallRating).toBe("Overall rating is required (1-5 stars)");
    });

    it("should validate brand name length (max 255 characters)", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      const longBrandName = "A".repeat(256);

      await act(async () => {
        result.current.handleBrandChange("brand-1", longBrandName);
        result.current.handleBlendChange("blend-1", "Premium");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.brandName).toBe("Brand name must not exceed 255 characters");
    });

    it("should validate blend name length (max 255 characters)", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      const longBlendName = "B".repeat(256);

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", longBlendName);
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.blendName).toBe("Blend name must not exceed 255 characters");
    });

    it("should validate optional rating fields (1-5 range)", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium");
        result.current.handleInputChange("overallRating", 4);
        result.current.handleInputChange("umami", 6); // Invalid
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.umami).toBe("Umami rating must be between 1 and 5");
    });

    it("should validate price is non-negative", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium");
        result.current.handleInputChange("overallRating", 4);
        result.current.handleInputChange("pricePln", -10);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.pricePln).toBe("Price must be a non-negative number");
    });

    it("should validate notes text field length (max 1000 characters)", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      const longNotes = "X".repeat(1001);

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium");
        result.current.handleInputChange("overallRating", 4);
        result.current.handleInputChange("notesKoicha", longNotes);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.notesKoicha).toBe("Notes as Koicha must not exceed 1000 characters");
    });

    it("should allow optional fields to be empty/null", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium");
        result.current.handleInputChange("overallRating", 4);
        // Leave optional fields as null
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.umami).toBeUndefined();
      expect(result.current.errors.bitter).toBeUndefined();
      expect(result.current.errors.sweet).toBeUndefined();
      expect(result.current.errors.foam).toBeUndefined();
      expect(result.current.errors.notesKoicha).toBeUndefined();
      expect(result.current.errors.notesMilk).toBeUndefined();
    });
  });

  describe("Input Change Handlers", () => {
    it("should update form data on input change", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleInputChange("overallRating", 5);
      });

      expect(result.current.formData.overallRating).toBe(5);
    });

    it("should clear field error when input changes", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      // Trigger validation error
      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(result.current.errors.brandName).toBeDefined();

      // Change the field
      act(() => {
        result.current.handleBrandChange("brand-1", "Ippodo");
      });

      expect(result.current.errors.brandName).toBeUndefined();
    });
  });

  describe("Brand Selection", () => {
    it("should update brand and clear region/blend when brand changes", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange("blend-1", "Sayaka");
      });

      expect(result.current.formData.brandId).toBe("brand-1");
      expect(result.current.formData.regionId).toBe("region-1");
      expect(result.current.formData.blendId).toBe("blend-1");

      // Change brand
      act(() => {
        result.current.handleBrandChange("brand-2", "Marukyu");
      });

      expect(result.current.formData.brandId).toBe("brand-2");
      expect(result.current.formData.brandName).toBe("Marukyu");
      expect(result.current.formData.regionId).toBeNull();
      expect(result.current.formData.regionName).toBe("");
      expect(result.current.formData.blendId).toBeNull();
      expect(result.current.formData.blendName).toBe("");
    });

    it("should toggle brand selection (deselect if same brand clicked)", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleBrandChange("brand-1", "Ippodo");
      });

      expect(result.current.formData.brandId).toBe("brand-1");

      // Click same brand again
      act(() => {
        result.current.handleBrandChange("brand-1", "Ippodo");
      });

      expect(result.current.formData.brandId).toBe("");
      expect(result.current.formData.brandName).toBe("");
    });
  });

  describe("Region Selection", () => {
    it("should update region and clear blend when region changes", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange("blend-1", "Sayaka");
      });

      expect(result.current.formData.regionId).toBe("region-1");
      expect(result.current.formData.blendId).toBe("blend-1");

      // Change region
      act(() => {
        result.current.handleRegionChange("region-2", "Kyoto");
      });

      expect(result.current.formData.regionId).toBe("region-2");
      expect(result.current.formData.regionName).toBe("Kyoto");
      expect(result.current.formData.blendId).toBeNull();
      expect(result.current.formData.blendName).toBe("");
    });

    it("should toggle region selection (deselect if same region clicked)", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleRegionChange("region-1", "Uji");
      });

      expect(result.current.formData.regionId).toBe("region-1");

      // Click same region again
      act(() => {
        result.current.handleRegionChange("region-1", "Uji");
      });

      expect(result.current.formData.regionId).toBe("");
      expect(result.current.formData.regionName).toBe("");
    });
  });

  describe("Blend Selection", () => {
    it("should update blend and auto-fill brand and region if provided", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleBlendChange("blend-1", "Sayaka", "brand-1", "Ippodo", "region-1", "Uji");
      });

      expect(result.current.formData.blendId).toBe("blend-1");
      expect(result.current.formData.blendName).toBe("Sayaka");
      expect(result.current.formData.brandId).toBe("brand-1");
      expect(result.current.formData.brandName).toBe("Ippodo");
      expect(result.current.formData.regionId).toBe("region-1");
      expect(result.current.formData.regionName).toBe("Uji");
    });

    it("should toggle blend selection (deselect if same blend clicked)", () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      act(() => {
        result.current.handleBlendChange("blend-1", "Sayaka");
      });

      expect(result.current.formData.blendId).toBe("blend-1");

      // Click same blend again
      act(() => {
        result.current.handleBlendChange("blend-1", "Sayaka");
      });

      expect(result.current.formData.blendId).toBe("");
      expect(result.current.formData.blendName).toBe("");
    });
  });

  describe("Submission - Create Mode", () => {
    it("should create blend and tasting note on successful submission with valid data", async () => {
      const mockBlendResponse = { id: "new-blend-id" };

      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/blends" && options.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBlendResponse),
          });
        }
        if (url === "/api/tasting-notes" && options.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "new-note-id" }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange(null, "New Blend");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/blends",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasting-notes",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(window.location.href).toBe("/dashboard");
    });

    it("should skip blend creation if blend ID already exists", async () => {
      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/tasting-notes" && options.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "new-note-id" }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBlendChange("existing-blend-id", "Existing Blend", "brand-1", "Ippodo", "region-1", "Uji");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      // Should NOT call /api/blends
      const fetchCalls = (global.fetch as any).mock.calls;
      const blendCalls = fetchCalls.filter((call: any) => call[0] === "/api/blends");
      expect(blendCalls.length).toBe(0);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasting-notes",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should handle blend creation failure", async () => {
      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/blends" && options.method === "POST") {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "Failed to create blend" }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange(null, "New Blend");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.apiError).toBe("Failed to create blend");
    });

    it("should handle tasting note creation failure with 400 validation errors", async () => {
      const mockBlendResponse = { id: "new-blend-id" };

      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/blends" && options.method === "POST") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockBlendResponse),
          });
        }
        if (url === "/api/tasting-notes" && options.method === "POST") {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () =>
              Promise.resolve({
                error: "Validation failed",
                details: [{ field: "overallRating", message: "Invalid rating" }],
              }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange(null, "New Blend");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.errors.overallRating).toBe("Invalid rating");
    });

    it("should handle network error during submission", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleRegionChange("region-1", "Uji");
        result.current.handleBlendChange(null, "New Blend");
        result.current.handleInputChange("overallRating", 4);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.apiError).toBe("A network error occurred. Please check your connection and try again.");
    });
  });

  describe("Submission - Edit Mode", () => {
    it("should update tasting note on successful submission", async () => {
      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/tasting-notes/note-123" && options.method === "PATCH") {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ id: "note-123" }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: mockExistingNote }));

      await act(async () => {
        result.current.handleInputChange("overallRating", 5);
        result.current.handleInputChange("umami", 5);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/tasting-notes/note-123",
        expect.objectContaining({
          method: "PATCH",
        })
      );
      expect(window.location.replace).toHaveBeenCalledWith("/tastings/note-123");
    });

    it("should handle 404 error in edit mode", async () => {
      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/tasting-notes/note-123" && options.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ error: "Not found" }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: mockExistingNote }));

      await act(async () => {
        result.current.handleInputChange("overallRating", 5);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.apiError).toBe("Tasting note not found");
    });

    it("should handle 400 validation error in edit mode", async () => {
      (global.fetch as any).mockImplementation((url: string, options: any) => {
        if (url === "/api/tasting-notes/note-123" && options.method === "PATCH") {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () =>
              Promise.resolve({
                error: "Validation failed",
                details: [{ field: "umami", message: "Invalid umami rating" }],
              }),
          });
        }
        return Promise.reject(new Error("Unknown endpoint"));
      });

      const { result } = renderHook(() => useTastingForm({ initialData: mockExistingNote }));

      await act(async () => {
        result.current.handleInputChange("umami", 5);
      });

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });

      expect(result.current.errors.umami).toBe("Invalid umami rating");
    });
  });

  describe("State Management", () => {
    it("should prevent form submission when validation fails", async () => {
      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        await result.current.handleSubmit(mockEvent);
      });

      expect(global.fetch).not.toHaveBeenCalled();
      expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    });

    it("should set isSubmitting during API call", async () => {
      let resolveOuterFetch: any;
      const delayedFetch = new Promise((resolve) => {
        resolveOuterFetch = resolve;
      });

      (global.fetch as any).mockImplementation(() => delayedFetch);

      const { result } = renderHook(() => useTastingForm({ initialData: undefined }));

      await act(async () => {
        result.current.handleBrandChange("brand-1", "Ippodo");
        result.current.handleBlendChange("blend-1", "Premium", "brand-1", "Ippodo", "region-1", "Uji");
        result.current.handleInputChange("overallRating", 4);
      });

      // Start submission (don't await yet)
      let submitPromise: Promise<void> | undefined;
      act(() => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        submitPromise = result.current.handleSubmit(mockEvent);
      });

      // Check that isSubmitting is true during the API call
      await waitFor(
        () => {
          expect(result.current.isSubmitting).toBe(true);
        },
        { timeout: 100 }
      );

      // Resolve the fetch and wait for completion
      await act(async () => {
        resolveOuterFetch({
          ok: true,
          json: () => Promise.resolve({ id: "new-note-id" }),
        });
        if (submitPromise) {
          await submitPromise;
        }
      });

      // After completion, isSubmitting should be false
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
