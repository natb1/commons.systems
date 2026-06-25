#!/usr/bin/env bash
# Phase-model routing policy generator for the /dispatch-token-audit skill (#2028).
#
# This is the PRODUCER half of the audit-time routing loop. It consumes the one
# structured aggregate document emitted by aggregate-usage.sh (tmp/usage-audit.json)
# and emits the phase-model-policy.json artifact that `dispatch-phase-model` reads
# at tick time. The audit measures per-phase hit-rate + cost; this script turns
# that measurement into a model-routing decision, closing the loop without a human
# in between.
#
# WHAT IT READS (slices of the aggregate doc — see aggregate-usage.sh for the full
# schema)
#   .window               { days, since, until, files_scanned, files_failed }
#   .by_phase_outcome[ph] keyed by the OUTCOME ENUM ("qa", "review" only). Carries
#                         .sessions (int) and pooled .hit_rate (number, or null
#                         when its denominator is 0).
#   .by_phase[ph + "-fix"] keyed by the ATTRIBUTION SKILL ("qa-fix", "review-fix").
#                         Carries .cost_usd and .price_proxy_usd.
#
# THE COST ↔ OUTCOME JOIN
#   The two namespaces differ. Hit-rate lives under the outcome enum (`qa`,
#   `review`); cost lives under the attribution skill (`qa-fix`, `review-fix`).
#   This script JOINS them: outcome `qa` ↔ cost `qa-fix`, outcome `review` ↔ cost
#   `review-fix`. The only phases with hit-rate data — and the only phases worth
#   routing — are `qa` and `review`.
#
# DEMOTABLE ALLOWLIST (the structural AC#4 guarantee)
#   The decision loop iterates ONLY over ["qa","review"]. A route is NEVER emitted
#   for any phase outside that set, even if the input carries great numbers for some
#   other phase (e.g. a bogus `by_phase_outcome.implement`). This mirrors the
#   consumer's fail-closed allowlist in `dispatch-phase-model`: defense-in-depth so
#   a code-authoring phase can never be demoted to a cheaper model.
#
# DECISION LOGIC (per phase $ph in {qa, review})
#   sessions < MIN_SAMPLE  OR  hit_rate == null  → OMIT from routes (decision
#                                                   "insufficient-sample"; the
#                                                   rationale records why so a
#                                                   human can see it).
#   hit_rate >= HIT_RATE_FLOOR                    → routes[ph]="claude-sonnet-4-6"
#                                                   (decision "keep-cheap").
#   hit_rate <  HIT_RATE_FLOOR                    → routes[ph]="claude-opus-4-8"
#                                                   (decision "promote").
#   Every evaluated phase (routed AND omitted) gets a rationale entry carrying
#   {decision, sessions, hit_rate, cost_usd, price_proxy_usd}.
#
# CONSTANTS / ENV SEAMS
#   MIN_SAMPLE      (default 20) minimum sessions before a phase is routed.
#   HIT_RATE_FLOOR  (default 0.5) pooled hit-rate at/above which a phase stays on
#                   the cheap model; below it the phase is promoted to Opus.
#   Both are ENV-OVERRIDABLE test seams and are passed into jq as NUMBERS via
#   --argjson, never strings.
#
# DAY-ONE DEFAULT BEHAVIOR
#   With healthy data, both qa and review have hit_rate >= floor, so both route to
#   Sonnet ("claude-sonnet-4-6") — exactly the current hardcoded default map in
#   `dispatch-phase-model`. So writing this artifact by default changes NOTHING
#   until evidence (a low pooled hit-rate with enough samples) accumulates and
#   flips a phase to "promote". Until then the policy is a no-op echo of defaults.
#
# PURE-FUNCTION / NO-CLOCK DISCIPLINE
#   This script is a PURE, DETERMINISTIC function of its input. It makes NO clock
#   call: `generated_at` and the emitted `window` are derived from the input's
#   `.window` (generated_at = window.until). The same input always yields the same
#   output — which is what makes the test fixtures reproducible.
#
# USAGE
#   generate-phase-model-policy.sh [PATH]   PATH to the aggregate doc, or stdin
#                                           when no arg is given.
#   Output: the policy JSON (phase-model-policy schema) to stdout. The output is
#   guaranteed to pass `dispatch-config-load phase-model-policy`.
set -euo pipefail

SRC="${1:-/dev/stdin}"
MIN_SAMPLE="${MIN_SAMPLE:-20}"
HIT_RATE_FLOOR="${HIT_RATE_FLOOR:-0.5}"

jq -n \
  --argjson min_sample "$MIN_SAMPLE" \
  --argjson floor "$HIT_RATE_FLOOR" \
  --slurpfile doc "$SRC" \
  '
  $doc[0] as $d
  | ($d.window) as $w
  | reduce ["qa","review"][] as $ph ({routes:{}, rationale:{}};
      ($d.by_phase_outcome[$ph]) as $oc
      | ($oc.sessions // 0) as $sessions
      | ($oc.hit_rate) as $hr
      | ($d.by_phase[$ph + "-fix"]) as $cost
      | (if $cost == null then null else $cost.cost_usd end) as $cu
      | (if $cost == null then null else $cost.price_proxy_usd end) as $pp
      | if ($sessions < $min_sample) or ($hr == null) then
          .rationale[$ph] = {decision:"insufficient-sample", sessions:$sessions, hit_rate:$hr, cost_usd:$cu, price_proxy_usd:$pp}
        elif ($hr >= $floor) then
          .routes[$ph] = "claude-sonnet-4-6"
          | .rationale[$ph] = {decision:"keep-cheap", sessions:$sessions, hit_rate:$hr, cost_usd:$cu, price_proxy_usd:$pp}
        else
          .routes[$ph] = "claude-opus-4-8"
          | .rationale[$ph] = {decision:"promote", sessions:$sessions, hit_rate:$hr, cost_usd:$cu, price_proxy_usd:$pp}
        end
    )
  | {schema_version: 1, generated_at: ($w.until), window: {days: $w.days, since: $w.since, until: $w.until}, routes: .routes, rationale: .rationale}
  '
