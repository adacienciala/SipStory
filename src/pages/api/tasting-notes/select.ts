import { selectTastingNotes } from "@/lib/services/tasting-notes.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import type { APIRoute } from "astro";
import type { ErrorResponseDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/tasting-notes/select
 * Retrieves exactly two specific tasting notes by their UUIDs for comparison
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase, user } = locals;

    // Check authentication
    if (!supabase) {
      const errorResponse: ErrorResponseDTO = {
        error: "Database client not available",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is authenticated
    if (!user) {
      const errorResponse: ErrorResponseDTO = {
        error: "Unauthorized - Authentication required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and validate query parameters
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return new Response(JSON.stringify({ error: "ids parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse comma-separated IDs
    const ids = idsParam.split(",").map((id) => id.trim());

    // Validate exactly 2 IDs
    if (ids.length !== 2) {
      return new Response(JSON.stringify({ error: "Exactly 2 tasting note IDs are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate each UUID format
    const uuidValidationResults = ids.map((id) => uuidSchema.safeParse(id));
    const hasInvalidUuid = uuidValidationResults.some((result) => !result.success);

    if (hasInvalidUuid) {
      return new Response(JSON.stringify({ error: "Invalid UUID format for one or more IDs" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract validated IDs (safe because we checked all are successful)
    const validatedIds = uuidValidationResults.map((result) => result.data as string);

    // Fetch tasting notes from service layer
    const notes = await selectTastingNotes(supabase, user.id, validatedIds);

    // Return 404 if one or both notes not found or don't belong to user
    if (!notes || notes.length !== 2) {
      return new Response(JSON.stringify({ error: "One or more tasting notes not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return successful response with both notes
    return new Response(
      JSON.stringify({
        notes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
