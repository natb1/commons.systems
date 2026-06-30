#!/usr/bin/env bash
# Verify the chromium revision shipped by the nix-provided playwright-driver
# matches the revision the npm-installed @playwright/test expects. Drift
# between the two breaks `playwright test` with "Executable doesn't exist at
# .../chromium_headless_shell-<X>/..." — the dir doesn't exist because
# playwright-driver shipped revision Y, not X.
#
# Reads:
#   - $PLAYWRIGHT_BROWSERS_PATH (set by flake.nix shellHook from
#     pkgs.playwright-driver.browsers)
#   - node_modules/playwright-core/browsers.json (installed by `npm ci`)
#
# When PLAYWRIGHT_BROWSERS_PATH is unset, the env hasn't been initialized via
# direnv / `nix develop` yet — playwright will fall back to downloading its
# own browsers, which means no drift to detect. Skip silently.
set -euo pipefail

if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BROWSERS_JSON="$REPO_ROOT/node_modules/playwright-core/browsers.json"

if [ ! -f "$BROWSERS_JSON" ]; then
  # No node_modules yet — direnv's `npm ci` step runs after shell entry, so
  # this can fire on first activation. Skip; the next invocation will check.
  exit 0
fi

expected=$(jq -r '.browsers[] | select(.name == "chromium-headless-shell") | .revision' "$BROWSERS_JSON")
if [ -z "$expected" ] || [ "$expected" = "null" ]; then
  echo "ERROR: could not read chromium-headless-shell revision from $BROWSERS_JSON" >&2
  exit 1
fi

if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH/chromium_headless_shell-$expected" ]; then
  shipped=$(find "$PLAYWRIGHT_BROWSERS_PATH" -maxdepth 1 -type l -name 'chromium_headless_shell-*' -printf '%f\n' 2>/dev/null \
    | sed 's/^chromium_headless_shell-//' | head -n 1)
  cat >&2 <<EOF
ERROR: playwright chromium revision drift

  npm playwright-core expects: chromium revision $expected
  nix playwright-driver ships: chromium revision ${shipped:-<unknown>}
  PLAYWRIGHT_BROWSERS_PATH:    $PLAYWRIGHT_BROWSERS_PATH

The nix-provisioned playwright-browsers does not ship the chromium revision
that the npm-installed @playwright/test expects. \`playwright test\` will fail
with "Executable doesn't exist".

Fix by aligning the two pins:
  - bump @playwright/test in package.json to a version whose browsers.json
    declares chromium revision ${shipped:-<unknown>}, then run \`npm install\`; or
  - run \`nix flake update nixpkgs\` to pick up a nixpkgs commit that ships
    playwright-driver matching the current npm version.
EOF
  exit 1
fi
