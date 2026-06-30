#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# The workflow resolves DIFF_BASE from the last-prod-deploy marker (the last
# successfully deployed commit), so change detection diffs from there. A dropped
# intermediate run is recovered by the next successful run, which re-covers the
# missed window.
# DEPLOY_ALL=1 deploys every app with a hosting target; the workflow sets it for
# workflow_dispatch and for the first-run bootstrap when no marker exists yet.
if [ "${DEPLOY_ALL:-}" = "1" ]; then
  CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh" --all)
else
  : "${DIFF_BASE:?DIFF_BASE required (set from the last-prod-deploy marker) for change detection}"
  CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh" --base "$DIFF_BASE")
fi

ensure_deps

FAILURES=()
DEPLOYED=0

while IFS= read -r app; do
  [ -z "$app" ] && continue
  # Only deploy apps that have a hosting target
  if ! SITE=$(get_hosting_site "$REPO_ROOT" "$app" 2>/dev/null); then
    continue
  fi

  echo "=== Production deploy: $app ==="
  DEPLOYED=$((DEPLOYED + 1))

  if "$SCRIPT_DIR/run-prod-deploy.sh" "$app"; then
    echo "PASS: $app deploy"
  else
    echo "FAIL: $app deploy" >&2
    FAILURES+=("$app:deploy")
    continue
  fi

  # Run smoke tests against production URL
  PROD_URL="https://${SITE}.web.app"
  echo "=== Smoke tests: $app ($PROD_URL) ==="
  if "$SCRIPT_DIR/run-smoke-tests.sh" "$app" "$PROD_URL"; then
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

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failures: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All production deploys and smoke tests passed."
