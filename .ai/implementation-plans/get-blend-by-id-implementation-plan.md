# API Endpoint Implementation Plan: Get Blend by ID

## 1. Endpoint Overview

**Purpose:** Retrieve a single blend by its unique UUID identifier.

**Key Characteristics:**

- Public read access (no authentication required)
- Returns blend with nested brand and region data
- Simple lookup operation with UUID validation
- Follows established pattern from Get Brand by ID and Get Region by ID endpoints

**Business Context:**
Blends are global resources shared across all users. This endpoint enables clients to fetch detailed information about a specific blend, including its associated brand and region. Used for displaying blend details, populating forms, and enabling autocomplete functionality.

---

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/blends/:id`

**Example:** `GET /api/blends/550e8400-e29b-41d4-a716-446655440000`

### Path Parameters

| Parameter | Type   | Required | Validation                | Description                                |
| --------- | ------ | -------- | ------------------------- | ------------------------------------------ |
| `id`      | string | Yes      | Must be valid UUID format | Unique identifier of the blend to retrieve |

### Request Headers

- `Content-Type: application/json` (standard)
- No authentication headers required (public endpoint)

### Request Body

None (GET request)

---

## 3. Used Types

### Response Types

**BlendResponseDTO** (from `src/types.ts`):

```typescript
interface BlendResponseDTO {
  id: string;
  name: string;
  created_at: string;
  brand: NestedBrandDTO;
  region: NestedRegionDTO;
}
```

**NestedBrandDTO** (from `src/types.ts`):

```typescript
interface NestedBrandDTO {
  id: string;
  name: string;
}
```

**NestedRegionDTO** (from `src/types.ts`):

```typescript
interface NestedRegionDTO {
  id: string;
  name: string;
}
```

**ErrorResponseDTO** (from `src/types.ts`):

```typescript
interface ErrorResponseDTO {
  error: string;
  details?: ValidationErrorDTO[];
}
```

### Validation Types

**uuidSchema** (from `src/lib/validators/uuid.validator.ts`):

- Zod schema for UUID validation
- Reused from existing validators

---

## 4. Response Details

### Success Response (200 OK)

**Status Code:** 200

**Response Body:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Ceremonial Grade",
  "created_at": "2024-11-07T12:00:00Z",
  "brand": {
    "id": "7b5a094a-8972-4fd0-9a54-0bccc615e7ec",
    "name": "Marukyu Koyamaen"
  },
  "region": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Uji, Kyoto"
  }
}
```

**Content-Type:** `application/json`

### Error Responses

#### 400 Bad Request - Invalid UUID Format

**Status Code:** 400

**Response Body:**

```json
{
  "error": "Invalid UUID format"
}
```

**Trigger:** Path parameter `id` is not a valid UUID

---

#### 404 Not Found - Blend Does Not Exist

**Status Code:** 404

**Response Body:**

```json
{
  "error": "Blend not found"
}
```

**Trigger:** Valid UUID but no blend exists with that ID in database

---

#### 500 Internal Server Error - Database Unavailable

**Status Code:** 500

**Response Body:**

```json
{
  "error": "Database client not available"
}
```

**Trigger:** Supabase client not initialized in middleware

---

#### 500 Internal Server Error - Unexpected Error

**Status Code:** 500

**Response Body:**

```json
{
  "error": "Internal server error"
}
```

**Trigger:** Unexpected database error or unhandled exception

---

## 5. Data Flow

### Request Flow

1. **Client Request**
   - Client sends GET request to `/api/blends/:id`
   - Path parameter `id` extracted from URL

2. **Astro Middleware**
   - Request passes through middleware (`src/middleware/index.ts`)
   - Supabase client initialized and attached to `locals.supabase`

3. **API Route Handler** (`src/pages/api/blends/[id].ts`)
   - Extract Supabase client from `locals`
   - Validate client availability (early return if null)
   - Extract `id` from path params
   - Validate UUID format with Zod schema
   - Return 400 if validation fails

4. **Service Layer** (`src/lib/services/blends.service.ts`)
   - Call `getBlendById(supabase, id)`
   - Build Supabase query with nested joins:
     ```typescript
     supabase
       .from("blends")
       .select(
         `
         id, name, created_at,
         brand:brands!inner (id, name),
         region:regions!inner (id, name)
       `
       )
       .eq("id", id)
       .limit(1)
       .maybeSingle();
     ```
   - Handle database errors (log and throw)
   - Return blend entity or null

5. **API Route Handler** (continued)
   - Check if blend is null → return 404
   - Return 200 with blend data

6. **Client Response**
   - Receive JSON response with status code
   - Handle success/error cases

### Database Interaction

**Tables Queried:**

- `blends` (main table)
- `brands` (joined via `blends.brand_id`)
- `regions` (joined via `blends.region_id`)

**Query Pattern:**

```sql
SELECT
  blends.id,
  blends.name,
  blends.created_at,
  brands.id as "brand.id",
  brands.name as "brand.name",
  regions.id as "region.id",
  regions.name as "region.name"
FROM blends
INNER JOIN brands ON blends.brand_id = brands.id
INNER JOIN regions ON blends.region_id = regions.id
WHERE blends.id = $1
LIMIT 1;
```

**Performance Considerations:**

- Primary key lookup on `blends.id` (indexed)
- Inner joins with `brands` and `regions` (indexed on foreign keys)
- Single row returned (`.limit(1).maybeSingle()`)

---

## 6. Security Considerations

### Authentication & Authorization

- **No authentication required** (public endpoint)
- Consistent with List Brands, Get Brand by ID, List Regions, Get Region by ID patterns
- Blends are global public data, safe for public access

### Input Validation

- **UUID validation**: Prevents malformed input from reaching database
- **Zod schema**: Type-safe validation with clear error messages
- **SQL injection prevention**: Supabase client uses parameterized queries

### Data Privacy

- **No sensitive data**: Blends contain only public product information
- **No user data**: Response doesn't include user-specific information
- **Read-only operation**: No data modification risks

### Rate Limiting

- Not implemented in MVP
- Consider adding in post-MVP for production

---

## 7. Error Handling

### Error Scenarios by Status Code

#### 400 - Validation Error

**Cause:** Invalid UUID format in path parameter

**Handling:**

```typescript
const validationResult = uuidSchema.safeParse(id);
if (!validationResult.success) {
  const errorMessage = formatZodError(validationResult.error);
  return new Response(JSON.stringify({ error: errorMessage }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Log:** None (client error)

---

#### 404 - Not Found

**Cause:** Valid UUID but blend doesn't exist

**Handling:**

```typescript
const blend = await getBlendById(supabase, validationResult.data);
if (!blend) {
  return new Response(JSON.stringify({ error: "Blend not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Log:** None (expected behavior)

---

#### 500 - Database Client Unavailable

**Cause:** Supabase client not initialized in middleware

**Handling:**

```typescript
if (!supabase) {
  return new Response(JSON.stringify({ error: "Database client not available" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Log:** Implicit (middleware should log initialization failures)

---

#### 500 - Database Query Error

**Cause:** Database connection failure, query timeout, or unexpected error

**Handling:**

```typescript
try {
  // ... route logic
} catch (error) {
  console.error("API route error:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Log:** Console.error with full error object

---

## 8. Performance Considerations

### Database Query Optimization

- **Primary key lookup**: `blends.id` is indexed (UUID primary key)
- **Foreign key joins**: `blends.brand_id` and `blends.region_id` are indexed
- **Single row result**: `.limit(1).maybeSingle()` ensures minimal data transfer
- **Selective fields**: Only necessary columns selected (no `SELECT *` on joins)

### Response Size

- **Minimal data**: ~200-300 bytes per response
- **Nested structure**: Pre-joined data eliminates need for multiple client requests
- **No pagination**: Single entity response

### Caching Opportunities

- **HTTP caching**: Blends are immutable after creation
  - Consider `Cache-Control: public, max-age=3600` header
  - ETags for conditional requests
- **Application caching**: Not required for MVP (database is fast enough)

### Expected Load

- **Low frequency**: Individual blend lookups less common than list operations
- **Predictable latency**: Sub-100ms response time expected
- **No hotspots**: Uniform access pattern across blends

---

## 9. Implementation Steps

### Step 1: Add Service Function

**File:** `src/lib/services/blends.service.ts`

**Action:** Add `getBlendById` function to existing service file

**Code:**

```typescript
/**
 * Retrieves a single blend by its UUID with nested brand and region data
 * Blends are public global data, accessible without authentication
 *
 * @param supabase - Supabase client instance
 * @param id - UUID of the blend to retrieve
 * @returns Blend entity with nested brand/region if found, null otherwise
 * @throws Error if database query fails
 */
export async function getBlendById(supabase: SupabaseClient, id: string): Promise<BlendResponseDTO | null> {
  const { data, error } = await supabase
    .from("blends")
    .select(
      `
      id,
      name,
      created_at,
      brand:brands!inner (id, name),
      region:regions!inner (id, name)
    `
    )
    .eq("id", id)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Database query failed:", error);
    throw new Error(`Failed to fetch blend: ${error.message}`);
  }

  return data;
}
```

**Imports to add:**

```typescript
import type { BlendResponseDTO } from "../../types";
```

---

### Step 2: Create API Route Handler

**File:** `src/pages/api/blends/[id].ts` (new file)

**Action:** Create new API route file following Get Brand/Region by ID pattern

**Code:**

```typescript
import { formatZodError } from "@/lib/helpers/format-error";
import { getBlendById } from "@/lib/services/blends.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";
import type { ErrorResponseDTO } from "@/types";
import type { APIRoute } from "astro";

export const prerender = false;

/**
 * GET /api/blends/:id
 * Retrieves a single blend by its UUID with nested brand and region
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
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

    const { id } = params;

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

    const blend = await getBlendById(supabase, validationResult.data);

    if (!blend) {
      const errorResponse: ErrorResponseDTO = {
        error: "Blend not found",
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(blend), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
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

---

### Step 3: Create Test Script

**File:** `api-tests-scripts/test-get-blend-by-id.http` (new file)

**Action:** Create REST Client test file with comprehensive test cases

**Code:**

```http
@baseUrl = http://localhost:3000
@endpointUrl = {{baseUrl}}/api/blends

### Shared Variables (from auth.http or other test files)
# @testBlendId = <get from test-list-blends.http response>
# @nonExistentBlendId = 00000000-0000-0000-0000-000000000000

### ============================================================================
### SUCCESS CASES
### ============================================================================

### Test 1: Get existing blend
GET {{endpointUrl}}/{{testBlendId}}

### Expected: 200 OK with blend details including nested brand and region

### ============================================================================
### ERROR CASES - 400 Bad Request
### ============================================================================

### Test 2: Invalid UUID format - not a UUID
GET {{endpointUrl}}/not-a-uuid

### Expected: 400 Bad Request with validation error

### Test 3: Invalid UUID format - incomplete UUID
GET {{endpointUrl}}/550e8400-e29b

### Expected: 400 Bad Request

### Test 4: Invalid UUID format - random string
GET {{endpointUrl}}/abc123xyz

### Expected: 400 Bad Request

### ============================================================================
### ERROR CASES - 404 Not Found
### ============================================================================

### Test 5: Valid UUID but blend doesn't exist
GET {{endpointUrl}}/{{nonExistentBlendId}}

### Expected: 404 Not Found

### Test 6: Another non-existent UUID
GET {{endpointUrl}}/ffffffff-ffff-ffff-ffff-ffffffffffff

### Expected: 404 Not Found
```

---

### Step 4: Verify Type Definitions

**File:** `src/types.ts`

**Action:** Confirm all required types exist (no changes needed)

**Types to verify:**

- ✅ `BlendResponseDTO` - exists
- ✅ `NestedBrandDTO` - exists
- ✅ `NestedRegionDTO` - exists
- ✅ `ErrorResponseDTO` - exists

---

### Step 5: Manual Testing

**Prerequisites:**

- Development server running (`npm run dev`)
- Database seeded with test blend data
- Note a valid blend ID from database for testing

**Test Cases:**

1. **Valid blend ID:**

   ```bash
   curl http://localhost:3000/api/blends/<valid-uuid> | jq
   ```

   Expected: 200 with nested brand/region data

2. **Invalid UUID format:**

   ```bash
   curl http://localhost:3000/api/blends/not-a-uuid | jq
   ```

   Expected: 400 with validation error

3. **Non-existent blend:**
   ```bash
   curl http://localhost:3000/api/blends/00000000-0000-0000-0000-000000000000 | jq
   ```
   Expected: 404 with "Blend not found"

---

### Step 6: Update API Plan Documentation

**File:** `.ai/api-plan.md`

**Action:** Mark endpoint as implemented and add implementation details

**Changes:**

1. Update line with status to:

   ```markdown
   **Status:** ✅ **Implemented**
   ```

2. Add implementation details section after error responses:
   ```markdown
   **Implementation Details:**

   - **File:** `src/pages/api/blends/[id].ts`
   - **Service:** `src/lib/services/blends.service.ts` (`getBlendById`)
   - **Validator:** `src/lib/validators/uuid.validator.ts` (`uuidSchema`)
   - **Test Script:** `api-tests-scripts/test-get-blend-by-id.http`
   ```

---

## Implementation Checklist

- [ ] Step 1: Add `getBlendById` service function
- [ ] Step 2: Create API route handler file
- [ ] Step 3: Create test script
- [ ] Step 4: Verify type definitions exist
- [ ] Step 5: Perform manual testing
- [ ] Step 6: Update API plan documentation

---

## Notes

- **Pattern Consistency:** This implementation follows the exact same pattern as Get Brand by ID and Get Region by ID for maintainability
- **No Authentication:** Public endpoint consistent with other global resource endpoints
- **Nested Data:** Unlike brands/regions, blends return nested brand and region objects
- **Test Data:** Requires seeded blend data in database for testing
- **Error Handling:** Comprehensive error handling at all layers (validation, service, route)
