import { Filter, GitCompare, Plus, X } from "lucide-react";
import { useState } from "react";
import type { TastingNotesListResponseDTO } from "../../types";
import { Button } from "../ui/button";
import { FilterPanel } from "./FilterPanel";
import { TastingNotesGrid } from "./TastingNotesGrid";
import { useDashboardState } from "./useDashboardState";

/**
 * DashboardView Component
 *
 * The main container for the dashboard. Orchestrates data fetching,
 * state management, and rendering of all child components.
 */
interface DashboardViewProps {
  initialData?: TastingNotesListResponseDTO;
}

export default function DashboardView({ initialData }: DashboardViewProps) {
  const { state, setFilters, toggleCompareMode, handleSelectNote } = useDashboardState(initialData);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const canCompare = state.selectedForCompare.length === 2;

  const handleCompare = () => {
    if (canCompare) {
      const [id1, id2] = state.selectedForCompare;
      window.location.href = `/tastings/compare?ids=${id1},${id2}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {/* Compare Mode Toggle */}
              <Button
                variant={"outline"}
                size="sm"
                onClick={toggleCompareMode}
                aria-label={state.isCompareMode ? "Exit compare mode" : "Enter compare mode"}
              >
                {state.isCompareMode ? <X className="mr-2 h-4 w-4" /> : <GitCompare className="mr-2 h-4 w-4" />}
                {state.isCompareMode ? "Cancel" : "Compare"}
              </Button>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                className="lg:hidden"
                aria-label="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </Button>

              {/* Add New Button (Desktop) */}
              <Button asChild size="sm" className="hidden md:flex" disabled={state.isCompareMode}>
                <a href="/tastings/new" data-testid="add-new-tasting-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Add New
                </a>
              </Button>
            </div>
          </div>

          {/* Compare Action Bar */}
          {state.isCompareMode && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-muted p-3">
              <p className="text-sm">
                {state.selectedForCompare.length === 0 && "Select 2 tastings to compare"}
                {state.selectedForCompare.length === 1 && "Select 1 more tasting"}
                {state.selectedForCompare.length === 2 && "Ready to compare"}
              </p>
              <Button size="sm" disabled={!canCompare} onClick={handleCompare}>
                Compare Selected
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Panel (Desktop Sidebar) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-6">
              <FilterPanel filters={state.filters} onFilterChange={setFilters} filterOptions={state.filterOptions} />
            </div>
          </aside>

          {/* Filter Panel (Mobile Drawer) */}
          {isFilterPanelOpen && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden">
              <div className="fixed inset-y-0 left-0 w-80 max-w-full border-r bg-card p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsFilterPanelOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <FilterPanel
                  filters={state.filters}
                  onFilterChange={(filters) => {
                    setFilters(filters);
                    setIsFilterPanelOpen(false);
                  }}
                  filterOptions={state.filterOptions}
                />
              </div>
            </div>
          )}

          {/* Main Grid Area */}
          <main className="flex-1">
            {state.error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-destructive mb-4 text-lg">Could not load tastings</p>
                <p className="text-muted-foreground text-sm">{state.error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <TastingNotesGrid
                notes={state.notes}
                isLoading={state.isLoading}
                isCompareMode={state.isCompareMode}
                selectedNoteIds={state.selectedForCompare}
                onSelectNote={handleSelectNote}
              />
            )}
          </main>
        </div>
      </div>

      {/* Floating Action Button (Mobile) */}
      {!state.isCompareMode && (
        <a
          href="/tastings/new"
          className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 md:hidden"
          aria-label="Add new tasting"
          data-testid="add-new-tasting-fab"
        >
          <Plus className="h-6 w-6" />
        </a>
      )}
    </div>
  );
}
