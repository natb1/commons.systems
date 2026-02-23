#!/usr/bin/env bash
set -euo pipefail

# Resolve project root from script location (portable, follows symlinks)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
STATE_FILE="$PROJECT_ROOT/tmp/skill-state.json"

# Exit silently if no state file
if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

# Exit silently on invalid JSON (graceful degradation)
if ! jq empty "$STATE_FILE" 2>/dev/null; then
  exit 0
fi

# Read skills
skills=$(jq -r '.active_skills // [] | map("/" + .) | join(" ")' "$STATE_FILE" 2>/dev/null || true)

# Read workflow stack
stack_count=$(jq -r '.workflow_stack // [] | length' "$STATE_FILE" 2>/dev/null || echo "0")

# Output nothing if no state to restore
if [ -z "$skills" ] && [ "$stack_count" = "0" ]; then
  exit 0
fi

# Output recovery instructions
if [ -n "$skills" ]; then
  echo "COMPACTION RECOVERY: Reload active skills: $skills"
  echo ""
fi

if [ "$stack_count" != "0" ] && [ "$stack_count" != "null" ]; then
  echo "ACTIVE WORKFLOW STACK (outermost first):"
  # Output each workflow entry
  last_idx=$((stack_count - 1))
  for i in $(seq 0 "$last_idx"); do
    name=$(jq -r ".workflow_stack[$i].name" "$STATE_FILE")
    step=$(jq -r ".workflow_stack[$i].step" "$STATE_FILE")
    label=$(jq -r ".workflow_stack[$i].step_label" "$STATE_FILE")
    if [ "$i" -eq "$last_idx" ] && [ "$i" -gt 0 ]; then
      echo "  └─ $name at Step $step ($label)"
    else
      echo "  $name at Step $step ($label)"
    fi
  done
  echo "Resume from the innermost step after reloading skills."
fi
