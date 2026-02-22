#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-prod-deploy.sh <app-dir>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

detect_features "$APP_PKG" "$REPO_ROOT/$APP_DIR/src/"
install_local_deps "$REPO_ROOT" "$APP_PKG"

# Install app dependencies and build (no VITE_ env vars — defaults to "prod" namespace)
cd "$REPO_ROOT/$APP_DIR"
npm ci
npm run build
cd "$REPO_ROOT"

# Deploy hosting to production
echo "Deploying hosting to production..."
npx firebase-tools deploy --only hosting --project "$FIREBASE_PROJECT_ID"

# Deploy Firestore rules
echo "Deploying Firestore rules..."
npx firebase-tools deploy --only firestore:rules --project "$FIREBASE_PROJECT_ID"

# Seed Firestore (idempotent — uses doc.set() with fixed IDs)
if [ "$USES_FIRESTORE" = true ]; then
  echo "Seeding Firestore (namespace: prod)..."
  FIRESTORE_NAMESPACE="prod" npx tsx firestoreutil/bin/run-seed.ts
fi

echo "Production deployment complete."
