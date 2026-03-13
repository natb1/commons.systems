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

if [ "${NPM_DEPS_INSTALLED:-}" != "1" ]; then
  (cd "$REPO_ROOT" && npm ci)
fi

detect_features "$REPO_ROOT/$APP_DIR/src/" "$REPO_ROOT" "$APP_NAME"

CHANNEL_ID="pr-${PR_NUMBER}"

# Delete preview hosting channel
echo "Deleting preview channel '${CHANNEL_ID}' from site '$HOSTING_SITE'..."
delete_preview_channel "$CHANNEL_ID" "$HOSTING_SITE"

# Delete namespaced Firestore data
if [ "$USES_FIRESTORE" = true ]; then
  NAMESPACE=$(get_firestore_namespace "$APP_NAME" "preview-${CHANNEL_ID}")
  echo "Deleting Firestore namespace '${NAMESPACE}'..."
  FIRESTORE_NAMESPACE="$NAMESPACE" npx tsx firestoreutil/bin/run-delete-namespace.ts
fi

echo "Preview cleanup complete."
