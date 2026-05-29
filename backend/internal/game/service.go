package game

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"math"
	"sync"
	"time"
	"wapkidlearn/internal/achievement"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/internal/points"
	"wapkidlearn/pkg/pgutil"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Service struct {
	repo         *Repository
	points       *points.Service
	achievements *achievement.Service
	wg           sync.WaitGroup
}

func NewService(repo *Repository, pointsSvc *points.Service, achievementSvc *achievement.Service) *Service {
	return &Service{repo: repo, points: pointsSvc, achievements: achievementSvc}
}

// Wait blocks until all background achievement goroutines finish. Call on server shutdown.
func (s *Service) Wait() {
	s.wg.Wait()
}

// QuestionResponse is the question returned to the client (without correct_answer).
type QuestionResponse struct {
	SessionID        string      `json:"session_id"`
	QuestionID       string      `json:"question_id"`
	Nonce            string      `json:"nonce"`
	GradeLevel       int32       `json:"grade_level"`
	Topic            string      `json:"topic"`
	Difficulty       int32       `json:"difficulty"`
	QuestionText     string      `json:"question_text"`
	Options          interface{} `json:"options"`
	TimeLimitSeconds int32       `json:"time_limit_seconds"`
}

// AnswerRequest is what the client submits.
type AnswerRequest struct {
	QuestionID      string `json:"question_id"`
	Nonce           string `json:"nonce"`
	SubmittedAnswer string `json:"submitted_answer"`
	TimeTakenSeconds int   `json:"time_taken_seconds"`
}

// AnswerResponse is the result of submitting an answer.
type AnswerResponse struct {
	IsCorrect    bool   `json:"is_correct"`
	PointsEarned int32  `json:"points_earned"`
	Explanation  string `json:"explanation,omitempty"`
	CorrectAnswer string `json:"correct_answer"`
}

// SessionSummary is returned when a session ends.
type SessionSummary struct {
	SessionID       string  `json:"session_id"`
	TotalQuestions  int32   `json:"total_questions"`
	CorrectCount    int32   `json:"correct_count"`
	PointsEarned    int32   `json:"points_earned"`
	DurationSeconds int32   `json:"duration_seconds"`
	Accuracy        float64 `json:"accuracy"`
}

var difficultyMultiplier = []float64{1.0, 1.2, 1.5, 2.0, 2.5}

func computeScore(difficulty int32, streak int32, timeTaken int) int32 {
	idx := int(difficulty) - 1
	if idx < 0 {
		idx = 0
	}
	if idx >= len(difficultyMultiplier) {
		idx = len(difficultyMultiplier) - 1
	}
	multiplier := difficultyMultiplier[idx]

	streakBonus := 0.0
	if streak > 0 {
		streakBonus = math.Min(float64(streak)*0.05, 0.5)
	}

	timeBonus := 0.0
	if timeTaken > 0 && timeTaken <= 10 {
		timeBonus = float64(10-timeTaken) * 0.5
	}

	score := math.Floor(10*multiplier*(1+streakBonus) + timeBonus)
	return int32(score)
}

func (s *Service) StartSession(ctx context.Context, childID string) (*db.GameSession, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	session, err := s.repo.CreateSession(ctx, cid)
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func (s *Service) GetQuestion(ctx context.Context, childID, sessionID string) (*QuestionResponse, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	sid, err := pgutil.ParseUUID(sessionID)
	if err != nil {
		return nil, errors.New("invalid session_id")
	}

	// Verify session belongs to child
	session, err := s.repo.GetSession(ctx, sid)
	if err != nil {
		return nil, errors.New("session not found")
	}
	if session.ChildID != cid {
		return nil, errors.New("session not found")
	}
	if session.EndedAt.Valid {
		return nil, errors.New("session already ended")
	}

	// Get child's grade level from points service (we need child profile — use grade via childID lookup)
	// We'll use grade_level from the child profile; for now derive from child ID via a query
	// For simplicity, we store grade_level lookup in the child profile — fetch it
	gradeLevel, err := s.getChildGradeLevel(ctx, cid)
	if err != nil {
		return nil, err
	}

	question, err := s.repo.GetRandomQuestion(ctx, gradeLevel)
	if err != nil {
		return nil, errors.New("no questions available")
	}

	// Generate nonce
	nonce := uuid.New().String()
	expiresAt := pgtype.Timestamptz{Time: time.Now().Add(NonceExpiry), Valid: true}
	qid := question.ID
	err = s.repo.CreateNonce(ctx, db.CreateNonceParams{
		Nonce:      nonce,
		ChildID:    cid,
		QuestionID: qid,
		ExpiresAt:  expiresAt,
	})
	if err != nil {
		return nil, err
	}

	var opts interface{}
	if len(question.Options) > 0 {
		if err := json.Unmarshal(question.Options, &opts); err != nil {
			opts = []string{}
		}
	} else {
		opts = []string{}
	}

	// Time limit: 30s base, reduced for higher difficulty
	timeLimit := int32(30) - (question.Difficulty-1)*5
	if timeLimit < 10 {
		timeLimit = 10
	}

	return &QuestionResponse{
		SessionID:        sessionID,
		QuestionID:       pgutil.UUIDToString(question.ID),
		Nonce:            nonce,
		GradeLevel:       question.GradeLevel,
		Topic:            question.Topic,
		Difficulty:       question.Difficulty,
		QuestionText:     question.QuestionText,
		Options:          opts,
		TimeLimitSeconds: timeLimit,
	}, nil
}

func (s *Service) SubmitAnswer(ctx context.Context, childID, sessionID string, req AnswerRequest) (*AnswerResponse, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	sid, err := pgutil.ParseUUID(sessionID)
	if err != nil {
		return nil, errors.New("invalid session_id")
	}

	// Validate nonce
	nonceRow, err := s.repo.GetNonce(ctx, req.Nonce)
	if err != nil {
		return nil, errors.New("invalid nonce")
	}
	if nonceRow.Used != nil && *nonceRow.Used {
		return nil, errors.New("nonce already used")
	}
	if time.Now().After(nonceRow.ExpiresAt.Time) {
		return nil, errors.New("nonce expired")
	}
	if nonceRow.ChildID != cid {
		return nil, errors.New("nonce mismatch")
	}

	// Min 2s check
	if req.TimeTakenSeconds < 2 {
		return nil, errors.New("answer submitted too fast")
	}

	// Mark nonce used
	if err := s.repo.MarkNonceUsed(ctx, req.Nonce); err != nil {
		return nil, err
	}

	// Verify session
	session, err := s.repo.GetSession(ctx, sid)
	if err != nil || session.ChildID != cid {
		return nil, errors.New("session not found")
	}

	// Get question
	question, err := s.repo.GetQuestionByID(ctx, nonceRow.QuestionID)
	if err != nil {
		return nil, errors.New("question not found")
	}

	isCorrect := req.SubmittedAnswer == question.CorrectAnswer

	// Get streak
	streak, _ := s.repo.GetStreak(ctx, cid)
	currentStreak := int32(0)
	if streak.CurrentStreak != nil {
		currentStreak = *streak.CurrentStreak
	}
	longestStreak := int32(0)
	if streak.LongestStreak != nil {
		longestStreak = *streak.LongestStreak
	}

	var pointsEarned int32
	if isCorrect {
		pointsEarned = computeScore(question.Difficulty, currentStreak, req.TimeTakenSeconds)
	}

	// Record answer
	qid := question.ID
	submittedAnswer := req.SubmittedAnswer
	timeTaken := int32(req.TimeTakenSeconds)
	_, err = s.repo.CreateAnswer(ctx, db.CreateGameAnswerParams{
		SessionID:        sid,
		QuestionID:       qid,
		SubmittedAnswer:  &submittedAnswer,
		IsCorrect:        isCorrect,
		PointsEarned:     &pointsEarned,
		TimeTakenSeconds: &timeTaken,
		Nonce:            req.Nonce,
	})
	if err != nil {
		return nil, err
	}

	// Update streak
	today := pgtype.Date{Time: time.Now(), Valid: true}
	newStreak := currentStreak
	if isCorrect {
		newStreak++
		if newStreak > longestStreak {
			longestStreak = newStreak
		}
	} else {
		newStreak = 0
	}
	_, _ = s.repo.UpsertStreak(ctx, db.UpsertStreakParams{
		ChildID:          cid,
		CurrentStreak:    &newStreak,
		LongestStreak:    &longestStreak,
		LastActivityDate: today,
	})

	// Credit points
	if isCorrect && pointsEarned > 0 {
		if err := s.points.CreditPoints(ctx, childID, pointsEarned, sessionID+":"+req.Nonce); err != nil {
			log.Printf("[game] CreditPoints failed child=%s session=%s: %v", childID, sessionID, err)
		}
	}

	explanation := ""
	if question.Explanation != nil {
		explanation = *question.Explanation
	}

	return &AnswerResponse{
		IsCorrect:     isCorrect,
		PointsEarned:  pointsEarned,
		Explanation:   explanation,
		CorrectAnswer: question.CorrectAnswer,
	}, nil
}

func (s *Service) EndSession(ctx context.Context, childID, sessionID string) (*SessionSummary, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	sid, err := pgutil.ParseUUID(sessionID)
	if err != nil {
		return nil, errors.New("invalid session_id")
	}

	session, err := s.repo.GetSession(ctx, sid)
	if err != nil || session.ChildID != cid {
		return nil, errors.New("session not found")
	}

	answers, err := s.repo.GetSessionAnswers(ctx, sid)
	if err != nil {
		return nil, errors.New("failed to retrieve session answers")
	}
	var correctCount int32
	var totalPoints int32
	for _, a := range answers {
		if a.IsCorrect {
			correctCount++
		}
		if a.PointsEarned != nil {
			totalPoints += *a.PointsEarned
		}
	}
	totalQuestions := int32(len(answers))

	durationSeconds := int32(time.Since(session.StartedAt.Time).Seconds())

	ended, err := s.repo.EndSession(ctx, db.EndGameSessionParams{
		ID:              sid,
		TotalQuestions:  &totalQuestions,
		CorrectCount:    &correctCount,
		PointsEarned:    &totalPoints,
		DurationSeconds: &durationSeconds,
	})
	if err != nil {
		return nil, err
	}

	accuracy := 0.0
	if totalQuestions > 0 {
		accuracy = float64(correctCount) / float64(totalQuestions) * 100
	}

	// Check and award achievements in background.
	s.wg.Add(1)
	go func() {
		defer s.wg.Done()
		bgCtx := context.Background()
		streak, _ := s.repo.GetStreak(bgCtx, cid)
		currentStreak := int32(0)
		longestStreak := int32(0)
		if streak.CurrentStreak != nil {
			currentStreak = *streak.CurrentStreak
		}
		if streak.LongestStreak != nil {
			longestStreak = *streak.LongestStreak
		}
		lifetimePoints, _ := s.repo.GetLifetimePoints(bgCtx, cid)
		s.achievements.CheckAndAward(bgCtx, achievement.CheckParams{
			ChildID:        cid,
			CurrentStreak:  currentStreak,
			LongestStreak:  longestStreak,
			LifetimePoints: lifetimePoints,
		})
	}()

	derefI32 := func(p *int32) int32 {
		if p == nil {
			return 0
		}
		return *p
	}
	return &SessionSummary{
		SessionID:       pgutil.UUIDToString(ended.ID),
		TotalQuestions:  derefI32(ended.TotalQuestions),
		CorrectCount:    derefI32(ended.CorrectCount),
		PointsEarned:    derefI32(ended.PointsEarned),
		DurationSeconds: derefI32(ended.DurationSeconds),
		Accuracy:        accuracy,
	}, nil
}

func (s *Service) getChildGradeLevel(ctx context.Context, childID pgtype.UUID) (int32, error) {
	gradeLevel, err := s.repo.q.GetChildGradeLevel(ctx, childID)
	if err != nil {
		return 1, nil // default grade 1
	}
	return gradeLevel, nil
}
