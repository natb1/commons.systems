#!/usr/bin/env bash
# Tests for the instrument gate (INSTRUMENTS + instrumentVerdict, sliced out of
# .claude/workflows/review-fix.js by review-fix-instrument-probe.mjs) --
# modeled directly on test-qa-fix-partition.sh (tactic-lane-instrument-substitution-guard).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix instrument gate (tactic-lane-instrument-substitution-guard) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# instrumentVerdict must live here. The probe slices the pure INSTRUMENTS +
# instrumentVerdict text out of review-fix.js between sentinel comments and
# evals just that slice.

echo "Test: review-fix instrument gate"

out=$(node "$SCRIPT_DIR/review-fix-instrument-probe.mjs")

# Lane-B lenses (no named instrument) — the gate must not touch them.
assert_eq "instrument gate: lane-b ok" "true" "$(printf '%s' "$out" | jq -r '."lane-b".ok')"
assert_eq "instrument gate: lane-b checked" "false" "$(printf '%s' "$out" | jq -r '."lane-b".checked')"

# null finder result (probe-wave throttle signal) — must pass through inert.
assert_eq "instrument gate: null-res ok" "true" "$(printf '%s' "$out" | jq -r '."null-res".ok')"
assert_eq "instrument gate: null-res checked" "false" "$(printf '%s' "$out" | jq -r '."null-res".checked')"

# 'code-review' is no longer a registered instrument (tactic-review-code-review-
# invocation-contract moved its invocation out of this gate entirely). Every
# code-review-keyed fixture below is now a permanent regression check that an
# UNREGISTERED instrument name is always inert, never blocking — NOT stale
# coverage of the old gate. security-review's own negative paths, further down,
# carry the real gate coverage now.
assert_eq "instrument gate: no-receipt (unregistered code-review) ok" "true" "$(printf '%s' "$out" | jq -r '."no-receipt".ok')"
assert_eq "instrument gate: no-receipt (unregistered code-review) checked" "false" "$(printf '%s' "$out" | jq -r '."no-receipt".checked')"

assert_eq "instrument gate: wrong-name (unregistered code-review) ok" "true" "$(printf '%s' "$out" | jq -r '."wrong-name".ok')"
assert_eq "instrument gate: wrong-name (unregistered code-review) checked" "false" "$(printf '%s' "$out" | jq -r '."wrong-name".checked')"

assert_eq "instrument gate: not-invoked (unregistered code-review) ok" "true" "$(printf '%s' "$out" | jq -r '."not-invoked".ok')"
assert_eq "instrument gate: not-invoked (unregistered code-review) checked" "false" "$(printf '%s' "$out" | jq -r '."not-invoked".checked')"

# payload-signature checks do not even apply to an unregistered name — must
# still pass through inert regardless of payload shape.
assert_eq "instrument gate: sig-no-touched-files (unregistered code-review) ok" "true" "$(printf '%s' "$out" | jq -r '."sig-no-touched-files".ok')"
assert_eq "instrument gate: sig-no-touched-files (unregistered code-review) checked" "false" "$(printf '%s' "$out" | jq -r '."sig-no-touched-files".checked')"

# payload-signature mismatch: security-review (edits_nothing:true) reports a
# non-empty fixed[] — must fail. security-review is the sole remaining gated
# instrument, so this check still applies for real.
assert_eq "instrument gate: sig-security-edited ok" "false" "$(printf '%s' "$out" | jq -r '."sig-security-edited".ok')"

# clean receipts — unregistered code-review passes through inert (never
# "checked"); clean security-review is a real checked pass.
assert_eq "instrument gate: clean-code-review (unregistered) ok" "true" "$(printf '%s' "$out" | jq -r '."clean-code-review".ok')"
assert_eq "instrument gate: clean-code-review (unregistered) checked" "false" "$(printf '%s' "$out" | jq -r '."clean-code-review".checked')"
assert_eq "instrument gate: clean-security-review ok" "true" "$(printf '%s' "$out" | jq -r '."clean-security-review".ok')"
assert_eq "instrument gate: clean-security-review checked" "true" "$(printf '%s' "$out" | jq -r '."clean-security-review".checked')"

# --- security-review negative paths (the sole remaining gated instrument) ---
# no instrument receipt at all — schema violation, must fail.
assert_eq "instrument gate: no-receipt-security ok" "false" "$(printf '%s' "$out" | jq -r '."no-receipt-security".ok')"

# instrument receipt names the wrong stage — must fail.
assert_eq "instrument gate: wrong-name-security ok" "false" "$(printf '%s' "$out" | jq -r '."wrong-name-security".ok')"

# instrument reported not invoked — must fail, and the reason must carry the
# verbatim failure text so a human/agent reading it sees why the skill refused.
assert_eq "instrument gate: not-invoked-security ok" "false" "$(printf '%s' "$out" | jq -r '."not-invoked-security".ok')"
assert_eq "instrument gate: not-invoked-security reason contains failure text" "true" \
  "$(printf '%s' "$out" | jq -r '."not-invoked-security".reason | contains("security-review invocation failed")')"

# --- call-site / doctrine coverage (anti-regression teeth) ------------------
# A future edit that keeps instrumentVerdict but stops calling it would
# otherwise pass every fixture case above. These greps pin the call site and
# every downstream consumer that must still reference it.

# The gate call site — not just the definition.
assert_eq "instrument gate: call site present in review-fix.js" "1" \
  "$(grep -c 'const v = instrumentVerdict(name, res);' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# code-review's own instrumentFailed guard was removed along with
# codeReviewResult — INSTRUMENTS no longer names 'code-review', so nothing may
# reference it here.
assert_eq "instrument gate: instrumentFailed.has('code-review') removed" "0" \
  "$(grep -c "instrumentFailed.has('code-review')" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# security-review capture const is guarded by instrumentFailed.
assert_eq "instrument gate: securityReviewResult guarded by instrumentFailed" "1" \
  "$(grep -c "instrumentFailed.has('security-review')" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# instrument_failures is surfaced in the returned object.
assert_eq "instrument gate: instrument_failures in returned object" "1" \
  "$(grep -c 'instrument_failures: instrumentFailures' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# instrumentFailures.length is folded into deviation (and gates coverage_incomplete
# above it) — two sites total in the current file.
assert_eq "instrument gate: instrumentFailures.length referenced" "2" \
  "$(grep -c 'instrumentFailures.length' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# instrumentClause(...) is CALLED in the ONE remaining Lane-A prompt branch
# (security-review) — the code-review branch was removed along with its
# Skill-tool finder. Match the call site (instrumentClause(INSTRUMENTS[...]))
# rather than the bare substring, which would also match the one-line function
# definition (`function instrumentClause(spec) {`) and over-count.
assert_eq "instrument gate: instrumentClause used in the remaining Lane-A prompt branch" "1" \
  "$(grep -c 'instrumentClause(INSTRUMENTS' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# LANE_A_SCHEMA requires 'instrument' in its payload.
assert_eq "instrument gate: LANE_A_SCHEMA requires instrument" "1" \
  "$(grep -c "required: \['fixed', 'residue', 'instrument'\]" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

report_results
