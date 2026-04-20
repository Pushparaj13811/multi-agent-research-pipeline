#!/bin/sh
set -e

echo "==> Running database migrations..."
alembic upgrade head

echo "==> Starting application server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${WORKERS:-2}" --log-level "${LOG_LEVEL:-info}"
