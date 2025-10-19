-- migration: create tasting_notes table
-- purpose: store user-specific tasting notes referencing global blends
-- affected: new table 'tasting_notes', foreign keys to 'auth.users' and 'blends'
-- considerations:
--   - user isolation enforced via rls policies
--   - only blend_id is stored; brand and region are derived via joins
--   - price stored as integer in full zloty (PLN) with no decimal places
--   - on delete cascade for user_id ensures cleanup when user account is deleted
--   - on delete restrict for blend_id prevents accidental data loss
--   - updated_at automatically managed via database trigger (created in separate migration)

-- create tasting_notes table
create table tasting_notes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    blend_id uuid not null references blends(id) on delete restrict,
    -- mandatory overall rating (1-5 stars)
    overall_rating smallint not null check (overall_rating between 1 and 5),
    -- optional sensory ratings (1-5 dots each)
    umami smallint check (umami is null or umami between 1 and 5),
    bitter smallint check (bitter is null or bitter between 1 and 5),
    sweet smallint check (sweet is null or sweet between 1 and 5),
    foam smallint check (foam is null or foam between 1 and 5),
    -- optional tasting notes for different preparation methods
    notes_koicha text,
    notes_milk text,
    -- optional price per 100g in PLN (full zloty)
    price_pln integer check (price_pln is null or price_pln >= 0),
    -- optional purchase location or url
    purchase_source text,
    -- timestamps
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- enable row level security
alter table tasting_notes enable row level security;

-- policy: allow public read access to tasting_notes for all users (anon role)
-- rationale: mvp requires public read for comparison features
create policy "allow_anon_select_tasting_notes"
on tasting_notes
for select
to anon
using (true);

-- policy: allow public read access to tasting_notes for authenticated users
-- rationale: authenticated users need to view all tasting notes for comparison
create policy "allow_authenticated_select_tasting_notes"
on tasting_notes
for select
to authenticated
using (true);

-- policy: allow users to insert their own tasting notes
-- rationale: users can only create tasting notes for themselves
create policy "allow_authenticated_insert_own_tasting_notes"
on tasting_notes
for insert
to authenticated
with check (auth.uid() = user_id);

-- policy: allow users to update only their own tasting notes
-- rationale: users can only modify their own data
create policy "allow_authenticated_update_own_tasting_notes"
on tasting_notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- policy: allow users to delete only their own tasting notes
-- rationale: users can only delete their own data
create policy "allow_authenticated_delete_own_tasting_notes"
on tasting_notes
for delete
to authenticated
using (auth.uid() = user_id);
