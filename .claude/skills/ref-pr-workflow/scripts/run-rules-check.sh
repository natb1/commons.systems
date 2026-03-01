#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:?Usage: run-rules-check.sh <repo-root>}"
cd "$REPO_ROOT"

echo "Checking Firestore rules syntax..."
npx firebase-tools emulators:exec \
  --only firestore \
  --project dummy \
  -- echo "Firestore rules syntax OK"
