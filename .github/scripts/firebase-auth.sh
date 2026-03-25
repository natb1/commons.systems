#!/usr/bin/env bash
set -euo pipefail

CREDS_FILE=$(mktemp --suffix=.json)
echo "$FIREBASE_SERVICE_ACCOUNT_JSON" > "$CREDS_FILE"
echo "GOOGLE_APPLICATION_CREDENTIALS=$CREDS_FILE" >> "$GITHUB_ENV"
echo "CREDS_FILE=$CREDS_FILE" >> "$GITHUB_ENV"

if [ -n "${FIREBASE_PROJECT_ID:-}" ]; then
  echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" >> "$GITHUB_ENV"
fi
