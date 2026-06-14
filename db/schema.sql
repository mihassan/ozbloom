-- OzBloom D1 schema
-- Apply with: wrangler d1 execute ozbloom-db --remote --file db/schema.sql

CREATE TABLE IF NOT EXISTS flowers (
  id                  TEXT PRIMARY KEY,
  common_name         TEXT NOT NULL,
  scientific_name     TEXT NOT NULL,
  region              TEXT NOT NULL,
  bloom_season        TEXT NOT NULL,
  color               TEXT NOT NULL,
  habitat             TEXT NOT NULL,
  conservation_status TEXT NOT NULL,
  short_description   TEXT NOT NULL,
  description         TEXT NOT NULL,
  image_url           TEXT NOT NULL,
  image_alt           TEXT NOT NULL
);
