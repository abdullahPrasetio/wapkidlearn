package validator

import "github.com/gofiber/fiber/v2"

// BindAndValidate parses the request body into out.
// Field-level validation is left to individual handlers.
func BindAndValidate(c *fiber.Ctx, out interface{}) error {
	return c.BodyParser(out)
}
