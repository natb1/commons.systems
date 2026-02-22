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

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"
install_local_deps "$REPO_ROOT" "$APP_PKG"

# Install app dependencies and build (no emulator env vars — production build)
cd "$REPO_ROOT/$APP_DIR"
npm ci
VITE_FIRESTORE_NAMESPACE="preview-${CHANNEL_ID}" npm run build
cd "$REPO_ROOT"

# Delete existing channel if present (ignore errors if it doesn't exist)
echo "Cleaning up existing preview channel '$CHANNEL_ID'..."
npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --force --project "$FIREBASE_PROJECT_ID" 2>/dev/null || true

# Deploy new hosting channel
echo "Deploying to preview channel '$CHANNEL_ID'..."
DEPLOY_OUTPUT=$(npx firebase-tools hosting:channel:deploy "$CHANNEL_ID" \
  --project "$FIREBASE_PROJECT_ID" \
  --expires 7d \
  --json)

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  echo "Seeding Firestore (namespace: preview-${CHANNEL_ID})..."
  FIRESTORE_NAMESPACE="preview-${CHANNEL_ID}" npx tsx firestoreutil/bin/run-seed.ts
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
