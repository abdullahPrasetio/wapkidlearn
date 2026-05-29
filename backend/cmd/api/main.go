package main

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"

	"wapkidlearn/internal/admin"
	"wapkidlearn/internal/auth"
	"wapkidlearn/internal/database"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/internal/game"
	"wapkidlearn/internal/parent"
	"wapkidlearn/internal/points"
	"wapkidlearn/internal/videos"
	"wapkidlearn/pkg/ratelimit"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	// Load .env dari root project (satu level di atas backend/)
	if err := godotenv.Load("../.env"); err != nil {
		log.Println("no .env file found, using system env vars")
	}

	databaseURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/wapkidlearn?sslmode=disable")
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}
	frontendOrigin := getEnv("FRONTEND_ORIGIN", "http://localhost:3000")
	port := getEnv("PORT", "8080")

	pool := database.Connect(databaseURL)
	defer pool.Close()

	// Wire dependencies
	authLimiter := ratelimit.New()
	authSvc := auth.NewService(pool, jwtSecret)
	authHandler := auth.NewHandler(authSvc, authLimiter)

	pointsRepo := points.NewRepository(pool)
	pointsSvc := points.NewService(pointsRepo, pool)
	pointsHandler := points.NewHandler(pointsSvc)

	gameRepo := game.NewRepository(pool)
	gameSvc := game.NewService(gameRepo, pointsSvc)
	gameHandler := game.NewHandler(gameSvc)

	videosSvc := videos.NewService(pool)
	videosHandler := videos.NewHandler(videosSvc)

	parentSvc := parent.NewService(pool)
	parentHandler := parent.NewHandler(parentSvc, videosSvc)

	adminSvc := admin.NewService(pool)
	adminHandler := admin.NewHandler(adminSvc)

	// Background cleanup tasks
	go runBackgroundTasks(pool)

	// Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   err.Error(),
			})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     frontendOrigin,
		AllowCredentials: true,
		AllowHeaders:     "Content-Type, Authorization",
		AllowMethods:     "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Auth routes (public)
	authGroup := app.Group("/api/v1/auth")
	authHandler.Register(authGroup)

	// Middleware
	requireAuth := auth.RequireAuth(jwtSecret)
	requireChild := auth.RequireRole("child")
	requireParent := auth.RequireRole("parent")
	requireAdmin := auth.RequireRole("super_admin")

	// Child routes
	childGroup := app.Group("/api/v1/child", requireAuth, requireChild)
	gameHandler.Register(childGroup)
	pointsHandler.Register(childGroup)
	videosHandler.Register(childGroup)

	// Parent routes
	parentGroup := app.Group("/api/v1/parent", requireAuth, requireParent)
	parentHandler.Register(parentGroup)
	parentGroup.Patch("/videos/:id/approve", parentHandler.ApproveChildVideo)
	parentGroup.Patch("/videos/:id/reject", parentHandler.RejectChildVideo)

	// Admin routes
	adminGroup := app.Group("/api/v1/admin", requireAuth, requireAdmin)
	adminHandler.Register(adminGroup)
	adminGroup.Get("/videos/all", func(c *fiber.Ctx) error {
		vs, err := db.New(pool).GetAllVideos(c.Context())
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(fiber.Map{"success": true, "data": vs})
	})
	adminGroup.Post("/videos", videosHandler.AddVideo)
	adminGroup.Patch("/videos/:id/approve", videosHandler.ApproveVideo)
	adminGroup.Patch("/videos/:id/reject", videosHandler.RejectVideo)
	adminGroup.Delete("/videos/:id", videosHandler.DeleteVideo)

	log.Printf("WapKidLearn API starting on :%s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}

// runBackgroundTasks runs periodic maintenance queries.
func runBackgroundTasks(pool *pgxpool.Pool) {
	q := db.New(pool)
	ctx := context.Background()

	ticker60s := time.NewTicker(60 * time.Second)
	ticker1h := time.NewTicker(1 * time.Hour)
	defer ticker60s.Stop()
	defer ticker1h.Stop()

	for {
		select {
		case <-ticker60s.C:
			if err := q.CloseStaleWatchSessions(ctx); err != nil {
				log.Printf("[bg] CloseStaleWatchSessions: %v", err)
			}
			if err := q.DeleteExpiredNonces(ctx); err != nil {
				log.Printf("[bg] DeleteExpiredNonces: %v", err)
			}
		case <-ticker1h.C:
			resetDailyWatch(ctx, pool)
		}
	}
}

// resetDailyWatch resets watch quotas for children whose last reset was before today.
func resetDailyWatch(ctx context.Context, pool *pgxpool.Pool) {
	_, err := pool.Exec(ctx,
		`UPDATE watch_wallets
		 SET used_today_seconds = 0, last_reset_date = CURRENT_DATE
		 WHERE last_reset_date < CURRENT_DATE`)
	if err != nil {
		log.Printf("[bg] resetDailyWatch: %v", err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
