-- Migration: 010_migrate_allowed_hours
-- Converts old allowed_hours format {day: {start, end}} to new {hour: bool} format.
-- Any row that has non-boolean values in allowed_hours is reset to '{}' (all hours allowed).
-- This is safe: orang tua perlu re-set jam tayang mereka setelah upgrade.

UPDATE parent_settings
SET allowed_hours = '{}'
WHERE allowed_hours IS NOT NULL
  AND allowed_hours::text NOT IN ('{}', 'null', '""')
  AND EXISTS (
    SELECT 1
    FROM jsonb_each(allowed_hours) AS t(key, val)
    WHERE jsonb_typeof(val) != 'boolean'
    LIMIT 1
  );
