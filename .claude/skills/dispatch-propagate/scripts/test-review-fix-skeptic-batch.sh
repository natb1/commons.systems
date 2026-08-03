#!/usr/bin/env bash
# Tests for the skeptic batching primitives (filePath, skepticBatchJobs, sliced
# out of .claude/workflows/review-fix.js by review-fix-skeptic-batch-probe.mjs)
# -- modeled directly on test-review-fix-domain-sweep.sh
# (tactic-review-verify-per-file-batching).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix skeptic batching (tactic-review-verify-per-file-batching) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# filePath/skepticBatchJobs must live here. The probe slices the pure "skeptic
# batching" region out of review-fix.js between sentinel comments and evals it.
#
# This unit (Unit 1 of 3) introduces the primitives only -- no call site is
# rewired yet. Units 2 and 3 rewire phase('verify') and the residue skeptic
# pre-gate to use them, in later sessions.

echo "Test: review-fix skeptic batching primitives"

out=$(node "$SCRIPT_DIR/review-fix-skeptic-batch-probe.mjs")

# --- filePath cases -----------------------------------------------------------

assert_eq "filePath: location with line number" '"a/b.ts"' \
  "$(printf '%s' "$out" | jq -c '.filePathCases.with_line')"

assert_eq "filePath: location with no line number" '"a/b.ts"' \
  "$(printf '%s' "$out" | jq -c '.filePathCases.no_line')"

assert_eq "filePath: empty string" '""' \
  "$(printf '%s' "$out" | jq -c '.filePathCases.empty')"

assert_eq "filePath: undefined" '""' \
  "$(printf '%s' "$out" | jq -c '.filePathCases.undefined_loc')"

assert_eq "filePath: two colons splits on the LAST one" '"a:b.ts"' \
  "$(printf '%s' "$out" | jq -c '.filePathCases.two_colons')"

# --- skepticBatchJobs: empty input --------------------------------------------

assert_eq "skepticBatchJobs: empty input -> []" '[]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.empty')"

# --- skepticBatchJobs: one medium item ----------------------------------------

assert_eq "skepticBatchJobs: one medium item -> 1 job count" '1' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_medium | length')"

assert_eq "skepticBatchJobs: one medium item -> replica 0" '0' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_medium[0].replica')"

assert_eq "skepticBatchJobs: one medium item -> ids" '["f1"]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_medium[0].ids')"

# --- skepticBatchJobs: two files, all medium ----------------------------------

assert_eq "skepticBatchJobs: two files -> 2 jobs total" '2' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.two_files | length')"

assert_eq "skepticBatchJobs: two files -> job sizes [3,1] in first-appearance order" '[3,1]' \
  "$(printf '%s' "$out" | jq -c '[.groupingCases.two_files[] | (.ids | length)]')"

assert_eq "skepticBatchJobs: two files -> file A's job before file B's job" '["A.ts","B.ts"]' \
  "$(printf '%s' "$out" | jq -c '[.groupingCases.two_files[].file]')"

# --- skepticBatchJobs: one file, 1 high (replicas=2) + 3 medium ---------------

assert_eq "skepticBatchJobs: 1 high + 3 medium -> 2 jobs" '2' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_high_three_medium | length')"

assert_eq "skepticBatchJobs: 1 high + 3 medium -> replica 0 holds all 4" '["h1","m1","m2","m3"]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_high_three_medium[0].ids')"

assert_eq "skepticBatchJobs: 1 high + 3 medium -> replica 1 holds ONLY the high item" '["h1"]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.one_high_three_medium[1].ids')"

# --- skepticBatchJobs: one file, 2 high (replicas=2) + 1 medium ---------------

assert_eq "skepticBatchJobs: 2 high + 1 medium -> 2 jobs" '2' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.two_high_one_medium | length')"

assert_eq "skepticBatchJobs: 2 high + 1 medium -> replica 0 holds all 3" '["h1","h2","m1"]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.two_high_one_medium[0].ids')"

assert_eq "skepticBatchJobs: 2 high + 1 medium -> replica 1 holds the 2 high items only" '["h1","h2"]' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.two_high_one_medium[1].ids')"

# --- skepticBatchJobs: same file, different keyOf (brief) never merged -------

assert_eq "skepticBatchJobs: same file different brief -> 2 separate job groups" '2' \
  "$(printf '%s' "$out" | jq -c '.groupingCases.same_file_different_brief | length')"

assert_eq "skepticBatchJobs: same file different brief -> distinct keys" 'true' \
  "$(printf '%s' "$out" | jq -c '(.groupingCases.same_file_different_brief[0].key) != (.groupingCases.same_file_different_brief[1].key)')"

assert_eq "skepticBatchJobs: same file different brief -> each job holds ONE item" '[1,1]' \
  "$(printf '%s' "$out" | jq -c '[.groupingCases.same_file_different_brief[] | (.ids | length)]')"

# --- Vote-parity invariant: mechanical, over the mixed fixture ----------------
# Every item must appear in exactly replicasOf(item) jobs total across the
# whole output, and no item may appear in zero jobs.

assert_eq "skepticBatchJobs: vote-parity -- every item's appearance count matches its replicasOf" 'true' \
  "$(printf '%s' "$out" | jq -c '.mixedAppearanceCounts == .mixedExpectedReplicas')"

assert_eq "skepticBatchJobs: vote-parity -- no item appears zero times" 'true' \
  "$(printf '%s' "$out" | jq -c '[.mixedAppearanceCounts[]] | all(. > 0)')"

# --- Reduction invariant: mechanical, over the mixed fixture ------------------
# Total job count <= sum(replicasOf) over all items, and STRICTLY less when
# any group holds more than one item (true for the mixed fixture: A.ts holds 3
# items, C.ts holds 2).

assert_eq "skepticBatchJobs: reduction -- job count <= sum(replicasOf)" 'true' \
  "$(printf '%s' "$out" | jq -c '.mixedJobCount <= .mixedReplicaSum')"

assert_eq "skepticBatchJobs: reduction -- job count STRICTLY less when a group holds >1 item" 'true' \
  "$(printf '%s' "$out" | jq -c 'if .mixedHasMultiItemGroup then .mixedJobCount < .mixedReplicaSum else true end')"

# --- call-site / doctrine coverage (anti-regression teeth) -------------------
# Pin that filePath is hoisted to module scope (single definition) and that the
# fix-phase file-grouping loop still calls it, so a future edit cannot silently
# reintroduce a duplicate local definition or stop calling the hoisted one.

REVIEW_FIX_JS="$REPO_ROOT/.claude/workflows/review-fix.js"

assert_eq "filePath is defined exactly once in review-fix.js" "1" \
  "$(grep -c '^function filePath(location)' "$REVIEW_FIX_JS" || true)"

assert_eq "skepticBatchJobs is defined exactly once in review-fix.js" "1" \
  "$(grep -c '^function skepticBatchJobs(items,' "$REVIEW_FIX_JS" || true)"

assert_eq "the fix-phase file-grouping loop still calls filePath" "1" \
  "$(grep -c 'const file = filePath(f.Location);' "$REVIEW_FIX_JS" || true)"

assert_eq "BATCH_VERDICT_SCHEMA is defined exactly once in review-fix.js" "1" \
  "$(grep -c '^const BATCH_VERDICT_SCHEMA = {' "$REVIEW_FIX_JS" || true)"

assert_eq "VERDICT_SCHEMA is NOT deleted (later units migrate call sites)" "1" \
  "$(grep -c '^const VERDICT_SCHEMA = {' "$REVIEW_FIX_JS" || true)"

report_results
