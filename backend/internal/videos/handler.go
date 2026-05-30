package videos

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
	// Video endpoints
	router.Get("/videos", h.ListVideos)
	router.Post("/videos", h.AddVideo)
	router.Patch("/videos/:id", h.EditVideo)
	router.Delete("/videos/:id", h.DeleteVideo)
	router.Patch("/videos/:id/approve", h.ApproveVideo)
	router.Patch("/videos/:id/reject", h.RejectVideo)

	// Watch session endpoints
	router.Post("/watch-sessions", h.StartWatchSession)
	router.Patch("/watch-sessions/:id/heartbeat", h.Heartbeat)
	router.Delete("/watch-sessions/:id", h.TerminateSession)

	// Resume position
	router.Get("/videos/:id/last-position", h.GetLastWatchPosition)
}

func (h *Handler) ListVideos(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	videos, err := h.svc.ListVideos(c.Context(), childID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, videos)
}

func (h *Handler) AddVideo(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok || userID == "" {
		return response.Unauthorized(c, "unauthenticated")
	}
	role, _ := c.Locals("role").(string)

	var req AddVideoRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Title == "" || req.URL == "" {
		return response.BadRequest(c, "title and url are required")
	}

	v, err := h.svc.AddVideo(c.Context(), userID, role, req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, v)
}

func (h *Handler) ApproveVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	v, err := h.svc.ApproveVideo(c.Context(), videoID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}

type rejectRequest struct {
	Reason string `json:"reason"`
}

func (h *Handler) RejectVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	var req rejectRequest
	_ = validator.BindAndValidate(c, &req)
	v, err := h.svc.RejectVideo(c.Context(), videoID, req.Reason)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}

type editVideoRequest struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

func (h *Handler) EditVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	userID, _ := c.Locals("userID").(string)
	role, _ := c.Locals("role").(string)

	var req editVideoRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Title == "" || req.URL == "" {
		return response.BadRequest(c, "title and url are required")
	}

	// parent hanya boleh edit video miliknya sendiri
	if role == "parent" {
		if err := h.svc.VerifyVideoOwnership(c.Context(), userID, videoID); err != nil {
			return response.Forbidden(c, err.Error())
		}
	}

	v, err := h.svc.UpdateVideo(c.Context(), videoID, req.Title, req.URL)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, v)
}

func (h *Handler) DeleteVideo(c *fiber.Ctx) error {
	videoID := c.Params("id")
	if err := h.svc.DeleteVideo(c.Context(), videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"message": "deleted"})
}

func (h *Handler) StartWatchSession(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	var req struct {
		VideoID string `json:"video_id"`
	}
	if err := validator.BindAndValidate(c, &req); err != nil || req.VideoID == "" {
		return response.BadRequest(c, "video_id is required")
	}
	sess, err := h.svc.StartWatchSession(c.Context(), childID, req.VideoID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, sess)
}

func (h *Handler) Heartbeat(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	sessionID := c.Params("id")
	var req struct {
		ElapsedSeconds  int32 `json:"elapsed_seconds"`
		PositionSeconds int32 `json:"position_seconds"`
	}
	if err := validator.BindAndValidate(c, &req); err != nil || req.ElapsedSeconds <= 0 {
		return response.BadRequest(c, "elapsed_seconds must be positive")
	}
	res, err := h.svc.Heartbeat(c.Context(), childID, sessionID, req.ElapsedSeconds, req.PositionSeconds)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, res)
}

func (h *Handler) GetLastWatchPosition(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	videoID := c.Params("id")
	pos, err := h.svc.GetLastWatchPosition(c.Context(), childID, videoID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, fiber.Map{"position_seconds": pos})
}

func (h *Handler) TerminateSession(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	sessionID := c.Params("id")
	if err := h.svc.TerminateSession(c.Context(), childID, sessionID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"message": "session terminated"})
}
