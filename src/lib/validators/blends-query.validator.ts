import { z } from "zod";
import { paginationQuerySchema } from "./pagination.validator";

/**
 * Zod schema for validating query parameters when listing blends
 * Ensures pagination, filtering, and search parameters are valid before processing
 */
export const blendsQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  brand_id: z.string().uuid("Invalid brand UUID format").nullable().optional(),
  region_id: z.string().uuid("Invalid region UUID format").nullable().optional(),
  search: z.string().max(255).trim().nullable().optional(),
});

export type BlendsQuery = z.infer<typeof blendsQuerySchema>;
