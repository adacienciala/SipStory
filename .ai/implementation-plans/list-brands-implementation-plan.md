# API Endpoint Implementation Plan: List Brands

## 1. Endpoint Overview

This endpoint retrieves a paginated list of all brands with optional search functionality.

**Purpose:** Enable users to browse and search the global list of matcha brands for reference when creating tasting notes or filtering results.

**Key Features:**

- Public read access (no authentication required)
- Paginated results with configurable page size
- Case-insensitive search on brand name
- Returns simple brand records (id, name, created_at)
- Global resource shared across all users

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/brands`

**Query Parameters:**
| Parameter | Type | Required | Description |
| --------- | ------- | -------- | ------------------------------------------------ |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 50, max: 200) |
| `search` | string | No | Case-insensitive substring match on brand name |

**Example:** `/api/brands?page=1&limit=50&search=ippodo`

### Authentication

**Not Required** - Public read access for all users (authenticated or not)

### Request Body

**None** - GET requests do not have a request body

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Request Types:**

```typescript
// Query parameter structure (to be created)
interface BrandsQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
}
```

**Response Types:**

```typescript
// Success response (to be created)
interface BrandsListResponseDTO {
  data: BrandDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

// Individual brand DTO (to be created)
interface BrandDTO {
  id: string;
  name: string;
  created_at: string;
}
```

- `ErrorResponseDTO` - Standard error structure

### Database Entity Types

From `src/db/database.types.ts`:

- `Tables<'brands'>` - Base brand entity

## 4. Response Details

### Success Response (200 OK)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Ippodo Tea",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Marukyu Koyamaen",
      "created_at": "2024-01-16T14:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 50
  }
}
```

### Error Responses

#### 400 Bad Request

**Condition:** Invalid query parameters (e.g., negative page, limit > 200)

```json
{
  "error": "Invalid query parameters"
}
```

**Possible validation error messages:**

- `"page must be a positive integer"`
- `"limit must be between 1 and 200"`
- `"search must be a string"`

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
2. API Route Handler (src/pages/api/brands/index.ts)
   - Extract and validate query parameters
   - Apply defaults (page=1, limit=50)
   - Validate constraints (limit <= 200)
   ↓
3. Service Layer (src/lib/services/brands.service.ts)
   - Build query with pagination
   - Apply search filter if provided
   - Count total matching records
   - Fetch paginated results
   ↓
4. Response Formatting
   - Transform to BrandsListResponseDTO
   - Return 200 OK with data and pagination metadata
```

### 5.2 Database Operations Sequence

**Query with Optional Search:**

```sql
-- Count query
SELECT COUNT(*)
FROM brands
WHERE name ILIKE '%search_term%';  -- Only if search provided

-- Data query
SELECT id, name, created_at
FROM brands
WHERE name ILIKE '%search_term%'  -- Only if search provided
ORDER BY name ASC
LIMIT $1 OFFSET $2;
```

**Notes:**

- Use `ILIKE` for case-insensitive substring search in PostgreSQL
- Default sort by name (alphabetical) for brand lists
- No user_id filter needed (global resource)
- No RLS policies needed for read access

### 5.3 Data Transformation

**Service Layer → DTO:**

Supabase returns data that directly maps to BrandDTO:

```typescript
// Supabase returns:
// { id: string, name: string, created_at: string }
// Directly maps to BrandDTO with no transformation needed

const brands: BrandDTO[] = data.map((row) => ({
  id: row.id,
  name: row.name,
  created_at: row.created_at,
}));
```

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** No authentication required (public read access)

- Endpoint is publicly accessible
- No sensitive data exposed (brand names are public information)
- No user-specific data returned
- No write operations allowed (read-only endpoint)

**Public Access Rationale:**

- Brands are global reference data
- Users need to browse brands before authentication (e.g., during registration)
- No privacy concerns with brand names
- Enables frontend to show brand lists without auth flow

### 6.2 Input Validation & Sanitization

**Query Parameter Validation:**

- `page` (optional): Positive integer, defaults to 1
- `limit` (optional): Integer between 1 and 200, defaults to 50
- `search` (optional): String, max length 255 characters (same as brand name max)

**SQL Injection Protection:**

- Use parameterized queries (Supabase automatically handles this)
- Sanitize search input (trim whitespace, validate length)
- Use Supabase `.ilike()` method with parameterized values

### 6.3 Data Integrity

**Read-Only Access:**

- No data modification in this endpoint
- No cascading effects or side effects
- Safe for concurrent access from multiple clients

## 7. Error Handling

### 7.1 Error Categories & Handling Strategy

#### Validation Errors (400)

**Scenarios:**

- `page` is not a positive integer
- `limit` exceeds maximum (200)
- `limit` is less than 1
- `search` exceeds max length

**Handling:**

```typescript
const queryValidation = brandsQuerySchema.safeParse({
  page: Number(pageParam) || 1,
  limit: Number(limitParam) || 50,
  search: searchParam || undefined,
});

if (!queryValidation.success) {
  return new Response(
    JSON.stringify({
      error: "Invalid query parameters",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### Database Errors (500)

**Scenarios:**

- Supabase connection failure
- Query execution errors
- Network errors

**Handling:**

```typescript
try {
  const result = await listBrands(supabase, validatedQuery);
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Failed to list brands:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.2 Edge Cases

| Edge Case                               | Behavior             | Response                           |
| --------------------------------------- | -------------------- | ---------------------------------- |
| No brands in database                   | Return empty array   | 200 OK with empty data array       |
| Search with no matches                  | Return empty array   | 200 OK with empty data array       |
| Page number exceeds available pages     | Return empty array   | 200 OK with empty data array       |
| Search with special characters          | Sanitize and search  | 200 OK with matching results       |
| Limit = 1                               | Return single result | 200 OK with 1 item                 |
| Limit = 200 (maximum)                   | Return up to 200     | 200 OK with up to 200 items        |
| Search with leading/trailing whitespace | Trim and search      | 200 OK with matching results       |
| Empty search string                     | Ignore search filter | 200 OK with all brands (paginated) |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key index on `brands.id` (automatic)
- Index on `brands.name` for search performance (recommended to add)

**Query Optimization:**

- Simple SELECT with minimal columns
- ILIKE search with parameterized values
- Pagination via LIMIT/OFFSET
- Separate count query for total (cached by Supabase)

### 8.2 Caching Considerations

**Potential Caching:**

- Brand list changes infrequently (mostly static data)
- Consider HTTP caching headers (Cache-Control)
- Consider CDN caching for public endpoint
- Not implemented in MVP (future enhancement)

## 9. Implementation Steps

### Step 1: Add Types to `src/types.ts`

**File:** `src/types.ts`

**Tasks:**

1. Add `BrandDTO` interface
2. Add `BrandsQueryDTO` interface
3. Add `BrandsListResponseDTO` interface

**Key Implementation:**

```typescript
// Brand DTO
export interface BrandDTO {
  id: string;
  name: string;
  created_at: string;
}

// Query parameters for listing brands
export interface BrandsQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
}

// Response for brand list
export interface BrandsListResponseDTO {
  data: BrandDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}
```

### Step 2: Create Validator Schema

**File:** `src/lib/validators/brands-query.validator.ts` (NEW)

**Tasks:**

1. Create Zod schema for query parameters
2. Reuse pagination validation logic
3. Add search string validation
4. Export schema for reuse

**Key Implementation:**

```typescript
import { z } from "zod";

export const brandsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(200).default(50),
  search: z.string().max(255).optional(),
});

export type BrandsQuery = z.infer<typeof brandsQuerySchema>;
```

### Step 3: Create Service Layer Function

**File:** `src/lib/services/brands.service.ts` (NEW)

**Tasks:**

1. Create new `listBrands(supabase, query)` function
2. Build query with optional search filter
3. Apply pagination
4. Return data with pagination metadata
5. Handle errors appropriately

**Key Implementation:**

```typescript
import type { SupabaseClient } from "../../db/supabase.client";
import type { BrandsListResponseDTO, BrandsQueryDTO } from "../../types";

/**
 * Retrieves a paginated list of all brands with optional search
 *
 * @param supabase - Supabase client instance
 * @param query - Query parameters for filtering and pagination
 * @returns Paginated list of brands with metadata
 * @throws Error if database query fails
 *
 * @example
 * const result = await listBrands(supabase, {
 *   page: 1,
 *   limit: 50,
 *   search: 'ippodo'
 * });
 */
export async function listBrands(supabase: SupabaseClient, query: BrandsQueryDTO): Promise<BrandsListResponseDTO> {
  const { page = 1, limit = 50, search } = query;

  // Calculate pagination offset
  const offset = (page - 1) * limit;

  // Build base query
  let dbQuery = supabase.from("brands").select("*", { count: "exact" });

  // Apply search filter if provided
  if (search && search.trim()) {
    dbQuery = dbQuery.ilike("name", `%${search.trim()}%`);
  }

  // Apply sorting (alphabetical by name)
  dbQuery = dbQuery.order("name", { ascending: true });

  // Apply pagination
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  // Execute query
  const { data, error, count } = await dbQuery;

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  // Handle case where no data is returned (valid scenario)
  if (!data) {
    return {
      data: [],
      pagination: {
        total: 0,
        page,
        limit,
      },
    };
  }

  // Return paginated response (no transformation needed)
  return {
    data,
    pagination: {
      total: count || 0,
      page,
      limit,
    },
  };
}
```

### Step 4: Create API Route

**File:** `src/pages/api/brands/index.ts` (NEW)

**Tasks:**

1. Create new GET handler
2. Extract and validate query parameters
3. Apply defaults for page and limit
4. Call service layer function
5. Return 200 OK with data and pagination
6. Handle all error cases with appropriate status codes

**Key Implementation:**

```typescript
import type { APIRoute } from "astro";
import { listBrands } from "@/lib/services/brands.service";
import { brandsQuerySchema } from "@/lib/validators/brands-query.validator";

export const prerender = false;

/**
 * GET /api/brands
 * Retrieves a paginated list of all brands with optional search
 *
 * Query Parameters:
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 50, max: 200)
 * - search (optional): Case-insensitive substring match on brand name
 *
 * Returns:
 * - 200 OK: Paginated brand list with metadata
 * - 400 Bad Request: Invalid query parameters
 * - 500 Internal Server Error: Database or server error
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase } = locals;

    // Note: No authentication required for public read access
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection unavailable" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract query parameters
    const url = new URL(request.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const searchParam = url.searchParams.get("search");

    // Validate and parse query parameters
    const queryValidation = brandsQuerySchema.safeParse({
      page: pageParam ? Number(pageParam) : 1,
      limit: limitParam ? Number(limitParam) : 50,
      search: searchParam || undefined,
    });

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch brands from service layer
    const result = await listBrands(supabase, queryValidation.data);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 5: Create HTTP Test File

**File:** `api-tests-scripts/test-list-brands.http` (NEW)

**Test Cases:**

1. List brands with defaults → 200 OK
2. List brands with custom pagination → 200 OK
3. List brands with search → 200 OK
4. List brands with case-insensitive search → 200 OK
5. List brands with no matches → 200 OK (empty array)
6. List brands with limit=1 → 200 OK
7. List brands with limit=200 (max) → 200 OK
8. List brands with page beyond available → 200 OK (empty array)
9. Invalid page (negative) → 400 Bad Request
10. Invalid limit (> 200) → 400 Bad Request
11. Invalid limit (0) → 400 Bad Request
12. Search with special characters → 200 OK
13. Empty search string → 200 OK (all brands)

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 200 OK with paginated brand list
2. ✅ Endpoint works without authentication (public access)
3. ✅ Default pagination (page=1, limit=50) works correctly
4. ✅ Custom pagination parameters are respected
5. ✅ Search filter works with case-insensitive matching
6. ✅ Empty results return 200 OK with empty data array
7. ✅ Pagination metadata (total, page, limit) is accurate
8. ✅ Endpoint returns 400 Bad Request for invalid parameters
9. ✅ Brands are sorted alphabetically by name
10. ✅ Search with whitespace is handled correctly (trimmed)
11. ✅ Maximum limit (200) is enforced
12. ✅ Code passes linting and type checking
