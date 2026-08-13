#!/usr/bin/env bash
set -euo pipefail

# Build every published-artifact workspace, assert the artifact contract, and
# run the from-disk render smoke.
#
# CI cannot PUBLISH — the Artifact tool exists only inside a Claude session and
# there is no CLI — so this is everything up to publish, which is the whole
# point: the session step that does publish then carries no risk.
#
# Discovers artifact workspaces from the root workspace manifest rather than a
# hand-maintained list, matching how every other quality gate in this repo is
# keyed. A new artifact workspace is covered with no edit here.

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# The render smoke drives a real chromium. On CI's ubuntu runner the bundled
# ms-playwright browser works and nothing is needed here. On the NixOS dev host
# it CANNOT run — the cached binaries are generic-linux dynamically linked
# executables — so playwright must be pointed at the nix-patched chromium. This
# is environment detection, not a fallback that hides a failure: if neither is
# available the smoke still fails loudly with playwright's own message.
# See .design-sync/NOTES.md, "Verification env".
if [ -z "${DS_CHROMIUM_PATH:-}" ] && [ -d /nix/store ]; then
  NIX_CHROMIUM=$(ls /nix/store/*-chromium-*/bin/chromium 2>/dev/null | head -1)
  if [ -n "$NIX_CHROMIUM" ]; then
    export DS_CHROMIUM_PATH="$NIX_CHROMIUM"
    echo "note: NixOS host detected — driving $DS_CHROMIUM_PATH" >&2
  fi
fi

WORKSPACES=$(node -e '
  const pkg = require("./package.json");
  for (const w of pkg.workspaces) if (w.startsWith("artifacts/")) console.log(w);
')

if [ -z "$WORKSPACES" ]; then
  echo "ERROR: no artifacts/* workspace found in the root workspace manifest." >&2
  echo "This script ran because detect-changes.sh saw an artifacts/ change, so a" >&2
  echo "workspace was expected. Add it to package.json \"workspaces\"." >&2
  exit 1
fi

STATUS=0
while IFS= read -r ws; do
  [ -z "$ws" ] && continue
  echo "=== $ws ==="

  echo "--- build ---"
  npm run build --prefix "$ws"

  # The build writes exactly one page per artifact workspace.
  BUILT=$(find "$ws/dist" -maxdepth 1 -name '*.html' -print)
  if [ -z "$BUILT" ]; then
    echo "ERROR: $ws produced no .html in dist/" >&2
    STATUS=1
    continue
  fi

  echo "--- artifact contract ---"
  if ! node "$ws/scripts/check-artifact.mjs" $BUILT; then
    STATUS=1
  fi

  echo "--- from-disk render smoke ---"
  # Network is disabled inside the smoke itself; a self-contained artifact needs
  # nothing external, which is exactly what is being verified.
  if ! node "$ws/scripts/render-smoke.mjs" $BUILT; then
    STATUS=1
  fi
done <<< "$WORKSPACES"

exit "$STATUS"
