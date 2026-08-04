#!/usr/bin/env bash
# Tests for dispatch-merge-main -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 19483-19570.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-merge-main
# ============================================================================
# These tests use real git repos (no shared stub harness) because
# dispatch-merge-main runs actual git fetch/merge commands.
echo ""
echo "============================================================"
echo "dispatch-merge-main tests"
echo "============================================================"

MERGE_MAIN="$SCRIPT_DIR/dispatch-merge-main"


# Usage errors — exit 2.
echo "Test: missing arg → exit 2"
merge_main_setup
err=$("$MERGE_MAIN" 2>&1) && rc=0 || rc=$?
assert_eq "missing arg → exit 2" "2" "$rc"
merge_main_teardown

echo "Test: extra arg → exit 2"
merge_main_setup
err=$("$MERGE_MAIN" "$WORKTREE_REPO" extra 2>&1) && rc=0 || rc=$?
assert_eq "extra arg → exit 2" "2" "$rc"
merge_main_teardown

echo "Test: flag-shaped arg → exit 2"
merge_main_setup
err=$("$MERGE_MAIN" "--worktree" 2>&1) && rc=0 || rc=$?
assert_eq "flag-shaped arg → exit 2" "2" "$rc"
merge_main_teardown

echo "Test: non-existent path → exit 2"
merge_main_setup
err=$("$MERGE_MAIN" "/no/such/path/$(date +%s)" 2>&1) && rc=0 || rc=$?
assert_eq "non-existent path → exit 2" "2" "$rc"
merge_main_teardown

# Already up-to-date → exit 0.
echo "Test: already up-to-date → exit 0"
merge_main_setup
out=$("$MERGE_MAIN" "$WORKTREE_REPO" 2>&1) && rc=0 || rc=$?
assert_eq "already up-to-date → exit 0" "0" "$rc"
merge_main_teardown

# New commit on origin; worktree is behind → clean merge, exit 0.
echo "Test: worktree behind origin → clean merge, exit 0"
merge_main_setup
# Add a commit to origin/main that the worktree hasn't fetched yet.
touch "$ORIGIN_REPO/new.txt"
git -C "$ORIGIN_REPO" add new.txt
git -C "$ORIGIN_REPO" commit -q -m "origin advance"
out=$("$MERGE_MAIN" "$WORKTREE_REPO" 2>&1) && rc=0 || rc=$?
assert_eq "worktree behind → exit 0" "0" "$rc"
# Confirm the worktree now has the new file.
new_present="no"
[[ -f "$WORKTREE_REPO/new.txt" ]] && new_present="yes"
assert_eq "worktree behind → new file present after merge" "yes" "$new_present"
merge_main_teardown

# Conflicting merge → abort, exit 3, tree is clean.
echo "Test: merge conflict → abort, exit 3, tree clean"
merge_main_setup
# Make conflicting edits to the same file on both origin and worktree.
printf 'origin line\n' > "$ORIGIN_REPO/conflict.txt"
git -C "$ORIGIN_REPO" add conflict.txt
git -C "$ORIGIN_REPO" commit -q -m "origin conflict"
git -C "$WORKTREE_REPO" fetch -q origin
# Make a diverging local commit on the worktree branch.
printf 'worktree line\n' > "$WORKTREE_REPO/conflict.txt"
git -C "$WORKTREE_REPO" add conflict.txt
git -C "$WORKTREE_REPO" commit -q -m "worktree conflict"
err=$("$MERGE_MAIN" "$WORKTREE_REPO" 2>&1) && rc=0 || rc=$?
assert_eq "conflict → exit 3" "3" "$rc"
# Tree must be clean (merge was aborted).
status_out=$(git -C "$WORKTREE_REPO" status --porcelain)
assert_eq "conflict → tree clean after abort" "" "$status_out"
merge_main_teardown

# Fetch failure → exit 1. Point origin at a non-existent path so `git fetch
# origin main` cannot reach a remote, exercising the pre-merge fetch guard.
echo "Test: fetch failure → exit 1"
merge_main_setup
git -C "$WORKTREE_REPO" remote set-url origin "$MERGE_MAIN_TMPDIR/no-such-origin-$(date +%s)"
err=$("$MERGE_MAIN" "$WORKTREE_REPO" 2>&1) && rc=0 || rc=$?
assert_eq "fetch failure → exit 1" "1" "$rc"
merge_main_teardown

# <<< END MOVED <<<

report_results
