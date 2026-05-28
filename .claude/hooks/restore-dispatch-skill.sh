#!/usr/bin/env bash
# Context-clear recovery hook: if this is a dispatch worker session, emit a
# reload instruction. Bound to SessionStart:clear.
# Always exits 0 — never blocks session recovery.
set -uo pipefail
trap 'echo "[restore-dispatch-skill] WARNING: unexpected error on line $LINENO" >&2; exit 0' ERR

STDIN_JSON=$(cat 2>/dev/null) || STDIN_JSON=""
SESSION_ID=$(printf '%s' "$STDIN_JSON" | jq -r '.session_id // empty' 2>/dev/null) || SESSION_ID=""

# Query the running sessions to get the --name for this session.
NAME=""
if [ -n "$SESSION_ID" ]; then
  NAME=$(claude agents --json 2>/dev/null | \
    jq -r --arg sid "$SESSION_ID" '.[] | select(.sessionId == $sid) | .name' \
    2>/dev/null) || NAME=""
fi

# Router sessions (dispatch-<short-id>) restart via /dispatch, not skill
# restoration — skip them explicitly.
case "$NAME" in
  dispatch-*) exit 0 ;;
esac

ISSUE_NUM=""

# Primary path: session --name matches worker shape ^[0-9]+-.
if printf '%s\n' "$NAME" | grep -qE '^[0-9]+-'; then
  ISSUE_NUM=$(printf '%s\n' "$NAME" | grep -oE '^[0-9]+')
else
  # Fallback: derive from the branch name (worktree basename).
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
  if printf '%s\n' "$BRANCH" | grep -qE '^[0-9]+-'; then
    ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+')
  else
    exit 0
  fi
fi

[ -n "$ISSUE_NUM" ] || exit 0

# Emit reload instruction so Claude reloads /dispatch-worker for this worker
# session. /dispatch-worker re-derives the phase from PR/CI ground truth, so
# recovery is correct after a /clear in any phase.
printf 'COMPACTION RECOVERY: Reload skill: /dispatch-worker %s\n' "$ISSUE_NUM"

exit 0
