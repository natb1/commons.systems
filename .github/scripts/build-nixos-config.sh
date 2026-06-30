#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT=$(git rev-parse --show-toplevel)
echo "=== nix build .#nixosConfigurations.nixos.config.system.build.toplevel ==="
nix build "$REPO_ROOT#nixosConfigurations.nixos.config.system.build.toplevel" \
  --no-link --print-build-logs
echo "PASS: nixosConfigurations.nixos build"
