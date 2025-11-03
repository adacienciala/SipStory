import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreateTastingNoteDTO,
  NestedBlendDTO,
  TastingNoteEntity,
  TastingNoteResponseDTO,
  TastingNotesListResponseDTO,
  TastingNotesQueryDTO,
  TastingNoteUpdate,
  UpdateTastingNoteDTO,
} from "../../types";

/**
 * Database result type from Supabase query with nested relations
 * Matches the exact structure returned by the select query
 * Note: Uses alias 'blend' instead of table name 'blends' for semantic correctness
 */
type DatabaseTastingNoteResult = TastingNoteEntity & {
  blend: NestedBlendDTO;
};

/**
 * Transforms a database result row into a TastingNoteResponseDTO
 * Restructures the nested relations to match the API response format
 *
 * @param row - Raw database result with nested relations
 * @returns Formatted tasting note response DTO
 * @throws Error if blend data is missing (should not happen with proper foreign keys)
 */
function transformToTastingNoteResponseDTO(row: DatabaseTastingNoteResult): TastingNoteResponseDTO {
  if (!row.blend) {
    throw new Error(`Blend data missing for tasting note ${row.id}`);
  }

  return {
    id: row.id,
    user_id: row.user_id,
    blend: row.blend,
    overall_rating: row.overall_rating,
    umami: row.umami,
    bitter: row.bitter,
    sweet: row.sweet,
    foam: row.foam,
    notes_koicha: row.notes_koicha,
    notes_milk: row.notes_milk,
    price_pln: row.price_pln,
    purchase_source: row.purchase_source,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Retrieves a paginated list of tasting notes for a specific user
 * with optional filtering and sorting
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param query - Query parameters for filtering, sorting, and pagination
 * @returns Paginated list of tasting notes with metadata
 * @throws Error if database query fails
 *
 * @example
 * const result = await listTastingNotes(supabase, userId, {
 *   page: 1,
 *   limit: 20,
 *   brand_ids: ['uuid1', 'uuid2'],
 *   min_rating: 4,
 *   sort_by: 'overall_rating',
 *   sort_order: 'desc'
 * });
 */
export async function listTastingNotes(
  supabase: SupabaseClient,
  userId: string,
  query: TastingNotesQueryDTO
): Promise<TastingNotesListResponseDTO> {
  const { page, limit, brand_ids, region_ids, min_rating, sort_by = "created_at", sort_order = "desc" } = query;

  // Handle nullish values
  const effectivePage = page ?? 1;
  const effectiveLimit = limit ?? 20;

  // Calculate pagination offset
  const offset = (effectivePage - 1) * effectiveLimit;

  // Build base query with nested relations
  // Using aliases to match API response structure (blend, brand, region)
  let dbQuery = supabase
    .from("tasting_notes")
    .select(
      `
      *,
      blend:blends!inner (
        id,
        name,
        brand:brands!inner (
          id,
          name
        ),
        region:regions!inner (
          id,
          name
        )
      )
    `,
      { count: "exact" }
    )
    .eq("user_id", userId);

  // Apply brand filter if provided
  if (brand_ids && brand_ids.length > 0) {
    dbQuery = dbQuery.in("blend.brand_id", brand_ids);
  }

  // Apply region filter if provided
  if (region_ids && region_ids.length > 0) {
    dbQuery = dbQuery.in("blend.region_id", region_ids);
  }

  // Apply minimum rating filter if provided
  if (min_rating !== undefined) {
    dbQuery = dbQuery.gte("overall_rating", min_rating);
  }

  // Apply sorting
  dbQuery = dbQuery.order(sort_by, { ascending: sort_order === "asc" });

  // Apply pagination
  dbQuery = dbQuery.range(offset, offset + effectiveLimit - 1);

  // Execute query
  const { data, error, count } = await dbQuery;

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    throw new Error(`Failed to fetch tasting notes: ${error.message}`);
  }

  // Handle case where no data is returned (valid scenario)
  if (!data) {
    return {
      data: [],
      pagination: {
        total: 0,
        page: effectivePage,
        limit: effectiveLimit,
      },
    };
  }

  // Transform database results to DTOs
  const transformedData = data.map(transformToTastingNoteResponseDTO);

  // Return paginated response
  return {
    data: transformedData,
    pagination: {
      total: count || 0,
      page: effectivePage,
      limit: effectiveLimit,
    },
  };
}

/**
 * Retrieves a single tasting note by its ID for a specific user
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param id - UUID of the tasting note to retrieve
 * @returns Single tasting note or null if not found
 * @throws Error if database query fails
 *
 * @example
 * const note = await getTastingNoteById(supabase, userId, '123e4567-e89b-12d3-a456-426614174000');
 * if (note) {
 *   console.log(note.blend.brand.name);
 * }
 */
export async function getTastingNoteById(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<TastingNoteResponseDTO | null> {
  // Build query with nested relations (same structure as list)
  const { data, error } = await supabase
    .from("tasting_notes")
    .select(
      `
      *,
      blend:blends!inner (
        id,
        name,
        brand:brands!inner (
          id,
          name
        ),
        region:regions!inner (
          id,
          name
        )
      )
    `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    throw new Error(`Failed to fetch tasting note: ${error.message}`);
  }

  // Return null if not found (valid scenario)
  if (!data) {
    return null;
  }

  // Transform database result to DTO
  return transformToTastingNoteResponseDTO(data);
}

/**
 * Creates a new tasting note using an existing blend ID
 * Validates that the blend exists before creating the note
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param data - Validated tasting note data from request
 * @returns Newly created tasting note with nested relations, or null if blend not found
 * @throws Error if database operation fails
 *
 * @example
 * const note = await createTastingNote(supabase, userId, {
 *   blend_id: '123e4567-e89b-12d3-a456-426614174000',
 *   overall_rating: 5,
 *   umami: 5,
 *   notes_koicha: 'Rich and creamy'
 * });
 */
export async function createTastingNote(
  supabase: SupabaseClient,
  userId: string,
  data: CreateTastingNoteDTO
): Promise<TastingNoteResponseDTO | null> {
  // Step 1: Verify blend exists
  const { data: blendExists } = await supabase
    .from("blends")
    .select("id")
    .eq("id", data.blend_id)
    .limit(1)
    .maybeSingle();

  if (!blendExists) {
    return null; // Blend not found
  }

  // Step 2: Create tasting note
  const { data: tastingNote, error } = await supabase
    .from("tasting_notes")
    .insert({
      user_id: userId,
      blend_id: data.blend_id,
      overall_rating: data.overall_rating,
      umami: data.umami ?? null,
      bitter: data.bitter ?? null,
      sweet: data.sweet ?? null,
      foam: data.foam ?? null,
      notes_koicha: data.notes_koicha ?? null,
      notes_milk: data.notes_milk ?? null,
      price_pln: data.price_pln ?? null,
      purchase_source: data.purchase_source ?? null,
    })
    .select()
    .single();

  if (error || !tastingNote) {
    throw new Error(`Failed to create tasting note: ${error?.message || "Unknown error"}`);
  }

  // Step 3: Fetch with complete nested relations
  const createdNote = await getTastingNoteById(supabase, userId, tastingNote.id);

  if (!createdNote) {
    throw new Error("Failed to fetch created tasting note");
  }

  return createdNote;
}

/**
 * Updates an existing tasting note owned by the authenticated user
 * Only updates fields that are provided in the data object
 * Cannot update blend_id, user_id, created_at (immutable)
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param id - UUID of the tasting note to update
 * @param data - Partial tasting note data with fields to update
 * @returns Updated tasting note with nested relations, or null if not found/unauthorized
 * @throws Error if database operation fails
 *
 * @example
 * const note = await updateTastingNote(supabase, userId, noteId, {
 *   overall_rating: 4,
 *   notes_koicha: 'Updated notes'
 * });
 */
export async function updateTastingNote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  data: UpdateTastingNoteDTO
): Promise<TastingNoteResponseDTO | null> {
  // Build update object with only provided fields
  const updateData: Partial<TastingNoteUpdate> = {};

  if (data.overall_rating !== undefined) updateData.overall_rating = data.overall_rating;
  if (data.umami !== undefined) updateData.umami = data.umami;
  if (data.bitter !== undefined) updateData.bitter = data.bitter;
  if (data.sweet !== undefined) updateData.sweet = data.sweet;
  if (data.foam !== undefined) updateData.foam = data.foam;
  if (data.notes_koicha !== undefined) updateData.notes_koicha = data.notes_koicha;
  if (data.notes_milk !== undefined) updateData.notes_milk = data.notes_milk;
  if (data.price_pln !== undefined) updateData.price_pln = data.price_pln;
  if (data.purchase_source !== undefined) updateData.purchase_source = data.purchase_source;

  // Update tasting note (RLS ensures user ownership)
  const { data: updatedNote, error } = await supabase
    .from("tasting_notes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update tasting note: ${error.message}`);
  }

  if (!updatedNote) {
    return null; // Note not found or doesn't belong to user
  }

  // Fetch with complete nested relations
  return await getTastingNoteById(supabase, userId, id);
}

/**
 * Deletes an existing tasting note owned by the authenticated user
 * Permanently removes the note from the database
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param id - UUID of the tasting note to delete
 * @returns True if note was deleted, false if not found/unauthorized
 * @throws Error if database operation fails
 *
 * @example
 * const deleted = await deleteTastingNote(supabase, userId, noteId);
 * if (deleted) {
 *   console.log('Note deleted successfully');
 * }
 */
export async function deleteTastingNote(supabase: SupabaseClient, userId: string, id: string): Promise<boolean> {
  // Delete tasting note (RLS ensures user ownership)
  const { data, error } = await supabase
    .from("tasting_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete tasting note: ${error.message}`);
  }

  // Return true if a row was deleted, false if not found
  return data !== null;
}

/**
 * Retrieves exactly two specific tasting notes by their IDs for comparison
 * Used for the side-by-side comparison feature
 *
 * @param supabase - Supabase client instance
 * @param userId - UUID of the authenticated user
 * @param ids - Array of exactly 2 UUIDs to retrieve
 * @returns Array of exactly 2 tasting notes in requested order, or null if not all found
 * @throws Error if database query fails
 *
 * @example
 * const notes = await selectTastingNotes(supabase, userId, [
 *   '123e4567-e89b-12d3-a456-426614174000',
 *   '223e4567-e89b-12d3-a456-426614174001'
 * ]);
 * if (notes) {
 *   console.log('Compare', notes[0].blend.name, 'vs', notes[1].blend.name);
 * }
 */
export async function selectTastingNotes(
  supabase: SupabaseClient,
  userId: string,
  ids: string[]
): Promise<TastingNoteResponseDTO[] | null> {
  // Query with nested relations (same structure as getTastingNoteById)
  const { data, error } = await supabase
    .from("tasting_notes")
    .select(
      `
      *,
      blend:blends!inner (
        id,
        name,
        brand:brands!inner (
          id,
          name
        ),
        region:regions!inner (
          id,
          name
        )
      )
    `
    )
    .in("id", ids)
    .eq("user_id", userId);

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    throw new Error(`Failed to select tasting notes: ${error.message}`);
  }

  // Check if we got exactly 2 notes (both must exist and belong to user)
  if (!data || data.length !== 2) {
    return null;
  }

  // Sort results to match requested order (preserve order of IDs array)
  const sortedData = ids
    .map((id) => data.find((note) => note.id === id))
    .filter((note): note is DatabaseTastingNoteResult => note !== undefined);

  // Verify we still have exactly 2 notes after sorting
  if (sortedData.length !== 2) {
    return null;
  }

  // Transform database results to DTOs
  return sortedData.map(transformToTastingNoteResponseDTO);
}
