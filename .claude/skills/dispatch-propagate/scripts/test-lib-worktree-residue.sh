#!/usr/bin/env bash
# test-lib-worktree-residue.sh — functional harness for lib-worktree-residue.sh,
# the STRICTLY READ-ONLY worktree inspection half shared by
# provision-node-worktree (which repairs) and the stale-hold sweep (which must
# not).
#
# No stubs: every case builds a real scratch git repo under `mktemp -d` and real
# linked worktrees via `git worktree add`, then calls the library functions
# directly. provision-node-worktree is not involved.
#
# Cases:
#   1. absent directory                  -> rc 0, `absent`
#   2. clean worktree                    -> rc 0, `clean`
#   3. dirty tracked file                -> rc 1, `dirty-tracked-tree`
#   4. untracked-only file               -> rc 0, `clean` (the load-bearing
#                                           --untracked-files=no behavior)
#   5. some other branch checked out     -> rc 1, `wrong-branch:<branch>`
#   6. detached HEAD                     -> rc 1, `detached-head`
#   7. a manufactured MERGE_HEAD         -> rc 1, `merge-in-progress`
#   8. an orphan directory INSIDE the enclosing checkout -> rc 2, `unknown`
#      (never falls through to the enclosing checkout's own status)
#   9. read-only proof: every case above captures `git status --porcelain`
#      before and after the call and asserts it is unchanged.
#
# Assertion helpers (assert_eq, report_results) come from test-helpers.sh.
set -uo pipefail

HARNESS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# shellcheck source=test-helpers.sh
source "$HARNESS_DIR/test-helpers.sh"
# shellcheck source=lib-worktree-residue.sh
source "$HARNESS_DIR/lib-worktree-residue.sh"

echo "=== lib-worktree-residue.sh ==="

TMP=$(mktemp -d) || { echo "error: mktemp failed" >&2; exit 1; }
trap 'rm -rf "$TMP"' EXIT

REPO="$TMP/repo"
git init -q "$REPO"
git -C "$REPO" config user.email test@example.com
git -C "$REPO" config user.name "Test User"
git -C "$REPO" symbolic-ref HEAD refs/heads/main
echo seed >"$REPO/README.md"
git -C "$REPO" add README.md
git -C "$REPO" commit -q -m seed

# The library resolves the git dir with `--absolute-git-dir` and requires it to
# end in `/worktrees/<node-id>` — exactly the shape `git worktree add` creates.
mk_wt() {   # $1 = node id (== branch name); prints the worktree path
  local id="$1" path="$REPO/.claude/worktrees/$1"
  mkdir -p "$REPO/.claude/worktrees"
  git -C "$REPO" worktree add -q -b "$id" "$path" main
  printf '%s\n' "$path"
}

# run_case <label> <expected-slug> <expected-rc> <worktree-path> <expected-branch>
# Captures the porcelain status before and after the call and asserts the
# library mutated nothing.
run_case() {
  local label="$1" want_slug="$2" want_rc="$3" wt="$4" branch="$5"
  local before after out rc
  before=""
  [[ -d "$wt" ]] && before=$(git -C "$wt" status --porcelain 2>&1)
  out=$(worktree_residue_condition "$wt" "$branch")
  rc=$?
  after=""
  [[ -d "$wt" ]] && after=$(git -C "$wt" status --porcelain 2>&1)
  assert_eq "$label: slug" "$want_slug" "$out"
  assert_eq "$label: rc" "$want_rc" "$rc"
  assert_eq "$label: worktree unmodified (read-only)" "$before" "$after"
}

# --- case 1: absent directory -------------------------------------------
run_case "case1 absent directory" "absent" "0" "$REPO/.claude/worktrees/nope" "nope"

# --- case 2: clean worktree ---------------------------------------------
WT2=$(mk_wt wt-clean)
run_case "case2 clean worktree" "clean" "0" "$WT2" "wt-clean"

# --- case 3: dirty tracked file -----------------------------------------
WT3=$(mk_wt wt-dirty)
echo "local edit" >>"$WT3/README.md"
run_case "case3 dirty tracked file" "dirty-tracked-tree" "1" "$WT3" "wt-dirty"

# --- case 4: untracked-only file is still clean --------------------------
WT4=$(mk_wt wt-untracked)
mkdir -p "$WT4/dist"
echo "build output" >"$WT4/dist/bundle.js"
run_case "case4 untracked-only file" "clean" "0" "$WT4" "wt-untracked"

# --- case 5: some other branch checked out -------------------------------
WT5=$(mk_wt wt-branch)
git -C "$WT5" checkout -q -b other-branch
run_case "case5 wrong branch" "wrong-branch:other-branch" "1" "$WT5" "wt-branch"

# --- case 6: detached HEAD -----------------------------------------------
WT6=$(mk_wt wt-detached)
git -C "$WT6" checkout -q --detach HEAD
run_case "case6 detached HEAD" "detached-head" "1" "$WT6" "wt-detached"

# --- case 7: a manufactured MERGE_HEAD -----------------------------------
# Write the sentinel where git itself would look for it, rather than driving a
# real conflicted merge: the inspection is a file-existence test, and a real
# merge would also dirty the tree (masking which condition fired).
WT7=$(mk_wt wt-merge)
MERGE_HEAD_PATH=$(git -C "$WT7" rev-parse --git-path MERGE_HEAD)
[[ "$MERGE_HEAD_PATH" == /* ]] || MERGE_HEAD_PATH="$WT7/$MERGE_HEAD_PATH"
git -C "$WT7" rev-parse HEAD >"$MERGE_HEAD_PATH"
run_case "case7 merge in progress" "merge-in-progress" "1" "$WT7" "wt-merge"

# --- case 8: an orphan directory inside the enclosing checkout -----------
# A plain subdirectory of $REPO that is NOT a registered worktree: git
# discovery walks UP and every `git -C <dir> …` addresses $REPO. $REPO is
# deliberately left DIRTY so a fall-through would report a status, and the
# directory holds a tracked-looking file so the fall-through would be
# `dirty-tracked-tree` rather than `clean`.
ORPHAN="$REPO/.claude/worktrees/wt-orphan"
mkdir -p "$ORPHAN"
echo "unlanded work" >"$ORPHAN/scratch.txt"
echo "main-side edit" >>"$REPO/README.md"
ORPHAN_BEFORE=$(git -C "$REPO" status --porcelain)
ORPHAN_OUT=$(worktree_residue_condition "$ORPHAN" "wt-orphan")
ORPHAN_RC=$?
ORPHAN_AFTER=$(git -C "$REPO" status --porcelain)
assert_eq "case8 orphan directory: slug" "unknown" "$ORPHAN_OUT"
assert_eq "case8 orphan directory: rc" "2" "$ORPHAN_RC"
assert_eq "case8 orphan directory: enclosing checkout unmodified" \
  "$ORPHAN_BEFORE" "$ORPHAN_AFTER"
assert_eq "case8 orphan directory: its files are left in place" \
  "unlanded work" "$(cat "$ORPHAN/scratch.txt")"
git -C "$REPO" checkout -q -- README.md

# --- worktree_identity_ok directly ---------------------------------------
IDENT_OUT=$(worktree_identity_ok "$WT2" "wt-clean")
IDENT_RC=$?
assert_eq "identity: linked worktree passes (rc)" "0" "$IDENT_RC"
assert_eq "identity: linked worktree prints nothing" "" "$IDENT_OUT"

IDENT_OUT=$(worktree_identity_ok "$ORPHAN" "wt-orphan")
IDENT_RC=$?
assert_eq "identity: orphan directory fails (rc)" "1" "$IDENT_RC"
assert_contains "identity: orphan directory reports the enclosing toplevel" \
  "toplevel=$(cd "$REPO" && pwd -P)" "$IDENT_OUT"

IDENT_OUT=$(worktree_identity_ok "$TMP/does-not-exist" "wt-clean")
IDENT_RC=$?
assert_eq "identity: missing directory (rc)" "2" "$IDENT_RC"
assert_eq "identity: missing directory prints nothing" "" "$IDENT_OUT"

# A directory that is not under any repository at all: git cannot be run there.
NOREPO="$TMP/no-repo"
mkdir -p "$NOREPO"
IDENT_RC=0
worktree_identity_ok "$NOREPO" "wt-clean" >/dev/null || IDENT_RC=$?
assert_eq "identity: non-repo directory (rc)" "2" "$IDENT_RC"
run_case "case: non-repo directory" "unknown" "2" "$NOREPO" "wt-clean"

report_results
