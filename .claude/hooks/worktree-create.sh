#!/usr/bin/env bash
# WorktreeCreate hook: replace Claude Code's default worktree creation with the
# project's <project-root>/worktrees/<branch>/ convention, and run `direnv allow`
# on the new path. Reads the WorktreeCreate hook payload from stdin (flat JSON
# with .name holding the branch name) and prints the final worktree path to
# stdout for Claude to switch into.
set -uo pipefail
trap 'echo "[worktree-create] WARNING: unexpected error on line $LINENO (exit $?)" >&2; exit 1' ERR

BRANCH=$(jq -r '.name // empty')
[ -n "$BRANCH" ] || { echo "[worktree-create] ERROR: no branch in payload" >&2; exit 1; }

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

if git ls-remote --exit-code origin "$BRANCH" >/dev/null 2>&1; then
  git fetch origin "$BRANCH" >&2
  git worktree add "$NEW_PATH" "$BRANCH" >&2
else
  git fetch origin main >&2
  git worktree add -b "$BRANCH" "$NEW_PATH" origin/main >&2
fi

direnv allow "$NEW_PATH" >&2 || echo "[worktree-create] WARNING: direnv allow failed for $NEW_PATH" >&2

echo "$NEW_PATH"
