/**
 * StarRatingInput Component
 * Interactive 5-star rating component for overall rating
 */

import { Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Label } from "../ui/label";
import type { StarRatingInputProps } from "./types";

export function StarRatingInput({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  error,
}: StarRatingInputProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label}>
        {stars.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={cn(
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                value && star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-transparent text-gray-300 hover:text-yellow-400"
              )}
            />
          </button>
        ))}
        {value && value > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {value} star{value !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
