import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type ChangeEvent, type FormEvent } from "react";

/**
 * Props interface for the AuthForm component
 */
interface AuthFormProps {
  mode: "login" | "register" | "password-recovery" | "reset-password-confirm";
  redirectTo?: string;
}

/**
 * Interface for form data state
 */
interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Interface for field errors
 */
interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Validates email format
 */
const validateEmail = (email: string): string | null => {
  if (!email) {
    return "Email is required";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

/**
 * Validates password complexity
 */
const validatePassword = (password: string, isRegistration: boolean): string | null => {
  if (!password) {
    return "Password is required";
  }
  if (isRegistration && password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  return null;
};

/**
 * AuthForm component - Handles login, registration, and password recovery
 * @param mode - Determines the form type: "login", "register", or "password-recovery"
 * @param redirectTo - Optional URL to redirect to after successful authentication
 */
export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLoginMode = mode === "login";
  const isRegisterMode = mode === "register";
  const isPasswordRecoveryMode = mode === "password-recovery";
  const isResetPasswordConfirmMode = mode === "reset-password-confirm";

  /**
   * Handles input field changes and clears any existing errors
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  /**
   * Validates all form fields
   */
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // Validate email (not needed for reset password confirm)
    if (!isResetPasswordConfirmMode) {
      const emailError = validateEmail(formData.email);
      if (emailError) {
        errors.email = emailError;
      }
    }

    // Validate password (skip for password recovery)
    if (!isPasswordRecoveryMode) {
      const passwordError = validatePassword(formData.password, isRegisterMode || isResetPasswordConfirmMode);
      if (passwordError) {
        errors.password = passwordError;
      }
    }

    // Validate confirm password for reset password confirm mode
    if (isResetPasswordConfirmMode) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Handles form submission for login, registration, and password recovery
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      let apiEndpoint = "";
      let requestBody: Record<string, string> = {};

      if (isPasswordRecoveryMode) {
        // Password recovery flow
        apiEndpoint = "/api/auth/reset-password";
        requestBody = { email: formData.email };
      } else if (isResetPasswordConfirmMode) {
        const queryParams = new URLSearchParams(window.location.search);
        const token = queryParams.get("code");

        if (!token) {
          throw new Error("Reset token not found. Please request a new password reset link.");
        }

        apiEndpoint = "/api/auth/reset-password-confirm";
        requestBody = { password: formData.password, token };
      } else if (isLoginMode) {
        // Login flow
        apiEndpoint = "/api/auth/login";
        requestBody = { email: formData.email, password: formData.password };
      } else {
        // Registration flow
        apiEndpoint = "/api/auth/register";
        requestBody = { email: formData.email, password: formData.password };
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred");
      }

      // Handle success
      if (isPasswordRecoveryMode) {
        setSuccessMessage("Password reset link has been sent to your email. Please check your inbox.");
        setFormData({ email: "", password: "", confirmPassword: "" });
      } else if (isResetPasswordConfirmMode) {
        setSuccessMessage("Password updated successfully! Redirecting to login...");
        setFormData({ email: "", password: "", confirmPassword: "" });
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else if (isRegisterMode) {
        setSuccessMessage("Account created! Please check your email to confirm your account.");
        setFormData({ email: "", password: "", confirmPassword: "" });
      } else {
        // Login success - redirect
        const destination = redirectTo || "/dashboard";
        window.location.href = destination;
      }
    } catch (err: unknown) {
      // Handle specific error cases
      const errorMessage = err instanceof Error ? err.message : "";
      if (errorMessage.includes("Invalid login credentials") || errorMessage.includes("Invalid email or password")) {
        setError("Invalid email or password.");
      } else if (errorMessage.includes("already registered") || errorMessage.includes("already exists")) {
        setError("A user with this email already exists.");
      } else {
        setError(errorMessage || "An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine card content based on mode
  const getCardTitle = () => {
    if (isPasswordRecoveryMode) return "Reset Password";
    if (isResetPasswordConfirmMode) return "Set New Password";
    if (isLoginMode) return "Login";
    return "Create Account";
  };

  const getCardDescription = () => {
    if (isPasswordRecoveryMode) return "Enter your email to receive a password reset link";
    if (isResetPasswordConfirmMode) return "Enter your new password below";
    if (isLoginMode) return "Enter your credentials to access your account";
    return "Enter your email and password to create a new account";
  };

  const getButtonText = () => {
    if (isLoading) return "Loading...";
    if (isPasswordRecoveryMode) return "Send Reset Link";
    if (isResetPasswordConfirmMode) return "Update Password";
    if (isLoginMode) return "Login";
    return "Create Account";
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{getCardTitle()}</CardTitle>
        <CardDescription>{getCardDescription()}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <CardContent className="space-y-4">
          {!isResetPasswordConfirmMode && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="text"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          )}
          {!isPasswordRecoveryMode && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{isResetPasswordConfirmMode ? "New Password" : "Password"}</Label>
                {isLoginMode && (
                  <a href="/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>
          )}
          {isResetPasswordConfirmMode && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.confirmPassword}
                aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
              />
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600" role="status">
              {successMessage}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {getButtonText()}
          </Button>
          {!isPasswordRecoveryMode && !isResetPasswordConfirmMode && (
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
          )}
          {(isPasswordRecoveryMode || isResetPasswordConfirmMode) && (
            <p className="text-sm text-muted-foreground text-center">
              Remember your password?{" "}
              <a href="/login" className="text-primary hover:underline">
                Back to login
              </a>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
