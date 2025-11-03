import { z } from "zod";
import { paginationQuerySchema } from "./pagination.validator";

/**
 * Zod schema for validating query parameters when listing brands
 * Ensures pagination and search parameters are valid before processing
 */
export const brandsQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().max(255).trim().optional(),
});

export type BrandsQuery = z.infer<typeof brandsQuerySchema>;
