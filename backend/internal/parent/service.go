package parent

import (
	"context"
	"encoding/json"
	"errors"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

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
	DisplayName  string `json:"display_name"`
	PIN          string `json:"pin"`
	GradeLevel   int32  `json:"grade_level"`
	Avatar       string `json:"avatar"`
}

type SettingsRequest struct {
	DailyWatchLimitMinutes int32           `json:"daily_watch_limit_minutes"`
	ConversionRate         int32           `json:"conversion_rate"`
	AllowedHours           json.RawMessage `json:"allowed_hours"`
	RequireStudyFirst      bool            `json:"require_study_first"`
	MinStudyMinutes        int32           `json:"min_study_minutes"`
}

type AnalyticsResponse struct {
	Sessions []db.GetChildAnalyticsRow `json:"sessions"`
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
	if req.DisplayName == "" || req.PIN == "" {
		return nil, errors.New("display_name and pin are required")
	}
	if req.GradeLevel < 1 || req.GradeLevel > 6 {
		return nil, errors.New("grade_level must be between 1 and 6")
	}
	if len(req.PIN) != 4 {
		return nil, errors.New("pin must be 4 digits")
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
		`INSERT INTO child_profiles (user_id, parent_id, display_name, pin_hash, grade_level, avatar)
		 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id, parent_id, display_name, pin_hash, grade_level, current_level, is_locked, avatar`,
		childUserID, pid, req.DisplayName, string(pinHash), req.GradeLevel, avatar,
	).Scan(&child.ID, &child.UserID, &child.ParentID, &child.DisplayName, &child.PinHash,
		&child.GradeLevel, &child.CurrentLevel, &child.IsLocked, &child.Avatar)
	if err != nil {
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

func (s *Service) UpdateSettings(ctx context.Context, parentID, childID string, req SettingsRequest) (*db.ParentSetting, error) {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return nil, errors.New("invalid parent_id")
	}
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}

	// Verify ownership
	child, err := s.q.GetChildByID(ctx, cid)
	if err != nil {
		return nil, errors.New("child not found")
	}
	if child.ParentID != pid {
		return nil, errors.New("not authorized for this child")
	}

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
	return &settings, nil
}

func (s *Service) SetLock(ctx context.Context, parentID, childID string, locked bool) error {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return errors.New("invalid parent_id")
	}
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return errors.New("invalid child_id")
	}

	// Verify ownership
	child, err := s.q.GetChildByID(ctx, cid)
	if err != nil {
		return errors.New("child not found")
	}
	if child.ParentID != pid {
		return errors.New("not authorized for this child")
	}

	// Set emergency lock in parent_settings
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

func (s *Service) GetAnalytics(ctx context.Context, parentID, childID string) (*AnalyticsResponse, error) {
	pid, err := pgutil.ParseUUID(parentID)
	if err != nil {
		return nil, errors.New("invalid parent_id")
	}
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}

	// Verify ownership
	child, err := s.q.GetChildByID(ctx, cid)
	if err != nil {
		return nil, errors.New("child not found")
	}
	if child.ParentID != pid {
		return nil, errors.New("not authorized for this child")
	}

	sessions, err := s.q.GetChildAnalytics(ctx, cid)
	if err != nil {
		return nil, err
	}
	return &AnalyticsResponse{Sessions: sessions}, nil
}
