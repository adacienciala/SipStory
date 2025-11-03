import type { APIRoute } from "astro";

import { formatZodErrors } from "../../../lib/helpers/format-error";
import { deleteTastingNote, getTastingNoteById, updateTastingNote } from "../../../lib/services/tasting-notes.service";
import { updateTastingNoteSchema } from "../../../lib/validators/update-tasting-note.validator";
import { uuidSchema } from "../../../lib/validators/uuid.validator";
import type { ErrorResponseDTO } from "../../../types";

// Disable prerendering for this API route (server-side only)
export const prerender = false;

/**
 * GET /api/tasting-notes/:id
 * Retrieves a single tasting note by its UUID for the authenticated user
 */
export const GET: APIRoute = async ({ params, locals }) => {
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

    // Extract and validate ID from path parameters
    const { id } = params;

    if (!id) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note ID is required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const validationResult = uuidSchema.safeParse(id);

    if (!validationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid tasting note ID format",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const note = await getTastingNoteById(supabase, user.id, validationResult.data);

    if (!note) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(note), {
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
 * PATCH /api/tasting-notes/:id
 * Updates an existing tasting note owned by the authenticated user
 * Supports partial updates - only provided fields are modified
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
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

    // Extract and validate ID from path parameters
    const { id } = params;

    if (!id) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note ID is required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const idValidationResult = uuidSchema.safeParse(id);

    if (!idValidationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid tasting note ID format",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedId = idValidationResult.data;

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
    const validationResult = updateTastingNoteSchema.safeParse(requestBody);

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

    // Call service layer to update tasting note
    const note = await updateTastingNote(supabase, user.id, validatedId, validatedData);

    // Handle case where note doesn't exist or doesn't belong to user
    if (!note) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(note), {
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
 * DELETE /api/tasting-notes/:id
 * Permanently deletes a tasting note owned by the authenticated user
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
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

    // Extract and validate ID from path parameters
    const { id } = params;

    if (!id) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note ID is required",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate UUID format
    const idValidationResult = uuidSchema.safeParse(id);

    if (!idValidationResult.success) {
      const errorResponse: ErrorResponseDTO = {
        error: "Invalid tasting note ID format",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validatedId = idValidationResult.data;

    // Call service layer to delete tasting note
    const deleted = await deleteTastingNote(supabase, user.id, validatedId);

    // Handle case where note doesn't exist or doesn't belong to user
    if (!deleted) {
      const errorResponse: ErrorResponseDTO = {
        error: "Tasting note not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return 204 No Content on successful deletion
    return new Response(null, { status: 204 });
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
