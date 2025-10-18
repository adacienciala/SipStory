-- migration: enable required postgresql extensions
-- purpose: enable uuid generation and case-insensitive text support
-- affected: database extensions
-- considerations: these extensions are required for all subsequent migrations

-- enable uuid generation for primary keys
create extension if not exists "uuid-ossp";

-- enable case-insensitive text type for brand, blend, and region names
create extension if not exists "citext";
