-- migration: create regions table
-- purpose: store global matcha regions of origin
-- affected: new table 'regions'
-- considerations: 
--   - uses citext for case-insensitive unique region names
--   - global table shared across all users
--   - regions are immutable once referenced by blends (enforced by foreign key constraints)

-- create regions table
create table regions (
    id uuid primary key default gen_random_uuid(),
    name citext unique not null,
    created_at timestamptz not null default now()
);

-- enable row level security
alter table regions enable row level security;

-- policy: allow public read access to regions for all users (anon role)
-- rationale: regions are global reference data needed for autocomplete
create policy "allow_anon_select_regions"
on regions
for select
to anon
using (true);

-- policy: allow public read access to regions for authenticated users
-- rationale: authenticated users need to view regions when creating/editing tasting notes
create policy "allow_authenticated_select_regions"
on regions
for select
to authenticated
using (true);

-- policy: allow authenticated users to insert new regions
-- rationale: users can add new regions when they encounter matcha from unlisted origins
-- note: case-insensitive uniqueness is enforced by citext unique constraint
create policy "allow_authenticated_insert_regions"
on regions
for insert
to authenticated
with check (auth.role() = 'authenticated');
