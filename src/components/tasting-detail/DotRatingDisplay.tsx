/**
 * DotRatingDisplay Component
 *
 * Displays a rating from 1 to 5 using filled and empty dots.
 * Used for detailed ratings like umami, bitter, sweet, and foam quality.
 */
interface DotRatingDisplayProps {
  label: string;
  value: number | null | undefined;
  className?: string;
  "data-testid"?: string;
}

export function DotRatingDisplay({ label, value, className = "", "data-testid": dataTestId }: DotRatingDisplayProps) {
  // Display "—" if value is null or undefined
  if (value === null || value === undefined) {
    return (
      <div className={`flex items-center justify-between ${className}`} data-testid={dataTestId}>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-400" aria-label={`${label}: Not rated`}>
          —
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`} data-testid={dataTestId}>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-1" aria-label={`${label}: ${value} out of 5`}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-2 w-2 rounded-full ${dot <= value ? "bg-primary" : "bg-gray-300"}`}
            aria-hidden="true"
            data-testid={dataTestId ? `${dataTestId}-dot-${dot}` : undefined}
            data-filled={dot <= value ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
}
