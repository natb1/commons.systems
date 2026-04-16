#!/usr/bin/env bash
# Shared helper called by on-active.sh, on-idle.sh, and on-close.sh.
# Reads Claude Code hook JSON from stdin and upserts session state.
# Usage: update-session.sh <true|false>
set -euo pipefail

IDLE="${1:?usage: update-session.sh <true|false>}"

STATE_DIR="$HOME/.local/share/productivity-tui"
STATE_FILE="$STATE_DIR/sessions.json"

HOOK_INPUT="$(cat)"
SESSION_ID="$(printf '%s' "$HOOK_INPUT" | jq -r '.session_id')"
[ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ] || { echo "session_id not found in hook input" >&2; exit 1; }
WORK_DIR="$(printf '%s' "$HOOK_INPUT" | jq -r '.cwd // empty')"
WORK_DIR="${WORK_DIR:-$PWD}"

# Walk ancestors from $PPID until we find the claude-code process. Transient
# intermediate shells (e.g. .zshrc sourcing) are skipped transparently.
find_claude_pid() {
  local pid="$PPID"
  local hops=0
  while [ -n "$pid" ] && [ "$pid" != "1" ] && [ "$hops" -lt 20 ]; do
    local cmd
    cmd=$(ps -o command= -p "$pid" 2>/dev/null || true)
    case "$cmd" in
      *claude-code*|*.claude-unwrapped*|*/claude|*/claude\ *)
        printf '%s\n' "$pid"
        return 0
        ;;
    esac
    pid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ' || true)
    hops=$((hops + 1))
  done
  return 1
}

CLAUDE_PID=""
CLAUDE_START=""
if pid=$(find_claude_pid); then
  CLAUDE_PID="$pid"
  CLAUDE_START="$(ps -o lstart= -p "$CLAUDE_PID" 2>/dev/null | sed -e 's/^ *//' -e 's/ *$//' || true)"
fi

mkdir -p "$STATE_DIR"
[ -f "$STATE_FILE" ] || echo '{}' > "$STATE_FILE"

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
jq --arg id "$SESSION_ID" \
   --arg dir "$WORK_DIR" \
   --argjson pid "${CLAUDE_PID:-0}" \
   --arg pid_start "$CLAUDE_START" \
   --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   --argjson idle "$IDLE" \
   '.[$id] = (.[$id] // {}) + {working_dir: $dir, pid: $pid, pid_start: $pid_start, idle: $idle, last_activity: $now} | .[$id] |= with_entries(select(.key != "transcript_path"))' \
   "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
