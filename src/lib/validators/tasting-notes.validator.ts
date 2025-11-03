import { z } from "zod";

import { paginationQuerySchema } from "./pagination.validator";

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

/**
 * Schema for parsing comma-separated UUID strings
 * Splits by comma, filters empty strings, and validates each as UUID
 */
const commaSeparatedUuidsSchema = z
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(z.array(uuidSchema).min(1, "At least one UUID is required"));

/**
 * Validation schema for tasting notes list query parameters
 * Validates pagination, filtering, and sorting parameters
 */
export const tastingNotesQuerySchema = z.object({
  // Pagination parameters
  ...paginationQuerySchema.shape,

  // Filter parameters
  brand_ids: commaSeparatedUuidsSchema.nullable(),

  region_ids: commaSeparatedUuidsSchema.nullable(),

  min_rating: z.coerce
    .number({ invalid_type_error: "must be a number" })
    .int("must be an integer")
    .min(1, "must be at least 1")
    .max(5, "must be at most 5")
    .nullable(),

  // Sorting parameters
  sort_by: z
    .enum(["created_at", "updated_at", "overall_rating"], {
      errorMap: () => ({
        message: "must be one of: created_at, updated_at, overall_rating",
      }),
    })
    .nullable()
    .default("created_at"),

  sort_order: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "must be one of: asc, desc" }),
    })
    .nullable()
    .default("desc"),
});

/**
 * Inferred type from the validation schema
 */
export type TastingNotesQueryInput = z.infer<typeof tastingNotesQuerySchema>;
