#!/usr/bin/env bash
# Tests for lib-repo-roots.sh — the canonical definition of the
# --git-common-dir-to-repo-root `dirname` arithmetic shared by the three
# worktree hooks (approve-workflow-commands.sh, worktree-create.sh,
# worktree-remove.sh).
#
# Two things are under test:
#
#   1. The functions themselves resolve correctly, including the failure
#      contract (non-zero, no output, no exit) that every caller relies on to
#      supply its own message via `|| { … }`. approve-workflow-commands.sh's
#      is_allowed_git_c FAILS CLOSED on an empty root, because an empty root
#      would collapse its `case` patterns to the bare glob and match any
#      absolute path — so "returns nothing on failure" is a security property,
#      not a nicety.
#
#   2. The DRIFT GUARD. lib.sh carries its own copy of resolve_project_root and
#      deliberately does not source this file: ~17 test fixtures copy lib.sh
#      into a temp scripts dir by name, so a new sibling dependency breaks all
#      of them at source time with `resolve_project_root: command not found`
#      (measured — CI caught exactly that). The duplication is therefore
#      intentional, and this suite is what keeps it honest: if the two
#      definitions ever disagree, that is a red test rather than a silent
#      divergence of the kind that produced the original defect.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

LIB_REPO_ROOTS="$SCRIPT_DIR/lib-repo-roots.sh"
LIB_SH="$SCRIPT_DIR/lib.sh"

# A real temp repo, so the expected values are derived from git rather than
# assumed. Standard layout: `.git` is a normal directory inside the working
# tree, so the repo root is the PARENT of --git-common-dir.
LRR_ROOT=$(mktemp -d)
git init -q -b main "$LRR_ROOT"
# macOS puts TMPDIR under a symlinked /var; resolve so string comparisons hold.
LRR_ROOT=$(cd "$LRR_ROOT" && pwd -P)

# --- 1. resolve_project_root -----------------------------------------------

actual=$(cd "$LRR_ROOT" && bash -c "source '$LIB_REPO_ROOTS'; resolve_project_root")
assert_eq "resolve_project_root returns the repo root (parent of --git-common-dir)" "$LRR_ROOT" "$actual"

# --- 2. worktrees_root / legacy_worktrees_root -----------------------------

wt_root=$(cd "$LRR_ROOT" && bash -c "source '$LIB_REPO_ROOTS'; worktrees_root")
assert_eq "worktrees_root is <repo-root>/.claude/worktrees, never under .git" \
  "$LRR_ROOT/.claude/worktrees" "$wt_root"

legacy_root=$(cd "$LRR_ROOT" && bash -c "source '$LIB_REPO_ROOTS'; legacy_worktrees_root")
assert_eq "legacy_worktrees_root is <repo-root>/worktrees" \
  "$LRR_ROOT/worktrees" "$legacy_root"

# The exact defect this file exists to prevent: anchoring at the common dir
# instead of its parent yields <repo>/.git/.claude/worktrees, which never exists.
under_git="no"
case "$wt_root" in */.git/*) under_git="yes" ;; esac
assert_eq "worktrees_root is not anchored under .git (the 2026-07-21 de-baring defect)" "no" "$under_git"

# --- 3. Failure contract: non-zero, NO output, and no exit of the caller ----

outside=$(mktemp -d)
rc=0
out=$(cd "$outside" && bash -c "source '$LIB_REPO_ROOTS'; resolve_project_root" 2>/dev/null) || rc=$?
assert_eq "resolve_project_root returns non-zero outside a git repo" "1" "$rc"
assert_eq "resolve_project_root prints nothing on failure (an empty root must fail closed in is_allowed_git_c)" "" "$out"

rc=0
out=$(cd "$outside" && bash -c "source '$LIB_REPO_ROOTS'; worktrees_root" 2>/dev/null) || rc=$?
assert_eq "worktrees_root returns non-zero outside a git repo" "1" "$rc"
assert_eq "worktrees_root prints nothing on failure" "" "$out"

# The caller must survive the failure — these are sourced into hooks that must
# keep passing through rather than aborting.
out=$(cd "$outside" && bash -c "source '$LIB_REPO_ROOTS'; worktrees_root >/dev/null 2>&1 || true; echo SURVIVED")
assert_eq "a failed lookup does not exit the sourcing caller" "SURVIVED" "$out"

# --- 4. Sourcing is idempotent ---------------------------------------------

out=$(cd "$LRR_ROOT" && bash -c "source '$LIB_REPO_ROOTS'; source '$LIB_REPO_ROOTS'; resolve_project_root")
assert_eq "double-sourcing is harmless (include guard) and the functions still work" "$LRR_ROOT" "$out"

# --- 5. DRIFT GUARD: lib.sh's copy must agree with the canonical one --------

lib_sh_answer=$(cd "$LRR_ROOT" && bash -c "source '$LIB_SH' >/dev/null 2>&1; resolve_project_root")
canonical=$(cd "$LRR_ROOT" && bash -c "source '$LIB_REPO_ROOTS'; resolve_project_root")
assert_eq "DRIFT GUARD: lib.sh's resolve_project_root agrees with lib-repo-roots.sh" \
  "$canonical" "$lib_sh_answer"

# And it must agree on the failure contract too, not just the happy path.
rc_canon=0; rc_lib=0
(cd "$outside" && bash -c "source '$LIB_REPO_ROOTS'; resolve_project_root" >/dev/null 2>&1) || rc_canon=$?
(cd "$outside" && bash -c "source '$LIB_SH' >/dev/null 2>&1; resolve_project_root" >/dev/null 2>&1) || rc_lib=$?
assert_eq "DRIFT GUARD: both definitions agree on the outside-a-repo return code" "$rc_canon" "$rc_lib"

# --- 6. lib.sh must remain copyable ALONE ----------------------------------
# The regression that produced this suite: lib.sh sourcing a new sibling broke
# every fixture that copies lib.sh by name into an otherwise empty scripts dir.
LONE=$(mktemp -d)
mkdir -p "$LONE/scripts"
cp "$LIB_SH" "$LONE/scripts/lib.sh"
rc=0
out=$(cd "$LRR_ROOT" && bash -c "source '$LONE/scripts/lib.sh' >/dev/null 2>&1; resolve_project_root" 2>&1) || rc=$?
assert_eq "lib.sh sources cleanly when copied ALONE into a temp scripts dir (no sibling deps)" "0" "$rc"
assert_eq "and resolve_project_root still works from that lone copy" "$LRR_ROOT" "$out"

rm -rf "$LRR_ROOT" "$outside" "$LONE"

report_results
