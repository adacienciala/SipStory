import { supabaseClient } from "@/db/supabase.client";
import { useEffect, useState } from "react";

export default function GetStartedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClick = async () => {
    setIsLoading(true);

    try {
      if (isAuthenticated) {
        // Navigate to dashboard (placeholder for now)
        window.location.href = "/dashboard";
      } else {
        // Navigate to register page
        window.location.href = "/register";
      }
    } catch {
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
      {isLoading ? "Loading..." : isAuthenticated ? "Go to Dashboard" : "Get Started"}
    </button>
  );
}
