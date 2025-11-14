import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface UserNavProps {
  user?: {
    email?: string;
    id: string;
  } | null;
}

/**
 * UserNav component - Displays user authentication status and navigation
 * Shows avatar with menu for authenticated users, or Login/Register links for guests
 */
export function UserNav({ user }: UserNavProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        setIsLoggingOut(false);
      }
    } catch {
      setIsLoggingOut(false);
    }
  };

  // Get initials from email for avatar
  const getInitials = (email?: string): string => {
    if (!email) return "U";
    const firstLetter = email.charAt(0).toUpperCase();
    return firstLetter;
  };

  if (!user) {
    // Unauthenticated state
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <a href="/login">Login</a>
        </Button>
        <Button asChild>
          <a href="/register">Register</a>
        </Button>
      </div>
    );
  }

  // Authenticated state
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 hover:opacity-80 cursor-pointer transition-opacity"
          aria-label="User menu"
        >
          <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground">
            {getInitials(user.email)}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-medium leading-none truncate cursor-default">{user.email}</p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{user.email}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">Signed in</p>
          </div>
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start cursor-pointer"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
