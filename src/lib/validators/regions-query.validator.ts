import { z } from "zod";
import { paginationQuerySchema } from "./pagination.validator";

/**
 * Zod schema for validating query parameters when listing regions
 * Ensures pagination and search parameters are valid before processing
 */
export const regionsQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().max(255).trim().optional(),
});

export type RegionsQuery = z.infer<typeof regionsQuerySchema>;
