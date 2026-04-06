#!/usr/bin/env bash
set -euo pipefail

# Detect worktree layout, compute PROJECT_ROOT, and check for an existing
# worktree whose branch starts with <issue-num>-.
# Usage: detect-worktree.sh <issue-number>
# Output: key=value lines (LAYOUT, PROJECT_ROOT, WORKTREE_PATH, WORKTREE_BRANCH)

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "Usage: detect-worktree.sh <issue-number>" >&2
  exit 1
fi

ISSUE_NUM="$1"

PORCELAIN=$(git worktree list --porcelain)
SECOND_LINE=$(printf '%s\n' "$PORCELAIN" | sed -n '2p')

if [ "$SECOND_LINE" = "bare" ]; then
  LAYOUT="bare"
  GIT_DIR=$(printf '%s\n' "$PORCELAIN" | head -1 | sed 's/^worktree //')
  PROJECT_ROOT=$(dirname "$GIT_DIR")
else
  LAYOUT="classic"
  PROJECT_ROOT=$(printf '%s\n' "$PORCELAIN" | head -1 | sed 's/^worktree //')
fi

# Search for an existing worktree with a branch matching <issue-num>-
# Parse blank-line-delimited records since porcelain format includes HEAD,
# prunable, and other lines between worktree and branch lines.
WORKTREE_PATH=""
WORKTREE_BRANCH=""

CURRENT_PATH=""
while IFS= read -r LINE; do
  if [ -z "$LINE" ]; then
    CURRENT_PATH=""
    continue
  fi
  case "$LINE" in
    worktree\ *)
      CURRENT_PATH="${LINE#worktree }"
      ;;
    branch\ refs/heads/"${ISSUE_NUM}"-*)
      WORKTREE_PATH="$CURRENT_PATH"
      WORKTREE_BRANCH="${LINE#branch refs/heads/}"
      break
      ;;
  esac
done <<< "$PORCELAIN"

echo "LAYOUT=$LAYOUT"
echo "PROJECT_ROOT=$PROJECT_ROOT"
echo "WORKTREE_PATH=$WORKTREE_PATH"
echo "WORKTREE_BRANCH=$WORKTREE_BRANCH"
