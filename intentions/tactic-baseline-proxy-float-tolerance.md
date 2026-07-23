---
id: tactic-baseline-proxy-float-tolerance
kind: tactic
statement: Loosen baseline_context.total_proxy_usd's exact-float-string
  assertion to a tolerance comparison
owner: ai
status: codified
parent: null
rationale: "test-aggregate-usage.sh:505-506 asserts
  lenses.baseline_context.total_proxy_usd via exact string equality between two
  independently-computed jq float sums. Floating-point addition isn't
  associative — EXPECTED_BASELINE_PROXY (line 297) sums four already-divided
  terms left-to-right via jq -n, while aggregate-usage.sh's own computation
  (lines 836-840) maps each row and sums via jq's add — so the two produce
  bit-distinct doubles for the same mathematical value. jq's float-to-string
  formatting (which differs by jq version) renders one as a clean decimal and
  the other with float noise, so the assertion passes on some jq versions (local
  jq-1.8.1: clean) and fails on others (CI's ubuntu-latest preinstalled jq:
  '0.05307749999999999' vs '0.0530775'), independent of any code correctness.
  First surfaced blocking PR #2880 (tactic-phase-standup-audit-lens), which
  correctly classified it as a pre-existing flake unrelated to that PR's own
  changes and parked pending this fix. Filed via /align-strategy 2026-07-16
  interview as the concrete instance of the graph-native flake-tracking-parity
  design (see strategy-graph-native-dispatch)."
reading: null
gap: null
serves:
  - strategy-token-economy
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Loosen baseline_context.total_proxy_usd's exact-float-string assertion to a tolerance comparison

## Context

`.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:505-506`
asserts `lenses.baseline_context.total_proxy_usd` via **exact string equality**
between two independently-computed `jq` float sums:

```bash
assert_eq "lenses.baseline_context.total_proxy_usd" "$EXPECTED_BASELINE_PROXY" \
  "$(jq '.lenses.baseline_context.total_proxy_usd' <<<"$OUT")"
```

`EXPECTED_BASELINE_PROXY` (line 297) is computed as:

```bash
EXPECTED_BASELINE_PROXY=$(jq -n '(1000*15 + 2000*18.75)/1e6 + (10*15 + 20*18.75)/1e6 + (0*15 + 0*18.75)/1e6 + (1*15 + 2*18.75)/1e6')
```

— summing four already-divided terms left-to-right. The implementation
(`aggregate-usage.sh:836-840`) instead maps each row to
`(init_input * RATE_INPUT + init_cache_creation * RATE_CACHE_CREATION) / 1e6`
and sums the list via `jq`'s `add`. Both expressions are mathematically equal
(0.0530775) but floating-point addition is not associative, so the two
summation orders produce bit-distinct IEEE 754 doubles for the same
value. `jq`'s number-to-string formatting — which differs across `jq` major
versions — renders one as a clean decimal and the other with trailing float
noise. Confirmed live on PR #2880: local `jq-1.8.1` renders both sides as
`0.0530775` (test passes, 182/182), while CI's `ubuntu-latest` runner's
preinstalled `jq` renders them as `'0.0530775'` (actual) vs
`'0.05307749999999999'` (expected) — a genuine environment-dependent flake,
unrelated to any code correctness, that will keep failing CI on that runner's
`jq` version regardless of retries.

## Unit 1 — tolerance-based comparison for `total_proxy_usd`

**Recommended model:** sonnet

This is a narrow, mechanical test-precision fix with a clear, already-diagnosed
root cause — no design judgment required.

Scope:
- `.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh:505-506`
  — replace the exact-string `assert_eq` for
  `lenses.baseline_context.total_proxy_usd` with a tolerance-based comparison
  (e.g. `jq -n --argjson a "$EXPECTED_BASELINE_PROXY" --argjson b "$actual"
  '($a - $b | fabs) < 1e-9'`, or add a small `assert_float_eq` helper next to
  the existing `assert_eq` if the test harness has room for a reusable
  primitive — check whether other float-valued lenses in the same file already
  have this problem latently and would benefit from the same helper, but do
  not go looking for unrelated assertions to convert; fix only what is
  provably non-deterministic).
- Do **not** touch `aggregate-usage.sh`'s actual computation — the
  implementation is correct; only the test's comparison is too strict for
  cross-`jq`-version float formatting.
- Out of scope: any other lens or assertion in the file not affected by this
  float-formatting non-determinism.

Dependencies: none.

Reuse:
- The existing `assert_eq` helper in `test-aggregate-usage.sh` — extend or
  sit alongside it, do not duplicate its scaffolding (fixture setup, `$OUT`
  capture) wholesale.

## Verification

```verify
.claude/skills/dispatch-token-audit/scripts/test-aggregate-usage.sh
```

Manual: confirm the suite is 182/182 both locally and (via a fresh PR's CI run,
or by installing an older `jq` locally if convenient) under a `jq` version that
previously produced the diverging float string — the fix must hold across `jq`
versions, not just the version happening to be installed locally.
