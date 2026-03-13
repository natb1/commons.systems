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

if [ "${NPM_DEPS_INSTALLED:-}" != "1" ]; then
  (cd "$REPO_ROOT" && npm ci)
fi

detect_features "$REPO_ROOT/$APP_DIR/src/" "$REPO_ROOT" "$APP_NAME"

PREVIEW_NAMESPACE=$(get_firestore_namespace "$APP_NAME" "preview-${CHANNEL_ID}")

# Build (uses preview namespace, no emulator)
cd "$REPO_ROOT/$APP_DIR"
VITE_FIRESTORE_NAMESPACE="$PREVIEW_NAMESPACE" \
  VITE_GITHUB_BRANCH="${VITE_GITHUB_BRANCH:-main}" \
  npm run build
cd "$REPO_ROOT"

# Delete existing channel if present
echo "Cleaning up existing preview channel '$CHANNEL_ID' on site '$HOSTING_SITE'..."
delete_preview_channel "$CHANNEL_ID" "$HOSTING_SITE"

# Deploy new hosting channel (uses deploy target from .firebaserc)
echo "Deploying to preview channel '$CHANNEL_ID' on site '$HOSTING_SITE'..."
DEPLOY_OUTPUT=$(npx firebase-tools hosting:channel:deploy "$CHANNEL_ID" \
  --only "$APP_NAME" \
  --project "$FIREBASE_PROJECT_ID" \
  --expires 7d \
  --json) || {
  echo "Deploy failed:" >&2
  echo "$DEPLOY_OUTPUT" >&2
  exit 1
}

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  echo "Seeding Firestore (namespace: ${PREVIEW_NAMESPACE})..."
  APP_NAME="$APP_NAME" FIRESTORE_NAMESPACE="$PREVIEW_NAMESPACE" SEED_TEST_ONLY=true npx tsx firestoreutil/bin/run-seed.ts
fi

# Extract preview URL from deploy output
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | jq -r '
  (.result // .) | to_entries[] | select(.value.url) | .value.url
' 2>/dev/null | head -1) || true

if [ -z "$PREVIEW_URL" ]; then
  echo "ERROR: Could not extract preview URL from deploy output." >&2
  echo "Expected JSON with .result.<site>.url structure, got:" >&2
  echo "$DEPLOY_OUTPUT" >&2
  exit 1
fi

echo "PREVIEW_URL=$PREVIEW_URL"
