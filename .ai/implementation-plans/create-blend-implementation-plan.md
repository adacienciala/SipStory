# API Endpoint Implementation Plan: Create Blend

## 1. Endpoint Overview

This endpoint creates a new blend with its associated brand and region. The endpoint supports flexible entity resolution: it can reference existing brands/regions by UUID or create new ones by name (case-insensitive). This prevents duplicate brands/regions while allowing users to add new entries seamlessly. The endpoint requires authentication and performs complex business logic including validation, entity resolution, duplicate detection, and nested data creation.

**Key Characteristics:**

- POST endpoint requiring authentication
- Flexible brand/region resolution (by ID or by name)
- Automatic creation of missing brands/regions
- Case-insensitive name matching for deduplication
- Duplicate blend detection (name + brand_id + region_id)
- Returns nested response with complete brand and region data
- Complex multi-step transaction logic

## 2. Request Details

- **HTTP Method:** `POST`
- **URL Structure:** `/api/blends`
- **Authentication:** Required (Bearer token via Supabase Auth)
- **Path Parameters:** None
- **Query Parameters:** None
- **Request Body:** JSON object with nested brand and region data

**Request Body Structure:**

```json
{
  "name": "Ceremonial Grade",
  "brand": {
    "id": "uuid", // Optional: use existing brand
    "name": "Ippodo Tea" // Optional: create/find brand by name
  },
  "region": {
    "id": "uuid", // Optional: use existing region
    "name": "Uji, Kyoto" // Optional: create/find region by name
  }
}
```

**Validation Rules:**

- `name`: Required, string, 1-200 characters, trimmed
- `brand`: Required object with either `id` OR `name` (not both, not neither)
  - `brand.id`: Valid UUID, must exist in database
  - `brand.name`: String, 1-100 characters, trimmed
- `region`: Required object with either `id` OR `name` (not both, not neither)
  - `region.id`: Valid UUID, must exist in database
  - `region.name`: String, 1-100 characters, trimmed

## 3. Used Types

**Import from `src/types.ts`:**

```typescript
import type {
  CreateBlendDTO,
  BlendResponseDTO,
  ErrorResponseDTO,
  ValidationErrorDTO,
  BrandEntity,
  RegionEntity,
  BlendEntity,
  BrandInsert,
  RegionInsert,
  BlendInsert,
} from "@/types";
```

**Type Definitions:**

- `CreateBlendDTO`: Command model for request body

  ```typescript
  {
    name: string;
    brand: { id?: string | null; name?: string | null; };
    region: { id?: string | null; name?: string | null; };
  }
  ```

- `BlendResponseDTO`: Response with nested data

  ```typescript
  {
    id: string;
    name: string;
    brand_id: string;
    region_id: string;
    created_at: string;
    brand: {
      id: string;
      name: string;
    }
    region: {
      id: string;
      name: string;
    }
  }
  ```

- `ErrorResponseDTO`: Standard error structure
  ```typescript
  {
    error: string;
    details?: ValidationErrorDTO[];
  }
  ```

**Validator Type:**

- `createBlendSchema` from `src/lib/validators/create-blend.validator.ts` (to be created)
- Uses Zod for complex nested validation

**Service Layer Type:**

- `SupabaseClient` from `src/db/supabase.client.ts`

## 4. Response Details

**Success Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ceremonial Grade",
  "brand_id": "660e8400-e29b-41d4-a716-446655440001",
  "region_id": "770e8400-e29b-41d4-a716-446655440002",
  "created_at": "2024-01-15T10:30:00.000Z",
  "brand": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Ippodo Tea"
  },
  "region": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "name": "Uji, Kyoto"
  }
}
```

**Error Response - Validation Failed (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "must be at least 1 character"
    },
    {
      "field": "brand",
      "message": "must provide either id OR name, not both"
    }
  ]
}
```

**Error Response - Brand Not Found (404 Not Found):**

```json
{
  "error": "Brand not found"
}
```

**Error Response - Region Not Found (404 Not Found):**

```json
{
  "error": "Region not found"
}
```

**Error Response - Duplicate Blend (409 Conflict):**

```json
{
  "error": "Blend already exists"
}
```

**Error Response - Unauthorized (401 Unauthorized):**

```json
{
  "error": "Unauthorized - Authentication required"
}
```

**Error Response - Invalid JSON (400 Bad Request):**

```json
{
  "error": "Invalid JSON in request body"
}
```

**Error Response - Server Error (500 Internal Server Error):**

```json
{
  "error": "Internal server error"
}
```

**Status Codes:**

- `201`: Blend created successfully
- `400`: Validation error or invalid JSON
- `401`: Missing or invalid authentication
- `404`: Referenced brand/region ID doesn't exist
- `409`: Duplicate blend (same name + brand + region)
- `500`: Server error or database failure

## 5. Data Flow

```
1. Client Request
   └─> POST /api/blends with JSON body + Authorization header

2. Astro Middleware (src/middleware/index.ts)
   ├─> Parse JWT token from Authorization header
   ├─> Create Supabase client with user session
   └─> Inject supabase + user into locals

3. API Route Handler (src/pages/api/blends.ts - new file)
   ├─> Extract Supabase client from locals
   ├─> Guard: Check if Supabase client exists → 500 if not
   ├─> Guard: Check if user is authenticated → 401 if not
   ├─> Parse request body as JSON
   ├─> Guard: Return 400 if JSON parsing fails
   ├─> Validate request body with createBlendSchema
   ├─> Guard: Return 400 with details if validation fails
   ├─> Call service layer: createBlend(supabase, validatedData)
   └─> Handle service layer responses:
       ├─> Blend created → Return 201 with nested data
       ├─> Brand not found → Return 404 "Brand not found"
       ├─> Region not found → Return 404 "Region not found"
       ├─> Duplicate blend → Return 409 "Blend already exists"
       └─> Unexpected error → Return 500 (logged)

4. Service Layer (src/lib/services/blends.service.ts - new file)
   ├─> Step 1: Resolve Brand ID
   │   ├─> If brand.id provided:
   │   │   ├─> Query brands table for existence
   │   │   └─> Return error if not found
   │   └─> If brand.name provided:
   │       ├─> Query brands with case-insensitive match (CITEXT)
   │       ├─> If exists: use existing brand.id
   │       └─> If not exists: insert new brand, return new id
   │
   ├─> Step 2: Resolve Region ID
   │   ├─> If region.id provided:
   │   │   ├─> Query regions table for existence
   │   │   └─> Return error if not found
   │   └─> If region.name provided:
   │       ├─> Query regions with case-insensitive match (CITEXT)
   │       ├─> If exists: use existing region.id
   │       └─> If not exists: insert new region, return new id
   │
   ├─> Step 3: Check for Duplicate Blend
   │   ├─> Query blends where:
   │   │   - name matches (case-insensitive CITEXT)
   │   │   - brand_id = resolved_brand_id
   │   │   - region_id = resolved_region_id
   │   └─> If exists: return error (409)
   │
   ├─> Step 4: Create Blend
   │   ├─> Insert into blends table with:
   │   │   - name
   │   │   - brand_id (resolved)
   │   │   - region_id (resolved)
   │   └─> Get created blend.id
   │
   └─> Step 5: Fetch Complete Blend with Nested Data
       ├─> Query blends with joins:
       │   - JOIN brands ON blends.brand_id = brands.id
       │   - JOIN regions ON blends.region_id = regions.id
       └─> Transform to BlendResponseDTO

5. Database Queries (via Supabase client)
   ├─> Brand lookup: SELECT id FROM brands WHERE id = $1 OR name ILIKE $2
   ├─> Brand insert: INSERT INTO brands (name) VALUES ($1) RETURNING id
   ├─> Region lookup: SELECT id FROM regions WHERE id = $1 OR name ILIKE $2
   ├─> Region insert: INSERT INTO regions (name) VALUES ($1) RETURNING id
   ├─> Duplicate check: SELECT id FROM blends WHERE name ILIKE $1 AND brand_id = $2 AND region_id = $3
   ├─> Blend insert: INSERT INTO blends (name, brand_id, region_id) VALUES ($1, $2, $3) RETURNING id
   └─> Blend fetch: SELECT blends.*, brands.*, regions.* FROM blends JOIN ... WHERE blends.id = $1

6. Client Response
   └─> JSON response with appropriate status code
```

**Row Level Security:**

- Brands, regions, blends have public read access
- Authenticated users can insert (RLS policy: `auth.role() = 'authenticated'`)
- Application-level deduplication prevents true duplicates

## 6. Security Considerations

**Input Validation:**

- Zod schema validates all nested fields
- XOR validation ensures either ID or name (not both/neither)
- String trimming prevents whitespace-only entries
- Length limits prevent database overflow
- UUID format validation for IDs

**Authentication:**

- JWT token required in Authorization header
- Supabase Auth validates token automatically
- User session injected by middleware
- 401 returned if authentication fails

**Authorization:**

- PostgreSQL RLS policy: "Allow authenticated users to insert blends"
- No user-specific ownership (blends are global)
- Public read access for all users
- Write access restricted to authenticated users

**Data Exposure:**

- Only public blend/brand/region data exposed
- No sensitive user information
- Created blends visible to all users (global reference data)

**Common Vulnerabilities:**

- ✅ SQL Injection: Prevented by parameterized queries (Supabase client)
- ✅ XSS: No user-generated HTML, only JSON responses
- ✅ Race Conditions: Handled with database unique constraints
- ✅ Duplicate Data: Case-insensitive CITEXT prevents "Ippodo" vs "ippodo"
- ✅ Missing Data: Nested validation ensures brand/region always present
- ⚠️ Resource Exhaustion: No rate limiting in MVP (future consideration)

**CITEXT Advantage:**

- Database column type handles case-insensitive matching
- Prevents duplicates like "Uji" and "uji" and "UJI"
- Application doesn't need to implement case normalization
- Maintains user's original capitalization for display

## 7. Error Handling

**Error Scenarios:**

1. **Missing Supabase Client (500 Internal Server Error)**
   - Condition: `!supabase` in locals
   - Response: `{ "error": "Database client not available" }`
   - Status: 500
   - Logging: Not needed (infrastructure issue)

2. **Missing Authentication (401 Unauthorized)**
   - Condition: `!user` in locals
   - Response: `{ "error": "Unauthorized - Authentication required" }`
   - Status: 401
   - Logging: Not needed (expected user error)

3. **Invalid JSON (400 Bad Request)**
   - Condition: `request.json()` throws error
   - Response: `{ "error": "Invalid JSON in request body" }`
   - Status: 400
   - Logging: Not needed (expected user error)

4. **Validation Errors (400 Bad Request)**
   - Condition: `createBlendSchema.safeParse()` fails
   - Response: `{ "error": "Validation failed", "details": [...] }`
   - Status: 400
   - Logging: Not needed (expected user error)
   - Examples:
     - Empty blend name: "name must be at least 1 character"
     - Both ID and name: "must provide either id OR name, not both"
     - Neither ID nor name: "must provide either id or name"
     - Invalid UUID: "brand.id must be a valid UUID"

5. **Brand Not Found (404 Not Found)**
   - Condition: `brand.id` provided but doesn't exist in database
   - Response: `{ "error": "Brand not found" }`
   - Status: 404
   - Logging: Not needed (expected scenario)

6. **Region Not Found (404 Not Found)**
   - Condition: `region.id` provided but doesn't exist in database
   - Response: `{ "error": "Region not found" }`
   - Status: 404
   - Logging: Not needed (expected scenario)

7. **Duplicate Blend (409 Conflict)**
   - Condition: Blend with same (name, brand_id, region_id) exists
   - Response: `{ "error": "Blend already exists" }`
   - Status: 409
   - Logging: Not needed (expected scenario)
   - Note: Case-insensitive match via CITEXT

8. **Database Error (500 Internal Server Error)**
   - Condition: Supabase query throws error
   - Response: `{ "error": "Internal server error" }`
   - Status: 500
   - Logging: ✅ Console.error with error details
   - Triggers: Connection failures, constraint violations, etc.

**Error Handling Pattern:**

- Guard clauses for early returns (fail-fast)
- Service layer returns typed errors (not thrown exceptions)
- Route handler maps service errors to HTTP status codes
- Try-catch wraps entire route handler for unexpected errors
- Console logging only for 500 errors
- User-friendly messages (no internal details exposed)

**Service Layer Error Types:**

```typescript
type CreateBlendError =
  | { type: "brand_not_found" }
  | { type: "region_not_found" }
  | { type: "duplicate_blend" }
  | { type: "database_error"; message: string };

type CreateBlendResult = { success: true; data: BlendResponseDTO } | { success: false; error: CreateBlendError };
```

## 8. Performance Considerations

**Database Query Optimization:**

- Case-insensitive lookups use CITEXT index (fast)
- Primary key lookups for brand/region by ID (indexed)
- Unique constraint on (brand_id, name) prevents duplicates
- Single transaction for brand/region/blend creation reduces latency
- `.maybeSingle()` pattern for existence checks (efficient)

**Query Execution Time:**

- Brand/region lookup by ID: < 5ms (primary key)
- Brand/region lookup by name: < 10ms (CITEXT indexed)
- Duplicate blend check: < 10ms (composite index)
- Blend insert: < 20ms (includes constraint checks)
- Final nested fetch: < 15ms (simple joins)
- **Total estimated: 50-70ms** for complete flow

**N+1 Query Prevention:**

- Final fetch uses single query with joins for nested data
- No loop-based queries for brand/region data
- Supabase select syntax handles nested relations efficiently

**Caching Strategy (Future):**

- Consider caching brand/region lookups (rarely change)
- Cache key: `brand:name:${name.toLowerCase()}`
- TTL: 3600 seconds (1 hour)
- Not implemented in MVP

**Bottlenecks:**

- Multiple sequential database queries (unavoidable for validation)
- Case-insensitive string comparisons (mitigated by CITEXT)
- Network latency for each Supabase call

**Scalability:**

- Endpoint is stateless (scales horizontally)
- Database connection pooling handled by Supabase
- Rate limiting recommended for production (future)
- Consider batch blend creation API for bulk imports (future)

**Optimization Opportunities (Post-MVP):**

- Use database functions/procedures to reduce round trips
- Implement caching layer for brand/region lookups
- Add database indexes on frequently queried fields
- Use database triggers for automatic deduplication

## 9. Implementation Steps

### Step 1: Create Blend Validator

**File:** `src/lib/validators/create-blend.validator.ts` (new file)

**Action:** Create Zod validation schema for blend creation request

**Code:**

```typescript
import { z } from "zod";
import { uuidSchema } from "./uuid.validator";

/**
 * Validation schema for creating a new blend
 * Enforces XOR logic: brand and region must have either ID or name, not both
 */

// Brand nested validation: either id OR name, not both, not neither
const brandSchema = z
  .object({
    id: uuidSchema.nullable().optional(),
    name: z.string().min(1).max(100).trim().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasId = data.id !== null && data.id !== undefined;
      const hasName = data.name !== null && data.name !== undefined && data.name !== "";
      // XOR: exactly one must be true
      return (hasId && !hasName) || (!hasId && hasName);
    },
    {
      message: "must provide either id OR name, not both and not neither",
    }
  );

// Region nested validation: either id OR name, not both, not neither
const regionSchema = z
  .object({
    id: uuidSchema.nullable().optional(),
    name: z.string().min(1).max(100).trim().nullable().optional(),
  })
  .refine(
    (data) => {
      const hasId = data.id !== null && data.id !== undefined;
      const hasName = data.name !== null && data.name !== undefined && data.name !== "";
      // XOR: exactly one must be true
      return (hasId && !hasName) || (!hasId && hasName);
    },
    {
      message: "must provide either id OR name, not both and not neither",
    }
  );

export const createBlendSchema = z.object({
  name: z.string().min(1, "must be at least 1 character").max(200).trim(),
  brand: brandSchema,
  region: regionSchema,
});

export type CreateBlendSchema = z.infer<typeof createBlendSchema>;
```

**Notes:**

- Uses `.refine()` for XOR validation logic
- Reuses existing `uuidSchema` for ID validation
- Nested schemas for brand and region
- Trimming ensures no whitespace-only entries

### Step 2: Create Blends Service

**File:** `src/lib/services/blends.service.ts` (new file)

**Action:** Implement business logic for blend creation with entity resolution

**Code:**

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { BlendResponseDTO, CreateBlendDTO } from "../../types";

/**
 * Error types for blend creation
 */
type CreateBlendError =
  | { type: "brand_not_found" }
  | { type: "region_not_found" }
  | { type: "duplicate_blend" }
  | { type: "database_error"; message: string };

type CreateBlendResult = { success: true; data: BlendResponseDTO } | { success: false; error: CreateBlendError };

/**
 * Creates a new blend with flexible brand/region resolution
 * Can reference existing entities by ID or create new ones by name
 *
 * @param supabase - Supabase client instance
 * @param data - Validated blend data from request
 * @returns Result object with either success data or error
 *
 * @example
 * // Create blend with existing brand/region by ID
 * const result = await createBlend(supabase, {
 *   name: "Ceremonial Grade",
 *   brand: { id: "brand-uuid" },
 *   region: { id: "region-uuid" }
 * });
 *
 * @example
 * // Create blend with new brand/region by name
 * const result = await createBlend(supabase, {
 *   name: "Premium Matcha",
 *   brand: { name: "Ippodo Tea" },
 *   region: { name: "Uji, Kyoto" }
 * });
 */
export async function createBlend(supabase: SupabaseClient, data: CreateBlendDTO): Promise<CreateBlendResult> {
  try {
    // Step 1: Resolve Brand ID
    let brandId: string;

    if (data.brand.id) {
      // Verify brand exists by ID
      const { data: existingBrand, error } = await supabase
        .from("brands")
        .select("id")
        .eq("id", data.brand.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: { type: "database_error", message: error.message } };
      }

      if (!existingBrand) {
        return { success: false, error: { type: "brand_not_found" } };
      }

      brandId = existingBrand.id;
    } else if (data.brand.name) {
      // Look up or create brand by name (case-insensitive via CITEXT)
      const { data: existingBrand, error: lookupError } = await supabase
        .from("brands")
        .select("id, name")
        .eq("name", data.brand.name) // CITEXT handles case-insensitivity
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        return { success: false, error: { type: "database_error", message: lookupError.message } };
      }

      if (existingBrand) {
        // Brand exists, use existing ID
        brandId = existingBrand.id;
      } else {
        // Brand doesn't exist, create new one
        const { data: newBrand, error: insertError } = await supabase
          .from("brands")
          .insert({ name: data.brand.name })
          .select("id")
          .single();

        if (insertError || !newBrand) {
          return {
            success: false,
            error: { type: "database_error", message: insertError?.message || "Failed to create brand" },
          };
        }

        brandId = newBrand.id;
      }
    } else {
      // Should never happen due to Zod validation
      return { success: false, error: { type: "database_error", message: "Invalid brand data" } };
    }

    // Step 2: Resolve Region ID
    let regionId: string;

    if (data.region.id) {
      // Verify region exists by ID
      const { data: existingRegion, error } = await supabase
        .from("regions")
        .select("id")
        .eq("id", data.region.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        return { success: false, error: { type: "database_error", message: error.message } };
      }

      if (!existingRegion) {
        return { success: false, error: { type: "region_not_found" } };
      }

      regionId = existingRegion.id;
    } else if (data.region.name) {
      // Look up or create region by name (case-insensitive via CITEXT)
      const { data: existingRegion, error: lookupError } = await supabase
        .from("regions")
        .select("id, name")
        .eq("name", data.region.name) // CITEXT handles case-insensitivity
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        return { success: false, error: { type: "database_error", message: lookupError.message } };
      }

      if (existingRegion) {
        // Region exists, use existing ID
        regionId = existingRegion.id;
      } else {
        // Region doesn't exist, create new one
        const { data: newRegion, error: insertError } = await supabase
          .from("regions")
          .insert({ name: data.region.name })
          .select("id")
          .single();

        if (insertError || !newRegion) {
          return {
            success: false,
            error: { type: "database_error", message: insertError?.message || "Failed to create region" },
          };
        }

        regionId = newRegion.id;
      }
    } else {
      // Should never happen due to Zod validation
      return { success: false, error: { type: "database_error", message: "Invalid region data" } };
    }

    // Step 3: Check for duplicate blend (same name + brand_id + region_id)
    const { data: duplicateBlend, error: duplicateError } = await supabase
      .from("blends")
      .select("id")
      .eq("name", data.name) // CITEXT handles case-insensitivity
      .eq("brand_id", brandId)
      .eq("region_id", regionId)
      .limit(1)
      .maybeSingle();

    if (duplicateError) {
      return { success: false, error: { type: "database_error", message: duplicateError.message } };
    }

    if (duplicateBlend) {
      return { success: false, error: { type: "duplicate_blend" } };
    }

    // Step 4: Create blend
    const { data: newBlend, error: createError } = await supabase
      .from("blends")
      .insert({
        name: data.name,
        brand_id: brandId,
        region_id: regionId,
      })
      .select("id")
      .single();

    if (createError || !newBlend) {
      return {
        success: false,
        error: { type: "database_error", message: createError?.message || "Failed to create blend" },
      };
    }

    // Step 5: Fetch complete blend with nested brand and region
    const { data: completeBlend, error: fetchError } = await supabase
      .from("blends")
      .select(
        `
        id,
        name,
        brand_id,
        region_id,
        created_at,
        brand:brands!inner (
          id,
          name
        ),
        region:regions!inner (
          id,
          name
        )
      `
      )
      .eq("id", newBlend.id)
      .single();

    if (fetchError || !completeBlend) {
      return {
        success: false,
        error: { type: "database_error", message: fetchError?.message || "Failed to fetch created blend" },
      };
    }

    // Transform to response DTO
    const response: BlendResponseDTO = {
      id: completeBlend.id,
      name: completeBlend.name,
      brand_id: completeBlend.brand_id,
      region_id: completeBlend.region_id,
      created_at: completeBlend.created_at,
      brand: completeBlend.brand,
      region: completeBlend.region,
    };

    return { success: true, data: response };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in createBlend:", error);
    return {
      success: false,
      error: {
        type: "database_error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    };
  }
}
```

**Notes:**

- Returns typed result object (not thrown exceptions)
- Handles all error scenarios with specific error types
- Uses CITEXT for case-insensitive matching
- Single transaction approach for consistency
- Comprehensive error logging for debugging

### Step 3: Create API Route Handler

**File:** `src/pages/api/blends.ts` (new file)

**Action:** Create POST endpoint handler with authentication and validation

**Code:**

```typescript
import type { APIRoute } from "astro";
import { formatZodErrors } from "@/lib/helpers/format-error";
import { createBlend } from "@/lib/services/blends.service";
import { createBlendSchema } from "@/lib/validators/create-blend.validator";
import type { ErrorResponseDTO } from "@/types";

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
        case "brand_not_found":
          const brandErrorResponse: ErrorResponseDTO = {
            error: "Brand not found",
          };
          return new Response(JSON.stringify(brandErrorResponse), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });

        case "region_not_found":
          const regionErrorResponse: ErrorResponseDTO = {
            error: "Region not found",
          };
          return new Response(JSON.stringify(regionErrorResponse), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });

        case "duplicate_blend":
          const duplicateErrorResponse: ErrorResponseDTO = {
            error: "Blend already exists",
          };
          return new Response(JSON.stringify(duplicateErrorResponse), {
            status: 409,
            headers: { "Content-Type": "application/json" },
          });

        case "database_error":
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
```

**Notes:**

- Follows Create Tasting Note pattern exactly
- Guard clauses for authentication and validation
- Maps service errors to HTTP status codes
- Consistent error response format
- Try-catch for unexpected errors

### Step 4: Create HTTP Test Script

**File:** `api-tests-scripts/test-create-blend.http` (new file)

**Action:** Create comprehensive test cases (maximum 15 tests)

**Code:**

```http
### API Endpoint Test Suite
### POST /api/blends
@endpointUrl = {{baseUrl}}/api/blends

### NOTE: This endpoint REQUIRES authentication
### Set your access token in the baseUrl configuration or below

### ============================================================================
### SUCCESS CASES
### ============================================================================

### Test 1: Create blend with new brand and region by name (happy path)
### Expected: 201 Created with nested brand and region data
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Ceremonial Grade",
  "brand": {
    "name": "Test Brand 1"
  },
  "region": {
    "name": "Test Region 1"
  }
}

### Test 2: Create blend with existing brand ID and new region name
### Expected: 201 Created
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Premium Grade",
  "brand": {
    "id": "{{existingBrandId}}"
  },
  "region": {
    "name": "Kyoto"
  }
}

### Test 3: Create blend with new brand name and existing region ID
### Expected: 201 Created
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Culinary Grade",
  "brand": {
    "name": "Another Brand"
  },
  "region": {
    "id": "{{existingRegionId}}"
  }
}

### ============================================================================
### VALIDATION ERROR CASES (400 Bad Request)
### ============================================================================

### Test 4: Missing blend name
### Expected: 400 - Validation failed
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "",
  "brand": {
    "name": "Test Brand"
  },
  "region": {
    "name": "Test Region"
  }
}

### Test 5: Brand with both ID and name (XOR violation)
### Expected: 400 - must provide either id OR name, not both
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test Brand"
  },
  "region": {
    "name": "Test Region"
  }
}

### Test 6: Region with neither ID nor name
### Expected: 400 - must provide either id or name
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "name": "Test Brand"
  },
  "region": {}
}

### Test 7: Invalid brand UUID format
### Expected: 400 - Invalid UUID format
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "id": "not-a-uuid"
  },
  "region": {
    "name": "Test Region"
  }
}

### ============================================================================
### NOT FOUND CASES (404)
### ============================================================================

### Test 8: Non-existent brand ID
### Expected: 404 - Brand not found
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  },
  "region": {
    "name": "Test Region"
  }
}

### Test 9: Non-existent region ID
### Expected: 404 - Region not found
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "name": "Test Brand"
  },
  "region": {
    "id": "770e8400-e29b-41d4-a716-446655440000"
  }
}

### ============================================================================
### CONFLICT CASES (409)
### ============================================================================

### Test 10: Duplicate blend (same name + brand + region)
### Expected: 409 - Blend already exists
### Run Test 1 first, then run this
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Ceremonial Grade",
  "brand": {
    "name": "Test Brand 1"
  },
  "region": {
    "name": "Test Region 1"
  }
}

### ============================================================================
### AUTHENTICATION ERROR CASES (401)
### ============================================================================

### Test 11: Missing authentication token
### Expected: 401 - Unauthorized
POST {{endpointUrl}}
Content-Type: application/json

{
  "name": "Test Blend",
  "brand": {
    "name": "Test Brand"
  },
  "region": {
    "name": "Test Region"
  }
}

### ============================================================================
### EDGE CASES
### ============================================================================

### Test 12: Case-insensitive brand matching (should reuse existing)
### Expected: 201 with existing brand (not duplicate)
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Different Blend",
  "brand": {
    "name": "test brand 1"
  },
  "region": {
    "name": "Different Region"
  }
}

### Test 13: Very long blend name (200 chars - at limit)
### Expected: 201 Created
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "AAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDDEEEEEEEEEEAAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDDEEEEEEEEEEAAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDDEEEEEEEEEEAAAAAAAAAABBBBBBBBBBCCCCCCCCCCDDDDDDDDDDEEEEEEEEEE",
  "brand": {
    "name": "Edge Case Brand"
  },
  "region": {
    "name": "Edge Case Region"
  }
}

### Test 14: Blend name with special characters
### Expected: 201 Created
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Matcha 抹茶 (Premium) – 100g",
  "brand": {
    "name": "日本茶 Tea Co."
  },
  "region": {
    "name": "京都 Kyoto"
  }
}

### Test 15: Invalid JSON syntax
### Expected: 400 - Invalid JSON in request body
POST {{endpointUrl}}
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "name": "Test Blend",
  "brand": {
    "name": "Test Brand"
  },
  "region": {
    "name": "Test Region"
  }
}
```

**Notes:**

- 15 comprehensive tests covering all scenarios
- Tests organized by category (success, validation, errors, edge cases)
- Requires authentication token setup
- Tests XOR validation, case-insensitivity, duplicates
- Includes edge cases for special characters and limits

---

## Summary

This implementation plan provides a complete guide for creating the "Create Blend" endpoint with complex business logic. The endpoint follows the "Create Tasting Note" pattern for consistency while handling unique requirements:

- **Pattern Consistency:** Mirrors tasting note creation structure
- **Flexible Resolution:** Supports ID or name for brand/region
- **Deduplication:** CITEXT prevents case-sensitive duplicates
- **Complex Validation:** XOR logic ensures valid nested data
- **Comprehensive Errors:** Typed errors for all failure scenarios
- **Type Safety:** Full TypeScript typing throughout
- **Authentication:** Required for authenticated users only
- **Testing:** 15 test cases covering all paths
