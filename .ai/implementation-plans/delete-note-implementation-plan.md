# API Endpoint Implementation Plan: Delete Tasting Note

## 1. Endpoint Overview

This endpoint permanently deletes a tasting note owned by the authenticated user.

**Purpose:** Enable users to remove tasting notes they no longer want to keep, supporting data management and privacy.

**Key Features:**

- Permanently deletes tasting note from database
- Validates ownership (user can only delete their own notes)
- Returns no content on successful deletion (204 No Content)
- Idempotent operation (deleting already-deleted note returns 404)

## 2. Request Details

### HTTP Method

`DELETE`

### URL Structure

`/api/tasting-notes/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ---------------------------------- |
| `id` | uuid | Yes | UUID of the tasting note to delete |

### Authentication

**Required:** Bearer token via Supabase Auth session

### Request Body

**None** - DELETE requests do not have a request body

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Response Types:**

- `ErrorResponseDTO` - Standard error structure

**No response body for success case (204 No Content)**

### Database Entity Types

From `src/db/database.types.ts`:

- `Tables<'tasting_notes'>` - Base tasting note entity

## 4. Response Details

### Success Response (204 No Content)

**No body returned**

The successful deletion is indicated by the 204 status code alone.

### Error Responses

#### 401 Unauthorized

**Condition:** Missing or invalid authentication token

```json
{
  "error": "Unauthorized - Authentication required"
}
```

#### 404 Not Found

**Condition:** Tasting note does not exist or doesn't belong to the authenticated user

```json
{
  "error": "Tasting note not found"
}
```

**Possible validation error messages:**

- `"Tasting note ID is required"`
- `"Invalid tasting note ID format"`

#### 400 Bad Request

**Condition:** Invalid UUID format in path parameter

```json
{
  "error": "Invalid tasting note ID format"
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
3. API Route Handler (src/pages/api/tasting-notes/[id].ts)
   - Extract and validate ID from path parameters
   - Validate UUID format
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Delete tasting note with user_id filter
   - Return true if deleted, false if not found
   ↓
5. Response Formatting
   - Return 204 No Content if successful
   - Return 404 Not Found if note doesn't exist
```

### 5.2 Database Operations Sequence

**Single Delete Operation:**

```sql
DELETE FROM tasting_notes
WHERE id = $1 AND user_id = $2
RETURNING id;
```

**Note:** RLS policies automatically enforce user ownership, so query will return empty result if note doesn't belong to user.

### 5.3 Data Transformation

No data transformation needed - success is indicated by presence or absence of deleted row.

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** Supabase Auth session validation

- Middleware checks for valid session token
- Extracts `user_id` from authenticated session
- Rejects requests without valid authentication (401 Unauthorized)

**User Isolation:**

- Delete query includes `user_id` filter
- Row Level Security (RLS) policies enforced at database level
- User can only delete their own tasting notes
- Attempting to delete another user's note returns 404 (not 403) to avoid information disclosure

### 6.2 Input Validation & Sanitization

**Parameter Validation:**

- `id` (path): Required, valid UUID format
- No request body to validate

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- TypeScript type safety with Supabase client
- RLS policies prevent unauthorized deletion

### 6.3 Data Integrity

**Cascading Deletes:**

- No cascading deletes needed (tasting notes don't have dependent records)
- Blend/brand/region entities remain (orphaned entities acceptable for MVP)

**Permanent Deletion:**

- No soft delete mechanism in MVP
- Deletion is immediate and irreversible
- Consider adding soft delete in future versions

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

- Missing ID in path
- Invalid UUID format

**Handling:**

```typescript
const idValidationResult = uuidSchema.safeParse(id);
if (!idValidationResult.success) {
  return new Response(
    JSON.stringify({
      error: "Invalid tasting note ID format",
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

- Tasting note ID does not exist
- Tasting note exists but doesn't belong to authenticated user

**Handling:**

```typescript
const deleted = await deleteTastingNote(supabase, user.id, validatedId);
if (!deleted) {
  return new Response(
    JSON.stringify({
      error: "Tasting note not found",
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
- Constraint violations (unexpected)
- Network errors

**Handling:**

```typescript
try {
  const deleted = await deleteTastingNote(supabase, user.id, validatedId);
  if (!deleted) {
    return new Response(JSON.stringify({ error: "Tasting note not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(null, { status: 204 });
} catch (error) {
  console.error("Failed to delete tasting note:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.2 Edge Cases

| Edge Case                                         | Behavior         | Response                        |
| ------------------------------------------------- | ---------------- | ------------------------------- |
| Tasting note doesn't exist                        | Return 404 error | 404 Tasting note not found      |
| Tasting note exists but belongs to different user | Return 404 error | 404 Tasting note not found      |
| Invalid UUID format in path                       | Validation fails | 400 Invalid tasting note ID     |
| Deleting already-deleted note (idempotent)        | Return 404 error | 404 Tasting note not found      |
| Missing ID in path                                | Validation fails | 400 Tasting note ID is required |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key index on `tasting_notes.id` (automatic)
- Index on `tasting_notes.user_id` (for RLS and filtering)

**Query Optimization:**

- Single DELETE query with combined id + user_id filter
- No joins or complex queries needed
- Fast operation due to indexed columns

### 8.2 Idempotency

**Behavior:**

- Deleting an already-deleted note returns 404 (same as non-existent)
- Safe to retry delete operations
- No side effects from multiple delete attempts

## 9. Implementation Steps

### Step 1: Add Service Layer Function

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Create new `deleteTastingNote(supabase, userId, id)` function
2. Execute DELETE with user_id filter for security
3. Return boolean indicating success
4. Return false if note not found or doesn't belong to user

**Key Implementation:**

```typescript
export async function deleteTastingNote(supabase: SupabaseClient, userId: string, id: string): Promise<boolean> {
  // Delete tasting note (RLS ensures user ownership)
  const { data, error } = await supabase
    .from("tasting_notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to delete tasting note: ${error.message}`);
  }

  // Return true if a row was deleted, false if not found
  return data !== null;
}
```

### Step 2: Add DELETE Handler to API Route

**File:** `src/pages/api/tasting-notes/[id].ts`

**Tasks:**

1. Add `DELETE` handler function alongside GET and PATCH
2. Extract and validate ID from path parameters
3. Call service layer function
4. Handle 404 if note not found
5. Return 204 No Content on success
6. Handle all error cases with appropriate status codes

**Key Implementation:**

```typescript
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { supabase, user } = locals;

    if (!supabase || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized - Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "Tasting note ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const idValidationResult = uuidSchema.safeParse(id);
    if (!idValidationResult.success) {
      return new Response(JSON.stringify({ error: "Invalid tasting note ID format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deleted = await deleteTastingNote(supabase, user.id, idValidationResult.data);
    if (!deleted) {
      return new Response(JSON.stringify({ error: "Tasting note not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 3: Create HTTP Test File

**File:** `api-tests-scripts/test-delete-tasting-note.http` (NEW)

**Test Cases:**

1. Delete existing note → 204 No Content
2. Delete already-deleted note (idempotent) → 404 Not Found
3. Delete with invalid UUID → 400 Bad Request
4. Delete non-existent note ID → 404 Not Found
5. Delete note belonging to different user → 404 Not Found
6. Delete without authentication → 401 Unauthorized
7. Delete with invalid token → 401 Unauthorized

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 204 No Content for successful deletion
2. ✅ Endpoint returns 404 Not Found for non-existent note ID
3. ✅ Endpoint returns 404 Not Found for note belonging to different user
4. ✅ Endpoint returns 400 Bad Request for invalid UUID format
5. ✅ Endpoint returns 401 Unauthorized without valid authentication
6. ✅ No response body is returned for successful deletion (204)
7. ✅ Error messages are clear and helpful
8. ✅ Code passes linting and type checking
9. ✅ Deletion is idempotent (safe to retry)
10. ✅ User can only delete their own notes (enforced by RLS and service layer)
11. ✅ Deleted note is permanently removed from database
