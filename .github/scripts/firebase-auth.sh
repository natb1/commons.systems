#!/usr/bin/env bash
# Required: FIREBASE_SERVICE_ACCOUNT_JSON, GITHUB_ENV (writable file path; set by GitHub Actions)
# Optional: FIREBASE_PROJECT_ID (passed through to GITHUB_ENV for downstream steps)
set -euo pipefail

if [ -z "${FIREBASE_SERVICE_ACCOUNT_JSON:-}" ]; then
  echo "::error::FIREBASE_SERVICE_ACCOUNT_JSON is not set or is empty" >&2
  exit 1
fi

CREDS_FILE=$(mktemp --suffix=.json)
echo "$FIREBASE_SERVICE_ACCOUNT_JSON" > "$CREDS_FILE"
echo "GOOGLE_APPLICATION_CREDENTIALS=$CREDS_FILE" >> "$GITHUB_ENV"
echo "CREDS_FILE=$CREDS_FILE" >> "$GITHUB_ENV"

if [ -n "${FIREBASE_PROJECT_ID:-}" ]; then
  echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" >> "$GITHUB_ENV"
fi
