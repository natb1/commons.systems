---
id: tactic-main-health-sensor-test
kind: tactic
statement: Add unit test coverage for the main-health sensor's read() branches
owner: ai
status: raw
parent: null
rationale: "Retained review residue from PR #2919 (tactic-graph-main-self-heal):
  the new mainHealthSensor added to read-sensors.ts has no per-sensor test,
  unlike token-economy/lifecycle/intention-store sensors which each have a
  dedicated *-sensor.test.ts. The plan's own verification section deferred this
  to manual/observed checks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Add unit test coverage for the main-health sensor's read() branches

Deferred from the `/review-fix` pass on PR #2919 (`tactic-graph-main-self-heal`),
review disposition `Deferred` (code-review residue).

**Location:** `packages/intentionsutil/scripts/read-sensors.ts:152` (the
`mainHealthSensor`, registered in `buildDefaultRegistry`).

**Failure scenario:** the new `mainHealthSensor` has no dedicated test, unlike
every other concrete sensor in this file (token-economy, lifecycle,
intention-store each have a `*-sensor.test.ts`). Its three `read()` branches
are unexercised: empty `repo-health` stdout → the exact green threshold string
(which MUST match `strategy-main-health`'s `success_signal.threshold` verbatim
for `deriveGap` to ever see green), non-empty stdout → `"red: <sha> ..."`, and
a non-zero `repo-health` exit → `"unknown"` fail-safe (keeps the gap
non-null). A silent drift in any of these three strings or branches would
break the main-health signal without any test catching it.

**Adversarial verdict:** not independently verified (this is code-review
residue, already confirmed by `/code-review`'s own internal review pass —
per the review-fix disposition table, Lane-A findings are not re-run through
the shared adversarial-verify step).

**Recommended fix:** extract a testable helper (e.g. `readMainHealth(binaryPath)`)
so the sensor's binary path is injectable, then stub a fake `repo-health` that
(a) prints nothing → assert the green threshold string, (b) prints a sha →
assert `"red: <sha> ..."`, (c) exits non-zero → assert `"unknown"` and that
`deriveGap` yields a non-null gap.

**Source PR:** #2919 (`tactic-graph-main-self-heal`).
