/**
 * Data Transfer Objects (DTOs) and Command Models for SipStory API
 *
 * This file contains all type definitions for API requests and responses.
 * All DTOs are derived from or connected to database entity definitions
 * from src/db/database.types.ts
 */

import type { Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Entity Type Aliases (for cleaner references)
// ============================================================================

export type BrandEntity = Tables<"brands">;
export type RegionEntity = Tables<"regions">;
export type BlendEntity = Tables<"blends">;
export type TastingNoteEntity = Tables<"tasting_notes">;

// ============================================================================
// Nested Object Types (reusable across DTOs)
// ============================================================================

/**
 * Nested brand object used in response DTOs
 * Contains only id and name for lightweight responses
 */
export interface NestedBrandDTO {
  id: string;
  name: string;
}

/**
 * Nested region object used in response DTOs
 * Contains only id and name for lightweight responses
 */
export interface NestedRegionDTO {
  id: string;
  name: string;
}

/**
 * Nested blend object used in tasting note responses
 * Contains blend data with nested brand and region
 */
export interface NestedBlendDTO {
  id: string;
  name: string;
  brand: NestedBrandDTO;
  region: NestedRegionDTO;
}

// ============================================================================
// Response DTOs - Simple Resources
// ============================================================================

/**
 * Brand response DTO
 * Direct mapping from brands entity
 */
export type BrandResponseDTO = BrandEntity;

/**
 * Region response DTO
 * Direct mapping from regions entity
 */
export type RegionResponseDTO = RegionEntity;

// ============================================================================
// Response DTOs - Nested Resources
// ============================================================================

/**
 * Blend response DTO with nested brand and region
 * Represents a blend with its associated brand and region of origin
 */
export interface BlendResponseDTO {
  id: string;
  name: string;
  brand_id: string;
  region_id: string;
  created_at: string;
  brand: NestedBrandDTO;
  region: NestedRegionDTO;
}

/**
 * Tasting note response DTO with nested blend, brand, and region
 * Represents a complete tasting note with all associated data
 */
export interface TastingNoteResponseDTO {
  id: string;
  user_id: string;
  blend: NestedBlendDTO;
  overall_rating: number;
  umami: number | null;
  bitter: number | null;
  sweet: number | null;
  foam: number | null;
  notes_koicha: string | null;
  notes_milk: string | null;
  price_pln: number | null;
  purchase_source: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Command Models - Create Operations
// ============================================================================

/**
 * Command model for creating a new blend
 * Can reference existing entities by ID or create new ones by name
 */
export interface CreateBlendDTO {
  name: string;
  brand: {
    id?: string | null;
    name?: string | null;
  };
  region: {
    id?: string | null;
    name?: string | null;
  };
}

/**
 * Command model for creating a new tasting note
 * Contains user-provided input with blend_id (must exist)
 * Users must create blends separately before creating tasting notes
 */
export interface CreateTastingNoteDTO {
  // Required fields
  blend_id: string; // UUID of existing blend
  overall_rating: number; // 1-5

  // Optional rating fields
  umami?: number | null; // 1-5
  bitter?: number | null; // 1-5
  sweet?: number | null; // 1-5
  foam?: number | null; // 1-5

  // Optional text fields
  notes_koicha?: string | null;
  notes_milk?: string | null;

  // Optional metadata
  price_pln?: number | null; // Full zloty
  purchase_source?: string | null;
}

// ============================================================================
// Command Models - Update Operations
// ============================================================================

/**
 * Command model for updating an existing tasting note
 * Partial update - only provided fields will be updated
 * Brand/blend/region cannot be changed via this model
 * Derived from TastingNoteEntity but excludes immutable fields
 */
export type UpdateTastingNoteDTO = Partial<
  Omit<TastingNoteEntity, "id" | "user_id" | "blend_id" | "created_at" | "updated_at">
>;

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetaDTO {
  total: number;
  page: number;
  limit: number;
}

/**
 * Common pagination query parameters
 */
export interface PaginationQueryDTO {
  page?: number | null;
  limit?: number | null;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;
}

// ============================================================================
// List Response DTOs
// ============================================================================

/**
 * Paginated list of tasting notes
 */
export type TastingNotesListResponseDTO = PaginatedResponseDTO<TastingNoteResponseDTO>;

/**
 * Paginated list of brands
 */
export type BrandsListResponseDTO = PaginatedResponseDTO<BrandResponseDTO>;

/**
 * Paginated list of regions
 */
export type RegionsListResponseDTO = PaginatedResponseDTO<RegionResponseDTO>;

/**
 * Paginated list of blends
 */
export type BlendsListResponseDTO = PaginatedResponseDTO<BlendResponseDTO>;

// ============================================================================
// Special Response DTOs
// ============================================================================

/**
 * Response for listing two tasting notes by ids
 * Always contains exactly 2 notes
 */
export interface SelectNotesResponseDTO {
  notes: [TastingNoteResponseDTO, TastingNoteResponseDTO];
}

// ============================================================================
// Query Parameter DTOs
// ============================================================================

/**
 * Query parameters for listing tasting notes with filters and sorting
 */
export interface TastingNotesQueryDTO extends PaginationQueryDTO {
  brand_ids?: string[] | null; // Array of brand UUIDs
  region_ids?: string[] | null; // Array of region UUIDs
  min_rating?: number | null; // 1-5
  sort_by?: "created_at" | "updated_at" | "overall_rating" | null;
  sort_order?: "asc" | "desc" | null;
}

/**
 * Query parameters for listing brands with search
 */
export interface BrandsQueryDTO extends PaginationQueryDTO {
  search?: string;
}

/**
 * Query parameters for listing regions with search
 */
export interface RegionsQueryDTO extends PaginationQueryDTO {
  search?: string;
}

/**
 * Query parameters for listing blends with filters and search
 */
export interface BlendsQueryDTO extends PaginationQueryDTO {
  brand_id?: string;
  region_id?: string;
  search?: string;
}

/**
 * Query parameters for selecting tasting notes
 * Expects exactly 2 comma-separated UUIDs
 */
export interface SelectNotesQueryDTO {
  ids: string; // Comma-separated UUIDs, e.g., "uuid1,uuid2"
}

// ============================================================================
// Error Response DTOs
// ============================================================================

/**
 * Validation error detail for a specific field
 */
export interface ValidationErrorDTO {
  field: string;
  message: string;
}

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: string;
  details?: ValidationErrorDTO[];
}

// ============================================================================
// Database Insert/Update Type Aliases
// ============================================================================

/**
 * Type for inserting a new brand into the database
 * Derived from database schema Insert type
 */
export type BrandInsert = TablesInsert<"brands">;

/**
 * Type for inserting a new region into the database
 * Derived from database schema Insert type
 */
export type RegionInsert = TablesInsert<"regions">;

/**
 * Type for inserting a new blend into the database
 * Derived from database schema Insert type
 */
export type BlendInsert = TablesInsert<"blends">;

/**
 * Type for inserting a new tasting note into the database
 * Derived from database schema Insert type
 */
export type TastingNoteInsert = TablesInsert<"tasting_notes">;

/**
 * Type for updating a tasting note in the database
 * Derived from database schema Update type
 */
export type TastingNoteUpdate = TablesUpdate<"tasting_notes">;
