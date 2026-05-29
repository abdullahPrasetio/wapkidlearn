# WapKidLearn — Makefile
# Usage: make <target>

.PHONY: help dev-backend dev-frontend dev build-backend build-frontend \
        migrate migrate-down migrate-status seed \
        sqlc-gen test lint clean docker-up docker-down docker-logs

# ─── Config ───────────────────────────────────────────────────────────────────
BACKEND_DIR  := ./backend
FRONTEND_DIR := ./frontend
DB_URL       ?= $(shell grep DATABASE_URL .env 2>/dev/null | cut -d= -f2-)
MIGRATE_BIN  := migrate  # golang-migrate CLI
AIR_BIN      := air      # live-reload untuk Go

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Tampilkan daftar target
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2}'

# ─── Development ──────────────────────────────────────────────────────────────
dev: ## Jalankan backend + frontend secara bersamaan (butuh tmux atau GNU parallel)
	@echo "Menjalankan backend dan frontend..."
	@$(MAKE) -j2 dev-backend dev-frontend

dev-backend: ## Jalankan backend dengan live-reload (air)
	@echo "→ Backend: hot-reload dengan air"
	cd $(BACKEND_DIR) && $(AIR_BIN)

dev-frontend: ## Jalankan frontend Next.js dev server
	@echo "→ Frontend: Next.js dev server"
	cd $(FRONTEND_DIR) && npm run dev

# ─── Build ────────────────────────────────────────────────────────────────────
build-backend: ## Build binary Go untuk production
	@echo "→ Build backend..."
	cd $(BACKEND_DIR) && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o ../dist/api ./cmd/api
	@echo "✓ Binary: dist/api"

build-frontend: ## Build Next.js untuk production
	@echo "→ Build frontend..."
	cd $(FRONTEND_DIR) && npm run build
	@echo "✓ Frontend build selesai"

build: build-backend build-frontend ## Build semua (backend + frontend)

# ─── Database Migration ───────────────────────────────────────────────────────
migrate: ## Jalankan semua pending migrations
	@echo "→ Menjalankan migrations..."
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" up
	@echo "✓ Migrations selesai"

migrate-down: ## Rollback 1 migration terakhir
	@echo "→ Rollback 1 migration..."
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" down 1

migrate-status: ## Lihat status migration saat ini
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" version

migrate-force: ## Force set versi migration (gunakan hati-hati: make migrate-force VERSION=3)
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" force $(VERSION)

migrate-reset: ## Drop semua table & ulang dari awal (DEV ONLY)
	@echo "⚠ PERHATIAN: Ini akan menghapus semua data!"
	@read -p "Ketik 'yes' untuk lanjutkan: " confirm && [ "$$confirm" = "yes" ]
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" drop -f
	$(MIGRATE_BIN) -path ./database/migrations -database "$(DB_URL)" up

seed: ## Jalankan seed data (dev only)
	@echo "→ Seeding database..."
	psql "$(DB_URL)" -f ./database/migrations/seed.sql
	@echo "✓ Seed selesai"

# ─── Code Generation ──────────────────────────────────────────────────────────
sqlc-gen: ## Generate kode Go dari query SQL (sqlc)
	@echo "→ Generating sqlc..."
	cd $(BACKEND_DIR) && sqlc generate
	@echo "✓ sqlc generate selesai"

# ─── Testing & Linting ────────────────────────────────────────────────────────
test: ## Jalankan semua unit test
	@echo "→ Running tests..."
	cd $(BACKEND_DIR) && go test ./... -v -race

test-coverage: ## Test dengan coverage report
	cd $(BACKEND_DIR) && go test ./... -coverprofile=coverage.out && \
		go tool cover -html=coverage.out -o coverage.html
	@echo "✓ Coverage: coverage.html"

lint: ## Lint Go code dengan golangci-lint
	@echo "→ Linting backend..."
	cd $(BACKEND_DIR) && golangci-lint run ./...

lint-frontend: ## Lint frontend dengan ESLint
	cd $(FRONTEND_DIR) && npm run lint

# ─── Docker ───────────────────────────────────────────────────────────────────
docker-up: ## Jalankan semua service dengan Docker Compose (dev)
	docker compose up -d
	@echo "✓ Services running"

docker-up-prod: ## Jalankan production stack
	docker compose -f docker-compose.prod.yml up -d

docker-down: ## Stop semua Docker service
	docker compose down

docker-logs: ## Lihat log semua service
	docker compose logs -f

docker-logs-api: ## Lihat log service api saja
	docker compose logs -f api

docker-build: ## Build ulang semua Docker image
	docker compose build --no-cache

docker-ps: ## Lihat status container
	docker compose ps

# ─── Utilities ────────────────────────────────────────────────────────────────
clean: ## Hapus build artifacts
	rm -rf dist/ $(FRONTEND_DIR)/.next $(FRONTEND_DIR)/node_modules/.cache

install-tools: ## Install dev tools (air, migrate, sqlc, golangci-lint)
	@echo "→ Installing Go tools..."
	go install github.com/air-verse/air@latest
	go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
	go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "✓ Tools installed"

install-frontend: ## Install frontend dependencies
	cd $(FRONTEND_DIR) && npm install

install: install-tools install-frontend ## Install semua dependencies
	@echo "✓ Semua dependencies terinstall"

tidy: ## go mod tidy
	cd $(BACKEND_DIR) && go mod tidy
