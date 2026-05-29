package parent

import (
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
	router.Get("/children", h.GetChildren)
	router.Post("/children", h.CreateChild)
	router.Put("/children/:id/settings", h.UpdateSettings)
	router.Post("/children/:id/lock", h.SetLock)
	router.Delete("/children/:id/lock", h.Unlock)
	router.Get("/children/:id/analytics", h.GetAnalytics)
}

func (h *Handler) GetChildren(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	children, err := h.svc.GetChildren(c.Context(), parentID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, children)
}

func (h *Handler) CreateChild(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	var req CreateChildRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	child, err := h.svc.CreateChild(c.Context(), parentID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, child)
}

func (h *Handler) UpdateSettings(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	var req SettingsRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	settings, err := h.svc.UpdateSettings(c.Context(), parentID, childID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, settings)
}

func (h *Handler) SetLock(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	if err := h.svc.SetLock(c.Context(), parentID, childID, true); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"locked": true})
}

func (h *Handler) Unlock(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	if err := h.svc.SetLock(c.Context(), parentID, childID, false); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"locked": false})
}

func (h *Handler) GetAnalytics(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	analytics, err := h.svc.GetAnalytics(c.Context(), parentID, childID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, analytics)
}
