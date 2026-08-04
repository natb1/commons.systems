#!/usr/bin/env bash
# Tests for the cross-lane dedup absorption helpers (laneAAbsorbCandidates,
# projectLaneAResidue, contestedLocationGroups, applyXlaneAbsorption, and the
# real dedupMerge), sliced out of .claude/workflows/review-fix.js by
# review-fix-xlane-dedup-probe.mjs -- modeled directly on
# test-review-fix-residue-death.sh (tactic-review-cross-lane-dedup).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix cross-lane dedup (tactic-review-cross-lane-dedup) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for the
# cross-lane absorption logic must live here. The probe slices the pure
# `dedup merge` and `cross-lane dedup` regions out of review-fix.js between
# sentinel comments and evals each slice.

echo "Test: review-fix cross-lane dedup"

out=$(node "$SCRIPT_DIR/review-fix-xlane-dedup-probe.mjs")

# --- lane-b-wins: the real sliced dedupMerge picks the Lane-B member as
# representative regardless of Confidence, and unions sources.
assert_eq "xlane dedup: lane-b-wins id" "b" \
  "$(printf '%s' "$out" | jq -r '."lane-b-wins".id')"
assert_eq "xlane dedup: lane-b-wins Source" "secrets" \
  "$(printf '%s' "$out" | jq -r '."lane-b-wins".Source')"
assert_eq "xlane dedup: lane-b-wins sources union" '["code-review","secrets"]' \
  "$(printf '%s' "$out" | jq -c '."lane-b-wins".sources')"

# --- candidates-exclude-high-severity-security-review: only the medium
# security-review item and the code-review item survive; the high-severity
# security-review item is excluded (reserved for the deviation escalation gate).
assert_eq "xlane dedup: candidates exclude high-severity security-review" "1 2" \
  "$(printf '%s' "$out" | jq -r '."candidates-exclude-high-severity-security-review".survivingIdx | join(" ")')"
assert_eq "xlane dedup: surviving source:severity pairs" "security-review:medium code-review:high" \
  "$(printf '%s' "$out" | jq -r '."candidates-exclude-high-severity-security-review".survivingSourceSeverity | join(" ")')"

# --- contested-groups: only the shared location is contested; single-lane
# locations are absent from the result.
assert_eq "xlane dedup: contested-groups locations" '["shared.js:1"]' \
  "$(printf '%s' "$out" | jq -c '."contested-groups".locations')"
assert_eq "xlane dedup: contested-groups shared location present" "true" \
  "$(printf '%s' "$out" | jq -r '."contested-groups".hasSharedLocation')"
assert_eq "xlane dedup: contested-groups lane-b-only location absent" "false" \
  "$(printf '%s' "$out" | jq -r '."contested-groups".hasLaneBOnlyLocation')"
assert_eq "xlane dedup: contested-groups lane-a-only location absent" "false" \
  "$(printf '%s' "$out" | jq -r '."contested-groups".hasLaneAOnlyLocation')"

# --- absorb-fail-closed-bad-merge: merge() regressed to a Lane-A Source ->
# fail closed, deduped unchanged, nothing absorbed.
assert_eq "xlane dedup: bad-merge skipped non-zero" "1" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-bad-merge".skipped')"
assert_eq "xlane dedup: bad-merge deduped unchanged" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-bad-merge".dedupedUnchanged')"
assert_eq "xlane dedup: bad-merge absorbedIdx empty" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-bad-merge".absorbedIdxEmpty')"

# --- absorb-fail-closed-id-not-found: merged id absent from deduped -> fail
# closed, deduped unchanged, nothing absorbed.
assert_eq "xlane dedup: id-not-found skipped non-zero" "1" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-id-not-found".skipped')"
assert_eq "xlane dedup: id-not-found deduped unchanged" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-id-not-found".dedupedUnchanged')"
assert_eq "xlane dedup: id-not-found absorbedIdx empty" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-fail-closed-id-not-found".absorbedIdxEmpty')"

# --- absorb-success: real dedupMerge succeeds, matching deduped entry is
# replaced in place, absorbedIdx carries the expected _laneAIdx, and the
# unrelated deduped entry is untouched.
assert_eq "xlane dedup: absorb-success skipped zero" "0" \
  "$(printf '%s' "$out" | jq -r '."absorb-success".skipped')"
assert_eq "xlane dedup: absorb-success replaced Source is Lane-B" "secrets" \
  "$(printf '%s' "$out" | jq -r '."absorb-success".replacedSource')"
assert_eq "xlane dedup: absorb-success replaced sources union" '["code-review","secrets"]' \
  "$(printf '%s' "$out" | jq -c '."absorb-success".replacedSources')"
assert_eq "xlane dedup: absorb-success absorbedIdx" "[3]" \
  "$(printf '%s' "$out" | jq -c '."absorb-success".absorbedIdx')"
assert_eq "xlane dedup: absorb-success other entry untouched" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-success".otherEntryUntouched')"

# --- absorb-partition-reuse: the model-returned subgroups re-use a Lane-B id
# across two subgroups (not a real partition). First merge wins, the second
# subgroup is skipped whole, and only the FIRST Lane-A twin is absorbed -- the
# second must survive in laneAResidue so it still reaches the disposition agent.
assert_eq "xlane dedup: partition-reuse skipped one subgroup" "1" \
  "$(printf '%s' "$out" | jq -r '."absorb-partition-reuse".skipped')"
assert_eq "xlane dedup: partition-reuse absorbs only the first Lane-A twin" "[3]" \
  "$(printf '%s' "$out" | jq -c '."absorb-partition-reuse".absorbedIdx')"
assert_eq "xlane dedup: partition-reuse keeps the first merge's sources union" '["code-review","secrets"]' \
  "$(printf '%s' "$out" | jq -c '."absorb-partition-reuse".replacedSources')"

# --- absorb-double-replace: two disjoint subgroups whose merges collide on the
# same deduped id -> the second replacement is refused (fail closed).
assert_eq "xlane dedup: double-replace skipped one subgroup" "1" \
  "$(printf '%s' "$out" | jq -r '."absorb-double-replace".skipped')"
assert_eq "xlane dedup: double-replace absorbs only the first Lane-A twin" "[3]" \
  "$(printf '%s' "$out" | jq -c '."absorb-double-replace".absorbedIdx')"
assert_eq "xlane dedup: double-replace leaves the second deduped entry untouched" "true" \
  "$(printf '%s' "$out" | jq -r '."absorb-double-replace".secondEntryUntouched')"

# --- empty-inputs: no throw, empty results throughout.
assert_eq "xlane dedup: empty-inputs candidates length" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-inputs".candidatesLength')"
assert_eq "xlane dedup: empty-inputs contested size" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-inputs".contestedSize')"
assert_eq "xlane dedup: empty-inputs deduped length" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-inputs".dedupedLength')"
assert_eq "xlane dedup: empty-inputs skipped" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-inputs".skipped')"
assert_eq "xlane dedup: empty-inputs absorbedIdx size" "0" \
  "$(printf '%s' "$out" | jq -r '."empty-inputs".absorbedIdxSize')"

# --- doctrine coverage (anti-regression teeth) -------------------------------
# A future edit that removes or duplicates a sentinel would otherwise pass
# every fixture case above (the probe already fails loudly on a mismatch, but
# pin the source-level invariant here too so a driver-only run catches it).

assert_eq "xlane dedup: both START sentinels present (dedup merge + cross-lane dedup)" "2" \
  "$(grep -c "sliced + eval'd by review-fix-xlane-dedup-probe.mjs >>>" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "xlane dedup: dedup-merge/cross-lane END sentinel count" "2" \
  "$(grep -cE '^// <<< (dedup merge|cross-lane dedup) <<<$' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "xlane dedup: cross-lane dedup START sentinel present" "1" \
  "$(grep -c "cross-lane dedup: sliced + eval'd by review-fix-xlane-dedup-probe.mjs" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"
assert_eq "xlane dedup: applyXlaneAbsorption call site present" "1" \
  "$(grep -c 'applyXlaneAbsorption({ deduped, subgroups: partition, byId, merge: dedupMerge })' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

report_results
