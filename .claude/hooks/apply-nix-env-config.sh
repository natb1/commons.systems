#!/usr/bin/env bash
# SessionStart hook: apply the repo's nix-defined environment configuration.
#
# devShells.cloud (flake.nix) carries environment configuration and no packages
# -- today, claiming core.hooksPath so .githooks/pre-commit runs its drift and
# shadow checks. Entering that shell once applies the configuration and exits;
# see .claude/rules/vendored-skills.md.
#
# Why a hook rather than the cloud environment's setup script: that script's
# working directory is not inside the checkout, so `git rev-parse
# --show-toplevel` there fails with "not a git repository" and exit 128
# (observed 2026-08-29). The clone does exist by then, so the setup script
# could reach it by an absolute path -- but it would have to hardcode one this
# repository cannot see or test. A hook is invoked by its own absolute path and
# locates the tree from $0, so it needs no such assumption, and being committed
# it stays reviewable. The setup script installs nix; this applies the
# configuration.
#
# Always exits 0. A session must start whether or not nix is present.
set -uo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
NIX_BIN=/nix/var/nix/profiles/default/bin

# No nix on this machine is a legitimate state, not a failure: a contributor who
# does not use nix still gets a working session, and anyone who does gets
# core.hooksPath claimed by devShells.default on `nix develop` anyway.
if ! command -v nix >/dev/null 2>&1 && [ ! -x "$NIX_BIN/nix" ]; then
  exit 0
fi
if [ -x "$NIX_BIN/nix" ]; then
  PATH="$NIX_BIN:$PATH"
  export PATH
fi

# No daemon socket means a daemonless install -- the cloud container has no init
# system, so the Determinate installer runs with `--init none` and leaves no
# daemon. Talk to the store directly there. A machine running nix-daemon has the
# socket and keeps whatever NIX_REMOTE it already has.
if [ ! -S /nix/var/nix/daemon-socket/socket ]; then
  export NIX_REMOTE=
fi

nix develop "$REPO#cloud" --command true \
  || echo "warning: nix develop .#cloud failed; environment configuration not applied" >&2

exit 0
