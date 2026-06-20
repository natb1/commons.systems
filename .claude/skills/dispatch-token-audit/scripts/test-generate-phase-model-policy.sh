#!/usr/bin/env bash
# Self-contained unit test for generate-phase-model-policy.sh (#2028).
#
# Builds small hand-computed usage-audit.json fixtures with `jq -n`, feeds each
# to the generator (SUT), and asserts on the emitted .routes / .rationale /
# .window / .generated_at. Also round-trips the output through
# dispatch-config-load phase-model-policy to prove the emitted JSON validates.
#
# Usage: bash test-generate-phase-model-policy.sh
# Exit 0 = all passed; non-zero = one or more failures.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd -P)"
SUT="$SCRIPT_DIR/generate-phase-model-policy.sh"
CONFIG_LOAD="$SCRIPT_DIR/../../dispatch-propagate/scripts/dispatch-config-load"

# --- test helpers -----------------------------------------------------------

source "$SCRIPT_DIR/../../dispatch-propagate/scripts/test-helpers.sh"

# --- fixtures ---------------------------------------------------------------

# A baseline window block reused across fixtures. files_scanned/files_failed are
# present so we can assert the SUT DROPS them from the emitted window subset.
WINDOW='{days:7,since:"2026-06-13",until:"2026-06-20",files_scanned:100,files_failed:0}'

# Healthy fixture: qa high hit-rate (keep-cheap), review low hit-rate (promote),
# both with enough samples. Also carries a BOGUS by_phase_outcome.implement with
# great numbers that the SUT must IGNORE (allowlist guard).
HEALTHY=$(jq -n "{
  window: $WINDOW,
  by_phase_outcome: {
    qa:        {sessions:24, hit_rate:0.62},
    review:    {sessions:30, hit_rate:0.18},
    implement: {sessions:999, hit_rate:0.99}
  },
  by_phase: {
    \"qa-fix\":     {cost_usd:1.23, price_proxy_usd:4.56},
    \"review-fix\": {cost_usd:2.10, price_proxy_usd:5.40}
  }
}")

# Under-sample fixture: qa below MIN_SAMPLE (omit), review null hit_rate (omit).
UNDERSAMPLE=$(jq -n "{
  window: $WINDOW,
  by_phase_outcome: {
    qa:     {sessions:10, hit_rate:0.62},
    review: {sessions:30, hit_rate:null}
  },
  by_phase: {
    \"qa-fix\":     {cost_usd:1.23, price_proxy_usd:4.56},
    \"review-fix\": {cost_usd:2.10, price_proxy_usd:5.40}
  }
}")

# Flip fixture: qa hit_rate 0.6 with 10 sessions. At defaults it is OMITTED
# (10 < 20). With MIN_SAMPLE=5 it routes; with HIT_RATE_FLOOR=0.9 it flips from
# keep-cheap to promote.
FLIP=$(jq -n "{
  window: $WINDOW,
  by_phase_outcome: {
    qa:     {sessions:10, hit_rate:0.6},
    review: {sessions:30, hit_rate:0.18}
  },
  by_phase: {
    \"qa-fix\":     {cost_usd:1.23, price_proxy_usd:4.56},
    \"review-fix\": {cost_usd:2.10, price_proxy_usd:5.40}
  }
}")

# --- tests ------------------------------------------------------------------

echo "=== healthy: keep-cheap / promote routing ==="
HEALTHY_OUT=$(printf '%s' "$HEALTHY" | "$SUT")
assert_eq "healthy: routes.qa == claude-sonnet-4-6 (keep-cheap)" \
  "claude-sonnet-4-6" "$(jq -r '.routes.qa' <<<"$HEALTHY_OUT")"
assert_eq "healthy: rationale.qa.decision == keep-cheap" \
  "keep-cheap" "$(jq -r '.rationale.qa.decision' <<<"$HEALTHY_OUT")"
assert_eq "healthy: routes.review == claude-opus-4-8 (promote)" \
  "claude-opus-4-8" "$(jq -r '.routes.review' <<<"$HEALTHY_OUT")"
assert_eq "healthy: rationale.review.decision == promote" \
  "promote" "$(jq -r '.rationale.review.decision' <<<"$HEALTHY_OUT")"
# cost join surfaced into rationale
assert_eq "healthy: rationale.qa.cost_usd joined from by_phase[qa-fix]" \
  "1.23" "$(jq -r '.rationale.qa.cost_usd' <<<"$HEALTHY_OUT")"
assert_eq "healthy: rationale.review.price_proxy_usd joined from by_phase[review-fix]" \
  "5.40" "$(jq -r '.rationale.review.price_proxy_usd' <<<"$HEALTHY_OUT")"

echo "=== allowlist guard: never emits a non-{qa,review} route ==="
assert_eq "healthy: routes keys are subset of [qa,review]" \
  "true" "$(jq -c '(.routes | keys) - ["qa","review"] | length == 0' <<<"$HEALTHY_OUT")"
assert_eq "healthy: routes has no 'implement' key despite great input numbers" \
  "false" "$(jq -c '.routes | has("implement")' <<<"$HEALTHY_OUT")"
assert_eq "healthy: rationale has no 'implement' key" \
  "false" "$(jq -c '.rationale | has("implement")' <<<"$HEALTHY_OUT")"

echo "=== under-sample / null hit_rate: omitted from routes ==="
UNDER_OUT=$(printf '%s' "$UNDERSAMPLE" | "$SUT")
assert_eq "undersample: routes omits qa (sessions < MIN_SAMPLE)" \
  "false" "$(jq -c '.routes | has("qa")' <<<"$UNDER_OUT")"
assert_eq "undersample: rationale.qa.decision == insufficient-sample" \
  "insufficient-sample" "$(jq -r '.rationale.qa.decision' <<<"$UNDER_OUT")"
assert_eq "null hit_rate: routes omits review" \
  "false" "$(jq -c '.routes | has("review")' <<<"$UNDER_OUT")"
assert_eq "null hit_rate: rationale.review.decision == insufficient-sample" \
  "insufficient-sample" "$(jq -r '.rationale.review.decision' <<<"$UNDER_OUT")"
assert_eq "null hit_rate: rationale.review.hit_rate is null" \
  "null" "$(jq -c '.rationale.review.hit_rate' <<<"$UNDER_OUT")"

echo "=== env overrides: MIN_SAMPLE / HIT_RATE_FLOOR ==="
# MIN_SAMPLE=5 lets qa (sessions=10) route; at default 20 it was omitted.
FLIP_MINSAMPLE=$(MIN_SAMPLE=5 "$SUT" <<<"$FLIP")
assert_eq "MIN_SAMPLE=5: qa now routed (was omitted at default 20)" \
  "true" "$(jq -c '.routes | has("qa")' <<<"$FLIP_MINSAMPLE")"
assert_eq "MIN_SAMPLE=5: qa hit_rate 0.6 >= default floor 0.5 -> keep-cheap" \
  "claude-sonnet-4-6" "$(jq -r '.routes.qa' <<<"$FLIP_MINSAMPLE")"
# HIT_RATE_FLOOR=0.9 (with MIN_SAMPLE=5 to admit qa) flips qa from keep-cheap to promote.
FLIP_FLOOR=$(MIN_SAMPLE=5 HIT_RATE_FLOOR=0.9 "$SUT" <<<"$FLIP")
assert_eq "HIT_RATE_FLOOR=0.9: qa hit_rate 0.6 < 0.9 -> promote" \
  "claude-opus-4-8" "$(jq -r '.routes.qa' <<<"$FLIP_FLOOR")"
assert_eq "HIT_RATE_FLOOR=0.9: rationale.qa.decision == promote" \
  "promote" "$(jq -r '.rationale.qa.decision' <<<"$FLIP_FLOOR")"

echo "=== determinism: generated_at / window subset ==="
assert_eq "generated_at == window.until" \
  "2026-06-20" "$(jq -r '.generated_at' <<<"$HEALTHY_OUT")"
assert_eq "window carries days/since/until only (DROPS files_scanned)" \
  '["days","since","until"]' "$(jq -c '.window | keys' <<<"$HEALTHY_OUT")"
assert_eq "window.until == 2026-06-20" \
  "2026-06-20" "$(jq -r '.window.until' <<<"$HEALTHY_OUT")"

echo "=== round-trip: emitted JSON passes dispatch-config-load ==="
RT_DIR=$(mktemp -d)
printf '%s' "$HEALTHY_OUT" > "$RT_DIR/phase-model-policy.json"
if DISPATCH_CONFIG_DIR="$RT_DIR" "$CONFIG_LOAD" phase-model-policy >/dev/null 2>"$RT_DIR/err.txt"; then
  rt_rc=0
else
  rt_rc=$?
fi
assert_eq "round-trip: dispatch-config-load phase-model-policy exits 0 (populated routes)" \
  "0" "$rt_rc"
if [[ "$rt_rc" != 0 ]]; then
  echo "    config-load stderr:"; sed 's/^/      /' "$RT_DIR/err.txt"
fi
rm -rf "$RT_DIR"

report_results
exit "$FAIL"
