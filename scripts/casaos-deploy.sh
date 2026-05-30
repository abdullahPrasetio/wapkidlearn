#!/usr/bin/env bash
# casaos-deploy.sh — Pull & jalankan WapKidLearn di CasaOS
# Usage: bash casaos-deploy.sh [TAG]
# Contoh: bash casaos-deploy.sh 1.2.0

set -euo pipefail

TAG="${1:-latest}"
COMPOSE_FILE="docker-compose.casaos.yml"
ENV_FILE=".env"

# ── Cek kebutuhan ──────────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker tidak ditemukan"; exit 1; }

if [ ! -f "$ENV_FILE" ]; then
  echo "⚠  File .env tidak ditemukan. Menyalin dari .env.casaos..."
  cp .env.casaos "$ENV_FILE"
  echo "✏  Silakan edit .env terlebih dahulu, lalu jalankan ulang script ini."
  exit 1
fi

# ── Pull image terbaru ────────────────────────────────────────────────────────
echo "→ Pulling image tag: $TAG"
docker pull "abdullahprasetio/wapkidlearn-backend:${TAG}"
docker pull "abdullahprasetio/wapkidlearn-frontend:${TAG}"

# ── Tulis TAG ke .env agar compose membacanya ─────────────────────────────────
if grep -q "^TAG=" "$ENV_FILE"; then
  sed -i "s/^TAG=.*/TAG=${TAG}/" "$ENV_FILE"
else
  echo "TAG=${TAG}" >> "$ENV_FILE"
fi

# ── Deploy ────────────────────────────────────────────────────────────────────
echo "→ Menjalankan stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo ""
echo "✓ WapKidLearn berjalan!"
docker compose -f "$COMPOSE_FILE" ps
