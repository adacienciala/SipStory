import type { APIRoute } from "astro";

import { formatZodError } from "../../lib/helpers/format-error";
import { tastingNotesQuerySchema } from "../../lib/validators/tasting-notes.validator";
import type { ErrorResponseDTO, TastingNotesListResponseDTO } from "../../types";

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

    // TODO: Replace with actual service call when database is ready
    // make sure to return paginated results (empty if wrong)
    // const result = await listTastingNotes(supabase, mockUserId, validatedQuery);

    // Return mocked data for now
    const mockedResponse: TastingNotesListResponseDTO = {
      data: [
        {
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
        },
        {
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
        },
      ],
      pagination: {
        total: 2,
        page: validatedQuery.page || 1,
        limit: validatedQuery.limit || 20,
      },
    };

    return new Response(JSON.stringify(mockedResponse), {
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
