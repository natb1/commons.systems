#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-cleanup-preview.sh <app-dir> <pr-number>}"
PR_NUMBER="${2:?Usage: run-cleanup-preview.sh <app-dir> <pr-number>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"

CHANNEL_ID="pr-${PR_NUMBER}"

# Delete preview hosting channel (ignore errors if already deleted)
echo "Deleting preview channel '${CHANNEL_ID}'..."
npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --force --project "$FIREBASE_PROJECT_ID" 2>/dev/null || true

# Delete namespaced Firestore data
if [ "$USES_FIRESTORE" = true ]; then
  echo "Deleting Firestore namespace 'preview-${CHANNEL_ID}'..."
  install_local_deps "$REPO_ROOT" "$APP_PKG"
  (cd "$REPO_ROOT/firestoreutil" && npm ci)
  FIRESTORE_NAMESPACE="preview-${CHANNEL_ID}" npx tsx firestoreutil/bin/run-delete-namespace.ts
fi

echo "Preview cleanup complete."
