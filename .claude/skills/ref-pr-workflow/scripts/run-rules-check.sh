#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:?Usage: run-rules-check.sh <repo-root>}"
cd "$REPO_ROOT"

echo "Checking Firestore rules syntax..."
# Start the Firestore emulator, which parses firestore.rules on startup.
# If rules contain a syntax error, emulator startup fails and this exits non-zero.
# The payload command (echo) is a no-op; validation is a side effect of startup.
# --project dummy avoids needing a real Firebase project ID for local syntax checks.
npx firebase-tools emulators:exec \
  --only firestore,storage \
  --project dummy \
  'echo "Firestore rules syntax OK"'
