-- =============================================================================
-- SEED DATA — Development Only
-- Jalankan: make seed
-- JANGAN dijalankan di production
-- =============================================================================
-- Akun default:
--   Super Admin : admin@wapkidlearn.local  / admin123
--   Parent      : parent@wapkidlearn.local / parent123
--   Anak 1 PIN  : 1234  (Budi, kelas 2)
--   Anak 2 PIN  : 5678  (Sari, kelas 1)
-- =============================================================================

-- ─── 1. Users ─────────────────────────────────────────────────────────────────

INSERT INTO users (id, email, password_hash, role) VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@wapkidlearn.local',
   '$2a$12$S4jdpLTicPwXDvIG7Rq.B.0Ee1GJyYqxnSCMC59cidKERqEIDqHzS',
   'super_admin'),

  ('00000000-0000-0000-0000-000000000002',
   'parent@wapkidlearn.local',
   '$2a$12$x5pTTA.aVqrxDlP0YYZNde3vrR260y1opbWeGMgtG2e1ZbXXkLKGe',
   'parent'),

  -- Anak tidak punya email/password — login via PIN
  ('00000000-0000-0000-0000-000000000010', NULL, NULL, 'child'),
  ('00000000-0000-0000-0000-000000000011', NULL, NULL, 'child')

ON CONFLICT (id) DO NOTHING;

-- ─── 2. Parent Profile ────────────────────────────────────────────────────────

INSERT INTO parent_profiles (id, user_id, full_name, phone) VALUES
  ('00000000-0000-0000-0001-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'Bapak Adi Santoso',
   '081234567890')
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Child Profiles ────────────────────────────────────────────────────────
-- pin_hash '1234' = $2a$12$tAhOvJ/LY.S.zhyKm6UHPurZggDDYHC36M2iFxAJpVNcZYL9PDabW
-- pin_hash '5678' = $2a$12$gfqRT2zVC1FR6xGXp5yASuUSy8q/ze72pqHq68OFhmJjguXyTu3Tm

INSERT INTO child_profiles (id, user_id, parent_id, display_name, pin_hash, grade_level, current_level, avatar) VALUES
  ('00000000-0000-0000-0002-000000000001',
   '00000000-0000-0000-0000-000000000010',
   '00000000-0000-0000-0000-000000000002',
   'Budi',
   '$2a$12$tAhOvJ/LY.S.zhyKm6UHPurZggDDYHC36M2iFxAJpVNcZYL9PDabW',
   2, 1, 'fox'),

  ('00000000-0000-0000-0002-000000000002',
   '00000000-0000-0000-0000-000000000011',
   '00000000-0000-0000-0000-000000000002',
   'Sari',
   '$2a$12$gfqRT2zVC1FR6xGXp5yASuUSy8q/ze72pqHq68OFhmJjguXyTu3Tm',
   1, 1, 'bunny')

ON CONFLICT (id) DO NOTHING;

-- ─── 4. Parent Settings ───────────────────────────────────────────────────────

INSERT INTO parent_settings (child_id, daily_watch_limit_minutes, conversion_rate, allowed_hours, require_study_first, min_study_minutes, emergency_lock) VALUES
  ('00000000-0000-0000-0002-000000000001',
   60, 10,
   '{"mon":["15:00","20:00"],"tue":["15:00","20:00"],"wed":["15:00","20:00"],"thu":["15:00","20:00"],"fri":["15:00","21:00"],"sat":["09:00","21:00"],"sun":["09:00","21:00"]}',
   true, 10, false),

  ('00000000-0000-0000-0002-000000000002',
   45, 10,
   '{"mon":["15:00","19:00"],"tue":["15:00","19:00"],"wed":["15:00","19:00"],"thu":["15:00","19:00"],"fri":["15:00","20:00"],"sat":["09:00","20:00"],"sun":["09:00","20:00"]}',
   true, 10, false)

ON CONFLICT (child_id) DO NOTHING;

-- ─── 5. Point Wallets ─────────────────────────────────────────────────────────

INSERT INTO point_wallets (child_id, balance, lifetime_earned) VALUES
  ('00000000-0000-0000-0002-000000000001', 50, 50),
  ('00000000-0000-0000-0002-000000000002', 20, 20)
ON CONFLICT (child_id) DO NOTHING;

-- ─── 6. Watch Wallets ─────────────────────────────────────────────────────────

INSERT INTO watch_wallets (child_id, balance_seconds, used_today_seconds) VALUES
  ('00000000-0000-0000-0002-000000000001', 600, 0),  -- 10 menit tersisa
  ('00000000-0000-0000-0002-000000000002', 0,   0)
ON CONFLICT (child_id) DO NOTHING;

-- ─── 7. Streaks ───────────────────────────────────────────────────────────────

INSERT INTO streaks (child_id, current_streak, longest_streak, last_activity_date) VALUES
  ('00000000-0000-0000-0002-000000000001', 3, 3, CURRENT_DATE - 1),
  ('00000000-0000-0000-0002-000000000002', 0, 0, NULL)
ON CONFLICT (child_id) DO NOTHING;

-- ─── 8. Math Questions ────────────────────────────────────────────────────────

INSERT INTO math_questions (grade_level, topic, difficulty, question_text, options, correct_answer, explanation) VALUES
  -- Kelas 1 — Penjumlahan (difficulty 1)
  (1, 'penjumlahan', 1, '3 + 4 = ?',    '["5","6","7","8"]',        '7',  '3 ditambah 4 = 7'),
  (1, 'penjumlahan', 1, '5 + 2 = ?',    '["6","7","8","9"]',        '7',  '5 ditambah 2 = 7'),
  (1, 'penjumlahan', 1, '6 + 3 = ?',    '["7","8","9","10"]',       '9',  '6 ditambah 3 = 9'),
  (1, 'penjumlahan', 1, '8 + 1 = ?',    '["7","8","9","10"]',       '9',  '8 ditambah 1 = 9'),
  (1, 'penjumlahan', 1, '4 + 4 = ?',    '["6","7","8","9"]',        '8',  '4 ditambah 4 = 8'),

  -- Kelas 1 — Pengurangan (difficulty 1)
  (1, 'pengurangan', 1, '9 - 3 = ?',    '["4","5","6","7"]',        '6',  '9 dikurangi 3 = 6'),
  (1, 'pengurangan', 1, '7 - 2 = ?',    '["3","4","5","6"]',        '5',  '7 dikurangi 2 = 5'),
  (1, 'pengurangan', 1, '10 - 4 = ?',   '["4","5","6","7"]',        '6',  '10 dikurangi 4 = 6'),
  (1, 'pengurangan', 1, '8 - 5 = ?',    '["2","3","4","5"]',        '3',  '8 dikurangi 5 = 3'),
  (1, 'pengurangan', 1, '6 - 1 = ?',    '["3","4","5","6"]',        '5',  '6 dikurangi 1 = 5'),

  -- Kelas 2 — Perkalian (difficulty 2)
  (2, 'perkalian', 2, '4 × 3 = ?',      '["10","11","12","13"]',    '12', '4 dikali 3 = 12'),
  (2, 'perkalian', 2, '6 × 5 = ?',      '["25","28","30","32"]',    '30', '6 dikali 5 = 30'),
  (2, 'perkalian', 2, '3 × 7 = ?',      '["18","20","21","24"]',    '21', '3 dikali 7 = 21'),
  (2, 'perkalian', 2, '9 × 2 = ?',      '["16","17","18","19"]',    '18', '9 dikali 2 = 18'),
  (2, 'perkalian', 2, '5 × 5 = ?',      '["20","23","25","27"]',    '25', '5 dikali 5 = 25'),

  -- Kelas 2 — Penjumlahan dua digit (difficulty 2)
  (2, 'penjumlahan', 2, '23 + 14 = ?',  '["35","36","37","38"]',    '37', '23 ditambah 14 = 37'),
  (2, 'penjumlahan', 2, '45 + 32 = ?',  '["75","77","78","80"]',    '77', '45 ditambah 32 = 77'),
  (2, 'pengurangan', 2, '50 - 18 = ?',  '["30","31","32","33"]',    '32', '50 dikurangi 18 = 32'),
  (2, 'pengurangan', 2, '63 - 27 = ?',  '["34","35","36","37"]',    '36', '63 dikurangi 27 = 36'),

  -- Kelas 3 — Perkalian & Pembagian (difficulty 3)
  (3, 'perkalian', 3, '8 × 7 = ?',      '["54","56","58","60"]',    '56', '8 dikali 7 = 56'),
  (3, 'perkalian', 3, '9 × 6 = ?',      '["52","54","56","58"]',    '54', '9 dikali 6 = 54'),
  (3, 'pembagian', 3, '48 ÷ 6 = ?',     '["6","7","8","9"]',        '8',  '48 dibagi 6 = 8'),
  (3, 'pembagian', 3, '56 ÷ 7 = ?',     '["6","7","8","9"]',        '8',  '56 dibagi 7 = 8'),
  (3, 'pembagian', 3, '72 ÷ 9 = ?',     '["7","8","9","10"]',       '8',  '72 dibagi 9 = 8'),

  -- Kelas 3 — Penjumlahan tiga digit (difficulty 3)
  (3, 'penjumlahan', 3, '125 + 236 = ?','["359","360","361","362"]', '361','125 ditambah 236 = 361'),
  (3, 'pengurangan', 3, '500 - 173 = ?','["325","326","327","328"]', '327','500 dikurangi 173 = 327'),

  -- ── Tambahan agar total 50 soal ──────────────────────────────────────────────

  -- Kelas 1 — Penjumlahan lanjutan (difficulty 1)
  (1, 'penjumlahan', 1, '2 + 7 = ?',    '["7","8","9","10"]',       '9',  '2 ditambah 7 = 9'),
  (1, 'penjumlahan', 1, '1 + 9 = ?',    '["8","9","10","11"]',      '10', '1 ditambah 9 = 10'),
  (1, 'penjumlahan', 1, '5 + 5 = ?',    '["8","9","10","11"]',      '10', '5 ditambah 5 = 10'),

  -- Kelas 1 — Pengurangan lanjutan (difficulty 1)
  (1, 'pengurangan', 1, '10 - 3 = ?',   '["5","6","7","8"]',        '7',  '10 dikurangi 3 = 7'),
  (1, 'pengurangan', 1, '9 - 4 = ?',    '["4","5","6","7"]',        '5',  '9 dikurangi 4 = 5'),
  (1, 'pengurangan', 1, '8 - 3 = ?',    '["4","5","6","7"]',        '5',  '8 dikurangi 3 = 5'),

  -- Kelas 2 — Perkalian lanjutan (difficulty 2)
  (2, 'perkalian', 2, '7 × 4 = ?',      '["24","26","28","30"]',    '28', '7 dikali 4 = 28'),
  (2, 'perkalian', 2, '8 × 3 = ?',      '["22","23","24","25"]',    '24', '8 dikali 3 = 24'),
  (2, 'perkalian', 2, '6 × 6 = ?',      '["34","35","36","37"]',    '36', '6 dikali 6 = 36'),
  (2, 'perkalian', 2, '2 × 9 = ?',      '["16","17","18","19"]',    '18', '2 dikali 9 = 18'),

  -- Kelas 2 — Pembagian dasar (difficulty 2)
  (2, 'pembagian', 2, '20 ÷ 4 = ?',     '["4","5","6","7"]',        '5',  '20 dibagi 4 = 5'),
  (2, 'pembagian', 2, '18 ÷ 3 = ?',     '["5","6","7","8"]',        '6',  '18 dibagi 3 = 6'),
  (2, 'pembagian', 2, '24 ÷ 6 = ?',     '["3","4","5","6"]',        '4',  '24 dibagi 6 = 4'),
  (2, 'pembagian', 2, '30 ÷ 5 = ?',     '["5","6","7","8"]',        '6',  '30 dibagi 5 = 6'),

  -- Kelas 3 — Perkalian lanjutan (difficulty 3)
  (3, 'perkalian', 3, '7 × 8 = ?',      '["54","55","56","57"]',    '56', '7 dikali 8 = 56'),
  (3, 'perkalian', 3, '12 × 5 = ?',     '["55","58","60","62"]',    '60', '12 dikali 5 = 60'),
  (3, 'perkalian', 3, '11 × 7 = ?',     '["75","77","78","80"]',    '77', '11 dikali 7 = 77'),

  -- Kelas 3 — Pembagian lanjutan (difficulty 3)
  (3, 'pembagian', 3, '81 ÷ 9 = ?',     '["7","8","9","10"]',       '9',  '81 dibagi 9 = 9'),
  (3, 'pembagian', 3, '64 ÷ 8 = ?',     '["6","7","8","9"]',        '8',  '64 dibagi 8 = 8'),
  (3, 'pembagian', 3, '90 ÷ 10 = ?',    '["7","8","9","10"]',       '9',  '90 dibagi 10 = 9'),

  -- Kelas 3 — Penjumlahan & Pengurangan tiga digit lanjutan (difficulty 3)
  (3, 'penjumlahan', 3, '347 + 215 = ?','["560","561","562","563"]', '562','347 ditambah 215 = 562'),
  (3, 'pengurangan', 3, '800 - 345 = ?','["453","454","455","456"]', '455','800 dikurangi 345 = 455'),

  -- Kelas 3 — Soal cerita sederhana (difficulty 4)
  (3, 'perkalian', 4, 'Ada 6 kotak, tiap kotak berisi 8 pensil. Berapa total pensil?',
   '["42","46","48","50"]', '48', '6 × 8 = 48 pensil'),
  (3, 'pembagian', 4, '42 kue dibagi rata ke 7 piring. Berapa kue per piring?',
   '["5","6","7","8"]',     '6',  '42 ÷ 7 = 6 kue per piring')

ON CONFLICT DO NOTHING;
