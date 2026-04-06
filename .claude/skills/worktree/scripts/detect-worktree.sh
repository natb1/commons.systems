#!/usr/bin/env bash
set -euo pipefail

# Detect worktree layout, compute PROJECT_ROOT, and check for an existing
# worktree whose branch starts with <issue-num>-.
# Usage: detect-worktree.sh <issue-number>
# Output: key=value lines (LAYOUT, PROJECT_ROOT, WORKTREE_PATH, WORKTREE_BRANCH)
# WORKTREE_PATH and WORKTREE_BRANCH are either both set or both empty.
# LAYOUT is always 'bare' or 'classic'.

if [ $# -lt 1 ] || [ -z "$1" ]; then
  echo "Usage: detect-worktree.sh <issue-number>" >&2
  exit 1
fi

ISSUE_NUM="$1"
[[ "$ISSUE_NUM" =~ ^[0-9]+$ ]] || { echo "ERROR: issue number must be numeric, got: $ISSUE_NUM" >&2; exit 1; }

PORCELAIN=$(git worktree list --porcelain) || { echo "ERROR: 'git worktree list --porcelain' failed -- is this a git repository?" >&2; exit 1; }
FIRST_LINE=$(printf '%s\n' "$PORCELAIN" | head -1)
SECOND_LINE=$(printf '%s\n' "$PORCELAIN" | sed -n '2p')

[[ "$FIRST_LINE" == worktree\ * ]] || { echo "ERROR: expected 'worktree ' prefix in porcelain output, got: $FIRST_LINE" >&2; exit 1; }
WORKTREE_DIR="${FIRST_LINE#worktree }"

if [ "$SECOND_LINE" = "bare" ]; then
  LAYOUT="bare"
  PROJECT_ROOT=$(dirname "$WORKTREE_DIR")
else
  LAYOUT="classic"
  PROJECT_ROOT="$WORKTREE_DIR"
fi

# Search for an existing worktree with a branch matching <issue-num>-
# Parse blank-line-delimited records since porcelain format may include
# other fields (HEAD sha, prunable status) between worktree and branch lines.
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
      break  # first match wins; multiple worktrees per issue is not expected
      ;;
  esac
done <<< "$PORCELAIN"

echo "LAYOUT=$LAYOUT"
echo "PROJECT_ROOT=$PROJECT_ROOT"
echo "WORKTREE_PATH=$WORKTREE_PATH"
echo "WORKTREE_BRANCH=$WORKTREE_BRANCH"
