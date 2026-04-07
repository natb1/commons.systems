#!/usr/bin/env bash
set -euo pipefail

STATE_DIR="$HOME/.local/share/productivity-tui"
STATE_FILE="$STATE_DIR/sessions.json"

SESSION_ID="${CLAUDE_SESSION_ID:?CLAUDE_SESSION_ID not set}"

[ -f "$STATE_FILE" ] || exit 0

tmp="$(mktemp "$STATE_DIR/sessions.XXXXXX")"
jq --arg id "$SESSION_ID" 'del(.[$id])' "$STATE_FILE" > "$tmp"
mv "$tmp" "$STATE_FILE"
