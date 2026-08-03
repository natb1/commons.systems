#!/usr/bin/env bash
# Tests for the domain sweep gate + brief (agentFinderSet, DOMAIN_PROMPTS,
# sweepDomains, sweepSections, sliced out of .claude/workflows/review-fix.js
# by review-fix-domain-sweep-probe.mjs) -- modeled directly on
# test-review-fix-instrument.sh (tactic-review-domain-lens-consolidation).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix domain sweep gate + brief (tactic-review-domain-lens-consolidation) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job
# (this script) is the only test that runs on every PR, so coverage for
# agentFinderSet/DOMAIN_PROMPTS/sweepDomains/sweepSections must live here. The
# probe slices the pure "domain sweep gate" and "domain sweep brief" regions
# out of review-fix.js between sentinel comments and evals them together.

echo "Test: review-fix domain sweep gate + brief"

out=$(node "$SCRIPT_DIR/review-fix-domain-sweep-probe.mjs")

# --- agentFinderSet roster shape ---------------------------------------------

assert_eq "domain sweep: roster_code_noapp" '["input-validation","domain-sweep","red-team","security-review"]' \
  "$(printf '%s' "$out" | jq -c '.roster_code_noapp')"

assert_eq "domain sweep: roster_code_app" '["input-validation","domain-sweep","red-team","security-review","firebase","cost"]' \
  "$(printf '%s' "$out" | jq -c '.roster_code_app')"

assert_eq "domain sweep: roster_empty is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_empty')"
assert_eq "domain sweep: roster_docs is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_docs')"
assert_eq "domain sweep: roster_tests is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_tests')"

# None of the three folded-in domain names ('secrets'/'auth'/'data-exposure')
# is itself a member of ANY roster array — they are brief sections of the
# single 'domain-sweep' agent, not separate agent names.
assert_eq "domain sweep: 'secrets' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app] | flatten | any(. == "secrets")')"
assert_eq "domain sweep: 'auth' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app] | flatten | any(. == "auth")')"
assert_eq "domain sweep: 'data-exposure' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app] | flatten | any(. == "data-exposure")')"

# --- sweepDomains trigger asymmetry ------------------------------------------

assert_eq "domain sweep: domains_noapp" '["secrets"]' "$(printf '%s' "$out" | jq -c '.domains_noapp')"
assert_eq "domain sweep: domains_app" '["secrets","auth","data-exposure"]' "$(printf '%s' "$out" | jq -c '.domains_app')"

# --- sweepSections brief content ---------------------------------------------
# Pull fields out of the SAME $out JSON object into shell variables, then use a
# single jq invocation with --arg to do the containment check. This avoids
# re-parsing large raw text through the shell unsafely and avoids embedding
# large strings as jq literals (per .claude/rules/shell-json.md).

sections_noapp=$(printf '%s' "$out" | jq -r '.sections_noapp')
sections_app=$(printf '%s' "$out" | jq -r '.sections_app')
brief_secrets=$(printf '%s' "$out" | jq -r '.brief_secrets')
brief_auth=$(printf '%s' "$out" | jq -r '.brief_auth')
brief_data_exposure=$(printf '%s' "$out" | jq -r '.brief_data_exposure')

assert_eq "domain sweep: sections_noapp contains brief_secrets" "true" \
  "$(jq -n --arg hay "$sections_noapp" --arg needle "$brief_secrets" '$hay | contains($needle)')"
assert_eq "domain sweep: sections_noapp does NOT contain brief_auth" "false" \
  "$(jq -n --arg hay "$sections_noapp" --arg needle "$brief_auth" '$hay | contains($needle)')"
assert_eq "domain sweep: sections_noapp does NOT contain brief_data_exposure" "false" \
  "$(jq -n --arg hay "$sections_noapp" --arg needle "$brief_data_exposure" '$hay | contains($needle)')"

assert_eq "domain sweep: sections_app contains brief_secrets" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle "$brief_secrets" '$hay | contains($needle)')"
assert_eq "domain sweep: sections_app contains brief_auth" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle "$brief_auth" '$hay | contains($needle)')"
assert_eq "domain sweep: sections_app contains brief_data_exposure" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle "$brief_data_exposure" '$hay | contains($needle)')"

# Each section labels the Source its findings must carry — pin the literal
# "set Source" instruction text is present per domain, for both app_or_rules
# states applicable to it.
assert_eq "domain sweep: sections_noapp carries set Source secrets" "true" \
  "$(jq -n --arg hay "$sections_noapp" --arg needle 'set Source "secrets"' '$hay | contains($needle)')"
assert_eq "domain sweep: sections_app carries set Source secrets" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle 'set Source "secrets"' '$hay | contains($needle)')"
assert_eq "domain sweep: sections_app carries set Source auth" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle 'set Source "auth"' '$hay | contains($needle)')"
assert_eq "domain sweep: sections_app carries set Source data-exposure" "true" \
  "$(jq -n --arg hay "$sections_app" --arg needle 'set Source "data-exposure"' '$hay | contains($needle)')"

# --- call-site / doctrine coverage (anti-regression teeth) -------------------
# A future edit that keeps these functions but stops calling them, or drops
# 'domain-sweep' back out of LANE_B into LANE_A, would otherwise pass every
# fixture case above. These greps pin the call sites and the enum/roster
# shapes that must stay in lockstep.

assert_eq "domain-sweep branch present in finderPrompt" "1" \
  "$(grep -c "if (name === 'domain-sweep')" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

assert_eq "sweepSections is called with args.app_or_rules" "1" \
  "$(grep -c 'sweepSections(args.app_or_rules)' "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# domain-sweep is NOT a member of LANE_A (it is a Lane-B finder like the other
# domain reviewers) — pins that LANE_A's literal definition is unchanged and
# does not list domain-sweep.
assert_eq "domain-sweep is not a member of LANE_A" "1" \
  "$(grep -c "LANE_A = new Set(\['code-review', 'security-review'\])" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

# Source-name-count anti-regression. Exact counts verified against the current
# file (not guessed):
#   - 'data-exposure', (WITH trailing comma) appears exactly TWICE: the Source
#     enum entry and the SEC_SOURCES entry. Its DOMAIN_PROMPTS key line reads
#     `'data-exposure':` (colon, no comma) and its sweepDomains occurrence is
#     the LAST array element before `]` (`..., 'data-exposure']`, no trailing
#     comma) — neither matches the comma-suffixed pattern.
#   - 'auth', and 'secrets', each appear exactly THREE times: the Source enum
#     entry, the SEC_SOURCES entry, AND the sweepDomains array entry — both
#     sit mid-array followed by another element, so both DO carry a trailing
#     comma there (`['secrets', 'auth', 'data-exposure']`).
assert_eq "'data-exposure', appears exactly twice (Source enum + SEC_SOURCES)" "2" \
  "$(grep -c "'data-exposure'," "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

assert_eq "'auth', appears exactly three times (Source enum + SEC_SOURCES + sweepDomains array)" "3" \
  "$(grep -c "'auth'," "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

assert_eq "'secrets', appears exactly three times (Source enum + SEC_SOURCES + sweepDomains array)" "3" \
  "$(grep -c "'secrets'," "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

assert_eq "'domain-sweep' appears exactly twice (agentFinderSet push + finderPrompt branch)" "2" \
  "$(grep -c "'domain-sweep'" "$REPO_ROOT/.claude/workflows/review-fix.js" || true)"

report_results
