-- Migration: 012_fix_child_username_backfill
-- Perbaiki username yang dihasilkan backfill 011 berupa string kosong (display_name all-Unicode).
-- Ganti dengan 'child_' + 8 karakter pertama UUID agar tidak collision.

UPDATE child_profiles
   SET username = 'child_' || REPLACE(SUBSTRING(id::text, 1, 8), '-', '')
 WHERE username ~ '^[0-9a-f]{1,4}$'
    OR username = ''
    OR LENGTH(username) < 3;
