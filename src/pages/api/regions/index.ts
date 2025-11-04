import { listRegions } from "@/lib/services/regions.service";
import { regionsQuerySchema } from "@/lib/validators/regions-query.validator";
import type { APIRoute } from "astro";
import { formatZodError } from "../../../lib/helpers/format-error";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/regions
 * Retrieves a paginated list of all regions with optional search and pagination
 * Public endpoint - no authentication required
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase } = locals;

    // Note: No authentication required for public read access
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract query parameters
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const searchParam = url.searchParams.get("search");

    // Validate and parse query parameters
    const validationResult = regionsQuerySchema.safeParse({
      page: pageParam,
      limit: limitParam,
      search: searchParam || undefined,
    });

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      const errorResponse: ErrorResponseDTO = {
        error: `Invalid query parameters: ${errorMessage}`,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch regions from service layer
    const result = await listRegions(supabase, validationResult.data);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
