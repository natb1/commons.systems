#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-prod-deploy.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

APP_NAME=$(get_app_name "$APP_DIR")
HOSTING_SITE=$(get_hosting_site "$REPO_ROOT" "$APP_NAME")

detect_features "$REPO_ROOT/$APP_DIR/src/"
install_local_deps "$REPO_ROOT" "$APP_PKG"

# Resolve per-app GA measurement ID from environment (e.g. GA_MEASUREMENT_ID_LANDING).
# Empty/unset silently disables analytics for the app (initAnalytics returns a no-op).
GA_VAR="GA_MEASUREMENT_ID_$(echo "$APP_NAME" | tr '[:lower:]' '[:upper:]')"
VITE_GA_MEASUREMENT_ID="${!GA_VAR:-}"
export VITE_GA_MEASUREMENT_ID

# Install app dependencies and build.
# Production build uses the app's compiled-in fallback namespace (e.g. "<app>/prod" from firebase.ts).
cd "$REPO_ROOT/$APP_DIR"
npm ci
npm run build
cd "$REPO_ROOT"

# Deploy hosting to production (target specific site)
echo "Deploying hosting to production (site: $HOSTING_SITE)..."
npx firebase-tools deploy --only "hosting:$APP_NAME" --project "$FIREBASE_PROJECT_ID"

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  NAMESPACE=$(get_firestore_namespace "$APP_NAME" "prod")
  echo "Seeding Firestore (namespace: ${NAMESPACE})..."
  APP_NAME="$APP_NAME" FIRESTORE_NAMESPACE="$NAMESPACE" npx tsx firestoreutil/bin/run-seed.ts
fi

echo "Production deployment complete."
