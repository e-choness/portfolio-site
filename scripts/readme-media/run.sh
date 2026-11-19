#!/bin/sh
# Regenerates the README banner and tour in .github/readme/. Runs in a
# throwaway container so nothing is installed on the host:
#
#   docker compose run --rm --no-deps jekyll sh scripts/readme-media/run.sh [banner|tour|all]
#
# (In Git Bash, prefix MSYS_NO_PATHCONV=1.) Chromium and libwebp's encoders go
# into the container layer only, the dev build is served from /tmp/site (never
# _site), and frames are written under /tmp inside the container.
set -e
what=${1:-all}

if ! command -v chromium >/dev/null || ! command -v img2webp >/dev/null; then
  echo "installing chromium + webp into the container…"
  apt-get update -qq >/dev/null
  apt-get install -y -qq --no-install-recommends chromium webp fonts-dejavu-core fonts-symbola >/dev/null 2>&1
fi

bundle exec jekyll serve --config _config.yml,_config_dev.yml -d /tmp/site --no-watch \
  --host 127.0.0.1 --port 4000 >/tmp/serve.log 2>&1 &
chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --mute-audio \
  --force-color-profile=srgb --remote-debugging-port=9222 --user-data-dir=/tmp/chrome \
  about:blank >/tmp/chrome.log 2>&1 &

for _ in $(seq 1 180); do
  node -e "fetch('http://127.0.0.1:4000/').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))" 2>/dev/null && break
  sleep 1
done

node --experimental-websocket scripts/readme-media/capture.mjs "$what"
