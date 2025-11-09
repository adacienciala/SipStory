/**
 * BackButton - Generic back navigation component
 * Use this in client-side React components
 * @param variant - "link" for subtle navigation, "button" for prominent action
 * @param text - Custom text (defaults to "Back")
 * @param destination - Custom destination (defaults to "/dashboard")
 * @param className - Additional CSS classes
 */
interface BackButtonProps {
  variant?: "link" | "button";
  text?: string;
  destination?: string;
  className?: string;
}

export function BackButton({
  variant = "link",
  text = "Back",
  destination = "/dashboard",
  className = "",
}: BackButtonProps) {
  if (variant === "link") {
    return (
      <a
        href={destination}
        className={`inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900 ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        {text}
      </a>
    );
  }

  return (
    <a
      href={destination}
      className={`inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
    >
      {text}
    </a>
  );
}
