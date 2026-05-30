-- Migration: 011_add_child_username
-- Tambah kolom username (unik, lowercase) ke child_profiles untuk login yang lebih ramah anak.
-- Child login menggunakan username + PIN, bukan UUID.

ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS username VARCHAR(30) UNIQUE;

-- Backfill existing rows: gunakan display_name yang di-sanitasi + suffix 4 digit dari id
UPDATE child_profiles
   SET username = LOWER(REGEXP_REPLACE(display_name, '[^a-zA-Z0-9]', '', 'g'))
                  || SUBSTRING(id::text, 1, 4)
 WHERE username IS NULL;

-- Setelah backfill, wajibkan NOT NULL
ALTER TABLE child_profiles
  ALTER COLUMN username SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_child_profiles_username ON child_profiles(username);
