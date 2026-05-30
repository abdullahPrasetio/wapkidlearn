# WapKidLearn — Makefile
# Usage: make <target>

.PHONY: help dev-backend dev-frontend dev build-backend build-frontend \
        migrate migrate-down migrate-status seed \
        sqlc-gen test lint clean docker-up docker-down docker-logs \
        docker-build-backend docker-build-frontend docker-build-all \
        docker-push-backend docker-push-frontend docker-push-all docker-release

# ─── Config ───────────────────────────────────────────────────────────────────
BACKEND_DIR   := ./backend
FRONTEND_DIR  := ./frontend
DB_URL        ?= $(shell grep DATABASE_URL .env 2>/dev/null | cut -d= -f2-)
MIGRATE_BIN   := migrate  # golang-migrate CLI
AIR_BIN       := air      # live-reload untuk Go

BACKEND_IMAGE  := abdullahprasetio/wapkidlearn-backend
FRONTEND_IMAGE := abdullahprasetio/wapkidlearn-frontend
TAG            ?= latest

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

docker-build-backend: ## Build & tag Docker image backend (TAG=x.y.z)
	docker build -t $(BACKEND_IMAGE):$(TAG) $(BACKEND_DIR)
	@echo "✓ $(BACKEND_IMAGE):$(TAG)"

docker-build-frontend: ## Build & tag Docker image frontend (TAG=x.y.z NEXT_PUBLIC_API_URL=https://...)
	docker build \
		--build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		--build-arg PORT=$(FRONTEND_PORT) \
		-t $(FRONTEND_IMAGE):$(TAG) \
		$(FRONTEND_DIR)
	@echo "✓ $(FRONTEND_IMAGE):$(TAG)"

docker-build-all: docker-build-backend docker-build-frontend ## Build semua image dengan TAG yang sama

docker-push-backend: ## Push image backend ke Docker Hub (TAG=x.y.z)
	docker push $(BACKEND_IMAGE):$(TAG)

docker-push-frontend: ## Push image frontend ke Docker Hub (TAG=x.y.z)
	docker push $(FRONTEND_IMAGE):$(TAG)

docker-push-all: docker-push-backend docker-push-frontend ## Push semua image ke Docker Hub

docker-release: docker-build-all docker-push-all ## Build + push semua image (TAG=x.y.z)

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
