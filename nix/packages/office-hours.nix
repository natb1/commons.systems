{ pkgs }:

# Foreground wrapper that execs the in-repo office-hours entry script.
# Resume-vs-fresh behavior is unchanged (the script itself execs
# `claude --resume` or `claude /office-hours`).
# Execs the in-repo checkout script rather than vendoring it into the Nix store,
# because office-hours calls sibling scripts via $SCRIPT_DIR and needs gh,
# the local Claude daemon, and tmp state from the checkout.
pkgs.writeShellScriptBin "office-hours" ''
  set -euo pipefail

  TOPLEVEL="$(git rev-parse --show-toplevel)"
  SCRIPT="$TOPLEVEL/.claude/skills/dispatch-propagate/scripts/office-hours"

  if [ ! -x "$SCRIPT" ]; then
    echo "office-hours: script not found or not executable: $SCRIPT" >&2
    exit 1
  fi

  exec "$SCRIPT" "$@"
''
