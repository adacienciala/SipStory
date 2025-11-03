import type { APIRoute } from "astro";

import { formatZodError, formatZodErrors } from "../../lib/helpers/format-error";
// Import service for POST handler (used when database is ready)
import { createTastingNote, listTastingNotes } from "../../lib/services/tasting-notes.service";
import { createTastingNoteSchema } from "../../lib/validators/create-tasting-note.validator";
import { tastingNotesQuerySchema } from "../../lib/validators/tasting-notes.validator";
import type { ErrorResponseDTO } from "../../types";

// Disable prerendering for this API route (server-side only)
export const prerender = false;

/**
 * GET /api/tasting-notes
 * Retrieves a paginated list of tasting notes for the authenticated user
 * with optional filtering by brand, region, and rating, plus sorting options
 */
export const GET: APIRoute = async ({ request, locals }) => {
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

    // Extract and parse query parameters from URL
    const url = new URL(request.url);
    const queryParams = {
      page: url.searchParams.get("page"),
      limit: url.searchParams.get("limit"),
      brand_ids: url.searchParams.get("brand_ids"),
      region_ids: url.searchParams.get("region_ids"),
      min_rating: url.searchParams.get("min_rating"),
      sort_by: url.searchParams.get("sort_by"),
      sort_order: url.searchParams.get("sort_order"),
    };

    // Validate query parameters with Zod schema
    const validationResult = tastingNotesQuerySchema.safeParse(queryParams);

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

    const validatedQuery = validationResult.data;

    const result = await listTastingNotes(supabase, user.id, validatedQuery);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error server-side (with context for debugging)
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

/**
 * POST /api/tasting-notes
 * Creates a new tasting note for the authenticated user
 * Automatically resolves or creates related entities (region, brand, blend)
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
    const validationResult = createTastingNoteSchema.safeParse(requestBody);

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

    // Call service layer to create tasting note
    const note = await createTastingNote(supabase, user.id, validatedData);

    // Handle case where blend doesn't exist
    if (!note) {
      const errorResponse: ErrorResponseDTO = {
        error: "Blend not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(note), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error server-side (with context for debugging)
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
