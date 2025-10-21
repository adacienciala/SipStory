# API Endpoint Implementation Plan: List Tasting Notes

## 1. Endpoint Overview

This endpoint retrieves a paginated list of tasting notes for the authenticated user with support for filtering by brand, region, and minimum rating, as well as flexible sorting options. The endpoint returns enriched data including nested brand and region information for each tasting note's blend.

**Purpose:** Enable users to view their tasting note collection with customizable filtering and sorting to support the dashboard view and filtering features specified in the MVP requirements.

**Key Features:**

- Pagination with configurable page size (default 20, max 100)
- Filter by multiple brands and regions simultaneously
- Filter by minimum overall rating threshold
- Sort by creation date, update date, or overall rating
- Returns fully nested data structure (blend → brand + region)

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/tasting-notes`

### Authentication

**Required:** Bearer token via Supabase Auth session

### Query Parameters

#### Required Parameters

None (all parameters are optional with sensible defaults)

#### Optional Parameters

| Parameter    | Type    | Default      | Constraints                                          | Description                      |
| ------------ | ------- | ------------ | ---------------------------------------------------- | -------------------------------- |
| `page`       | integer | 1            | Must be positive integer (≥1)                        | Page number for pagination       |
| `limit`      | integer | 20           | Must be 1-100 inclusive                              | Number of items per page         |
| `brand_ids`  | string  | -            | Comma-separated valid UUIDs                          | Filter by specific brand(s)      |
| `region_ids` | string  | -            | Comma-separated valid UUIDs                          | Filter by specific region(s)     |
| `min_rating` | integer | -            | Must be 1-5 inclusive                                | Minimum overall rating threshold |
| `sort_by`    | string  | `created_at` | One of: `created_at`, `updated_at`, `overall_rating` | Field to sort by                 |
| `sort_order` | string  | `desc`       | One of: `asc`, `desc`                                | Sort direction                   |

### Example Requests

**Basic request (defaults):**

```
GET /api/tasting-notes
```

**Filtered and sorted request:**

```
GET /api/tasting-notes?brand_ids=550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440001&min_rating=4&sort_by=overall_rating&sort_order=desc&page=1&limit=20
```

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Request Validation:**

- `TastingNotesQueryDTO` - Validates query parameters

**Response Types:**

- `TastingNoteResponseDTO` - Individual tasting note with nested blend/brand/region
- `TastingNotesListResponseDTO` - Paginated list wrapper
- `PaginatedResponseDTO<TastingNoteResponseDTO>` - Generic pagination container
- `PaginationMetaDTO` - Pagination metadata

**Nested Object Types:**

- `NestedBlendDTO` - Blend with brand and region
- `NestedBrandDTO` - Brand identification (id + name)
- `NestedRegionDTO` - Region identification (id + name)

**Error Response:**

- `ErrorResponseDTO` - Standard error structure
- `ValidationErrorDTO` - Field-level validation errors

### Database Entity Types

From `src/db/database.types.ts`:

- `Tables<'tasting_notes'>` - Base tasting note entity
- `Tables<'blends'>` - Blend entity with brand_id and region_id
- `Tables<'brands'>` - Brand entity
- `Tables<'regions'>` - Region entity

## 4. Response Details

### Success Response (200 OK)

**Content-Type:** `application/json`

**Structure:**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "blend": {
        "id": "uuid",
        "name": "string",
        "brand": {
          "id": "uuid",
          "name": "string"
        },
        "region": {
          "id": "uuid",
          "name": "string"
        }
      },
      "overall_rating": 1-5,
      "umami": 1-5 | null,
      "bitter": 1-5 | null,
      "sweet": 1-5 | null,
      "foam": 1-5 | null,
      "notes_koicha": "string" | null,
      "notes_milk": "string" | null,
      "price_pln": integer | null,
      "purchase_source": "string" | null,
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp"
    }
  ],
  "pagination": {
    "total": integer,
    "page": integer,
    "limit": integer
  }
}
```

### Error Responses

#### 401 Unauthorized

**Condition:** Missing or invalid authentication token

```json
{
  "error": "Unauthorized"
}
```

#### 400 Bad Request

**Condition:** Invalid query parameters

```json
{
  "error": "Invalid query parameters: min_rating must be between 1 and 5"
}
```

**Possible validation error messages:**

- `"page must be a positive integer"`
- `"limit must be between 1 and 100"`
- `"Invalid UUID format in brand_ids"`
- `"Invalid UUID format in region_ids"`
- `"min_rating must be between 1 and 5"`
- `"sort_by must be one of: created_at, updated_at, overall_rating"`
- `"sort_order must be one of: asc, desc"`

#### 500 Internal Server Error

**Condition:** Database query failure or unexpected server error

```json
{
  "error": "Internal server error"
}
```

## 5. Data Flow

### 5.1 Request Processing Flow

```
1. Client Request
   ↓
2. Astro Middleware (src/middleware/index.ts)
   - Verify Supabase Auth session
   - Attach user context to locals
   ↓
3. API Route Handler (src/pages/api/tasting-notes.ts)
   - Extract and parse query parameters
   - Validate with Zod schema
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Build Supabase query with filters
   - Execute query with joins
   - Transform database results to DTOs
   ↓
5. Response Formatting
   - Construct paginated response
   - Return JSON with 200 status
```

### 5.2 Database Query Structure

**Main Query (with all joins):**

```sql
SELECT
  tn.id,
  tn.user_id,
  tn.overall_rating,
  tn.umami,
  tn.bitter,
  tn.sweet,
  tn.foam,
  tn.notes_koicha,
  tn.notes_milk,
  tn.price_pln,
  tn.purchase_source,
  tn.created_at,
  tn.updated_at,
  b.id as blend_id,
  b.name as blend_name,
  br.id as brand_id,
  br.name as brand_name,
  r.id as region_id,
  r.name as region_name
FROM tasting_notes tn
INNER JOIN blends b ON tn.blend_id = b.id
INNER JOIN brands br ON b.brand_id = br.id
INNER JOIN regions r ON b.region_id = r.id
WHERE tn.user_id = $1
  [AND b.brand_id IN ($2)]           -- if brand_ids provided
  [AND b.region_id IN ($3)]          -- if region_ids provided
  [AND tn.overall_rating >= $4]      -- if min_rating provided
ORDER BY tn.[sort_by] [sort_order]
LIMIT $5 OFFSET $6
```

**Count Query (for pagination):**

```sql
SELECT COUNT(*) as total
FROM tasting_notes tn
INNER JOIN blends b ON tn.blend_id = b.id
WHERE tn.user_id = $1
  [AND b.brand_id IN ($2)]
  [AND b.region_id IN ($3)]
  [AND tn.overall_rating >= $4]
```

### 5.3 Data Transformation

Database rows are transformed into nested DTO structure:

**Database Result → DTO Mapping:**

- Flat database columns → Nested `blend` → `brand` and `region` structure
- Timestamps converted to ISO 8601 strings
- Null values preserved for optional fields
- All UUIDs remain as strings

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** Supabase Auth session validation

- Middleware checks for valid session token
- Extracts `user_id` from authenticated session
- Rejects requests without valid authentication (401 Unauthorized)

**User Isolation:**

- All queries filtered by authenticated user's `user_id`
- Row Level Security (RLS) policies enforced at database level
- According to db-plan, public read access is allowed, but this endpoint filters by user_id for "authenticated user's notes"

### 6.2 Input Validation & Sanitization

**Protection Against Injection:**

- All inputs validated with Zod schemas before database queries
- UUIDs validated against proper format pattern
- Numeric inputs constrained to allowed ranges
- Enum values validated against whitelist

**Parameter Validation:**

- `brand_ids` and `region_ids`: Validate each UUID with regex pattern
- `min_rating`: Enforce 1-5 range
- `limit`: Enforce 1-100 range to prevent excessive data retrieval
- `sort_by` and `sort_order`: Whitelist allowed values only

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- Never concatenate user input into SQL strings
- Leverage TypeScript type safety with Supabase client

### 6.3 Rate Limiting & DoS Prevention

**Current Implementation:**

- Hard limit on `limit` parameter (max 100 items per page)
- Pagination prevents full table scans

**Future Considerations:**

- Implement API rate limiting middleware (e.g., 100 requests per minute per user)
- Add query timeout limits
- Monitor query performance and add index optimizations

### 6.4 Data Exposure

**Controlled Data Access:**

- Only return data belonging to authenticated user
- No sensitive auth information exposed (password hashes, tokens)
- User email not included in response (only user_id)

**Information Leakage Prevention:**

- Generic error messages for server errors (no stack traces)
- Validation errors specify which parameter failed but not internal logic
- UUID format prevents enumeration attacks

## 7. Error Handling

### 7.1 Error Categories & Handling Strategy

#### Authentication Errors (401)

**Scenarios:**

- Missing Authorization header
- Invalid or expired session token
- Revoked authentication

**Handling:**

```typescript
if (!supabase || !session) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Client Guidance:** Redirect to login page

#### Validation Errors (400)

**Scenarios:**

- Invalid parameter types (e.g., non-numeric page)
- Out-of-range values (e.g., limit > 100, min_rating = 7)
- Invalid UUID format
- Invalid enum values (e.g., sort_by = "invalid_field")

**Handling:**

```typescript
const validationResult = querySchema.safeParse(queryParams);
if (!validationResult.success) {
  const errorMessage = formatZodError(validationResult.error);
  return new Response(JSON.stringify({ error: `Invalid query parameters: ${errorMessage}` }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Error Message Examples:**

- `"Invalid query parameters: page must be a positive integer"`
- `"Invalid query parameters: limit must be between 1 and 100"`
- `"Invalid query parameters: Invalid UUID format in brand_ids"`

#### Database Errors (500)

**Scenarios:**

- Supabase connection failure
- Query timeout
- Unexpected database constraint violations
- Network errors

**Handling:**

```typescript
try {
  const result = await tastingNotesService.listTastingNotes(userId, validatedQuery);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Database query failed:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Logging:**

- Log full error details server-side with `console.error`
- Include context: user_id, query parameters, timestamp
- Do not expose internal error details to client

### 7.2 Edge Cases

| Edge Case                                | Behavior           | Response                                                                        |
| ---------------------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| User has no tasting notes                | Return empty array | `{ "data": [], "pagination": { "total": 0, "page": 1, "limit": 20 } }` (200 OK) |
| Page number exceeds available pages      | Return empty array | `{ "data": [], "pagination": { "total": X, "page": Y, "limit": 20 } }` (200 OK) |
| No notes match filters                   | Return empty array | `{ "data": [], "pagination": { "total": 0, "page": 1, "limit": 20 } }` (200 OK) |
| Comma-separated list with trailing comma | Strip empty values | Validate remaining UUIDs                                                        |
| Multiple identical brand_ids             | Deduplicate array  | Use distinct UUIDs in query                                                     |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used (from db-plan):**

- `idx_tasting_notes_user_created` - Optimizes default sort (user_id, created_at DESC)
- `idx_tasting_notes_user_rating` - Optimizes rating filter + sort (user_id, overall_rating DESC)
- `idx_tasting_notes_user_blend_rating` - Optimizes user + blend filtering with rating sort (user_id, blend_id, overall_rating DESC)
- `idx_blends_brand` - Optimizes brand filtering join
- `idx_blends_region` - Optimizes region filtering join

**Query Optimization:**

- Use composite indexes for user-scoped queries
- INNER JOINs on indexed foreign keys (blend_id → brand_id, region_id)
- LIMIT/OFFSET pagination limits result set size
- Separate COUNT query optimized with same WHERE clauses

## 9. Implementation Steps

### Step 1: Create Zod Validation Schema

**File:** `src/lib/validators/tasting-notes.validator.ts`

**Tasks:**

1. Create Zod schema for `TastingNotesQueryDTO`
2. Validate pagination parameters (page, limit)
3. Validate filter parameters (brand_ids, region_ids, min_rating)
4. Validate sorting parameters (sort_by, sort_order)
5. Add UUID validation for comma-separated lists
6. Create helper function to format Zod errors

**Key Validations:**

```typescript
import { z } from "zod";

const uuidSchema = z.string().uuid();

const commaSeparatedUuidsSchema = z
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(z.array(uuidSchema));

export const tastingNotesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brand_ids: commaSeparatedUuidsSchema.optional(),
  region_ids: commaSeparatedUuidsSchema.optional(),
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  sort_by: z.enum(["created_at", "updated_at", "overall_rating"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
```

### Step 2: Create Service Layer

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Create `TastingNotesService` class (or module with exported functions)
2. Implement `listTastingNotes(supabase, userId, query)` function
3. Build Supabase query with proper joins
4. Apply filters conditionally based on provided parameters
5. Apply sorting based on sort_by and sort_order
6. Execute main query with pagination
7. Execute count query for total records
8. Transform database results to `TastingNoteResponseDTO[]`
9. Return `TastingNotesListResponseDTO` with data and pagination

**Key Implementation:**

```typescript
import type { SupabaseClient } from "../db/supabase.client";
import type { TastingNotesQueryDTO, TastingNotesListResponseDTO } from "../types";

export async function listTastingNotes(
  supabase: SupabaseClient,
  userId: string,
  query: TastingNotesQueryDTO
): Promise<TastingNotesListResponseDTO> {
  const { page, limit, brand_ids, region_ids, min_rating, sort_by, sort_order } = query;

  // Build base query
  let dbQuery = supabase
    .from("tasting_notes")
    .select(
      `
      *,
      blend:blends (
        id,
        name,
        brand:brands ( id, name ),
        region:regions ( id, name )
      )
    `
    )
    .eq("user_id", userId);

  // Apply filters
  if (brand_ids && brand_ids.length > 0) {
    dbQuery = dbQuery.in("blends.brand_id", brand_ids);
  }

  if (region_ids && region_ids.length > 0) {
    dbQuery = dbQuery.in("blends.region_id", region_ids);
  }

  if (min_rating !== undefined) {
    dbQuery = dbQuery.gte("overall_rating", min_rating);
  }

  // Apply sorting
  dbQuery = dbQuery.order(sort_by, { ascending: sort_order === "asc" });

  // Apply pagination
  const offset = (page - 1) * limit;
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await dbQuery;

  if (error) throw error;

  // Transform to DTOs
  const transformedData = transformToTastingNoteResponseDTOs(data);

  return {
    data: transformedData,
    pagination: {
      total: count || 0,
      page,
      limit,
    },
  };
}
```

### Step 3: Create API Route Handler

**File:** `src/pages/api/tasting-notes.ts`

**Tasks:**

1. Export `prerender = false` for server-side rendering
2. Implement `GET` handler function
3. Extract Supabase client from `context.locals`
4. Verify authentication (check session exists)
5. Extract query parameters from `context.url.searchParams`
6. Validate query parameters with Zod schema
7. Call service layer function
8. Return formatted JSON response
9. Handle all error cases with appropriate status codes

### Step 4: Update Middleware (if needed)

**File:** `src/middleware/index.ts`

**Tasks:**

1. Verify that Supabase client initialization is present
2. Verify that session extraction is implemented
3. Attach `supabase` and `session` to `context.locals`
4. Ensure middleware runs for all `/api/*` routes

**Note:** If middleware is already implemented for Supabase Auth, this step may only require verification.

### Step 5: Create Helper Functions

**File:** `src/lib/helpers/format-error.ts`

**Tasks:**

1. Create function to format Zod validation errors into human-readable messages
2. Extract first error message from Zod error object
3. Handle field-specific errors

**Implementation:**

```typescript
import type { ZodError } from "zod";

export function formatZodError(error: ZodError): string {
  const firstError = error.errors[0];
  if (!firstError) return "Validation failed";

  const field = firstError.path.join(".");
  const message = firstError.message;

  return field ? `${field} ${message}` : message;
}
```

### Step 6: Update Type Definitions (if needed)

**File:** `src/types.ts`

**Tasks:**

1. Verify that all required DTOs exist
2. Verify that `TastingNotesQueryDTO` matches API specification
3. Add any missing type definitions
4. Ensure consistency with database types

**Note:** Based on the provided types.ts, all necessary types appear to be defined. This step is for verification only.---

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 200 OK with valid authentication and parameters
2. ✅ Endpoint returns 401 Unauthorized without valid authentication
3. ✅ Endpoint returns 400 Bad Request for invalid query parameters
4. ✅ Pagination works correctly (page, limit)
5. ✅ Filtering works correctly (brand_ids, region_ids, min_rating)
6. ✅ Sorting works correctly (all sort_by values, both directions)
7. ✅ Response structure matches specification exactly
8. ✅ Empty result sets return empty array with correct pagination metadata
9. ✅ Error messages are clear and helpful
10. ✅ Code passes linting and type checking
