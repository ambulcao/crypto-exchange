#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

./vendor/bin/sail down --remove-orphans
./vendor/bin/sail build --no-cache
./vendor/bin/sail up -d
./vendor/bin/sail artisan migrate --force
./vendor/bin/sail artisan config:clear
./vendor/bin/sail artisan route:clear
./vendor/bin/sail artisan view:clear
./vendor/bin/sail artisan l5-swagger:generate

echo "Servicos reconstruidos, migrations aplicadas, caches seguros limpos e OpenAPI gerado."
