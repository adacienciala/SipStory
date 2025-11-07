# API Endpoint Implementation Plan: List Regions

## 1. Endpoint Overview

The List Regions endpoint provides public read access to retrieve a paginated list of all matcha regions of origin. It supports optional case-insensitive search filtering by region name. This endpoint is part of the global resources API and does not require authentication.

**Primary Purpose**: Enable users to browse and search available regions for matcha sourcing, supporting autocomplete features and filtering in the frontend.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/regions`
- **Authentication**: Not Required (public read access)
- **Parameters**:
  - **Optional Query Parameters**:
    - `page` (integer): Page number for pagination (default: 1, min: 1)
    - `limit` (integer): Number of items per page (default: 20, min: 1, max: 100)
    - `search` (string): Case-insensitive substring match on region name (trimmed)
- **Request Body**: None (GET request)

## 3. Used Types

### From `src/types.ts`:

- **`RegionResponseDTO`**: Direct mapping from `RegionEntity`

  ```typescript
  type RegionResponseDTO = {
    id: string;
    name: string;
    created_at: string;
  };
  ```

- **`RegionsListResponseDTO`**: Paginated response wrapper

  ```typescript
  type RegionsListResponseDTO = PaginatedResponseDTO<RegionResponseDTO>;
  ```

- **`RegionsQueryDTO`**: Query parameters interface

  ```typescript
  interface RegionsQueryDTO extends PaginationQueryDTO {
    search?: string;
  }
  ```

- **`PaginationMetaDTO`**: Pagination metadata

  ```typescript
  interface PaginationMetaDTO {
    total: number;
    page: number;
    limit: number;
  }
  ```

- **`ErrorResponseDTO`**: Error response structure
  ```typescript
  interface ErrorResponseDTO {
    error: string;
    details?: ValidationErrorDTO[];
  }
  ```

### New Validator Schema (to be created):

**File**: `src/lib/validators/regions-query.validator.ts`

```typescript
import { z } from "zod";
import { paginationQuerySchema } from "./pagination.validator";

export const regionsQuerySchema = z.object({
  ...paginationQuerySchema.shape,
  search: z.string().max(255).trim().optional(),
});

export type RegionsQuery = z.infer<typeof regionsQuerySchema>;
```

## 4. Response Details

### Success Response (200 OK):

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Uji, Kyoto",
      "created_at": "2025-11-04T10:30:00Z"
    },
    {
      "id": "uuid",
      "name": "Nishio, Aichi",
      "created_at": "2025-11-03T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 20
  }
}
```

### Error Responses:

**400 Bad Request** (Invalid query parameters):

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "field": "limit",
      "message": "Number must be less than or equal to 100"
    }
  ]
}
```

**500 Internal Server Error** (Database or server issues):

```json
{
  "error": "Internal server error"
}
```

## 5. Data Flow

1. **Request Reception**: Astro API route handler receives GET request at `/api/regions`
2. **Query Parameter Extraction**: Extract `page`, `limit`, and `search` from `request.url`
3. **Input Validation**: Validate query parameters using `regionsQuerySchema` (Zod)
4. **Service Layer Call**: Invoke `listRegions()` from `regions.service.ts`
5. **Database Query**:
   - Access `regions` table via Supabase client from `context.locals`
   - Apply search filter if provided (case-insensitive ILIKE on `name` column)
   - Calculate offset: `(page - 1) * limit`
   - Execute count query for total results
   - Execute data query with pagination: `.range(offset, offset + limit - 1)`
6. **Response Transformation**: Format data and pagination metadata into `RegionsListResponseDTO`
7. **HTTP Response**: Return JSON with status 200 OK

### Database Query Pattern:

```typescript
// Count query
const { count } = await supabase
  .from("regions")
  .select("*", { count: "exact", head: true })
  .ilike("name", `%${search}%`); // if search provided

// Data query
const { data } = await supabase
  .from("regions")
  .select("id, name, created_at")
  .ilike("name", `%${search}%`) // if search provided
  .order("name", { ascending: true })
  .range(offset, offset + limit - 1);
```

## 6. Security Considerations

### Authentication & Authorization:

- **No authentication required**: Public read access to global resources
- **No RLS bypass needed**: Regions table has public SELECT policy enabled
- **No sensitive data**: Region names are non-sensitive geographic information

### Input Validation:

- **Query parameter sanitization**: Zod schema coerces and validates types
- **SQL injection prevention**: Supabase client uses parameterized queries
- **DoS protection**: Maximum limit of 100 prevents excessive data retrieval

### Potential Threats:

- **Resource exhaustion**: Mitigated by max limit constraint
- **Data scraping**: Acceptable for public, non-sensitive data
- **Cache poisoning**: Consider implementing ETag/Last-Modified headers

### Recommendations:

- Implement HTTP caching headers (`Cache-Control: public, max-age=3600`)
- Consider rate limiting for public endpoints (post-MVP)
- Add response compression for large result sets

## 7. Error Handling

### Validation Errors (400 Bad Request):

- **Trigger**: Invalid query parameters (e.g., `limit > 100`, `page < 1`)
- **Response**: Return formatted error with field-level details
- **Example**:
  ```typescript
  return new Response(
    JSON.stringify({
      error: "Invalid query parameters",
      details: zodError.errors.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
  ```

### Database Errors (500 Internal Server Error):

- **Trigger**: Supabase connection failure, query timeout
- **Response**: Return generic error message (no internal details exposed)
- **Logging**: Log full error stack trace for debugging
- **Example**:
  ```typescript
  console.error("Database error in listRegions:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
  ```

### Edge Cases:

- **Empty result set**: Return empty `data` array with `total: 0`
- **Page beyond available data**: Return empty `data` array (valid, not error)
- **Missing Supabase client**: Return 500 with "Database client not available"

## 8. Performance Considerations

### Potential Bottlenecks:

- **Table scan for search**: Mitigated by CITEXT index on `name` column
- **Count query overhead**: Supabase optimizes `count: "exact"` queries
- **Large result sets**: Limited by max pagination (100 items)

### Optimization Strategies:

1. **Database Indexing**: Ensure CITEXT index on `regions.name` (already in schema)
2. **Response Caching**: Implement HTTP cache headers for global resources
   ```typescript
   headers: {
     "Content-Type": "application/json",
     "Cache-Control": "public, max-age=3600", // 1 hour cache
     "ETag": generateETag(data), // Optional
   }
   ```
3. **Query Optimization**: Use `.select("id, name, created_at")` instead of `*`
4. **Connection Pooling**: Supabase handles connection pooling automatically

### Monitoring Considerations:

- Track query execution time for slow queries
- Monitor cache hit rate (post-implementation)
- Alert on excessive 500 errors

## 9. Implementation Steps

1. **Create Regions Query Validator**
   - File: `src/lib/validators/regions-query.validator.ts`
   - Define `regionsQuerySchema` with Zod
   - Export schema for use in API route and service

2. **Create Regions Service**
   - File: `src/lib/services/regions.service.ts`
   - Implement `listRegions(supabase, queryParams)` function
   - Handle search filtering and pagination logic
   - Return typed `RegionsListResponseDTO`

3. **Create API Route Handler**
   - File: `src/pages/api/regions/index.ts`
   - Export `prerender = false` for dynamic rendering
   - Implement `GET` handler function
   - Extract and validate query parameters
   - Call `listRegions()` service
   - Handle errors and format responses

4. **Add Error Formatting Helper** (if not exists)
   - Reuse existing `src/lib/helpers/format-error.ts`
   - Ensure Zod error formatting is consistent

5. **Create HTTP Test Script**
   - File: `api-tests-scripts/test-list-regions.http`
   - Test cases: default pagination, custom limit, search filter, invalid params
   - Document expected responses

6. **Update API Documentation**
   - Mark endpoint as "✅ Implemented" in `api-plan.md`
   - Add implementation details section

7. **Manual Testing**
   - Test with various query parameter combinations
   - Verify pagination accuracy
   - Confirm search functionality (case-insensitive)
   - Test error scenarios

8. **Performance Validation**
   - Verify database query execution time
   - Check response size with max limit (100)
   - Validate caching headers (optional)

9. **Code Review & Integration**
   - Ensure consistency with existing `brands` endpoints
   - Verify type safety across all layers
   - Run linter and fix any issues
   - Commit with descriptive message
