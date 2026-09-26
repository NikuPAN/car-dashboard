#!/usr/bin/env bash
# Runs ON the VPS after the committed tree has been copied to /srv/personal-projects/car-dashboard/app.
set -euo pipefail
cd /srv/personal-projects/car-dashboard/app
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
for i in $(seq 1 30); do
  if docker compose exec -T app wget -q -O /dev/null http://127.0.0.1:8080/healthz; then
    echo "deploy ok: ${GITHUB_SHA:-manual} $(date -Is)"; exit 0
  fi
  sleep 2
done
echo "app did not become healthy"; docker compose logs --tail=50 app; exit 1
