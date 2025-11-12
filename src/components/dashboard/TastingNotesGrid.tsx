import { useEffect, useState } from "react";
import type { TastingNoteResponseDTO } from "../../types";
import { TastingCard } from "./TastingCard";
import { TastingCardSkeleton } from "./TastingCardSkeleton";

/**
 * TastingNotesGrid Component
 *
 * Displays the grid of tasting notes. Handles rendering the loading state
 * (skeletons) or the actual TastingCard components based on the current state.
 */
interface TastingNotesGridProps {
  notes: TastingNoteResponseDTO[];
  isLoading: boolean;
  isCompareMode: boolean;
  selectedNoteIds: string[];
  onSelectNote: (noteId: string) => void;
}

export function TastingNotesGrid({
  notes,
  isLoading,
  isCompareMode,
  selectedNoteIds,
  onSelectNote,
}: TastingNotesGridProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }

    // Only show skeleton if loading takes longer than 200ms
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowSkeleton(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (showSkeleton) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading tastings">
        {Array.from({ length: 6 }).map((_, index) => (
          <TastingCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-4 text-lg">No tasting notes found</p>
        <p className="text-muted-foreground text-sm">
          {isCompareMode ? "Exit compare mode to create a new tasting" : "Creating your specified tasting note"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <TastingCard
          key={note.id}
          note={note}
          isCompareMode={isCompareMode}
          isSelected={selectedNoteIds.includes(note.id)}
          onSelect={onSelectNote}
        />
      ))}
    </div>
  );
}
