/**
 * DotRatingInput Component
 * Interactive 5-dot rating component for detailed ratings (umami, bitter, sweet, foam)
 */

import { Circle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Label } from "../ui/label";
import type { DotRatingInputProps } from "./types";

export function DotRatingInput({
  value,
  onChange,
  label,
  disabled = false,
  error,
  "data-testid": dataTestId,
}: DotRatingInputProps) {
  const dots = [1, 2, 3, 4, 5];

  const handleClick = (dot: number) => {
    // Toggle: if clicking the same value, clear it; otherwise set new value
    if (value === dot) {
      onChange(null);
    } else {
      onChange(dot);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex items-center gap-1" role="radiogroup" aria-label={label} data-testid={dataTestId}>
        {dots.map((dot) => (
          <button
            key={dot}
            type="button"
            role="radio"
            aria-checked={value === dot}
            aria-label={`${dot} dot${dot !== 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => handleClick(dot)}
            className={cn(
              "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full",
              disabled && "cursor-not-allowed opacity-50"
            )}
            data-testid={`${dataTestId}-dot-${dot}`}
          >
            <Circle
              className={cn(
                "h-6 w-6 transition-colors",
                value && dot <= value
                  ? "fill-primary text-primary"
                  : "fill-transparent text-gray-300 hover:text-primary"
              )}
            />
          </button>
        ))}
        {value && value > 0 && <span className="ml-2 text-sm text-gray-600">{value}/5</span>}
        {value === null && <span className="ml-2 text-sm text-gray-400">Not rated</span>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
