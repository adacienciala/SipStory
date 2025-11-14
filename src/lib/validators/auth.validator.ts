import { z } from "zod";

/**
 * Schema for user login
 * Validates email format and requires password
 */
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for user registration
 * Validates email format and enforces minimum password length
 */
export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * Schema for password recovery request
 * Only requires a valid email address
 */
export const passwordRecoverySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Schema for password reset confirmation
 * Validates new password and requires reset token
 */
export const passwordResetConfirmSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters long"),
  token: z.string().min(1, "Reset token is required"),
});

export type LoginSchema = z.infer<typeof loginSchema>;
export type RegisterSchema = z.infer<typeof registerSchema>;
export type PasswordRecoverySchema = z.infer<typeof passwordRecoverySchema>;
export type PasswordResetConfirmSchema = z.infer<typeof passwordResetConfirmSchema>;
