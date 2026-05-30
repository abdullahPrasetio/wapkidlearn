package parent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"
)

var usernameRe = regexp.MustCompile(`^[a-z0-9_]{3,30}$`)

type Service struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{q: db.New(pool), pool: pool}
}

type ChildWithSettings struct {
	db.GetChildrenByParentIDRow
	Settings *db.ParentSetting `json:"settings,omitempty"`
}

type CreateChildRequest struct {
	DisplayName string `json:"display_name"`
	Username    string `json:"username"`
	PIN         string `json:"pin"`
	GradeLevel  int32  `json:"grade_level"`
	Avatar      string `json:"avatar"`
}

type SettingsRequest struct {
	DailyWatchLimitMinutes int32           `json:"daily_watch_limit_minutes"`
	ConversionRate         int32           `json:"conversion_rate"`
	AllowedHours           json.RawMessage `json:"allowed_hours"`
	RequireStudyFirst      bool            `json:"require_study_first"`
	MinStudyMinutes        int32           `json:"min_study_minutes"`
}

type PointsPerDay struct {
	Date   string `json:"date"`
	Points int32  `json:"points"`
}

type WatchTimePerDay struct {
	Date    string `json:"date"`
	Minutes int32  `json:"minutes"`
}

type AccuracyPerTopic struct {
	Topic    string  `json:"topic"`
	Accuracy float64 `json:"accuracy"`
}

type AnalyticsResponse struct {
	PointsPerDay     []PointsPerDay     `json:"points_per_day"`
	WatchTimePerDay  []WatchTimePerDay  `json:"watch_time_per_day"`
	AccuracyPerTopic []AccuracyPerTopic `json:"accuracy_per_topic"`
	CurrentStreak    int32              `json:"current_streak"`
	LongestStreak    int32              `json:"longest_streak"`
}

type ActivityItem struct {
	Type        string `json:"type"` // "game" | "watch"
	Title       string `json:"title"`
	Detail      string `json:"detail"`
	OccurredAt  string `json:"occurred_at"`
}

type ActivityFeedResponse struct {
	Activities []ActivityItem `json:"activities"`
}

func (s *Service) GetChildren(ctx context.Context, parentID string) ([]ChildWithSettings, error) {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return nil, errors.New("invalid parent_id")
	}
	rows, err := s.q.GetChildrenByParentID(ctx, pid)
	if err != nil {
		return nil, err
	}
	result := make([]ChildWithSettings, 0, len(rows))
	for _, r := range rows {
		row := r
		cws := ChildWithSettings{GetChildrenByParentIDRow: row}
		settings, err := s.q.GetParentSettings(ctx, row.ID)
		if err == nil {
			cws.Settings = &settings
		}
		result = append(result, cws)
	}
	return result, nil
}

func (s *Service) CreateChild(ctx context.Context, parentID string, req CreateChildRequest) (*db.ChildProfile, error) {
	if req.DisplayName == "" || req.PIN == "" || req.Username == "" {
		return nil, errors.New("display_name, username, and pin are required")
	}
	if req.GradeLevel < 1 || req.GradeLevel > 6 {
		return nil, errors.New("grade_level must be between 1 and 6")
	}
	if len(req.PIN) != 4 {
		return nil, errors.New("pin must be 4 digits")
	}
	req.Username = strings.ToLower(strings.TrimSpace(req.Username))
	if !usernameRe.MatchString(req.Username) {
		return nil, errors.New("username hanya boleh huruf kecil, angka, dan underscore (3–30 karakter)")
	}

	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return nil, errors.New("invalid parent_id")
	}

	pinHash, err := bcrypt.GenerateFromPassword([]byte(req.PIN), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Create child user (no email/password)
	var childUserID pgtype.UUID
	err = tx.QueryRow(ctx,
		`INSERT INTO users (role) VALUES ('child') RETURNING id`,
	).Scan(&childUserID)
	if err != nil {
		return nil, err
	}

	avatar := req.Avatar
	if avatar == "" {
		avatar = "default"
	}

	// Create child profile
	var child db.ChildProfile
	err = tx.QueryRow(ctx,
		`INSERT INTO child_profiles (user_id, parent_id, display_name, username, pin_hash, grade_level, avatar)
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, user_id, parent_id, display_name, pin_hash, grade_level, current_level, is_locked, avatar, username`,
		childUserID, pid, req.DisplayName, req.Username, string(pinHash), req.GradeLevel, avatar,
	).Scan(&child.ID, &child.UserID, &child.ParentID, &child.DisplayName, &child.PinHash,
		&child.GradeLevel, &child.CurrentLevel, &child.IsLocked, &child.Avatar, &child.Username)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, errors.New("username sudah digunakan, coba yang lain")
		}
		return nil, err
	}

	// Create default parent settings
	_, err = tx.Exec(ctx,
		`INSERT INTO parent_settings (child_id, daily_watch_limit_minutes, conversion_rate, allowed_hours, require_study_first, min_study_minutes)
		 VALUES ($1, 60, 10, '{}', true, 10)`,
		child.ID,
	)
	if err != nil {
		return nil, err
	}

	// Create point wallet
	_, err = tx.Exec(ctx, `INSERT INTO point_wallets (child_id) VALUES ($1)`, child.ID)
	if err != nil {
		return nil, err
	}

	// Create watch wallet
	_, err = tx.Exec(ctx, `INSERT INTO watch_wallets (child_id) VALUES ($1)`, child.ID)
	if err != nil {
		return nil, err
	}

	// Create streak record
	_, err = tx.Exec(ctx, `INSERT INTO streaks (child_id) VALUES ($1) ON CONFLICT (child_id) DO NOTHING`, child.ID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &child, nil
}

type ParentSettingsResponse struct {
	ID                     string          `json:"id"`
	ChildID                string          `json:"child_id"`
	DailyWatchLimitMinutes int32           `json:"daily_watch_limit_minutes"`
	ConversionRate         int32           `json:"conversion_rate"`
	AllowedHours           json.RawMessage `json:"allowed_hours"`
	RequireStudyFirst      bool            `json:"require_study_first"`
	MinStudyMinutes        int32           `json:"min_study_minutes"`
	EmergencyLock          bool            `json:"emergency_lock"`
	UpdatedAt              time.Time       `json:"updated_at"`
}

func (s *Service) GetSettings(ctx context.Context, parentID, childID string) (*ParentSettingsResponse, error) {
	if err := s.verifyOwnership(ctx, parentID, childID); err != nil {
		return nil, err
	}
	cid, _ := pgutil.ParseUUID(childID)
	settings, err := s.q.GetParentSettings(ctx, cid)
	if err != nil {
		return nil, err
	}
	return mapSettingsToResponse(settings), nil
}

func (s *Service) UpdateSettings(ctx context.Context, parentID, childID string, req SettingsRequest) (*ParentSettingsResponse, error) {
	if err := s.verifyOwnership(ctx, parentID, childID); err != nil {
		return nil, err
	}
	cid, _ := pgutil.ParseUUID(childID)

	allowedHours := []byte(req.AllowedHours)
	if len(allowedHours) == 0 {
		allowedHours = []byte("{}")
	}

	settings, err := s.q.UpdateParentSettings(ctx, db.UpdateParentSettingsParams{
		ChildID:                cid,
		DailyWatchLimitMinutes: &req.DailyWatchLimitMinutes,
		ConversionRate:         &req.ConversionRate,
		AllowedHours:           allowedHours,
		RequireStudyFirst:      &req.RequireStudyFirst,
		MinStudyMinutes:        &req.MinStudyMinutes,
	})
	if err != nil {
		return nil, err
	}
	return mapSettingsToResponse(settings), nil
}

func mapSettingsToResponse(s db.ParentSetting) *ParentSettingsResponse {
	res := &ParentSettingsResponse{
		ID:           pgutil.UUIDToString(s.ID),
		ChildID:      pgutil.UUIDToString(s.ChildID),
		AllowedHours: json.RawMessage(s.AllowedHours),
		UpdatedAt:    s.UpdatedAt.Time,
	}
	if s.DailyWatchLimitMinutes != nil {
		res.DailyWatchLimitMinutes = *s.DailyWatchLimitMinutes
	}
	if s.ConversionRate != nil {
		res.ConversionRate = *s.ConversionRate
	}
	if s.RequireStudyFirst != nil {
		res.RequireStudyFirst = *s.RequireStudyFirst
	}
	if s.MinStudyMinutes != nil {
		res.MinStudyMinutes = *s.MinStudyMinutes
	}
	if s.EmergencyLock != nil {
		res.EmergencyLock = *s.EmergencyLock
	}
	return res
}

func (s *Service) SetLock(ctx context.Context, parentID, childID string, locked bool) error {
	if err := s.verifyOwnership(ctx, parentID, childID); err != nil {
		return err
	}
	cid, _ := pgutil.ParseUUID(childID)
	if err := s.q.SetEmergencyLock(ctx, db.SetEmergencyLockParams{
		ChildID:       cid,
		EmergencyLock: &locked,
	}); err != nil {
		return err
	}
	return s.q.SetChildLocked(ctx, db.SetChildLockedParams{
		ID:       cid,
		IsLocked: &locked,
	})
}

func (s *Service) verifyOwnership(ctx context.Context, parentID, childID string) error {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return errors.New("invalid parent_id")
	}
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return errors.New("invalid child_id")
	}
	child, err := s.q.GetChildByID(ctx, cid)
	if err != nil {
		return errors.New("child not found")
	}
	if child.ParentID != pid {
		return errors.New("not authorized for this child")
	}
	return nil
}

// VerifyVideoOwnership memastikan video dimiliki oleh child dari parent yang login.
func (s *Service) VerifyVideoOwnership(ctx context.Context, parentID, videoID string) error {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return errors.New("invalid parent_id")
	}
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return errors.New("invalid video_id")
	}
	var childParentID pgtype.UUID
	err = s.pool.QueryRow(ctx,
		`SELECT cp.parent_id FROM videos v
		 JOIN child_profiles cp ON cp.id = v.child_id
		 WHERE v.id = $1`, vid,
	).Scan(&childParentID)
	if err != nil {
		return errors.New("video not found")
	}
	if childParentID != pid {
		return errors.New("not authorized for this video")
	}
	return nil
}

func (s *Service) GetAnalytics(ctx context.Context, parentID, childID string) (*AnalyticsResponse, error) {
	if err := s.verifyOwnership(ctx, parentID, childID); err != nil {
		return nil, err
	}
	cid, _ := pgutil.ParseUUID(childID)

	sessions, err := s.q.GetChildAnalytics(ctx, cid)
	if err != nil {
		return nil, err
	}

	// points_per_day — aggregate by date
	ppd := map[string]int32{}
	for _, s := range sessions {
		if s.StartedAt.Valid {
			d := s.StartedAt.Time.Format("01/02")
			if s.PointsEarned != nil {
				ppd[d] += *s.PointsEarned
			}
		}
	}
	pointsPerDay := make([]PointsPerDay, 0, len(ppd))
	for d, p := range ppd {
		pointsPerDay = append(pointsPerDay, PointsPerDay{Date: d, Points: p})
	}
	sort.Slice(pointsPerDay, func(i, j int) bool {
		return pointsPerDay[i].Date < pointsPerDay[j].Date
	})

	// watch_time_per_day
	watches, err := s.q.GetWatchHistoriesByChild(ctx, cid)
	if err != nil {
		watches = nil
	}
	wpd := map[string]int32{}
	for _, w := range watches {
		if w.WatchedAt.Valid {
			d := w.WatchedAt.Time.Format("01/02")
			wpd[d] += w.DurationSeconds / 60
		}
	}
	watchPerDay := make([]WatchTimePerDay, 0, len(wpd))
	for d, m := range wpd {
		watchPerDay = append(watchPerDay, WatchTimePerDay{Date: d, Minutes: m})
	}
	sort.Slice(watchPerDay, func(i, j int) bool {
		return watchPerDay[i].Date < watchPerDay[j].Date
	})

	// accuracy_per_topic
	topicRows, err := s.q.GetChildAccuracyPerTopic(ctx, cid)
	if err != nil {
		topicRows = nil
	}
	accuracy := make([]AccuracyPerTopic, 0, len(topicRows))
	for _, t := range topicRows {
		if t.Total > 0 {
			pct := float64(t.Correct) / float64(t.Total) * 100
			accuracy = append(accuracy, AccuracyPerTopic{Topic: t.Topic, Accuracy: math.Round(pct)})
		}
	}

	// streak
	var currentStreak, longestStreak int32
	streak, err := s.q.GetStreakByChild(ctx, cid)
	if err == nil {
		if streak.CurrentStreak != nil {
			currentStreak = *streak.CurrentStreak
		}
		if streak.LongestStreak != nil {
			longestStreak = *streak.LongestStreak
		}
	}

	return &AnalyticsResponse{
		PointsPerDay:     pointsPerDay,
		WatchTimePerDay:  watchPerDay,
		AccuracyPerTopic: accuracy,
		CurrentStreak:    currentStreak,
		LongestStreak:    longestStreak,
	}, nil
}

func (s *Service) GetActivityFeed(ctx context.Context, parentID, childID string) (*ActivityFeedResponse, error) {
	if err := s.verifyOwnership(ctx, parentID, childID); err != nil {
		return nil, err
	}
	cid, _ := pgutil.ParseUUID(childID)

	items := []ActivityItem{}

	sessions, err := s.q.GetChildAnalytics(ctx, cid)
	if err != nil {
		return nil, fmt.Errorf("GetActivityFeed sessions: %w", err)
	}
	wib := time.FixedZone("WIB", 7*3600)
	for _, gs := range sessions {
		if !gs.StartedAt.Valid {
			continue
		}
		correct := int32(0)
		total := int32(0)
		points := int32(0)
		if gs.CorrectCount != nil {
			correct = *gs.CorrectCount
		}
		if gs.TotalQuestions != nil {
			total = *gs.TotalQuestions
		}
		if gs.PointsEarned != nil {
			points = *gs.PointsEarned
		}
		detail := fmt.Sprintf("%d/%d benar, %d poin", correct, total, points)
		items = append(items, ActivityItem{
			Type:       "game",
			Title:      "Main Game",
			Detail:     detail,
			OccurredAt: gs.StartedAt.Time.In(wib).Format("2006-01-02T15:04:05+07:00"),
		})
	}

	watches, err := s.q.GetWatchHistoriesByChild(ctx, cid)
	if err != nil {
		return nil, fmt.Errorf("GetActivityFeed watches: %w", err)
	}
	for _, w := range watches {
		if !w.WatchedAt.Valid {
			continue
		}
		mins := w.DurationSeconds / 60
		detail := fmt.Sprintf("%d menit", mins)
		items = append(items, ActivityItem{
			Type:       "watch",
			Title:      w.Title,
			Detail:     detail,
			OccurredAt: w.WatchedAt.Time.In(wib).Format("2006-01-02T15:04:05+07:00"),
		})
	}

	// sort by time descending
	sort.Slice(items, func(i, j int) bool {
		return items[i].OccurredAt > items[j].OccurredAt
	})

	return &ActivityFeedResponse{Activities: items}, nil
}
