#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-acceptance-tests.sh <app-dir> [base-url]}"
EXTERNAL_BASE_URL="${2:-}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_NAME=$(get_app_name "$APP_DIR")
EMULATOR_PROJECT_ID=$(get_emulator_project_id)

if [ ! -d "$REPO_ROOT/node_modules" ]; then
  (cd "$REPO_ROOT" && npm ci)
fi

cd "$REPO_ROOT/$APP_DIR"

# When a base URL is provided, skip emulator setup and run tests directly
if [ -n "$EXTERNAL_BASE_URL" ]; then
  if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
    npx playwright install --with-deps chromium
  fi
  BASE_URL="$EXTERNAL_BASE_URL" npx playwright test --config e2e/playwright.config.ts
  exit 0
fi

cd "$REPO_ROOT"

cleanup_stale_hub

detect_features "$REPO_ROOT/$APP_DIR/src/" "$REPO_ROOT" "$APP_NAME"

cd "$REPO_ROOT/$APP_DIR"

# Count and allocate all needed ports atomically to avoid OS port recycling
PORT_COUNT=1  # hosting always needed
if [ "$USES_FIRESTORE" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_AUTH" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_STORAGE" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_FUNCTIONS" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi

read -r HOSTING_PORT EXTRA_PORTS <<< "$(find_available_ports "$PORT_COUNT")"
echo "Hosting emulator will use port $HOSTING_PORT"

FIRESTORE_PORT=""
AUTH_PORT=""
STORAGE_PORT=""
FUNCTIONS_PORT=""
for feature in FIRESTORE AUTH STORAGE FUNCTIONS; do
  uses_var="USES_${feature}"
  if [ "${!uses_var}" = true ]; then
    port="${EXTRA_PORTS%% *}"
    EXTRA_PORTS="${EXTRA_PORTS#* }"
    declare "${feature}_PORT=$port"
    echo "${feature,,} emulator will use port $port"
  fi
done

# Build with emulator env vars
BUILD_ARGS=()
EMULATOR_NAMESPACE=""
if [ "$USES_FIRESTORE" = true ]; then
  EMULATOR_NAMESPACE=$(get_firestore_namespace "$APP_NAME" "$(get_env_suffix emulator)")
  BUILD_ARGS+=("VITE_FIRESTORE_EMULATOR_HOST=localhost:${FIRESTORE_PORT}" "VITE_FIRESTORE_NAMESPACE=${EMULATOR_NAMESPACE}")
fi
if [ "$USES_AUTH" = true ]; then
  BUILD_ARGS+=("VITE_AUTH_EMULATOR_HOST=localhost:${AUTH_PORT}")
fi
if [ "$USES_STORAGE" = true ]; then
  BUILD_ARGS+=("VITE_STORAGE_EMULATOR_HOST=localhost:${STORAGE_PORT}")
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
if [ "$USES_STORAGE" = true ]; then
  EMULATORS_JSON="$EMULATORS_JSON, \"storage\": {\"port\": ${STORAGE_PORT}}"
fi
if [ "$USES_FUNCTIONS" = true ]; then
  EMULATORS_JSON="$EMULATORS_JSON, \"functions\": {\"port\": ${FUNCTIONS_PORT}}"
fi
EMULATORS_JSON="$EMULATORS_JSON}"

# Build hosting config, preserving rewrites and headers from the original firebase.json
HOSTING_JSON="{\"public\": \"${APP_DIR}/dist\", \"ignore\": [\"firebase.json\", \"**/.*\", \"**/node_modules/**\"]"
APP_REWRITES=$(jq -c ".hosting[] | select(.target == \"$APP_NAME\") | .rewrites // empty" "$REPO_ROOT/firebase.json" 2>/dev/null || true)
if [ -n "$APP_REWRITES" ]; then
  HOSTING_JSON="$HOSTING_JSON, \"rewrites\": $APP_REWRITES"
fi
APP_HEADERS=$(jq -c ".hosting[] | select(.target == \"$APP_NAME\") | .headers // empty" "$REPO_ROOT/firebase.json" 2>/dev/null || true)
if [ -n "$APP_HEADERS" ]; then
  HOSTING_JSON="$HOSTING_JSON, \"headers\": $APP_HEADERS"
fi
HOSTING_JSON="$HOSTING_JSON}"

# Build top-level config
CONFIG_JSON="{\"hosting\": $HOSTING_JSON"
if [ "$USES_FIRESTORE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON, \"firestore\": {\"rules\": \"firestore.rules\"}"
fi
if [ "$USES_STORAGE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON, \"storage\": {\"rules\": \"storage.rules\"}"
fi
if [ "$USES_FUNCTIONS" = true ]; then
  CONFIG_JSON="$CONFIG_JSON, \"functions\": {\"source\": \"functions\", \"runtime\": \"nodejs22\"}"
fi
CONFIG_JSON="$CONFIG_JSON, \"emulators\": $EMULATORS_JSON}"

echo "$CONFIG_JSON" > "$TEMP_FIREBASE_JSON"

# Cleanup on exit: kill emulator, remove stale hub and temp config files
EMULATOR_PID=""
cleanup() {
  if [ -n "$EMULATOR_PID" ]; then
    kill_tree "$EMULATOR_PID"
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
  cleanup_stale_hub || echo "WARNING: cleanup_stale_hub failed" >&2
  rm -f "$TEMP_FIREBASE_JSON"
}
trap cleanup EXIT INT TERM

# Start Firebase emulators in background
EMULATORS="hosting"
if [ "$USES_FIRESTORE" = true ]; then
  EMULATORS="$EMULATORS,firestore"
fi
if [ "$USES_AUTH" = true ]; then
  EMULATORS="$EMULATORS,auth"
fi
if [ "$USES_STORAGE" = true ]; then
  EMULATORS="$EMULATORS,storage"
fi
if [ "$USES_FUNCTIONS" = true ]; then
  EMULATORS="$EMULATORS,functions"
fi

# Build functions before starting emulator (if used)
if [ "$USES_FUNCTIONS" = true ]; then
  echo "Building Cloud Functions..."
  (cd "$REPO_ROOT" && npm run -w functions build)
fi

npx firebase-tools emulators:start --only "$EMULATORS" --config "$TEMP_FIREBASE_JSON" --project "$EMULATOR_PROJECT_ID" &
EMULATOR_PID=$!

# Poll until hosting emulator serves content.
# Timeout allows headroom for slow CI (npx download + emulator startup can take 30-60s).
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
  APP_NAME="$APP_NAME" \
  FIRESTORE_EMULATOR_HOST="localhost:${FIRESTORE_PORT}" \
  FIRESTORE_NAMESPACE="${EMULATOR_NAMESPACE}" \
  SEED_TEST_ONLY=true \
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
  APP_NAME="$APP_NAME" AUTH_EMULATOR_HOST="localhost:${AUTH_PORT}" FIREBASE_PROJECT_ID="$EMULATOR_PROJECT_ID" npx tsx authutil/bin/run-auth-seed.ts
fi

# Poll until Storage emulator is ready (if used).
# The storage emulator root URL returns 404 (not 200 like Firestore), so check
# for any valid HTTP response — a non-000 status means the server is listening.
if [ "$USES_STORAGE" = true ]; then
  ELAPSED=0
  until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${STORAGE_PORT}/" 2>/dev/null | grep -qE '^[1-5]'; do
    if [ $ELAPSED -ge $TIMEOUT ]; then
      echo "ERROR: Storage emulator did not start within ${TIMEOUT}s" >&2
      exit 1
    fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
  done
  echo "Firebase Storage emulator ready on port ${STORAGE_PORT}"

  # Seed Storage (if the app provides a storage seed script)
  STORAGE_SEED="$REPO_ROOT/$APP_DIR/seeds/run-storage-seed.ts"
  if [ -f "$STORAGE_SEED" ]; then
    echo "Seeding Storage..."
    STORAGE_EMULATOR_HOST="localhost:${STORAGE_PORT}" npx tsx "$STORAGE_SEED"
  fi
fi

# Run Playwright acceptance tests
cd "$REPO_ROOT/$APP_DIR"
BASE_URL="http://localhost:${HOSTING_PORT}" npx playwright test --config e2e/playwright.config.ts
