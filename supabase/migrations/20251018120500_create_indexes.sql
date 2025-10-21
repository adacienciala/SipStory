-- migration: create indexes for tasting_notes
-- purpose: optimize user-scoped queries for filtering, sorting, and comparison features
-- affected: table 'tasting_notes'
-- considerations:
--   - mvp queries are primarily user-scoped (dashboard, filtering)
--   - composite indexes optimize multi-column where clauses
--   - user-leading indexes leverage postgresql b-tree index ordering
--   - global indexes deferred until cross-user analytics are needed

-- index: default chronological sorting for dashboard
-- rationale: optimize the main dashboard view which shows all user's tastings sorted by date
-- query pattern: select * from tasting_notes where user_id = ? order by created_at desc
create index idx_tasting_notes_user_created 
on tasting_notes (user_id, created_at desc);

-- index: user-scoped filtering by overall rating
-- rationale: optimize filtering to show only highly-rated tastings (e.g., >= 4 stars)
-- query pattern: select * from tasting_notes where user_id = ? and overall_rating >= ? order by overall_rating desc
create index idx_tasting_notes_user_rating 
on tasting_notes (user_id, overall_rating desc);

-- index: user-scoped filtering by blend and rating
-- rationale: optimize queries that filter by user and blend with rating sorting
-- query pattern: select * from tasting_notes where user_id = ? and blend_id = ? order by overall_rating desc
create index idx_tasting_notes_user_blend_rating
on tasting_notes (user_id, blend_id, overall_rating desc);

-- index: support for blend-based queries and joins
-- rationale: optimize queries that filter by blend or join to blend table for brand/region info
-- query pattern: select * from tasting_notes where blend_id = ?
create index idx_tasting_notes_blend 
on tasting_notes (blend_id);
