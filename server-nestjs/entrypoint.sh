#!/bin/sh
set -e

echo "Starting ${APP_NAME}..."

# Run migrations only if RUN_MIGRATIONS=true
if [ "$APP_NAME" = "app-api" ] && [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Running database migrations..."
  npx ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:run -d libs/entity/src/data-source.ts
  echo "Migrations completed!"
fi

echo "Starting application..."
exec node dist/apps/${APP_NAME}/main.js
