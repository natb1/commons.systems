#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"
BASE_URL="${2:?Usage: run-smoke-tests.sh <app-dir> <base-url>}"

# Remember repo root (script must be invoked from repo root)
REPO_ROOT="$(pwd)"
APP_PKG="$REPO_ROOT/$APP_DIR/package.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

if [ "${NPM_DEPS_INSTALLED:-}" != "1" ]; then
  (cd "$REPO_ROOT" && npm ci)
fi

cd "$REPO_ROOT/$APP_DIR"

# Install Playwright browsers (skip if nix provides them via PLAYWRIGHT_BROWSERS_PATH)
if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  npx playwright install --with-deps chromium
fi

# Run smoke tests
BASE_URL="$BASE_URL" npx playwright test --config e2e/playwright.config.ts --grep @smoke
