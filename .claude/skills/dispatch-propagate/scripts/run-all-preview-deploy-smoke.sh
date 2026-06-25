#!/usr/bin/env bash
set -euo pipefail

CHANNEL_ID="${1:?Usage: run-all-preview-deploy-smoke.sh <channel-id>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh")

ensure_deps

# Auth probe (#2481): the per-app deploys run firebase-tools with --json, which
# suppresses ALL of its diagnostics — --debug is ignored and no firebase-debug.log
# is written — so the real cause of a "Failed to authenticate" deploy never reaches
# the job log. Run one standalone NON-json probe up front (not wrapped in
# firebase_deploy_retry) so the actual error surfaces, and report which key the CI
# cred file carries WITHOUT dumping the private key. This makes a CI auth failure
# diagnosable and fails fast before six build+deploy cycles burn ~20 minutes.
echo "=== Firebase auth probe ==="
echo "GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS:-<unset>}"
if [ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && [ -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
  ls -l "$GOOGLE_APPLICATION_CREDENTIALS"
  if jq -r '.private_key_id' "$GOOGLE_APPLICATION_CREDENTIALS" 2>/dev/null | grep -q '^4a8d027'; then
    echo "CI-KEY: NEW (re-provisioned 4a8d027… key)"
  else
    echo "CI-KEY: STALE/OTHER (cred file does not carry the 4a8d027… key)"
  fi
else
  echo "WARNING: GOOGLE_APPLICATION_CREDENTIALS missing or not a file"
fi
echo "firebase-tools version: $(npx firebase-tools --version 2>/dev/null | tail -1)"
echo "runner clock (UTC): $(date -u '+%Y-%m-%dT%H:%M:%SZ')  epoch=$(date -u +%s)"
# Stray auth env that could shadow GOOGLE_APPLICATION_CREDENTIALS (print presence,
# never the value — these are secret-bearing).
[ -n "${FIREBASE_TOKEN:-}" ] && echo "FIREBASE_TOKEN: set (would override ADC)" || echo "FIREBASE_TOKEN: unset"
[ -n "${GOOGLE_OAUTH_ACCESS_TOKEN:-}" ] && echo "GOOGLE_OAUTH_ACCESS_TOKEN: set" || echo "GOOGLE_OAUTH_ACCESS_TOKEN: unset"
echo "--- projects:list --debug (non-json; underlying token-endpoint error surfaces) ---"
npx firebase-tools projects:list --debug 2>&1 | tail -50 || echo "AUTH PROBE FAILED (see above)"
if [ -f "$REPO_ROOT/firebase-debug.log" ]; then
  echo "--- firebase-debug.log (last 60 lines) ---"
  tail -60 "$REPO_ROOT/firebase-debug.log"
fi
echo "=== end auth probe ==="

FAILURES=()
DEPLOYED=0
PREVIEW_COMMENT=""

while IFS= read -r app; do
  [ -z "$app" ] && continue
  # Only deploy apps that have a hosting target
  if ! get_hosting_site "$REPO_ROOT" "$app" >/dev/null 2>&1; then
    continue
  fi

  echo "=== Preview deploy: $app ==="
  DEPLOYED=$((DEPLOYED + 1))

  # Deploy preview and capture URL
  DEPLOY_OUTPUT=$("$SCRIPT_DIR/run-preview-deploy.sh" "$app" "$CHANNEL_ID" 2>&1 | tee /dev/stderr) || {
    echo "FAIL: $app preview deploy" >&2
    FAILURES+=("$app:deploy")
    continue
  }

  PREVIEW_URL=$(echo "$DEPLOY_OUTPUT" | grep '^PREVIEW_URL=' | cut -d= -f2-)
  if [ -z "$PREVIEW_URL" ]; then
    echo "FAIL: $app - could not extract preview URL" >&2
    FAILURES+=("$app:url")
    continue
  fi

  PREVIEW_COMMENT+="- **$app**: $PREVIEW_URL"$'\n'

  # Run smoke tests against preview URL (retry once with channel reset on failure)
  echo "=== Smoke tests: $app ==="
  if "$SCRIPT_DIR/run-smoke-tests.sh" "$app" "$PREVIEW_URL"; then
    echo "PASS: $app smoke tests"
  else
    echo "Smoke test failed — resetting channel and retrying..." >&2
    HOSTING_SITE=$(get_hosting_site "$REPO_ROOT" "$app")
    delete_preview_channel "$CHANNEL_ID" "$HOSTING_SITE"
    RETRY_OUTPUT=$("$SCRIPT_DIR/run-preview-deploy.sh" "$app" "$CHANNEL_ID" 2>&1 | tee /dev/stderr) || {
      echo "FAIL: $app retry deploy" >&2
      FAILURES+=("$app:smoke")
      continue
    }
    PREVIEW_URL=$(echo "$RETRY_OUTPUT" | grep '^PREVIEW_URL=' | cut -d= -f2-)
    echo "=== Smoke tests (retry): $app ==="
    if "$SCRIPT_DIR/run-smoke-tests.sh" "$app" "$PREVIEW_URL"; then
      echo "PASS: $app smoke tests (retry)"
    else
      echo "FAIL: $app smoke tests" >&2
      FAILURES+=("$app:smoke")
    fi
  fi
done <<< "$CHANGED_APPS"

if [ "$DEPLOYED" -eq 0 ]; then
  echo "No changed apps have hosting targets. Nothing to deploy."
  exit 0
fi

# Output the preview comment body for the workflow to post
if [ -n "$PREVIEW_COMMENT" ]; then
  echo "PREVIEW_COMMENT<<EOF"
  printf "Preview deployed:\n%s" "$PREVIEW_COMMENT"
  echo "EOF"
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All preview deploys and smoke tests passed."
