#!/usr/bin/env bash
set -euo pipefail

PR_NUMBER="${1:?Usage: run-all-cleanup-preview.sh <pr-number>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# Post-merge context: origin/main == HEAD, so use HEAD~1 as base
CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh" --base HEAD~1)

(cd "$REPO_ROOT" && npm ci)

FAILURES=()
CLEANED=0

while IFS= read -r app; do
  [ -z "$app" ] && continue
  # Only cleanup apps that have a hosting target
  if ! get_hosting_site "$REPO_ROOT" "$app" >/dev/null 2>&1; then
    continue
  fi

  echo "=== Cleanup preview: $app ==="
  CLEANED=$((CLEANED + 1))
  if "$SCRIPT_DIR/run-cleanup-preview.sh" "$app" "$PR_NUMBER"; then
    echo "PASS: $app cleanup"
  else
    echo "FAIL: $app cleanup" >&2
    FAILURES+=("$app")
  fi
done <<< "$CHANGED_APPS"

if [ "$CLEANED" -eq 0 ]; then
  echo "No changed apps have hosting targets. Nothing to clean up."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed cleanups: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All preview cleanups complete."
