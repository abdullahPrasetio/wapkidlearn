package admin

import (
	"context"
	"encoding/json"
	"errors"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{q: db.New(pool), pool: pool}
}

func (s *Service) ListUsers(ctx context.Context) ([]db.User, error) {
	return s.q.ListAllUsers(ctx)
}

func (s *Service) ToggleUserActive(ctx context.Context, userID string) (*db.User, error) {
	uid, err := pgutil.ParseUUID(userID)
	if err != nil {
		return nil, errors.New("invalid user_id")
	}
	u, err := s.q.ToggleUserActive(ctx, uid)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

type QuestionResponse struct {
	ID            string          `json:"id"`
	GradeLevel    int32           `json:"grade_level"`
	Topic         string          `json:"topic"`
	Difficulty    int32           `json:"difficulty"`
	QuestionText  string          `json:"question_text"`
	Options       json.RawMessage `json:"options"`
	CorrectAnswer string          `json:"correct_answer"`
	Explanation   *string         `json:"explanation,omitempty"`
	IsActive      bool            `json:"is_active"`
}

func toQuestionResponse(q db.MathQuestion) QuestionResponse {
	opts := json.RawMessage(q.Options)
	if len(opts) == 0 {
		opts = json.RawMessage("[]")
	}
	isActive := q.IsActive != nil && *q.IsActive
	return QuestionResponse{
		ID:            pgutil.UUIDToString(q.ID),
		GradeLevel:    q.GradeLevel,
		Topic:         q.Topic,
		Difficulty:    q.Difficulty,
		QuestionText:  q.QuestionText,
		Options:       opts,
		CorrectAnswer: q.CorrectAnswer,
		Explanation:   q.Explanation,
		IsActive:      isActive,
	}
}

func (s *Service) ListQuestions(ctx context.Context) ([]QuestionResponse, error) {
	qs, err := s.q.ListAllQuestions(ctx)
	if err != nil {
		return nil, err
	}
	result := make([]QuestionResponse, len(qs))
	for i, q := range qs {
		result[i] = toQuestionResponse(q)
	}
	return result, nil
}

type CreateQuestionRequest struct {
	GradeLevel    int32           `json:"grade_level"`
	Topic         string          `json:"topic"`
	Difficulty    int32           `json:"difficulty"`
	QuestionText  string          `json:"question_text"`
	Options       json.RawMessage `json:"options"`
	CorrectAnswer string          `json:"correct_answer"`
	Explanation   string          `json:"explanation"`
}

func (s *Service) CreateQuestion(ctx context.Context, req CreateQuestionRequest) (*QuestionResponse, error) {
	if req.QuestionText == "" || req.CorrectAnswer == "" || req.Topic == "" {
		return nil, errors.New("question_text, correct_answer, and topic are required")
	}
	explanation := pgutil.PtrString(req.Explanation)
	q, err := s.q.CreateQuestion(ctx, db.CreateQuestionParams{
		GradeLevel:    req.GradeLevel,
		Topic:         req.Topic,
		Difficulty:    req.Difficulty,
		QuestionText:  req.QuestionText,
		Options:       []byte(req.Options),
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   explanation,
	})
	if err != nil {
		return nil, err
	}
	r := toQuestionResponse(q)
	return &r, nil
}

func (s *Service) UpdateQuestion(ctx context.Context, questionID string, req CreateQuestionRequest) (*QuestionResponse, error) {
	qid, err := pgutil.ParseUUID(questionID)
	if err != nil {
		return nil, errors.New("invalid question_id")
	}
	explanation := pgutil.PtrString(req.Explanation)
	q, err := s.q.UpdateQuestion(ctx, db.UpdateQuestionParams{
		ID:            qid,
		GradeLevel:    req.GradeLevel,
		Topic:         req.Topic,
		Difficulty:    req.Difficulty,
		QuestionText:  req.QuestionText,
		Options:       []byte(req.Options),
		CorrectAnswer: req.CorrectAnswer,
		Explanation:   explanation,
	})
	if err != nil {
		return nil, err
	}
	r := toQuestionResponse(q)
	return &r, nil
}

func (s *Service) DeleteQuestion(ctx context.Context, questionID string) error {
	qid, err := pgutil.ParseUUID(questionID)
	if err != nil {
		return errors.New("invalid question_id")
	}
	return s.q.DeleteQuestion(ctx, qid)
}

func (s *Service) ListPendingVideos(ctx context.Context) ([]db.Video, error) {
	return s.q.ListPendingVideos(ctx)
}
