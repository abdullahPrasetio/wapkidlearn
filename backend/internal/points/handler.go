package points

import (
	"strconv"
	"wapkidlearn/pkg/response"
	"wapkidlearn/pkg/validator"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(router fiber.Router) {
	router.Get("/wallet", h.GetWallet)
	router.Post("/convert", h.ConvertPoints)
	router.Get("/transactions", h.GetTransactions)
}

func (h *Handler) GetWallet(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	w, err := h.svc.GetWallet(c.Context(), childID)
	if err != nil {
		return response.NotFound(c, err.Error())
	}
	return response.OK(c, w)
}

type convertRequest struct {
	Points         int32  `json:"points"`
	IdempotencyKey string `json:"idempotency_key"`
}

func (h *Handler) ConvertPoints(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	var req convertRequest
	if err := validator.BindAndValidate(c, &req); err != nil {
		return response.BadRequest(c, "invalid request body")
	}
	if req.Points <= 0 {
		return response.BadRequest(c, "points must be positive")
	}
	ikey := req.IdempotencyKey
	if ikey == "" {
		ikey = uuid.New().String()
	}
	result, err := h.svc.ConvertPoints(c.Context(), childID, req.Points, ikey)
	if err != nil {
		return response.BadRequest(c, err.Error())
	}
	return response.OK(c, result)
}

func (h *Handler) GetTransactions(c *fiber.Ctx) error {
	childID, ok := c.Locals("childID").(string)
	if !ok || childID == "" {
		return response.Forbidden(c, "child access only")
	}
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	txs, err := h.svc.GetTransactions(c.Context(), childID, page, limit)
	if err != nil {
		return response.InternalError(c, err)
	}
	return response.OK(c, txs)
}
