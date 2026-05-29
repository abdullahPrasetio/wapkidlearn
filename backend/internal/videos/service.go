package videos

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"time"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var allowedDomains = map[string]bool{
	"youtube.com":     true,
	"www.youtube.com": true,
	"youtu.be":        true,
	"vimeo.com":       true,
	"www.vimeo.com":   true,
}

type AddVideoRequest struct {
	Title        string  `json:"title"`
	URL          string  `json:"url"`
	ThumbnailURL string  `json:"thumbnail_url"`
	Scope        string  `json:"scope"` // "global" or "child_specific"
	ChildID      string  `json:"child_id"`
}

type WatchSessionResponse struct {
	ID               string `json:"id"`
	VideoID          string `json:"video_id"`
	VideoURL         string `json:"video_url"`
	VideoTitle       string `json:"video_title"`
	VideoType        string `json:"video_type"`
	AllocatedSeconds int32  `json:"allocated_seconds"`
}

type HeartbeatResponse struct {
	ConsumedSeconds  int32  `json:"consumed_seconds"`
	RemainingSeconds int32  `json:"remaining_seconds"`
}

type Service struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{q: db.New(pool), pool: pool}
}

func (s *Service) ListVideos(ctx context.Context, childID string) ([]db.Video, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	return s.q.GetVideosByChild(ctx, cid)
}

func (s *Service) AddVideo(ctx context.Context, submittedByUserID string, role string, req AddVideoRequest) (*db.Video, error) {
	if req.Title == "" || req.URL == "" {
		return nil, errors.New("title and url are required")
	}

	videoType, processedURL, err := parseVideoURL(req.URL)
	if err != nil {
		return nil, err
	}

	submittedBy, err := pgutil.ParseUUID(submittedByUserID)
	if err != nil {
		return nil, errors.New("invalid user_id")
	}

	status := "pending"
	if role == "super_admin" {
		status = "active"
	}

	scope := req.Scope
	if scope == "" {
		scope = "child_specific"
	}

	var childUUID pgtype.UUID
	if req.ChildID != "" {
		cid, err := pgutil.ParseUUID(req.ChildID)
		if err != nil {
			return nil, errors.New("invalid child_id")
		}
		childUUID = cid
	}

	thumbnailURL := pgutil.PtrString(req.ThumbnailURL)

	v, err := s.q.CreateVideo(ctx, db.CreateVideoParams{
		SubmittedBy:  submittedBy,
		Title:        req.Title,
		Url:          processedURL,
		ThumbnailUrl: thumbnailURL,
		VideoType:    &videoType,
		Scope:        &scope,
		ChildID:      childUUID,
		Status:       &status,
	})
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (s *Service) ApproveVideo(ctx context.Context, videoID string) (*db.Video, error) {
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return nil, errors.New("invalid video_id")
	}
	v, err := s.q.ApproveVideo(ctx, vid)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (s *Service) RejectVideo(ctx context.Context, videoID, reason string) (*db.Video, error) {
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return nil, errors.New("invalid video_id")
	}
	v, err := s.q.RejectVideo(ctx, db.RejectVideoParams{
		ID:              vid,
		RejectionReason: pgutil.PtrString(reason),
	})
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (s *Service) DeleteVideo(ctx context.Context, videoID string) error {
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return errors.New("invalid video_id")
	}
	return s.q.DeleteVideo(ctx, vid)
}

func (s *Service) StartWatchSession(ctx context.Context, childID, videoID string) (*WatchSessionResponse, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return nil, errors.New("invalid video_id")
	}

	// Check emergency lock + allowed hours
	settings, err := s.getParentSettings(ctx, cid)
	if err == nil {
		if settings.EmergencyLock {
			return nil, errors.New("parental emergency lock is active")
		}
		if !isWithinAllowedHours(settings.AllowedHours) {
			return nil, errors.New("outside allowed watch hours")
		}
	}

	// Check no active session
	_, err = s.q.GetActiveWatchSession(ctx, cid)
	if err == nil {
		return nil, errors.New("active watch session already exists")
	}

	// Check watch wallet balance
	wallet, err := s.q.GetWatchWalletByChildID(ctx, cid)
	if err != nil {
		return nil, errors.New("watch wallet not found")
	}
	balSec := int32(0)
	if wallet.BalanceSeconds != nil {
		balSec = *wallet.BalanceSeconds
	}
	if balSec <= 0 {
		return nil, errors.New("insufficient watch time balance")
	}

	// Allocate min(balance, daily_limit remaining)
	allocate := balSec
	if settings != nil {
		dailyLimitSeconds := settings.DailyWatchLimitMinutes * 60
		usedToday := int32(0)
		if wallet.UsedTodaySeconds != nil {
			usedToday = *wallet.UsedTodaySeconds
		}
		remaining := dailyLimitSeconds - usedToday
		if remaining <= 0 {
			return nil, errors.New("daily watch limit reached")
		}
		if allocate > remaining {
			allocate = remaining
		}
	}

	session, err := s.q.CreateWatchSession(ctx, db.CreateWatchSessionParams{
		ChildID:          cid,
		VideoID:          vid,
		AllocatedSeconds: allocate,
	})
	if err != nil {
		return nil, err
	}

	// Fetch video details to include URL in response
	var videoURL, videoTitle, videoType string
	row := s.pool.QueryRow(ctx, `SELECT url, title, video_type FROM videos WHERE id = $1`, vid)
	_ = row.Scan(&videoURL, &videoTitle, &videoType)

	return &WatchSessionResponse{
		ID:               pgutil.UUIDToString(session.ID),
		VideoID:          pgutil.UUIDToString(session.VideoID),
		VideoURL:         videoURL,
		VideoTitle:       videoTitle,
		VideoType:        videoType,
		AllocatedSeconds: session.AllocatedSeconds,
	}, nil
}

func (s *Service) Heartbeat(ctx context.Context, childID, sessionID string, elapsed int32) (*HeartbeatResponse, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	sid, err := pgutil.ParseUUID(sessionID)
	if err != nil {
		return nil, errors.New("invalid session_id")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Deduct watch time from wallet (SELECT FOR UPDATE implicitly via UPDATE + balance check)
	var watchBalance int32
	err = tx.QueryRow(ctx,
		`UPDATE watch_wallets SET balance_seconds = balance_seconds - $2, used_today_seconds = used_today_seconds + $2
		 WHERE child_id = $1 AND balance_seconds >= $2 RETURNING balance_seconds`,
		cid, elapsed,
	).Scan(&watchBalance)
	if err != nil {
		return nil, errors.New("insufficient watch time")
	}

	// Update session heartbeat
	var allocatedSeconds, consumedSeconds int32
	var statusVal *string
	err = tx.QueryRow(ctx,
		`UPDATE watch_sessions SET consumed_seconds = consumed_seconds + $2, last_heartbeat_at = NOW()
		 WHERE id = $1 AND status = 'active' RETURNING allocated_seconds, consumed_seconds, status`,
		sid, elapsed,
	).Scan(&allocatedSeconds, &consumedSeconds, &statusVal)
	if err != nil {
		return nil, errors.New("session not found or already ended")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	remaining := allocatedSeconds - consumedSeconds
	if remaining < 0 {
		remaining = 0
	}

	if remaining == 0 {
		_ = s.TerminateSession(ctx, childID, sessionID, "completed")
	}

	return &HeartbeatResponse{
		ConsumedSeconds:  consumedSeconds,
		RemainingSeconds: remaining,
	}, nil
}

func (s *Service) TerminateSession(ctx context.Context, childID, sessionID string, status ...string) error {
	sid, err := pgutil.ParseUUID(sessionID)
	if err != nil {
		return errors.New("invalid session_id")
	}
	st := "terminated"
	if len(status) > 0 && status[0] != "" {
		st = status[0]
	}
	session, err := s.q.TerminateWatchSession(ctx, db.TerminateWatchSessionParams{
		ID:     sid,
		Status: &st,
	})
	if err != nil {
		return err
	}

	// Create watch history
	cid, _ := pgutil.ParseUUID(childID)
	consumed := int32(0)
	if session.ConsumedSeconds != nil {
		consumed = *session.ConsumedSeconds
	}
	_ = s.q.CreateWatchHistory(ctx, db.CreateWatchHistoryParams{
		ChildID:         cid,
		VideoID:         session.VideoID,
		SessionID:       session.ID,
		DurationSeconds: consumed,
	})
	return nil
}

// parseVideoURL validates and normalises a video URL.
func parseVideoURL(rawURL string) (videoType, processedURL string, err error) {
	u, err := url.Parse(rawURL)
	if err != nil || u.Host == "" {
		return "", "", errors.New("invalid URL")
	}
	host := strings.ToLower(u.Host)

	switch {
	case host == "youtu.be":
		videoID := strings.TrimPrefix(u.Path, "/")
		return "youtube", "https://youtube.com/embed/" + videoID + "?autoplay=1", nil

	case host == "youtube.com" || host == "www.youtube.com":
		videoID := u.Query().Get("v")
		if videoID == "" {
			return "", "", errors.New("invalid YouTube URL")
		}
		return "youtube", "https://youtube.com/embed/" + videoID + "?autoplay=1", nil

	case host == "vimeo.com" || host == "www.vimeo.com":
		videoID := strings.TrimPrefix(u.Path, "/")
		return "vimeo", "https://player.vimeo.com/video/" + videoID, nil

	default:
		if strings.HasSuffix(strings.ToLower(u.Path), ".mp4") {
			return "mp4", rawURL, nil
		}
		return "", "", errors.New("URL domain not allowed; use YouTube, Vimeo, or a direct .mp4 link")
	}
}

type parentSettingsRow struct {
	EmergencyLock          bool
	AllowedHours           []byte
	DailyWatchLimitMinutes int32
}

func (s *Service) getParentSettings(ctx context.Context, childID pgtype.UUID) (*parentSettingsRow, error) {
	row := s.pool.QueryRow(ctx, `
		SELECT emergency_lock, allowed_hours, daily_watch_limit_minutes
		FROM parent_settings WHERE child_id = (
			SELECT id FROM child_profiles WHERE id = $1
		)`, childID)
	var ps parentSettingsRow
	var allowedHoursJSON []byte
	if err := row.Scan(&ps.EmergencyLock, &allowedHoursJSON, &ps.DailyWatchLimitMinutes); err != nil {
		return nil, err
	}
	ps.AllowedHours = allowedHoursJSON
	return &ps, nil
}

func isWithinAllowedHours(allowedHoursJSON []byte) bool {
	// If allowed_hours is empty or {}, all hours are allowed
	if len(allowedHoursJSON) == 0 || string(allowedHoursJSON) == "{}" || string(allowedHoursJSON) == "null" {
		return true
	}
	hour := time.Now().Hour()
	_ = hour
	// TODO: parse allowed_hours JSON {"0": true, "1": true, ...} for full implementation
	return true
}
