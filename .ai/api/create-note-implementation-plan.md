# API Endpoint Implementation Plan: Create Tasting Note

## 1. Endpoint Overview

This endpoint creates a new tasting note for the authenticated user using an existing blend ID. Users must create blends using the `POST /api/blends` endpoint before creating tasting notes.

**Purpose:** Enable users to create new tasting notes linked to existing blends to support the core MVP requirement of logging tasting entries.

**Key Features:**

- Creates tasting note with reference to existing blend ID
- Validates blend exists in database
- Returns fully nested data structure (blend → brand + region)
- Validates all input fields
- Separate blend creation flow: Use `POST /api/blends` endpoint which handles brand/region creation automatically

## 2. Request Details

### HTTP Method

`POST`

### URL Structure

`/api/tasting-notes`

### Authentication

**Required:** Bearer token via Supabase Auth session (mock user for now)

### Request Body

**Content-Type:** `application/json`

#### Required Fields

| Field            | Type    | Constraints   | Description            |
| ---------------- | ------- | ------------- | ---------------------- |
| `blend_id`       | string  | valid UUID    | UUID of existing blend |
| `overall_rating` | integer | 1-5 inclusive | Overall rating         |

#### Optional Fields

| Field             | Type           | Constraints               | Description                   |
| ----------------- | -------------- | ------------------------- | ----------------------------- |
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
  "blend_id": "123e4567-e89b-12d3-a456-426614174000",
  "overall_rating": 5,
  "umami": 5,
  "bitter": 2,
  "sweet": 4,
  "foam": 5,
  "notes_koicha": "Rich umami, creamy texture, minimal bitterness",
  "notes_milk": "Smooth and balanced, complements milk well",
  "price_pln": 150,
  "purchase_source": "https://ippodo-tea.co.jp"
}
```

## 3. Used Types

### DTO Types (from `src/types.ts`)

**Request Validation:**

- `CreateTastingNoteDTO` - Validates request body

**Response Types:**

- `TastingNoteResponseDTO` - Individual tasting note with nested blend/brand/region
- `NestedBlendDTO` - Blend with brand and region
- `NestedBrandDTO` - Brand identification (id + name)
- `NestedRegionDTO` - Region identification (id + name)

**Error Response:**

- `ErrorResponseDTO` - Standard error structure
- `ValidationErrorDTO` - Field-level validation errors

**Database Insert Types:**

- `RegionInsert` - Insert type for regions table
- `BrandInsert` - Insert type for brands table
- `BlendInsert` - Insert type for blends table
- `TastingNoteInsert` - Insert type for tasting_notes table

### Database Entity Types

From `src/db/database.types.ts`:

- `Tables<'tasting_notes'>` - Base tasting note entity
- `Tables<'blends'>` - Blend entity with brand_id and region_id
- `Tables<'brands'>` - Brand entity
- `Tables<'regions'>` - Region entity

## 4. Response Details

### Success Response (201 Created)

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

**Condition:** Blend ID does not exist in database

```json
{
  "error": "Blend not found"
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

- `"blend_id is required"`
- `"blend_id must be a valid UUID"`
- `"overall_rating is required"`
- `"overall_rating must be between 1 and 5"`
- `"umami must be between 1 and 5"`
- `"price_pln must be a positive number"`
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
3. API Route Handler (src/pages/api/tasting-notes/index.ts)
   - Extract and parse request body
   - Validate with Zod schema (including blend_id UUID)
   ↓
4. Service Layer (src/lib/services/tasting-notes.service.ts)
   - Verify blend exists
   - Create tasting note with provided blend_id
   - Fetch created note with joins
   - Transform to DTO
   ↓
5. Response Formatting
   - Return created tasting note
   - Return JSON with 201 status
```

### 5.2 Database Operations Sequence

**Step 1: Verify Blend Exists**

```sql
-- Check if blend exists
SELECT id FROM blends WHERE id = $1 LIMIT 1;
```

**Step 2: Tasting Note Creation**

```sql
INSERT INTO tasting_notes (
  user_id, blend_id, overall_rating,
  umami, bitter, sweet, foam,
  notes_koicha, notes_milk,
  price_pln, purchase_source
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
RETURNING *;
```

**Step 3: Fetch Created Note with Relations**

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

- Tasting note automatically assigned to authenticated user
- Row Level Security (RLS) policies enforced at database level

### 6.2 Input Validation & Sanitization

**Protection Against Injection:**

- All inputs validated with Zod schemas before database queries
- String inputs trimmed to remove leading/trailing whitespace
- Numeric inputs validated for type and range
- Text length limits enforced

**Parameter Validation:**

- `blend_id`: Required, valid UUID format
- `overall_rating`: Required, 1-5 range
- Optional rating fields: 1-5 range or null
- `notes_koicha`, `notes_milk`: Max 5000 chars
- `price_pln`: Non-negative integer
- `purchase_source`: Max 500 chars

**Supabase Query Protection:**

- Use parameterized queries (Supabase automatically handles this)
- Leverage `ON CONFLICT` for atomic upsert operations
- TypeScript type safety with Supabase client

### 6.3 Race Conditions

**Blend Validation:**

- Blend must exist before creating tasting note
- Foreign key constraint ensures referential integrity
- Concurrent requests with same blend_id are safe

### 6.4 Data Integrity

**Foreign Key Constraints:**

- `blend_id` must reference existing blend
- `brand_id` must reference existing brand
- `region_id` must reference existing region
- Database enforces referential integrity

## 7. Error Handling

### 7.1 Error Categories & Handling Strategy

#### Authentication Errors (401)

**Scenarios:**

- Missing Authorization header
- Invalid or expired session token

**Handling:**

```typescript
if (!supabase || !session) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
```

#### Validation Errors (400)

**Scenarios:**

- Missing required fields
- Invalid field types
- Out-of-range values
- String length violations
- Invalid UUID format

**Handling:**

```typescript
const validationResult = createTastingNoteSchema.safeParse(requestBody);
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

- Blend ID does not exist in database

**Handling:**

```typescript
const note = await createTastingNote(supabase, userId, validatedData);
if (!note) {
  return new Response(
    JSON.stringify({
      error: "Blend not found",
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
- Transaction rollback
- Network errors

**Handling:**

```typescript
try {
  const note = await createTastingNote(supabase, mockUserId, validatedData);
  return new Response(JSON.stringify(note), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
} catch (error) {
  console.error("Failed to create tasting note:", error);
  return new Response(JSON.stringify({ error: "Internal server error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### 7.2 Edge Cases

| Edge Case                             | Behavior         | Response                         |
| ------------------------------------- | ---------------- | -------------------------------- |
| Blend ID does not exist               | Return 404 error | 404 Blend not found              |
| Invalid UUID format                   | Validation fails | 400 with validation error        |
| Missing optional fields               | Store as null    | 201 with null values in response |
| Empty string for optional text fields | Convert to null  | 201 with null values in response |

## 8. Performance Considerations

### 8.1 Database Optimization

**Indexes Used:**

- Primary key indexes on all tables (automatic)
- Unique index on `regions.name` (CITEXT)
- Unique index on `brands.name` (CITEXT)
- Unique index on `blends(brand_id, name)` with case-insensitive name
- Foreign key indexes (automatic)

**Query Optimization:**

- Use `ON CONFLICT` for atomic upsert operations
- Single query to fetch created note with all relations
- Minimize round trips with batched operations where possible

### 8.2 Transaction Handling

**Atomicity:**

- All operations should be wrapped in a transaction
- If any step fails, rollback all changes
- Supabase RPC can be used for complex multi-step operations

**Current Implementation:**

- Using individual queries with ON CONFLICT
- Consider creating a PostgreSQL function for atomic operation

## 9. Implementation Steps

### Step 1: Update Validation Schema

**File:** `src/lib/validators/create-tasting-note.validator.ts`

**Tasks:**

1. Update Zod schema for `CreateTastingNoteDTO`
2. Replace entity name fields with blend_id
3. Add UUID validation for blend_id
4. Keep optional fields with proper constraints

**Key Validations:**

```typescript
import { z } from "zod";
import { uuidSchema } from "./uuid.validator";

export const createTastingNoteSchema = z.object({
  // Required fields
  blend_id: uuidSchema,
  overall_rating: z.number().int().min(1).max(5),

  // Optional rating fields
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
});
```

### Step 2: Update Service Layer Function

**File:** `src/lib/services/tasting-notes.service.ts`

**Tasks:**

1. Remove entity resolution functions (resolveOrCreateRegion, resolveOrCreateBrand, resolveOrCreateBlend)
2. Simplify `createTastingNote(supabase, userId, data)` function
3. Add blend existence validation
4. Return 404 if blend doesn't exist
5. Return complete tasting note with nested relations

**Key Implementation:**

```typescript
export async function createTastingNote(
  supabase: SupabaseClient,
  userId: string,
  data: CreateTastingNoteDTO
): Promise<TastingNoteResponseDTO | null> {
  // 1. Verify blend exists
  const { data: blendExists } = await supabase
    .from("blends")
    .select("id")
    .eq("id", data.blend_id)
    .limit(1)
    .maybeSingle();

  if (!blendExists) {
    return null; // Blend not found
  }

  // 2. Create tasting note
  const { data: tastingNote, error } = await supabase
    .from("tasting_notes")
    .insert({
      user_id: userId,
      blend_id: data.blend_id,
      overall_rating: data.overall_rating,
      umami: data.umami ?? null,
      bitter: data.bitter ?? null,
      sweet: data.sweet ?? null,
      foam: data.foam ?? null,
      notes_koicha: data.notes_koicha ?? null,
      notes_milk: data.notes_milk ?? null,
      price_pln: data.price_pln ?? null,
      purchase_source: data.purchase_source ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  // 3. Fetch with relations
  return await getTastingNoteById(supabase, userId, tastingNote.id);
}
```

### Step 3: Update API Route Handler

**File:** `src/pages/api/tasting-notes/index.ts`

**Tasks:**

1. Update `POST` handler function
2. Validate request body with updated Zod schema
3. Call service layer function
4. Handle 404 if blend not found
5. Return formatted JSON response
6. Handle all error cases with appropriate status codes

### Step 4: Update Testing

**Update HTTP test file with cases for:**

1. Valid request with all fields → 201 Created
2. Valid request with only required fields → 201 Created
3. Missing required field (blend_id) → 400 Bad Request
4. Invalid blend_id (non-existent UUID) → 404 Not Found
5. Invalid blend_id (malformed UUID) → 400 Bad Request
6. Invalid rating value → 400 Bad Request
7. Invalid field type → 400 Bad Request

## 10. Acceptance Criteria

The implementation is considered complete when:

1. ✅ Endpoint returns 201 Created with correct data for valid request with existing blend_id
2. ✅ Endpoint returns 404 Not Found for non-existent blend_id
3. ✅ Endpoint returns 400 Bad Request for validation errors (including invalid UUID format)
4. ✅ Endpoint returns 401 Unauthorized without valid authentication (when implemented)
5. ✅ Response structure matches specification exactly
6. ✅ Nested blend/brand/region structure is correct
7. ✅ Error messages are clear and helpful with field-level details
8. ✅ Code passes linting and type checking
9. ✅ Optional fields handled correctly (null values)
10. ✅ Foreign key constraint enforced (blend_id must exist)
