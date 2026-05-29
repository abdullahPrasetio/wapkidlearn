-- Seed: sample data for development
-- Run ONLY in dev environment, not production

-- Super Admin user (password: admin123 — change immediately)
INSERT INTO users (email, password_hash, role) VALUES
  ('admin@wapkidlearn.local', '$2a$12$placeholder_bcrypt_hash_admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Sample math questions (grade 1, topic: addition)
INSERT INTO math_questions (grade_level, topic, difficulty, question_text, options, correct_answer, explanation) VALUES
  (1, 'penjumlahan', 1, '3 + 4 = ?',
   '["5", "6", "7", "8"]', '7', '3 ditambah 4 sama dengan 7'),
  (1, 'penjumlahan', 1, '5 + 2 = ?',
   '["6", "7", "8", "9"]', '7', '5 ditambah 2 sama dengan 7'),
  (1, 'pengurangan', 1, '9 - 3 = ?',
   '["4", "5", "6", "7"]', '6', '9 dikurangi 3 sama dengan 6'),
  (2, 'perkalian', 2, '4 × 3 = ?',
   '["10", "11", "12", "13"]', '12', '4 dikali 3 sama dengan 12'),
  (2, 'perkalian', 2, '6 × 5 = ?',
   '["25", "28", "30", "32"]', '30', '6 dikali 5 sama dengan 30'),
  (3, 'perkalian', 3, '8 × 7 = ?',
   '["54", "56", "58", "60"]', '56', '8 dikali 7 sama dengan 56'),
  (3, 'pembagian', 3, '48 ÷ 6 = ?',
   '["6", "7", "8", "9"]', '8', '48 dibagi 6 sama dengan 8');
