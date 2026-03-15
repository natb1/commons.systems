#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-qa-server.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_NAME=$(get_app_name "$APP_DIR")
EMULATOR_PROJECT_ID=$(get_emulator_project_id)

cleanup_stale_hub

ensure_deps

detect_features "$REPO_ROOT/$APP_DIR/src/" "$REPO_ROOT" "$APP_NAME"

cd "$REPO_ROOT"

# Count and allocate all needed ports atomically to avoid OS port recycling
PORT_COUNT=1  # vite always needed
if [ "$USES_FIRESTORE" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_AUTH" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_STORAGE" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi
if [ "$USES_FUNCTIONS" = true ]; then PORT_COUNT=$((PORT_COUNT + 1)); fi

read -r VITE_PORT EXTRA_PORTS <<< "$(find_available_ports "$PORT_COUNT")"
echo "Vite dev server will use port $VITE_PORT"

NAMESPACE=""
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

# Generate temporary firebase.json (emulators only, no hosting — Vite serves)
TEMP_FIREBASE_JSON="${REPO_ROOT}/.firebase-qa-$$.json"

# Build emulators config
EMULATORS_JSON="{"
EMULATOR_LIST=""
if [ "$USES_FIRESTORE" = true ]; then
  EMULATORS_JSON="$EMULATORS_JSON\"firestore\": {\"port\": ${FIRESTORE_PORT}}"
  EMULATOR_LIST="firestore"
fi
if [ "$USES_AUTH" = true ]; then
  if [ -n "$EMULATOR_LIST" ]; then
    EMULATORS_JSON="$EMULATORS_JSON, "
    EMULATOR_LIST="$EMULATOR_LIST,auth"
  else
    EMULATOR_LIST="auth"
  fi
  EMULATORS_JSON="$EMULATORS_JSON\"auth\": {\"port\": ${AUTH_PORT}}"
fi
if [ "$USES_STORAGE" = true ]; then
  if [ -n "$EMULATOR_LIST" ]; then
    EMULATORS_JSON="$EMULATORS_JSON, "
    EMULATOR_LIST="$EMULATOR_LIST,storage"
  else
    EMULATOR_LIST="storage"
  fi
  EMULATORS_JSON="$EMULATORS_JSON\"storage\": {\"port\": ${STORAGE_PORT}}"
fi
if [ "$USES_FUNCTIONS" = true ]; then
  if [ -n "$EMULATOR_LIST" ]; then
    EMULATORS_JSON="$EMULATORS_JSON, "
    EMULATOR_LIST="$EMULATOR_LIST,functions"
  else
    EMULATOR_LIST="functions"
  fi
  EMULATORS_JSON="$EMULATORS_JSON\"functions\": {\"port\": ${FUNCTIONS_PORT}}"
fi
EMULATORS_JSON="$EMULATORS_JSON}"

# Build top-level config
CONFIG_JSON="{"
if [ "$USES_FIRESTORE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON\"firestore\": {\"rules\": \"firestore.rules\"}, "
fi
if [ "$USES_STORAGE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON\"storage\": {\"rules\": \"storage.rules\"}, "
fi
if [ "$USES_FUNCTIONS" = true ]; then
  CONFIG_JSON="$CONFIG_JSON\"functions\": {\"source\": \"functions\", \"runtime\": \"nodejs22\"}, "
fi
CONFIG_JSON="$CONFIG_JSON\"emulators\": $EMULATORS_JSON}"

echo "$CONFIG_JSON" > "$TEMP_FIREBASE_JSON"

# Cleanup on exit: kill Vite + emulators, remove stale hub and temp config files
EMULATOR_PID=""
VITE_PID=""
cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "$VITE_PID" ]; then
    kill_tree "$VITE_PID"
    wait "$VITE_PID" 2>/dev/null || true
  fi
  if [ -n "$EMULATOR_PID" ]; then
    kill_tree "$EMULATOR_PID"
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
  cleanup_stale_hub || echo "WARNING: cleanup_stale_hub failed" >&2
  rm -f "$TEMP_FIREBASE_JSON"
  echo "QA server stopped."
}
trap cleanup EXIT INT TERM

# Build functions before starting emulator (if used)
if [ "$USES_FUNCTIONS" = true ]; then
  echo "Building Cloud Functions..."
  (cd "$REPO_ROOT" && npm run -w functions build)
fi

# Start Firebase emulators in background (if any emulators needed)
if [ -n "$EMULATOR_LIST" ]; then
  npx firebase-tools emulators:start --only "$EMULATOR_LIST" --config "$TEMP_FIREBASE_JSON" --project "$EMULATOR_PROJECT_ID" &
  EMULATOR_PID=$!
fi

TIMEOUT=30

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

  # Seed Firestore with worktree-scoped qa namespace (e.g., "myapp/qa-main")
  NAMESPACE=$(get_firestore_namespace "$APP_NAME" "$(get_env_suffix qa)")
  echo "Seeding Firestore (namespace: ${NAMESPACE})..."
  APP_NAME="$APP_NAME" \
  FIRESTORE_EMULATOR_HOST="localhost:${FIRESTORE_PORT}" \
  FIRESTORE_NAMESPACE="$NAMESPACE" \
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
fi

# Seed storage emulator (if used and seed script exists)
if [ "$USES_STORAGE" = true ] && [ -f "$REPO_ROOT/$APP_DIR/seeds/run-storage-seed.ts" ]; then
  echo "Seeding storage emulator..."
  STORAGE_EMULATOR_HOST="localhost:${STORAGE_PORT}" npx tsx "$REPO_ROOT/$APP_DIR/seeds/run-storage-seed.ts"
fi

VITE_ARGS=()
if [ "$USES_FIRESTORE" = true ]; then
  VITE_ARGS+=("VITE_FIRESTORE_EMULATOR_HOST=localhost:${FIRESTORE_PORT}" "VITE_FIRESTORE_NAMESPACE=${NAMESPACE}")
fi
if [ "$USES_AUTH" = true ]; then
  VITE_ARGS+=("VITE_AUTH_EMULATOR_HOST=localhost:${AUTH_PORT}")
fi
if [ "$USES_STORAGE" = true ]; then
  VITE_ARGS+=("VITE_STORAGE_EMULATOR_HOST=localhost:${STORAGE_PORT}")
fi
if [ "$USES_FUNCTIONS" = true ]; then
  VITE_ARGS+=("VITE_FUNCTIONS_EMULATOR_PORT=${FUNCTIONS_PORT}")
  VITE_ARGS+=("VITE_FIREBASE_PROJECT_ID=${EMULATOR_PROJECT_ID}")
fi

# Set GitHub branch for apps that fetch raw content from GitHub
VITE_ARGS+=("VITE_GITHUB_BRANCH=$(git branch --show-current)")

# Start Vite dev server
cd "$REPO_ROOT/$APP_DIR"
if [ ${#VITE_ARGS[@]} -gt 0 ]; then
  env "${VITE_ARGS[@]}" npx vite --port "${VITE_PORT}" --strictPort &
else
  npx vite --port "${VITE_PORT}" --strictPort &
fi
VITE_PID=$!
cd "$REPO_ROOT"

# Poll until Vite is serving
ELAPSED=0
until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${VITE_PORT}/" 2>/dev/null | grep -q '^200$'; do
  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo "ERROR: Vite dev server did not start within ${TIMEOUT}s" >&2
    exit 1
  fi
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

# Print summary
echo ""
echo "========================================"
echo "  QA Server Ready"
echo "========================================"
echo ""
echo "  App URL:  http://localhost:${VITE_PORT}"
if [ "$USES_AUTH" = true ]; then
  echo ""
  echo "  Auth: Sign in via GitHub (emulator fake account picker)"
  echo "  Seeded user: test@example.com (Test User)"
fi
if [ "$USES_FIRESTORE" = true ]; then
  echo ""
  echo "  Firestore emulator: localhost:${FIRESTORE_PORT}"
  echo "  Firestore namespace: ${NAMESPACE}"
fi
if [ "$USES_AUTH" = true ]; then
  echo "  Auth emulator:      localhost:${AUTH_PORT}"
fi
if [ "$USES_STORAGE" = true ]; then
  echo "  Storage emulator:   localhost:${STORAGE_PORT}"
fi
if [ "$USES_FUNCTIONS" = true ]; then
  echo "  Functions emulator: localhost:${FUNCTIONS_PORT}"
fi
echo ""
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

# Block until Ctrl+C
wait
