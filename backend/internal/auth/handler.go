package auth

import (
	"time"
	"wapkidlearn/pkg/response"
	"wapkidlearn/pkg/validator"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(router fiber.Router) {
	router.Post("/login", h.Login)
	router.Post("/child/login", h.ChildLogin)
	router.Post("/refresh", h.Refresh)
	router.Post("/logout", h.Logout)
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

	setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return response.OK(c, fiber.Map{"role": res.Role, "user_id": res.UserID})
}

type childLoginRequest struct {
	ChildID string `json:"child_id"`
	PIN     string `json:"pin"`
}

func (h *Handler) ChildLogin(c *fiber.Ctx) error {
	var req childLoginRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.ChildID == "" || req.PIN == "" {
		return response.BadRequest(c, "child_id and pin are required")
	}

	res, err := h.svc.ChildLogin(c.Context(), req.ChildID, req.PIN)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}

	setAuthCookies(c, res.AccessToken, res.RefreshToken)
	return response.OK(c, fiber.Map{"role": res.Role, "user_id": res.UserID})
}

func (h *Handler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return response.Unauthorized(c, "missing refresh token")
	}
	accessToken, err := h.svc.Refresh(c.Context(), refreshToken)
	if err != nil {
		return response.Unauthorized(c, err.Error())
	}
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		SameSite: "Strict",
		MaxAge:   int((15 * time.Minute).Seconds()),
	})
	return response.OK(c, fiber.Map{"message": "token refreshed"})
}

func (h *Handler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{Name: "access_token", Value: "", MaxAge: -1, HTTPOnly: true})
	c.Cookie(&fiber.Cookie{Name: "refresh_token", Value: "", MaxAge: -1, HTTPOnly: true})
	return response.OK(c, fiber.Map{"message": "logged out"})
}

func setAuthCookies(c *fiber.Ctx, accessToken, refreshToken string) {
	c.Cookie(&fiber.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		HTTPOnly: true,
		SameSite: "Strict",
		MaxAge:   int((15 * time.Minute).Seconds()),
	})
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		SameSite: "Strict",
		MaxAge:   int((7 * 24 * time.Hour).Seconds()),
	})
}

