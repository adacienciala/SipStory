import { Star } from "lucide-react";

/**
 * StarRatingDisplay Component
 *
 * Displays a star rating (1-5 stars) in a read-only format.
 * Used to show the overall rating of a tasting note.
 */
interface StarRatingDisplayProps {
  rating: number;
  className?: string;
}

export function StarRatingDisplay({ rating, className = "" }: StarRatingDisplayProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          aria-hidden="true"
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}</span>
    </div>
  );
}
