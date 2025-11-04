# REST API Plan - SipStory MVP

## 1. Resources

The SipStory API is organized around the following main resources, each corresponding to database entities:

| Resource       | Database Table  | Description                                                |
| -------------- | --------------- | ---------------------------------------------------------- |
| Tasting Notes  | `tasting_notes` | User-created matcha tasting entries with ratings and notes |
| Blends         | `blends`        | Global matcha blend records linking brands and regions     |
| Brands         | `brands`        | Global matcha brand names                                  |
| Regions        | `regions`       | Global matcha region of origin names                       |
| Authentication | `auth.users`    | User authentication (managed by Supabase Auth)             |
| Autocomplete   | Multiple tables | Aggregated suggestions from user's historical data         |

---

## 2. Endpoints

### 2.1. Tasting Notes

#### 2.1.1. List Tasting Notes

**HTTP Method:** `GET`  
**URL Path:** `/api/tasting-notes`  
**Description:** Retrieve a paginated list of the authenticated user's tasting notes with optional filtering  
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Query Parameters:**
| Parameter | Type | Required | Description |
| -------------- | -------- | -------- | ---------------------------------------------------------------- |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `brand_ids` | string[] | No | Comma-separated brand UUIDs to filter by |
| `region_ids` | string[] | No | Comma-separated region UUIDs to filter by |
| `min_rating` | integer | No | Minimum overall rating (1-5) |
| `sort_by` | string | No | Sort field: `created_at`, `updated_at`, `overall_rating` (default: `created_at`) |
| `sort_order` | string | No | Sort direction: `asc`, `desc` (default: `desc`) |

**Success Response (200 OK):**

```json
{
  "data": [
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
      "umami": 1-5 or null,
      "bitter": 1-5 or null,
      "sweet": 1-5 or null,
      "foam": 1-5 or null,
      "notes_koicha": "string or null",
      "notes_milk": "string or null",
      "price_pln": "integer or null",
      "purchase_source": "string or null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **400 Bad Request:** Invalid query parameters
  ```json
  {
    "error": "Invalid query parameters: min_rating must be between 1 and 5"
  }
  ```

---

#### 2.1.2. Get Tasting Note by ID

**HTTP Method:** `GET`  
**URL Path:** `/api/tasting-notes/:id`  
**Description:** Retrieve a single tasting note by its UUID  
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ------------------------------------ |
| `id` | uuid | Yes | UUID of the tasting note to retrieve |

**Success Response (200 OK):**

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
  "umami": 1-5 or null,
  "bitter": 1-5 or null,
  "sweet": 1-5 or null,
  "foam": 1-5 or null,
  "notes_koicha": "string or null",
  "notes_milk": "string or null",
  "price_pln": "integer or null",
  "purchase_source": "string or null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **404 Not Found:** Tasting note does not exist or doesn't belong to user
  ```json
  {
    "error": "Tasting note not found"
  }
  ```

---

#### 2.1.3. Create Tasting Note

**HTTP Method:** `POST`  
**URL Path:** `/api/tasting-notes`  
**Description:** Create a new tasting note for the authenticated user  
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Request Body:**

```json
{
  "brand_name": "string (required, max 255 chars)",
  "blend_name": "string (required, max 255 chars)",
  "region_name": "string (required, max 255 chars)",
  "overall_rating": "integer (required, 1-5)",
  "umami": "integer (optional, 1-5 or null)",
  "bitter": "integer (optional, 1-5 or null)",
  "sweet": "integer (optional, 1-5 or null)",
  "foam": "integer (optional, 1-5 or null)",
  "notes_koicha": "string (optional, max 5000 chars)",
  "notes_milk": "string (optional, max 5000 chars)",
  "price_pln": "integer (optional, >= 0, full zloty)",
  "purchase_source": "string (optional, max 500 chars)"
}
```

**Business Logic:**

1. Validate all input fields against constraints
2. Look up or create `region` by name (case-insensitive)
3. Look up or create `brand` by name (case-insensitive)
4. Look up or create `blend` with unique constraint on (brand_id, name)
5. Create `tasting_note` linked to the blend and authenticated user

**Success Response (201 Created):**

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
  "umami": 1-5 or null,
  "bitter": 1-5 or null,
  "sweet": 1-5 or null,
  "foam": 1-5 or null,
  "notes_koicha": "string or null",
  "notes_milk": "string or null",
  "price_pln": "integer or null",
  "purchase_source": "string or null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **400 Bad Request:** Validation error
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

---

#### 2.1.4. Update Tasting Note

**HTTP Method:** `PATCH`  
**URL Path:** `/api/tasting-notes/:id`  
**Description:** Partially update an existing tasting note (owned by authenticated user). Brand, blend, and region cannot be changed.  
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ---------------------------------- |
| `id` | uuid | Yes | UUID of the tasting note to update |

**Request Body:**

```json
{
  "overall_rating": "integer (optional, 1-5)",
  "umami": "integer (optional, 1-5 or null)",
  "bitter": "integer (optional, 1-5 or null)",
  "sweet": "integer (optional, 1-5 or null)",
  "foam": "integer (optional, 1-5 or null)",
  "notes_koicha": "string (optional, max 5000 chars)",
  "notes_milk": "string (optional, max 5000 chars)",
  "price_pln": "integer (optional, >= 0, full zloty)",
  "purchase_source": "string (optional, max 500 chars)"
}
```

**Business Logic:**

1. Verify the tasting note exists and belongs to the authenticated user (RLS enforced)
2. Validate provided input fields (only fields present in request body are validated)
3. Update only the fields provided in the request body
4. Brand, blend, and region remain unchanged (cannot be modified via this endpoint)
5. `updated_at` is automatically updated via database trigger

**Success Response (200 OK):**

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
  "umami": 1-5 or null,
  "bitter": 1-5 or null,
  "sweet": 1-5 or null,
  "foam": 1-5 or null,
  "notes_koicha": "string or null",
  "notes_milk": "string or null",
  "price_pln": "integer or null",
  "purchase_source": "string or null",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **404 Not Found:** Tasting note does not exist or doesn't belong to user
  ```json
  {
    "error": "Tasting note not found"
  }
  ```
- **400 Bad Request:** Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      {
        "field": "umami",
        "message": "Umami rating must be between 1 and 5 or null"
      }
    ]
  }
  ```

---

#### 2.1.5. Delete Tasting Note

**HTTP Method:** `DELETE`  
**URL Path:** `/api/tasting-notes/:id`  
**Description:** Permanently delete a tasting note (owned by authenticated user)  
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ---------------------------------- |
| `id` | uuid | Yes | UUID of the tasting note to delete |

**Success Response (204 No Content):**
No body returned

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **404 Not Found:** Tasting note does not exist or doesn't belong to user
  ```json
  {
    "error": "Tasting note not found"
  }
  ```

---

#### 2.1.6. Select Tasting Notes

**HTTP Method:** `GET`  
**URL Path:** `/api/tasting-notes/select`  
**Description:** Retrieve two specific tasting notes
**Authentication:** Required (Bearer token)
**Status:** ✅ **Implemented**

**Query Parameters:**
| Parameter | Type | Required | Description |
| --------- | ------ | -------- | ----------------------------------- |
| `ids` | string | Yes | Comma-separated UUIDs (exactly 2) |

**Success Response (200 OK):**

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
      "overall_rating": 1-5,
      "umami": 1-5 or null,
      "bitter": 1-5 or null,
      "sweet": 1-5 or null,
      "foam": 1-5 or null,
      "notes_koicha": "string or null",
      "notes_milk": "string or null",
      "price_pln": "integer or null",
      "purchase_source": "string or null",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    },
    {
      "id": "uuid",
      "...": "second note object with same structure"
    }
  ]
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **400 Bad Request:** Invalid number of IDs
  ```json
  {
    "error": "Exactly 2 tasting note IDs are required"
  }
  ```
- **404 Not Found:** One or both notes don't exist
  ```json
  {
    "error": "One or more tasting notes not found"
  }
  ```

---

### 2.2. Brands

#### 2.2.1. List Brands

**HTTP Method:** `GET`  
**URL Path:** `/api/brands`  
**Description:** Retrieve a list of all brands (global, public access)  
**Authentication:** Not Required (public read access)
**Status:** ✅ **Implemented**

**Query Parameters:**
| Parameter | Type | Required | Description |
| --------- | ------- | -------- | ------------------------------------------------ |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `search` | string | No | Case-insensitive substring match on brand name |

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid query parameters
  ```json
  {
    "error": "Invalid query parameters"
  }
  ```

---

#### 2.2.2. Get Brand by ID

**HTTP Method:** `GET`  
**URL Path:** `/api/brands/:id`  
**Description:** Retrieve a single brand by its UUID  
**Authentication:** Not Required (public read access)  
**Status:** ✅ **Implemented**

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ------------------------------ |
| `id` | uuid | Yes | UUID of the brand to retrieve |

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "timestamp"
}
```

**Error Responses:**

- **400 Bad Request:** Invalid UUID format
  ```json
  {
    "error": "Invalid UUID format"
  }
  ```
- **404 Not Found:** Brand does not exist
  ```json
  {
    "error": "Brand not found"
  }
  ```
- **500 Internal Server Error:** Database connection unavailable or server error
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

**Implementation Details:**

- **File:** `src/pages/api/brands/[id].ts`
- **Service:** `src/lib/services/brands.service.ts` (`getBrandById`)
- **Validator:** `src/lib/validators/uuid.validator.ts` (`uuidSchema`)
- **Test Script:** `api-tests-scripts/test-get-brand-by-id.http`

---

### 2.3. Regions

#### 2.3.1. List Regions

**HTTP Method:** `GET`  
**URL Path:** `/api/regions`  
**Description:** Retrieve a list of all regions (global, public access)  
**Authentication:** Not Required (public read access)  
**Status:** ✅ **Implemented**

**Query Parameters:**
| Parameter | Type | Required | Description |
| --------- | ------- | -------- | ------------------------------------------------- |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `search` | string | No | Case-insensitive substring match on region name |

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid query parameters
  ```json
  {
    "error": "Invalid query parameters"
  }
  ```

**Implementation Details:**

- **File:** `src/pages/api/regions/index.ts`
- **Service:** `src/lib/services/regions.service.ts` (`listRegions`)
- **Validator:** `src/lib/validators/regions-query.validator.ts` (`regionsQuerySchema`)
- **Test Script:** `api-tests-scripts/test-list-regions.http`

---

#### 2.3.2. Get Region by ID

**HTTP Method:** `GET`  
**URL Path:** `/api/regions/:id`  
**Description:** Retrieve a single region by its UUID  
**Authentication:** Not Required (public read access)  
**Status:** ✅ **Implemented**

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ------------------------------- |
| `id` | uuid | Yes | UUID of the region to retrieve |

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "timestamp"
}
```

**Error Responses:**

- **404 Not Found:** Region does not exist
  ```json
  {
    "error": "Region not found"
  }
  ```
- **400 Bad Request:** Invalid UUID format
  ```json
  {
    "error": "Invalid UUID format"
  }
  ```

**Implementation Details:**

- **File:** `src/pages/api/regions/[id].ts`
- **Service:** `src/lib/services/regions.service.ts` (`getRegionById`)
- **Validator:** `src/lib/validators/uuid.validator.ts` (`uuidSchema`)
- **Test Script:** `api-tests-scripts/test-get-region-by-id.http`

---

### 2.4. Blends

#### 2.4.0. Create Blend

**HTTP Method:** `POST`  
**URL Path:** `/api/blends`  
**Description:** Create a new blend with nested brand and region creation if they don't exist  
**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "name": "Ceremonial Grade",
  "brand": {
    "id": "uuid", // If provided, use existing brand
    "name": "Ippodo Tea" // If provided, create new brand
  },
  "region": {
    "id": "uuid", // If provided, use existing region
    "name": "Uji, Kyoto" // If provided, create new region
  }
}
```

**Validation Rules:**

- `name` (required): string, 1-200 characters, trimmed
- `brand` (required): object with either `id` OR `name` (not both, not neither)
  - If `brand.id`: must be valid UUID and exist in database
  - If `brand.name`: string, 1-100 characters, trimmed (creates if doesn't exist)
- `region` (required): object with either `id` OR `name` (not both, not neither)
  - If `region.id`: must be valid UUID and exist in database
  - If `region.name`: string, 1-100 characters, trimmed (creates if doesn't exist)

**Business Logic:**

1. Validate all input fields
2. If `brand.id`: verify brand exists, return 404 if not
3. If `brand.name`: check if brand exists by name (case-insensitive), create if not
4. If `region.id`: verify region exists, return 404 if not
5. If `region.name`: check if region exists by name (case-insensitive), create if not
6. Check if blend with same (name, brand_id, region_id) already exists
7. If duplicate exists: return 409 Conflict
8. Create blend with resolved brand_id and region_id
9. Return created blend with nested brand and region data

**Success Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "Ceremonial Grade",
  "brand_id": "uuid",
  "region_id": "uuid",
  "created_at": "timestamp",
  "brand": {
    "id": "uuid",
    "name": "Ippodo Tea"
  },
  "region": {
    "id": "uuid",
    "name": "Uji, Kyoto"
  }
}
```

**Error Responses:**

- **401 Unauthorized:** Missing or invalid authentication
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- **400 Bad Request:** Validation error
  ```json
  {
    "error": "Validation failed",
    "details": [
      { "field": "name", "message": "must be at least 1 character" },
      { "field": "brand", "message": "must provide either id OR name, not both" }
    ]
  }
  ```
- **404 Not Found:** Referenced brand/region ID doesn't exist
  ```json
  {
    "error": "Brand not found"
  }
  ```
  OR
  ```json
  {
    "error": "Region not found"
  }
  ```
- **409 Conflict:** Blend with same name, brand, and region already exists
  ```json
  {
    "error": "Blend already exists"
  }
  ```

---

#### 2.4.1. List Blends

**HTTP Method:** `GET`  
**URL Path:** `/api/blends`  
**Description:** Retrieve a list of all blends with their associated brand and region  
**Authentication:** Not Required (public read access)

**Query Parameters:**
| Parameter | Type | Required | Description |
| ------------ | ------- | -------- | ------------------------------------------------ |
| `page` | integer | No | Page number (default: 1) |
| `limit` | integer | No | Items per page (default: 20, max: 100) |
| `brand_id` | uuid | No | Filter by brand UUID |
| `region_id` | uuid | No | Filter by region UUID |
| `search` | string | No | Case-insensitive substring match on blend name |

**Success Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "string",
      "brand": {
        "id": "uuid",
        "name": "string"
      },
      "region": {
        "id": "uuid",
        "name": "string"
      },
      "created_at": "timestamp"
    }
  ],
  "pagination": {
    "total": "number",
    "page": "number",
    "limit": "number"
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid query parameters
  ```json
  {
    "error": "Invalid query parameters"
  }
  ```

---

#### 2.4.2. Get Blend by ID

**HTTP Method:** `GET`  
**URL Path:** `/api/blends/:id`  
**Description:** Retrieve a single blend by its UUID  
**Authentication:** Not Required (public read access)

**Path Parameters:**
| Parameter | Type | Required | Description |
| --------- | ---- | -------- | ------------------------------ |
| `id` | uuid | Yes | UUID of the blend to retrieve |

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "brand": {
    "id": "uuid",
    "name": "string"
  },
  "region": {
    "id": "uuid",
    "name": "string"
  },
  "created_at": "timestamp"
}
```

**Error Responses:**

- **404 Not Found:** Blend does not exist
  ```json
  {
    "error": "Blend not found"
  }
  ```
- **400 Bad Request:** Invalid UUID format
  ```json
  {
    "error": "Invalid UUID format"
  }
  ```

---

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

SipStory uses **Supabase Auth** for authentication, which provides:

- **JWT-based authentication:** Access tokens are issued as JSON Web Tokens (JWT)
- **Secure token management:** Refresh tokens for long-lived sessions
- **Email/password authentication:** Primary authentication method for MVP
- **Built-in security:** Password hashing, rate limiting, and CAPTCHA support

### 3.2. Implementation Details

#### 3.2.1. Token-Based Authentication

All API endpoints (except authentication endpoints) require a valid JWT access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

#### 3.2.2. Token Lifecycle

1. **Sign Up/Sign In:** User receives an `access_token` (short-lived, typically 1 hour) and `refresh_token` (long-lived, typically 7-30 days)
2. **API Requests:** Client includes `access_token` in Authorization header
3. **Token Expiration:** When `access_token` expires, client uses `/api/auth/refresh` endpoint with `refresh_token` to obtain a new `access_token`
4. **Sign Out:** Client calls `/api/auth/signout` to invalidate the session

### 3.3. Authorization Rules

Authorization is enforced at two levels:

#### 3.3.1. Row Level Security (RLS) Policies

Database-level authorization via PostgreSQL RLS policies (as defined in database schema):

- **Tasting Notes:**
  - **Read (SELECT):** Public read access (all authenticated users can view all notes)
  - **Create (INSERT):** User can only create notes for themselves (`auth.uid() = user_id`)
  - **Update:** User can only update their own notes (`auth.uid() = user_id`)
  - **Delete:** User can only delete their own notes (`auth.uid() = user_id`)

- **Global Tables (Brands, Blends, Regions):**
  - **Read (SELECT):** Public read access (all authenticated users)
  - **Write (INSERT/UPDATE/DELETE):** Authenticated users can insert (with application-level deduplication)

## 3. Validation and Business Logic

### 3.1. Validation Rules by Resource

#### 3.1.1. Tasting Notes

**Field-Level Validation for Create:**

| Field             | Validation Rules                                               |
| ----------------- | -------------------------------------------------------------- |
| `brand_name`      | Required, string, max 255 characters, trimmed                  |
| `blend_name`      | Required, string, max 255 characters, trimmed                  |
| `region_name`     | Required, string, max 255 characters, trimmed                  |
| `overall_rating`  | Required, integer, range 1-5 (inclusive)                       |
| `umami`           | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `bitter`          | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `sweet`           | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `foam`            | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `notes_koicha`    | Optional, string or null, max 5000 characters                  |
| `notes_milk`      | Optional, string or null, max 5000 characters                  |
| `price_pln`       | Optional, integer or null, >= 0, full zloty                    |
| `purchase_source` | Optional, string or null, max 500 characters, URL or free text |

**Field-Level Validation for Update (PATCH):**

| Field             | Validation Rules                                               |
| ----------------- | -------------------------------------------------------------- |
| `overall_rating`  | Optional, integer, range 1-5 (inclusive) if provided           |
| `umami`           | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `bitter`          | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `sweet`           | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `foam`            | Optional, integer or null, range 1-5 (inclusive) if provided   |
| `notes_koicha`    | Optional, string or null, max 5000 characters                  |
| `notes_milk`      | Optional, string or null, max 5000 characters                  |
| `price_pln`       | Optional, integer or null, >= 0, full zloty                    |
| `purchase_source` | Optional, string or null, max 500 characters, URL or free text |

**Note:** Brand, blend, and region cannot be changed via the update endpoint. At least one field must be provided for update.

**Business Logic for Create:**

1. **Input Validation:**
   - Validate all fields against rules above using Zod schema
   - Return 400 Bad Request with detailed error messages for validation failures

2. **Region Resolution:**
   - Check if region exists by name (case-insensitive CITEXT match)
   - If not found, create new region with provided name
   - Return region UUID

3. **Brand Resolution:**
   - Check if brand exists by name (case-insensitive CITEXT match)
   - If not found, create new brand with provided name
   - Return brand UUID

4. **Blend Resolution:**
   - Check if blend exists with matching brand_id and name (case-insensitive)
   - If not found, create new blend linked to brand_id and region_id
   - If found, verify it's linked to the same region (prevent inconsistency)
   - Return blend UUID

5. **Tasting Note Creation:**
   - Insert new row with user_id from authenticated session
   - Store `price_pln` as INTEGER (full zloty, no conversion needed)
   - `created_at` set by database on INSERT
   - `updated_at` set by database on INSERT

6. **Response Transformation:**
   - Join blend → brand → name for response
   - Join blend → region → name for response
   - Return full tasting note object with nested brand/region

**Business Logic for Update (PATCH):**

1. **Input Validation:**
   - Validate only the fields provided in the request body using Zod schema
   - Return 400 Bad Request if no fields are provided
   - Return 400 Bad Request with detailed error messages for validation failures

2. **Authorization Check:**
   - Verify the tasting note exists and belongs to the authenticated user (RLS enforced)
   - Return 404 if not found or doesn't belong to user

3. **Partial Update:**
   - Update only the fields provided in the request body
   - Brand, blend, and region remain unchanged (immutable after creation)
   - Store `price_pln` as INTEGER (full zloty, no conversion needed)
   - `updated_at` automatically updated by database trigger

4. **Response Transformation:**
   - Same as Create: join blend data for response

#### 4.1.2. Brands

**Field-Level Validation:**

| Field  | Validation Rules                              |
| ------ | --------------------------------------------- |
| `name` | Required, string, max 255 characters, trimmed |

**Business Logic:**

- Brands are global and shared across all users
- Case-insensitive uniqueness enforced at database level via CITEXT
- Authenticated users can create brands implicitly during tasting note creation
- Orphaned brands (not referenced by any blends) can be cleaned up via background job (post-MVP)

#### 4.1.3. Regions

**Field-Level Validation:**

| Field  | Validation Rules                              |
| ------ | --------------------------------------------- |
| `name` | Required, string, max 255 characters, trimmed |

**Business Logic:**

- Regions are global and shared across all users
- Case-insensitive uniqueness enforced at database level via CITEXT
- Authenticated users can create regions implicitly during tasting note creation
- Orphaned regions (not referenced by any blends) can be cleaned up via background job (post-MVP)

#### 4.1.4. Blends

**Field-Level Validation:**

| Field       | Validation Rules                              |
| ----------- | --------------------------------------------- |
| `name`      | Required, string, max 255 characters, trimmed |
| `brand_id`  | Required, valid UUID, must exist in brands    |
| `region_id` | Required, valid UUID, must exist in regions   |

**Business Logic:**

- Blends are global and shared across all users
- Unique constraint on (brand_id, name) with case-insensitive name comparison
- Each blend is immutably linked to one brand and one region
- Authenticated users can create blends implicitly during tasting note creation
- Orphaned blends (not referenced by any tasting notes) can be cleaned up via background job (post-MVP)

### 4.2. Error Handling Strategy

#### 4.2.1. Error Response Format

All error responses follow a consistent JSON structure:

```json
{
  "error": "Human-readable error message",
  "details": [
    {
      "field": "field_name",
      "message": "Specific validation error"
    }
  ]
}
```

#### 4.2.2. HTTP Status Codes

| Status Code | Usage                                                        |
| ----------- | ------------------------------------------------------------ |
| 200         | Successful GET, PUT requests                                 |
| 201         | Successful POST (resource created)                           |
| 204         | Successful DELETE (no content returned)                      |
| 400         | Bad request (validation error, malformed request)            |
| 401         | Unauthorized (missing/invalid authentication token)          |
| 403         | Forbidden (authenticated but insufficient permissions)       |
| 404         | Not found (resource doesn't exist or doesn't belong to user) |
| 409         | Conflict (e.g., duplicate resource)                          |
| 422         | Unprocessable entity (business logic error)                  |
| 429         | Too many requests (rate limit exceeded)                      |
| 500         | Internal server error                                        |

#### 4.2.3. Validation Error Details

For 400 Bad Request responses, include detailed field-level validation errors:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "overall_rating",
      "message": "Overall rating must be between 1 and 5"
    },
    {
      "field": "price_pln",
      "message": "Price must be a positive number"
    }
  ]
}
```

### 4.3. Zod Schema Examples

#### 4.3.1. Create Tasting Note Schema

```typescript
import { z } from "zod";

export const CreateTastingNoteSchema = z.object({
  brand_name: z.string().min(1).max(255).trim(),
  blend_name: z.string().min(1).max(255).trim(),
  region_name: z.string().min(1).max(255).trim(),
  overall_rating: z.number().int().min(1).max(5),
  umami: z.number().int().min(1).max(5).nullable().optional(),
  bitter: z.number().int().min(1).max(5).nullable().optional(),
  sweet: z.number().int().min(1).max(5).nullable().optional(),
  foam: z.number().int().min(1).max(5).nullable().optional(),
  notes_koicha: z.string().max(5000).nullable().optional(),
  notes_milk: z.string().max(5000).nullable().optional(),
  price_pln: z.number().int().min(0).nullable().optional(),
  purchase_source: z.string().max(500).nullable().optional(),
});
```

#### 4.3.2. Update Tasting Note Schema

```typescript
export const UpdateTastingNoteSchema = z
  .object({
    overall_rating: z.number().int().min(1).max(5).optional(),
    umami: z.number().int().min(1).max(5).nullable().optional(),
    bitter: z.number().int().min(1).max(5).nullable().optional(),
    sweet: z.number().int().min(1).max(5).nullable().optional(),
    foam: z.number().int().min(1).max(5).nullable().optional(),
    notes_koicha: z.string().max(5000).nullable().optional(),
    notes_milk: z.string().max(5000).nullable().optional(),
    price_pln: z.number().int().min(0).nullable().optional(),
    purchase_source: z.string().max(500).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });
```

#### 4.3.3. Query Parameter Schema for List Endpoints

```typescript
export const TastingNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  brand_ids: z
    .string()
    .transform((s) => s.split(","))
    .optional(),
  region_ids: z
    .string()
    .transform((s) => s.split(","))
    .optional(),
  min_rating: z.coerce.number().int().min(1).max(5).optional(),
  sort_by: z.enum(["created_at", "updated_at", "overall_rating"]).default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});
```

### 4.4. Business Logic Implementation

#### 4.4.1. Autocomplete Logic

Autocomplete endpoints implement user-scoped suggestions:

```typescript
// Pseudocode for autocomplete brands
async function autocompleteBrands(userId: string, query: string, limit: number) {
  // Query structure:
  // 1. Join tasting_notes → blends → brands
  // 2. Filter by user_id and brand name ILIKE query
  // 3. Group by brand.id and brand.name
  // 4. Count occurrences (usage_count)
  // 5. Order by usage_count DESC
  // 6. Limit results

  return await supabase
    .from("tasting_notes")
    .select("blend:blends(brand:brands(id, name))")
    .eq("user_id", userId)
    .ilike("blends.brands.name", `%${query}%`)
    .groupBy("blends.brands.id", "blends.brands.name")
    .orderBy("usage_count", { ascending: false })
    .limit(limit);
}
```

#### 4.4.2. Filtering Logic

List endpoint filtering combines multiple optional filters:

```typescript
// Pseudocode for filtering tasting notes
async function listTastingNotes(userId: string, filters: Filters) {
  let query = supabase
    .from("tasting_notes")
    .select("*, blend:blends(*, brand:brands(*), region:regions(*))")
    .eq("user_id", userId);

  // Apply optional filters
  if (filters.brand_ids?.length) {
    query = query.in("blends.brand_id", filters.brand_ids);
  }

  if (filters.region_ids?.length) {
    query = query.in("blends.region_id", filters.region_ids);
  }

  if (filters.min_rating) {
    query = query.gte("overall_rating", filters.min_rating);
  }

  // Apply sorting
  query = query.order(filters.sort_by, { ascending: filters.sort_order === "asc" });

  // Apply pagination
  const offset = (filters.page - 1) * filters.limit;
  query = query.range(offset, offset + filters.limit - 1);

  return await query;
}
```

---

## 5. Additional Considerations

### 5.1. Pagination Strategy

All list endpoints use **offset-based pagination**:

- **Default page size:** 20 items for tasting notes, 50 for global resources
- **Max page size:** 100 for tasting notes, 200 for global resources
- **Response includes:** `total`, `page`, `limit`

Offset pagination is sufficient for MVP. Cursor-based pagination can be considered post-MVP for large datasets.

### 5.2. Performance Optimization

#### 5.2.1. Database Indexes

The database schema includes optimized indexes for common query patterns:

- User-scoped queries: `idx_tasting_notes_user_created`, `idx_tasting_notes_user_rating`
- Filtered queries: `idx_tasting_notes_user_brand_rating`
- Join optimization: `idx_blends_brand`, `idx_blends_region`

#### 5.2.2. Query Optimization

- Use `select` with specific columns to reduce data transfer
- Leverage PostgreSQL's query planner for complex joins
- Implement response caching for global resources (brands, regions, blends) using HTTP cache headers

#### 5.2.3. N+1 Query Prevention

- Always use `select` with nested joins to fetch related data in a single query
- Example: `tasting_notes` always fetches `blend` → `brand` + `region` in one query

### 5.3. API Versioning

For MVP, no explicit versioning is required. Future versions can implement:

- URL versioning: `/api/v2/tasting-notes`
- Header versioning: `Accept: application/vnd.sipstory.v2+json`

### 5.4. Logging and Monitoring

Implement structured logging for:

- Authentication events (login, logout, failed attempts)
- CRUD operations (create, update, delete)
- Error events with stack traces
- Performance metrics (query duration, endpoint latency)

### 5.5. Testing Requirements

As per PRD, E2E tests must cover:

1. **Login → Create tasting:** Authenticate and POST to `/api/tasting-notes`
2. **Get tasting → Edit:** GET `/api/tasting-notes/:id` then PUT `/api/tasting-notes/:id`
3. **Get tasting → Delete:** GET `/api/tasting-notes/:id` then DELETE `/api/tasting-notes/:id`

Additional API tests should include:

- Unit tests for Zod validation schemas
- Integration tests for business logic (blend resolution, price conversion)
- Authorization tests (RLS policy enforcement)

---

## 6. Implementation Roadmap

### Phase 1: Core Authentication & Tasting Notes (MVP Critical)

1. Set up Supabase Auth integration
2. Implement authentication endpoints (sign up, sign in, sign out, refresh)
3. Implement tasting notes CRUD endpoints
4. Implement filtering and sorting for tasting notes list

### Phase 2: Global Resources & Autocomplete (MVP Critical)

1. Implement brands list and get endpoints
2. Implement regions list and get endpoints
3. Implement blends list and get endpoints
4. Implement autocomplete endpoints for brands, blends, regions

### Phase 3: Polish & Optimization (MVP Enhancement)

1. Implement rate limiting
2. Add response caching for global resources
3. Optimize database queries based on performance testing
4. Implement comprehensive error handling and logging

### Phase 4: Testing & Documentation (MVP Completion)

1. Write E2E tests as per PRD requirements
2. Write unit and integration tests
3. Generate API documentation (OpenAPI/Swagger)
4. Perform security audit

---

## 7. Assumptions

The following assumptions were made during API design:

1. **Public Read Access:** The PRD states "public read access to tasting_notes" is implemented at the database level. This API assumes this means all authenticated users can view all tasting notes, enabling comparison features. If privacy is required, this can be adjusted with additional RLS policies.

2. **Price Display:** Prices are displayed in PLN (full zloty) in the API response.

3. **Brand/Blend/Region Immutability:** Once a tasting note is created with a specific brand, blend, and region, these associations cannot be changed via the PATCH endpoint. This prevents data inconsistency and ensures tasting notes remain tied to their original product. If a user needs to change the brand/blend/region, they must delete the note and create a new one.

4. **Partial Updates:** The PATCH endpoint allows updating individual fields without requiring all fields to be sent. At least one field must be provided in the request body.

5. **Global Resource Creation:** Brands, regions, and blends are created implicitly during tasting note creation only. There are no dedicated "Create Brand" or "Create Region" POST endpoints for MVP. The PATCH endpoint does not create new global resources.

6. **No Soft Delete:** Tasting notes are permanently deleted when the DELETE endpoint is called. No "undo" or soft delete functionality is implemented in MVP.

7. **Autocomplete Scope:** Autocomplete suggestions are user-scoped (only from the authenticated user's own tasting history), not global across all users.

8. **Rate Limiting:** Rate limits are applied per authenticated user (by user_id), not per IP address, for read and write endpoints.

9. **HTTPS Only:** All production API requests must be made over HTTPS. HTTP is only allowed in local development.

---

This REST API plan provides a comprehensive foundation for implementing the SipStory MVP backend. All endpoints are designed to work seamlessly with the database schema, enforce proper authentication/authorization, and support the core features described in the PRD.
