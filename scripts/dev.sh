#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1/2] Subindo backend (Laravel + MySQL + Redis + Mailpit)..."
"$ROOT_DIR/scripts/up.sh"

echo "[2/2] Iniciando app mobile (Expo)..."
cd "$ROOT_DIR/mobile"
npm start
