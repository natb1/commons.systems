#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)

echo "=== rules-test (Firestore rules unit suite) ==="
# Boots the Firestore + Storage emulators (emulator startup also validates rules
# syntax), then runs the vitest rules suite against them. The CI job installs
# workspace node_modules via an explicit 'Install workspace dependencies' step.
npm test --prefix "$REPO_ROOT/packages/rules-test"
