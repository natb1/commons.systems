#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# Install root node_modules once (knip runs at repo root, not per-workspace)
ensure_deps

echo "=== Dead-code check (knip) ==="
if (cd "$REPO_ROOT" && npx knip --max-issues 0); then
  echo "PASS: dead-code check"
else
  echo "FAIL: dead-code check" >&2
  exit 1
fi

echo "All dead-code checks passed."
