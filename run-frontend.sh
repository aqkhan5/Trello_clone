#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/frontend"

echo "=========================================="
echo "  Starting Trello Frontend (Vite + React)"
echo "  URL: http://localhost:5173"
echo "=========================================="

exec npm run dev
