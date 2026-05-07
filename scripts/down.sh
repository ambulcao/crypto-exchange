#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

./vendor/bin/sail down --remove-orphans

echo "Servicos derrubados."
