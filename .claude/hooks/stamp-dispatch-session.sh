#!/usr/bin/env bash
# stamp-dispatch-session.sh — write a per-session dispatch sidecar at session
# birth using local git only (no network). Records repo/issue/branch/base_sha;
# `pr` starts null and is backfilled later by dispatch-stamp-session --backfill-pr.
#
# Bound to SessionStart:startup (fresh claude --bg worker sessions) and
# SessionStart:resume (resumed sessions). Always exits 0 — never blocks session
# start.
#
# LIVE END-TO-END TESTING — two items to verify that cannot be confirmed here:
# (a) Whether SessionStart:startup fires for detached `claude --bg` worker
#     sessions (the primary dispatch worker launch path). The hook is wired to
#     the startup|resume matcher, but only live dispatch observation can confirm
#     the event actually fires in --bg mode.
# (b) Whether the hook command has working local `git` access in the worktree
#     context where it runs — dispatch-stamp-session calls `git rev-parse`
#     and `git remote get-url`; if git is unavailable or CWD is wrong the stamp silently
#     no-ops (never blocks).
#
# FALLBACK: if this hook proves unreliable for detached --bg sessions, add a
# scripted dispatch-stamp-session call at the start of each phase SKILL.md
# (plan-issue, implement, qa-fix, review-fix, etc.) as a belt-and-suspenders
# write. NOT implemented here — implement only if live testing shows the hook
# is insufficient.
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
