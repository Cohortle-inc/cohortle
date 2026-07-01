#!/bin/sh
set -e

echo "Running Sequelize migrations..."
npx sequelize-cli db:migrate || {
  echo "⚠️  Migration failed, but continuing startup..."
  echo "Check logs and run migrations manually if needed"
}

echo "Starting application..."
exec node bin/www
