#!/usr/bin/env bash
# WorktreeCreate hook: replace Claude Code's default worktree placement with
# <project-root>/worktrees/<branch>/. Pre-evaluate .envrc via `direnv exec`
# so Claude's non-interactive subprocess shells have node on PATH (direnv's
# shell hook only fires for interactive shells). Prints the final worktree
# path to stdout for Claude to switch into.
set -euo pipefail

WORKTREE_REGISTERED=0
NEW_PATH=""

cleanup_worktree() {
  git worktree remove --force "$NEW_PATH" >&2 \
    || echo "[worktree-create] WARNING: cleanup of $NEW_PATH failed; run 'git worktree remove --force $NEW_PATH' manually" >&2
}

# ERR fires on unguarded command failures; set -e already exits, so the trap
# only prints the diagnostic. EXIT fires on any exit path (including explicit
# exit from guard blocks). Tying cleanup to WORKTREE_REGISTERED makes the
# invariant "if we registered a worktree and the script exits non-zero, we
# remove it" — independent of which line failed, so inserting new steps
# between `git worktree add` and the direnv calls cannot silently skip it.
trap 'echo "[worktree-create] ERROR: unexpected error on line $LINENO (exit $?)" >&2' ERR
trap '
  STATUS=$?
  if [ "$WORKTREE_REGISTERED" = 1 ] && [ $STATUS -ne 0 ]; then
    cleanup_worktree
  fi
' EXIT

PAYLOAD=$(cat)
BRANCH=$(printf '%s' "$PAYLOAD" | jq -r '.name // empty') \
  || { echo "[worktree-create] ERROR: failed to parse hook payload JSON from stdin: $PAYLOAD" >&2; exit 1; }
[ -n "$BRANCH" ] || { echo "[worktree-create] ERROR: no .name in payload: $PAYLOAD" >&2; exit 1; }
[[ "$BRANCH" =~ ^[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo "[worktree-create] ERROR: invalid branch name '$BRANCH' (expected <issue-num>-<slug> where slug starts with a lowercase alphanumeric and contains only lowercase alphanumerics and single dashes)" >&2; exit 1; }

PORCELAIN=$(git worktree list --porcelain) || { echo "[worktree-create] ERROR: git worktree list failed" >&2; exit 1; }
FIRST_LINE=$(printf '%s\n' "$PORCELAIN" | head -1)
SECOND_LINE=$(printf '%s\n' "$PORCELAIN" | sed -n '2p')

[[ "$FIRST_LINE" == worktree\ * ]] || { echo "[worktree-create] ERROR: unexpected porcelain output: $FIRST_LINE" >&2; exit 1; }
WORKTREE_DIR="${FIRST_LINE#worktree }"

if [ "$SECOND_LINE" = "bare" ]; then
  PROJECT_ROOT=$(dirname "$WORKTREE_DIR")
else
  PROJECT_ROOT="$WORKTREE_DIR"
fi

NEW_PATH="$PROJECT_ROOT/worktrees/$BRANCH"

if git ls-remote --heads --exit-code origin "$BRANCH" >/dev/null 2>&1; then
  git fetch origin "$BRANCH" >&2
  git worktree add "$NEW_PATH" "$BRANCH" >&2
else
  git fetch origin main >&2
  git worktree add -b "$BRANCH" "$NEW_PATH" origin/main >&2
fi
WORKTREE_REGISTERED=1

direnv allow "$NEW_PATH" >&2 || { echo "[worktree-create] ERROR: direnv allow failed for $NEW_PATH" >&2; exit 1; }
direnv exec "$NEW_PATH" true >&2 || { echo "[worktree-create] ERROR: direnv exec failed for $NEW_PATH (non-zero exit from .envrc evaluation)" >&2; exit 1; }

echo "$NEW_PATH"
