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
TRANSCRIPT_PATH="$(printf '%s' "$HOOK_INPUT" | jq -r '.transcript_path // empty')"

mkdir -p "$STATE_DIR"
[ -f "$STATE_FILE" ] || echo '{}' > "$STATE_FILE"

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
jq --arg id "$SESSION_ID" \
   --arg dir "$WORK_DIR" \
   --arg tp "$TRANSCRIPT_PATH" \
   --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   --argjson idle "$IDLE" \
   '.[$id] = (.[$id] // {}) + {working_dir: $dir, transcript_path: $tp, idle: $idle, last_activity: $now}' \
   "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
