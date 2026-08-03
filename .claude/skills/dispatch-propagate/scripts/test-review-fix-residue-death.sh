#!/usr/bin/env bash
# Tests for the residue death coverage helper (residueTruncate +
# undispositionedResidueRecords, sliced out of .claude/workflows/review-fix.js
# by review-fix-residue-death-probe.mjs) -- modeled directly on
# test-review-fix-instrument.sh (tactic-review-fix-residue-death-coverage).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix residue death coverage (tactic-review-fix-residue-death-coverage) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# undispositionedResidueRecords must live here. The probe slices the pure
# residueTruncate + undispositionedResidueRecords text out of review-fix.js
# between sentinel comments and evals just that slice.

echo "Test: review-fix residue death coverage"

out=$(node "$SCRIPT_DIR/review-fix-residue-death-probe.mjs")

# --- all-triaged: every index present in dispositionedIdx → nothing surfaces.
assert_eq "residue death: all-triaged dispositions empty" "0" \
  "$(printf '%s' "$out" | jq -r '."all-triaged".dispositions | length')"
assert_eq "residue death: all-triaged deferred empty" "0" \
  "$(printf '%s' "$out" | jq -r '."all-triaged".deferred | length')"
assert_eq "residue death: all-triaged note empty" "" \
  "$(printf '%s' "$out" | jq -r '."all-triaged".note')"

# --- total-death: no index triaged → every item surfaces, in order, all
# Deferred, with a note naming the fraction lost.
assert_eq "residue death: total-death dispositions count" "2" \
  "$(printf '%s' "$out" | jq -r '."total-death".dispositions | length')"
assert_eq "residue death: total-death deferred count" "2" \
  "$(printf '%s' "$out" | jq -r '."total-death".deferred | length')"
assert_eq "residue death: total-death ids" "residue-0 residue-1" \
  "$(printf '%s' "$out" | jq -r '[."total-death".dispositions[].id] | join(" ")')"
assert_eq "residue death: total-death buckets all Deferred" "true" \
  "$(printf '%s' "$out" | jq -r '[."total-death".dispositions[].bucket] | all(. == "Deferred")')"
assert_eq "residue death: total-death note non-empty" "true" \
  "$(printf '%s' "$out" | jq -r '."total-death".note | length > 0')"
assert_eq "residue death: total-death note contains fraction" "true" \
  "$(printf '%s' "$out" | jq -r '."total-death".note | contains("2 of 2")')"

# --- partial-drop: only the triaged index (1) is absent from the result.
assert_eq "residue death: partial-drop record count" "2" \
  "$(printf '%s' "$out" | jq -r '."partial-drop".dispositions | length')"
assert_eq "residue death: partial-drop ids" "residue-0 residue-2" \
  "$(printf '%s' "$out" | jq -r '[."partial-drop".dispositions[].id] | join(" ")')"

# --- empty-residue: no items at all → 0/0, no note.
assert_eq "residue death: empty-residue dispositions empty" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-residue".dispositions | length')"
assert_eq "residue death: empty-residue deferred empty" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-residue".deferred | length')"
assert_eq "residue death: empty-residue note empty" "" \
  "$(printf '%s' "$out" | jq -r '."empty-residue".note')"

# --- fields: truncation, sources, body composition, blocker propagation, and
# the absence of recommended_fix on the disposition entry (only Fixed/Required
# buckets carry it elsewhere in review-fix.js; this helper's bucket is always
# Deferred).
assert_eq "residue death: fields short_desc truncated to 140" "140" \
  "$(printf '%s' "$out" | jq -r '."fields".dispositions[0].short_desc | length')"
assert_eq "residue death: fields title truncated to 80" "80" \
  "$(printf '%s' "$out" | jq -r '."fields".deferred[0].title | length')"
assert_eq "residue death: fields sources" "security-review" \
  "$(printf '%s' "$out" | jq -r '."fields".dispositions[0].sources | join(",")')"
assert_eq "residue death: fields body contains recommended fix" "true" \
  "$(printf '%s' "$out" | jq -r '."fields".deferred[0].body | contains("Recommended fix: RFX")')"
assert_eq "residue death: fields body contains backlink" "true" \
  "$(printf '%s' "$out" | jq -r '."fields".deferred[0].body | contains("Backlink: #4242")')"
assert_eq "residue death: fields body contains death rationale" "true" \
  "$(printf '%s' "$out" | jq -r '."fields".deferred[0].body | contains("died after retries")')"
assert_eq "residue death: fields blocker_issue_nums array" "7 9" \
  "$(printf '%s' "$out" | jq -r '."fields".deferred[0].blocker_issue_nums | join(" ")')"
assert_eq "residue death: fields disposition entry has no recommended_fix key" "false" \
  "$(printf '%s' "$out" | jq -r '."fields".dispositions[0] | has("recommended_fix")')"

# --- independent-blockers: the 'independent' sentinel passes through verbatim
# (not treated as an array).
assert_eq "residue death: independent-blockers blocker_issue_nums" "independent" \
  "$(printf '%s' "$out" | jq -r '."independent-blockers".deferred[0].blocker_issue_nums')"

# --- call-site / doctrine coverage (anti-regression teeth) ------------------
# A future edit that keeps undispositionedResidueRecords but stops calling it,
# or stops wiring its results into laneADispositions/laneADeferred, would
# otherwise pass every fixture case above. These greps pin the call site and
# every downstream consumer that must still reference it.

assert_eq "residue death: helper call site present" "1" \
  "$(grep -c 'undispositionedResidueRecords(laneAResidue, residueResolvedByIdx' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "residue death: results pushed into laneADispositions" "1" \
  "$(grep -c 'laneADispositions.push(...undisposed.dispositions)' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "residue death: results pushed into laneADeferred" "1" \
  "$(grep -c 'laneADeferred.push(...undisposed.deferred)' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# coverage_incomplete = true appears at four sites in the current file: the
# throttle path, the instrument gate, an interior residue-processing site, and
# this residue-death wire-in. A future edit that drops any site's flag (or
# adds an unrelated one) should be investigated, not silently absorbed.
assert_eq "residue death: coverage_incomplete = true site count" "4" \
  "$(grep -c 'coverage_incomplete = true' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

report_results
