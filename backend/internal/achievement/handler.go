package achievement

import (
	"wapkidlearn/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(router fiber.Router) {
	router.Get("/achievements", h.ListAchievements)
}

func (h *Handler) ListAchievements(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	items, err := h.svc.GetAll(c.Context(), childID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, items)
}
