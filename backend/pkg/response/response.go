package response

import "github.com/gofiber/fiber/v2"

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

func OK(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusOK).JSON(Response{Success: true, Data: data})
}

func Created(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(Response{Success: true, Data: data})
}

func BadRequest(c *fiber.Ctx, err string) error {
	return c.Status(fiber.StatusBadRequest).JSON(Response{Success: false, Error: err})
}

func Unauthorized(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusUnauthorized).JSON(Response{Success: false, Error: msg})
}

func Forbidden(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusForbidden).JSON(Response{Success: false, Error: msg})
}

func NotFound(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusNotFound).JSON(Response{Success: false, Error: msg})
}

func Conflict(c *fiber.Ctx, msg string) error {
	return c.Status(fiber.StatusConflict).JSON(Response{Success: false, Error: msg})
}

func InternalError(c *fiber.Ctx, err error) error {
	msg := "internal server error"
	if err != nil {
		msg = err.Error()
	}
	return c.Status(fiber.StatusInternalServerError).JSON(Response{Success: false, Error: msg})
}
