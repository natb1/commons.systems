#!/usr/bin/env bash
# Tests for the /review-plan gate (reviewPlanEffort, reviewPlanFinderSet,
# reviewPlanDeadline, REVIEW_PLAN_BAND, REVIEW_PLAN_DEADLINES, sliced out of
# .claude/workflows/review-fix.js by review-fix-review-plan-probe.mjs) --
# modeled directly on test-review-fix-domain-sweep.sh
# (tactic-review-plan-preflight-skill).
set -euo pipefail

FIXTURE_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=dispatch-test-fixture.sh
source "$FIXTURE_DIR/dispatch-test-fixture.sh"

# ============================================================================
# === review-fix /review-plan gate (tactic-review-plan-preflight-skill) ===
# ============================================================================
# CI vector: run-unit-tests.sh has no mapping for .claude/workflows/*, so a PR
# touching only review-fix.js triggers no vitest suite. The hook-tests job in
# .github/workflows/unit-tests.yml runs THIS script unconditionally on every
# PR, so the gate's coverage must live here.
#
# What this suite exists to protect: the /review-plan pre-pass hands
# /review-fix a verdict that lowers review depth and shapes the finder roster.
# Every rule that keeps that from becoming a silent detection cut is enforced
# in the sliced region, and every one of them is a rule a later editor could
# delete without any other test noticing.

echo "Test: review-fix /review-plan gate"

out=$(node "$SCRIPT_DIR/review-fix-review-plan-probe.mjs")
f() { printf '%s' "$out" | jq -r "$1"; }
fc() { printf '%s' "$out" | jq -c "$1"; }

# --- the author-set band -----------------------------------------------------
# The band is an AUTHOR ruling and this code may not re-open it. `low` … `max`,
# default `high`. dispatch-code-review also accepts `ultra`; the band stops at
# `max`.
assert_eq "band is low..max, and stops short of ultra" '["low","medium","high","xhigh","max"]' "$(fc '.band')"
assert_eq "default effort is high" "high" "$(f '.default_effort')"

# --- FAIL-OPEN (governing rule 1) --------------------------------------------
# Error, timeout, absent or unparseable verdict runs TODAY'S defaults: effort
# `high`, FULL roster. Never cheaper, never narrower. This is a condition on the
# strategy, not a preference — and a fail-open bug here would present as a clean
# review, which is why it is the first thing this suite asserts.
assert_eq "absent verdict → high" "high" "$(f '.effort_undefined.effort')"
assert_eq "absent verdict → reason says fail-open" "fail-open: no usable /review-plan verdict" "$(f '.effort_undefined.reason')"
assert_eq "null verdict → high" "high" "$(f '.effort_null.effort')"
assert_eq "verdict that is a bare string → high" "high" "$(f '.effort_string.effort')"
assert_eq "verdict that is an array → high" "high" "$(f '.effort_array.effort')"
assert_eq "verdict with no effort field → high" "high" "$(f '.effort_empty_object.effort')"

assert_eq "absent verdict → FULL roster" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_fail_open.set')"
assert_eq "verdict with no finder_set → FULL roster" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_no_finder_set.set')"

# --- band violations are REJECTED, not clamped -------------------------------
# Clamping would turn a malformed or injected verdict into a valid-looking one.
# `ultra` is the sharp case: dispatch-code-review accepts it, so a clamp would
# read as merely "capping at max" rather than as the rejection it must be.
assert_eq "ultra → rejected to the default, not clamped to max" "high" "$(f '.effort_ultra.effort')"
assert_eq "ultra → reason names the rejection" "true" \
  "$(printf '%s' "$out" | jq '.effort_ultra.reason | test("rejected, not clamped")')"
assert_eq "unknown level → rejected to the default" "high" "$(f '.effort_bogus.effort')"

# --- THE IRREVERSIBILITY FLOOR (analysis 3) ----------------------------------
# A HARD xhigh floor that overrides EVERY cheapening signal. This row is the
# one the plan calls out by name: a unanimous cheapen, with no raise signal at
# all, must still lose to it.
assert_eq "irreversible + unanimous cheapen → xhigh floor wins" "xhigh" "$(f '.effort_irreversible_cheapen.effort')"
assert_eq "irreversible floor → reason records the override" "true" \
  "$(printf '%s' "$out" | jq '.effort_irreversible_cheapen.reason | test("overrides every cheapening signal")')"
assert_eq "irreversible at xhigh → left alone" "xhigh" "$(f '.effort_irreversible_at_xhigh.effort')"
assert_eq "irreversible above the floor → not lowered TO the floor" "max" "$(f '.effort_irreversible_already_max.effort')"

# --- ASYMMETRY (governing rule 3) --------------------------------------------
# Raising is ANY-OF; cheapening requires ALL signals to agree. Unanimous to go
# cheap, one hit to go deep.
assert_eq "one raise signal blocks a cheapen" "high" "$(f '.effort_cheapen_blocked_by_raise.effort')"
assert_eq "blocked cheapen → reason names the raise signal" "true" \
  "$(printf '%s' "$out" | jq '.effort_cheapen_blocked_by_raise.reason | test("contract-delta")')"
assert_eq "cheapen naming no signals is refused" "high" "$(f '.effort_cheapen_no_signals.effort')"
assert_eq "unanimous cheapen with no raise → honoured" "low" "$(f '.effort_low_ok.effort')"
# The asymmetry's other half: going DEEP needs no permission at all.
assert_eq "raise with no signals named → still honoured (any-of)" "xhigh" "$(f '.effort_raise_no_signals.effort')"
assert_eq "explicit high → retained as the default" "high" "$(f '.effort_high_noop.effort')"

# --- RECORDED (governing rule 4) ---------------------------------------------
# Effort and rationale are written out. With both tactics landing in one PR at
# author direction (overriding clarification 54's sequencing), the delta-only
# baseline was never measured — so these reason strings are the ONLY thing
# keeping the two savings distinguishable. A gate that returned a bare level
# would silently destroy that.
assert_eq "every effort verdict carries a non-empty reason" "true" \
  "$(printf '%s' "$out" | jq '[.effort_undefined,.effort_ultra,.effort_low_ok,.effort_max,.effort_irreversible_cheapen,.effort_cheapen_blocked_by_raise] | all(.reason | type == "string" and length > 0)')"
assert_eq "every finder verdict carries a non-empty reason" "true" \
  "$(printf '%s' "$out" | jq '[.finders_fail_open,.finders_widen,.finders_removal_refused] | all(.reason | type == "string" and length > 0)')"

# --- GATING AUTHORITY IS SEMANTIC TRIGGERS ONLY ------------------------------
# The gate may ADD lenses. It may NEVER remove one — clarification 18 retained
# `api-cost` at a MEASURED ZERO finding rate and widened its trigger instead.
# Enforced as a union, because once a removal reaches the roster it is
# indistinguishable from a removal for cost.
assert_eq "verdict may widen the roster with a KNOWN finder" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_widen.set')"
assert_eq "verdict omitting floor lenses does NOT remove them" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_removal_refused.set')"
assert_eq "removal attempt is RECORDED, not silent" "true" \
  "$(printf '%s' "$out" | jq '.finders_removal_refused.reason | test("RETAINED anyway")')"
assert_eq "an empty finder_set removes nothing" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_empty_refused.set')"

# A non-code surface has an empty floor; the gate can still widen it, which is
# the permitted direction.
assert_eq "empty floor + widen → the added lens" '["red-team"]' "$(fc '.finders_empty_floor_widen.set')"
assert_eq "empty floor + no verdict → stays empty" '[]' "$(fc '.finders_empty_floor_fail_open.set')"

# Junk entries never reach a spawn loop.
assert_eq "junk finder_set entries are dropped and deduped" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_junk.set')"
assert_eq "a non-array base degrades to an empty floor, not a throw" '["red-team"]' \
  "$(fc '.finders_bad_base.set')"

# --- THE ALLOWLIST -----------------------------------------------------------
# The verdict is derived from text the diff under review can influence, and
# reviewPlanFinderSet is the one place in this region where it reaches a SPAWN
# LOOP. An unknown name is not inert: launchFinder -> finderPrompt falls through
# to `Domain: ${DOMAIN_PROMPTS[name]}`, so it launches a real Opus subagent whose
# entire brief reads "Domain: undefined", and tags its findings with that Source.
assert_eq "known-finder roster is exactly the agent finders" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.known_finders')"

# erosion / codeql / npm are PRESCANNED sources, not agent finders. Spawning one
# as an agent also collides with the real prescanned source in dedup and in
# per-lens accounting.
assert_eq "prescanned source names are rejected, not spawned" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_unknown_name.set')"
assert_eq "rejected names are RECORDED, not silently dropped" "true" \
  "$(printf '%s' "$out" | jq '.finders_unknown_name.reason | test("REJECTED")')"
assert_eq "rejection reason names the offending entries" "true" \
  "$(printf '%s' "$out" | jq '.finders_unknown_name.reason | test("erosion") and test("codeql") and test("npm")')"

# A prototype-shaped name reaches DOMAIN_PROMPTS[name] as an INHERITED function
# and stringifies into the prompt. The allowlist is what stops it.
assert_eq "prototype-shaped names are rejected" \
  '["input-validation","domain-sweep","red-team","security-review","api-cost"]' \
  "$(fc '.finders_proto_name.set')"

# --- DEADLINE SCALING --------------------------------------------------------
# Raising effort above `high` without also raising --deadline-seconds AND Step
# 1b's poll cap converts an expensive review into a TOTAL LOSS:
# dispatch-code-review KILLS a run past its deadline (:1225-1226) and
# `claude -p` buffers all output until completion, so a killed run yields ZERO
# bytes. The recorded `max` run burned 2363s and produced nothing. Without this
# table the upper half of the band is a trap.
assert_eq "high keeps today's 5400s deadline exactly" "5400" "$(f '.deadline_high.deadline_s')"
assert_eq "high keeps today's 10-attempt cap exactly" "10" "$(f '.deadline_high.poll_cap')"
assert_eq "await window is the script's 540s default" "540" "$(f '.await_s')"
assert_eq "xhigh scales the deadline up" "10800" "$(f '.deadline_xhigh.deadline_s')"
assert_eq "xhigh scales the cap up in step" "20" "$(f '.deadline_xhigh.poll_cap')"
assert_eq "max scales the deadline up" "16200" "$(f '.deadline_max.deadline_s')"
assert_eq "max scales the cap up in step" "30" "$(f '.deadline_max.poll_cap')"
assert_eq "low scales the deadline down" "2160" "$(f '.deadline_low.deadline_s')"
assert_eq "low scales the cap down in step" "4" "$(f '.deadline_low.poll_cap')"

# THE EQUALITY IS THE POINT. SKILL.md Step 1b's cap and the script's deadline
# must agree at EVERY level, not just at `high`: it is what makes the script's
# own exit-4 path reachable, and that path is the only thing that kills the
# detached run and releases the worktree flock. A cap short of the deadline
# strands a run holding the node lock with its finished review never collected.
assert_eq "poll_cap × await_s == deadline_s at every band level, integrally" "true" \
  "$(f '.deadline_equality_holds')"

# An out-of-band effort yields the `high` row rather than throwing — this is
# consumed on the fail-open path, where a throw would take the whole phase down
# over a depth SUGGESTION.
assert_eq "unknown effort → the high deadline row" "5400" "$(f '.deadline_bogus.deadline_s')"
assert_eq "undefined effort → the high deadline row" "5400" "$(f '.deadline_undefined.deadline_s')"

report_results
