#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

./vendor/bin/sail up -d
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan route:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan l5-swagger:generate

echo "Servicos iniciados, caches seguros limpos e OpenAPI gerado."
