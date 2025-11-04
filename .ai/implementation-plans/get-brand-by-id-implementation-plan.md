# API Endpoint Implementation Plan: Get Brand by ID

## 1. Endpoint Overview

**Purpose**: Retrieve a single brand entity by its unique identifier (UUID).

**Functionality**: This endpoint provides public read access to individual brand records from the global brands table. It accepts a brand UUID as a path parameter and returns the complete brand entity if found. No authentication is required as brands are public global data shared across all users.

**Use Cases**:

- Fetching brand details for display in UI components
- Validating brand existence before creating blends or tasting notes
- Supporting autocomplete and search functionality
- Providing brand information for comparison views

---

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

```
/api/brands/:id
```

### Path Parameters

| Parameter | Type   | Required | Validation           | Description                    |
| --------- | ------ | -------- | -------------------- | ------------------------------ |
| `id`      | string | Yes      | Valid UUID v4 format | Unique identifier of the brand |

**Validation Rules**:

- Must be a valid UUID format (8-4-4-4-12 hexadecimal pattern)
- Example valid UUID: `550e8400-e29b-41d4-a716-446655440000`

### Query Parameters

None

### Request Headers

- `Content-Type`: Not required (GET request)
- `Authorization`: Not required (public endpoint)

### Request Body

None (GET request)

### Example Request

```http
GET /api/brands/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: api.sipstory.com
```

---

## 3. Used Types

### Response DTOs

```typescript
// From src/types.ts

/**
 * Brand response DTO
 * Direct mapping from brands entity
 */
export type BrandResponseDTO = BrandEntity;

/**
 * Brand entity from database
 */
export type BrandEntity = Tables<"brands">;
// Structure: { id: string, name: string, created_at: string }
```

### Error Response DTO

```typescript
// From src/types.ts

/**
 * Standard error response structure
 */
export interface ErrorResponseDTO {
  error: string;
  details?: ValidationErrorDTO[];
}
```

### Validation Types

```typescript
// From src/lib/validators/uuid.validator.ts

/**
 * UUID validation schema for path parameters
 */
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

/**
 * Inferred type from the UUID validation schema
 */
export type UuidInput = z.infer<typeof uuidSchema>;
```

---

## 4. Response Details

### Success Response (200 OK)

**Status Code**: `200`

**Headers**:

```
Content-Type: application/json
```

**Body Structure**:

```typescript
{
  id: string; // UUID of the brand
  name: string; // Brand name (case-insensitive unique, stored as CITEXT)
  created_at: string; // ISO 8601 timestamp (TIMESTAMPTZ from database)
}
```

**Example**:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ippodo Tea",
  "created_at": "2024-11-01T14:30:00.000Z"
}
```

### Error Responses

#### 400 Bad Request - Invalid UUID Format

**When**: Path parameter is not a valid UUID format

**Body**:

```json
{
  "error": "Invalid UUID format"
}
```

#### 404 Not Found - Brand Does Not Exist

**When**: UUID is valid but no brand exists with that ID

**Body**:

```json
{
  "error": "Brand not found"
}
```

#### 500 Internal Server Error - Database Connection Unavailable

**When**: Supabase client is not available in request context

**Body**:

```json
{
  "error": "Database connection unavailable"
}
```

#### 500 Internal Server Error - Database Query Failed

**When**: Unexpected database error occurs during query

**Body**:

```json
{
  "error": "Internal server error"
}
```

---

## 5. Data Flow

### High-Level Flow

```
1. Client Request
   ↓
2. Astro API Route Handler (/api/brands/[id].ts)
   ↓
3. Extract and Validate Path Parameter (id)
   ↓
4. Service Layer (getBrandById)
   ↓
5. Supabase Query (brands table)
   ↓
6. Response Transformation (if needed)
   ↓
7. Return JSON Response
```

### Detailed Flow

#### Step 1: Request Reception

- Astro API route receives GET request at `/api/brands/:id`
- Extract `id` from route params via `context.params.id`
- Extract `supabase` client from `context.locals`

#### Step 2: Input Validation

- Validate `id` parameter using `uuidSchema` from `uuid.validator.ts`
- If validation fails:
  - Format error using `formatZodError` helper
  - Return 400 Bad Request with error message
- If validation succeeds:
  - Proceed with validated UUID string

#### Step 3: Database Connection Check

- Verify `supabase` client exists in `locals`
- If not available:
  - Return 500 Internal Server Error
  - Log error to console

#### Step 4: Service Layer Invocation

- Call `getBrandById(supabase, id)` service function
- Service function executes:
  ```typescript
  const { data, error } = await supabase.from("brands").select("*").eq("id", id).single();
  ```

#### Step 5: Database Query

- Supabase performs SELECT query on `brands` table
- Query structure: `SELECT * FROM brands WHERE id = $1 LIMIT 1`
- PostgreSQL uses indexed lookup (primary key index on `id`)
- RLS policies enforced (public read access policy allows SELECT)

#### Step 6: Result Handling

**Case A: Brand Found**

- `data` contains brand entity
- `error` is null
- Service returns brand object
- API route returns 200 OK with brand data

**Case B: Brand Not Found**

- `data` is null
- `error` is null (not an error, just no match)
- Service returns null
- API route returns 404 Not Found

**Case C: Database Error**

- `data` is null
- `error` contains error details
- Service logs error and returns null
- API route returns 500 Internal Server Error

#### Step 7: Response Construction

- Construct Response object with:
  - Status code (200, 400, 404, or 500)
  - JSON body (brand data or error object)
  - Content-Type header

---

## 6. Security Considerations

### Authentication and Authorization

**No Authentication Required**:

- Brands are public global data
- No user authentication or session validation needed
- Follows specification: "Authentication: Not Required (public read access)"

**Row Level Security (RLS)**:

- Database-level policy enforces public read access
- Policy: `"Allow public read access to brands" ON brands FOR SELECT USING (true)`
- Even without authentication, RLS policies are applied

### Input Validation

**UUID Format Validation**:

- Prevents injection attacks by ensuring only valid UUIDs are processed
- Zod schema validates against UUID v4 format
- Invalid formats rejected before database query

**Parameter Sanitization**:

- Supabase client uses parameterized queries
- No raw SQL concatenation
- Prevents SQL injection attacks

### Information Disclosure

**Minimal Data Exposure**:

- Brand entity contains only non-sensitive data (id, name, created_at)
- No user-specific or confidential information
- Safe for public access

**Error Messages**:

- Generic error messages for server errors ("Internal server error")
- No stack traces or internal details exposed to client
- Detailed errors logged server-side only

### Denial of Service (DoS)

**Rate Limiting**:

- Should be implemented at infrastructure level (not in endpoint)
- Consider using Astro middleware or reverse proxy (e.g., nginx)
- Post-MVP consideration as per specification

**Query Optimization**:

- Single-row lookup by primary key (highly efficient)
- No complex joins or aggregations
- Minimal database load per request

### Enumeration Attacks

**Limited Risk**:

- Brands are public data, so enumeration is not a significant concern
- Invalid UUIDs return 400 (format error) rather than 404
- Valid UUIDs for non-existent brands return 404
- Distinction between format error and not found is acceptable for public data

---

## 7. Error Handling

### Error Categories

#### 1. Validation Errors (400 Bad Request)

**Scenario**: Invalid UUID format in path parameter

**Detection**:

```typescript
const validationResult = uuidSchema.safeParse(id);
if (!validationResult.success) {
  // Handle validation error
}
```

**Response**:

```json
{
  "error": "Invalid UUID format"
}
```

**Logging**: No server-side logging needed (client error)

**User Action**: Correct the UUID format and retry

---

#### 2. Not Found Errors (404 Not Found)

**Scenario**: Valid UUID but brand doesn't exist

**Detection**:

```typescript
const brand = await getBrandById(supabase, id);
if (!brand) {
  // Handle not found
}
```

**Response**:

```json
{
  "error": "Brand not found"
}
```

**Logging**: Optional informational logging (not an error condition)

**User Action**: Verify the brand ID is correct

---

#### 3. Server Errors (500 Internal Server Error)

**Scenario A**: Database connection unavailable

**Detection**:

```typescript
if (!supabase) {
  // Handle missing client
}
```

**Response**:

```json
{
  "error": "Database connection unavailable"
}
```

**Logging**:

```typescript
console.error("Supabase client unavailable in locals");
```

**User Action**: Retry request (transient issue)

---

**Scenario B**: Database query failure

**Detection**:

```typescript
const { data, error } = await supabase.from("brands")...;
if (error) {
  // Handle database error
}
```

**Response**:

```json
{
  "error": "Internal server error"
}
```

**Logging**:

```typescript
console.error("Database query failed:", error);
```

**User Action**: Retry request or contact support

---

#### 4. Unexpected Errors (500 Internal Server Error)

**Scenario**: Uncaught exception in route handler

**Detection**:

```typescript
try {
  // Route logic
} catch (error) {
  // Handle unexpected error
}
```

**Response**:

```json
{
  "error": "Internal server error"
}
```

**Logging**:

```typescript
console.error("API route error:", error);
```

**User Action**: Retry request or contact support

---

### Error Handling Best Practices

1. **Early Returns**: Use guard clauses to handle errors at the beginning
2. **Consistent Format**: All errors return `ErrorResponseDTO` structure
3. **Appropriate Status Codes**: Follow HTTP standards (400 for client errors, 500 for server errors)
4. **Logging Strategy**:
   - Client errors (400): No logging or minimal logging
   - Not found (404): Optional informational logging
   - Server errors (500): Detailed error logging with context
5. **Error Messages**: User-friendly messages without internal implementation details

---

## 8. Performance Considerations

### Database Performance

**Query Optimization**:

- Primary key lookup using indexed `id` column
- Query plan: Index Scan on brands_pkey (primary key index)
- Expected execution time: < 1ms for indexed lookup
- No table scan required

**Query Structure**:

```sql
SELECT * FROM brands WHERE id = $1 LIMIT 1;
```

**Index Usage**:

- Primary key index: `brands_pkey` on `id` column (UUID)
- Index type: B-tree (default for PRIMARY KEY)
- Index automatically created with table

### Network Performance

**Response Size**:

- Typical response: ~150-250 bytes (JSON with UUID, name, timestamp)
- Minimal payload, no nested objects
- No compression needed for such small responses

**Caching Strategy** (Post-MVP):

- Brands are relatively static data
- Consider HTTP caching headers:
  - `Cache-Control: public, max-age=3600` (1 hour)
  - `ETag` support for conditional requests
- CDN caching for global distribution

### Application Performance

**Service Layer**:

- Single async operation (no parallel calls needed)
- No complex transformations or computations
- Direct entity mapping (no DTO transformation)

**Memory Usage**:

- Minimal memory footprint per request
- Single brand entity (~100 bytes)
- No large object allocations

### Bottleneck Analysis

**Potential Bottlenecks**:

1. **Database Connection Pool**: Unlikely for simple queries
2. **Network Latency**: Main performance factor (client ↔ server ↔ database)
3. **Cold Start**: Serverless environments may have cold start overhead

**Mitigation Strategies**:

1. Use connection pooling (handled by Supabase client)
2. Deploy close to database region
3. Implement keep-alive for serverless functions (if applicable)

### Performance Monitoring

**Metrics to Track**:

- Response time (p50, p95, p99 percentiles)
- Database query duration
- Error rate by type
- Request volume over time

**Alerting Thresholds** (Post-MVP):

- Response time > 500ms: Warning
- Response time > 1000ms: Critical
- Error rate > 1%: Warning
- Error rate > 5%: Critical

---

## 9. Implementation Steps

### Phase 1: Service Layer Implementation

#### Step 1.1: Create Service Function

**File**: `src/lib/services/brands.service.ts`

**Action**: Add `getBrandById` function

**Implementation**:

```typescript
/**
 * Retrieves a single brand by its UUID
 * Brands are public global data, accessible without authentication
 *
 * @param supabase - Supabase client instance
 * @param id - UUID of the brand to retrieve
 * @returns Brand entity if found, null otherwise
 * @throws Error if database query fails
 *
 * @example
 * const brand = await getBrandById(supabase, '550e8400-e29b-41d4-a716-446655440000');
 * if (!brand) {
 *   // Handle not found
 * }
 */
export async function getBrandById(supabase: SupabaseClient, id: string): Promise<BrandResponseDTO | null> {
  // Execute query with .single() to get exactly one row
  const { data, error } = await supabase.from("brands").select("*").eq("id", id).single();

  // Handle database errors
  if (error) {
    console.error("Database query failed:", error);
    return null;
  }

  // Return brand entity or null if not found
  return data;
}
```

**Testing**:

- Unit test with mocked Supabase client
- Test cases:
  - Brand exists → returns brand entity
  - Brand doesn't exist → returns null
  - Database error → logs error and returns null

---

### Phase 2: API Route Implementation

#### Step 2.1: Create API Route File

**File**: `src/pages/api/brands/[id].ts`

**Action**: Create new Astro API endpoint file

**File Structure**:

```typescript
import type { APIRoute } from "astro";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import { formatZodError } from "@/lib/helpers/format-error";
import { getBrandById } from "@/lib/services/brands.service";
import type { ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // Implementation here
};
```

---

#### Step 2.2: Implement Request Validation

**Action**: Extract and validate path parameter

**Implementation**:

```typescript
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase } = locals;

    // Guard clause: Check database connection
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection unavailable" }), {
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

    // Continue with validated ID...
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

#### Step 2.3: Implement Service Layer Call

**Action**: Fetch brand from database

**Implementation**:

```typescript
// After validation...

// Fetch brand from service layer
const brand = await getBrandById(supabase, validationResult.data);

// Guard clause: Check if brand exists
if (!brand) {
  const errorResponse: ErrorResponseDTO = {
    error: "Brand not found",
  };
  return new Response(JSON.stringify(errorResponse), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

// Return success response
return new Response(JSON.stringify(brand), {
  status: 200,
  headers: { "Content-Type": "application/json" },
});
```

---

### Phase 3: Testing

#### Step 3.1: Unit Tests for Service Function

**File**: `src/lib/services/__tests__/brands.service.test.ts`

**Test Cases**:

```typescript
describe("getBrandById", () => {
  it("should return brand when found", async () => {
    // Mock Supabase client to return brand
    // Assert brand entity is returned
  });

  it("should return null when brand not found", async () => {
    // Mock Supabase client to return null
    // Assert null is returned
  });

  it("should return null and log error when database fails", async () => {
    // Mock Supabase client to return error
    // Assert null is returned and error is logged
  });
});
```

---

#### Step 3.2: Integration Tests for API Endpoint

**File**: `api-tests-scripts/test-get-brand-by-id.http`

**Test Cases**:

```http
### Test 1: Get existing brand (Success - 200)
GET {{host}}/api/brands/{{valid_brand_id}}

### Test 2: Get non-existent brand (Not Found - 404)
GET {{host}}/api/brands/550e8400-e29b-41d4-a716-446655440000

### Test 3: Invalid UUID format (Bad Request - 400)
GET {{host}}/api/brands/invalid-uuid-format

### Test 4: Malformed UUID (Bad Request - 400)
GET {{host}}/api/brands/123-456-789
```

---

#### Step 3.3: End-to-End Tests

**Scenarios**:

1. Create brand → Get brand by ID → Verify response matches
2. Attempt to get brand with invalid ID → Verify 400 error
3. Attempt to get non-existent brand → Verify 404 error

---

### Phase 4: Documentation

#### Step 4.1: API Documentation

**Action**: Update API documentation with endpoint details

**Include**:

- Endpoint URL and method
- Path parameters and validation rules
- Response schemas and examples
- Error responses with status codes
- Usage examples

---

#### Step 4.2: Code Documentation

**Action**: Ensure all functions have JSDoc comments

**Requirements**:

- Function purpose and behavior
- Parameter descriptions with types
- Return value description
- Example usage
- Error handling notes

---

### Phase 5: Deployment Checklist

#### Pre-Deployment:

- [ ] Service function implemented and tested
- [ ] API route implemented and tested
- [ ] UUID validator verified
- [ ] Error formatter verified
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Documentation updated

#### Post-Deployment:

- [ ] Smoke test in production environment
- [ ] Verify endpoint returns 200 for existing brands
- [ ] Verify endpoint returns 404 for non-existent brands
- [ ] Verify endpoint returns 400 for invalid UUIDs
- [ ] Monitor error logs for unexpected issues
- [ ] Update API documentation with production URL

---

### Implementation Timeline

**Estimated Duration**: 2-3 hours

**Breakdown**:

- Service function: 30 minutes
- API route: 30 minutes
- Unit tests: 30 minutes
- Integration tests: 30 minutes
- Documentation: 30 minutes
- Code review and refinement: 30 minutes

**Dependencies**:

- Existing `uuidSchema` validator (✓ already exists)
- Existing `formatZodError` helper (✓ already exists)
- Existing Supabase client setup (✓ already exists)
- Database `brands` table (✓ already exists)

**Blockers**:

- None (all dependencies satisfied)

---

### Rollback Triggers

Rollback if:

- Error rate exceeds 5% within first hour
- Response time exceeds 2 seconds consistently
- Critical bug discovered affecting data integrity
- Database performance degrades significantly

### Rollback Steps

1. Remove `/api/brands/[id].ts` route file
2. Remove `getBrandById` function from service file (or comment out)
3. Verify removal doesn't affect existing `/api/brands` endpoint
4. Deploy rollback changes
5. Verify error rate returns to baseline
6. Document issues for post-mortem analysis

### Rollback Testing

- Verify existing `/api/brands` (list) endpoint still works
- Verify no other endpoints depend on removed function
- Verify no breaking changes to frontend clients

---

## Conclusion

This implementation plan provides comprehensive guidance for implementing the "Get Brand by ID" endpoint. The endpoint follows RESTful conventions, implements proper error handling, and leverages existing validators and helpers from the codebase. The implementation is straightforward due to the public nature of brand data and the simplicity of single-entity retrieval.

Key success factors:

- Proper UUID validation to prevent invalid queries
- Clear error messages for different failure scenarios
- Efficient database query using primary key lookup
- Consistent error handling patterns with existing endpoints
- Comprehensive testing at unit, integration, and E2E levels
