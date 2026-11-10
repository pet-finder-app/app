#!/usr/bin/env bash
set -euo pipefail

deployment_root=${1:?Deployment directory is required}
export APP_IMAGE=${2:?Image digest is required}
test -f "$deployment_root/.env"

# Keep the app separate from the backend's Compose project across releases.
compose=(docker compose --project-name petfinder-app-production --env-file "$deployment_root/.env" -f compose.production.yaml)
"${compose[@]}" config --quiet
"${compose[@]}" pull
if ! "${compose[@]}" up -d --wait --wait-timeout 180 app; then
  "${compose[@]}" logs --no-color --tail=100 app
  exit 1
fi
printf '%s\n' "$APP_IMAGE" > "$deployment_root/current-image"
