import { Loader2 } from "lucide-react";
import { BackButton } from "../BackButton";
import { useComparisonState } from "../hooks/useComparisonState";
import { ComparisonCard } from "./ComparisonCard";
import { ComparisonTable } from "./ComparisonTable";

/**
 * ComparisonView Component
 *
 * Main container component for the comparison view.
 * Orchestrates data fetching, state management, and conditional rendering.
 * Switches between desktop table view and mobile card view based on screen size.
 */
export default function ComparisonView() {
  const { viewModel, isLoading, error } = useComparisonState();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading comparison...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <svg
              className="h-12 w-12 text-red-500 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Comparison Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <BackButton variant="button" text="Back to Dashboard" className="w-full" />
        </div>
      </div>
    );
  }

  // Success state - data loaded
  if (!viewModel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <BackButton text="Back to Dashboard" className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tasting Comparison</h1>
          <p className="text-gray-600 mt-2">Compare two matcha tasting notes side by side</p>
        </div>

        {/* Desktop view - Table */}
        <div className="hidden md:block">
          <ComparisonTable viewModel={viewModel} />
        </div>

        {/* Mobile view - Stacked Cards */}
        <div className="md:hidden space-y-4">
          <ComparisonCard note={viewModel.note1} />
          <ComparisonCard note={viewModel.note2} />
        </div>
      </div>
    </div>
  );
}
