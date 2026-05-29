-- name: GetAllAchievementsWithStatus :many
SELECT
  a.id,
  a.code,
  a.name,
  a.description,
  ca.earned_at
FROM achievements a
LEFT JOIN child_achievements ca ON ca.achievement_id = a.id AND ca.child_id = $1
ORDER BY a.name;

-- name: GetAchievementByCode :one
SELECT id FROM achievements WHERE code = $1;

-- name: AwardAchievement :exec
INSERT INTO child_achievements (child_id, achievement_id)
VALUES ($1, $2)
ON CONFLICT (child_id, achievement_id) DO NOTHING;

-- name: GetLifetimePoints :one
SELECT COALESCE(lifetime_earned, 0)::int AS lifetime_earned
FROM point_wallets WHERE child_id = $1;

-- name: HasChildAchievement :one
SELECT EXISTS (
  SELECT 1 FROM child_achievements ca
  JOIN achievements a ON a.id = ca.achievement_id
  WHERE ca.child_id = $1 AND a.code = $2
) AS has_achievement;
