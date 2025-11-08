import { Star, X } from "lucide-react";
import type { TastingNotesQueryDTO } from "../../types";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { FilterOptions } from "./types";

/**
 * FilterPanel Component
 *
 * A form containing various filter controls for refining the tasting notes list.
 * On desktop, it's a persistent sidebar; on mobile, it's a collapsible drawer.
 */
interface FilterPanelProps {
  filters: TastingNotesQueryDTO;
  onFilterChange: (newFilters: Partial<TastingNotesQueryDTO>) => void;
  filterOptions: FilterOptions;
  className?: string;
}

export function FilterPanel({ filters, onFilterChange, filterOptions, className = "" }: FilterPanelProps) {
  const handleRatingChange = (rating: number) => {
    onFilterChange({ min_rating: rating });
  };

  const handleClearFilters = () => {
    onFilterChange({
      brand_ids: null,
      region_ids: null,
      min_rating: null,
    });
  };

  const hasActiveFilters = filters.brand_ids?.length || filters.region_ids?.length || filters.min_rating;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} aria-label="Clear all filters">
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Brand Filter */}
      <div className="space-y-2">
        <Label htmlFor="brand-filter">Brand</Label>
        <Select
          value={filters.brand_ids?.[0] || "__all__"}
          onValueChange={(value) => {
            if (value === "__all__") {
              onFilterChange({ brand_ids: null });
            } else {
              onFilterChange({ brand_ids: [value] });
            }
          }}
        >
          <SelectTrigger id="brand-filter">
            <SelectValue placeholder="All brands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All brands</SelectItem>
            {filterOptions.brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Region Filter */}
      <div className="space-y-2">
        <Label htmlFor="region-filter">Region</Label>
        <Select
          value={filters.region_ids?.[0] || "__all__"}
          onValueChange={(value) => {
            if (value === "__all__") {
              onFilterChange({ region_ids: null });
            } else {
              onFilterChange({ region_ids: [value] });
            }
          }}
        >
          <SelectTrigger id="region-filter">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All regions</SelectItem>
            {filterOptions.regions.map((region) => (
              <SelectItem key={region.id} value={region.id}>
                {region.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <Label>Minimum Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => {
                if (filters.min_rating === rating) {
                  onFilterChange({ min_rating: null });
                } else {
                  handleRatingChange(rating);
                }
              }}
              className="rounded-sm p-1 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Filter by minimum ${rating} stars`}
              aria-pressed={filters.min_rating === rating}
            >
              <Star
                className={`h-6 w-6 ${
                  filters.min_rating && rating <= filters.min_rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {filters.min_rating && <p className="text-muted-foreground text-xs">Showing {filters.min_rating}+ stars</p>}
      </div>
    </div>
  );
}
