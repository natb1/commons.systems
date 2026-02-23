#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)" || exit 0
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)" || exit 0
STATE_FILE="$PROJECT_ROOT/tmp/skill-state.json"

if ! rm -f "$STATE_FILE" 2>/dev/null; then
  echo "[clear-skill-state] WARNING: failed to remove $STATE_FILE" >&2
fi
