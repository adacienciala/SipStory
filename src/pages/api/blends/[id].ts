import { formatZodError } from "@/lib/helpers/format-error";
import { getBlendById } from "@/lib/services/blends.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/blends/:id
 * Retrieves a single blend by its UUID with nested brand and region
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

    // Fetch blend from service layer
    const blend = await getBlendById(supabase, validationResult.data);

    // Guard clause: Check if blend exists
    if (!blend) {
      const errorResponse: ErrorResponseDTO = {
        error: "Blend not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Happy path: Return success response
    return new Response(JSON.stringify(blend), {
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
