/**
 * TastingForm Component
 * Main form for creating and editing tasting notes
 */

import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { AutocompleteInput } from "./AutocompleteInput";
import { DotRatingInput } from "./DotRatingInput";
import { StarRatingInput } from "./StarRatingInput";
import type { TastingFormProps } from "./types";
import { useAutocompleteData } from "./useAutocompleteData";
import { useTastingForm } from "./useTastingForm";

export function TastingForm(props: TastingFormProps) {
  const {
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
  } = useTastingForm(props);

  // Fetch autocomplete data based on selections
  const {
    brands,
    regions,
    blends,
    isLoading,
    error: autocompleteError,
  } = useAutocompleteData({
    selectedBrandId: formData.brandId,
    selectedRegionId: formData.regionId,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* API Error Message */}
      {apiError && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-800">{apiError}</p>
        </div>
      )}

      {/* Autocomplete Error Message */}
      {autocompleteError && (
        <div className="rounded-md bg-yellow-50 p-4 border border-yellow-200">
          <p className="text-sm text-yellow-800">Warning: {autocompleteError}. You can still enter values manually.</p>
        </div>
      )}

      {/* Basic Information Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>

        {/* Brand Name */}
        <AutocompleteInput
          label="Brand"
          value={formData.brandName}
          onChange={handleBrandChange}
          suggestions={brands}
          placeholder="Select or enter brand name"
          required
          disabled={isEditMode}
          error={errors.brandName}
          isLoading={isLoading && brands.length === 0}
          data-testid="brand-input"
        />

        {/* Blend Name */}
        <AutocompleteInput
          label="Blend"
          value={formData.blendName}
          onChange={(id, name) => {
            // Find the selected blend to get its brand and region
            const selectedBlend = blends.find((b) => b.id === id);
            if (selectedBlend) {
              handleBlendChange(
                id,
                name,
                selectedBlend.brand.id,
                selectedBlend.brand.name,
                selectedBlend.region.id,
                selectedBlend.region.name
              );
            } else {
              handleBlendChange(id, name);
            }
          }}
          suggestions={blends}
          placeholder="Select or enter blend name"
          required
          disabled={isEditMode}
          error={errors.blendName}
          isLoading={isLoading}
          data-testid="blend-input"
        />

        {/* Region */}
        <AutocompleteInput
          label="Region"
          value={formData.regionName}
          onChange={handleRegionChange}
          suggestions={regions}
          placeholder="Select or enter region (optional)"
          disabled={isEditMode}
          error={errors.regionName}
          isLoading={isLoading && formData.brandId !== null}
          data-testid="region-input"
        />
      </section>

      {/* Overall Rating Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Overall Rating</h2>

        <StarRatingInput
          label="Overall Rating"
          value={formData.overallRating}
          onChange={(value) => handleInputChange("overallRating", value)}
          required
          disabled={isSubmitting}
          error={errors.overallRating}
          data-testid="overall-rating-input"
        />
      </section>

      {/* Detailed Ratings Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Detailed Ratings</h2>
        <p className="text-sm text-gray-600">Optional - Rate specific characteristics</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DotRatingInput
            label="Umami"
            value={formData.umami}
            onChange={(value) => handleInputChange("umami", value)}
            disabled={isSubmitting}
            error={errors.umami}
            data-testid="umami-rating-input"
          />

          <DotRatingInput
            label="Bitter"
            value={formData.bitter}
            onChange={(value) => handleInputChange("bitter", value)}
            disabled={isSubmitting}
            error={errors.bitter}
            data-testid="bitter-rating-input"
          />

          <DotRatingInput
            label="Sweet"
            value={formData.sweet}
            onChange={(value) => handleInputChange("sweet", value)}
            disabled={isSubmitting}
            error={errors.sweet}
            data-testid="sweet-rating-input"
          />

          <DotRatingInput
            label="Foam Quality"
            value={formData.foam}
            onChange={(value) => handleInputChange("foam", value)}
            disabled={isSubmitting}
            error={errors.foam}
            data-testid="foam-rating-input"
          />
        </div>
      </section>

      {/* Tasting Notes Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Tasting Notes</h2>

        {/* Notes as Koicha */}
        <div className="space-y-2">
          <Label htmlFor="notesKoicha" className="text-sm font-medium text-gray-700">
            Notes as Koicha
          </Label>
          <Textarea
            id="notesKoicha"
            value={formData.notesKoicha || ""}
            onChange={(e) => handleInputChange("notesKoicha", e.target.value || null)}
            placeholder="Describe your experience tasting this matcha as koicha (thick tea)..."
            disabled={isSubmitting}
            rows={4}
            maxLength={1000}
            className={errors.notesKoicha ? "border-red-500 focus-visible:ring-red-500" : ""}
            data-testid="notes-koicha-input"
          />
          {errors.notesKoicha && <p className="text-sm text-red-500">{errors.notesKoicha}</p>}
          <p className="text-xs text-gray-500">{formData.notesKoicha?.length || 0}/1000 characters</p>
        </div>

        {/* Notes with Milk */}
        <div className="space-y-2">
          <Label htmlFor="notesMilk" className="text-sm font-medium text-gray-700">
            Notes with Milk
          </Label>
          <Textarea
            id="notesMilk"
            value={formData.notesMilk || ""}
            onChange={(e) => handleInputChange("notesMilk", e.target.value || null)}
            placeholder="Describe your experience tasting this matcha with milk..."
            disabled={isSubmitting}
            rows={4}
            maxLength={1000}
            className={errors.notesMilk ? "border-red-500 focus-visible:ring-red-500" : ""}
            data-testid="notes-milk-input"
          />
          {errors.notesMilk && <p className="text-sm text-red-500">{errors.notesMilk}</p>}
          <p className="text-xs text-gray-500">{formData.notesMilk?.length || 0}/1000 characters</p>
        </div>
      </section>

      {/* Purchase Details Section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Purchase Details</h2>

        {/* Price */}
        <div className="space-y-2">
          <Label htmlFor="pricePln" className="text-sm font-medium text-gray-700">
            Price per 100g (PLN)
          </Label>
          <Input
            id="pricePln"
            type="number"
            value={formData.pricePln ?? ""}
            onChange={(e) => handleInputChange("pricePln", e.target.value ? Number(e.target.value) : null)}
            placeholder="0.00"
            disabled={isSubmitting}
            min="0"
            step="0.01"
            className={errors.pricePln ? "border-red-500 focus-visible:ring-red-500" : ""}
            data-testid="price-input"
          />
          {errors.pricePln && <p className="text-sm text-red-500">{errors.pricePln}</p>}
        </div>

        {/* Purchase Source */}
        <div className="space-y-2">
          <Label htmlFor="purchaseSource" className="text-sm font-medium text-gray-700">
            Purchase Source
          </Label>
          <Input
            id="purchaseSource"
            type="text"
            value={formData.purchaseSource || ""}
            onChange={(e) => handleInputChange("purchaseSource", e.target.value || null)}
            placeholder="URL or shop name..."
            disabled={isSubmitting}
            maxLength={500}
            className={errors.purchaseSource ? "border-red-500 focus-visible:ring-red-500" : ""}
            data-testid="purchase-source-input"
          />
          {errors.purchaseSource && <p className="text-sm text-red-500">{errors.purchaseSource}</p>}
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
          data-testid="cancel-button"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} data-testid="submit-button">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{isEditMode ? "Update Tasting Note" : "Create Tasting Note"}</>
          )}
        </Button>
      </div>
    </form>
  );
}
