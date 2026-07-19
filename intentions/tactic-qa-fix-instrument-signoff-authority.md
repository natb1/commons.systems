---
id: tactic-qa-fix-instrument-signoff-authority
kind: tactic
statement: Authorize qa-fix's disposition pipeline to route a
  heuristic/threshold sign-off on a non-user-facing measurement/audit instrument
  to already-satisfied instead of a scope-deviation park, gated on unanimous
  adversarial-skeptic agreement that the sign-off is LLM-decidable
owner: ai
status: raw
parent: null
rationale: Systemic loop-fix authorized by the author at office-hours (drain of
  tactic-phase-standup-audit-lens, 2026-07-18). A positive-confirmation
  heuristic sign-off with no code defect (findings 10/11 there) is really
  already-satisfied, but the classify agent tagged it opus-fixable, so it
  reached the fix-planner, which raised deviation:true ('a decision the issue
  does not authorize') and parked to office-hours. Because the artifact is
  unchanged, every qa-fix pass re-classifies, re-deviates, and re-parks — the
  loop does not self-terminate. A minimal classify-prompt clause (its own PR)
  stops the mis-classification at the source; this node captures the fuller
  author-authorized design with the adversarial-skeptic-unanimity guardrail the
  office-hours recommendation named, so the affirmative verdict is only rendered
  under a checkable safety gate.
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

# Authorize a gated affirmative sign-off in qa-fix's disposition pipeline

## Context

The qa-fix disposition pipeline (`.claude/workflows/qa-fix.js`) triages each QA
residue item on a four-class axis: `opus-fixable` / `needs-main` / `needs-human`
/ `already-satisfied`. The `already-satisfied` class is *dropped as PASS* — "no
code change and no human needed, only a positive confirmation."

A heuristic/threshold **sign-off** on a non-user-facing measurement or audit
instrument — "is this substring list / this proxy-metric definition acceptable?"
— is exactly a positive-confirmation item: sound on its face, no code defect to
fix. But the classify agent tends to tag it `opus-fixable`, so it flows to the
`fix-plan` phase, whose `SCOPE-DEVIATION ESCAPE` (qa-fix.js ~lines 530-539) sets
`deviation: true` for anything that would "require a decision the issue does not
authorize." Signing off on a heuristic design is such a decision, so the planner
deviates → the node parks to office-hours. Because the artifact never changes,
the next qa-fix pass repeats the whole chain and re-parks. The loop does not
self-terminate (observed twice on `tactic-phase-standup-audit-lens`, PR #2880).

Author authorization for the affirmative verdict on this class was granted at
office-hours on 2026-07-18 (drain of `tactic-phase-standup-audit-lens`). This
node captures the fuller design; a minimal classify-prompt clause landed
separately as the fast loop-stop (see Reuse).

## The greenfield design

Grant the disposition pipeline authority to render the *affirmative* engineering
verdict on a heuristic/threshold sign-off item — classifying it
`already-satisfied` (drop-as-PASS) rather than letting it reach the fix-planner
and deviate — **only** under a checkable safety gate, both conditions required:

1. **Non-user-facing measurement/audit instrument.** The artifact under review
   is an internal measurement/audit instrument (e.g. a `/dispatch-token-audit`
   lens, a sensor, an aggregator metric), not user-facing behavior and not an
   irreversible design decision. A slightly mis-calibrated metric's failure mode
   is "a downstream measurement is imprecise," revisable later — not a
   production defect.

2. **Unanimous adversarial-skeptic agreement.** The item is routed through the
   existing skeptic fan-out (the `verify` phase, today reserved for
   `needs-human` candidates) and *every* skeptic upholds it as LLM-decidable.
   Any refutal drops the item back to the human lane (office-hours), never the
   affirmative verdict.

The guardrail is what separates this from "the agent signs off on whatever it
wants": the affirmative verdict fires only when an independent adversarial panel
unanimously agrees the sign-off is within LLM competence AND the blast radius is
a non-user-facing instrument.

## Scope of the change

- Route sign-off-shaped `opus-fixable`-or-`already-satisfied`-candidate items on
  measurement/audit instruments through the skeptic fan-out (the `verify` phase
  currently only fans out `needs-human` candidates) so a skeptic-unanimity
  signal exists for them.
- Add the gate: unanimous uphold + instrument-scope ⇒ `already-satisfied`
  (drop-as-PASS); any refutal ⇒ `needs-human` (office-hours). Keep the gate
  narrow so it cannot leak into user-facing or irreversible design decisions.
- Preserve the fix-planner `SCOPE-DEVIATION ESCAPE` unchanged for every item
  that is a genuine out-of-scope code change.

## Reuse

- `.claude/workflows/qa-fix.js` — the classify agent (four-way axis), the
  `verify` skeptic fan-out (INVERTED-polarity Sonnet skeptics), and the
  `fix-plan` `SCOPE-DEVIATION ESCAPE`. The minimal loop-stop already narrows the
  classify prompt so a no-code-defect instrument sign-off is `already-satisfied`
  rather than `opus-fixable`; this node's fuller design adds the explicit
  skeptic-unanimity gate on top.
- `.claude/skills/qa-fix/SKILL.md` — Step 3.5 (disposition Workflow contract),
  Step 3.7 (deviation branch). Keep the SKILL description in sync if the class
  routing changes.

## Verification

Unit-test the gate over the qa-fix workflow's disposition logic: an
instrument-scoped sign-off with all-uphold skeptic votes ⇒ `already-satisfied`;
the same item with one refutal ⇒ `needs-human`; a genuine out-of-scope code
change ⇒ still `deviation`. A user-facing item never reaches the affirmative
verdict regardless of skeptic votes.

```verify
npx vitest run --project packages/intentionsutil --root .
```

(Plan the concrete unit-test target during `/align-tactics`; the workflow is JS,
so the gate logic should be extracted to a pure, testable helper.)
