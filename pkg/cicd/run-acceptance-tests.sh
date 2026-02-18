#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-acceptance-tests.sh <app-dir>}"

# Resolve absolute path for temp firebase.json
APP_DIR_ABS="$(cd "$APP_DIR" && pwd)"

# Build the app
cd "$APP_DIR"
npm ci
npm run build
cd - > /dev/null

# Install Playwright browsers (skip if nix provides them via PLAYWRIGHT_BROWSERS_PATH)
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  cd "$APP_DIR"
  npx playwright install --with-deps chromium
  cd - > /dev/null
fi

# Find an available port
PORT=$(node -e "
  const s = require('net').createServer();
  s.listen(0, () => { console.log(s.address().port); s.close(); });
")

# Generate temporary firebase.json with dynamic port and absolute dist path
TEMP_FIREBASE_JSON=$(mktemp /tmp/firebase-acceptance-XXXXXX.json)
cat > "$TEMP_FIREBASE_JSON" <<EOF
{
  "hosting": {
    "public": "${APP_DIR_ABS}/dist",
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

# Poll until emulator responds (30s timeout)
TIMEOUT=30
ELAPSED=0
until curl -sf "http://localhost:${PORT}" > /dev/null 2>&1; do
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
