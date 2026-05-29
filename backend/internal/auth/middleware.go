package auth

import (
	"wapkidlearn/pkg/jwt"
	"wapkidlearn/pkg/response"

	"github.com/gofiber/fiber/v2"
)

// RequireAuth validates the access_token cookie and sets userID, role, childID in locals.
func RequireAuth(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenStr := c.Cookies("access_token")
		if tokenStr == "" {
			return response.Unauthorized(c, "missing access token")
		}
		claims, err := jwt.Parse(tokenStr, secret)
		if err != nil {
			return response.Unauthorized(c, "invalid or expired token")
		}
		c.Locals("userID", claims.UserID)
		c.Locals("role", claims.Role)
		if claims.ChildID != nil {
			c.Locals("childID", *claims.ChildID)
		}
		return c.Next()
	}
}

// RequireRole checks that the authenticated user has one of the allowed roles.
func RequireRole(roles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role == "" {
			return response.Unauthorized(c, "unauthenticated")
		}
		for _, r := range roles {
			if role == r {
				return c.Next()
			}
		}
		return response.Forbidden(c, "insufficient role")
	}
}
