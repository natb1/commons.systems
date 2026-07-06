#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"
BASE_URL="${2:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# Resolve nix-provisioned Playwright browsers when PLAYWRIGHT_BROWSERS_PATH is
# unset (re-execs under `nix develop` on NixOS); no-op when the var is set or
# nix is absent, leaving the npx fallback below to run.
ensure_playwright_browsers "$0" "$@"

ensure_deps

cd "$REPO_ROOT/$APP_DIR"

# Wait for Firebase CDN to STABLY serve the deployed release before testing.
# Firebase Hosting release propagation is not atomic across the edge, so a
# single good root response can be followed by a transient 503 or a stale
# version. wait_for_stable_propagation gates on N consecutive good observations
# (root doc + a hashed asset each), not "break on first 200".
#
# Deliberate tradeoff: this raises happy-path latency by ~(REQUIRED_CONSECUTIVE-1)
# × INTERVAL (~4s at defaults — success returns before the final sleep) over the
# old first-200 break — bounded and intended, in exchange for not starting tests
# mid-propagation. Under `set -e` a non-zero
# return aborts the script with the function's error already on stderr (the
# desired hard-fail).
echo "Waiting for preview to become available at $BASE_URL..."
wait_for_stable_propagation "$BASE_URL"

# Install Playwright browsers (bounded timeout+retry; skips when nix provides them)
playwright_install_with_deps

# Run smoke tests
BASE_URL="$BASE_URL" npx playwright test --config e2e/playwright.config.ts --grep @hosting --project=desktop
