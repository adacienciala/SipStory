# API Endpoint Implementation Plan: Get Tasting Note by ID

## 1. Endpoint Overview

This endpoint retrieves a single tasting note by its UUID for the authenticated user. The endpoint returns enriched data including nested brand and region information for the tasting note's blend.

**Purpose:** Enable users to view detailed information about a specific tasting note, supporting the detailed view requirement specified in the MVP.

**Key Features:**

- Retrieve single tasting note by UUID
- Returns fully nested data structure (blend → brand + region)
- Validates UUID format
- Ensures user can only access their own notes (via RLS)

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/tasting-notes/:id`

### Authentication

**Required:** Bearer token via Supabase Auth session (mock user for now)

### Path Parameters

#### Required Parameters

| Parameter | Type | Constraints | Description                          |
| --------- | ---- | ----------- | ------------------------------------ |
| `id`      | uuid | Valid UUID  | UUID of the tasting note to retrieve |

### Example Requests

**Basic request:**

```
GET /api/tasting-notes/123e4567-e89b-12d3-a456-426614174000
```

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Response Types:**

- `TastingNoteResponseDTO` - Individual tasting note with nested blend/brand/region
- `NestedBlendDTO` - Blend with brand and region
- `NestedBrandDTO` - Brand identification (id + name)
- `NestedRegionDTO` - Region identification (id + name)

**Error Response:**

- `ErrorResponseDTO` - Standard error structure

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

**Condition:** Invalid UUID format

```json
{
  "error": "Invalid tasting note ID format"
}
```

#### 404 Not Found

**Condition:** Tasting note does not exist or doesn't belong to user

```json
{
  "error": "Tasting note not found"
}
```

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
   - Verify Supabase Auth session (mock for now)
   - Attach user context to locals
   ↓
3. API Route Handler (src/pages/api/tasting-notes/[id].ts)
   - Extract id from path parameters
   - Validate UUID format with Zod
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Build Supabase query with joins
   - Execute query filtering by id and user_id
   - Transform database result to DTO
   ↓
5. Response Formatting
   - Return single tasting note object
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
WHERE tn.id = $1
  AND tn.user_id = $2
LIMIT 1
```

### 5.3 Data Transformation

Database row is transformed into nested DTO structure:

**Database Result → DTO Mapping:**

- Flat database columns → Nested `blend` → `brand` and `region` structure
- Timestamps converted to ISO 8601 strings
- Null values preserved for optional fields
- All UUIDs remain as strings

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** Supabase Auth session validation (mock user for now)

- Middleware checks for valid session token (skipped for mock)
- Extracts `user_id` from authenticated session (mock user ID for now)
- Rejects requests without valid authentication (401 Unauthorized)

**User Isolation:**

- Query filtered by both `id` AND `user_id`
- Row Level Security (RLS) policies enforced at database level
- User can only retrieve their own tasting notes

### 6.2 Input Validation & Sanitization

**Protection Against Injection:**

- UUID validated with Zod schema before database query
- Parameterized queries via Supabase (automatic)

**Parameter Validation:**

- `id`: Validate UUID format with regex pattern
- Return 400 if UUID format is invalid

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- Never concatenate user input into SQL strings
- Leverage TypeScript type safety with Supabase client

### 6.3 Data Exposure

**Controlled Data Access:**

- Only return data belonging to authenticated user
- No sensitive auth information exposed (password hashes, tokens)
- User email not included in response (only user_id)

**Information Leakage Prevention:**

- Generic error messages for server errors (no stack traces)
- Same 404 error whether note doesn't exist or belongs to another user
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

- Invalid UUID format (e.g., not a valid UUID)

**Handling:**

```typescript
const validationResult = uuidSchema.safeParse(id);
if (!validationResult.success) {
  return new Response(JSON.stringify({ error: "Invalid tasting note ID format" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Not Found Errors (404)

**Scenarios:**

- Tasting note with given UUID doesn't exist
- Tasting note exists but belongs to different user

**Handling:**

```typescript
if (!data || data.length === 0) {
  return new Response(JSON.stringify({ error: "Tasting note not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}
```

**Note:** We return the same 404 error for both cases to prevent information leakage about which UUIDs exist in the database.

#### Database Errors (500)

**Scenarios:**

- Supabase connection failure
- Query timeout
- Unexpected database errors
- Network errors

**Handling:**

```typescript
try {
  const result = await getTastingNoteById(supabase, mockUserId, validatedId);
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
- Include context: user_id, tasting_note_id, timestamp
- Do not expose internal error details to client

### 7.2 Edge Cases

| Edge Case                    | Behavior               | Response                                              |
| ---------------------------- | ---------------------- | ----------------------------------------------------- |
| Valid UUID but doesn't exist | Return 404 Not Found   | `{ "error": "Tasting note not found" }` (404)         |
| Note belongs to other user   | Return 404 Not Found   | `{ "error": "Tasting note not found" }` (404)         |
| Malformed UUID               | Return 400 Bad Request | `{ "error": "Invalid tasting note ID format" }` (400) |
| Empty string as ID           | Return 400 Bad Request | `{ "error": "Invalid tasting note ID format" }` (400) |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key index on `tasting_notes.id` (automatic)
- Index on `tasting_notes.user_id` (from list endpoint indexes)
- Foreign key indexes on `blend_id`, `brand_id`, `region_id` (automatic)

**Query Optimization:**

- Single row lookup by primary key (very fast)
- INNER JOINs on indexed foreign keys
- LIMIT 1 for safety (though primary key ensures single result)
- Combined filter on id + user_id for security

### 8.2 Caching Considerations

**Current Implementation:**

- No caching (MVP)

**Future Enhancements:**

- Consider Redis/memory caching for frequently accessed notes
- Cache TTL based on `updated_at` timestamp
- Invalidate cache on update/delete operations

## 9. Implementation Steps

### Step 1: Create UUID Validation Schema

**File:** `src/lib/validators/tasting-note-id.validator.ts`

**Tasks:**

1. Create Zod schema for UUID validation
2. Export reusable UUID validator
3. Add helper function for validation

**Key Validations:**

```typescript
import { z } from "zod";

export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

export type UuidInput = z.infer<typeof uuidSchema>;
```

### Step 2: Add Service Layer Function

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Add `getTastingNoteById(supabase, userId, id)` function
2. Build Supabase query with proper joins (same as list)
3. Filter by id and user_id
4. Return single result or null
5. Transform database result to `TastingNoteResponseDTO`
6. Handle errors appropriately

**Key Implementation:**

```typescript
export async function getTastingNoteById(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<TastingNoteResponseDTO | null> {
  // Build query with nested relations
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
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return transformToTastingNoteResponseDTO(data);
}
```

### Step 3: Create API Route Handler

**File:** `src/pages/api/tasting-notes/[id].ts`

**Tasks:**

1. Export `prerender = false` for server-side rendering
2. Implement `GET` handler function
3. Extract Supabase client from `context.locals`
4. Extract `id` from path parameters (`context.params.id`)
5. Validate UUID format with Zod schema
6. Use mock user ID for now
7. Call service layer function
8. Return formatted JSON response
9. Handle all error cases with appropriate status codes

### Step 4: Testing

**Create test cases for:**

1. Valid UUID that exists → 200 OK with data
2. Valid UUID that doesn't exist → 404 Not Found
3. Invalid UUID format → 400 Bad Request
4. Note belongs to different user → 404 Not Found
5. Database error → 500 Internal Server Error

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 200 OK with correct data for valid UUID belonging to user
2. ✅ Endpoint returns 404 Not Found for non-existent UUID
3. ✅ Endpoint returns 404 Not Found for UUID belonging to another user
4. ✅ Endpoint returns 400 Bad Request for invalid UUID format
5. ✅ Endpoint returns 401 Unauthorized without valid authentication (when implemented)
6. ✅ Response structure matches specification exactly
7. ✅ Nested blend/brand/region structure is correct
8. ✅ Error messages are clear and helpful
9. ✅ Code passes linting and type checking
10. ✅ Database query uses proper joins and filtering
