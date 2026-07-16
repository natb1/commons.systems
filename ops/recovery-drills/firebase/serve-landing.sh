#!/usr/bin/env bash
#
# serve-landing.sh — start a rootless nginx that re-hosts the `landing` app off
# Firebase, reproducing the landing hosting block of the repo-root firebase.json.
#
# Part of the Firebase recovery drill (strategy-exercise-recovery-paths): it lets
# a later step curl the substitute host and verify header/rewrite parity against
# parity-checklist.json, measuring the real cost of recovering the hosted tier
# from owned local data.
#
# Design:
#   * No root, no system install, no writes outside a throwaway prefix dir.
#     nginx comes from nixpkgs via `nix run nixpkgs#nginx`.
#   * The committed nginx-landing.conf carries __DOCROOT__ / __PORT__ / __PREFIX__
#     placeholders; this script renders a concrete copy into the throwaway prefix
#     and points nginx at it, leaving the committed config static.
#   * Runs in the FOREGROUND with `daemon off;` and a trap, so Ctrl-C / SIGTERM
#     tears nginx down and removes the prefix — no orphaned master process. The
#     nginx master pid is also written to <prefix>/nginx.pid for out-of-band kill.
#
# Usage:
#   ops/recovery-drills/firebase/serve-landing.sh          # port 8088
#   PORT=9090 ops/recovery-drills/firebase/serve-landing.sh # custom port
#
# Requires: landing/dist to exist (build it first — a later drill step does this).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"

PORT="${PORT:-8088}"
DOCROOT="$REPO_ROOT/landing/dist"
TEMPLATE="$SCRIPT_DIR/nginx-landing.conf"

if [[ ! -f "$TEMPLATE" ]]; then
    echo "serve-landing.sh: missing nginx template: $TEMPLATE" >&2
    exit 1
fi

if [[ ! -d "$DOCROOT" ]]; then
    echo "serve-landing.sh: document root not found: $DOCROOT" >&2
    echo "  Build the landing app first (e.g. npm run build --prefix landing)." >&2
    exit 1
fi
if [[ ! -f "$DOCROOT/index.html" ]]; then
    echo "serve-landing.sh: $DOCROOT exists but has no index.html — is it a stale/partial build?" >&2
    exit 1
fi

# Throwaway prefix: everything nginx writes (pid, logs, temp, rendered config)
# lives here and nowhere else. Removed on exit.
PREFIX="$(mktemp -d "${TMPDIR:-/tmp}/recovery-drill-landing.XXXXXX")"
RENDERED_CONF="$PREFIX/nginx.conf"

cleanup() {
    local pidfile="$PREFIX/nginx.pid"
    if [[ -f "$pidfile" ]]; then
        kill "$(cat "$pidfile")" 2>/dev/null || true
    fi
    rm -rf "$PREFIX"
}
trap cleanup EXIT INT TERM

# Render the committed template into the throwaway prefix. Use a sed script with
# a non-`/` delimiter (`|`) because DOCROOT/PREFIX are absolute paths containing
# slashes. No JSON is parsed here, so shell-json.md does not apply.
sed \
    -e "s|__DOCROOT__|$DOCROOT|g" \
    -e "s|__PREFIX__|$PREFIX|g" \
    -e "s|__PORT__|$PORT|g" \
    "$TEMPLATE" > "$RENDERED_CONF"

echo "serve-landing.sh: serving $DOCROOT"
echo "  URL:    http://127.0.0.1:$PORT/"
echo "  prefix: $PREFIX (removed on exit)"
echo "  config: $RENDERED_CONF"
echo "  Stop with Ctrl-C (SIGINT) or SIGTERM."

# Foreground (config sets `daemon off;`). nginx validates its config on start;
# `set -e` propagates a nonzero exit. `nix run` fetches nginx from nixpkgs — the
# first run may download it (needs the npm/nix cache to be writable; see
# .claude/rules/sandbox.md on running such commands with the sandbox disabled).
nix run nixpkgs#nginx -- -c "$RENDERED_CONF" -p "$PREFIX/" &
NGINX_PID=$!
wait "$NGINX_PID"
