#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-acceptance-tests.sh <app-dir> [base-url]}"
EXTERNAL_BASE_URL="${2:-}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# Resolve nix-provisioned Playwright browsers when PLAYWRIGHT_BROWSERS_PATH is
# unset (re-execs under `nix develop` on NixOS); no-op when the var is set or
# nix is absent, leaving the npx fallback below to run.
ensure_playwright_browsers "$0" "$@"

APP_NAME=$(get_app_name "$APP_DIR")
EMULATOR_PROJECT_ID=$(get_emulator_project_id)

ensure_deps

cd "$REPO_ROOT/$APP_DIR"

# When a base URL is provided, skip emulator setup and run tests directly.
# This path runs against a Vite QA dev server: no Firebase Hosting headers and
# public data only. Exclude @hosting tests (require Hosting emulator or deployed
# preview), @testonly tests (require testOnly seed data), and @build tests
# (require the production build / prerendered output, absent from the dev server)
# — everything else runs.
if [ -n "$EXTERNAL_BASE_URL" ]; then
  playwright_install_with_deps
  BASE_URL="$EXTERNAL_BASE_URL" npx playwright test --config e2e/playwright.config.ts --grep-invert "@hosting|@testonly|@build"
  exit 0
fi

cd "$REPO_ROOT"

cleanup_stale_worktree_processes
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

BUILD_ARGS+=("VITE_FIREBASE_PROJECT_ID=${EMULATOR_PROJECT_ID}")

# Firebase credentials — emulators don't validate these, but the client-side
# config module (packages/firebaseutil/src/config.ts) requires them at startup.
BUILD_ARGS+=("VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY:-emulator-api-key}")
BUILD_ARGS+=("VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY:-emulator-recaptcha-key}")

# Set GitHub branch for apps that fetch raw content from GitHub
BUILD_ARGS+=("VITE_GITHUB_BRANCH=$(git branch --show-current)")

env "${BUILD_ARGS[@]}" npm run build

cd "$REPO_ROOT"

# Install Playwright browsers (bounded timeout+retry; skips when nix provides them).
# Subshell keeps the surrounding code running from $REPO_ROOT; under set -e a
# non-zero subshell aborts the parent.
(cd "$REPO_ROOT/$APP_DIR" && playwright_install_with_deps)

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
  # Inject http://localhost:* into CSP connect-src for emulator compatibility
  APP_HEADERS=$(echo "$APP_HEADERS" | jq -c '
    [.[] | .headers = [.headers[] |
      if .key == "Content-Security-Policy"
      then .value = (.value | gsub("connect-src "; "connect-src http://localhost:* "))
      else . end
    ]]')
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

# Capture worktree path now — working directory may change before trap fires, causing git rev-parse to fail
WT_PATH="$(git rev-parse --show-toplevel)"

# Cleanup on exit: kill all processes for this worktree, remove stale hub and temp config
cleanup() {
  kill_worktree_processes "$WT_PATH" || echo "WARNING: kill_worktree_processes failed" >&2
  cleanup_stale_hub || echo "WARNING: cleanup_stale_hub failed" >&2
  rm -f "$TEMP_FIREBASE_JSON" "${EMU_LOG:-}"
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

# Export the Firestore namespace so Cloud Functions running in the emulator
# read from the same path that was seeded.
if [ -n "$EMULATOR_NAMESPACE" ]; then
  export FIRESTORE_NAMESPACE="$EMULATOR_NAMESPACE"
fi

# Validate the readiness timeout up front — every readiness poll below shares it.
# Each poll loop exits the instant curl gets a 200, so a larger ceiling never
# slows a healthy start; it only adds headroom for slow CI (JVM cold start +
# scheduling jitter under contention can push a listener past a tight deadline;
# see #2192). Override with EMULATOR_READY_TIMEOUT (seconds).
TIMEOUT="${EMULATOR_READY_TIMEOUT:-300}"
# Validate: non-numeric input would make `[ $ELAPSED -ge $TIMEOUT ]` print
# 'integer expected' and evaluate false forever (infinite loop until the CI
# job timeout), and a value <= 0 would time out on the first iteration before
# the just-forked emulator has any chance to respond. Fail fast with a clear
# message instead.
case "$TIMEOUT" in
  '' | *[^0-9]*)
    echo "ERROR: EMULATOR_READY_TIMEOUT must be a positive integer (got '${EMULATOR_READY_TIMEOUT}')" >&2
    exit 1
    ;;
esac
if [ "$TIMEOUT" -le 0 ]; then
  echo "ERROR: EMULATOR_READY_TIMEOUT must be a positive integer (got '${EMULATOR_READY_TIMEOUT}')" >&2
  exit 1
fi

# The Functions emulator can hang non-deterministically at startup under CI
# resource contention (#2630): `emulators:start` brings every emulator up as a
# single process, so a Functions stall keeps the hosting listener from ever
# serving 200 and the hosting readiness poll burns the full TIMEOUT — surfacing
# as a misleading "hosting did not start within Ns" error. A fresh process
# usually starts cleanly, so we relaunch on a readiness timeout. Override the
# attempt count with EMULATOR_START_ATTEMPTS (default 2).
ATTEMPTS="${EMULATOR_START_ATTEMPTS:-2}"
case "$ATTEMPTS" in
  '' | *[^0-9]*)
    echo "ERROR: EMULATOR_START_ATTEMPTS must be a positive integer (got '${EMULATOR_START_ATTEMPTS}')" >&2
    exit 1
    ;;
esac
if [ "$ATTEMPTS" -le 0 ]; then
  echo "ERROR: EMULATOR_START_ATTEMPTS must be a positive integer (got '${EMULATOR_START_ATTEMPTS}')" >&2
  exit 1
fi

# Capture emulator stdout/stderr. The process is backgrounded and its output
# otherwise discarded, so a startup hang is invisible in CI; this log makes the
# real stall (the Functions runtime, not hosting) visible and is printed on any
# readiness-timeout failure. Removed by the cleanup() trap above.
EMU_LOG="$(get_tmpdir)/acceptance-emulators-${APP_NAME}.log"

# Launch every emulator and poll each used emulator's readiness endpoint. No
# seeding here — seeds run once, after all emulators are confirmed ready, so a
# relaunch on the retry path never re-seeds. Returns non-zero on the first
# readiness timeout so the caller can tear down and retry.
launch_and_await_emulators() {
  npx firebase-tools emulators:start --only "$EMULATORS" --config "$TEMP_FIREBASE_JSON" --project "$EMULATOR_PROJECT_ID" >"$EMU_LOG" 2>&1 &

  local elapsed=0
  until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${HOSTING_PORT}/" 2>/dev/null | grep -q '^200$'; do
    if [ "$elapsed" -ge "$TIMEOUT" ]; then
      echo "ERROR: Firebase hosting emulator did not start within ${TIMEOUT}s" >&2
      return 1
    fi
    sleep 1
    elapsed=$((elapsed + 1))
  done
  echo "Firebase hosting emulator ready on port ${HOSTING_PORT}"

  if [ "$USES_FIRESTORE" = true ]; then
    elapsed=0
    until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${FIRESTORE_PORT}/" 2>/dev/null | grep -q '^200$'; do
      if [ "$elapsed" -ge "$TIMEOUT" ]; then
        echo "ERROR: Firebase Firestore emulator did not start within ${TIMEOUT}s" >&2
        return 1
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    echo "Firebase Firestore emulator ready on port ${FIRESTORE_PORT}"
  fi

  if [ "$USES_AUTH" = true ]; then
    elapsed=0
    until curl -s "http://localhost:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/projects" >/dev/null 2>&1; do
      if [ "$elapsed" -ge "$TIMEOUT" ]; then
        echo "ERROR: Auth emulator did not start within ${TIMEOUT}s" >&2
        return 1
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    echo "Firebase Auth emulator ready on port ${AUTH_PORT}"
  fi

  if [ "$USES_STORAGE" = true ]; then
    elapsed=0
    until curl -s -o /dev/null -w '%{http_code}' "http://localhost:${STORAGE_PORT}/" 2>/dev/null | grep -qE '^[1-5]'; do
      if [ "$elapsed" -ge "$TIMEOUT" ]; then
        echo "ERROR: Storage emulator did not start within ${TIMEOUT}s" >&2
        return 1
      fi
      sleep 1
      elapsed=$((elapsed + 1))
    done
    echo "Firebase Storage emulator ready on port ${STORAGE_PORT}"
  fi

  return 0
}

ATTEMPT=1
while true; do
  if launch_and_await_emulators; then
    break
  fi

  echo "Emulator startup attempt ${ATTEMPT}/${ATTEMPTS} failed; last 50 lines of emulator output:" >&2
  tail -n 50 "$EMU_LOG" >&2 2>/dev/null || true
  echo "--- end emulator output ---" >&2

  if [ "$ATTEMPT" -ge "$ATTEMPTS" ]; then
    echo "ERROR: Firebase emulators did not become ready after ${ATTEMPTS} attempt(s)" >&2
    exit 1
  fi

  # Tear the hung emulator and its stale hub down before relaunching, so the
  # next emulators:start does not collide with a half-dead process or a stale
  # hub file on the already-allocated ports.
  kill_worktree_processes "$WT_PATH" || echo "WARNING: kill_worktree_processes failed" >&2
  cleanup_stale_hub || echo "WARNING: cleanup_stale_hub failed" >&2

  ATTEMPT=$((ATTEMPT + 1))
  echo "Retrying emulator startup (attempt ${ATTEMPT}/${ATTEMPTS})..." >&2
  sleep 5
done

# All emulators are ready — seed each used emulator once.
if [ "$USES_FIRESTORE" = true ]; then
  echo "Seeding Firestore..."
  APP_NAME="$APP_NAME" \
  FIREBASE_PROJECT_ID="$EMULATOR_PROJECT_ID" \
  FIRESTORE_EMULATOR_HOST="localhost:${FIRESTORE_PORT}" \
  FIRESTORE_NAMESPACE="${EMULATOR_NAMESPACE}" \
  SEED_TEST_ONLY=true \
  node --import tsx/esm packages/firestoreutil/bin/run-seed.ts
fi

if [ "$USES_AUTH" = true ]; then
  echo "Seeding auth user..."
  APP_NAME="$APP_NAME" AUTH_EMULATOR_HOST="localhost:${AUTH_PORT}" FIREBASE_PROJECT_ID="$EMULATOR_PROJECT_ID" node --import tsx/esm packages/authutil/bin/run-auth-seed.ts
fi

if [ "$USES_STORAGE" = true ] && [ -f "$REPO_ROOT/$APP_DIR/seeds/storage.ts" ]; then
  echo "Seeding Storage..."
  APP_NAME="$APP_NAME" STORAGE_EMULATOR_HOST="localhost:${STORAGE_PORT}" STORAGE_BUCKET="${EMULATOR_PROJECT_ID}.firebasestorage.app" SEED_TEST_ONLY=true node --import tsx/esm "$REPO_ROOT/packages/firebaseutil/bin/run-storage-seed.ts"
fi

# Run Playwright acceptance tests
cd "$REPO_ROOT/$APP_DIR"
BASE_URL="http://localhost:${HOSTING_PORT}" npx playwright test --config e2e/playwright.config.ts
