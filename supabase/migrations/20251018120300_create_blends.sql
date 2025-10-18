-- migration: create blends table
-- purpose: store matcha blends with their associated brand and region
-- affected: new table 'blends', foreign keys to 'brands' and 'regions'
-- considerations:
--   - blend names are unique only within the context of a specific brand
--   - uses citext for case-insensitive blend names
--   - on delete restrict prevents deletion of brands/regions that have associated blends
--   - each blend belongs to exactly one brand and one region

-- create blends table
create table blends (
    id uuid primary key default gen_random_uuid(),
    name citext not null,
    brand_id uuid not null references brands(id) on delete restrict,
    region_id uuid not null references regions(id) on delete restrict,
    created_at timestamptz not null default now(),
    -- blend names must be unique per brand (case-insensitive)
    unique(brand_id, name)
);

-- enable row level security
alter table blends enable row level security;

-- policy: allow public read access to blends for all users (anon role)
-- rationale: blends are global reference data needed for autocomplete and tasting note display
create policy "allow_anon_select_blends"
on blends
for select
to anon
using (true);

-- policy: allow public read access to blends for authenticated users
-- rationale: authenticated users need to view blends when creating/editing tasting notes
create policy "allow_authenticated_select_blends"
on blends
for select
to authenticated
using (true);

-- policy: allow authenticated users to insert new blends
-- rationale: users can add new blends when they taste matcha variants not yet in the database
-- note: uniqueness per brand is enforced by unique(brand_id, name) constraint
create policy "allow_authenticated_insert_blends"
on blends
for insert
to authenticated
with check (auth.role() = 'authenticated');

-- index: support for blend → brand joins
-- rationale: optimize queries that filter or join blends by brand
create index idx_blends_brand on blends (brand_id);

-- index: support for blend → region joins
-- rationale: optimize queries that filter or join blends by region
create index idx_blends_region on blends (region_id);
