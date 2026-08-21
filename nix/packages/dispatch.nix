{ pkgs }:

# Foreground bash wrapper that execs dispatch-tick (never an interactive claude session).
# Bare `dispatch` -> dispatch-tick --manual (one gate-exempt worker).
# `dispatch <node-id>` -> dispatch-tick <node-id> (explicit single-node target, skips the pace/concurrency gate).
# `dispatch --allow-stale` (flags only, no positional node id) is still the
# bare/--manual form -- the flag rides through as dispatch-tick --manual --allow-stale.
# Execs the in-repo checkout script rather than vendoring it into the Nix store,
# because dispatch-tick calls sibling scripts via $SCRIPT_DIR and needs gh,
# the local Claude daemon, and tmp state from the checkout.
pkgs.writeShellScriptBin "dispatch" ''
  set -euo pipefail

  # Strip the unbounded direnv blob before the first execve (git) so a bloated
  # interactive-shell environment can't trigger E2BIG (#1879). Exec-free builtin.
  unset -v "''${!DIRENV_@}" 2>/dev/null || true

  TOPLEVEL="$(git rev-parse --show-toplevel)"
  TICK="$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/dispatch-tick"

  if [ ! -x "$TICK" ]; then
    echo "dispatch: dispatch-tick not found or not executable: $TICK" >&2
    exit 1
  fi

  SANITIZE="$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/lib-sanitize-launch-env.sh"
  if [ ! -r "$SANITIZE" ]; then
    echo "dispatch: sanitize lib not found: $SANITIZE" >&2
    exit 1
  fi
  . "$SANITIZE"
  sanitize_launch_env || exit 1

  # Bare `dispatch` means --manual; so does `dispatch` given only flags (e.g.
  # `--allow-stale`) with no positional node-id argument. Only a genuine
  # positional argument (a node id) skips the --manual fan-out.
  HAS_POSITIONAL=""
  for a in "$@"; do
    case "$a" in
      --*) ;;
      *) HAS_POSITIONAL=1 ;;
    esac
  done

  if [ -z "$HAS_POSITIONAL" ]; then
    exec "$TICK" --manual "$@"
  else
    exec "$TICK" "$@"
  fi
''
