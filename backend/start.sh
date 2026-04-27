#!/bin/sh
set -e

# Use PORT env var if provided (Render sets this), default to 8000
PORT=${PORT:-8000}

echo "Starting biasguard backend on port: $PORT"
echo "--- Environment Variables ---"
env
echo "-----------------------------"

# Exec uvicorn so it replaces the shell process (proper signal handling)
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
