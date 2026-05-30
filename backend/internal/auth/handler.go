package auth

import (
	"strings"
	"time"
	"wapkidlearn/pkg/ratelimit"
	"wapkidlearn/pkg/response"
	"wapkidlearn/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc          *Service
	authLimiter  *ratelimit.Limiter
	cookieDomain string // kosong = localhost/dev mode
}

func NewHandler(svc *Service, authLimiter *ratelimit.Limiter, cookieDomain string) *Handler {
	return &Handler{svc: svc, authLimiter: authLimiter, cookieDomain: cookieDomain}
}

func (h *Handler) Register(router fiber.Router) {
	router.Post("/login", h.Login)
	router.Post("/child/login", h.ChildLogin)
	router.Post("/refresh", h.Refresh)
	router.Post("/logout", h.Logout)
	router.Post("/change-password", RequireAuth(h.svc.jwtSecret), h.ChangePassword)
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Email == "" || req.Password == "" {
		return response.BadRequest(c, "email and password are required")
	}

	res, err := h.svc.Login(c.Context(), req.Email, req.Password)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}

	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return response.OK(c, fiber.Map{"role": res.Role, "user_id": res.UserID})
}

type childLoginRequest struct {
	Username string `json:"username"`
	PIN      string `json:"pin"`
}

func (h *Handler) ChildLogin(c *fiber.Ctx) error {
	var req childLoginRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Username == "" || req.PIN == "" {
		return response.BadRequest(c, "username and pin are required")
	}
	req.Username = strings.ToLower(strings.TrimSpace(req.Username))

	if !h.authLimiter.Allow("child_login:"+req.Username, 5, time.Minute) {
		return response.TooManyRequests(c, "too many login attempts, try again later")
	}

	res, err := h.svc.ChildLogin(c.Context(), req.Username, req.PIN)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}

	h.setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return response.OK(c, fiber.Map{"role": res.Role, "user_id": res.UserID})
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return response.Unauthorized(c, "missing refresh token")
	}
	accessToken, newRefreshToken, err := h.svc.Refresh(c.Context(), refreshToken)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}
	h.setAuthCookies(c, accessToken, newRefreshToken)
	return response.OK(c, fiber.Map{"message": "token refreshed"})
}

type changePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h *Handler) ChangePassword(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return response.Unauthorized(c, "unauthorized")
	}
	var req changePasswordRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return response.BadRequest(c, "current_password and new_password are required")
	}
	if err := h.svc.ChangePassword(c.Context(), userID, req.CurrentPassword, req.NewPassword); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"message": "password changed successfully"})
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	h.clearCookie(c, "access_token")
	h.clearCookie(c, "refresh_token")
	return response.OK(c, fiber.Map{"message": "logged out"})
}

func (h *Handler) clearCookie(c *fiber.Ctx, name string) {
	cookie := &fiber.Cookie{Name: name, Value: "", MaxAge: -1, HTTPOnly: true}
	if h.cookieDomain != "" {
		cookie.Secure = true
		cookie.SameSite = "None"
		cookie.Domain = h.cookieDomain
	} else {
		cookie.SameSite = "Lax"
	}
	c.Cookie(cookie)
}

func (h *Handler) setAuthCookies(c *fiber.Ctx, accessToken, refreshToken string) {
	isProd := h.cookieDomain != ""

	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		Secure:   isProd,
		SameSite: map[bool]string{true: "None", false: "Lax"}[isProd],
		Domain:   h.cookieDomain,
		MaxAge:   int((15 * time.Minute).Seconds()),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   isProd,
		SameSite: map[bool]string{true: "None", false: "Lax"}[isProd],
		Domain:   h.cookieDomain,
		MaxAge:   int((7 * 24 * time.Hour).Seconds()),
	})
}

