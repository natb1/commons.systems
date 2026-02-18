#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-acceptance-tests.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"

# Build the app
cd "$APP_DIR"
npm ci
npm run build
cd "$REPO_ROOT"

# Install Playwright browsers (skip if nix provides them via PLAYWRIGHT_BROWSERS_PATH)
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  cd "$APP_DIR"
  npx playwright install --with-deps chromium
  cd "$REPO_ROOT"
fi

# Find an available port
PORT=$(node -e "
  const s = require('net').createServer();
  s.listen(0, () => { console.log(s.address().port); s.close(); });
")

# Generate temporary firebase.json in repo root with relative path to dist.
# Firebase emulator resolves public dir relative to the config file location.
TEMP_FIREBASE_JSON="${REPO_ROOT}/.firebase-acceptance-$$.json"
cat > "$TEMP_FIREBASE_JSON" <<EOF
{
  "hosting": {
    "public": "${APP_DIR}/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"]
  },
  "emulators": {
    "hosting": {
      "port": ${PORT}
    }
  }
}
EOF

# Cleanup on exit: kill emulator, remove temp file
EMULATOR_PID=""
cleanup() {
  if [ -n "$EMULATOR_PID" ]; then
    kill "$EMULATOR_PID" 2>/dev/null || true
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
  rm -f "$TEMP_FIREBASE_JSON"
}
trap cleanup EXIT

# Start Firebase hosting emulator in background
npx firebase-tools emulators:start --only hosting --config "$TEMP_FIREBASE_JSON" --project commons-systems &
EMULATOR_PID=$!

# Poll until emulator serves content (30s timeout).
# Use -o /dev/null without -f so any HTTP response (including 404 during startup) counts,
# but verify we get a 200 for the index page.
TIMEOUT=30
ELAPSED=0
until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}/" 2>/dev/null | grep -q '^200$'; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: Firebase hosting emulator did not start within ${TIMEOUT}s" >&2
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "Firebase hosting emulator ready on port ${PORT}"

# Run Playwright acceptance tests
cd "$APP_DIR"
BASE_URL="http://localhost:${PORT}" npx playwright test --config e2e/playwright.config.ts
