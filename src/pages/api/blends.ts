import { formatZodErrors } from "@/lib/helpers/format-error";
import { createBlend } from "@/lib/services/blends.service";
import { createBlendSchema } from "@/lib/validators/create-blend.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

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
