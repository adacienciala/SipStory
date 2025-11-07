# API Endpoint Implementation Plan: Select Tasting Notes

## 1. Endpoint Overview

This endpoint retrieves exactly two specific tasting notes by their UUIDs for side-by-side comparison.

**Purpose:** Enable users to select any two of their personal tasting entries for direct comparison in the comparison view.

**Key Features:**

- Retrieves exactly two tasting notes by ID
- Validates ownership (user can only retrieve their own notes)
- Returns both notes with full nested data (blend, brand, region)
- Used specifically for the comparison feature

## 2. Request Details

### HTTP Method

`GET`

### URL Structure

`/api/tasting-notes/select`

**Query Parameters:**
| Parameter | Type | Required | Description |
| --------- | ------ | -------- | ----------------------------------- |
| `ids` | string | Yes | Comma-separated UUIDs (exactly 2) |

**Example:** `/api/tasting-notes/select?ids=123e4567-e89b-12d3-a456-426614174000,223e4567-e89b-12d3-a456-426614174001`

### Authentication

**Required:** Bearer token via Supabase Auth session

### Request Body

**None** - GET requests do not have a request body

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Request Types:**

```typescript
// Query parameter structure (not a formal DTO, validated inline)
interface SelectNotesQuery {
  ids: string; // Comma-separated UUIDs
}
```

**Response Types:**

```typescript
// Success response
interface SelectNotesResponseDTO {
  notes: TastingNoteDTO[]; // Array of exactly 2 notes
}

// TastingNoteDTO defined in src/types.ts:
interface TastingNoteDTO {
  id: string;
  user_id: string;
  blend: {
    id: string;
    name: string;
    brand: {
      id: string;
      name: string;
    };
    region: {
      id: string;
      name: string;
    };
  };
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
```

- `ErrorResponseDTO` - Standard error structure

### Database Entity Types

From `src/db/database.types.ts`:

- `Tables<'tasting_notes'>` - Base tasting note entity
- `Tables<'blends'>` - Blend entity (nested)
- `Tables<'brands'>` - Brand entity (nested)
- `Tables<'regions'>` - Region entity (nested)

## 4. Response Details

### Success Response (200 OK)

```json
{
  "notes": [
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
      "overall_rating": 4,
      "umami": 5,
      "bitter": 2,
      "sweet": 3,
      "foam": 4,
      "notes_koicha": "string or null",
      "notes_milk": "string or null",
      "price_pln": 150,
      "purchase_source": "string or null",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
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
      "overall_rating": 5,
      "umami": 4,
      "bitter": 1,
      "sweet": 4,
      "foam": 5,
      "notes_koicha": "string or null",
      "notes_milk": "string or null",
      "price_pln": 200,
      "purchase_source": "string or null",
      "created_at": "2024-02-20T14:00:00Z",
      "updated_at": "2024-02-20T14:00:00Z"
    }
  ]
}
```

### Error Responses

#### 401 Unauthorized

**Condition:** Missing or invalid authentication token

```json
{
  "error": "Unauthorized - Authentication required"
}
```

#### 400 Bad Request

**Condition:** Invalid number of IDs, missing IDs parameter, or invalid UUID format

```json
{
  "error": "Exactly 2 tasting note IDs are required"
}
```

**Possible validation error messages:**

- `"ids parameter is required"`
- `"Exactly 2 tasting note IDs are required"`
- `"Invalid UUID format for one or more IDs"`

#### 404 Not Found

**Condition:** One or both tasting notes don't exist or don't belong to the authenticated user

```json
{
  "error": "One or more tasting notes not found"
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
   - Verify Supabase Auth session
   - Attach user context to locals
   ↓
3. API Route Handler (src/pages/api/tasting-notes/select.ts)
   - Extract and validate ids query parameter
   - Parse comma-separated UUIDs
   - Validate exactly 2 IDs provided
   - Validate UUID format for both IDs
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Query tasting notes by IDs with user_id filter
   - Include nested blend, brand, and region data
   - Return array of notes or null if not all found
   ↓
5. Response Formatting
   - Format as SelectNotesResponseDTO
   - Return 200 OK with both notes
   - Return 404 if one or both notes not found
```

### 5.2 Database Operations Sequence

**Single Query with Nested Data:**

```sql
SELECT
  tasting_notes.*,
  blends.id as "blend.id",
  blends.name as "blend.name",
  brands.id as "blend.brand.id",
  brands.name as "blend.brand.name",
  regions.id as "blend.region.id",
  regions.name as "blend.region.name"
FROM tasting_notes
INNER JOIN blends ON tasting_notes.blend_id = blends.id
INNER JOIN brands ON blends.brand_id = brands.id
INNER JOIN regions ON blends.region_id = regions.id
WHERE tasting_notes.id IN ($1, $2)
  AND tasting_notes.user_id = $3
ORDER BY
  CASE
    WHEN tasting_notes.id = $1 THEN 1
    WHEN tasting_notes.id = $2 THEN 2
  END;
```

**Notes:**

- RLS policies automatically enforce user ownership
- Query returns results in the order requested
- If fewer than 2 results returned, one or both notes not found/unauthorized

### 5.3 Data Transformation

**Service Layer → DTO:**

Transform Supabase response to nested structure:

```typescript
// Supabase returns flat structure with aliases
// Transform to nested TastingNoteDTO structure
const notes = data.map((row) => ({
  id: row.id,
  user_id: row.user_id,
  blend: {
    id: row.blend.id,
    name: row.blend.name,
    brand: {
      id: row.blend.brand.id,
      name: row.blend.brand.name,
    },
    region: {
      id: row.blend.region.id,
      name: row.blend.region.name,
    },
  },
  overall_rating: row.overall_rating,
  umami: row.umami,
  bitter: row.bitter,
  sweet: row.sweet,
  foam: row.foam,
  notes_koicha: row.notes_koicha,
  notes_milk: row.notes_milk,
  price_pln: row.price_pln,
  purchase_source: row.purchase_source,
  created_at: row.created_at,
  updated_at: row.updated_at,
}));
```

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** Supabase Auth session validation

- Middleware checks for valid session token
- Extracts `user_id` from authenticated session
- Rejects requests without valid authentication (401 Unauthorized)

**User Isolation:**

- Query includes `user_id` filter
- Row Level Security (RLS) policies enforced at database level
- User can only retrieve their own tasting notes
- Attempting to access another user's note returns 404 (not 403) to avoid information disclosure

### 6.2 Input Validation & Sanitization

**Query Parameter Validation:**

- `ids` (required): Comma-separated string of exactly 2 UUIDs
- Validate count of IDs after splitting by comma
- Validate each ID as valid UUID format using Zod schema
- Reject if < 2 or > 2 IDs provided

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- TypeScript type safety with Supabase client
- RLS policies prevent unauthorized access

### 6.3 Data Integrity

**Validation Rules:**

1. Exactly 2 IDs must be provided (no more, no less)
2. Each ID must be valid UUID format
3. Both notes must exist and belong to authenticated user
4. All validation failures return appropriate error messages

## 7. Error Handling

### 7.1 Error Categories & Handling Strategy

#### Authentication Errors (401)

**Scenarios:**

- Missing Authorization header
- Invalid or expired session token

**Handling:**

```typescript
if (!supabase || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized - Authentication required" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Validation Errors (400)

**Scenarios:**

- Missing `ids` query parameter
- Wrong number of IDs (not exactly 2)
- Invalid UUID format for one or more IDs

**Handling:**

```typescript
const url = new URL(request.url);
const idsParam = url.searchParams.get("ids");

if (!idsParam) {
  return new Response(
    JSON.stringify({
      error: "ids parameter is required",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

const ids = idsParam.split(",").map((id) => id.trim());

if (ids.length !== 2) {
  return new Response(
    JSON.stringify({
      error: "Exactly 2 tasting note IDs are required",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// Validate each UUID
const uuidValidationResults = ids.map((id) => uuidSchema.safeParse(id));
const hasInvalidUuid = uuidValidationResults.some((result) => !result.success);

if (hasInvalidUuid) {
  return new Response(
    JSON.stringify({
      error: "Invalid UUID format for one or more IDs",
    }),
    {
      status: 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

#### Not Found Errors (404)

**Scenarios:**

- One or both tasting note IDs do not exist
- One or both notes exist but don't belong to authenticated user

**Handling:**

```typescript
const notes = await selectTastingNotes(supabase, user.id, validatedIds);

if (!notes || notes.length !== 2) {
  return new Response(
    JSON.stringify({
      error: "One or more tasting notes not found",
    }),
    {
      status: 404,
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
  const notes = await selectTastingNotes(supabase, user.id, validatedIds);
  if (!notes || notes.length !== 2) {
    return new Response(JSON.stringify({ error: "One or more tasting notes not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ notes }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Failed to select tasting notes:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.2 Edge Cases

| Edge Case                                     | Behavior         | Response                          |
| --------------------------------------------- | ---------------- | --------------------------------- |
| Missing ids parameter                         | Validation fails | 400 ids parameter is required     |
| Only 1 ID provided                            | Validation fails | 400 Exactly 2 tasting note IDs    |
| More than 2 IDs provided                      | Validation fails | 400 Exactly 2 tasting note IDs    |
| Invalid UUID format                           | Validation fails | 400 Invalid UUID format for IDs   |
| One note doesn't exist                        | Query returns <2 | 404 One or more tasting notes not |
| Both notes don't exist                        | Query returns 0  | 404 One or more tasting notes not |
| One note belongs to different user            | Query returns <2 | 404 One or more tasting notes not |
| Same ID provided twice                        | Query returns 1  | 404 One or more tasting notes not |
| IDs with extra whitespace (handled by trim()) | Trimmed & parsed | 200 OK with both notes            |
| Empty string in ids parameter                 | Validation fails | 400 Exactly 2 tasting note IDs    |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key index on `tasting_notes.id` (automatic)
- Index on `tasting_notes.user_id` (for RLS and filtering)
- Foreign key indexes on `blend_id`, `brand_id`, `region_id` (automatic)

**Query Optimization:**

- Single query with joins to fetch all related data
- IN clause with exactly 2 IDs (very efficient)
- ORDER BY CASE to preserve requested order
- No additional lookups needed

### 8.2 Response Size

**Typical Response:**

- 2 tasting notes with nested data
- Estimated size: ~2-3KB per response
- Minimal data transfer for comparison feature

## 9. Implementation Steps

### Step 1: Create Validator Schema

**File:** `src/lib/validators/select-notes.validator.ts` (NEW)

**Tasks:**

1. Create Zod schema for validating query parameters
2. Export schema for reuse

**Key Implementation:**

```typescript
import { z } from "zod";
import { uuidSchema } from "./uuid.validator";

export const selectNotesQuerySchema = z.object({
  ids: z
    .string()
    .min(1, "ids parameter is required")
    .refine(
      (value) => {
        const ids = value.split(",").map((id) => id.trim());
        return ids.length === 2;
      },
      {
        message: "Exactly 2 tasting note IDs are required",
      }
    )
    .refine(
      (value) => {
        const ids = value.split(",").map((id) => id.trim());
        return ids.every((id) => uuidSchema.safeParse(id).success);
      },
      {
        message: "Invalid UUID format for one or more IDs",
      }
    )
    .transform((value) => value.split(",").map((id) => id.trim())),
});

export type SelectNotesQuery = z.infer<typeof selectNotesQuerySchema>;
```

### Step 2: Add Service Layer Function

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Create new `selectTastingNotes(supabase, userId, ids)` function
2. Query with IN clause and user_id filter
3. Include nested blend, brand, and region data using query aliases
4. Order results to match requested ID order
5. Return array of notes or null if not all found

**Key Implementation:**

```typescript
export async function selectTastingNotes(
  supabase: SupabaseClient,
  userId: string,
  ids: string[]
): Promise<TastingNoteDTO[] | null> {
  const { data, error } = await supabase
    .from("tasting_notes")
    .select(
      `
      *,
      blend:blends (
        id,
        name,
        brand:brands (
          id,
          name
        ),
        region:regions (
          id,
          name
        )
      )
    `
    )
    .in("id", ids)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to select tasting notes: ${error.message}`);
  }

  // Check if we got exactly 2 notes
  if (!data || data.length !== 2) {
    return null;
  }

  // Sort results to match requested order
  const sortedData = ids.map((id) => data.find((note) => note.id === id)).filter((note) => note !== undefined);

  if (sortedData.length !== 2) {
    return null;
  }

  return sortedData as TastingNoteDTO[];
}
```

### Step 3: Create API Route

**File:** `src/pages/api/tasting-notes/select.ts` (NEW)

**Tasks:**

1. Create new GET handler
2. Extract and validate `ids` query parameter
3. Validate exactly 2 IDs provided
4. Validate UUID format for both IDs
5. Call service layer function
6. Handle 404 if one or both notes not found
7. Return 200 OK with both notes on success
8. Handle all error cases with appropriate status codes

**Key Implementation:**

```typescript
import type { APIRoute } from "astro";
import { selectTastingNotes } from "@/lib/services/tasting-notes.service";
import { uuidSchema } from "@/lib/validators/uuid.validator";

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase, user } = locals;

    if (!supabase || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized - Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract and validate query parameters
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return new Response(JSON.stringify({ error: "ids parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse comma-separated IDs
    const ids = idsParam.split(",").map((id) => id.trim());

    if (ids.length !== 2) {
      return new Response(JSON.stringify({ error: "Exactly 2 tasting note IDs are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate each UUID
    const uuidValidationResults = ids.map((id) => uuidSchema.safeParse(id));
    const hasInvalidUuid = uuidValidationResults.some((result) => !result.success);

    if (hasInvalidUuid) {
      return new Response(JSON.stringify({ error: "Invalid UUID format for one or more IDs" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Extract validated IDs
    const validatedIds = uuidValidationResults.map((result) => result.data as string);

    // Fetch tasting notes
    const notes = await selectTastingNotes(supabase, user.id, validatedIds);

    if (!notes || notes.length !== 2) {
      return new Response(JSON.stringify({ error: "One or more tasting notes not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        notes,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 4: Create HTTP Test File

**File:** `api-tests-scripts/test-select-tasting-notes.http` (NEW)

**Test Cases:**

1. Select 2 existing notes → 200 OK with both notes
2. Select with only 1 ID → 400 Bad Request
3. Select with 3 IDs → 400 Bad Request
4. Select with missing ids parameter → 400 Bad Request
5. Select with invalid UUID format → 400 Bad Request
6. Select with one non-existent ID → 404 Not Found
7. Select with both non-existent IDs → 404 Not Found
8. Select with one note from different user → 404 Not Found
9. Select without authentication → 401 Unauthorized
10. Select with invalid token → 401 Unauthorized
11. Select with same ID twice → 404 Not Found (only returns 1)
12. Select with IDs in different order → 200 OK (maintains order)

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 200 OK with exactly 2 notes when valid IDs provided
2. ✅ Endpoint returns 404 Not Found if one or both notes don't exist
3. ✅ Endpoint returns 404 Not Found if one or both notes belong to different user
4. ✅ Endpoint returns 400 Bad Request if not exactly 2 IDs provided
5. ✅ Endpoint returns 400 Bad Request if invalid UUID format
6. ✅ Endpoint returns 400 Bad Request if ids parameter missing
7. ✅ Endpoint returns 401 Unauthorized without valid authentication
8. ✅ Notes are returned with full nested data (blend, brand, region)
9. ✅ Notes are returned in the order requested
10. ✅ Code passes linting and type checking
11. ✅ User can only access their own notes (enforced by RLS and service layer)
12. ✅ Duplicate IDs are handled correctly (returns 404 since only 1 note found)
