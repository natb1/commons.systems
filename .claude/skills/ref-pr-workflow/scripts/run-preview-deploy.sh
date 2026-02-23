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

# Install app dependencies and build (no emulator env vars — production build)
cd "$REPO_ROOT/$APP_DIR"
npm ci
VITE_FIRESTORE_NAMESPACE="${APP_NAME}-preview-${CHANNEL_ID}" npm run build
cd "$REPO_ROOT"

# Delete existing channel if present (ignore errors if it doesn't exist)
echo "Cleaning up existing preview channel '$CHANNEL_ID' on site '$HOSTING_SITE'..."
npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --site "$HOSTING_SITE" --force --project "$FIREBASE_PROJECT_ID" 2>/dev/null || true

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
  echo "Seeding Firestore (namespace: ${APP_NAME}-preview-${CHANNEL_ID})..."
  APP_NAME="$APP_NAME" FIRESTORE_NAMESPACE="${APP_NAME}-preview-${CHANNEL_ID}" npx tsx firestoreutil/bin/run-seed.ts
fi

# Extract preview URL from deploy output
PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | node -e "
  const chunks = [];
  process.stdin.on('data', c => chunks.push(c));
  process.stdin.on('end', () => {
    const data = JSON.parse(chunks.join(''));
    const hosting = data.result || data;
    // URL is in result.<site-id>.url or result.<site-id>
    const keys = Object.keys(hosting);
    for (const key of keys) {
      if (hosting[key] && hosting[key].url) {
        console.log(hosting[key].url);
        return;
      }
    }
    // Fallback: look for url field directly
    if (hosting.url) {
      console.log(hosting.url);
    }
  });
")

if [ -z "$PREVIEW_URL" ]; then
  echo "ERROR: Could not extract preview URL from deploy output" >&2
  echo "Deploy output: $DEPLOY_OUTPUT" >&2
  exit 1
fi

echo "PREVIEW_URL=$PREVIEW_URL"
