#!/usr/bin/env bash
# stamp-dispatch-session.sh — write a per-session dispatch sidecar at session
# birth using local git only (no network). Records repo/issue/branch/base_sha;
# `pr` starts null and is backfilled later by dispatch-stamp-session --backfill-pr.
#
# Bound to SessionStart:startup (fresh claude --bg worker sessions) and
# SessionStart:resume (resumed sessions). Always exits 0 — never blocks session
# start.
set -uo pipefail
trap 'echo "[stamp-dispatch-session] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

STDIN_JSON=$(cat 2>/dev/null) || STDIN_JSON=""
SESSION_ID=$(printf '%s' "$STDIN_JSON" | jq -r '.session_id // empty' 2>/dev/null) || SESSION_ID=""
TRANSCRIPT_PATH=$(printf '%s' "$STDIN_JSON" | jq -r '.transcript_path // empty' 2>/dev/null) || TRANSCRIPT_PATH=""

if [[ -z "$SESSION_ID" || -z "$TRANSCRIPT_PATH" ]]; then
  echo "[stamp-dispatch-session] session_id or transcript_path missing in hook payload; skipping stamp" >&2
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
STAMP_SCRIPT="$SCRIPT_DIR/../skills/dispatch-propagate/scripts/dispatch-stamp-session"

if [[ ! -x "$STAMP_SCRIPT" ]]; then
  echo "[stamp-dispatch-session] dispatch-stamp-session not found or not executable at '$STAMP_SCRIPT'; skipping stamp" >&2
  exit 0
fi

"$STAMP_SCRIPT" --session-id "$SESSION_ID" --transcript-path "$TRANSCRIPT_PATH" || true

exit 0
