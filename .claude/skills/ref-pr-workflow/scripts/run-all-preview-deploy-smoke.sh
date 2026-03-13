#!/usr/bin/env bash
set -euo pipefail

CHANNEL_ID="${1:?Usage: run-all-preview-deploy-smoke.sh <channel-id>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh")

(cd "$REPO_ROOT" && npm ci)

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

  # Run smoke tests against preview URL
  echo "=== Smoke tests: $app ==="
  if "$SCRIPT_DIR/run-smoke-tests.sh" "$app" "$PREVIEW_URL"; then
    echo "PASS: $app smoke tests"
  else
    echo "FAIL: $app smoke tests" >&2
    FAILURES+=("$app:smoke")
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
