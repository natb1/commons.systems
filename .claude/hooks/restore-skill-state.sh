#!/usr/bin/env bash
# SessionStart hook (compact matcher): restores skill/workflow state after auto-compaction.
# This hook MUST exit 0 in all error cases -- a non-zero exit would block session recovery,
# which is worse than losing state. Warnings go to stderr for diagnostics.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
STATE_FILE="$PROJECT_ROOT/tmp/skill-state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

if ! jq empty "$STATE_FILE" 2>/dev/null; then
  echo "[restore-skill-state] WARNING: $STATE_FILE contains invalid JSON -- skill state NOT restored" >&2
  exit 0
fi

version=$(jq -r '.version // 0' "$STATE_FILE")
if [ "$version" != "1" ]; then
  echo "[restore-skill-state] WARNING: unknown state version ($version) -- skill state NOT restored" >&2
  exit 0
fi

skills=$(jq -r '.active_skills // [] | map("/" + .) | join(" ")' "$STATE_FILE") || {
  echo "[restore-skill-state] WARNING: failed to read skills from $STATE_FILE" >&2
  exit 0
}
stack_count=$(jq -r '.workflow_stack // [] | length' "$STATE_FILE") || {
  echo "[restore-skill-state] WARNING: failed to read workflow stack from $STATE_FILE" >&2
  exit 0
}

if [ -z "$skills" ] && [ "$stack_count" = "0" ]; then
  exit 0
fi

if [ -n "$skills" ]; then
  echo "COMPACTION RECOVERY: Reload active skills: $skills"
  echo ""
fi

if [ "$stack_count" != "0" ] && [ "$stack_count" != "null" ]; then
  echo "ACTIVE WORKFLOW STACK (outermost first):"
  if ! jq -r '
    .workflow_stack as $s |
    ($s | length) as $len |
    range($len) |
    . as $i | $s[$i] |
    if ($i == ($len - 1)) and ($i > 0)
    then "  └─ \(.name) at Step \(.step) (\(.step_label))"
    elif ($i > 0)
    then "  ├─ \(.name) at Step \(.step) (\(.step_label))"
    else "  \(.name) at Step \(.step) (\(.step_label))"
    end
  ' "$STATE_FILE"; then
    echo "[restore-skill-state] WARNING: failed to render workflow stack" >&2
  fi
  echo "Resume from the innermost step after reloading skills."
fi
