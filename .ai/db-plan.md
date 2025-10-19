# Database Schema Plan - SipStory MVP

## 1. Tables

### 1.1 regions

Global table storing unique matcha regions of origin.

| Column     | Type        | Constraints                           | Description                           |
| ---------- | ----------- | ------------------------------------- | ------------------------------------- |
| id         | UUID        | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier for the region      |
| name       | CITEXT      | UNIQUE NOT NULL                       | Region name (case-insensitive unique) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now()                | Timestamp when region was created     |

**Notes:**

- Uses CITEXT for case-insensitive comparison
- Global table shared across all users
- Regions are immutable once referenced by blends

### 1.2 brands

Global table storing unique matcha brands.

| Column     | Type        | Constraints                           | Description                          |
| ---------- | ----------- | ------------------------------------- | ------------------------------------ |
| id         | UUID        | PRIMARY KEY DEFAULT gen_random_uuid() | Unique identifier for the brand      |
| name       | CITEXT      | UNIQUE NOT NULL                       | Brand name (case-insensitive unique) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now()                | Timestamp when brand was created     |

**Notes:**

- Uses CITEXT for case-insensitive comparison
- Global table shared across all users
- Brand names must be globally unique

### 1.3 blends

Global table storing matcha blends with their associated brand and region.

| Column                 | Type        | Constraints                                        | Description                                             |
| ---------------------- | ----------- | -------------------------------------------------- | ------------------------------------------------------- |
| id                     | UUID        | PRIMARY KEY DEFAULT gen_random_uuid()              | Unique identifier for the blend                         |
| name                   | CITEXT      | NOT NULL                                           | Blend name (case-insensitive)                           |
| brand_id               | UUID        | NOT NULL REFERENCES brands(id) ON DELETE RESTRICT  | Foreign key to brands table                             |
| region_id              | UUID        | NOT NULL REFERENCES regions(id) ON DELETE RESTRICT | Foreign key to regions table                            |
| created_at             | TIMESTAMPTZ | NOT NULL DEFAULT now()                             | Timestamp when blend was created                        |
| UNIQUE(brand_id, name) |             | CONSTRAINT                                         | Blend names must be unique per brand (case-insensitive) |

**Notes:**

- Blend names are unique only within the context of a specific brand
- Each blend belongs to exactly one brand and one region
- ON DELETE RESTRICT prevents deletion of brands/regions that have associated blends

### 1.4 tasting_notes

User-specific tasting notes referencing global blends.

| Column          | Type        | Constraints                                          | Description                                    |
| --------------- | ----------- | ---------------------------------------------------- | ---------------------------------------------- |
| id              | UUID        | PRIMARY KEY DEFAULT gen_random_uuid()                | Unique identifier for the tasting note         |
| user_id         | UUID        | NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE | Foreign key to Supabase auth.users             |
| blend_id        | UUID        | NOT NULL REFERENCES blends(id) ON DELETE RESTRICT    | Foreign key to blends table                    |
| overall_rating  | SMALLINT    | NOT NULL CHECK (overall_rating BETWEEN 1 AND 5)      | Mandatory overall rating (1-5 stars)           |
| umami           | SMALLINT    | CHECK (umami IS NULL OR umami BETWEEN 1 AND 5)       | Optional umami rating (1-5 dots)               |
| bitter          | SMALLINT    | CHECK (bitter IS NULL OR bitter BETWEEN 1 AND 5)     | Optional bitterness rating (1-5 dots)          |
| sweet           | SMALLINT    | CHECK (sweet IS NULL OR sweet BETWEEN 1 AND 5)       | Optional sweetness rating (1-5 dots)           |
| foam            | SMALLINT    | CHECK (foam IS NULL OR foam BETWEEN 1 AND 5)         | Optional foam quality rating (1-5 dots)        |
| notes_koicha    | TEXT        |                                                      | Optional tasting notes when prepared as koicha |
| notes_milk      | TEXT        |                                                      | Optional tasting notes when prepared with milk |
| price_pln       | INTEGER     | CHECK (price_pln IS NULL OR price_pln >= 0)          | Optional price per 100g in PLN (full zloty)    |
| purchase_source | TEXT        |                                                      | Optional purchase location or URL              |
| created_at      | TIMESTAMPTZ | NOT NULL DEFAULT now()                               | Timestamp when note was created                |
| updated_at      | TIMESTAMPTZ | NOT NULL DEFAULT now()                               | Timestamp when note was last updated           |

**Notes:**

- User isolation enforced via RLS policies
- Only blend_id is stored; brand and region are derived via joins
- Price stored as INTEGER in full zloty (PLN) with no decimal places
- ON DELETE CASCADE for user_id ensures cleanup when user account is deleted
- ON DELETE RESTRICT for blend_id prevents accidental data loss
- updated_at automatically managed via database trigger

### 1.5 users (auth.users)

User authentication table managed by Supabase Auth. This table is part of the `auth` schema and is automatically maintained by Supabase.

| Column             | Type         | Constraints            | Description                               |
| ------------------ | ------------ | ---------------------- | ----------------------------------------- |
| id                 | UUID         | PRIMARY KEY            | Unique identifier for the user            |
| email              | VARCHAR(255) | NOT NULL UNIQUE        | User's email address                      |
| encrypted_password | VARCHAR      | NOT NULL               | Encrypted password hash                   |
| created_at         | TIMESTAMPTZ  | NOT NULL DEFAULT now() | Timestamp when user account was created   |
| confirmed_at       | TIMESTAMPTZ  |                        | Timestamp when user confirmed their email |

**Notes:**

- This table is **managed by Supabase Auth** and should not be modified directly via migrations
- The `auth.users` table contains additional columns managed by Supabase (e.g., `last_sign_in_at`, `email_confirmed_at`, `raw_user_meta_data`, etc.)
- Only the core columns relevant to SipStory are listed above
- User authentication, password management, and email confirmation are handled automatically by Supabase Auth
- Referenced by `tasting_notes.user_id` foreign key
- Do not create this table in migrations; it exists by default in Supabase projects

## 2. Relationships

### 2.1 Entity Relationship Diagram

```
┌─────────────┐
│   regions   │
│             │
│ - id (PK)   │
│ - name      │
└──────┬──────┘
       │
       │ 1
       │
       │ N
       │
┌──────┴──────────┐         ┌─────────────┐
│     blends      │   N     │   brands    │
│                 ├─────────┤             │
│ - id (PK)       │    1    │ - id (PK)   │
│ - name          │         │ - name      │
│ - brand_id (FK) │         └─────────────┘
│ - region_id (FK)│
└──────┬──────────┘
       │
       │ 1
       │
       │ N
       │
┌──────┴────────────────┐         ┌─────────────────┐
│   tasting_notes       │   N     │  auth.users     │
│                       ├─────────┤  (Supabase)     │
│ - id (PK)             │    1    │                 │
│ - user_id (FK)        │         │ - id (PK)       │
│ - blend_id (FK)       │         └─────────────────┘
│ - overall_rating      │
│ - umami               │
│ - bitter              │
│ - sweet               │
│ - foam                │
│ - notes_koicha        │
│ - notes_milk          │
│ - price_pln           │
│ - purchase_source     │
│ - created_at          │
│ - updated_at          │
└───────────────────────┘
```

### 2.2 Relationship Descriptions

| Relationship               | Type        | Description                                                                                             |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| regions → blends           | One-to-Many | Each region can have multiple blends; each blend belongs to one region                                  |
| brands → blends            | One-to-Many | Each brand can have multiple blends; each blend belongs to one brand                                    |
| blends → tasting_notes     | One-to-Many | Each blend can have multiple tasting notes from different users; each tasting note references one blend |
| auth.users → tasting_notes | One-to-Many | Each user can create multiple tasting notes; each tasting note belongs to one user                      |

### 2.3 Derived Relationships

- **tasting_notes → brands**: Accessed via join chain `tasting_notes.blend_id → blends.brand_id → brands.id`
- **tasting_notes → regions**: Accessed via join chain `tasting_notes.blend_id → blends.region_id → regions.id`

## 3. Indexes

### 3.1 Primary Indexes (MVP - Required)

These indexes optimize user-specific queries for filtering, sorting, and comparison features.

```sql
-- User-scoped filtering by brand and rating
CREATE INDEX idx_tasting_notes_user_brand_rating
ON tasting_notes (user_id, brand_id, overall_rating DESC);

-- User-scoped filtering by overall rating
CREATE INDEX idx_tasting_notes_user_rating
ON tasting_notes (user_id, overall_rating DESC);

-- Default chronological sorting for dashboard
CREATE INDEX idx_tasting_notes_user_created
ON tasting_notes (user_id, created_at DESC);

-- Support for blend → brand joins
CREATE INDEX idx_blends_brand
ON blends (brand_id);

-- Support for blend → region joins
CREATE INDEX idx_blends_region
ON blends (region_id);
```

### 3.2 Supporting Indexes for Global Tables

```sql
-- Autocomplete lookups (case-insensitive already handled by CITEXT)
-- CITEXT column automatically creates index for efficient lookups

-- Support for blend uniqueness constraint
-- Automatically created by UNIQUE(brand_id, name) constraint
```

### 3.3 Deferred Indexes (Post-MVP)

These indexes should be added after MVP launch if analytics show they're needed:

```sql
-- Global cross-user filtering by brand
CREATE INDEX idx_tasting_notes_blend_rating
ON tasting_notes (blend_id, overall_rating DESC);

-- Partial index for high-rated tastings
CREATE INDEX idx_tasting_notes_high_ratings
ON tasting_notes (user_id, overall_rating DESC)
WHERE overall_rating >= 4;
```

## 4. PostgreSQL Policies (Row Level Security)

### 4.1 Enable RLS on User Data

```sql
ALTER TABLE tasting_notes ENABLE ROW LEVEL SECURITY;
```

### 4.2 tasting_notes Policies

```sql
-- Allow users to view all tasting notes (public read access)
CREATE POLICY "Allow public read access to tasting_notes"
ON tasting_notes
FOR SELECT
USING (true);

-- Allow users to insert their own tasting notes
CREATE POLICY "Allow users to insert their own tasting_notes"
ON tasting_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own tasting notes
CREATE POLICY "Allow users to update their own tasting_notes"
ON tasting_notes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own tasting notes
CREATE POLICY "Allow users to delete their own tasting_notes"
ON tasting_notes
FOR DELETE
USING (auth.uid() = user_id);
```

### 4.3 Global Tables RLS

Global tables (brands, blends, regions) have public read access and restricted write access:

```sql
-- Enable RLS on global tables
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE blends ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to brands
CREATE POLICY "Allow public read access to brands"
ON brands
FOR SELECT
USING (true);

-- Allow public read access to blends
CREATE POLICY "Allow public read access to blends"
ON blends
FOR SELECT
USING (true);

-- Allow public read access to regions
CREATE POLICY "Allow public read access to regions"
ON regions
FOR SELECT
USING (true);

-- Write policies for global tables
-- Note: INSERT/UPDATE/DELETE on global tables will be handled by
-- application logic or service role. Specific policies can be added
-- in implementation phase based on chosen workflow:
-- Option 1: Allow authenticated users to insert (with deduplication logic)
-- Option 2: Restrict to service role only
-- Option 3: Implement approval workflow

-- Placeholder for authenticated user insert (to be refined in implementation)
CREATE POLICY "Allow authenticated users to insert brands"
ON brands
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert blends"
ON blends
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert regions"
ON regions
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

## 5. Database Triggers

### 5.1 Updated_at Timestamp Trigger

Automatically update the `updated_at` column on tasting_notes when a row is modified.

```sql
-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tasting_notes table
CREATE TRIGGER update_tasting_notes_updated_at
BEFORE UPDATE ON tasting_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Orphan Cleanup (Deferred to Implementation)

Automatic deletion of unused brands/blends will be implemented via one of:

- Database trigger on tasting_notes DELETE
- Scheduled background job (pg_cron or application-level)
- Manual cleanup via admin interface

Decision deferred to implementation phase based on performance testing and cleanup frequency requirements.

## 6. Design Decisions and Rationale

### 6.1 Normalization Strategy

**Decision:** Normalize brands, blends, and regions into separate global tables.

**Rationale:**

- Ensures data consistency across all users
- Enables efficient autocomplete with global suggestions
- Reduces storage overhead from duplicate brand/blend/region names
- Facilitates future community features (trending brands, regional analytics)

### 6.2 UUID Primary Keys

**Decision:** Use UUID with `gen_random_uuid()` for all tables.

**Rationale:**

- Supports distributed systems and client-generated IDs
- Prevents enumeration attacks (no sequential IDs)
- Enables offline-first functionality in future iterations
- Standard practice for Supabase/PostgreSQL applications

### 6.3 Price Storage

**Decision:** Store price as INTEGER in full zloty (PLN).

**Rationale:**

- Avoids floating-point precision errors
- Simplifies monetary calculations and data entry
- Users typically think in whole zloty amounts for matcha prices
- Sufficient precision for the price range of matcha products per 100g

### 6.4 Foreign Key Strategy

**Decision:** Store only `blend_id` in tasting_notes; derive brand and region via joins.

**Rationale:**

- Prevents data inconsistency (mismatched brand/blend combinations)
- Maintains single source of truth for blend metadata
- Simplifies updates to blend attributes
- Enforces referential integrity at database level

### 6.5 Rating Constraints

**Decision:** Use SMALLINT with CHECK constraints for all rating fields.

**Rationale:**

- Enforces valid rating range (1-5) at database level
- SMALLINT uses minimal storage (2 bytes)
- Separate constraints for mandatory (overall_rating) and optional (sensory) fields
- Prevents invalid data from entering the system

### 6.6 Index Strategy

**Decision:** Implement user-scoped composite indexes immediately; defer global indexes.

**Rationale:**

- MVP queries are primarily user-scoped (dashboard, filtering)
- Composite indexes optimize multi-column WHERE clauses
- User-leading indexes leverage PostgreSQL B-tree index ordering
- Global indexes deferred until cross-user analytics are needed (reduces write overhead)

### 6.7 Deletion Strategy

**Decision:** Hard delete for tasting_notes; no soft delete.

**Rationale:**

- MVP doesn't require audit trail or "undo" functionality
- Simplifies queries (no need to filter out deleted_at IS NOT NULL)
- Reduces storage costs
- Can be added in future iterations if business requirements change

### 6.8 Case-Insensitive Uniqueness

**Decision:** Use CITEXT for brand, blend, and region names.

**Rationale:**

- Prevents duplicate entries with different casing ("Ippodo" vs "ippodo")
- Maintains user-entered capitalization for display
- More efficient than UNIQUE (lower(name)) with function-based index
- PostgreSQL extension widely supported in Supabase

### 6.9 RLS for User Isolation

**Decision:** Public read access for tasting_notes; write operations restricted to owner.

**Rationale:**

- MVP spec requires public read for comparison features
- User can only modify their own data (enforced at database level)
- Supabase Auth integration via `auth.uid()` function
- Provides foundation for future privacy controls (per-note visibility)

## 7. Implementation Notes

### 7.1 Migration Order

Migrations should be applied in this order to satisfy foreign key dependencies:

1. Enable CITEXT extension (`CREATE EXTENSION IF NOT EXISTS citext;`)
2. Create `regions` table
3. Create `brands` table
4. Create `blends` table (depends on regions, brands)
5. Create `tasting_notes` table (depends on blends, auth.users)
6. Create indexes
7. Enable RLS and create policies
8. Create triggers

### 7.2 Required PostgreSQL Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- For gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- For case-insensitive text
```

### 7.3 Supabase Auth Integration

The schema assumes Supabase Auth is configured with the default `auth.users` table. The `user_id` foreign key in `tasting_notes` references `auth.users(id)`.
