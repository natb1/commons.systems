#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="$HOME/.local/share/productivity-tui"
STATE_FILE="$STATE_DIR/sessions.json"

SESSION_ID="${CLAUDE_SESSION_ID:?CLAUDE_SESSION_ID not set}"
WORK_DIR="${PWD}"

mkdir -p "$STATE_DIR"
[ -f "$STATE_FILE" ] || echo '{}' > "$STATE_FILE"

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
jq --arg id "$SESSION_ID" \
   --arg dir "$WORK_DIR" \
   --arg now "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   '.[$id] = (.[$id] // {}) + {working_dir: $dir, idle: false, last_activity: $now}' \
   "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
