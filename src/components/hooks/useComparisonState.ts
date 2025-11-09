import { useEffect, useState } from "react";
import type { SelectNotesResponseDTO } from "../../types";
import type { ComparisonViewModel } from "../comparison/types";

/**
 * Validates UUID format using a regex pattern
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Custom hook for managing comparison view state
 * Handles URL validation, API fetching, and state management for comparing two tasting notes
 */
export function useComparisonState() {
  const [viewModel, setViewModel] = useState<ComparisonViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to validate URL and fetch data on component mount
  useEffect(() => {
    /**
     * Extracts and validates IDs from URL query parameters
     * Returns an array of exactly 2 valid UUIDs or null if validation fails
     */
    const validateIdsFromURL = (): string[] | null => {
      const urlParams = new URLSearchParams(window.location.search);
      const idsParam = urlParams.get("ids");

      if (!idsParam) {
        setError("Invalid comparison request. Please select two tasting notes from the dashboard.");
        return null;
      }

      // Parse comma-separated IDs
      const ids = idsParam.split(",").map((id) => id.trim());

      // Validate exactly 2 IDs
      if (ids.length !== 2) {
        setError("Invalid comparison request. Please select two tasting notes from the dashboard.");
        return null;
      }

      // Validate UUID format for both IDs
      if (!ids.every(isValidUUID)) {
        setError("Invalid comparison request. Please select two tasting notes from the dashboard.");
        return null;
      }

      return ids;
    };

    /**
     * Fetches comparison notes from the API
     */
    const fetchComparisonNotes = async (ids: string[]) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/tasting-notes/select?ids=${ids.join(",")}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("One or more tasting notes could not be found.");
          } else if (response.status === 401) {
            // Redirect to login on auth error
            window.location.href = "/login";
            return;
          } else {
            setError("An unexpected error occurred. Please try again later.");
          }
          setIsLoading(false);
          return;
        }

        const data: SelectNotesResponseDTO = await response.json();

        // Transform response into view model
        const comparisonViewModel: ComparisonViewModel = {
          note1: data.notes[0],
          note2: data.notes[1],
        };

        setViewModel(comparisonViewModel);
        setIsLoading(false);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching comparison notes:", err);
        setError("An unexpected error occurred. Please try again later.");
        setIsLoading(false);
      }
    };

    const ids = validateIdsFromURL();

    if (ids) {
      fetchComparisonNotes(ids);
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    viewModel,
    isLoading,
    error,
  };
}
