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

assert_eq "domain sweep: roster_code_app" '["input-validation","domain-sweep","red-team","security-review"]' \
  "$(printf '%s' "$out" | jq -c '.roster_code_app')"

assert_eq "domain sweep: roster_empty is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_empty')"
assert_eq "domain sweep: roster_docs is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_docs')"
assert_eq "domain sweep: roster_tests is []" '[]' "$(printf '%s' "$out" | jq -c '.roster_tests')"

# api_call_site (third arg) is what now gates the merged api-cost lens —
# app_or_rules alone (roster_code_app above) no longer adds anything.
assert_eq "domain sweep: roster_code_app_call ends in api-cost" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(printf '%s' "$out" | jq -c '.roster_code_app_call')"
assert_eq "domain sweep: roster_code_noapp_call ends in api-cost" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(printf '%s' "$out" | jq -c '.roster_code_noapp_call')"
assert_eq "domain sweep: roster_tests_call is [] (non-code surface, regardless of api_call_site)" '[]' \
  "$(printf '%s' "$out" | jq -c '.roster_tests_call')"

# None of the three folded-in domain-sweep names ('secrets'/'auth'/
# 'data-exposure') nor the two folded-in api-cost names ('firebase'/'cost')
# is itself a member of ANY roster array — they are brief sections of the
# 'domain-sweep'/'api-cost' agents, not separate agent names.
assert_eq "domain sweep: 'secrets' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app,.roster_code_app_call,.roster_code_noapp_call,.roster_tests_call] | flatten | any(. == "secrets")')"
assert_eq "domain sweep: 'auth' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app,.roster_code_app_call,.roster_code_noapp_call,.roster_tests_call] | flatten | any(. == "auth")')"
assert_eq "domain sweep: 'data-exposure' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app,.roster_code_app_call,.roster_code_noapp_call,.roster_tests_call] | flatten | any(. == "data-exposure")')"
assert_eq "domain sweep: 'firebase' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app,.roster_code_app_call,.roster_code_noapp_call,.roster_tests_call] | flatten | any(. == "firebase")')"
assert_eq "domain sweep: 'cost' is not an agent name in any roster" "false" \
  "$(printf '%s' "$out" | jq '[.roster_empty,.roster_docs,.roster_tests,.roster_code_noapp,.roster_code_app,.roster_code_app_call,.roster_code_noapp_call,.roster_tests_call] | flatten | any(. == "cost")')"

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

# --- apiCostSections brief content --------------------------------------------

api_cost_sections=$(printf '%s' "$out" | jq -r '.api_cost_sections')
brief_firebase=$(printf '%s' "$out" | jq -r '.brief_firebase')
cost_brief=$(printf '%s' "$out" | jq -r '.cost_brief')

assert_eq "domain sweep: api_cost_sections contains brief_firebase" "true" \
  "$(jq -n --arg hay "$api_cost_sections" --arg needle "$brief_firebase" '$hay | contains($needle)')"
assert_eq "domain sweep: api_cost_sections contains cost_brief" "true" \
  "$(jq -n --arg hay "$api_cost_sections" --arg needle "$cost_brief" '$hay | contains($needle)')"
assert_eq "domain sweep: api_cost_sections carries set Source firebase" "true" \
  "$(jq -n --arg hay "$api_cost_sections" --arg needle 'set Source "firebase"' '$hay | contains($needle)')"
assert_eq "domain sweep: api_cost_sections carries set Source cost" "true" \
  "$(jq -n --arg hay "$api_cost_sections" --arg needle 'set Source "cost"' '$hay | contains($needle)')"
# Pin the cost section's advisory (never-security-classified) OWASP/STRIDE
# treatment specifically — distinct from the firebase section, which fills them.
assert_eq "domain sweep: api_cost_sections carries cost OWASP/STRIDE advisory phrasing" "true" \
  "$(jq -n --arg hay "$api_cost_sections" --arg needle 'and OWASP "" and STRIDE "" on findings from this section — cost findings are ADVISORY' '$hay | contains($needle)')"

# apiCostDomains() order is load-bearing (see review-fix.js comment above
# apiCostDomains: firebase is allowedList[0] for the gather loop's SOURCE
# CLAMP, so an off-brief Source escalates to the security-classified lens
# rather than being silently demoted to advisory).
assert_eq "domain sweep: api_cost_domains is [firebase, cost] in that exact order" '["firebase","cost"]' \
  "$(printf '%s' "$out" | jq -c '.api_cost_domains')"

# --- call-site / doctrine coverage (anti-regression teeth) -------------------
# A future edit that keeps these functions but stops calling them, or drops
# 'domain-sweep' back out of LANE_B into LANE_A, would otherwise pass every
# fixture case above. These greps pin the call sites and the enum/roster
# shapes that must stay in lockstep.

REVIEW_FIX_JS="$REPO_ROOT/.claude/workflows/review-fix.js"

assert_eq "domain-sweep branch present in finderPrompt" "1" \
  "$(grep -c "if (name === 'domain-sweep')" "$REVIEW_FIX_JS" || true)"

assert_eq "api-cost branch present in finderPrompt" "1" \
  "$(grep -c "if (name === 'api-cost')" "$REVIEW_FIX_JS" || true)"

assert_eq "sweepSections is called with args.app_or_rules" "1" \
  "$(grep -c 'sweepSections(args.app_or_rules)' "$REVIEW_FIX_JS" || true)"

# laneBAllowedSources routes the api-cost agent's findings through
# apiCostDomains() for the source clamp — pins that the merge did not leave
# api-cost falling through to the bare `[name]` default arm. Two matches are
# expected: finderPrompt's `if (name === 'api-cost')` branch (pinned above)
# and laneBAllowedSources' own `name === 'api-cost'` ternary arm.
assert_eq "laneBAllowedSources routes api-cost through apiCostDomains()" "2" \
  "$(grep -c "name === 'api-cost'" "$REVIEW_FIX_JS" || true)"
assert_eq "laneBAllowedSources api-cost arm calls apiCostDomains()" "1" \
  "$(grep -c '? apiCostDomains()' "$REVIEW_FIX_JS" || true)"

# The gate function itself is only coverage if the run actually calls it with
# the run's own surface/app_or_rules/api_call_site. Without this pin, replacing
# the call with a narrowed literal or a hardcoded surface (turning the security
# fan-out off) leaves every probe/roster assertion above passing — the probe
# evals the untouched function, not the call site.
assert_eq "agentFinderSet is called with the run's surface/app_or_rules/api_call_site" "1" \
  "$(grep -c 'agentFinderSet(_a.surface, _a.app_or_rules, _a.api_call_site)' "$REVIEW_FIX_JS" || true)"

# The roster the gate pushes on a code surface — pinned as a literal so a
# silent narrowing (dropping a finder from the push) fails here as well as in
# the probe's roster assertions.
assert_eq "agentFinderSet pushes the full code-surface roster" "1" \
  "$(grep -c "set.push('input-validation', 'domain-sweep', 'red-team', 'security-review')" "$REVIEW_FIX_JS" || true)"

# domain-sweep is NOT a member of LANE_A (it is a Lane-B finder like the other
# domain reviewers) — pins that LANE_A's literal definition is unchanged and
# does not list domain-sweep.
assert_eq "domain-sweep is not a member of LANE_A" "1" \
  "$(grep -c "LANE_A = new Set(\['code-review', 'security-review'\])" "$REVIEW_FIX_JS" || true)"

# Structural (not line-count) membership pins for the two source enumerations
# the fold has to keep in lockstep: the Source enum and SEC_SOURCES. A
# `grep -c 'name',` count is satisfiable without the real entry — `grep -c`
# counts matching LINES, so deleting a real entry (e.g. dropping 'auth' from
# SEC_SOURCES, which silently reroutes unclassified auth findings from
# Out-of-scope to Deferred) while adding any comment line containing the same
# text keeps the count unchanged. Instead, slice the block itself and compare
# its entry list exactly. `block_entries` keeps only lines that are a bare
# quoted entry with a trailing comma, so a comment line (`// 'auth',`) or any
# prose cannot stand in for a real entry.
block_entries() {
  # $1 — awk ERE matching the block's opening line. Entries are the lines
  # after it, up to (not including) the first line containing `]`.
  awk -v start="$1" '
    $0 ~ start { inblock = 1; next }
    inblock && /\]/ { exit }
    inblock { print }
  ' "$REVIEW_FIX_JS" |
    sed -n "s/^[[:space:]]*'\([a-z-][a-z-]*\)',[[:space:]]*$/\1/p" |
    paste -sd, -
}

# The Source enum: every finding source the schema admits, in file order.
assert_eq "Source enum membership is exact" \
  "code-review,input-validation,secrets,red-team,security-review,auth,data-exposure,firebase,codeql,npm,erosion,cost" \
  "$(block_entries '^ +Source: [{]')"

# SEC_SOURCES: the sources whose unclassified findings fall back to
# Out-of-scope rather than Deferred. All three folded domain-sweep sources
# ('secrets', 'auth', 'data-exposure') must stay members.
assert_eq "SEC_SOURCES membership is exact" \
  "input-validation,secrets,red-team,security-review,auth,data-exposure,firebase,codeql,npm" \
  "$(block_entries 'SEC_SOURCES = new Set')"

# The sweepDomains array literal — its behavior is already pinned by the probe
# assertions above; this pins the literal so the trigger asymmetry cannot be
# rewritten into an equivalent-looking but different expression unnoticed.
assert_eq "sweepDomains returns the three folded domains under app_or_rules" "1" \
  "$(grep -c "app_or_rules ? \['secrets', 'auth', 'data-exposure'\] : \['secrets'\]" "$REVIEW_FIX_JS" || true)"

report_results
