#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan route:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan l5-swagger:generate

echo "OpenAPI gerado e disponivel em /docs."
