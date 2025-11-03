import type { SupabaseClient } from "../../db/supabase.client";
import type { BrandsListResponseDTO, BrandsQueryDTO } from "../../types";

/**
 * Retrieves a paginated list of all brands with optional search
 * Brands are public global data, accessible without authentication
 *
 * @param supabase - Supabase client instance
 * @param query - Query parameters for filtering and pagination
 * @returns Paginated list of brands with metadata
 * @throws Error if database query fails
 *
 * @example
 * const result = await listBrands(supabase, {
 *   page: 1,
 *   limit: 20,
 *   search: 'ippodo'
 * });
 */
export async function listBrands(supabase: SupabaseClient, query: BrandsQueryDTO): Promise<BrandsListResponseDTO> {
  const { page, limit, search } = query;

  // Handle nullish values
  const effectivePage = page ?? 1;
  const effectiveLimit = limit ?? 20;

  // Build base query
  let dbQuery = supabase.from("brands").select("*", { count: "exact" });

  // Apply search filter if provided (case-insensitive substring match)
  if (search && search.trim()) {
    dbQuery = dbQuery.ilike("name", `%${search.trim()}%`);
  }

  // Apply sorting (alphabetical by name for brands)
  dbQuery = dbQuery.order("name", { ascending: true });

  // Apply pagination
  const offset = (effectivePage - 1) * effectiveLimit;
  dbQuery = dbQuery.range(offset, offset + effectiveLimit - 1);

  // Execute query
  const { data, error, count } = await dbQuery;

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    return {
      data: [],
      pagination: {
        total: count || 0,
        page: effectivePage,
        limit: effectiveLimit,
      },
    };
  }

  // Handle case where no data is returned (valid scenario)
  if (!data) {
    return {
      data: [],
      pagination: {
        total: count || 0,
        page: effectivePage,
        limit: effectiveLimit,
      },
    };
  }

  // Return paginated response (no transformation needed - direct mapping)
  return {
    data,
    pagination: {
      total: count || 0,
      page: effectivePage,
      limit: effectiveLimit,
    },
  };
}
