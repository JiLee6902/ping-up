#!/bin/bash
set -euo pipefail

# =============================================================
# Deploy Script for Hetzner Cloud
# Usage: ./deploy.sh [--migrate] [--pull-only]
# =============================================================

APP_DIR="/opt/pingup"
COMPOSE_FILE="docker-compose.hetzner.yml"
ENV_FILE=".env.production"

# Parse flags
RUN_MIGRATIONS=false
PULL_ONLY=false
for arg in "$@"; do
    case $arg in
        --migrate) RUN_MIGRATIONS=true ;;
        --pull-only) PULL_ONLY=true ;;
    esac
done

cd "$APP_DIR"

# Check env file
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: $ENV_FILE not found in $APP_DIR"
    echo "Copy .env.hetzner.example and fill in your secrets."
    exit 1
fi

# Check compose file
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "ERROR: $COMPOSE_FILE not found in $APP_DIR"
    echo "Downloading from GitHub..."
    curl -sO "https://raw.githubusercontent.com/JiLee6902/ping-up/main/server-nestjs/docker-compose.hetzner.yml"
fi

# Source env for REGISTRY variable
set -a
source "$ENV_FILE"
set +a

echo "=== PingUp Deploy (Hetzner Cloud) ==="
echo "Registry: ${REGISTRY:-not set}"
echo "Version: ${VERSION:-latest}"

# --- Login to Docker Hub ---
echo ""
echo "[1/5] Docker Hub login..."
if [ -n "${DOCKER_PASSWORD:-}" ]; then
    echo "$DOCKER_PASSWORD" | docker login --username "${DOCKER_USERNAME:-$REGISTRY}" --password-stdin
else
    echo "Skipping login (no DOCKER_PASSWORD set, using cached credentials)"
fi

# --- Pull latest images ---
echo ""
echo "[2/5] Pulling latest images..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull app-api notification cronjob-worker

if [ "$PULL_ONLY" = true ]; then
    echo "Pull complete (--pull-only mode). Exiting."
    exit 0
fi

# --- Run migrations ---
if [ "$RUN_MIGRATIONS" = true ]; then
    echo ""
    echo "[3/5] Running database migrations..."
    # Ensure postgres is running
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d postgres
    sleep 5

    docker run --rm \
        --env-file "$ENV_FILE" \
        --network pingup_pingup_network \
        "${REGISTRY}/pingup-app-api:${VERSION:-latest}" \
        npx ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:run -d libs/entity/src/data-source.ts

    echo "Migrations completed!"
else
    echo ""
    echo "[3/5] Skipping migrations (use --migrate to run)"
fi

# --- Restart containers ---
echo ""
echo "[4/5] Restarting services..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# --- Health check ---
echo ""
echo "[5/5] Health check..."
MAX_RETRIES=10
RETRY_INTERVAL=5

for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf http://localhost:4000/api/health > /dev/null 2>&1; then
        echo "app-api: healthy"
        break
    fi
    if [ "$i" -eq "$MAX_RETRIES" ]; then
        echo "WARNING: app-api health check failed after ${MAX_RETRIES} attempts"
        echo "Check logs: docker compose -f $COMPOSE_FILE logs app-api"
    else
        echo "Waiting for app-api... ($i/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    fi
done

# --- Cleanup ---
echo ""
echo "Cleaning up old images..."
docker image prune -af --filter "until=72h"

echo ""
echo "=== Deploy Complete! ==="
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
