package game

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
	router.Post("/sessions", h.StartSession)
	router.Get("/sessions/:id/question", h.GetQuestion)
	router.Post("/sessions/:id/answer", h.SubmitAnswer)
	router.Post("/sessions/:id/end", h.EndSession)
	router.Get("/sessions/:id/summary", h.GetSummary)
}

func (h *Handler) StartSession(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	session, err := h.svc.StartSession(c.Context(), childID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.Created(c, session)
}

func (h *Handler) GetQuestion(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	sessionID := c.Params("id")
	q, err := h.svc.GetQuestion(c.Context(), childID, sessionID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, q)
}

func (h *Handler) SubmitAnswer(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	sessionID := c.Params("id")

	var req AnswerRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Nonce == "" || req.SubmittedAnswer == "" {
		return response.BadRequest(c, "nonce and submitted_answer are required")
	}

	res, err := h.svc.SubmitAnswer(c.Context(), childID, sessionID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, res)
}

func (h *Handler) EndSession(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	sessionID := c.Params("id")
	summary, err := h.svc.EndSession(c.Context(), childID, sessionID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, summary)
}

func (h *Handler) GetSummary(c *fiber.Ctx) error {
	return h.EndSession(c) // re-use end session logic for summary
}
