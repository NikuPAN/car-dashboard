#!/usr/bin/env bash
# Manual deploy from the dev PC — fallback for when the GitHub runner is down. Copies the committed
# HEAD to the VPS over Tailscale SSH (approve the login.tailscale.com link if prompted) and rebuilds.
# core.autocrlf=false: on Windows, git archive would otherwise ship every text file with CRLF.
set -euo pipefail
HOST=${VPS_HOST:-root@100.104.160.3}
DIR=/srv/personal-projects/car-dashboard/app
git -c core.autocrlf=false archive --format=tar HEAD | ssh "$HOST" "tar -x -C $DIR && chown -R runner:runner $DIR"
ssh "$HOST" "bash $DIR/deploy/remote-deploy.sh"
