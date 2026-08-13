#!/usr/bin/env bash
# WorktreeCreate hook: two-lane worktree placement keyed on the branch-name
# shape (tactic-graph-router-selector, unit 3; spec §3.4 in
# intentions/tactic-graph-native-dispatch.md).
#
#   <issue-num>-<slug>  LEGACY lane (the draining gh queue): placed at
#                       <git-common-dir>/.claude/worktrees/<branch>/ — anchored
#                       at the shared common dir (not a per-worktree-nested
#                       path) so it matches where Claude Code's own
#                       `path:`-based re-entry validator looks, and so a
#                       session's cwd already contains the `.claude/worktrees/`
#                       substring the bg-job isolation check short-circuits on
#                       (skipping a redundant EnterWorktree call). Keeps the gh
#                       identity stub (CLAUDE.local.md) and the
#                       tmp/dispatch-worktree marker. Retires with
#                       tactic-legacy-router-removal.
#
#   <node-id>           GRAPH lane (uniform node-id keying, strategy
#                       clarifications 12–13; substrate clarification 23): a
#                       Claude Code NATIVE worktree at the harness default
#                       location, <project-root>/.claude/worktrees/<node-id>,
#                       where the project root is the worktree with `main`
#                       checked out. No gh identity stub (node identity is the
#                       graph node at intentions/<node-id>.md), no
#                       tmp/dispatch-worktree marker (graph claiming is the
#                       reservation ledger + node-id-named sessions), and no
#                       git-common-dir anchoring — no graph-native path may
#                       assume a bare-repo / git-common-dir-anchored layout.
#                       (The repo is now a standard checkout: git-common-dir is
#                       `.git` at the repo root. The former `.bare` bare-repo
#                       layout was retired 2026-07-21.)
#
# Both lanes pre-evaluate .envrc via `direnv exec` so Claude's non-interactive
# subprocess shells have node on PATH (direnv's shell hook only fires for
# interactive shells; pre-evaluating populates direnv's on-disk cache keyed by
# .envrc hash so subsequent direnv invocations in subshells pick up the
# environment without re-running .envrc).
#
# Reads JSON payload from stdin with one consumed field: .name (the branch
# name). Prints the final worktree path to stdout for Claude to switch into.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/../skills/dispatch-propagate/scripts/lib-graph-worktree.sh"

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

# Lane classification on the branch-name shape: a numeric prefix is the legacy
# gh lane; a non-numeric lowercase slug is a graph node id. Anything else is
# rejected.
if [[ "$BRANCH" =~ ^[0-9]+-[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  LANE=legacy
elif [[ "$BRANCH" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
  LANE=node
else
  echo "[worktree-create] ERROR: invalid branch name '$BRANCH' (expected <issue-num>-<slug> for the legacy gh lane or a lowercase <node-id> for the graph lane; both allow only lowercase alphanumerics and single dashes)" >&2
  exit 1
fi

if [ "$LANE" = legacy ]; then
  # --git-common-dir is the same absolute path from any worktree of this repo
  # (now `.git` at the repo root; the former `.bare` bare-repo layout was
  # retired 2026-07-21), so anchoring at its PARENT gives every legacy worktree
  # a consistent, non-nested registry root. Take the dirname: post-de-baring
  # `.git` is a normal directory inside the working tree, so --git-common-dir
  # is <repo>/.git and the repo root is its parent. Anchoring at the common dir
  # itself placed worktrees under <repo>/.git/.claude/worktrees, which never
  # exists — and which worktree-remove.sh then refused to clean up, since it
  # anchors at the repo root.
  GIT_COMMON_DIR=$(git rev-parse --path-format=absolute --git-common-dir) \
    || { echo "[worktree-create] ERROR: git rev-parse --git-common-dir failed" >&2; exit 1; }
  NEW_PATH="$(dirname "$GIT_COMMON_DIR")/.claude/worktrees/$BRANCH"
else
  # Graph lane: the harness default location, <project-root>/.claude/worktrees/,
  # where the project root is the worktree with `main` checked out (substrate
  # clarification 23: `main` is checked out at the project root). Resolved from
  # the worktree registry, never from the git common dir.
  PROJECT_ROOT=$(resolve_main_worktree) || PROJECT_ROOT=""
  [ -n "$PROJECT_ROOT" ] \
    || { echo "[worktree-create] ERROR: no worktree with 'main' checked out; cannot resolve the project root for node-id worktree '$BRANCH'" >&2; exit 1; }
  NEW_PATH="$PROJECT_ROOT/.claude/worktrees/$BRANCH"
fi

if [ -e "$NEW_PATH" ]; then
  if [ "$LANE" = legacy ]; then
    echo "[worktree-create] worktree $NEW_PATH already exists; refreshing identity stub" >&3
  else
    echo "[worktree-create] worktree $NEW_PATH already exists; reusing" >&3
  fi
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

# Graph lane: done. No gh identity stub (the node body at
# intentions/<node-id>.md is the identity) and no tmp/dispatch-worktree marker
# (legacy lock-reclaim machinery; graph claiming is the reservation ledger +
# node-id-named sessions).
if [ "$LANE" = node ]; then
  echo "$NEW_PATH"
  exit 0
fi

# Legacy lane from here down. The lane regex guarantees a leading
# <issue-num>- prefix.
ISSUE_NUM="${BRANCH%%-*}"
# Write the static identity stub to CLAUDE.local.md — static identity only
# (issue number, title, branch, pointer to dispatch-context-pack); no issue
# body/comments/related-issue bodies, so it stays tiny and never goes stale.
# Any session needing live context runs dispatch-context-pack. This must stay
# byte-identical to dispatch-materialize-spawn's write_identity_stub (the other
# provisioning path). Fail-hard, matching the hook's existing posture.
TITLE=$(gh issue view "$ISSUE_NUM" --json title --jq .title) \
  || { echo "[worktree-create] ERROR: gh issue view #$ISSUE_NUM failed; cannot write CLAUDE.local.md stub" >&2; exit 1; }
SAFE_TITLE=$(printf '%s' "$TITLE" | tr -d '\000-\037\177')
SAFE_TITLE="${SAFE_TITLE:0:200}"
cat > "$NEW_PATH/CLAUDE.local.md" <<EOF
<!-- AUTO-GENERATED identity stub. Static identity only; do not edit. -->
<!-- For live issue/PR/diff context, run dispatch-context-pack (pointer below). -->

# Issue #$ISSUE_NUM: $SAFE_TITLE

Branch: \`$BRANCH\`

This worktree is provisioned for GitHub issue #$ISSUE_NUM. This file is a static
identity anchor — it intentionally carries no issue body, comments, or
related-issue context, so it stays tiny and never goes stale.

For live, on-demand context, run:

    .claude/skills/dispatch-propagate/scripts/dispatch-context-pack $ISSUE_NUM --issue --relations --pr --diff

Pass only the slices you need (e.g. \`--issue\`).
EOF

mkdir -p "$NEW_PATH/tmp" && touch "$NEW_PATH/tmp/dispatch-worktree" \
  || { echo "[worktree-create] ERROR: failed to write dispatch marker at $NEW_PATH/tmp/dispatch-worktree" >&2; exit 1; }

echo "$NEW_PATH"
