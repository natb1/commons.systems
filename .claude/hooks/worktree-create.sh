#!/usr/bin/env bash
# WorktreeCreate hook: replace Claude Code's default worktree placement with
# <project-root>/worktrees/<branch>/. Pre-evaluate .envrc via `direnv exec`
# so Claude's non-interactive subprocess shells have node on PATH (direnv's
# shell hook only fires for interactive shells; pre-evaluating populates
# direnv's on-disk cache keyed by .envrc hash so subsequent direnv
# invocations in subshells pick up the environment without re-running .envrc).
# Reads JSON payload from stdin with one consumed field: .name (branch name
# matching <issue-num>-<slug>). Prints the final worktree path to stdout for
# Claude to switch into.
set -euo pipefail

WORKTREE_REGISTERED=0
NEW_PATH=""

# Open the progress-log destination as fd 3. Claude may capture hook stderr
# for error reporting; writing to /dev/tty bypasses that capture so the user
# sees setup output in real time. When invoked from a non-interactive parent
# (e.g. `dispatch`, which backgrounds claude with `&`), the hook subprocess
# has no controlling terminal and opening /dev/tty fails with ENXIO — fall
# back to a dup of fd 2. Use fd duplication rather than `/dev/stderr` because
# `/dev/stderr` resolves through `/proc/self/fd/2`, which re-opens the
# underlying device by name; if fd 2 points at a TTY device but the process
# lacks a controlling TTY, that re-open also fails with ENXIO.
# Group `{ ...; }` scopes the `2>/dev/null` to silencing exec's open-failure
# message only; without it, the `2>/dev/null` would persist past the `if` and
# clobber the original stderr that the fallback (exec 3>&2) needs to dup.
if { exec 3>/dev/tty; } 2>/dev/null; then :; else exec 3>&2; fi

cleanup_worktree() {
  [ -n "$NEW_PATH" ] || return 0
  git worktree remove --force "$NEW_PATH" >&2 \
    || echo "[worktree-create] ERROR: cleanup of $NEW_PATH failed. REMEDIATION: run 'git worktree remove --force $NEW_PATH' manually" >&2
}

# Invariant: if the worktree was registered and the script exits non-zero,
# roll it back. Gating on WORKTREE_REGISTERED (not a specific line) ensures
# new steps inserted after `git worktree add` can't silently skip cleanup.
trap 'echo "[worktree-create] ERROR: unexpected error on line $LINENO (exit $?)" >&2' ERR
trap '
  STATUS=$?
  if [ "$WORKTREE_REGISTERED" = 1 ] && [ $STATUS -ne 0 ]; then
    cleanup_worktree
  fi
' EXIT

PAYLOAD=$(cat) || { echo "[worktree-create] ERROR: failed to read hook payload from stdin" >&2; exit 1; }
BRANCH=$(printf '%s' "$PAYLOAD" | jq -r '.name // empty') \
  || { echo "[worktree-create] ERROR: failed to parse hook payload JSON from stdin: $PAYLOAD" >&2; exit 1; }
[ -n "$BRANCH" ] || { echo "[worktree-create] ERROR: no .name in payload: $PAYLOAD" >&2; exit 1; }
[[ "$BRANCH" =~ ^[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$ ]] || { echo "[worktree-create] ERROR: invalid branch name '$BRANCH' (expected <issue-num>-<slug> where slug starts with a lowercase alphanumeric and contains only lowercase alphanumerics and single dashes)" >&2; exit 1; }

# `.git` (classic) and `.bare` (bare) both sit at the project root, so the
# parent of --git-common-dir is the project root in either layout.
GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir) \
  || { echo "[worktree-create] ERROR: git rev-parse --git-common-dir failed" >&2; exit 1; }
PROJECT_ROOT=$(dirname "$GIT_COMMON_DIR")

NEW_PATH="$PROJECT_ROOT/worktrees/$BRANCH"

if [ -e "$NEW_PATH" ]; then
  echo "[worktree-create] worktree $NEW_PATH already exists; re-syncing issue context" >&3
else
  if git ls-remote --heads --exit-code origin "$BRANCH" >/dev/null 2>&1; then
    git fetch origin "$BRANCH" >&3 2>&1
    git worktree add "$NEW_PATH" "$BRANCH" >&3 2>&1
  elif git rev-parse --verify --quiet "$BRANCH" >/dev/null 2>&1; then
    git worktree add "$NEW_PATH" "$BRANCH" >&3 2>&1
  else
    git fetch origin main >&3 2>&1
    git worktree add -b "$BRANCH" "$NEW_PATH" origin/main >&3 2>&1
  fi
  WORKTREE_REGISTERED=1

  direnv allow "$NEW_PATH" >&3 2>&1 || { echo "[worktree-create] ERROR: direnv allow failed for $NEW_PATH" >&2; exit 1; }
  direnv exec "$NEW_PATH" true >&3 2>&1 || { echo "[worktree-create] ERROR: direnv exec failed for $NEW_PATH (non-zero exit from .envrc evaluation)" >&2; exit 1; }
fi

# Branch regex above guarantees a leading <issue-num>- prefix.
ISSUE_NUM="${BRANCH%%-*}"
(cd "$NEW_PATH" && "$(cd "$(dirname "$0")" && pwd)/../skills/dispatch/scripts/sync-issue-context" "$ISSUE_NUM") >&3 2>&1 \
  || { echo "[worktree-create] ERROR: sync-issue-context failed for issue $ISSUE_NUM" >&2; exit 1; }

echo "$NEW_PATH"
