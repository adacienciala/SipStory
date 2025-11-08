import type { TastingNoteResponseDTO } from "../../types";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { StarRatingDisplay } from "./StarRatingDisplay";

/**
 * TastingCard Component
 *
 * Displays a summary of a single tasting note on the dashboard.
 * Includes a checkbox that is visible only in "compare mode".
 */
interface TastingCardProps {
  note: TastingNoteResponseDTO;
  isCompareMode: boolean;
  isSelected: boolean;
  onSelect: (noteId: string) => void;
}

export function TastingCard({ note, isCompareMode, isSelected, onSelect }: TastingCardProps) {
  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking the checkbox in compare mode
    if (isCompareMode) {
      e.preventDefault();
      onSelect(note.id);
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    if (checked) {
      onSelect(note.id);
    } else {
      onSelect(note.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const cardContent = (
    <Card>
      <CardHeader>
        {isCompareMode && (
          <CardAction>
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${note.blend.name} for comparison`}
            />
          </CardAction>
        )}
        <CardTitle>{note.blend.name}</CardTitle>
        <CardDescription>
          {note.blend.brand.name} • {note.blend.region.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <StarRatingDisplay rating={note.overall_rating} />
        <p className="text-muted-foreground text-xs">{formatDate(note.created_at)}</p>
      </CardContent>
    </Card>
  );

  if (isCompareMode) {
    return (
      <div
        className="block cursor-pointer transition-shadow hover:shadow-md"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(note.id);
          }
        }}
        aria-label={`Select ${note.blend.name} by ${note.blend.brand.name} for comparison`}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <a
      href={`/tastings/${note.id}`}
      className="block transition-shadow hover:shadow-md"
      aria-label={`View ${note.blend.name} by ${note.blend.brand.name}`}
    >
      {cardContent}
    </a>
  );
}
