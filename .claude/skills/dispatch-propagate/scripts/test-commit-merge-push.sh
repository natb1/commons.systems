#!/usr/bin/env bash
# Tests for commit-merge-push -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 26622-26956.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# commit-merge-push
# ============================================================================
# These tests use real git repos (no shared stub harness) because
# commit-merge-push runs actual git add/commit/fetch/merge/push commands.
echo ""
echo "============================================================"
echo "commit-merge-push tests"
echo "============================================================"

CMP="$SCRIPT_DIR/commit-merge-push"

# Helper: create an isolated git test environment with a bare origin.
# Sets CMP_TMPDIR, CMP_BARE, CMP_CLONE.
cmp_setup() {
  CMP_TMPDIR=$(mktemp -d)
  CMP_BARE="$CMP_TMPDIR/origin.git"
  CMP_CLONE="$CMP_TMPDIR/clone"

  # Create a bare origin.
  git init --bare -b main -q "$CMP_BARE"

  # Bootstrap the bare origin with an initial commit on main via a seed clone.
  local seed="$CMP_TMPDIR/seed"
  git clone -q "$CMP_BARE" "$seed" 2>/dev/null
  git -C "$seed" config user.email "test@test"
  git -C "$seed" config user.name "Test"
  printf 'seed content\n' > "$seed/seed.txt"
  git -C "$seed" add seed.txt
  git -C "$seed" commit -q -m "initial"
  git -C "$seed" push -q origin main
  rm -rf "$seed"

  # Clone the bare origin to create the local worktree clone.
  git clone -q "$CMP_BARE" "$CMP_CLONE" 2>/dev/null
  git -C "$CMP_CLONE" config user.email "test@test"
  git -C "$CMP_CLONE" config user.name "Test"

  # Override the worktrees root to $CMP_TMPDIR so that $CMP_CLONE (=
  # $CMP_TMPDIR/clone) is treated as a valid worktree by the validation guard.
  export DISPATCH_WORKTREES_ROOT="$CMP_TMPDIR"
}

cmp_teardown() {
  rm -rf "$CMP_TMPDIR"
  unset CMP_TMPDIR CMP_BARE CMP_CLONE
  unset DISPATCH_WORKTREES_ROOT
}

# --- Case 1: merge-only, clean → exit 0, new commit present in clone ----------
echo "Test: merge-only, clean → exit 0, advanced commit present in clone"
cmp_setup
# Advance origin/main via a second helper clone.
helper="$CMP_TMPDIR/helper1"
git clone -q "$CMP_BARE" "$helper"
git -C "$helper" config user.email "test@test"
git -C "$helper" config user.name "Test"
printf 'advance\n' > "$helper/advance.txt"
git -C "$helper" add advance.txt
git -C "$helper" commit -q -m "origin advance"
git -C "$helper" push -q origin main
rm -rf "$helper"
# Run merge-only.
set +e
"$CMP" --worktree "$CMP_CLONE" --merge-only
cmp1_rc=$?
set -e
assert_eq "merge-only clean → exit 0" "0" "$cmp1_rc"
advance_present="no"
[[ -f "$CMP_CLONE/advance.txt" ]] && advance_present="yes"
assert_eq "merge-only clean → advance.txt present after merge" "yes" "$advance_present"
cmp_teardown

# --- Case 2: single-unit → exit 0, commit message lands on origin -------------
echo "Test: single-unit → exit 0, commit message on origin"
cmp_setup
printf 'changed\n' > "$CMP_CLONE/seed.txt"
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "test intent msg" --file seed.txt
cmp2_rc=$?
set -e
assert_eq "single-unit → exit 0" "0" "$cmp2_rc"
origin_msg=$(git -C "$CMP_BARE" log -1 --format=%s main)
assert_eq "single-unit → commit message on origin" "test intent msg" "$origin_msg"
cmp_teardown

# --- Case 3: multi-unit / undeclared → exit 5, no commit created -------------
echo "Test: multi-unit / undeclared → exit 5, origin unchanged"
cmp_setup
# Both files must be tracked; modify both but name only one.
printf 'change a\n' > "$CMP_CLONE/seed.txt"
printf 'file b content\n' > "$CMP_CLONE/fileb.txt"
git -C "$CMP_CLONE" add fileb.txt
git -C "$CMP_CLONE" commit -q -m "add fileb"
git -C "$CMP_CLONE" push -q origin main
printf 'change b again\n' > "$CMP_CLONE/fileb.txt"
# Now seed.txt and fileb.txt are both modified; name only seed.txt.
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "only one file" --file seed.txt
cmp3_rc=$?
set -e
assert_eq "multi-unit → exit 5" "5" "$cmp3_rc"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "multi-unit → origin tip unchanged" "$origin_tip_before" "$origin_tip_after"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
assert_eq "multi-unit → local HEAD unchanged" "$local_head_before" "$local_head_after"
cmp_teardown

# --- Case 3b: pre-staged unnamed file → exit 5, no commit, index clean -------
# X != ' ', Y == ' ': an unnamed file is already staged before the script runs.
# This is the most dangerous undeclared-changes variant — a pre-staged file
# must not be swept into the single-unit commit.
echo "Test: pre-staged unnamed file → exit 5, origin unchanged, index clean"
cmp_setup
# Both files tracked on origin.
printf 'file b content\n' > "$CMP_CLONE/fileb.txt"
git -C "$CMP_CLONE" add fileb.txt
git -C "$CMP_CLONE" commit -q -m "add fileb"
git -C "$CMP_CLONE" push -q origin main
# Modify the named file (seed.txt) and pre-stage a change to the unnamed file.
printf 'change a\n' > "$CMP_CLONE/seed.txt"
printf 'staged change b\n' > "$CMP_CLONE/fileb.txt"
git -C "$CMP_CLONE" add fileb.txt
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "only seed" --file seed.txt
cmp3b_rc=$?
set -e
assert_eq "pre-staged unnamed → exit 5" "5" "$cmp3b_rc"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "pre-staged unnamed → origin tip unchanged (not committed)" "$origin_tip_before" "$origin_tip_after"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
assert_eq "pre-staged unnamed → local HEAD unchanged" "$local_head_before" "$local_head_after"
fileb_committed=$(git -C "$CMP_CLONE" log -1 --format=%H -- fileb.txt 2>/dev/null)
assert_eq "pre-staged unnamed → fileb.txt change not committed" "$local_head_before" "$fileb_committed"
cmp_teardown

# --- Case 4: merge conflict → exit 3, tree clean, nothing pushed -------------
echo "Test: merge conflict → exit 3, tree clean, nothing pushed"
cmp_setup
# Advance origin/main with a change to seed.txt line 1.
helper="$CMP_TMPDIR/helper4"
git clone -q "$CMP_BARE" "$helper"
git -C "$helper" config user.email "test@test"
git -C "$helper" config user.name "Test"
printf 'origin line\n' > "$helper/seed.txt"
git -C "$helper" add seed.txt
git -C "$helper" commit -q -m "origin conflict commit"
git -C "$helper" push -q origin main
rm -rf "$helper"
# In the clone, make a diverging local commit on the same file.
printf 'clone line\n' > "$CMP_CLONE/seed.txt"
git -C "$CMP_CLONE" add seed.txt
git -C "$CMP_CLONE" commit -q -m "clone conflict commit"
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
# Run merge-only — the merge of origin/main will conflict.
set +e
"$CMP" --worktree "$CMP_CLONE" --merge-only
cmp4_rc=$?
set -e
assert_eq "merge conflict → exit 3" "3" "$cmp4_rc"
status_out=$(git -C "$CMP_CLONE" status --porcelain)
assert_eq "merge conflict → tree clean after abort" "" "$status_out"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "merge conflict → origin tip unchanged" "$origin_tip_before" "$origin_tip_after"
cmp_teardown

# --- Case 4b: single-unit + merge conflict → exit 3, local commit made -------
# The single-unit path makes a local commit, THEN the origin/main merge
# conflicts. Exit 3 must leave the local commit in place (for the fallback fork
# to carry forward), abort the merge (tree clean), and push nothing.
echo "Test: single-unit + merge conflict → exit 3, local commit made, origin unchanged"
cmp_setup
# Advance origin/main with a conflicting change to seed.txt.
helper="$CMP_TMPDIR/helper4b"
git clone -q "$CMP_BARE" "$helper"
git -C "$helper" config user.email "test@test"
git -C "$helper" config user.name "Test"
printf 'origin line\n' > "$helper/seed.txt"
git -C "$helper" add seed.txt
git -C "$helper" commit -q -m "origin conflict commit"
git -C "$helper" push -q origin main
rm -rf "$helper"
# In the clone, modify the same file (uncommitted) and invoke single-unit mode.
printf 'clone line\n' > "$CMP_CLONE/seed.txt"
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "single-unit conflict" --file seed.txt
cmp4b_rc=$?
set -e
assert_eq "single-unit + conflict → exit 3" "3" "$cmp4b_rc"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
assert_eq "single-unit + conflict → local HEAD advanced (commit was made)" \
  "yes" "$([[ "$local_head_after" != "$local_head_before" ]] && echo yes || echo no)"
status_out=$(git -C "$CMP_CLONE" status --porcelain)
assert_eq "single-unit + conflict → tree clean after abort" "" "$status_out"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "single-unit + conflict → origin tip unchanged" "$origin_tip_before" "$origin_tip_after"
cmp_teardown

# --- Case 5: pre-commit hook failure → exit 6, nothing committed/pushed ------
echo "Test: pre-commit hook failure → exit 6, no commit"
cmp_setup
# Install a failing pre-commit hook.
mkdir -p "$CMP_CLONE/.git/hooks"
printf '#!/bin/sh\nexit 1\n' > "$CMP_CLONE/.git/hooks/pre-commit"
chmod +x "$CMP_CLONE/.git/hooks/pre-commit"
printf 'changed\n' > "$CMP_CLONE/seed.txt"
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "hook test" --file seed.txt
cmp5_rc=$?
set -e
assert_eq "pre-commit hook failure → exit 6" "6" "$cmp5_rc"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
assert_eq "pre-commit hook failure → local HEAD unchanged" "$local_head_before" "$local_head_after"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "pre-commit hook failure → origin tip unchanged" "$origin_tip_before" "$origin_tip_after"
cmp_teardown

# --- Case 6: secret-bearing file → exit 4, nothing committed/pushed ----------
echo "Test: secret-bearing file → exit 4, no commit"
cmp_setup
printf 'SECRET=abc\n' > "$CMP_CLONE/.env"
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
origin_tip_before=$(git -C "$CMP_BARE" rev-parse main)
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "secret" --file .env
cmp6_rc=$?
set -e
assert_eq "secret-bearing file → exit 4" "4" "$cmp6_rc"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
assert_eq "secret-bearing file → local HEAD unchanged" "$local_head_before" "$local_head_after"
origin_tip_after=$(git -C "$CMP_BARE" rev-parse main)
assert_eq "secret-bearing file → origin tip unchanged" "$origin_tip_before" "$origin_tip_after"
cmp_teardown

# --- Case 7: non-ff push rejection → exit 7, local HEAD advanced, origin unchanged
echo "Test: non-ff push rejection → exit 7, local commit made, origin not force-pushed"
cmp_setup
# Check out feature-x in clone and push it to origin.
git -C "$CMP_CLONE" checkout -q -b feature-x
git -C "$CMP_CLONE" push -q origin feature-x
# From a second helper clone, advance origin/feature-x.
helper="$CMP_TMPDIR/helper7"
git clone -q "$CMP_BARE" "$helper"
git -C "$helper" config user.email "test@test"
git -C "$helper" config user.name "Test"
git -C "$helper" checkout -q --track origin/feature-x
printf 'helper advance\n' > "$helper/helper.txt"
git -C "$helper" add helper.txt
git -C "$helper" commit -q -m "helper advance feature-x"
git -C "$helper" push -q origin feature-x
helper_tip=$(git -C "$CMP_BARE" rev-parse feature-x)
rm -rf "$helper"
# Back in clone (still on feature-x, now behind origin/feature-x): make a local change.
printf 'local change\n' > "$CMP_CLONE/seed.txt"
local_head_before=$(git -C "$CMP_CLONE" rev-parse HEAD)
# origin/main is still at initial commit — merge of origin/main is clean.
set +e
"$CMP" --worktree "$CMP_CLONE" --intent "local commit for nff test" --file seed.txt
cmp7_rc=$?
set -e
assert_eq "non-ff push rejection → exit 7" "7" "$cmp7_rc"
local_head_after=$(git -C "$CMP_CLONE" rev-parse HEAD)
# The script committed locally (advancing HEAD) before the push was rejected.
assert_eq "non-ff push rejection → local HEAD advanced (commit was made)" \
  "yes" "$([[ "$local_head_after" != "$local_head_before" ]] && echo yes || echo no)"
# origin/feature-x must be the helper's commit — NOT force-pushed by the script.
origin_feature_tip=$(git -C "$CMP_BARE" rev-parse feature-x)
assert_eq "non-ff push rejection → origin feature-x tip is helper's (not force-pushed)" \
  "$helper_tip" "$origin_feature_tip"
cmp_teardown

# --- Case 8: foreign --worktree outside worktrees root → exit 2, no commit ---
echo "Test: foreign --worktree outside worktrees root → exit 2, no commit"
cmp_setup
unset DISPATCH_WORKTREES_ROOT          # exercise the real derivation
ATTACKER=$(mktemp -d)                   # independent dir, not under CMP_TMPDIR
git init -q -b main "$ATTACKER"
git -C "$ATTACKER" config user.email "atk@atk"
git -C "$ATTACKER" config user.name "Attacker"
printf 'seed\n' > "$ATTACKER/seed.txt"
git -C "$ATTACKER" add seed.txt
git -C "$ATTACKER" commit -q -m "attacker seed"
atk_head_before=$(git -C "$ATTACKER" rev-parse HEAD)
printf 'pwned\n' > "$ATTACKER/seed.txt"
set +e
"$CMP" --worktree "$ATTACKER" --intent "exfil" --file seed.txt
cmp8_rc=$?
set -e
assert_eq "foreign --worktree → exit 2" "2" "$cmp8_rc"
atk_head_after=$(git -C "$ATTACKER" rev-parse HEAD)
assert_eq "foreign --worktree → attacker HEAD unchanged (no commit)" \
  "$atk_head_before" "$atk_head_after"
rm -rf "$ATTACKER"
export DISPATCH_WORKTREES_ROOT="$CMP_TMPDIR"   # restore for symmetry before teardown
cmp_teardown

# --- Case 9: nonexistent --worktree outside the worktrees root → exit 2 -------
# Exercise the worktrees-root guard, not the later cd failure. On Linux, GNU
# realpath returns rc=0 for a nonexistent path, so a nonexistent path *under*
# the override root (e.g. "$CMP_TMPDIR/does-not-exist") would pass the
# case-statement prefix check and reach the cd — exiting 2 only because cd
# fails, which tests the wrong guard. By pointing at a nonexistent path OUTSIDE
# the worktrees root, the case-statement rejection fires before any cd on every
# platform (on macOS the realpath failure catches it even earlier).
echo "Test: nonexistent --worktree outside worktrees root → exit 2"
cmp_setup
set +e
"$CMP" --worktree "$CMP_TMPDIR/../outside-does-not-exist" --merge-only
cmp9_rc=$?
set -e
assert_eq "nonexistent --worktree outside root → exit 2" "2" "$cmp9_rc"
cmp_teardown

# --- Case 10: --worktree under the root but un-cd-able → exit 2 ----------------
# A nonexistent path UNDER the worktrees root passes the realpath/prefix guard
# on Linux (GNU realpath succeeds for nonexistent paths) and is rejected only by
# the subsequent cd failure. This pins that distinct exit-2 path so Case 9's
# guard coverage and the cd-failure coverage stay separate.
echo "Test: --worktree under root but un-cd-able → exit 2"
cmp_setup
set +e
"$CMP" --worktree "$CMP_TMPDIR/does-not-exist" --merge-only
cmp10_rc=$?
set -e
assert_eq "un-cd-able --worktree under root → exit 2" "2" "$cmp10_rc"
cmp_teardown

# <<< END MOVED <<<

report_results
