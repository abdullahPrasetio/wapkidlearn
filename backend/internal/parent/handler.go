package parent

import (
	"errors"
	"wapkidlearn/internal/videos"
	"wapkidlearn/pkg/response"
	"wapkidlearn/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5"
)

type Handler struct {
	svc     *Service
	videoSvc *videos.Service
}

func NewHandler(svc *Service, videoSvc *videos.Service) *Handler {
	return &Handler{svc: svc, videoSvc: videoSvc}
}

func (h *Handler) Register(router fiber.Router) {
	router.Get("/children", h.GetChildren)
	router.Post("/children", h.CreateChild)
	router.Get("/children/:id/settings", h.GetSettings)
	router.Put("/children/:id/settings", h.UpdateSettings)
	router.Post("/children/:id/lock", h.SetLock)
	router.Delete("/children/:id/lock", h.Unlock)
	router.Get("/children/:id/analytics", h.GetAnalytics)
	router.Get("/children/:id/activity", h.GetActivityFeed)

	// Video management per child (assign/unassign)
	router.Get("/children/:id/videos", h.ListChildVideos)
	router.Post("/children/:id/videos/:videoId/assign", h.AssignVideoToChild)
	router.Delete("/children/:id/videos/:videoId/assign", h.UnassignVideoFromChild)

	// Parent video management
	router.Get("/videos", h.ListMyVideos)
	router.Post("/videos", h.AddVideo)
	router.Get("/videos/global", h.ListGlobalVideos)
	router.Get("/videos/:id/assignments", h.GetVideoAssignments)
	router.Post("/videos/:id/assign-child/:childId", h.AssignVideoToChildByVideoID)
	router.Delete("/videos/:id/assign-child/:childId", h.UnassignVideoFromChildByVideoID)
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

func (h *Handler) GetSettings(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	settings, err := h.svc.GetSettings(c.Context(), parentID, childID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return response.NotFound(c, "settings not found")
		}
		return response.InternalError(c, err)
	}
	return response.OK(c, settings)
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

func (h *Handler) ListChildVideos(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	if err := h.svc.verifyOwnership(c.Context(), parentID, childID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	vs, err := h.videoSvc.ListVideosByChildForParent(c.Context(), childID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, vs)
}

// AddVideo menambah video baru milik parent.
// Jika request_global=true → status pending (tunggu admin approve jadi global).
// Jika tidak → langsung active+private, siap di-assign ke anak sendiri.
func (h *Handler) AddVideo(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	var req videos.AddVideoRequest
	if err := validator.BindAndValidate(c, &req); err != nil || req.Title == "" || req.URL == "" {
		return response.BadRequest(c, "title and url are required")
	}
	v, err := h.videoSvc.AddVideo(c.Context(), parentID, "parent", req)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.Created(c, v)
}

func (h *Handler) AssignVideoToChild(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	videoID := c.Params("videoId")
	if err := h.svc.verifyOwnership(c.Context(), parentID, childID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.videoSvc.AssignVideoToChild(c.Context(), parentID, childID, videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"assigned": true})
}

func (h *Handler) UnassignVideoFromChild(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	videoID := c.Params("videoId")
	if err := h.svc.verifyOwnership(c.Context(), parentID, childID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.videoSvc.UnassignVideoFromChild(c.Context(), childID, videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"unassigned": true})
}

// GetVideoAssignments returns child IDs currently assigned to a parent's video.
func (h *Handler) GetVideoAssignments(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	videoID := c.Params("id")
	if err := h.videoSvc.VerifyVideoOwnership(c.Context(), parentID, videoID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	childIDs, err := h.videoSvc.GetAssignedChildIDs(c.Context(), videoID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, childIDs)
}

// AssignVideoToChildByVideoID assigns a video (by video ID) to a child the parent owns.
func (h *Handler) AssignVideoToChildByVideoID(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	videoID := c.Params("id")
	childID := c.Params("childId")
	if err := h.videoSvc.VerifyVideoOwnership(c.Context(), parentID, videoID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.svc.verifyOwnership(c.Context(), parentID, childID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.videoSvc.AssignVideoToChild(c.Context(), parentID, childID, videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"assigned": true})
}

// UnassignVideoFromChildByVideoID removes a video assignment from a child.
func (h *Handler) UnassignVideoFromChildByVideoID(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	videoID := c.Params("id")
	childID := c.Params("childId")
	if err := h.videoSvc.VerifyVideoOwnership(c.Context(), parentID, videoID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.svc.verifyOwnership(c.Context(), parentID, childID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	if err := h.videoSvc.UnassignVideoFromChild(c.Context(), childID, videoID); err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, fiber.Map{"unassigned": true})
}

func (h *Handler) ListMyVideos(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	vs, err := h.videoSvc.ListVideosBySubmitter(c.Context(), parentID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, vs)
}

func (h *Handler) ListGlobalVideos(c *fiber.Ctx) error {
	vs, err := h.videoSvc.ListGlobalVideos(c.Context())
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, vs)
}


func (h *Handler) ApproveChildVideo(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	videoID := c.Params("id")
	if err := h.svc.VerifyVideoOwnership(c.Context(), parentID, videoID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	v, err := h.videoSvc.ApproveVideo(c.Context(), videoID)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, v)
}

func (h *Handler) RejectChildVideo(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	videoID := c.Params("id")
	if err := h.svc.VerifyVideoOwnership(c.Context(), parentID, videoID); err != nil {
		return response.Forbidden(c, err.Error())
	}
	reason := c.Query("reason")
	v, err := h.videoSvc.RejectVideo(c.Context(), videoID, reason)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, v)
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

func (h *Handler) GetActivityFeed(c *fiber.Ctx) error {
	parentID := c.Locals("userID").(string)
	childID := c.Params("id")
	feed, err := h.svc.GetActivityFeed(c.Context(), parentID, childID)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, feed)
}
