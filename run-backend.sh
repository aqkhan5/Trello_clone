#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=========================================="
echo "  Starting Trello Backend (FastAPI)"
echo "  URL: http://localhost:8000"
echo "  Docs: http://localhost:8000/docs"
echo "=========================================="

if command -v uv >/dev/null 2>&1; then
  exec uv run uvicorn app.main:app --reload --port 8000
elif [ -f "$DIR/.venv/bin/uvicorn" ]; then
  exec "$DIR/.venv/bin/uvicorn" app.main:app --reload --port 8000
else
  source "$DIR/.venv/bin/activate"
  exec uvicorn app.main:app --reload --port 8000
fi
