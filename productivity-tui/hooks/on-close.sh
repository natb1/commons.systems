#!/usr/bin/env bash
# Claude Code hook: SessionEnd — removes a session from the state file.
# Reads {session_id, ...} JSON from stdin.
set -euo pipefail

STATE_DIR="$HOME/.local/share/productivity-tui"
STATE_FILE="$STATE_DIR/sessions.json"

HOOK_INPUT="$(cat)"
SESSION_ID="$(printf '%s' "$HOOK_INPUT" | jq -r '.session_id')"
[ -n "$SESSION_ID" ] && [ "$SESSION_ID" != "null" ] || { echo "session_id not found in hook input" >&2; exit 1; }

[ -f "$STATE_FILE" ] || exit 0

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
trap 'rm -f "$tmp"' EXIT
jq --arg id "$SESSION_ID" 'del(.[$id])' "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
