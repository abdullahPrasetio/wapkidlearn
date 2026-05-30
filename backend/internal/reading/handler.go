package reading

import (
	"strconv"
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
	router.Get("/reading/passages", h.GetPassages)
	router.Post("/reading/sessions", h.Submit)
}

// GetPassages returns passages for the child's grade level.
// Query param: grade_level (optional, defaults to 1)
func (h *Handler) GetPassages(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}

	grade, _ := strconv.Atoi(c.Query("grade_level", "1"))
	if grade < 1 || grade > 6 {
		grade = 1
	}

	passages := h.svc.GetPassages(grade)
	return response.OK(c, passages)
}

// Submit records a completed reading session and awards points.
func (h *Handler) Submit(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}

	var req SubmitRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}

	result, err := h.svc.Submit(c.Context(), childID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, result)
}
