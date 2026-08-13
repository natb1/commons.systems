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
assert_eq "sidecar behind the merge base → fall back" "$LATER_BASE" "$(field "$out" review_base)"
assert_eq "sidecar behind the merge base → source" "not-ahead-of-merge-base" "$(field "$out" review_base_source)"
git -C "$WT" checkout -q main

# A sidecar EQUAL to the merge base is allowed — a prior review that covered
# exactly the merge base narrows to nothing, which is correct and harmless.
printf '%s\n' "$BASE_SHA" > "$SIDECAR"
out=$(cd "$WT" && "$SUT" --merge-base "$BASE_SHA")
assert_eq "sidecar == merge base → accepted" "$BASE_SHA" "$(field "$out" review_base)"
assert_eq "sidecar == merge base → source is sidecar" "sidecar" "$(field "$out" review_base_source)"

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
