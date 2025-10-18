-- migration: create trigger for updated_at timestamp
-- purpose: automatically update the updated_at column on tasting_notes when a row is modified
-- affected: table 'tasting_notes', new trigger function
-- considerations:
--   - trigger executes before update to ensure new timestamp is saved
--   - function is reusable and can be attached to other tables if needed in future

-- create trigger function to update the updated_at column
-- rationale: centralized logic for timestamp management, reduces application code complexity
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- attach trigger to tasting_notes table
-- rationale: ensures updated_at is always current when a tasting note is modified
-- execution: before update ensures the new timestamp is saved with the row
create trigger update_tasting_notes_updated_at
before update on tasting_notes
for each row
execute function update_updated_at_column();
