import { useState } from "react";

export default function GetStartedButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      // Example: API call or form submission
      // await fetch("/api/waitlist", { method: "POST" });

      // For now, just navigate to signup
      window.location.href = "/signup";
    } catch {
      // Handle error appropriately in production
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="px-8 py-3 bg-emerald-800 text-white rounded-md hover:bg-emerald-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? "Loading..." : "Get Started"}
    </button>
  );
}
