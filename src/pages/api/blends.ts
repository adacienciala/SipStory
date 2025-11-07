import { formatZodError, formatZodErrors } from "@/lib/helpers/format-error";
import { createBlend, listBlends } from "@/lib/services/blends.service";
import { blendsQuerySchema } from "@/lib/validators/blends-query.validator";
import { createBlendSchema } from "@/lib/validators/create-blend.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/blends
 * Retrieves a paginated list of all blends with optional filtering and search
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
    const brandIdParam = url.searchParams.get("brand_id");
    const regionIdParam = url.searchParams.get("region_id");
    const searchParam = url.searchParams.get("search");

    // Validate and parse query parameters
    const validationResult = blendsQuerySchema.safeParse({
      page: pageParam,
      limit: limitParam,
      brand_id: brandIdParam,
      region_id: regionIdParam,
      search: searchParam,
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

    // Fetch blends from service layer
    const result = await listBlends(supabase, validationResult.data);

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

/**
 * POST /api/blends
 * Creates a new blend with flexible brand/region resolution
 * Requires authentication
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Extract Supabase client from middleware
    const { supabase, user } = locals;

    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: "Database client not available",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Guard: Check if user is authenticated
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized - Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid JSON in request body",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate request body with Zod schema
    const validationResult = createBlendSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const details = formatZodErrors(validationResult.error);
      const errorResponse: ErrorResponseDTO = {
        error: "Validation failed",
        details,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedData = validationResult.data;

    // Call service layer to create blend
    const result = await createBlend(supabase, validatedData);

    // Handle service layer result
    if (!result.success) {
      switch (result.error.type) {
        case "brand_not_found": {
          const brandErrorResponse: ErrorResponseDTO = {
            error: "Brand not found",
          };
          return new Response(JSON.stringify(brandErrorResponse), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "region_not_found": {
          const regionErrorResponse: ErrorResponseDTO = {
            error: "Region not found",
          };
          return new Response(JSON.stringify(regionErrorResponse), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "duplicate_blend": {
          const duplicateErrorResponse: ErrorResponseDTO = {
            error: "Blend already exists",
          };
          return new Response(JSON.stringify(duplicateErrorResponse), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          });
        }

        case "database_error": {
          // eslint-disable-next-line no-console
          console.error("Database error:", result.error.message);
          const dbErrorResponse: ErrorResponseDTO = {
            error: "Internal server error",
          };
          return new Response(JSON.stringify(dbErrorResponse), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    // Happy path: Return created blend with 201 status
    return new Response(JSON.stringify(result.data), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log unexpected errors
    // eslint-disable-next-line no-console
    console.error("API route error:", error);
    const errorResponse: ErrorResponseDTO = {
      error: "Internal server error",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
