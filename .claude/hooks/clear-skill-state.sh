#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)" || {
  echo "[clear-skill-state] WARNING: cannot resolve script directory" >&2
  exit 0
}
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd -P)" || {
  echo "[clear-skill-state] WARNING: cannot resolve project root from $SCRIPT_DIR" >&2
  exit 0
}
STATE_FILE="$PROJECT_ROOT/tmp/skill-state.json"

if ! rm -f "$STATE_FILE" 2>/dev/null; then
  echo "[clear-skill-state] WARNING: failed to remove $STATE_FILE" >&2
fi
