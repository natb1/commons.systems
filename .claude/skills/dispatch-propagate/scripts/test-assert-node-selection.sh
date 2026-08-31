#!/usr/bin/env bash
# Tests for assert-node-selection — the shared selection-validity gate
# primitive (tactic-phase-entry-selection-gate, unit 1).
#
# Harness: an ephemeral bare-origin + working-checkout git fixture (mirrors
# test-dispatch-derive-node-target.sh's make_repo()). DISPATCH_GRAPH_MAIN_WORKTREE
# is pointed at the working checkout so lib-graph-worktree.sh's
# resolve_main_worktree resolves it directly without a real `git worktree
# list` walk (same override test-provision-node-worktree.sh uses).
#
# The SUT is run IN PLACE (not copied to a scratch dir), so its own
# SCRIPT_DIR/REPO_ROOT derivation resolves to the real repo root — which is
# exactly what lets it invoke the REAL `node --import tsx/esm
# packages/intentionsutil/scripts/check-node-selection.ts` against the fixture
# snapshot. No tsx/gh stubbing: the point of this suite is the plumbing PLUS
# the verdict, not an isolated unit test of the gate script (that lives in
# check-node-selection.ts's own test suite).
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
source "$SCRIPT_DIR/test-helpers.sh"
SUT="$SCRIPT_DIR/assert-node-selection"

TMP_ROOT=""
cleanup() { [ -n "${TMP_ROOT:-}" ] && rm -rf "$TMP_ROOT"; }
trap cleanup EXIT INT TERM
TMP_ROOT=$(mktemp -d)

BODY_MARKER="FIXTURE BODY MARKER TEXT"

# Write a valid intentions/<id>.md node file into $1 (a repo working dir).
# $2 = node id, $3 = phase, $4 = office_hours YAML block (optional; defaults
# to `office_hours: null`), $5 = attributes YAML block (optional; defaults to
# `attributes: {}`).
write_node_fixture() {
  local repo="$1" id="$2" phase="$3"
  local office_hours="${4:-office_hours: null}"
  local attributes="${5:-attributes: {}}"
  mkdir -p "$repo/intentions"
  cat > "$repo/intentions/$id.md" <<EOF
---
id: $id
kind: tactic
statement: Fixture tactic node for assert-node-selection tests
owner: ai
status: codified
parent: null
phase: $phase
execution: null
serves: []
recovers: []
clarifications: []
tooling_goals: []
validates: []
blocked_by: []
$office_hours
pace_exempt: false
rounds: null
$attributes
rationale: null
reading: null
gap: null
success_signal: null
attention: null
---
# Fixture tactic node

$BODY_MARKER
EOF
}

# Build a fresh ephemeral bare-origin + working-checkout fixture, seeded with
# one placeholder node (so `git archive origin/main intentions/` always has
# something to archive — an empty tracked dir would make the archive itself
# fail, manufacturing a false exit 1 unrelated to the case under test). Sets
# globals: REPO, BARE.
REPO=""
BARE=""
make_repo() {
  REPO=$(mktemp -d "$TMP_ROOT/repo.XXXXXX")
  BARE=$(mktemp -d "$TMP_ROOT/bare.XXXXXX")

  git -C "$BARE" init --bare --quiet --initial-branch=main

  git -C "$REPO" init --quiet --initial-branch=main
  git -C "$REPO" config user.email "test@example.com"
  git -C "$REPO" config user.name "Test User"
  git -C "$REPO" remote add origin "$BARE"
  mkdir -p "$REPO/.claude/worktrees"

  write_node_fixture "$REPO" "placeholder-node" implement

  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "baseline"
  git -C "$REPO" push --quiet origin main
}

# Commit and push whatever is currently in $REPO's working tree to origin/main.
push_repo() {
  git -C "$REPO" add -A
  git -C "$REPO" commit --quiet -m "update"
  git -C "$REPO" push --quiet origin main
}

# Run the SUT with CWD inside $REPO, DISPATCH_GRAPH_MAIN_WORKTREE pointed at
# $REPO so resolve_main_worktree resolves it directly. Sets globals: RC, OUT.
RC=0
OUT=""
run_sut() {
  local prev_dir
  prev_dir=$(pwd)
  cd "$REPO"
  set +e
  OUT=$(DISPATCH_GRAPH_MAIN_WORKTREE="$REPO" "$SUT" "$@" 2>&1)
  RC=$?
  # The suite runs `set -uo pipefail` and never enables errexit; `set +e`
  # above only guards this one command substitution.
  cd "$prev_dir"
}

# ---------------------------------------------------------------------------
# Test 1: valid selection at phase implement -> exit 0, stdout is a 64-hex
# fingerprint.
# ---------------------------------------------------------------------------
echo "Test 1: valid selection -> exit 0, 64-hex fingerprint"
make_repo
write_node_fixture "$REPO" "tactic-valid" implement
push_repo
run_sut "tactic-valid" implement
assert_eq "valid-selection: exit 0" "0" "$RC"
if [[ "$OUT" =~ ^[0-9a-f]{64}$ ]]; then
  assert_eq "valid-selection: stdout is 64-hex fingerprint" "0" "0"
else
  assert_eq "valid-selection: stdout is 64-hex fingerprint (got: $OUT)" "0" "1"
fi

# ---------------------------------------------------------------------------
# Test 2: phase advanced (qa on disk, implement requested) -> exit 12.
# ---------------------------------------------------------------------------
echo "Test 2: phase advanced -> exit 12"
make_repo
write_node_fixture "$REPO" "tactic-advanced" qa
push_repo
run_sut "tactic-advanced" implement
assert_eq "phase-advanced: exit 12" "12" "$RC"

# ---------------------------------------------------------------------------
# Test 3: node absent from origin/main -> exit 12 (check 1: exists).
# ---------------------------------------------------------------------------
echo "Test 3: node absent -> exit 12"
make_repo
run_sut "tactic-absent" implement
assert_eq "node-absent: exit 12" "12" "$RC"

# ---------------------------------------------------------------------------
# Test 4: office_hours populated (first-class) -> exit 12.
# ---------------------------------------------------------------------------
echo "Test 4: office_hours populated -> exit 12"
make_repo
OFFICE_HOURS_BLOCK=$(cat <<'EOF'
office_hours:
  reason: fixture park
  since: 2026-08-01
  recommendation: null
  session_type: other
EOF
)
write_node_fixture "$REPO" "tactic-parked" implement "$OFFICE_HOURS_BLOCK"
push_repo
run_sut "tactic-parked" implement
assert_eq "office-hours-parked: exit 12" "12" "$RC"

# ---------------------------------------------------------------------------
# Test 5: attributes.office_hours squatter populated, top-level office_hours
# null. The front door IGNORES the squatter (exit 0) — and the park property
# this row used to pin is now enforced one layer up, at validation time.
#
# MIGRATION. This row originally asserted exit 12, pinning `readParked`'s
# squatter fallback in check-node-selection.ts. PR #3138 (commit 96d22cb1,
# "graph tooling: node-mutation script hardening and the attributes
# shadow-ban") DELETED all six squatter-aware readers there — readPhase,
# readParked, readStrategyFingerprint, readMarkers, readFixState,
# readConflictState — so the gate now reads `office_hours` first-class only.
# The guard did not vanish, it moved and got stronger: `validateGraph` rule 23
# bans any `attributes` key that shadows a first-class IntentionNode field
# name, and PRESENCE is the violation (any value fails), so a squatter-parked
# node cannot land on main at all. A worker therefore can never be handed one.
#
# The row is retargeted, not deleted, in both halves of that split — matching
# how the same PR retargeted the vitest sibling ("a stray
# attributes.office_hours no longer parks — the squatter read is retired",
# packages/intentionsutil/test/check-node-selection.test.ts):
#   5a — the reader's inverse: the squatter is invisible to the park gate.
#   5b — the property at its new home: the REAL validator refuses the very
#        same on-disk fixture with the rule-23 shadow-ban error.
# The first-class park (the spelling that IS honored) is Test 4 above.
# ---------------------------------------------------------------------------
echo "Test 5: squatter attributes.office_hours -> front door ignores it, validator rejects it"
make_repo
ATTRIBUTES_BLOCK=$(cat <<'EOF'
attributes:
  office_hours:
    reason: squatter park
    since: 2026-08-01
    recommendation: null
    session_type: other
EOF
)
write_node_fixture "$REPO" "tactic-squatter-parked" implement "office_hours: null" "$ATTRIBUTES_BLOCK"
push_repo
run_sut "tactic-squatter-parked" implement
# 5a: the retired reader's inverse — a squatted park does not park.
assert_eq "squatter-office-hours: park gate reads first-class only, exit 0" "0" "$RC"
if [[ "$OUT" == *"not-parked"* ]]; then
  assert_eq "squatter-office-hours: no not-parked verdict (got: $OUT)" "0" "1"
else
  assert_eq "squatter-office-hours: no not-parked verdict" "0" "0"
fi

# 5b: the park property at its new location. Run the REAL validator against
# the same fixture store the front door just read. Rule 23 rejects the node,
# so it is unlandable on main and no worker can ever be selected onto it.
# (The fixture store is a bare two-node tree with no kind-* nodes, so the
# validator emits kind-edge complaints too; the assertion keys on the rule-23
# message specifically, which is what this row is about.)
VALIDATOR="$SCRIPT_DIR/../../../../packages/intentionsutil/scripts/validate-graph.ts"
VALIDATE_OUT=$(node --import tsx/esm "$VALIDATOR" "$REPO/intentions" 2>&1)
VALIDATE_RC=$?
if [ "$VALIDATE_RC" -eq 0 ]; then
  assert_eq "squatter-office-hours: validate-graph exits non-zero (rule 23)" "nonzero" "0"
else
  assert_eq "squatter-office-hours: validate-graph exits non-zero (rule 23)" "nonzero" "nonzero"
fi
assert_contains "squatter-office-hours: rule 23 names the shadowed field" \
  "tactic-squatter-parked: attributes.office_hours shadows the first-class office_hours field" \
  "$VALIDATE_OUT"

# ---------------------------------------------------------------------------
# Test 6: --dir supplied -> no git fetch occurs. Assert by pointing origin at
# an unreachable path (never pushed there) and still reaching the GATE (rather
# than the exit-1 fetch failure) from the working-tree fixture passed via
# --dir.
#
# An unaccompanied --dir (no provenance flags) is an unattested read. As of
# tactic-graph-execute-fresh-main-read Unit 5 the freshness check is ENFORCED,
# so the gate REFUSES it with exit 15 instead of warning and passing. The
# wrapper's case statement passes 12/13/15 through unchanged (this is the
# correct, intended behavior — align-tactics's Step 0 exit-code routing table
# depends on 15 being distinguishable here from a generic mechanical failure),
# so the observable exit here is 15, with the gate's own `unknown-freshness:`
# line on stderr.
# ---------------------------------------------------------------------------
echo "Test 6: --dir supplied -> no fetch; unattested read refused by the freshness gate"
make_repo
write_node_fixture "$REPO" "tactic-dir-override" implement
git -C "$REPO" remote set-url origin "/nonexistent/path/origin.git"
run_sut "tactic-dir-override" implement --dir "$REPO/intentions"
assert_eq "dir-override: exit 15 (unknown-freshness passed through)" "15" "$RC"
assert_contains "dir-override: stderr warns unknown-freshness (unattested --dir)" "unknown-freshness:" "$OUT"

# ---------------------------------------------------------------------------
# Test 6b: --dir supplied ALONGSIDE the three provenance flags -> exit 0, NO
# unknown-freshness warning (the snapshot is now a typed, checkable input
# rather than an unattested read).
# ---------------------------------------------------------------------------
echo "Test 6b: --dir plus provenance flags -> exit 0, no unknown-freshness warning"
make_repo
write_node_fixture "$REPO" "tactic-dir-override-provenance" implement
git -C "$REPO" remote set-url origin "/nonexistent/path/origin.git"
PROVENANCE_SHA=$(git -C "$REPO" rev-parse HEAD)
PROVENANCE_FETCHED_AT=$(date -u +%FT%TZ)
run_sut "tactic-dir-override-provenance" implement --dir "$REPO/intentions" \
  --snapshot-ref "origin/main" --snapshot-sha "$PROVENANCE_SHA" --snapshot-fetched-at "$PROVENANCE_FETCHED_AT"
assert_eq "dir-override-provenance: exit 0" "0" "$RC"
if [[ "$OUT" == *"unknown-freshness:"* ]]; then
  assert_eq "dir-override-provenance: stderr does NOT warn unknown-freshness (got: $OUT)" "0" "1"
else
  assert_eq "dir-override-provenance: stderr does NOT warn unknown-freshness" "0" "0"
fi

# ---------------------------------------------------------------------------
# Test 7: invalid node id -> exit 2.
# ---------------------------------------------------------------------------
echo "Test 7: invalid node id -> exit 2"
make_repo
run_sut "Tactic_Bad" implement
assert_eq "invalid-node-id: exit 2" "2" "$RC"

# ---------------------------------------------------------------------------
# Test 8: unknown flag -> exit 2.
# ---------------------------------------------------------------------------
echo "Test 8: unknown flag -> exit 2"
make_repo
write_node_fixture "$REPO" "tactic-unknown-flag" implement
push_repo
run_sut "tactic-unknown-flag" implement --bogus-flag
assert_eq "unknown-flag: exit 2" "2" "$RC"

report_results
