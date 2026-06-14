#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

# rules-test is a workspace; the emulator-backed suite needs the workspace
# node_modules at the repo root. ensure_deps installs them when absent.
ensure_deps

echo "=== rules-test (Firestore rules unit suite) ==="
# Boots the Firestore + Storage emulators (emulator startup also validates rules
# syntax), then runs the vitest rules suite against them.
npm test --prefix "$REPO_ROOT/rules-test"
