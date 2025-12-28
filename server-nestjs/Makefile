.PHONY: install dev api notification cron build build-all lint format test test-watch test-cov test-e2e migrate migrate-gen migrate-revert clean help
.PHONY: docker-up docker-down docker-logs docker-ps docker-build docker-push docker-prod-up docker-prod-down

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make install       - Install dependencies"
	@echo "    make dev           - Start app-api in watch mode"
	@echo "    make api           - Start app-api in watch mode"
	@echo "    make notification  - Start notification service"
	@echo "    make cron          - Start cronjob worker"
	@echo ""
	@echo "  Build:"
	@echo "    make build         - Build app-api"
	@echo "    make build-all     - Build all apps"
	@echo ""
	@echo "  Code Quality:"
	@echo "    make lint          - Run ESLint with fix"
	@echo "    make format        - Format code with Prettier"
	@echo ""
	@echo "  Testing:"
	@echo "    make test          - Run tests"
	@echo "    make test-watch    - Run tests in watch mode"
	@echo "    make test-cov      - Run tests with coverage"
	@echo "    make test-e2e      - Run e2e tests"
	@echo ""
	@echo "  Database:"
	@echo "    make migrate       - Run migrations"
	@echo "    make migrate-gen   - Generate migration (usage: make migrate-gen name=MigrationName)"
	@echo "    make migrate-revert - Revert last migration"
	@echo ""
	@echo "  Docker (Development):"
	@echo "    make docker-up     - Start infra services (postgres, redis, kafka)"
	@echo "    make docker-down   - Stop all containers"
	@echo "    make docker-logs   - View container logs"
	@echo "    make docker-ps     - List running containers"
	@echo ""
	@echo "  Docker (Production):"
	@echo "    make docker-build  - Build Docker images for all apps"
	@echo "    make docker-push   - Push images to registry"
	@echo "    make docker-prod-up   - Start all services in production"
	@echo "    make docker-prod-down - Stop all production services"
	@echo ""
	@echo "  Misc:"
	@echo "    make clean         - Remove dist and node_modules"

# Install dependencies
install:
	npm install

# Development - Start services
dev: api

api:
	npm run start:app-api

notification:
	npm run start:notification

cron:
	npm run start:cronjob-worker

# Build
build:
	npm run build:app-api

build-all:
	npm run build

# Code Quality
lint:
	npm run lint

format:
	npm run format

# Testing
test:
	npm run test

test-watch:
	npm run test:watch

test-cov:
	npm run test:cov

test-e2e:
	npm run test:e2e

# Database Migrations
migrate:
	npm run migration:run

migrate-gen:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make migrate-gen name=MigrationName"; \
		exit 1; \
	fi
	npm run migration:generate -- migrations/$(name)

migrate-revert:
	npm run migration:revert

# Docker - Development (infra only)
docker-up:
	docker-compose --env-file .env.local up -d

docker-down:
	docker-compose --env-file .env.local down

docker-logs:
	docker-compose --env-file .env.local logs -f

docker-ps:
	docker-compose --env-file .env.local ps

# Docker - Build images
docker-build:
	docker build --build-arg APP_NAME=app-api --build-arg APP_PORT=4000 -t pingup/app-api:latest .
	docker build --build-arg APP_NAME=notification --build-arg APP_PORT=4001 -t pingup/notification:latest .
	docker build --build-arg APP_NAME=cronjob-worker --build-arg APP_PORT=4002 -t pingup/cronjob-worker:latest .

docker-build-api:
	docker build --build-arg APP_NAME=app-api --build-arg APP_PORT=4000 -t pingup/app-api:latest .

docker-build-notification:
	docker build --build-arg APP_NAME=notification --build-arg APP_PORT=4001 -t pingup/notification:latest .

docker-build-cron:
	docker build --build-arg APP_NAME=cronjob-worker --build-arg APP_PORT=4002 -t pingup/cronjob-worker:latest .

# Docker - Push to registry
docker-push:
	docker push pingup/app-api:latest
	docker push pingup/notification:latest
	docker push pingup/cronjob-worker:latest

# Docker - Production
docker-prod-up:
	docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

docker-prod-down:
	docker-compose -f docker-compose.prod.yml --env-file .env.production down

docker-prod-logs:
	docker-compose -f docker-compose.prod.yml --env-file .env.production logs -f

# Clean
clean:
	rm -rf dist node_modules

# Clean Docker
docker-clean:
	docker-compose --env-file .env.local down -v --rmi local
	docker-compose -f docker-compose.prod.yml --env-file .env.production down -v --rmi local
