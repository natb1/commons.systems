#!/usr/bin/env bash
# Context-clear recovery hook: if this is a dispatched session, emit a reload instruction.
# Called by hooks.json on SessionStart/clear events.
# Always exits 0 — never blocks session recovery.
set -uo pipefail
trap 'echo "[restore-dispatch-skill] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || {
  echo "[restore-dispatch-skill] WARNING: cannot resolve script directory" >&2
  exit 0
}

# Extract issue number from branch name (e.g., "566-extend-dispatch-implement-wi" → "566")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+') || exit 0

# Detect dispatched session by checking for the state file
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0

[ -f "$REPO_ROOT/tmp/dispatch-${ISSUE_NUM}.json" ] || exit 0

# Emit reload instruction so Claude reloads the dispatch-implement skill
printf 'COMPACTION RECOVERY: Reload skill: /dispatch-implement #%s\n' "$ISSUE_NUM"

exit 0
