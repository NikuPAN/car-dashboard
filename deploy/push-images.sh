#!/usr/bin/env bash
# Uploads the car banner images built by tools/car-images (tools/car-images/out) to the VPS, then deletes any file there
# that src/car-images.json no longer references. Order: build images -> run this -> commit src/car-images.json and push.
# Images are third-party game art: they live only on the VPS (/srv/personal-projects/car-dashboard/images), never in git.
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${VPS_HOST:-root@100.104.160.3}
DIR=/srv/personal-projects/car-dashboard/images
test -d tools/car-images/out || { echo "build first: cd tools/car-images && npm install && npm run build"; exit 1; }
tar -C tools/car-images/out -cf - . | ssh "$HOST" "mkdir -p $DIR && tar -xf - -C $DIR --no-same-owner && chmod -R a+rX $DIR"
node -e "console.log(Object.values(require('./src/car-images.json')).join('\n'))" \
  | ssh "$HOST" "cd $DIR && ls | grep -vxF -f - | xargs -r rm -f; echo \"images on VPS: \$(ls | wc -l), \$(du -sh . | cut -f1)\""
