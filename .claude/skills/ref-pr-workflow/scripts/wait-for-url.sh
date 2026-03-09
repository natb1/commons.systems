#!/usr/bin/env bash
set -euo pipefail
URL="${1:?Usage: wait-for-url.sh <url> [timeout_seconds]}"
TIMEOUT="${2:-120}"
ELAPSED=0
INTERVAL=2
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if curl -sf -o /dev/null "$URL" 2>/dev/null; then
    echo "Ready: $URL"
    exit 0
  fi
  sleep "$INTERVAL"
  ELAPSED=$((ELAPSED + INTERVAL))
done
echo "Timeout after ${TIMEOUT}s waiting for $URL" >&2
exit 1
