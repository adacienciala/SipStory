import { formatZodError } from "@/lib/helpers/format-error";
import { getRegionById } from "@/lib/services/regions.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/regions/:id
 * Retrieves a single region by its UUID
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Extract Supabase client from middleware
    const { supabase } = locals;

    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: "Database client not available",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract id from path params
    const { id } = params;

    // Guard clause: Validate UUID format
    const validationResult = uuidSchema.safeParse(id);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      const errorResponse: ErrorResponseDTO = {
        error: errorMessage,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch region from service layer
    const region = await getRegionById(supabase, validationResult.data);

    // Guard clause: Check if region exists
    if (!region) {
      const errorResponse: ErrorResponseDTO = {
        error: "Region not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Happy path: Return success response
    return new Response(JSON.stringify(region), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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
