package admin

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
	// Users
	router.Get("/users", h.ListUsers)
	router.Patch("/users/:id/toggle", h.ToggleUserActive)

	// Questions
	router.Get("/questions", h.ListQuestions)
	router.Post("/questions", h.CreateQuestion)
	router.Put("/questions/:id", h.UpdateQuestion)
	router.Delete("/questions/:id", h.DeleteQuestion)

	// Videos
	router.Get("/videos", h.ListAllVideos)
	router.Get("/videos/pending", h.ListPendingVideos)
	router.Post("/videos", h.AddVideo)
	router.Delete("/videos/:id", h.DeleteVideo)
	router.Post("/videos/:id/approve", h.ApproveVideo)
	router.Post("/videos/:id/reject", h.RejectVideo)
	router.Post("/videos/:id/promote-global", h.PromoteToGlobal)
}

func (h *Handler) ListUsers(c *fiber.Ctx) error {
	users, err := h.svc.ListUsers(c.Context())
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, users)
}

func (h *Handler) ToggleUserActive(c *fiber.Ctx) error {
	userID := c.Params("id")
	u, err := h.svc.ToggleUserActive(c.Context(), userID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, u)
}

func (h *Handler) ListQuestions(c *fiber.Ctx) error {
	questions, err := h.svc.ListQuestions(c.Context())
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, questions)
}

func (h *Handler) CreateQuestion(c *fiber.Ctx) error {
	var req CreateQuestionRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	q, err := h.svc.CreateQuestion(c.Context(), req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, q)
}

func (h *Handler) UpdateQuestion(c *fiber.Ctx) error {
	questionID := c.Params("id")
	var req CreateQuestionRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	q, err := h.svc.UpdateQuestion(c.Context(), questionID, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, q)
}

func (h *Handler) DeleteQuestion(c *fiber.Ctx) error {
	questionID := c.Params("id")
	if err := h.svc.DeleteQuestion(c.Context(), questionID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"message": "question deactivated"})
}

func (h *Handler) ListAllVideos(c *fiber.Ctx) error {
	videos, err := h.svc.ListAllVideos(c.Context())
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, videos)
}

func (h *Handler) ListPendingVideos(c *fiber.Ctx) error {
	videos, err := h.svc.ListPendingVideos(c.Context())
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, videos)
}

func (h *Handler) ApproveVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	v, err := h.svc.ApproveVideo(c.Context(), videoID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}

func (h *Handler) AddVideo(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	var req struct {
		Title string `json:"title"`
		URL   string `json:"url"`
	}
	if err := c.BodyParser(&req); err != nil || req.Title == "" || req.URL == "" {
		return response.BadRequest(c, "title and url are required")
	}
	v, err := h.svc.AddGlobalVideo(c.Context(), userID, req.Title, req.URL)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, v)
}

func (h *Handler) DeleteVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	if err := h.svc.DeleteVideo(c.Context(), videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"message": "video deleted"})
}

func (h *Handler) RejectVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	var body struct {
		Reason string `json:"reason"`
	}
	_ = c.BodyParser(&body)
	v, err := h.svc.RejectVideo(c.Context(), videoID, body.Reason)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}

func (h *Handler) PromoteToGlobal(c *fiber.Ctx) error {
	videoID := c.Params("id")
	v, err := h.svc.PromoteToGlobal(c.Context(), videoID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}
