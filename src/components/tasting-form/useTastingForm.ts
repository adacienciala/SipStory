/**
 * Custom hook for managing tasting form state and logic
 */

import { useCallback, useEffect, useState } from "react";
import type { TastingNoteResponseDTO } from "../../types";
import type { TastingFormErrors, TastingFormProps, TastingNoteFormViewModel } from "./types";

/**
 * Initializes form data from initialData (edit mode) or empty values (create mode)
 */
function initializeFormData(initialData?: TastingNoteResponseDTO): TastingNoteFormViewModel {
  if (initialData) {
    return {
      brandId: initialData.blend.brand.id,
      brandName: initialData.blend.brand.name,
      blendId: initialData.blend.id,
      blendName: initialData.blend.name,
      regionId: initialData.blend.region.id,
      regionName: initialData.blend.region.name,
      overallRating: initialData.overall_rating,
      umami: initialData.umami,
      bitter: initialData.bitter,
      sweet: initialData.sweet,
      foam: initialData.foam,
      notesKoicha: initialData.notes_koicha,
      notesMilk: initialData.notes_milk,
      pricePln: initialData.price_pln,
      purchaseSource: initialData.purchase_source,
    };
  }

  return {
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
  };
}

/**
 * Validates form data according to DTO constraints
 */
function validateFormData(data: TastingNoteFormViewModel): TastingFormErrors {
  const errors: TastingFormErrors = {};

  // Required fields
  if (!data.brandName.trim()) {
    errors.brandName = "Brand name is required";
  } else if (data.brandName.length > 255) {
    errors.brandName = "Brand name must not exceed 255 characters";
  }

  if (!data.blendName.trim()) {
    errors.blendName = "Blend name is required";
  } else if (data.blendName.length > 255) {
    errors.blendName = "Blend name must not exceed 255 characters";
  }

  if (!data.regionName.trim()) {
    errors.regionName = "Region is required";
  } else if (data.regionName.length > 255) {
    errors.regionName = "Region name must not exceed 255 characters";
  }

  if (data.overallRating < 1 || data.overallRating > 5) {
    errors.overallRating = "Overall rating is required (1-5 stars)";
  }

  // Optional fields validation

  if (data.umami !== null && (data.umami < 1 || data.umami > 5)) {
    errors.umami = "Umami rating must be between 1 and 5";
  }

  if (data.bitter !== null && (data.bitter < 1 || data.bitter > 5)) {
    errors.bitter = "Bitter rating must be between 1 and 5";
  }

  if (data.sweet !== null && (data.sweet < 1 || data.sweet > 5)) {
    errors.sweet = "Sweet rating must be between 1 and 5";
  }

  if (data.foam !== null && (data.foam < 1 || data.foam > 5)) {
    errors.foam = "Foam rating must be between 1 and 5";
  }

  if (data.notesKoicha && data.notesKoicha.length > 1000) {
    errors.notesKoicha = "Notes as Koicha must not exceed 1000 characters";
  }

  if (data.notesMilk && data.notesMilk.length > 1000) {
    errors.notesMilk = "Notes with Milk must not exceed 1000 characters";
  }

  if (data.pricePln !== null && data.pricePln < 0) {
    errors.pricePln = "Price must be a non-negative number";
  }

  if (data.purchaseSource && data.purchaseSource.length > 500) {
    errors.purchaseSource = "Purchase source must not exceed 500 characters";
  }

  return errors;
}

/**
 * Custom hook for tasting form state management
 */
export function useTastingForm(props: TastingFormProps) {
  const { initialData } = props;
  const isEditMode = !!initialData;

  // Form state
  const [formData, setFormData] = useState<TastingNoteFormViewModel>(() => initializeFormData(initialData));
  const [errors, setErrors] = useState<TastingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Handle input changes
  const handleInputChange = useCallback(
    <K extends keyof TastingNoteFormViewModel>(field: K, value: TastingNoteFormViewModel[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
      // Clear field error on change
      if (field in errors) {
        setErrors((prev) => {
          return Object.fromEntries(Object.entries(prev).filter(([key]) => key !== field)) as TastingFormErrors;
        });
      }
    },
    [errors]
  );

  // Handle brand selection
  const handleBrandChange = useCallback(
    (id: string | null, name: string) => {
      if (id === formData.brandId && name === formData.brandName) {
        setFormData((prev) => ({ ...prev, brandId: "", brandName: "" }));
        return;
      }
      setFormData((prev) => {
        // If brand changed and current region/blend are no longer valid, clear them
        const shouldClearRegion = prev.brandId !== id && id !== null;
        const shouldClearBlend = prev.brandId !== id && id !== null;

        return {
          ...prev,
          brandId: id,
          brandName: name,
          ...(shouldClearRegion && { regionId: null, regionName: "" }),
          ...(shouldClearBlend && { blendId: null, blendName: "" }),
        };
      });
      setIsDirty(true);
      if (errors.brandName) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.brandName;
          return newErrors;
        });
      }
    },
    [errors.brandName, formData.brandId, formData.brandName]
  );

  // Handle region selection
  const handleRegionChange = useCallback(
    (id: string | null, name: string) => {
      if (id === formData.regionId && name === formData.regionName) {
        setFormData((prev) => ({ ...prev, regionId: "", regionName: "" }));
        return;
      }
      setFormData((prev) => {
        // If region changed and current blend is no longer valid, clear it
        const shouldClearBlend = prev.regionId !== id && id !== null;

        return {
          ...prev,
          regionId: id,
          regionName: name,
          ...(shouldClearBlend && { blendId: null, blendName: "" }),
        };
      });
      setIsDirty(true);
      if (errors.regionName) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.regionName;
          return newErrors;
        });
      }
    },
    [errors.regionName, formData.regionId, formData.regionName]
  );

  // Handle blend selection - auto-fill brand and region
  const handleBlendChange = useCallback(
    (id: string | null, name: string, brandId?: string, brandName?: string, regionId?: string, regionName?: string) => {
      if (id === formData.blendId && name === formData.blendName) {
        setFormData((prev) => ({ ...prev, blendId: "", blendName: "" }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        blendId: id,
        blendName: name,
        // Auto-fill brand and region if provided
        ...(brandId && brandName && { brandId, brandName }),
        ...(regionId && regionName && { regionId, regionName }),
      }));
      setIsDirty(true);
      if (errors.blendName) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.blendName;
          return newErrors;
        });
      }
    },
    [errors.blendName, formData.blendId, formData.blendName]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);

      // Validate form data
      const validationErrors = validateFormData(formData);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSubmitting(true);

      try {
        if (isEditMode) {
          // Update existing tasting note
          const response = await fetch(`/api/tasting-notes/${initialData.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              overall_rating: formData.overallRating,
              umami: formData.umami,
              bitter: formData.bitter,
              sweet: formData.sweet,
              foam: formData.foam,
              notes_koicha: formData.notesKoicha,
              notes_milk: formData.notesMilk,
              price_pln: formData.pricePln,
              purchase_source: formData.purchaseSource,
            }),
          });

          if (!response.ok) {
            if (response.status === 400) {
              const errorData = await response.json();
              if (errorData.details) {
                const fieldErrors: TastingFormErrors = {};
                errorData.details.forEach((detail: { field: string; message: string }) => {
                  fieldErrors[detail.field as keyof TastingFormErrors] = detail.message;
                });
                setErrors(fieldErrors);
              } else {
                setApiError(errorData.error || "Validation failed");
              }
              return;
            } else if (response.status === 404) {
              setApiError("Tasting note not found");
              return;
            } else {
              setApiError("An unexpected error occurred. Please try again.");
              return;
            }
          }

          // Success - redirect to detail page with forced reload
          setIsDirty(false);
          // Use replace() to force a full page reload and prevent caching issues
          window.location.replace(`/tastings/${initialData.id}`);
        } else {
          // Step 1: Create or find blend
          // If blend is selected from list (has ID), use it directly
          let blendId = formData.blendId;

          if (!blendId) {
            // Blend doesn't exist, need to create it
            const blendResponse = await fetch("/api/blends", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: formData.blendName,
                brand: formData.brandId
                  ? {
                      id: formData.brandId,
                    }
                  : {
                      name: formData.brandName,
                    },
                region: formData.regionId
                  ? {
                      id: formData.regionId,
                    }
                  : {
                      name: formData.regionName || null,
                    },
              }),
            });

            if (!blendResponse.ok) {
              const errorData = await blendResponse.json();
              setApiError(errorData.error || "Failed to create blend. Please try again.");
              return;
            }

            const blend = await blendResponse.json();
            blendId = blend.id;
          }

          // Step 2: Create tasting note
          const noteResponse = await fetch("/api/tasting-notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              blend_id: blendId,
              overall_rating: formData.overallRating,
              umami: formData.umami,
              bitter: formData.bitter,
              sweet: formData.sweet,
              foam: formData.foam,
              notes_koicha: formData.notesKoicha,
              notes_milk: formData.notesMilk,
              price_pln: formData.pricePln,
              purchase_source: formData.purchaseSource,
            }),
          });

          if (!noteResponse.ok) {
            if (noteResponse.status === 400) {
              const errorData = await noteResponse.json();
              if (errorData.details) {
                const fieldErrors: TastingFormErrors = {};
                errorData.details.forEach((detail: { field: string; message: string }) => {
                  fieldErrors[detail.field as keyof TastingFormErrors] = detail.message;
                });
                setErrors(fieldErrors);
              } else {
                setApiError(errorData.error || "Validation failed");
              }
              return;
            } else {
              setApiError("An unexpected error occurred. Please try again.");
              return;
            }
          }

          // Success - redirect to dashboard
          setIsDirty(false);
          window.location.href = "/dashboard";
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Form submission error:", err);
        setApiError("A network error occurred. Please check your connection and try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditMode, initialData]
  );

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isSubmitting]);

  return {
    formData,
    errors,
    isSubmitting,
    apiError,
    isEditMode,
    handleInputChange,
    handleBrandChange,
    handleRegionChange,
    handleBlendChange,
    handleSubmit,
  };
}
