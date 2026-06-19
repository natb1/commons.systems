#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(git rev-parse --show-toplevel)
echo "=== nix build .#darwinConfigurations.default.system ==="
nix build "$REPO_ROOT#darwinConfigurations.default.system" \
  --no-link --print-build-logs
echo "PASS: darwinConfigurations.default build"
