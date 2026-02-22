#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-acceptance-tests.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"
install_local_deps "$REPO_ROOT" "$APP_PKG"

# Install app dependencies
cd "$REPO_ROOT/$APP_DIR"
npm ci

# Find available ports
HOSTING_PORT=$(find_available_port)

FIRESTORE_PORT=""
if [ "$USES_FIRESTORE" = true ]; then
  FIRESTORE_PORT=$(find_available_port)
  echo "Firestore emulator will use port $FIRESTORE_PORT"
fi

AUTH_PORT=""
if [ "$USES_AUTH" = true ]; then
  AUTH_PORT=$(find_available_port)
  echo "Auth emulator will use port $AUTH_PORT"
fi

# Build with emulator env vars
BUILD_ARGS=()
if [ "$USES_FIRESTORE" = true ]; then
  BUILD_ARGS+=("VITE_FIRESTORE_EMULATOR_HOST=localhost:${FIRESTORE_PORT}" "VITE_FIRESTORE_NAMESPACE=emulator")
fi
if [ "$USES_AUTH" = true ]; then
  BUILD_ARGS+=("VITE_AUTH_EMULATOR_HOST=localhost:${AUTH_PORT}")
fi

if [ ${#BUILD_ARGS[@]} -gt 0 ]; then
  env "${BUILD_ARGS[@]}" npm run build
else
  npm run build
fi

cd "$REPO_ROOT"

# Install Playwright browsers (skip if nix provides them via PLAYWRIGHT_BROWSERS_PATH)
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  cd "$REPO_ROOT/$APP_DIR"
  npx playwright install --with-deps chromium
  cd "$REPO_ROOT"
fi

# Generate temporary firebase.json in repo root with relative path to dist.
# Firebase emulator resolves public dir relative to the config file location.
TEMP_FIREBASE_JSON="${REPO_ROOT}/.firebase-acceptance-$$.json"

# Build emulators config
EMULATORS_JSON="{\"hosting\": {\"port\": ${HOSTING_PORT}}"
if [ "$USES_FIRESTORE" = true ]; then
  EMULATORS_JSON="$EMULATORS_JSON, \"firestore\": {\"port\": ${FIRESTORE_PORT}}"
fi
if [ "$USES_AUTH" = true ]; then
  EMULATORS_JSON="$EMULATORS_JSON, \"auth\": {\"port\": ${AUTH_PORT}}"
fi
EMULATORS_JSON="$EMULATORS_JSON}"

# Build top-level config
CONFIG_JSON="{\"hosting\": {\"public\": \"${APP_DIR}/dist\", \"ignore\": [\"firebase.json\", \"**/.*\", \"**/node_modules/**\"]}"
if [ "$USES_FIRESTORE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON, \"firestore\": {\"rules\": \"firestore.rules\"}"
fi
CONFIG_JSON="$CONFIG_JSON, \"emulators\": $EMULATORS_JSON}"

echo "$CONFIG_JSON" > "$TEMP_FIREBASE_JSON"

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

# Start Firebase emulators in background
EMULATORS="hosting"
if [ "$USES_FIRESTORE" = true ]; then
  EMULATORS="$EMULATORS,firestore"
fi
if [ "$USES_AUTH" = true ]; then
  EMULATORS="$EMULATORS,auth"
fi

npx firebase-tools emulators:start --only "$EMULATORS" --config "$TEMP_FIREBASE_JSON" --project "$FIREBASE_PROJECT_ID" &
EMULATOR_PID=$!

# Poll until hosting emulator serves content.
# Timeout must cover npx download (~20s) + emulator startup (~15s).
TIMEOUT=120
ELAPSED=0
until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${HOSTING_PORT}/" 2>/dev/null | grep -q '^200$'; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: Firebase hosting emulator did not start within ${TIMEOUT}s" >&2
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

echo "Firebase hosting emulator ready on port ${HOSTING_PORT}"

# Poll until Firestore emulator is ready (if used)
if [ "$USES_FIRESTORE" = true ]; then
  ELAPSED=0
  until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${FIRESTORE_PORT}/" 2>/dev/null | grep -q '^200$'; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "ERROR: Firebase Firestore emulator did not start within ${TIMEOUT}s" >&2
      exit 1
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
  done
  echo "Firebase Firestore emulator ready on port ${FIRESTORE_PORT}"

  # Seed Firestore
  echo "Seeding Firestore..."
  FIRESTORE_EMULATOR_HOST="localhost:${FIRESTORE_PORT}" \
  FIRESTORE_NAMESPACE="emulator" \
  npx tsx firestoreutil/bin/run-seed.ts
fi

# Poll until Auth emulator is ready (if used)
if [ "$USES_AUTH" = true ]; then
  ELAPSED=0
  until curl -s "http://localhost:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/projects" >/dev/null 2>&1; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "ERROR: Auth emulator did not start within ${TIMEOUT}s" >&2
      exit 1
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
  done
  echo "Firebase Auth emulator ready on port ${AUTH_PORT}"

  # Seed auth user
  echo "Seeding auth user..."
  AUTH_EMULATOR_HOST="localhost:${AUTH_PORT}" npx tsx authutil/bin/run-auth-seed.ts
fi

# Run Playwright acceptance tests
cd "$REPO_ROOT/$APP_DIR"
BASE_URL="http://localhost:${HOSTING_PORT}" npx playwright test --config e2e/playwright.config.ts
