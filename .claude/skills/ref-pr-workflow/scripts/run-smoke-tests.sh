#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"
BASE_URL="${2:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

ensure_deps

cd "$REPO_ROOT/$APP_DIR"

# Wait for Firebase CDN to serve the deployed content
echo "Waiting for preview to become available at $BASE_URL..."
READY=false
for i in $(seq 1 30); do
  STATUS=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL")
  if [[ "$STATUS" == "200" ]] && curl -s "$BASE_URL" | grep -q '<script type="module"'; then
    echo "Preview is ready."
    READY=true
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Preview at $BASE_URL did not serve expected content after 60s (last HTTP status: $STATUS)" >&2
    curl -s "$BASE_URL" | head -20 >&2
    exit 1
  fi
  sleep 2
done

# Install Playwright browsers (skip if nix provides them via PLAYWRIGHT_BROWSERS_PATH)
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  npx playwright install --with-deps chromium
fi

# Run smoke tests
BASE_URL="$BASE_URL" npx playwright test --config e2e/playwright.config.ts --grep @smoke
