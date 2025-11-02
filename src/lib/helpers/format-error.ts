import type { ZodError } from "zod";
import type { ValidationErrorDTO } from "../../types";

/**
 * Formats Zod validation errors into human-readable messages
 * Extracts the first error from the validation result
 *
 * @param error - ZodError object from failed validation
 * @returns Formatted error message string
 *
 * @example
 * // Returns: "page must be a positive integer"
 * formatZodError(zodError);
 *
 * @example
 * // Returns: "brand_ids Invalid UUID format"
 * formatZodError(zodError);
 */
export function formatZodError(error: ZodError): string {
  const firstError = error.errors[0];

  if (!firstError) {
    return "Validation failed";
  }

  const field = firstError.path.join(".");
  const message = firstError.message;

  // If there's a field path, include it in the error message
  // Otherwise, just return the message
  return field ? `${field} ${message}` : message;
}

/**
 * Formats all Zod validation errors into structured validation error DTOs
 *
 * @param error - ZodError object from failed validation
 * @returns Array of validation error details
 *
 * @example
 * // Returns: [
 * //   { field: "overall_rating", message: "Required" },
 * //   { field: "brand_name", message: "String must contain at least 1 character(s)" }
 * // ]
 * formatZodErrors(zodError);
 */
export function formatZodErrors(error: ZodError): ValidationErrorDTO[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}
