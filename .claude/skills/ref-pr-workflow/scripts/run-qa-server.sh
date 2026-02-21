#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-qa-server.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"

# Check if app uses Firestore (has firebase dependency)
USES_FIRESTORE=false
if grep -q '"firebase"' "$APP_PKG" 2>/dev/null; then
  USES_FIRESTORE=true
fi

# Detect auth usage
USES_AUTH=false
if grep -rq '"firebase/auth"' "$REPO_ROOT/$APP_DIR/src/" 2>/dev/null; then
  USES_AUTH=true
fi

# Install firestoreutil if app depends on it (file: dependency)
if grep -q '"@commons-systems/firestoreutil"' "$APP_PKG" 2>/dev/null; then
  echo "Installing firestoreutil dependency..."
  cd "$REPO_ROOT/firestoreutil"
  npm ci
  cd "$REPO_ROOT"
fi

# Install authutil if app depends on it or uses auth
if grep -q '"@commons-systems/authutil"' "$APP_PKG" 2>/dev/null || [ "$USES_AUTH" = true ]; then
  echo "Installing authutil dependency..."
  cd "$REPO_ROOT/authutil"
  npm ci
  cd "$REPO_ROOT"
fi

# Install app dependencies
cd "$REPO_ROOT/$APP_DIR"
npm ci
cd "$REPO_ROOT"

# Find available ports
VITE_PORT=$(node -e "
  const s = require('net').createServer();
  s.listen(0, () => { console.log(s.address().port); s.close(); });
")

FIRESTORE_PORT=""
if [ "$USES_FIRESTORE" = true ]; then
  FIRESTORE_PORT=$(node -e "
    const s = require('net').createServer();
    s.listen(0, () => { console.log(s.address().port); s.close(); });
  ")
  echo "Firestore emulator will use port $FIRESTORE_PORT"
fi

AUTH_PORT=""
if [ "$USES_AUTH" = true ]; then
  AUTH_PORT=$(node -e "
    const s = require('net').createServer();
    s.listen(0, () => { console.log(s.address().port); s.close(); });
  ")
  echo "Auth emulator will use port $AUTH_PORT"
fi

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
EMULATORS_JSON="$EMULATORS_JSON}"

# Build top-level config
CONFIG_JSON="{"
if [ "$USES_FIRESTORE" = true ]; then
  CONFIG_JSON="$CONFIG_JSON\"firestore\": {\"rules\": \"firestore.rules\"}, "
fi
CONFIG_JSON="$CONFIG_JSON\"emulators\": $EMULATORS_JSON}"

echo "$CONFIG_JSON" > "$TEMP_FIREBASE_JSON"

# Cleanup on exit: kill Vite + emulators, remove temp file
EMULATOR_PID=""
VITE_PID=""
cleanup() {
  echo ""
  echo "Shutting down..."
  if [ -n "$VITE_PID" ]; then
    kill "$VITE_PID" 2>/dev/null || true
    wait "$VITE_PID" 2>/dev/null || true
  fi
  if [ -n "$EMULATOR_PID" ]; then
    kill "$EMULATOR_PID" 2>/dev/null || true
    wait "$EMULATOR_PID" 2>/dev/null || true
  fi
  rm -f "$TEMP_FIREBASE_JSON"
  echo "QA server stopped."
}
trap cleanup EXIT

# Start Firebase emulators in background (if any emulators needed)
if [ -n "$EMULATOR_LIST" ]; then
  npx firebase-tools emulators:start --only "$EMULATOR_LIST" --config "$TEMP_FIREBASE_JSON" --project commons-systems &
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

  # Seed Firestore with "qa" namespace
  echo "Seeding Firestore (namespace: qa)..."
  FIRESTORE_EMULATOR_HOST="localhost:${FIRESTORE_PORT}" \
  FIRESTORE_NAMESPACE="qa" \
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

# Build Vite env vars
VITE_ENV=""
if [ "$USES_FIRESTORE" = true ]; then
  VITE_ENV="VITE_FIRESTORE_EMULATOR_HOST=localhost:${FIRESTORE_PORT} VITE_FIRESTORE_NAMESPACE=qa"
fi
if [ "$USES_AUTH" = true ]; then
  VITE_ENV="$VITE_ENV VITE_AUTH_EMULATOR_HOST=localhost:${AUTH_PORT}"
fi

# Start Vite dev server
cd "$REPO_ROOT/$APP_DIR"
if [ -n "$VITE_ENV" ]; then
  eval "$VITE_ENV npx vite --port ${VITE_PORT} --strictPort" &
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
  echo "  Test credentials:"
  echo "    Email:    test@example.com"
  echo "    Password: testpassword"
fi
if [ "$USES_FIRESTORE" = true ]; then
  echo ""
  echo "  Firestore emulator: localhost:${FIRESTORE_PORT}"
  echo "  Firestore namespace: qa"
fi
if [ "$USES_AUTH" = true ]; then
  echo "  Auth emulator:      localhost:${AUTH_PORT}"
fi
echo ""
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

# Block until Ctrl+C
wait
