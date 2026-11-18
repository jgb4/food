-- Maison Emma D1 schema. Apply with:
--   npx wrangler d1 execute maison-emma --remote --file schema.sql
create table if not exists dishes (
  id         text primary key,
  name       text not null,
  week_of    text not null,          -- YYYY-MM-DD
  score      real not null,          -- 0 to 10, half points
  notes      text not null default '',
  photo      text,                   -- photos.id
  created_at integer not null,       -- ms since epoch
  updated_at integer not null
);
create table if not exists ideas (
  id         text primary key,
  name       text not null,
  notes      text not null default '',
  created_at integer not null
);
create table if not exists photos (
  id         text primary key,
  type       text not null,          -- image/jpeg etc.
  data       blob not null,
  created_at integer not null
);
