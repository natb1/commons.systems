#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-preview-deploy.sh <app-dir> <channel-id>}"
CHANNEL_ID="${2:?Usage: run-preview-deploy.sh <app-dir> <channel-id>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_NAME=$(get_app_name "$APP_DIR")
HOSTING_SITE=$(get_hosting_site "$REPO_ROOT" "$APP_NAME")

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"
install_local_deps "$REPO_ROOT" "$APP_PKG"

# Install app dependencies and build (uses preview namespace, no emulator)
cd "$REPO_ROOT/$APP_DIR"
npm ci
VITE_FIRESTORE_NAMESPACE="$(get_firestore_namespace "$APP_NAME" "preview-${CHANNEL_ID}")" npm run build
cd "$REPO_ROOT"

# Delete existing channel if present
echo "Cleaning up existing preview channel '$CHANNEL_ID' on site '$HOSTING_SITE'..."
DELETE_OUTPUT=$(npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --site "$HOSTING_SITE" --force --project "$FIREBASE_PROJECT_ID" 2>&1) || {
  if echo "$DELETE_OUTPUT" | grep -qi "not found\|does not exist\|NOT_FOUND"; then
    echo "Preview channel already deleted."
  else
    echo "WARNING: Failed to delete preview channel: $DELETE_OUTPUT" >&2
  fi
}

# Deploy new hosting channel (uses deploy target from .firebaserc)
echo "Deploying to preview channel '$CHANNEL_ID' on site '$HOSTING_SITE'..."
set +e
DEPLOY_OUTPUT=$(npx firebase-tools hosting:channel:deploy "$CHANNEL_ID" \
  --only "$APP_NAME" \
  --project "$FIREBASE_PROJECT_ID" \
  --expires 7d \
  --json 2>&1)
DEPLOY_EXIT=$?
set -e
if [ "$DEPLOY_EXIT" -ne 0 ]; then
  echo "Deploy failed with exit code $DEPLOY_EXIT" >&2
  echo "Output: $DEPLOY_OUTPUT" >&2
  exit 1
fi

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  NAMESPACE=$(get_firestore_namespace "$APP_NAME" "preview-${CHANNEL_ID}")
  echo "Seeding Firestore (namespace: ${NAMESPACE})..."
  APP_NAME="$APP_NAME" FIRESTORE_NAMESPACE="$NAMESPACE" npx tsx firestoreutil/bin/run-seed.ts
fi

# Extract preview URL from deploy output
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '
  (.result // .) | to_entries[] | select(.value.url) | .value.url
' 2>/dev/null | head -1)

if [ -z "$PREVIEW_URL" ]; then
  echo "ERROR: Could not extract preview URL from deploy output." >&2
  echo "Expected JSON with .result.<site>.url structure, got:" >&2
  echo "$DEPLOY_OUTPUT" >&2
  exit 1
fi

echo "PREVIEW_URL=$PREVIEW_URL"
