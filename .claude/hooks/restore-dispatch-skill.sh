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

# Router sessions (dispatch-<short-id>) restart via /dispatch-propagate, not skill
# restoration — skip them explicitly.
case "$NAME" in
  dispatch-*) exit 0 ;;
esac

ISSUE_NUM=""
WORKTREE_BASENAME=""

# Primary path: session --name matches worker shape ^[0-9]+-. The name IS the
# worktree basename for workers spawned by dispatch-spawn-worker.
if printf '%s\n' "$NAME" | grep -qE '^[0-9]+-'; then
  ISSUE_NUM=$(printf '%s\n' "$NAME" | grep -oE '^[0-9]+')
  WORKTREE_BASENAME="$NAME"
else
  # Fallback: derive from the branch name (worktree basename).
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
  if printf '%s\n' "$BRANCH" | grep -qE '^[0-9]+-'; then
    ISSUE_NUM=$(printf '%s\n' "$BRANCH" | grep -oE '^[0-9]+')
    WORKTREE_BASENAME="$BRANCH"
  else
    exit 0
  fi
fi

[ -n "$ISSUE_NUM" ] || exit 0
[ -n "$WORKTREE_BASENAME" ] || exit 0

# WORKTREE_BASENAME comes from session --name or git branch name; reject
# path-traversal characters before composing the absolute path below. Git
# refnames already disallow `..`, so a slash or `..` here indicates a
# malformed or hostile source.
case "$WORKTREE_BASENAME" in
  *..*|*/*) exit 0 ;;
esac

# Resolve the absolute worktree path. The project root is the parent of the
# shared git common dir (.bare). git is run from the hook's cwd, which is some
# worktree of the project — --git-common-dir always returns the shared path.
GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null) || exit 0
PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")
WORKTREE_PATH="$PROJECT_ROOT/worktrees/$WORKTREE_BASENAME"

# Emit reload instruction. For phases with a single owning phase skill,
# reload that skill directly so a compaction mid-phase-skill resumes inside
# the same skill rather than re-entering /dispatch-worker (which can leave
# the active skill in an inconsistent reload state). For waiting/done/unknown,
# fall back to /dispatch-worker so the worker's Step 2 CI-monitor subagent
# loop and Step 2 done variance handling still run. dispatch-phase failure
# (network blip, no PR yet) also falls back to /dispatch-worker.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)" || exit 0
DISPATCH_SCRIPTS="$SCRIPT_DIR/../skills/dispatch-propagate/scripts"
PHASE=$("$DISPATCH_SCRIPTS/dispatch-phase" "$ISSUE_NUM" 2>/dev/null) || PHASE=""

case "$PHASE" in
  implement)   DIRECTIVE="/plan-implement $ISSUE_NUM" ;;
  verify)      DIRECTIVE="/verify-pr" ;;
  qa)          DIRECTIVE="/dispatch-qa $ISSUE_NUM" ;;
  code-review) DIRECTIVE="/code-review-fix" ;;
  review)      DIRECTIVE="/review-fix" ;;
  security)    DIRECTIVE="/security-review-fix" ;;
  *)           DIRECTIVE="/dispatch-worker $ISSUE_NUM $WORKTREE_PATH" ;;
esac

printf 'COMPACTION RECOVERY: Reload skill: %s\n' "$DIRECTIVE"
exit 0
