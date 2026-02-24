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

APP_NAME=$(get_app_name "$APP_DIR")
HOSTING_SITE=$(get_hosting_site "$REPO_ROOT" "$APP_NAME")

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"

CHANNEL_ID="pr-${PR_NUMBER}"

# Delete preview hosting channel
echo "Deleting preview channel '${CHANNEL_ID}' from site '$HOSTING_SITE'..."
DELETE_OUTPUT=$(npx firebase-tools hosting:channel:delete "$CHANNEL_ID" --site "$HOSTING_SITE" --force --project "$FIREBASE_PROJECT_ID" 2>&1) || {
  if echo "$DELETE_OUTPUT" | grep -qi "not found\|does not exist\|NOT_FOUND"; then
    echo "Preview channel already deleted."
  else
    echo "WARNING: Failed to delete preview channel: $DELETE_OUTPUT" >&2
  fi
}

# Delete namespaced Firestore data
if [ "$USES_FIRESTORE" = true ]; then
  NAMESPACE=$(get_firestore_namespace "$APP_NAME" "preview-${CHANNEL_ID}")
  echo "Deleting Firestore namespace '${NAMESPACE}'..."
  install_local_deps "$REPO_ROOT" "$APP_PKG"
  (cd "$REPO_ROOT/firestoreutil" && npm ci)
  FIRESTORE_NAMESPACE="$NAMESPACE" npx tsx firestoreutil/bin/run-delete-namespace.ts
fi

echo "Preview cleanup complete."
