#!/usr/bin/env bash
# Tests for review-fix-write-surface-guard.sh — the extracted, executable
# version of the review-fix Step-5 node-lane write-surface fence.
#
# Each case builds a throwaway BASELINE / AFTER / IDS file triple under
# mktemp -d and points the guard at it. Nothing is ever written under this
# repo's own intentions/, and the guard itself runs no git command, so no
# real git repo is needed to exercise it.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/review-fix-write-surface-guard.sh"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

# Write BASELINE/AFTER/IDS fixture files under a fresh case dir.
# $1 = case name, $2 = baseline content, $3 = after content, $4 = ids content.
CASE_DIR=""
BASELINE_FILE=""
AFTER_FILE=""
IDS_FILE=""
write_case() {
  CASE_DIR=$(mktemp -d "$TMP_ROOT/case.XXXXXX")
  BASELINE_FILE="$CASE_DIR/baseline.txt"
  AFTER_FILE="$CASE_DIR/after.txt"
  IDS_FILE="$CASE_DIR/ids.txt"
  printf '%s' "$1" > "$BASELINE_FILE"
  printf '%s' "$2" > "$AFTER_FILE"
  printf '%s' "$3" > "$IDS_FILE"
}

# Run the guard against the current case fixture. Sets globals: RC, OUT.
RC=0
OUT=""
run_sut() {
  set +e
  OUT=$("$SUT" "$BASELINE_FILE" "$AFTER_FILE" "$IDS_FILE" 2>&1)
  RC=$?
  set -e
}

# ---------------------------------------------------------------------------
# Test 1: clean pass — one new `?? intentions/<id>.md` entry per returned id,
# nothing else changed.
# ---------------------------------------------------------------------------
echo "Test 1: clean pass (new ?? file per returned id, nothing else)"
write_case \
  $'?? tmp/scratch.txt\n' \
  $'?? tmp/scratch.txt\n?? intentions/tactic-new-thing.md\n' \
  $'tactic-new-thing\n'
run_sut
assert_eq "clean pass: exit 0" "0" "$RC"
assert_eq "clean pass: no output" "" "$OUT"

echo "Test 1b: clean pass with multiple returned ids, all satisfied"
write_case \
  $'' \
  $'?? intentions/tactic-a.md\n?? intentions/tactic-b.md\n' \
  $'tactic-a\ntactic-b\n'
run_sut
assert_eq "multi-id clean pass: exit 0" "0" "$RC"
assert_eq "multi-id clean pass: no output" "" "$OUT"

echo "Test 1c: no ids returned, no new files — clean pass (empty follow-up set)"
write_case \
  $'?? tmp/scratch.txt\n' \
  $'?? tmp/scratch.txt\n' \
  $''
run_sut
assert_eq "empty follow-up set: exit 0" "0" "$RC"
assert_eq "empty follow-up set: no output" "" "$OUT"

# ---------------------------------------------------------------------------
# Test 2: a modified or deleted tracked file among the NEW entries must fail —
# only `??` is acceptable.
# ---------------------------------------------------------------------------
echo "Test 2a: an M (modified) entry among the new lines fails"
write_case \
  $'' \
  $'?? intentions/tactic-new-thing.md\n M intentions/tactic-existing.md\n' \
  $'tactic-new-thing\n'
run_sut
[ "$RC" -ne 0 ] && _t2a_rc=nonzero || _t2a_rc=zero
assert_eq "modified entry: exit non-zero" "nonzero" "$_t2a_rc"
assert_contains "modified entry: names the path" "intentions/tactic-existing.md" "$OUT"
assert_contains "modified entry: names the status" "' M'" "$OUT"

echo "Test 2b: a D (deleted) entry among the new lines fails"
write_case \
  $'' \
  $'?? intentions/tactic-new-thing.md\n D intentions/tactic-existing.md\n' \
  $'tactic-new-thing\n'
run_sut
[ "$RC" -ne 0 ] && _t2b_rc=nonzero || _t2b_rc=zero
assert_eq "deleted entry: exit non-zero" "nonzero" "$_t2b_rc"
assert_contains "deleted entry: names the path" "intentions/tactic-existing.md" "$OUT"

# ---------------------------------------------------------------------------
# Test 3: an untracked file OUTSIDE intentions/ must fail, even though its
# status is `??`.
# ---------------------------------------------------------------------------
echo "Test 3: an untracked file outside intentions/ fails"
write_case \
  $'' \
  $'?? intentions/tactic-new-thing.md\n?? .claude/skills/rogue.md\n' \
  $'tactic-new-thing\n'
run_sut
[ "$RC" -ne 0 ] && _t3_rc=nonzero || _t3_rc=zero
assert_eq "outside intentions/: exit non-zero" "nonzero" "$_t3_rc"
assert_contains "outside intentions/: names the path" ".claude/skills/rogue.md" "$OUT"

# ---------------------------------------------------------------------------
# Test 4: a returned id with NO matching new file fails — the return value
# and the tree disagree.
# ---------------------------------------------------------------------------
echo "Test 4: a returned id with no matching file fails"
write_case \
  $'' \
  $'?? intentions/tactic-a.md\n' \
  $'tactic-a\ntactic-b\n'
run_sut
[ "$RC" -ne 0 ] && _t4_rc=nonzero || _t4_rc=zero
assert_eq "unmatched returned id: exit non-zero" "nonzero" "$_t4_rc"
assert_contains "unmatched returned id: names the id" "tactic-b" "$OUT"

# ---------------------------------------------------------------------------
# Test 5: an `?? intentions/<id>.md` entry for an id NOT returned fails.
# ---------------------------------------------------------------------------
echo "Test 5: an intentions/<id>.md entry for an id not returned fails"
write_case \
  $'' \
  $'?? intentions/tactic-a.md\n?? intentions/tactic-stray.md\n' \
  $'tactic-a\n'
run_sut
[ "$RC" -ne 0 ] && _t5_rc=nonzero || _t5_rc=zero
assert_eq "stray id: exit non-zero" "nonzero" "$_t5_rc"
assert_contains "stray id: names the stray path" "intentions/tactic-stray.md" "$OUT"

# ---------------------------------------------------------------------------
# Test 6: the guard is judged PER PATH on the AFTER snapshot, not by a
# whole-line diff against the baseline.
#
# This case previously asserted that pre-existing TRACKED dirt is ignored. That
# was the unsound behavior: a whole-line `comm -13` only sees porcelain lines
# that are NEW, so a path already dirty in the baseline keeps an identical
# status line when the subagent modifies it further, produces no new line, and
# is never inspected. A prompt-injected subagent could flip `phase: done` on an
# already-modified `intentions/*.md` and be pushed to main — exactly the
# outcome this fence exists to prevent. Status comparison alone cannot catch it
# either, since ` M` -> ` M` is unchanged by a further edit.
#
# So a tracked-dirty path is now refused outright, and the pre-existing entry
# can no longer provide cover for a new one. Step 3's commit-merge-push is
# expected to leave a clean tree; nothing verified that before, and this does.
# 6b keeps the half of the original intent that remains correct: an untracked
# stray already present in the baseline is not the subagent's write.
# ---------------------------------------------------------------------------
echo "Test 6a: pre-existing TRACKED dirt is refused, so it cannot mask a further edit"
write_case \
  $' M some/pre-existing.ts\n' \
  $' M some/pre-existing.ts\n?? intentions/tactic-new-thing.md\n' \
  $'tactic-new-thing\n'
run_sut
assert_eq "pre-existing tracked dirt: exit 1" "1" "$RC"
assert_contains "pre-existing tracked dirt: names the tracked path" "some/pre-existing.ts" "$OUT"
assert_contains "pre-existing tracked dirt: names the offending status" "is not an untracked addition" "$OUT"

echo "Test 6b: a pre-existing UNTRACKED stray is still ignored"
write_case \
  $'?? .claude/agents\n' \
  $'?? .claude/agents\n?? intentions/tactic-new-thing.md\n' \
  $'tactic-new-thing\n'
run_sut
assert_eq "pre-existing untracked stray: exit 0" "0" "$RC"
assert_eq "pre-existing untracked stray: no output" "" "$OUT"

echo "Test 6c: a returned id whose file was ALREADY an untracked stray is satisfied"
# Regression pin. The baseline skip used to run BEFORE the returned-id match,
# so this shape `continue`d past the id, left ID_SATISFIED unset, and the
# "returned ids with no matching new file" loop failed a CORRECT run with "the
# return value and the tree disagree".
#
# The shape is not hypothetical: a parked graph-commit leaves intentions/<id>.md
# as an untracked stray, and the NEXT round's subagent legitimately writes that
# same path again — so the file is in the baseline AND is this round's write.
#
# Distinct from 6b: there the stray is NOT a returned id (correctly ignored);
# here it IS one (must be credited, not ignored).
write_case \
  $'?? intentions/tactic-parked-last-round.md\n' \
  $'?? intentions/tactic-parked-last-round.md\n' \
  $'tactic-parked-last-round\n'
run_sut
assert_eq "returned id already a stray: exit 0" "0" "$RC"
assert_eq "returned id already a stray: no output" "" "$OUT"

# ---------------------------------------------------------------------------
# Test 7: usage / input errors are clear, non-zero, and distinct from a
# violation (exit 2, not exit 1).
# ---------------------------------------------------------------------------
echo "Test 7a: wrong argument count exits 2"
set +e
OUT=$("$SUT" only-one-arg 2>&1)
RC=$?
set -e
assert_eq "wrong arg count: exit 2" "2" "$RC"

echo "Test 7b: an unreadable input file exits 2"
write_case $'' $'?? intentions/tactic-a.md\n' $'tactic-a\n'
set +e
OUT=$("$SUT" "$BASELINE_FILE" "$AFTER_FILE" "$CASE_DIR/does-not-exist.txt" 2>&1)
RC=$?
set -e
assert_eq "unreadable ids file: exit 2" "2" "$RC"

report_results
