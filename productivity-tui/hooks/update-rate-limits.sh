#!/usr/bin/env bash
# Claude Code statusLine hook — reads stdin JSON and atomically writes rate_limits.json.
# Prints a single status line to stdout (e.g. "5h: 5% · 7d: 1%") when data is present.
set -euo pipefail

STATE_DIR="$HOME/.local/share/productivity-tui"
STATE_FILE="$STATE_DIR/rate_limits.json"

HOOK_INPUT="$(cat)"

# Build a filtered payload: extract .rate_limits and drop any null inner windows.
PAYLOAD="$(printf '%s' "$HOOK_INPUT" | jq -c '(.rate_limits // {}) | with_entries(select(.value != null))')"

# If rate_limits was absent/null or all inner windows were null, exit cleanly.
if [ "$PAYLOAD" = "{}" ]; then
  exit 0
fi

mkdir -p "$STATE_DIR"

tmp="$(mktemp "$STATE_DIR/rate_limits.XXXXXX")"
trap 'status=$?; [ $status -ne 0 ] && echo "update-rate-limits: unexpected error (exit $status)" >&2; rm -f "$tmp"' EXIT

printf '%s\n' "$PAYLOAD" > "$tmp"
mv "$tmp" "$STATE_FILE"

# Print status line: "5h: <n>% · 7d: <n>%" with only present windows.
printf '%s' "$PAYLOAD" | jq -r '
  [
    (.five_hour | select(.) | "5h: \(.used_percentage)%"),
    (.seven_day | select(.) | "7d: \(.used_percentage)%")
  ] | join(" · ")
'
