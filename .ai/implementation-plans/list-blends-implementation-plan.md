# API Endpoint Implementation Plan: List Blends

## 1. Endpoint Overview

The List Blends endpoint retrieves a paginated list of all matcha blends with their associated brand and region information. This endpoint supports optional filtering by brand_id and region_id, as well as case-insensitive search by blend name. It is a public endpoint that does not require authentication, following the same pattern as the List Brands and List Regions endpoints.

**Key Features:**

- Paginated results with configurable page and limit parameters
- Optional filtering by brand UUID or region UUID
- Case-insensitive substring search on blend name
- Returns nested brand and region objects with each blend
- Public read access (no authentication required)

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/blends`
- **Authentication:** Not required (public read access)

### Query Parameters:

**Optional Parameters:**
| Parameter | Type | Default | Validation | Description |
|-----------|------|---------|------------|-------------|
| `page` | integer | 1 | >= 1 | Page number for pagination |
| `limit` | integer | 20 | 1-100 | Items per page |
| `brand_id` | UUID | - | Valid UUID format | Filter blends by brand UUID |
| `region_id` | UUID | - | Valid UUID format | Filter blends by region UUID |
| `search` | string | - | Max 255 chars, trimmed | Case-insensitive substring match on blend name |

### Request Example:

```
GET /api/blends?page=1&limit=20&brand_id=550e8400-e29b-41d4-a716-446655440000&search=ceremonial
```

## 3. Used Types

### Input Types:

```typescript
// Query parameter validation (from BlendsQueryDTO)
interface BlendsQueryDTO extends PaginationQueryDTO {
  brand_id?: string; // Optional UUID
  region_id?: string; // Optional UUID
  search?: string; // Optional search term
}

// Pagination parameters
interface PaginationQueryDTO {
  page?: number | null;
  limit?: number | null;
}
```

### Output Types:

```typescript
// Main response type
type BlendsListResponseDTO = PaginatedResponseDTO<BlendResponseDTO>;

// Individual blend response
interface BlendResponseDTO {
  id: string;
  name: string;
  created_at: string;
  brand: NestedBrandDTO;
  region: NestedRegionDTO;
}

// Nested objects
interface NestedBrandDTO {
  id: string;
  name: string;
}

interface NestedRegionDTO {
  id: string;
  name: string;
}

// Pagination metadata
interface PaginationMetaDTO {
  total: number;
  page: number;
  limit: number;
}

// Generic paginated response wrapper
interface PaginatedResponseDTO<T> {
  data: T[];
  pagination: PaginationMetaDTO;
}
```

### Validator Schema:

```typescript
// blends-query.validator.ts
export const blendsQuerySchema = z.object({
  ...paginationQuerySchema.shape, // page, limit
  brand_id: z.string().uuid().nullable().optional(),
  region_id: z.string().uuid().nullable().optional(),
  search: z.string().max(255).trim().nullable().optional(),
});
```

## 4. Response Details

### Success Response (200 OK):

```json
{
  "data": [
    {
      "id": "uuid-string",
      "name": "Ceremonial Grade",
      "created_at": "2024-11-07T10:30:00.000Z",
      "brand": {
        "id": "brand-uuid",
        "name": "Ippodo Tea"
      },
      "region": {
        "id": "region-uuid",
        "name": "Uji, Kyoto"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20
  }
}
```

### Error Responses:

**400 Bad Request** - Invalid query parameters:

```json
{
  "error": "Invalid query parameters: brand_id must be a valid UUID"
}
```

**500 Internal Server Error** - Database unavailable:

```json
{
  "error": "Database connection unavailable"
}
```

**500 Internal Server Error** - Query failure:

```json
{
  "error": "Internal server error"
}
```

## 5. Data Flow

### Request Flow:

1. **API Route Handler** (`src/pages/api/blends.ts`)
   - Extract query parameters from URL
   - Validate parameters using Zod schema
   - Call service layer function
   - Return formatted response

2. **Service Layer** (`src/lib/services/blends.service.ts`)
   - Build Supabase query with joins for brand and region
   - Apply optional filters (brand_id, region_id, search)
   - Apply sorting (alphabetical by name)
   - Apply pagination (offset and limit)
   - Execute query with count
   - Transform data to match response DTO
   - Return paginated result

3. **Database Query**
   - Query `blends` table with inner joins to `brands` and `regions`
   - Filter by brand_id if provided
   - Filter by region_id if provided
   - Apply ILIKE filter for search if provided
   - Count total matching records
   - Return paginated subset

### Database Query Structure:

```typescript
let dbQuery = supabase.from("blends").select(
  `
    id,
    name,
    created_at,
    brand:brands!inner (
      id,
      name
    ),
    region:regions!inner (
      id,
      name
    )
  `,
  { count: "exact" }
);

// Apply filters
if (brand_id) dbQuery = dbQuery.eq("brand_id", brand_id);
if (region_id) dbQuery = dbQuery.eq("region_id", region_id);
if (search) dbQuery = dbQuery.ilike("name", `%${search}%`);

// Apply sorting and pagination
dbQuery = dbQuery.order("name", { ascending: true });
dbQuery = dbQuery.range(offset, offset + limit - 1);
```

### Data Transformation:

The Supabase query returns data in the correct nested structure, so no transformation is needed. The response is directly mapped to `BlendResponseDTO[]`.

## 6. Security Considerations

### Authentication & Authorization:

- **No authentication required** - This is a public read-only endpoint
- **Row Level Security (RLS)** enforces read access at database level
- RLS policy: `"Allow public read access to blends"`

### Input Validation:

- **UUID Validation:** Use Zod's `.uuid()` validator for brand_id and region_id to prevent SQL injection
- **Search Input Sanitization:** Trim and limit search string to 255 characters
- **Pagination Bounds:** Enforce page >= 1 and limit between 1-100
- **Type Coercion:** Use `z.coerce.number()` for safe string-to-number conversion

### SQL Injection Prevention:

- All queries use Supabase's parameterized query builder
- No raw SQL or string concatenation
- UUID format validation before querying
- Search term is passed as parameter to `.ilike()` method

### Rate Limiting:

- Consider implementing rate limiting at API gateway or middleware level
- Recommended: 100 requests per minute per IP address for public endpoints

## 7. Error Handling

### Validation Errors (400):

```typescript
if (!validationResult.success) {
  const errorMessage = formatZodError(validationResult.error);
  return new Response(
    JSON.stringify({
      error: `Invalid query parameters: ${errorMessage}`,
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}
```

**Potential validation failures:**

- Invalid page number (non-positive integer)
- Invalid limit (< 1 or > 100)
- Invalid UUID format for brand_id or region_id
- Search string exceeds 255 characters

### Database Errors (500):

```typescript
if (!supabase) {
  return new Response(JSON.stringify({ error: "Database connection unavailable" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Query Errors:

- Database query failures are caught in service layer
- Service returns empty array with pagination metadata
- Error is logged to console for debugging
- Generic "Internal server error" returned to client

### Error Logging:

```typescript
if (error) {
  console.error("Database query failed:", error);
  return {
    data: [],
    pagination: { total: count || 0, page: effectivePage, limit: effectiveLimit },
  };
}
```

## 8. Performance Considerations

### Database Optimization:

- **Indexes:** Utilize existing indexes on `blends(brand_id)` and `blends(region_id)` for efficient filtering
- **Query Optimization:**
  - Use `.select()` with specific columns to reduce data transfer
  - Use `{ count: "exact" }` only when necessary (consider estimated count for large datasets)
  - Inner joins ensure only blends with valid brand/region relationships are returned

### Pagination Strategy:

- **Default page size:** 20 items (balance between performance and UX)
- **Max page size:** 100 items (prevent excessive data transfer)
- **Offset-based pagination:** Sufficient for MVP, consider cursor-based for large datasets post-MVP

### Caching Strategy:

- **HTTP Cache Headers:** Consider adding `Cache-Control` headers for semi-static data
- **Suggested TTL:** 5-10 minutes for blend listings
- **Cache Invalidation:** On blend creation or updates

### Network Optimization:

- **Response Compression:** Enable gzip/brotli compression at server level
- **Nested Data:** Include brand and region in single query to avoid N+1 queries

### Bottleneck Prevention:

- **Search Performance:** CITEXT column on `blends.name` enables efficient case-insensitive ILIKE queries
- **Join Performance:** Foreign key indexes on `brand_id` and `region_id` optimize joins
- **Count Performance:** For very large datasets, consider returning estimated counts or omitting total count

## 9. Implementation Steps

### Step 1: Create Validator Schema

Create `src/lib/validators/blends-query.validator.ts`:

- Import `paginationQuerySchema` and `z` from zod
- Define `blendsQuerySchema` extending pagination with optional brand_id (UUID), region_id (UUID), and search (string, max 255, trimmed)
- Export schema and inferred type

### Step 2: Implement Service Function

Add `listBlends` function to `src/lib/services/blends.service.ts`:

- Accept `supabase` client and `BlendsQueryDTO` query parameters
- Extract and provide defaults for page (1) and limit (20)
- Build Supabase query with nested select for brand and region
- Apply optional filters: brand_id (eq), region_id (eq), search (ilike with wildcards)
- Apply sorting by name ascending
- Calculate offset and apply range for pagination
- Execute query with `{ count: "exact" }` option
- Handle errors by logging and returning empty data array
- Return `BlendsListResponseDTO` with data and pagination metadata

### Step 3: Create API Route Handler

Create `src/pages/api/blends.ts`:

- Set `export const prerender = false`
- Implement `GET` handler accepting APIRoute context
- Extract supabase from locals and validate availability (500 if missing)
- Extract query parameters: page, limit, brand_id, region_id, search
- Validate using `blendsQuerySchema.safeParse()`
- Return 400 with formatted error message if validation fails
- Call `listBlends()` service function with validated parameters
- Return 200 with JSON response on success
- Wrap in try-catch, log errors, return 500 on unexpected errors

### Step 4: Add Type Definitions

Verify types exist in `src/types.ts`:

- Ensure `BlendsQueryDTO` interface is defined with optional brand_id, region_id, search
- Ensure `BlendsListResponseDTO` is defined as `PaginatedResponseDTO<BlendResponseDTO>`
- Ensure `BlendResponseDTO` includes nested brand and region
- All required types should already exist per API plan

### Step 5: Create Test Script

Create `api-tests-scripts/test-list-blends.http`:

- Add basic list request: `GET {{baseUrl}}/api/blends`
- Add paginated request: `GET {{baseUrl}}/api/blends?page=2&limit=10`
- Add filtered request: `GET {{baseUrl}}/api/blends?brand_id={{validBrandId}}`
- Add search request: `GET {{baseUrl}}/api/blends?search=ceremonial`
- Add combined filters: `GET {{baseUrl}}/api/blends?brand_id={{validBrandId}}&search=grade&limit=5`
- Add invalid UUID test: `GET {{baseUrl}}/api/blends?brand_id=invalid-uuid` (expect 400)

### Step 6: Manual Testing

- Test with no parameters (default pagination)
- Test with various page/limit combinations
- Test brand_id and region_id filters with valid UUIDs
- Test search with various terms (case-insensitive)
- Test combined filters
- Test edge cases: empty results, invalid UUIDs, out-of-range limits
- Verify nested brand and region data is returned correctly
- Verify pagination metadata accuracy

### Step 7: Error Handling Verification

- Test with invalid query parameters (expect 400)
- Test with non-numeric page/limit values
- Test with invalid UUID formats
- Verify appropriate error messages are returned
- Verify errors are logged to console for debugging

### Step 8: Performance Testing

- Test with large datasets to verify pagination efficiency
- Measure query execution time with filters applied
- Verify database indexes are utilized (check query plan if needed)
- Test concurrent requests to ensure scalability

### Step 9: Documentation and Code Review

- Add JSDoc comments to service function
- Document query parameter behavior in code comments
- Ensure code follows project coding standards
- Review error handling completeness
- Verify consistency with similar endpoints (brands, regions)
- Update API documentation if needed
