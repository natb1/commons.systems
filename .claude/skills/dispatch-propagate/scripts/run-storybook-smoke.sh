#!/usr/bin/env bash
set -euo pipefail

# Storybook dev-server smoke test for packages/ds.
#
# The production build (`storybook build`) and the dev server (`storybook dev`)
# take different esbuild paths: the build is governed by build.target, the dev
# server by optimizeDeps.esbuildOptions.target (see
# packages/ds/.storybook/main.ts). A green production build therefore does NOT
# prove the dev server boots — exactly how #2510 shipped with a dev server that
# crashed on startup ("Transforming destructuring to the configured target
# environment is not supported yet"), undetected because no CI ran Storybook.
#
# This boots the actual dev server and fails if it does not serve the preview
# iframe, or if it logs an esbuild bundling error. It is a smoke test, not an
# acceptance test: it asserts the server comes up and bundles cleanly, NOT that
# fonts/tokens/variants render correctly (that is human/visual-regression QA).

REPO_ROOT=$(git rev-parse --show-toplevel)
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"

# shellcheck source=lib.sh
source "$SCRIPTS/lib.sh"

PORT="${STORYBOOK_SMOKE_PORT:-6006}"
TIMEOUT="${STORYBOOK_SMOKE_TIMEOUT:-120}"
LOG="$(get_tmpdir)/storybook-smoke.log"

ensure_deps

cd "$REPO_ROOT"

# Start the dev server detached, capturing all output for error inspection.
# --disable-telemetry keeps the run offline-clean; --no-open skips the browser
# launch (there is none in CI).
npm run storybook --prefix packages/ds -- \
  --port "$PORT" --no-open --disable-telemetry >"$LOG" 2>&1 &
SB_PID=$!

cleanup() {
  # Kill the npm wrapper and the storybook/esbuild children it spawned. pkill -P
  # matches by parent PID (not a command string), so it cannot match this script.
  pkill -P "$SB_PID" 2>/dev/null || true
  kill "$SB_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Wait until the preview iframe serves 200, the server dies, or we time out.
# The preview iframe is the meaningful target: the #2510 crash was in the
# preview's optimizeDeps pass, which Storybook runs eagerly at startup.
READY=false
ELAPSED=0
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
  if ! kill -0 "$SB_PID" 2>/dev/null; then
    echo "ERROR: storybook dev server exited before serving (port ${PORT})" >&2
    break
  fi
  if curl -fsS -o /dev/null "http://localhost:${PORT}/iframe.html" 2>/dev/null; then
    READY=true
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
done

# Definitive #2510 signature: an esbuild target-lowering failure. Treat it as a
# hard failure even in the unlikely case the server answered 200 before dying.
if grep -qF "is not supported yet" "$LOG"; then
  echo "ERROR: storybook dev server reported esbuild bundling errors:" >&2
  # grep -m 10 stops after 10 matches itself, so no downstream `head` closes the
  # pipe early — avoids a SIGPIPE that `set -o pipefail` would surface as exit
  # 141 before the intended `exit 1`.
  grep -m 10 -F "is not supported yet" "$LOG" >&2
  exit 1
fi

if [ "$READY" != true ]; then
  echo "ERROR: storybook dev server did not serve http://localhost:${PORT}/iframe.html within ${TIMEOUT}s" >&2
  echo "--- last 40 log lines ---" >&2
  tail -40 "$LOG" >&2
  exit 1
fi

echo "PASS: storybook dev server booted and served iframe.html on port ${PORT}"
