---
id: tactic-fleet-watch-alarm-noop-overhead
kind: tactic
statement: predicate 5's clear verdict always execs dispatch-fleet-alarm to
  resolve the unclaimed-hold alarm kind, even in the steady all-clear state,
  spawning a second per-pass Node cold start just to discover there is nothing
  to resolve
owner: ai
status: raw
parent: null
rationale: "Deferred cost finding from the /review-fix pass on PR #3036
  (tactic-unclaimed-hold-alerting), source lens \"cost\", ADVISORY — not
  adversarially verified (cost findings route straight to Deferred per
  review-fix's disposition table). Location:
  .claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:798. A clear
  verdict routes to resolve_alarm (dispatch-fleet-watch:722-728), which always
  execs the alarm script; the alarm script's classify
  (dispatch-fleet-alarm:316-330) spawns its own node --import tsx/esm just to
  discover there is no open tactic-fleet-alarm-unclaimed-hold node to resolve,
  then prints noop. That is a second Node cold start per pass on top of the
  enumerator's own (see tactic-fleet-watch-predicate5-cold-start) — about 288
  additional no-op Node startups/day — and it lengthens the window the alarm
  script's flock mutex is held on each pass. Recommended fix (from the finder,
  not verified): short-circuit resolve_alarm before spawning the alarm script
  when there is provably nothing open (e.g. skip when
  intentions/tactic-fleet-alarm-<kind>.md is absent from the checkout), or batch
  the five per-kind classify reads into a single Node invocation per pass
  instead of one process per kind. Source PR: #3036."
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
# predicate 5's clear verdict always execs dispatch-fleet-alarm to resolve the unclaimed-hold alarm kind, even in the steady all-clear state, spawning a second per-pass Node cold start just to discover there is nothing to resolve

## Provenance

Deferred **cost** finding (ADVISORY, not adversarially verified — cost findings
route straight to Deferred per `/review-fix`'s disposition table) from the
`/review-fix` pass on `tactic-unclaimed-hold-alerting`, source PR #3036.

- **Location:** `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch:798`
- **Failure scenario:** a `clear` verdict routes to `resolve_alarm`
  (`dispatch-fleet-watch:722-728`), which always execs the alarm script; the
  alarm script's `classify` (`dispatch-fleet-alarm:316-330`) spawns its own
  `node --import tsx/esm` just to discover there is no open
  `tactic-fleet-alarm-unclaimed-hold` node to resolve, then prints `noop`.
  That is a second Node cold start per pass on top of the enumerator's own
  (see [[tactic-fleet-watch-predicate5-cold-start]]) — about 288 additional
  no-op Node startups/day — and it lengthens the window the alarm script's
  `flock` mutex is held on each pass.
- **Adversarial verdict:** none — cost findings are advisory by design and were
  not routed through the verify/skeptic stage.
- **Recommended fix (from the finder, unverified):** short-circuit
  `resolve_alarm` before spawning the alarm script when there is provably
  nothing open (e.g. skip when `intentions/tactic-fleet-alarm-<kind>.md` is
  absent from the checkout), or batch the five per-kind `classify` reads into
  a single Node invocation per pass instead of one process per kind.
