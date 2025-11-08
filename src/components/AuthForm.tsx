import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { supabaseClient } from "../db/supabase.client";

/**
 * Props interface for the AuthForm component
 */
interface AuthFormProps {
  mode: "login" | "register";
}

/**
 * Interface for form data state
 */
interface AuthFormData {
  email: string;
  password: string;
}

/**
 * AuthForm component - Handles both login and registration
 * @param mode - Determines whether the form is for login or registration
 */
export function AuthForm({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isLoginMode = mode === "login";

  /**
   * Handles input field changes and clears any existing errors
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  /**
   * Handles form submission for both login and registration
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let session = null;

      if (isLoginMode) {
        // Login flow
        const { data, error: loginError } = await supabaseClient.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (loginError) {
          throw loginError;
        }

        session = data.session;
      } else {
        // Registration flow
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) {
          throw signUpError;
        }

        session = data.session;
      }

      // Store session tokens in cookies for server-side access
      if (session) {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=3600; secure; samesite=lax`;
        document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=2592000; secure; samesite=lax`;
      }

      // Redirect to dashboard on success
      window.location.href = "/";
    } catch (err: unknown) {
      // Handle specific error cases
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password.");
      } else if (errorMessage.includes("already registered")) {
        setError("A user with this email already exists.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isLoginMode ? "Login" : "Create Account"}</CardTitle>
        <CardDescription>
          {isLoginMode
            ? "Enter your credentials to access your account"
            : "Enter your email and password to create a new account"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
              aria-invalid={!!error}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              disabled={isLoading}
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : isLoginMode ? "Login" : "Create Account"}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {isLoginMode ? (
              <>
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-primary hover:underline">
                  Sign up
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a href="/login" className="text-primary hover:underline">
                  Login
                </a>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
