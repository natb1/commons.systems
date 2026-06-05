{ pkgs }:

# Foreground wrapper that execs the in-repo office-hours entry script.
# The entry script is a thin dispatcher over office-hours-select-target's
# disposition: resume / parked-router (exec `claude --resume <sessionId>`),
# fresh-with-args (exec `claude "/office-hours <N> <phase> <pr>"`), or empty
# (print a queue-empty message and exit without launching).
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
