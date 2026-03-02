#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)"
STATE_FILE="$PROJECT_ROOT/tmp/skill-state.json"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

write_fresh_state() {
  local state_dir
  state_dir="$(dirname "$STATE_FILE")"
  if ! mkdir -p "$state_dir"; then
    echo "[save-skill-state] ERROR: cannot create directory $state_dir" >&2
    exit 1
  fi
  cat > "$STATE_FILE" <<INIT
{
  "version": 1,
  "updated_at": "$(timestamp)",
  "active_skills": [],
  "workflow_stack": []
}
INIT
}

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    write_fresh_state
  elif ! jq empty "$STATE_FILE" 2>/dev/null; then
    echo "[save-skill-state] WARNING: $STATE_FILE contains invalid JSON -- reinitializing" >&2
    write_fresh_state
  fi
}

atomic_write() {
  local tmp="${STATE_FILE}.tmp"
  if ! jq "$@" "$STATE_FILE" > "$tmp"; then
    echo "[save-skill-state] ERROR: jq failed to update $STATE_FILE" >&2
    rm -f "$tmp"
    return 1
  fi
  if ! mv "$tmp" "$STATE_FILE"; then
    echo "[save-skill-state] ERROR: failed to write $STATE_FILE (mv failed)" >&2
    rm -f "$tmp"
    return 1
  fi
}

case "${1:-}" in
  skill)
    shift
    if [ $# -eq 0 ]; then
      echo "Usage: save-skill-state.sh skill <name>..." >&2
      exit 1
    fi
    init_state
    skills_json=$(printf '%s\n' "$@" | jq -R . | jq -s .)
    atomic_write \
      --argjson new "$skills_json" \
      --arg ts "$(timestamp)" \
      '.active_skills = (.active_skills + $new | unique) | .updated_at = $ts'
    ;;

  workflow)
    shift
    if [ $# -lt 3 ]; then
      echo "Usage: save-skill-state.sh workflow <name> <step> <label>" >&2
      exit 1
    fi
    name="$1"
    step="$2"
    shift 2
    label="$*"
    if ! [[ "$step" =~ ^[0-9]+$ ]]; then
      echo "[save-skill-state] ERROR: step must be a non-negative integer, got '$step'" >&2
      exit 1
    fi
    init_state
    atomic_write \
      --arg name "$name" \
      --argjson step "$step" \
      --arg label "$label" \
      --arg ts "$(timestamp)" \
      'if (.workflow_stack | map(.name) | index($name)) != null
       then .workflow_stack = [.workflow_stack[] | if .name == $name then .step = $step | .step_label = $label else . end]
       else .workflow_stack += [{"name": $name, "step": $step, "step_label": $label}]
       end | .updated_at = $ts'
    ;;

  workflow-pop)
    shift
    if [ $# -lt 1 ]; then
      echo "Usage: save-skill-state.sh workflow-pop <name>" >&2
      exit 1
    fi
    name="$1"
    init_state
    if ! jq -e --arg name "$name" '(.workflow_stack | map(.name) | index($name)) != null' "$STATE_FILE" >/dev/null 2>&1; then
      echo "[save-skill-state] WARNING: workflow '$name' not in stack" >&2
    fi
    atomic_write \
      --arg name "$name" \
      --arg ts "$(timestamp)" \
      '.workflow_stack = [.workflow_stack[] | select(.name != $name)] | .updated_at = $ts'
    ;;

  clear-workflow)
    init_state
    atomic_write \
      --arg ts "$(timestamp)" \
      '.workflow_stack = [] | .updated_at = $ts'
    ;;

  *)
    echo "Usage: save-skill-state.sh {skill|workflow|workflow-pop|clear-workflow} [args...]" >&2
    exit 1
    ;;
esac
