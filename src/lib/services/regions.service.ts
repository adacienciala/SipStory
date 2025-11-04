import type { SupabaseClient } from "../../db/supabase.client";
import type { RegionsListResponseDTO, RegionsQueryDTO } from "../../types";

/**
 * Retrieves a paginated list of all regions with optional search
 * Regions are public global data, accessible without authentication
 */
export async function listRegions(supabase: SupabaseClient, query: RegionsQueryDTO): Promise<RegionsListResponseDTO> {
  const { page, limit, search } = query;

  // Handle nullish values
  const effectivePage = page ?? 1;
  const effectiveLimit = limit ?? 20;

  // Build base query
  let dbQuery = supabase.from("regions").select("*", { count: "exact" });

  // Apply search filter if provided (case-insensitive substring match)
  if (search && search.trim()) {
    dbQuery = dbQuery.ilike("name", `%${search.trim()}%`);
  }

  // Apply sorting (alphabetical by name for regions)
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

  // Return paginated response (no transformation needed - direct mapping)
  return {
    data: data || [],
    pagination: {
      total: count || 0,
      page: effectivePage,
      limit: effectiveLimit,
    },
  };
}
