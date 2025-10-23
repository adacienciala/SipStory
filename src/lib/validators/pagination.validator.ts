import { z } from "zod";

/**
 * Reusable pagination query schema
 * Validates page number and limit parameters with sensible defaults
 *
 * @example
 * const schema = z.object({
 *   ...PaginationQuerySchema.shape,
 *   // ... other fields
 * });
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce
    .number({ invalid_type_error: "must be a number" })
    .int("must be an integer")
    .positive("must be a positive integer")
    .nullable(),

  limit: z.coerce
    .number({ invalid_type_error: "must be a number" })
    .int("must be an integer")
    .min(1, "must be at least 1")
    .max(100, "must be at most 100")
    .nullable(),
});

/**
 * Inferred type for pagination parameters
 */
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
