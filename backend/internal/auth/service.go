package auth

import (
	"context"
	"errors"
	"time"

	db "wapkidlearn/internal/database/queries"
	pkgjwt "wapkidlearn/pkg/jwt"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	pool      *pgxpool.Pool
	q         *db.Queries
	jwtSecret string
}

func NewService(pool *pgxpool.Pool, jwtSecret string) *Service {
	return &Service{
		pool:      pool,
		q:         db.New(pool),
		jwtSecret: jwtSecret,
	}
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Role         string `json:"role"`
	UserID       string `json:"user_id"`
}

// Login authenticates a parent or admin user with email + password.
func (s *Service) Login(ctx context.Context, email, password string) (*LoginResponse, error) {
	user, err := s.q.GetUserByEmail(ctx, &email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if user.IsActive != nil && !*user.IsActive {
		return nil, errors.New("account is disabled")
	}
	if user.PasswordHash == nil {
		return nil, errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	userID := pgutil.UUIDToString(user.ID)
	accessToken, err := pkgjwt.Generate(userID, user.Role, nil, s.jwtSecret, 15*time.Minute)
	if err != nil {
		return nil, err
	}
	refreshToken, err := pkgjwt.Generate(userID, user.Role, nil, s.jwtSecret, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}
	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Role:         user.Role,
		UserID:       userID,
	}, nil
}

// ChildLogin authenticates a child using username + PIN.
func (s *Service) ChildLogin(ctx context.Context, username, pin string) (*LoginResponse, error) {
	child, err := s.q.GetChildByUsername(ctx, username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(child.PinHash), []byte(pin)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	// Fetch parent settings to check locks — safe-fail: jika gagal baca, anggap terkunci
	settings, err := s.q.GetParentSettings(ctx, child.ID)
	if err != nil {
		return nil, errors.New("account locked by parent")
	}
	if settings.EmergencyLock != nil && *settings.EmergencyLock {
		return nil, errors.New("account locked by parent")
	}
	if child.IsLocked != nil && *child.IsLocked {
		return nil, errors.New("account is locked")
	}

	userIDStr := pgutil.UUIDToString(child.UserID)
	childIDStr := pgutil.UUIDToString(child.ID)
	accessToken, err := pkgjwt.Generate(userIDStr, "child", &childIDStr, s.jwtSecret, 15*time.Minute)
	if err != nil {
		return nil, err
	}
	refreshToken, err := pkgjwt.Generate(userIDStr, "child", &childIDStr, s.jwtSecret, 7*24*time.Hour)
	if err != nil {
		return nil, err
	}
	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Role:         "child",
		UserID:       userIDStr,
	}, nil
}

// Refresh validates a refresh token and issues a new access token + rotated refresh token.
func (s *Service) Refresh(ctx context.Context, refreshToken string) (accessToken, newRefreshToken string, err error) {
	claims, err := pkgjwt.Parse(refreshToken, s.jwtSecret)
	if err != nil {
		return "", "", errors.New("invalid refresh token")
	}

	// [B3] Cek lock status untuk child — cegah bypass emergency lock via refresh
	if claims.Role == "child" && claims.ChildID != nil {
		childUUID, parseErr := parseUUID(*claims.ChildID)
		if parseErr != nil {
			return "", "", errors.New("invalid token claims")
		}
		child, childErr := s.q.GetChildByID(ctx, childUUID)
		if childErr != nil {
			return "", "", errors.New("account not found")
		}
		if child.IsLocked != nil && *child.IsLocked {
			return "", "", errors.New("account is locked")
		}
		settings, settingsErr := s.q.GetParentSettings(ctx, child.ID)
		if settingsErr == nil && settings.EmergencyLock != nil && *settings.EmergencyLock {
			return "", "", errors.New("account locked by parent")
		}
	}

	accessToken, err = pkgjwt.Generate(claims.UserID, claims.Role, claims.ChildID, s.jwtSecret, 15*time.Minute)
	if err != nil {
		return "", "", err
	}
	newRefreshToken, err = pkgjwt.Generate(claims.UserID, claims.Role, claims.ChildID, s.jwtSecret, 7*24*time.Hour)
	if err != nil {
		return "", "", err
	}
	return accessToken, newRefreshToken, nil
}
