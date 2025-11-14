/**
 * Custom hook for fetching cascading autocomplete data
 * Fetches brands, regions, and blends based on user selections
 */

import { useEffect, useState } from "react";
import type { BlendResponseDTO } from "../../types";

interface AutocompleteOption {
  id: string;
  name: string;
}

interface BlendOption extends AutocompleteOption {
  brand: AutocompleteOption;
  region: AutocompleteOption;
}

interface AutocompleteData {
  brands: AutocompleteOption[];
  regions: AutocompleteOption[];
  blends: BlendOption[];
  isLoading: boolean;
  error: string | null;
}

interface UseAutocompleteDataProps {
  selectedBrandId: string | null;
  selectedRegionId: string | null;
}

/**
 * Fetches autocomplete data with cascading filters
 * - Brands are always fetched
 * - Regions are filtered by brand if brand is selected
 * - Blends are filtered by brand and/or region if selected
 */
export function useAutocompleteData({ selectedBrandId, selectedRegionId }: UseAutocompleteDataProps): AutocompleteData {
  const [brands, setBrands] = useState<AutocompleteOption[]>([]);
  const [regions, setRegions] = useState<AutocompleteOption[]>([]);
  const [blends, setBlends] = useState<BlendOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch brands on mount
  useEffect(() => {
    async function fetchBrands() {
      try {
        const response = await fetch("/api/brands?limit=100");
        if (!response.ok) throw new Error("Failed to fetch brands");

        const result = await response.json();
        const brandOptions = result.data.map((brand: { id: string; name: string }) => ({
          id: brand.id,
          name: brand.name,
        }));
        setBrands(brandOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch brands");
      }
    }

    fetchBrands();
  }, []);

  // Fetch regions based on selected brand
  useEffect(() => {
    async function fetchRegions() {
      try {
        setIsLoading(true);

        if (selectedBrandId) {
          // If brand is selected, get regions from blends of that brand
          const response = await fetch(`/api/blends?brand_id=${selectedBrandId}&limit=100`);
          if (!response.ok) throw new Error("Failed to fetch regions");

          const result = await response.json();
          const uniqueRegions = new Map<string, AutocompleteOption>();

          result.data.forEach((blend: BlendResponseDTO) => {
            if (!uniqueRegions.has(blend.region.id)) {
              uniqueRegions.set(blend.region.id, {
                id: blend.region.id,
                name: blend.region.name,
              });
            }
          });

          setRegions(Array.from(uniqueRegions.values()).sort((a, b) => a.name.localeCompare(b.name)));
        } else {
          // No brand selected - fetch all regions
          const response = await fetch("/api/regions?limit=100");
          if (!response.ok) throw new Error("Failed to fetch regions");

          const result = await response.json();
          const regionOptions = result.data.map((region: { id: string; name: string }) => ({
            id: region.id,
            name: region.name,
          }));
          setRegions(regionOptions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch regions");
      } finally {
        setIsLoading(false);
      }
    }

    fetchRegions();
  }, [selectedBrandId]);

  // Fetch blends based on selected brand and/or region
  useEffect(() => {
    async function fetchBlends() {
      try {
        setIsLoading(true);

        const params = new URLSearchParams({ limit: "100" });
        if (selectedBrandId) params.append("brand_id", selectedBrandId);
        if (selectedRegionId) params.append("region_id", selectedRegionId);

        const response = await fetch(`/api/blends?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch blends");

        const result = await response.json();
        const blendOptions = result.data.map((blend: BlendResponseDTO) => ({
          id: blend.id,
          name: blend.name,
          brand: {
            id: blend.brand.id,
            name: blend.brand.name,
          },
          region: {
            id: blend.region.id,
            name: blend.region.name,
          },
        }));
        setBlends(blendOptions);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch blends");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlends();
  }, [selectedBrandId, selectedRegionId]);

  return { brands, regions, blends, isLoading, error };
}
