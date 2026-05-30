package admin

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
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

func (s *Service) ListAllVideos(ctx context.Context) ([]db.Video, error) {
	return s.q.GetAllVideos(ctx)
}

func (s *Service) ListPendingVideos(ctx context.Context) ([]db.Video, error) {
	return s.q.ListPendingVideos(ctx)
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

func (s *Service) AddGlobalVideo(ctx context.Context, adminUserID, title, url string) (*db.Video, error) {
	submittedBy, err := pgutil.ParseUUID(adminUserID)
	if err != nil {
		return nil, errors.New("invalid user_id")
	}
	status := "active"
	scope := "global"
	videoType := "youtube"
	if strings.Contains(url, "vimeo") {
		videoType = "vimeo"
	} else if !strings.Contains(url, "youtube") && !strings.Contains(url, "youtu.be") {
		videoType = "mp4"
	}
	v, err := s.q.CreateVideo(ctx, db.CreateVideoParams{
		SubmittedBy: submittedBy,
		Title:       title,
		Url:         url,
		VideoType:   &videoType,
		Scope:       &scope,
		Status:      &status,
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

func (s *Service) PromoteToGlobal(ctx context.Context, videoID string) (*db.Video, error) {
	vid, err := pgutil.ParseUUID(videoID)
	if err != nil {
		return nil, errors.New("invalid video_id")
	}
	scope := "global"
	v, err := s.q.SetVideoScope(ctx, db.SetVideoScopeParams{ID: vid, Scope: &scope})
	if err != nil {
		return nil, err
	}
	v2, err := s.q.ApproveVideo(ctx, v.ID)
	if err != nil {
		return nil, err
	}
	return &v2, nil
}
