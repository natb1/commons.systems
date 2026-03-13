#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT=$(git rev-parse --show-toplevel)

CHANGED_APPS=$("$SCRIPT_DIR/get-changed-apps.sh" "$@")

(cd "$REPO_ROOT" && npm ci) && export NPM_DEPS_INSTALLED=1

FAILURES=()
TESTED=0

while IFS= read -r app; do
  [ -z "$app" ] && continue
  # Only run acceptance tests for apps that have a playwright.config.ts
  [ -f "$REPO_ROOT/$app/e2e/playwright.config.ts" ] || continue

  echo "=== Acceptance tests: $app ==="
  TESTED=$((TESTED + 1))
  if "$SCRIPT_DIR/run-acceptance-tests.sh" "$app"; then
    echo "PASS: $app"
  else
    echo "FAIL: $app" >&2
    FAILURES+=("$app")
  fi
done <<< "$CHANGED_APPS"

if [ "$TESTED" -eq 0 ]; then
  echo "No changed apps have acceptance tests. Nothing to run."
  exit 0
fi

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Failed acceptance tests: ${FAILURES[*]}" >&2
  exit 1
fi

echo "All acceptance tests passed."
