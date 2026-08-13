#!/usr/bin/env bash
# Tests for dispatch-review-base.
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

echo "Test: dispatch-review-base"

SUT="$SCRIPT_DIR/dispatch-review-base"

# --- fixture: a repo whose worktree sits under a .claude/worktrees root -------
# The path shape is load-bearing, not incidental: the sidecar only has a home
# when the reviewed tree's PARENT is a `.claude/worktrees` root.
RB_TMP=$(mktemp -d)
trap 'rm -rf "$RB_TMP"' EXIT

WT="$RB_TMP/.claude/worktrees/tactic-fixture"
mkdir -p "$WT"
git -C "$WT" init -q -b main
git -C "$WT" config user.email "test@example.com"
git -C "$WT" config user.name "Test"

commit() {
  printf '%s\n' "$2" > "$WT/$1"
  git -C "$WT" add -A
  git -C "$WT" commit -qm "$1"
  git -C "$WT" rev-parse HEAD
}

BASE_SHA=$(commit base.txt one)
C1=$(commit a.txt two)
C2=$(commit b.txt three)

SIDECAR="$RB_TMP/.claude/worktrees/tactic-fixture.review-base"
field() { printf '%s\n' "$1" | sed -n "s/^$2=//p"; }

# --- resolve: no sidecar → fail closed to the merge base ---------------------
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "no sidecar → base is the merge base" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "no sidecar → source names the reason" "no-sidecar" "$(field "$out" review_base_source)"

# --- record then resolve → the narrowed base ---------------------------------
out=$(cd "$WT" && "$SUT" --record "$C1")
assert_eq "record → echoes the resolved sha" "$C1" "$(field "$out" review_base_recorded)"
assert_eq "record → sidecar written beside the worktree" "$C1" "$(cat "$SIDECAR")"

out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "recorded sha → base narrows to it" "$C1" "$(field "$out" review_base)"
assert_eq "recorded sha → source is sidecar" "sidecar" "$(field "$out" review_base_source)"

# --- fail-closed paths -------------------------------------------------------
# Each of these must yield the MERGE BASE, i.e. today's full review. A narrower
# answer on any of them is a silent detection reduction.

printf 'not-a-sha\n' > "$SIDECAR"
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "malformed sidecar → fall back to merge base" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "malformed sidecar → source" "malformed" "$(field "$out" review_base_source)"

printf 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef\n' > "$SIDECAR"
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "sha absent from the repo → fall back" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "sha absent from the repo → source" "unreachable" "$(field "$out" review_base_source)"

# A real commit that is NOT reachable from HEAD — the force-push / rebase case.
git -C "$WT" checkout -q -b sidebranch "$BASE_SHA"
SIDE=$(commit side.txt four)
git -C "$WT" checkout -q main
printf '%s\n' "$SIDE" > "$SIDECAR"
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "sha off the current history → fall back" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "sha off the current history → source" "unreachable" "$(field "$out" review_base_source)"

# THE STALE-SIDECAR CASE. Sidecars outlive `git worktree remove`, so a sidecar
# written for a node's PREVIOUS, already-merged PR is still on disk when the
# next PR starts — and its sha, now an ancestor of the new merge base, is still
# reachable from HEAD. Reachability alone would accept it and skip the entire
# new PR. This row is the guard that rejects it.
printf '%s\n' "$BASE_SHA" > "$SIDECAR"
git -C "$WT" checkout -q -b later
LATER_BASE=$C2
out=$(cd "$WT" && "$SUT" --merge-base "$LATER_BASE")
assert_eq "sidecar already in the merge base → fall back" "$LATER_BASE" "$(field "$out" review_base)"
assert_eq "sidecar already in the merge base → source" "already-in-merge-base" "$(field "$out" review_base_source)"
git -C "$WT" checkout -q main

# A sidecar EQUAL to the merge base is rejected: it is an ancestor of itself.
# Fail-closed direction, and it costs only a full review of a delta that is
# empty anyway.
printf '%s\n' "$BASE_SHA" > "$SIDECAR"
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "sidecar == merge base → rejected (fail-closed)" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "sidecar == merge base → source" "already-in-merge-base" "$(field "$out" review_base_source)"

# ---------------------------------------------------------------------------
# THE MERGED-MAIN RE-REVIEW — the case the whole mechanism exists for, and the
# one a "must be a DESCENDANT of the merge base" guard silently breaks.
#
# provision-node-worktree merges origin/main into the branch before EVERY phase.
# So on a re-review MERGE_BASE is the origin/main tip that was just merged in,
# and the previously-reviewed branch head is NOT a descendant of it — that
# commit landed on main after the review happened. A descendant test therefore
# rejects a perfectly good recorded sha on every pass where main moved, which is
# nearly every pass, and the lane falls back to the full re-review this script
# exists to prevent.
#
# Reproduce it exactly: a branch, a review, main advances, main is merged in, a
# fix commit lands, and the second pass must still narrow to the reviewed sha.
MM="$RB_TMP/.claude/worktrees/tactic-mergedmain"
mkdir -p "$MM"
git -C "$MM" init -q -b main
git -C "$MM" config user.email "test@example.com"
git -C "$MM" config user.name "Test"
mm_commit() {
  printf '%s\n' "$2" > "$MM/$1"
  git -C "$MM" add -A
  git -C "$MM" commit -qm "$1"
  git -C "$MM" rev-parse HEAD
}
MM_SIDECAR="$RB_TMP/.claude/worktrees/tactic-mergedmain.review-base"

MM_M1=$(mm_commit main1.txt m1)          # main tip at branch time
git -C "$MM" checkout -q -b feature
MM_WORK=$(mm_commit feat.txt work)       # the PR's work
# Pass 1 reviews and records the branch head.
out=$(cd "$MM" && "$SUT" --record "$MM_WORK")
assert_eq "merged-main: pass 1 records the branch head" "$MM_WORK" "$(field "$out" review_base_recorded)"

# main advances while the PR is open.
git -C "$MM" checkout -q main
MM_M2=$(mm_commit main2.txt m2)
# The tick merges origin/main into the branch before the next phase.
git -C "$MM" checkout -q feature
git -C "$MM" merge -q --no-edit main
# /fix-checks pushes one CI-repair commit.
MM_FIX=$(mm_commit fix.txt repair)

# MERGE_BASE is now M2 — the main tip that was merged in.
MM_MB=$(git -C "$MM" merge-base HEAD main)
assert_eq "merged-main: the merge base IS the advanced main tip" "$MM_M2" "$MM_MB"
# And the recorded sha is NOT a descendant of it — the exact condition that
# would make a descendant test reject.
rc=0; git -C "$MM" merge-base --is-ancestor "$MM_MB" "$MM_WORK" || rc=$?
assert_eq "merged-main: recorded sha is NOT a descendant of the merge base" "1" "$rc"

# The guard must still accept it, so pass 2 reviews only the delta.
out=$(cd "$MM" && "$SUT" --merge-base "$MM_MB")
assert_eq "merged-main: pass 2 STILL narrows to the reviewed sha" "$MM_WORK" "$(field "$out" review_base)"
assert_eq "merged-main: pass 2 source is sidecar" "sidecar" "$(field "$out" review_base_source)"

# And the stale case must still be rejected in the SAME repo shape — proving the
# guard discriminates rather than just accepting everything reachable.
printf '%s\n' "$MM_M1" > "$MM_SIDECAR"
out=$(cd "$MM" && "$SUT" --merge-base "$MM_MB")
assert_eq "merged-main: a sha already on main is still rejected" "$MM_MB" "$(field "$out" review_base)"
assert_eq "merged-main: rejected with the stale reason" "already-in-merge-base" "$(field "$out" review_base_source)"

# --- outside a .claude/worktrees root ----------------------------------------
# A plain clone (a hand-run review, the test suite's throwaway repo) has no
# sidecar home. Resolve falls back; record refuses rather than scattering state.
PLAIN="$RB_TMP/plain"
mkdir -p "$PLAIN"
git -C "$PLAIN" init -q -b main
git -C "$PLAIN" config user.email "test@example.com"
git -C "$PLAIN" config user.name "Test"
printf 'x\n' > "$PLAIN/f.txt"
git -C "$PLAIN" add -A
git -C "$PLAIN" commit -qm f
PLAIN_SHA=$(git -C "$PLAIN" rev-parse HEAD)

out=$(cd "$PLAIN" && "$SUT" --merge-base "$PLAIN_SHA")
assert_eq "plain clone → falls back to merge base" "$PLAIN_SHA" "$(field "$out" review_base)"
assert_eq "plain clone → source" "no-worktrees-root" "$(field "$out" review_base_source)"

rc=0
(cd "$PLAIN" && "$SUT" --record "$PLAIN_SHA") >/dev/null 2>&1 || rc=$?
assert_eq "plain clone → record refuses (exit 2)" "2" "$rc"

# --- unresolvable merge base -------------------------------------------------
out=$(cd "$WT" && "$SUT" --merge-base deadbeefdeadbeefdeadbeefdeadbeefdeadbeef)
assert_eq "unresolvable merge base → source" "no-merge-base" "$(field "$out" review_base_source)"

# --- usage errors ------------------------------------------------------------
rc=0; (cd "$WT" && "$SUT") >/dev/null 2>&1 || rc=$?
assert_eq "no mode → exit 2" "2" "$rc"
rc=0; (cd "$WT" && "$SUT" --merge-base "$BASE_SHA" --record "$C1") >/dev/null 2>&1 || rc=$?
assert_eq "both modes → exit 2" "2" "$rc"
rc=0; (cd "$WT" && "$SUT" --bogus) >/dev/null 2>&1 || rc=$?
assert_eq "unknown argument → exit 2" "2" "$rc"
rc=0; (cd "$WT" && "$SUT" --record deadbeefdeadbeefdeadbeefdeadbeefdeadbeef) >/dev/null 2>&1 || rc=$?
assert_eq "record of an unresolvable sha → exit 2" "2" "$rc"

# --- resolve NEVER exits non-zero -------------------------------------------
# The whole contract is "always answer, fail closed". A non-zero exit on any
# resolve path would make the caller's `$(...)` capture empty under `set -e`,
# and an empty REVIEW_BASE reviews nothing at all.
rm -f "$SIDECAR"
rc=0; (cd "$WT" && "$SUT" --merge-base "$BASE_SHA") >/dev/null 2>&1 || rc=$?
assert_eq "resolve with no sidecar exits 0" "0" "$rc"
printf 'garbage\n' > "$SIDECAR"
rc=0; (cd "$WT" && "$SUT" --merge-base "$BASE_SHA") >/dev/null 2>&1 || rc=$?
assert_eq "resolve with a malformed sidecar exits 0" "0" "$rc"

report_results
