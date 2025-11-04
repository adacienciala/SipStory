# API Endpoint Implementation Plan: Get Region by ID

## 1. Endpoint Overview

This endpoint retrieves a single region by its UUID. Regions are global reference data representing matcha regions of origin (e.g., "Uji, Kyoto", "Nishio", "Kagoshima"). This is a public read endpoint accessible without authentication, matching the "Get Brand by ID" endpoint pattern.

**Key Characteristics:**

- Simple GET endpoint with path parameter
- Public access (no authentication required)
- Returns single region entity or 404 if not found
- Validates UUID format before database query
- Direct mapping from database entity to response DTO

## 2. Request Details

- **HTTP Method:** `GET`
- **URL Structure:** `/api/regions/:id`
- **Authentication:** Not required (public read access)
- **Path Parameters:**
  - **Required:**
    - `id` (string, UUID format): UUID of the region to retrieve
- **Query Parameters:** None
- **Request Body:** None

## 3. Used Types

**Import from `src/types.ts`:**

```typescript
import type { RegionResponseDTO, ErrorResponseDTO } from "@/types";
```

**Type Definitions:**

- `RegionResponseDTO` = `RegionEntity` (direct mapping from database)
  - `id: string` (UUID)
  - `name: string` (CITEXT - case-insensitive)
  - `created_at: string` (timestamp)

- `ErrorResponseDTO`:
  ```typescript
  {
    error: string;
    details?: ValidationErrorDTO[];
  }
  ```

**Validator Type:**

- `uuidSchema` from `src/lib/validators/uuid.validator.ts`
- Validates UUID format using Zod

**Service Layer Type:**

- `SupabaseClient` from `src/db/supabase.client.ts`

## 4. Response Details

**Success Response (200 OK):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Uji, Kyoto",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response - Invalid UUID (400 Bad Request):**

```json
{
  "error": "Invalid UUID format"
}
```

**Error Response - Not Found (404 Not Found):**

```json
{
  "error": "Region not found"
}
```

**Error Response - Server Error (500 Internal Server Error):**

```json
{
  "error": "Database client not available"
}
```

OR

```json
{
  "error": "Internal server error"
}
```

**Status Codes:**

- `200`: Successfully retrieved region
- `400`: Invalid UUID format in path parameter
- `404`: Region with specified UUID does not exist
- `500`: Server error (database unavailable or query failure)

## 5. Data Flow

```
1. Client Request
   └─> GET /api/regions/:id

2. Astro Middleware (src/middleware/index.ts)
   └─> Inject Supabase client into locals

3. API Route Handler (src/pages/api/regions/[id].ts)
   ├─> Extract Supabase client from locals
   ├─> Guard: Check if Supabase client exists → 500 if not
   ├─> Extract id from params
   ├─> Validate UUID format with uuidSchema
   ├─> Guard: Return 400 if validation fails
   ├─> Call service layer: getRegionById(supabase, id)
   ├─> Guard: Return 404 if region is null
   └─> Happy path: Return 200 with region data

4. Service Layer (src/lib/services/regions.service.ts)
   ├─> Execute Supabase query: .from("regions").select("*").eq("id", id).limit(1).maybeSingle()
   ├─> Handle database errors (throw Error)
   └─> Return region entity or null

5. Client Response
   └─> JSON response with appropriate status code
```

**Database Query:**

```sql
SELECT * FROM regions WHERE id = $1 LIMIT 1;
```

**Row Level Security:**

- Public read access policy allows SELECT without authentication
- No authentication token required

## 6. Security Considerations

**Input Validation:**

- UUID format validation prevents SQL injection and invalid data types
- Zod schema ensures only valid UUID strings are processed
- Path parameter sanitization handled by Astro framework

**Authentication:**

- No authentication required (public endpoint)
- Regions are global reference data accessible to all users
- No user-specific data involved

**Authorization:**

- PostgreSQL RLS policy: "Allow public read access to regions"
- Policy allows SELECT operations without authentication check
- No authorization logic needed in application layer

**Data Exposure:**

- Only public region data is exposed (id, name, created_at)
- No sensitive user information
- No private or user-specific data

**Common Vulnerabilities:**

- ✅ SQL Injection: Prevented by parameterized queries (Supabase client)
- ✅ XSS: No user-generated content in response, only database values
- ✅ IDOR: Not applicable (public data, no user context)
- ✅ UUID Enumeration: Low risk (public data), validated format prevents abuse

## 7. Error Handling

**Error Scenarios:**

1. **Missing Supabase Client (500 Internal Server Error)**
   - Condition: `!supabase` in locals
   - Response: `{ "error": "Database client not available" }`
   - Status: 500
   - Logging: Not needed (infrastructure issue)

2. **Invalid UUID Format (400 Bad Request)**
   - Condition: `uuidSchema.safeParse(id)` fails
   - Response: `{ "error": "Invalid UUID format" }`
   - Status: 400
   - Logging: Not needed (expected user error)
   - Examples:
     - "invalid-uuid-format"
     - "123-456-789"
     - "<script>alert('xss')</script>"

3. **Region Not Found (404 Not Found)**
   - Condition: `getRegionById()` returns null
   - Response: `{ "error": "Region not found" }`
   - Status: 404
   - Logging: Not needed (expected scenario)

4. **Database Query Failure (500 Internal Server Error)**
   - Condition: Supabase query throws error
   - Response: `{ "error": "Internal server error" }`
   - Status: 500
   - Logging: ✅ Console.error with error details
   - Trigger: Service layer throws Error, caught in route handler

**Error Handling Pattern:**

- Guard clauses for early returns (fail-fast approach)
- Service layer throws errors for database failures
- Route handler catches all errors in try-catch block
- Console logging for unexpected errors (500s)
- User-friendly error messages (no internal details exposed)

## 8. Performance Considerations

**Database Query Optimization:**

- `.limit(1)` ensures only one row is fetched
- `.maybeSingle()` returns null instead of array for cleaner handling
- Primary key lookup (id) uses index automatically (fastest query type)
- No joins required (simple table lookup)

**Query Execution Time:**

- Expected: < 10ms (primary key index lookup)
- No N+1 query issues (single query)

**Response Size:**

- Minimal: ~100-150 bytes (id + name + timestamp)
- No nested objects or large text fields

**Caching Strategy:**

- Consider HTTP cache headers for future optimization:
  - `Cache-Control: public, max-age=3600` (regions rarely change)
  - `ETag` based on updated_at timestamp
- Not implemented in MVP (can be added post-launch)

**Bottlenecks:**

- None expected (simple primary key lookup)
- Database connection pooling handled by Supabase client

**Scalability:**

- Endpoint is stateless (scales horizontally)
- No rate limiting required (public read endpoint)
- Database load minimal (indexed primary key lookup)

## 9. Implementation Steps

### Step 1: Add `getRegionById` Function to Regions Service

**File:** `src/lib/services/regions.service.ts`

**Action:** Add new function after `listRegions` function

**Code:**

```typescript
/**
 * Retrieves a single region by its UUID
 * Regions are public global data, accessible without authentication
 *
 * @param supabase - Supabase client instance
 * @param id - UUID of the region to retrieve
 * @returns Region entity if found, null otherwise
 * @throws Error if database query fails
 *
 * @example
 * const region = await getRegionById(supabase, '550e8400-e29b-41d4-a716-446655440000');
 * if (!region) {
 *   // Handle not found
 * }
 */
export async function getRegionById(supabase: SupabaseClient, id: string): Promise<RegionResponseDTO | null> {
  // Execute query with .maybeSingle() to get exactly one row or null
  const { data, error } = await supabase.from("regions").select("*").eq("id", id).limit(1).maybeSingle();

  // Handle database errors
  if (error) {
    // eslint-disable-next-line no-console
    console.error("Database query failed:", error);
    throw new Error(`Failed to fetch region: ${error.message}`);
  }

  // Return region entity or null if not found
  return data;
}
```

**Type Import:** Add to existing imports

```typescript
import type { RegionResponseDTO, RegionsListResponseDTO, RegionsQueryDTO } from "../../types";
```

### Step 2: Create API Route Handler

**File:** `src/pages/api/regions/[id].ts` (new file)

**Action:** Create new Astro API route file

**Code:**

```typescript
import { formatZodError } from "@/lib/helpers/format-error";
import { getRegionById } from "@/lib/services/regions.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/regions/:id
 * Retrieves a single region by its UUID
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

    // Extract id from path params
    const { id } = params;

    // Guard clause: Validate UUID format
    const validationResult = uuidSchema.safeParse(id);

    if (!validationResult.success) {
      const errorMessage = formatZodError(validationResult.error);
      const errorResponse: ErrorResponseDTO = {
        error: errorMessage,
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch region from service layer
    const region = await getRegionById(supabase, validationResult.data);

    // Guard clause: Check if region exists
    if (!region) {
      const errorResponse: ErrorResponseDTO = {
        error: "Region not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Happy path: Return success response
    return new Response(JSON.stringify(region), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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

### Step 3: Create HTTP Test Script

**File:** `api-tests-scripts/test-get-region-by-id.http` (new file)

**Action:** Create comprehensive test cases

**Code:**

```http
### API Endpoint Test Suite
### GET /api/regions/:id
@endpointUrl = {{baseUrl}}/api/regions

### NOTE: This endpoint does NOT require authentication (public read access)
### Regions are global reference data accessible to all users

### ============================================================================
### SETUP - Get a valid region ID for testing
### ============================================================================

### Setup: Get list of regions to obtain valid ID
### Run this first to get a valid region ID for subsequent tests
GET {{endpointUrl}}?limit=1


### ============================================================================
### SUCCESS CASES
### ============================================================================

### Test 1: Get existing region (happy path)
### Expected: 200 OK with region entity (id, name, created_at)
GET {{endpointUrl}}/{{testRegionId}}

### ============================================================================
### NOT FOUND CASES (404)
### ============================================================================

### Test 2: Get non-existent region (valid UUID but doesn't exist)
### Expected: 404 Not Found
GET {{endpointUrl}}/{{nonExistentRegionId}}

### ============================================================================
### VALIDATION ERROR CASES (400 Bad Request)
### ============================================================================

### Test 3: Invalid UUID format - not a UUID at all
### Expected: 400 Bad Request - Invalid UUID format
GET {{endpointUrl}}/invalid-uuid-format

### Test 4: Invalid UUID format - malformed UUID (missing segments)
### Expected: 400 Bad Request - Invalid UUID format
GET {{endpointUrl}}/123-456-789

### Test 5: Invalid UUID format - special characters
### Expected: 400 Bad Request - Invalid UUID format
GET {{endpointUrl}}/<script>alert('xss')</script>

### ============================================================================
### EDGE CASES
### ============================================================================

### Test 6: UUID with uppercase letters (should work - UUIDs are case-insensitive)
### Expected: Depends on database - likely 404 if UUID doesn't exist
GET {{endpointUrl}}/550E8400-E29B-41D4-A716-446655440000

### Test 7: UUID with mixed case
### Expected: Depends on database - likely 404 if UUID doesn't exist
GET {{endpointUrl}}/550e8400-E29B-41d4-A716-446655440000
```

### Step 4: Manual Testing

**Prerequisites:**

1. Ensure dev server is running (`npm run dev`)
2. Ensure at least one region exists in database

**Test Sequence:**

1. Run setup request to get valid region ID
2. Test happy path with valid ID (expect 200)
3. Test not found with non-existent UUID (expect 404)
4. Test invalid UUID formats (expect 400)

**VS Code REST Client:**

- Use `test-get-region-by-id.http` file
- Click "Send Request" above each test
- Verify response status and body match expectations

### Step 5: Update API Documentation

**File:** `.ai/api-plan.md`

**Action:** Update section "2.3.2. Get Region by ID"

**Changes:**

1. Add status indicator: `**Status:** ✅ **Implemented**`
2. Add implementation details section:

```markdown
**Implementation Details:**

- **File:** `src/pages/api/regions/[id].ts`
- **Service:** `src/lib/services/regions.service.ts` (`getRegionById`)
- **Validator:** `src/lib/validators/uuid.validator.ts` (`uuidSchema`)
- **Test Script:** `api-tests-scripts/test-get-region-by-id.http`
```

### Step 6: Final Validation

**Code Quality Checks:**

1. Run linter: `npm run lint` (ensure no errors)
2. Check TypeScript compilation: `npm run build` (ensure no type errors)
3. Verify all imports resolve correctly
4. Ensure consistent code style with existing brand endpoint

**Functional Testing:**

1. Verify all 7 test cases pass in HTTP test file
2. Test with actual region data from database
3. Verify error responses match specification
4. Test edge cases (uppercase UUIDs, special characters)

**Documentation Review:**

1. Verify JSDoc comments are clear and accurate
2. Ensure API plan is updated with implementation status
3. Confirm test script follows project conventions

---

## Summary

This implementation plan provides a complete guide for creating the "Get Region by ID" endpoint. The endpoint follows the exact same pattern as the "Get Brand by ID" endpoint for consistency. Key points:

- **Pattern Reuse:** Mirrors brand endpoint implementation for consistency
- **Public Access:** No authentication required (global reference data)
- **Simple Logic:** Direct database lookup by primary key
- **Robust Validation:** UUID format validation prevents invalid requests
- **Error Handling:** Guard clauses for fail-fast approach
- **Performance:** Optimized with primary key index lookup
- **Testing:** Comprehensive test suite with 7 test cases
- **Type Safety:** Full TypeScript typing throughout
