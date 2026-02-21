#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-preview-deploy.sh <app-dir> <channel-id>}"
CHANNEL_ID="${2:?Usage: run-preview-deploy.sh <app-dir> <channel-id>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"

# Check if app uses Firestore (has firebase dependency)
USES_FIRESTORE=false
if grep -q '"firebase"' "$APP_PKG" 2>/dev/null; then
  USES_FIRESTORE=true
fi

# Install firestoreutil if app depends on it (file: dependency)
if grep -q '"@commons-systems/firestoreutil"' "$APP_PKG" 2>/dev/null; then
  echo "Installing firestoreutil dependency..."
  cd "$REPO_ROOT/firestoreutil"
  npm ci
  cd "$REPO_ROOT"
fi

# Install authutil if app depends on it
if grep -q '"@commons-systems/authutil"' "$APP_PKG" 2>/dev/null; then
  echo "Installing authutil dependency..."
  cd "$REPO_ROOT/authutil"
  npm ci
  cd "$REPO_ROOT"
fi

# Install app dependencies and build (no emulator env vars — production build)
cd "$REPO_ROOT/$APP_DIR"
npm ci
npm run build
cd "$REPO_ROOT"

# Deploy Firestore rules (ensures rules match the PR branch)
if [ "$USES_FIRESTORE" = true ]; then
  echo "Deploying Firestore rules..."
  npx firebase-tools deploy --only firestore:rules --project commons-systems
fi

# Delete existing channel if present (ignore errors if it doesn't exist)
echo "Cleaning up existing preview channel '$CHANNEL_ID'..."
npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --force --project commons-systems 2>/dev/null || true

# Deploy new hosting channel
echo "Deploying to preview channel '$CHANNEL_ID'..."
DEPLOY_OUTPUT=$(npx firebase-tools hosting:channel:deploy "$CHANNEL_ID" \
  --project commons-systems \
  --expires 7d \
  --json)

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  echo "Seeding Firestore (namespace: prod)..."
  FIRESTORE_NAMESPACE=prod npx tsx firestoreutil/bin/run-seed.ts
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

echo "PREVIEW_URL=$PREVIEW_URL"
