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

# Record the Claude CLI PID so the TUI can detect stale sessions after a crash
# (see session.FilterLive). $PPID is usually a shell wrapper — walk ancestors
# until we reach the Claude binary itself. Intermediate shells (.zshrc sourcing,
# wrapper scripts) are skipped transparently. Known command shapes:
#   *claude-code*       — nix-wrapped claude-code
#   *.claude-unwrapped* — unwrapped nix store binary
#   */claude            — direct binary invocation without args
#   */claude\ *         — direct binary invocation with args
#   claude              — bare argv[0] without args, resolved through PATH
#   claude\ *           — bare argv[0] with args, resolved through PATH
find_claude_pid() {
  local pid="$PPID"
  local hops=0
  # 20 hops is well beyond any observed parent chain; bounds runaway loops.
  # On failure we fall through to writing pid=0; FilterLive treats pid=0 as
  # "unknown ancestor" and keeps the session, so a rare miss is recoverable.
  while [ -n "$pid" ] && [ "$pid" != "1" ] && [ "$hops" -lt 20 ]; do
    local cmd
    cmd=$(ps -ww -o command= -p "$pid" 2>/dev/null)
    case "$cmd" in
      *claude-code*|*.claude-unwrapped*|*/claude|*/claude\ *|claude|claude\ *)
        printf '%s\n' "$pid"
        return 0
        ;;
    esac
    pid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
    hops=$((hops + 1))
  done
  return 1
}

CLAUDE_PID=""
CLAUDE_START=""
if pid=$(find_claude_pid); then
  CLAUDE_PID="$pid"
  CLAUDE_START="$(ps -o lstart= -p "$CLAUDE_PID" 2>/dev/null | sed -e 's/^ *//' -e 's/ *$//')"
  if [ -z "$CLAUDE_START" ]; then
    # lstart query failed — drop PID to keep (pid,start) coherent.
    echo "update-session: lstart query failed for pid=$CLAUDE_PID" >&2
    CLAUDE_PID=""
  fi
else
  echo "update-session: could not locate Claude CLI ancestor of PPID=$PPID" >&2
fi

mkdir -p "$STATE_DIR"
[ -f "$STATE_FILE" ] || echo '{}' > "$STATE_FILE"

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
# Explicit schema: fields not listed in this object are dropped.
jq --arg id "$SESSION_ID" \
   --arg dir "$WORK_DIR" \
   --argjson pid "${CLAUDE_PID:-0}" \
   --arg pid_start "$CLAUDE_START" \
   --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   --argjson idle "$IDLE" \
   '.[$id] = {working_dir: $dir, pid: $pid, pid_start: $pid_start, idle: $idle, last_activity: $now}' \
   "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
