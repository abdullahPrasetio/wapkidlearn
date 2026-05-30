package reading

import (
	"context"
	"errors"
	"math"
	"wapkidlearn/internal/points"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	pool   *pgxpool.Pool
	q      *db.Queries
	points *points.Service
}

func NewService(pool *pgxpool.Pool, pointsSvc *points.Service) *Service {
	return &Service{pool: pool, q: db.New(pool), points: pointsSvc}
}

type SubmitRequest struct {
	PassageID       string  `json:"passage_id" validate:"required"`
	Transcript      string  `json:"transcript"`
	Accuracy        float64 `json:"accuracy"`
	DurationSeconds int32   `json:"duration_seconds"`
}

type SubmitResponse struct {
	SessionID       string  `json:"session_id"`
	Accuracy        float64 `json:"accuracy"`
	PointsEarned    int32   `json:"points_earned"`
	DurationSeconds int32   `json:"duration_seconds"`
}

// Submit records a reading session and awards points.
// Points scale: 0% = 0, 50% = 20, 80% = 50, 100% = 100
func (s *Service) Submit(ctx context.Context, childID string, req SubmitRequest) (*SubmitResponse, error) {
	passage, ok := GetPassageByID(req.PassageID)
	if !ok {
		return nil, errors.New("passage not found")
	}

	accuracy := math.Max(0, math.Min(100, req.Accuracy))
	points := computePoints(accuracy)

	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}

	sess, err := s.q.CreateReadSession(ctx, db.CreateReadSessionParams{
		ChildID:         cid,
		PassageID:       req.PassageID,
		GradeLevel:      int16(passage.GradeLevel),
		Transcript:      req.Transcript,
		Accuracy:        accuracy,
		PointsEarned:    points,
		DurationSeconds: req.DurationSeconds,
	})
	if err != nil {
		return nil, err
	}

	if points > 0 {
		idempotencyKey := "read-" + pgutil.UUIDToString(sess.ID)
		_ = s.points.CreditPoints(ctx, childID, points, idempotencyKey)
	}

	return &SubmitResponse{
		SessionID:       pgutil.UUIDToString(sess.ID),
		Accuracy:        accuracy,
		PointsEarned:    points,
		DurationSeconds: req.DurationSeconds,
	}, nil
}

func (s *Service) GetPassages(gradeLevel int) []Passage {
	return GetPassagesForGrade(gradeLevel)
}

func computePoints(accuracy float64) int32 {
	switch {
	case accuracy >= 90:
		return 80
	case accuracy >= 70:
		return 50
	case accuracy >= 50:
		return 25
	case accuracy >= 30:
		return 10
	default:
		return 0
	}
}
