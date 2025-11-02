import type { APIRoute } from "astro";

import { formatZodErrors } from "../../../lib/helpers/format-error";
import { deleteTastingNote, updateTastingNote } from "../../../lib/services/tasting-notes.service";
import { updateTastingNoteSchema } from "../../../lib/validators/update-tasting-note.validator";
import { uuidSchema } from "../../../lib/validators/uuid.validator";
import type { ErrorResponseDTO, TastingNoteResponseDTO } from "../../../types";

// Disable prerendering for this API route (server-side only)
export const prerender = false;

/**
 * GET /api/tasting-notes/:id
 * Retrieves a single tasting note by its UUID for the authenticated user
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

    // TODO: Replace with actual user ID from authenticated session
    // For now, using a mock user ID for development
    const mockUserId = "00000000-0000-0000-0000-000000000000";

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

    // TODO: Replace with actual service call when database is ready
    // const note = await getTastingNoteById(supabase, mockUserId, validationResult.data);
    //
    // if (!note) {
    //   const errorResponse: ErrorResponseDTO = {
    //     error: "Tasting note not found",
    //   };
    //   return new Response(JSON.stringify(errorResponse), {
    //     status: 404,
    //     headers: { "Content-Type": "application/json" },
    //   });
    // }
    //
    // return new Response(JSON.stringify(note), {
    //   status: 200,
    //   headers: { "Content-Type": "application/json" },
    // });

    // Return mocked data for now
    // Check if the requested ID matches our mock data
    const validatedId = validationResult.data;

    if (validatedId === "123e4567-e89b-12d3-a456-426614174000") {
      const mockedResponse: TastingNoteResponseDTO = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        user_id: mockUserId,
        blend: {
          id: "blend-001",
          name: "Ceremonial Grade",
          brand: {
            id: "brand-001",
            name: "Ippodo Tea",
          },
          region: {
            id: "region-001",
            name: "Uji, Kyoto",
          },
        },
        overall_rating: 5,
        umami: 5,
        bitter: 2,
        sweet: 4,
        foam: 5,
        notes_koicha: "Rich umami, creamy texture, minimal bitterness",
        notes_milk: "Smooth and balanced, complements milk well",
        price_pln: 150,
        purchase_source: "https://ippodo-tea.co.jp",
        created_at: "2025-10-20T10:30:00Z",
        updated_at: "2025-10-20T10:30:00Z",
      };

      return new Response(JSON.stringify(mockedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (validatedId === "223e4567-e89b-12d3-a456-426614174001") {
      const mockedResponse: TastingNoteResponseDTO = {
        id: "223e4567-e89b-12d3-a456-426614174001",
        user_id: mockUserId,
        blend: {
          id: "blend-002",
          name: "Daily Matcha",
          brand: {
            id: "brand-002",
            name: "Maiko Tea",
          },
          region: {
            id: "region-001",
            name: "Uji, Kyoto",
          },
        },
        overall_rating: 4,
        umami: 3,
        bitter: 3,
        sweet: 3,
        foam: 4,
        notes_koicha: "Good for everyday use, balanced flavor",
        notes_milk: "Works well with oat milk",
        price_pln: 80,
        purchase_source: "Local tea shop",
        created_at: "2025-10-19T14:15:00Z",
        updated_at: "2025-10-19T14:15:00Z",
      };

      return new Response(JSON.stringify(mockedResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For any other valid UUID, return 404
    const errorResponse: ErrorResponseDTO = {
      error: "Tasting note not found",
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 404,
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
