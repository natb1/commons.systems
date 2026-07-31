#!/usr/bin/env bash
# Tests for dispatch-preflight -- moved verbatim from test-dispatch-scripts.sh
# (tactic-dispatch-test-monolith-split). Original section: 28874-28967.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# >>> MOVED FROM test-dispatch-scripts.sh >>>
# ============================================================================
# dispatch-preflight.sh (#2041)
# ============================================================================
# The legacy materialize-spawn preflight-gate integration tests were removed with
# dispatch-materialize-spawn (tactic-dispatch-legacy-rewire Unit 3); these tests
# exercise dispatch-preflight.sh directly.

PF="$SCRIPT_DIR/dispatch-preflight.sh"

# --- a1: clean tree + gated phase (qa) → exit 0 (pass) ---------------------
echo "Test: preflight: clean tree + qa phase → exit 0"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$MERGE_MAIN_TMPDIR/agents-empty.json"
rc=0; "$PF" "$WORKTREE_REPO" qa >/dev/null 2>&1 || rc=$?
assert_eq "preflight: clean tree + qa phase → exit 0" "0" "$rc"
unset DISPATCH_AGENTS_SNAPSHOT
unset DISPATCH_AGENTS_SNAPSHOT_ALL
merge_main_teardown

# --- a2: conflicting tree + gated phase → abort, tree stays clean -----------
echo "Test: preflight: merge conflict + qa phase → non-zero exit + tree clean"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$MERGE_MAIN_TMPDIR/agents-empty.json"
printf 'origin line\n' > "$ORIGIN_REPO/conflict.txt"
git -C "$ORIGIN_REPO" add conflict.txt
git -C "$ORIGIN_REPO" commit -q -m "origin conflict"
git -C "$WORKTREE_REPO" fetch -q origin
printf 'worktree line\n' > "$WORKTREE_REPO/conflict.txt"
git -C "$WORKTREE_REPO" add conflict.txt
git -C "$WORKTREE_REPO" commit -q -m "worktree conflict"
rc=0; "$PF" "$WORKTREE_REPO" qa >/dev/null 2>&1 || rc=$?
assert_eq "preflight: merge conflict + qa phase → non-zero exit" "1" "$rc"
assert_eq "preflight: conflict dry-run did not mutate the worktree" "" \
  "$(git -C "$WORKTREE_REPO" status --porcelain)"
unset DISPATCH_AGENTS_SNAPSHOT
unset DISPATCH_AGENTS_SNAPSHOT_ALL
merge_main_teardown

# --- a3: phase-exempt: fix-conflicts + conflicting tree → exit 0 -----------
echo "Test: preflight: conflicting tree + fix-conflicts phase is exempt → exit 0"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$MERGE_MAIN_TMPDIR/agents-empty.json"
printf 'origin line\n' > "$ORIGIN_REPO/conflict.txt"
git -C "$ORIGIN_REPO" add conflict.txt
git -C "$ORIGIN_REPO" commit -q -m "origin conflict"
git -C "$WORKTREE_REPO" fetch -q origin
printf 'worktree line\n' > "$WORKTREE_REPO/conflict.txt"
git -C "$WORKTREE_REPO" add conflict.txt
git -C "$WORKTREE_REPO" commit -q -m "worktree conflict"
rc=0; "$PF" "$WORKTREE_REPO" fix-conflicts >/dev/null 2>&1 || rc=$?
assert_eq "preflight: conflicting tree + fix-conflicts phase is exempt → exit 0" "0" "$rc"
unset DISPATCH_AGENTS_SNAPSHOT
unset DISPATCH_AGENTS_SNAPSHOT_ALL
merge_main_teardown

# --- a4: phase-exempt: empty phase + conflicting tree → exit 0 -------------
echo "Test: preflight: conflicting tree + empty phase is exempt → exit 0"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$MERGE_MAIN_TMPDIR/agents-empty.json"
printf 'origin line\n' > "$ORIGIN_REPO/conflict.txt"
git -C "$ORIGIN_REPO" add conflict.txt
git -C "$ORIGIN_REPO" commit -q -m "origin conflict"
git -C "$WORKTREE_REPO" fetch -q origin
printf 'worktree line\n' > "$WORKTREE_REPO/conflict.txt"
git -C "$WORKTREE_REPO" add conflict.txt
git -C "$WORKTREE_REPO" commit -q -m "worktree conflict"
rc=0; "$PF" "$WORKTREE_REPO" "" >/dev/null 2>&1 || rc=$?
assert_eq "preflight: conflicting tree + empty phase is exempt → exit 0" "0" "$rc"
unset DISPATCH_AGENTS_SNAPSHOT
unset DISPATCH_AGENTS_SNAPSHOT_ALL
merge_main_teardown

# --- a5: corrupt package-lock.json → abort (exit 1) -------------------------
echo "Test: preflight: corrupt package-lock.json → exit 1"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT_ALL="$MERGE_MAIN_TMPDIR/agents-empty.json"
printf 'this is not json{{' > "$WORKTREE_REPO/package-lock.json"
rc=0; "$PF" "$WORKTREE_REPO" qa >/dev/null 2>&1 || rc=$?
assert_eq "preflight: corrupt package-lock.json → exit 1" "1" "$rc"
unset DISPATCH_AGENTS_SNAPSHOT
unset DISPATCH_AGENTS_SNAPSHOT_ALL
merge_main_teardown

# --- a6: missing worktree arg → exit 2 (usage error) -----------------------
echo "Test: preflight: missing worktree arg → exit 2"
merge_main_setup
printf '[]' > "$MERGE_MAIN_TMPDIR/agents-empty.json"
export DISPATCH_AGENTS_SNAPSHOT="$MERGE_MAIN_TMPDIR/agents-empty.json"
rc=0; "$PF" >/dev/null 2>&1 || rc=$?
assert_eq "preflight: missing worktree arg → exit 2" "2" "$rc"
unset DISPATCH_AGENTS_SNAPSHOT
merge_main_teardown


# <<< END MOVED <<<

report_results
