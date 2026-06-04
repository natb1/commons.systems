{ pkgs }:

# Foreground bash wrapper that execs dispatch-tick (never an interactive claude session).
# Bare `dispatch` -> dispatch-tick --manual (one gate-exempt worker).
# `dispatch <N>` -> dispatch-tick <N> (explicit target, skips the concurrency gate).
# Execs the in-repo checkout script rather than vendoring it into the Nix store,
# because dispatch-tick calls sibling scripts via $SCRIPT_DIR and needs gh,
# the local Claude daemon, and tmp state from the checkout.
pkgs.writeShellScriptBin "dispatch" ''
  set -euo pipefail

  TOPLEVEL="$(git rev-parse --show-toplevel)"
  TICK="$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/dispatch-tick"

  if [ ! -x "$TICK" ]; then
    echo "dispatch: dispatch-tick not found or not executable: $TICK" >&2
    exit 1
  fi

  if [ "$#" -eq 0 ]; then
    exec "$TICK" --manual
  else
    exec "$TICK" "$@"
  fi
''
