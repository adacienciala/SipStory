# API Endpoint Implementation Plan: Update Tasting Note

## 1. Endpoint Overview

This endpoint partially updates an existing tasting note owned by the authenticated user. Brand, blend, and region cannot be changed via this endpoint.

**Purpose:** Enable users to modify their tasting notes after creation to support iterative note-taking and corrections.

**Key Features:**

- Updates only provided fields (partial update via PATCH)
- \*\*Cannot modify blend, brand, or region associations
- \*\*Rejects requests attempting to modify immutable fields (blend_id, user_id, etc.)
- Validates ownership (user can only update their own notes)
- Returns fully nested data structure after update
- Automatically updates `updated_at` timestamp via database trigger

## 2. Request Details

### HTTP Method

`PATCH`

### URL Structure

`/api/tasting-notes/:id`

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ---------------------------------- |
| `id` | uuid | Yes | UUID of the tasting note to update |

### Authentication

**Required:** Bearer token via Supabase Auth session (mock user for now)

### Request Body

**Content-Type:** `application/json`

**Note:** All fields are optional. At least one field must be provided.

#### Optional Fields

| Field             | Type           | Constraints               | Description                   |
| ----------------- | -------------- | ------------------------- | ----------------------------- |
| `overall_rating`  | integer        | 1-5 inclusive             | Overall rating                |
| `umami`           | integer / null | 1-5 inclusive if provided | Umami rating                  |
| `bitter`          | integer / null | 1-5 inclusive if provided | Bitterness rating             |
| `sweet`           | integer / null | 1-5 inclusive if provided | Sweetness rating              |
| `foam`            | integer / null | 1-5 inclusive if provided | Foam quality rating           |
| `notes_koicha`    | string / null  | max 5000 chars            | Tasting notes for koicha prep |
| `notes_milk`      | string / null  | max 5000 chars            | Tasting notes with milk       |
| `price_pln`       | integer / null | >= 0                      | Price paid per 100g in PLN    |
| `purchase_source` | string / null  | max 500 chars             | Purchase location or URL      |

### Example Request

```json
{
  "overall_rating": 4,
  "umami": 4,
  "notes_koicha": "Updated notes: slightly less umami than initially thought"
}
```

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Request Validation:**

- `UpdateTastingNoteDTO` - Validates request body (new type to create)

**Response Types:**

- `TastingNoteResponseDTO` - Individual tasting note with nested blend/brand/region
- `NestedBlendDTO` - Blend with brand and region
- `NestedBrandDTO` - Brand identification (id + name)
- `NestedRegionDTO` - Region identification (id + name)

**Error Response:**

- `ErrorResponseDTO` - Standard error structure
- `ValidationErrorDTO` - Field-level validation errors

**Database Update Types:**

- `TastingNoteUpdate` - Update type for tasting_notes table

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

#### 404 Not Found

**Condition:** Tasting note does not exist or doesn't belong to the authenticated user

```json
{
  "error": "Tasting note not found"
}
```

#### 400 Bad Request

**Condition:** Invalid request body (validation errors)

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "overall_rating",
      "message": "Overall rating must be between 1 and 5"
    }
  ]
}
```

**Possible validation error messages:**

- `"At least one field must be provided for update"`
- `"Invalid UUID format"`
- `"Unrecognized key(s) in object: 'blend_id'"` (for immutable fields)
- `"Unrecognized key(s) in object: 'user_id'"` (for immutable fields)
- `"overall_rating must be between 1 and 5"`
- `"umami must be between 1 and 5 or null"`
- `"price_pln must be a non-negative number"`
- `"notes_koicha must be at most 5000 characters"`

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
   - Extract ID from path parameters
   - Validate ID is valid UUID
   - Extract and parse request body
   - Validate with Zod schema
   - Check at least one field provided
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Verify note exists and belongs to user
   - Update only provided fields
   - Fetch updated note with joins
   - Transform to DTO
   ↓
5. Response Formatting
   - Return updated tasting note
   - Return JSON with 200 status
```

### 5.2 Database Operations Sequence

**Step 1: Update Tasting Note**

```sql
UPDATE tasting_notes
SET
  overall_rating = COALESCE($2, overall_rating),
  umami = COALESCE($3, umami),
  bitter = COALESCE($4, bitter),
  sweet = COALESCE($5, sweet),
  foam = COALESCE($6, foam),
  notes_koicha = COALESCE($7, notes_koicha),
  notes_milk = COALESCE($8, notes_milk),
  price_pln = COALESCE($9, price_pln),
  purchase_source = COALESCE($10, purchase_source)
WHERE id = $1 AND user_id = $11
RETURNING *;
```

**Note:** RLS policies automatically enforce user ownership, so query will return empty result if note doesn't belong to user.

**Step 2: Fetch Updated Note with Relations**

```sql
SELECT
  tn.*,
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
WHERE tn.id = $1 AND tn.user_id = $2
LIMIT 1;
```

### 5.3 Data Transformation

Database result is transformed into nested DTO structure (same as get endpoint).

## 6. Security Considerations

### 6.1 Authentication & Authorization

**Mechanism:** Supabase Auth session validation (mock user for now)

- Middleware checks for valid session token (skipped for mock)
- Extracts `user_id` from authenticated session (mock user ID for now)
- Rejects requests without valid authentication (401 Unauthorized)

**User Isolation:**

- Update query includes `user_id` filter
- Row Level Security (RLS) policies enforced at database level
- User can only update their own tasting notes

### 6.2 Input Validation & Sanitization

**Protection Against Injection:**

- All inputs validated with Zod schemas before database queries
- String inputs trimmed to remove leading/trailing whitespace
- Numeric inputs validated for type and range
- Text length limits enforced
- Path parameter UUID validated

**Parameter Validation:**

- `id` (path): Required, valid UUID format
- `overall_rating`: 1-5 range if provided
- Optional rating fields: 1-5 range or null if provided
- `notes_koicha`, `notes_milk`: Max 5000 chars if provided
- `price_pln`: Non-negative integer if provided
- `purchase_source`: Max 500 chars if provided

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- TypeScript type safety with Supabase client
- RLS policies prevent unauthorized access

### 6.3 Data Integrity

**Immutable Fields:**

- `blend_id` cannot be changed (not included in update schema)
- `user_id` cannot be changed (not included in update schema)
- `created_at` cannot be changed (database constraint)

**Automatic Updates:**

- `updated_at` automatically updated via database trigger

## 7. Error Handling

### 7.1 Error Categories & Handling Strategy

#### Authentication Errors (401)

**Scenarios:**

- Missing Authorization header
- Invalid or expired session token

**Handling:**

```typescript
if (!supabase || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Validation Errors (400)

**Scenarios:**

- No fields provided for update
- Invalid field types
- Out-of-range values
- String length violations
- Invalid UUID format for path parameter

**Handling:**

```typescript
const validationResult = updateTastingNoteSchema.safeParse(requestBody);
if (!validationResult.success) {
  const details = formatZodErrors(validationResult.error);
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details,
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
const note = await updateTastingNote(supabase, userId, id, validatedData);
if (!note) {
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
  const note = await updateTastingNote(supabase, user.id, id, validatedData);
  return new Response(JSON.stringify(note), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Failed to update tasting note:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.2 Edge Cases

| Edge Case                                         | Behavior         | Response                                      |
| ------------------------------------------------- | ---------------- | --------------------------------------------- |
| Tasting note doesn't exist                        | Return 404 error | 404 Tasting note not found                    |
| Tasting note exists but belongs to different user | Return 404 error | 404 Tasting note not found                    |
| Invalid UUID format in path                       | Validation fails | 400 with validation error                     |
| Empty request body (no fields)                    | Validation fails | 400 At least one field required               |
| Null value for nullable field                     | Update to null   | 200 with null value in response               |
| Empty string for optional text fields             | Store as empty   | 200 with empty string in response             |
| Only providing unchanged values                   | Update executes  | 200 with same values                          |
| Attempting to update blend_id                     | Validation fails | 400 Unrecognized key(s) in object: 'blend_id' |
| Attempting to update user_id                      | Validation fails | 400 Unrecognized key(s) in object: 'user_id'  |
| Attempting to update created_at                   | Validation fails | 400 Unrecognized key(s) in object             |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key index on `tasting_notes.id` (automatic)
- Index on `tasting_notes.user_id` (for RLS and filtering)
- Foreign key indexes (automatic)

**Query Optimization:**

- Single query to update with user_id filter
- Single query to fetch updated note with all relations
- Use of COALESCE to update only provided fields

### 8.2 Partial Updates

**Efficiency:**

- Only fields present in request body are updated
- Database trigger automatically updates `updated_at`
- No unnecessary writes to unchanged fields (using COALESCE pattern)

## 9. Implementation Steps

### Step 1: Create Validation Schema

**File:** `src/lib/validators/update-tasting-note.validator.ts` (NEW)

**Tasks:**

1. Create new Zod schema for `UpdateTastingNoteDTO`
2. All fields optional
3. Same constraints as create schema for each field
4. Add refinement to require at least one field

**Key Validations:**

```typescript
import { z } from "zod";

export const updateTastingNoteSchema = z
  .object({
    // Optional rating fields
    overall_rating: z.number().int().min(1).max(5).optional(),
    umami: z.number().int().min(1).max(5).nullable().optional(),
    bitter: z.number().int().min(1).max(5).nullable().optional(),
    sweet: z.number().int().min(1).max(5).nullable().optional(),
    foam: z.number().int().min(1).max(5).nullable().optional(),

    // Optional text fields
    notes_koicha: z.string().max(5000).nullable().optional(),
    notes_milk: z.string().max(5000).nullable().optional(),

    // Optional metadata
    price_pln: z.number().int().nonnegative().nullable().optional(),
    purchase_source: z.string().max(500).nullable().optional(),
  })
  .strict() // Reject any fields not explicitly defined (e.g., blend_id, user_id)
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

### Step 2: Add Service Layer Function

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Create new `updateTastingNote(supabase, userId, id, data)` function
2. Build update object with only provided fields
3. Update note with user_id filter for security
4. Return null if note not found or doesn't belong to user
5. Fetch and return complete note with nested relations

**Key Implementation:**

```typescript
export async function updateTastingNote(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  data: UpdateTastingNoteDTO
): Promise<TastingNoteResponseDTO | null> {
  // 1. Build update object with only provided fields
  const updateData: Partial<TastingNoteUpdate> = {};

  if (data.overall_rating !== undefined) updateData.overall_rating = data.overall_rating;
  if (data.umami !== undefined) updateData.umami = data.umami;
  if (data.bitter !== undefined) updateData.bitter = data.bitter;
  if (data.sweet !== undefined) updateData.sweet = data.sweet;
  if (data.foam !== undefined) updateData.foam = data.foam;
  if (data.notes_koicha !== undefined) updateData.notes_koicha = data.notes_koicha;
  if (data.notes_milk !== undefined) updateData.notes_milk = data.notes_milk;
  if (data.price_pln !== undefined) updateData.price_pln = data.price_pln;
  if (data.purchase_source !== undefined) updateData.purchase_source = data.purchase_source;

  // 2. Update tasting note (RLS ensures user ownership)
  const { data: updatedNote, error } = await supabase
    .from("tasting_notes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!updatedNote) return null; // Note not found or doesn't belong to user

  // 3. Fetch with relations
  return await getTastingNoteById(supabase, userId, id);
}
```

### Step 3: Update API Route Handler

**File:** `src/pages/api/tasting-notes/[id].ts`

**Tasks:**

1. Add `PATCH` handler function
2. Extract and validate ID from path parameters
3. Validate request body with Zod schema
4. Call service layer function
5. Handle 404 if note not found
6. Return formatted JSON response
7. Handle all error cases with appropriate status codes

### Step 4: Update Type Definitions

**File:** `src/types.ts`

**Tasks:**

1. Add `UpdateTastingNoteDTO` interface
2. Export type from validator

### Step 5: Create HTTP Test File

**File:** `api-tests-scripts/test-update-tasting-note.http` (NEW)

**Test Cases:**

1. Update all fields → 200 OK
2. Update single field (overall_rating) → 200 OK
3. Update with null values → 200 OK
4. Empty request body → 400 Bad Request
5. Invalid UUID in path → 400 Bad Request
6. Non-existent note ID → 404 Not Found
7. Note belonging to different user → 404 Not Found
8. Invalid rating value → 400 Bad Request
9. String too long → 400 Bad Request
10. Invalid field type → 400 Bad Request
11. Attempt to update blend_id → 400 Bad Request (unrecognized key)
12. Attempt to update user_id → 400 Bad Request (unrecognized key)
13. Attempt to update created_at → 400 Bad Request (unrecognized key)

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 200 OK with correct data for valid partial update
2. ✅ Endpoint returns 404 Not Found for non-existent note ID
3. ✅ Endpoint returns 404 Not Found for note belonging to different user
4. ✅ Endpoint returns 400 Bad Request for validation errors
5. ✅ Endpoint returns 400 Bad Request for empty request body
6. ✅ Endpoint returns 401 Unauthorized without valid authentication (when implemented)
7. ✅ Response structure matches specification exactly
8. ✅ Nested blend/brand/region structure is correct
9. ✅ Error messages are clear and helpful with field-level details
10. ✅ Code passes linting and type checking
11. ✅ Only provided fields are updated (partial update works correctly)
12. ✅ Immutable fields (blend_id, user_id, created_at) are rejected with 400 error
13. ✅ `updated_at` timestamp is automatically updated
14. ✅ Null values can be set for nullable fields
