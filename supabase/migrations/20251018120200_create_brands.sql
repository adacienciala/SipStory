-- migration: create brands table
-- purpose: store global matcha brands
-- affected: new table 'brands'
-- considerations:
--   - uses citext for case-insensitive unique brand names
--   - global table shared across all users
--   - brand names must be globally unique to prevent confusion

-- create brands table
create table brands (
    id uuid primary key default gen_random_uuid(),
    name citext unique not null,
    created_at timestamptz not null default now()
);

-- enable row level security
alter table brands enable row level security;

-- policy: allow public read access to brands for all users (anon role)
-- rationale: brands are global reference data needed for autocomplete
create policy "allow_anon_select_brands"
on brands
for select
to anon
using (true);

-- policy: allow public read access to brands for authenticated users
-- rationale: authenticated users need to view brands when creating/editing tasting notes
create policy "allow_authenticated_select_brands"
on brands
for select
to authenticated
using (true);

-- policy: allow authenticated users to insert new brands
-- rationale: users can add new brands when they discover matcha from unlisted producers
-- note: case-insensitive uniqueness is enforced by citext unique constraint
create policy "allow_authenticated_insert_brands"
on brands
for insert
to authenticated
with check (auth.role() = 'authenticated');
