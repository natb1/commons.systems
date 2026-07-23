---
id: tactic-qa-fix-instrument-signoff-classify
kind: tactic
statement: Narrow qa-fix's classify prompt so a heuristic/threshold sign-off on
  a non-user-facing measurement/audit instrument lands in already-satisfied
  instead of opus-fixable, stopping the non-self-terminating office-hours
  re-park loop at the source
owner: ai
status: codified
parent: null
rationale: "The minimal loop-stop half of the office-hours authorization of
  2026-07-18 (drain of tactic-phase-standup-audit-lens). Its sibling
  tactic-qa-fix-instrument-signoff-authority records the fuller design
  (skeptic-unanimity gate) and states in its Reuse section that this minimal
  clause 'already' landed separately -- it did not: the work sits on an unmerged
  draft PR (#2910, branch qa-fix-instrument-signoff-classify, opened 2026-07-19)
  that was never tracked by any node, so it was on neither the dispatch nor the
  office-hours queue and nothing could pick it up. This node is the missing
  tracker, minted by the 2026-07-23 orphaned-PR queue audit. The code is written
  and CI is green; the node enters at phase review."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: review
execution:
  branch: qa-fix-instrument-signoff-classify
  pr: 2910
  attempts: {}
  markers:
    - reviewed
  strategy_fingerprint:
    strategy-graph-native-dispatch:
      hash: 12096ac54d28f3664510e51a8017c4c5f2b9003bfd166c57a49574b0ad2cf025
      sha: ca7af4054716dc3353a369cae8893fe1275fb1e6
  fix: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Classify an instrument sign-off as already-satisfied, not opus-fixable

## Context

`.claude/workflows/qa-fix.js` triages every QA residue item on a four-class
axis — `opus-fixable` / `needs-main` / `needs-human` / `already-satisfied`
(classify prompt, `.claude/workflows/qa-fix.js:275-320`). `already-satisfied`
is dropped as PASS: "no code change and no human needed, only a positive
confirmation."

A heuristic/threshold **sign-off** on a non-user-facing measurement or audit
instrument — "is this substring list / this proxy-metric definition
acceptable?" — is exactly that shape. But the classify agent tags it
`opus-fixable`, so it reaches the `fix-plan` phase, whose `SCOPE-DEVIATION
ESCAPE` (`.claude/workflows/qa-fix.js:530-537`) sets `deviation: true` for
anything that would "require a decision the issue does not authorize."
Signing off on a heuristic design is such a decision, so the planner deviates
and the node parks to office-hours. The artifact never changes, so the next
qa-fix pass re-classifies, re-deviates, and re-parks. The loop does not
self-terminate — observed twice on `tactic-phase-standup-audit-lens` (PR
#2880).

Author-authorized at office-hours on 2026-07-18 during that drain. Two halves
were authorized: this minimal classify-prompt clause (the fast loop-stop) and
the fuller skeptic-unanimity gate, recorded separately as
`tactic-qa-fix-instrument-signoff-authority`.

## Scope

In scope — one file, one prompt-string change:

- `.claude/workflows/qa-fix.js`, the `already-satisfied` bullet of the
  `classifyPrompt` four-way axis (around line 295 on `origin/main`
  @ `5243efaf`): add an INSTRUMENT SIGN-OFF clause stating that a
  heuristic/threshold sign-off on a non-user-facing measurement or audit
  instrument (a `/dispatch-token-audit` lens, a sensor, an aggregator metric),
  sound on its face with no code defect to fix, is `already-satisfied` and not
  `opus-fixable`. The clause is explicitly narrowed to internal, revisable
  measurement/audit artifacts; a user-facing or irreversible design sign-off
  stays `needs-human`.

Out of scope:

- The disposition contract itself, the `verify` skeptic fan-out, the
  `fix-plan` `SCOPE-DEVIATION ESCAPE`, and `.claude/skills/qa-fix/SKILL.md`
  Steps 3.5 / 3.7 — all unchanged. This is prompt content within the existing
  four-class axis.
- The skeptic-unanimity gate — that is
  `tactic-qa-fix-instrument-signoff-authority`'s scope, not this node's.

## Dependencies

None. This node is deliberately independent of
`tactic-qa-fix-instrument-signoff-authority`: the minimal clause stops the
loop now, and the fuller gate is layered on top later.

## Reuse

- `.claude/workflows/qa-fix.js` — the existing `already-satisfied` class and
  its drop-as-PASS partition (`applyVerifyDrop`, around lines 190-197 and
  225-227). No new class, no new branch; only the classify prompt's
  description of an existing class is narrowed.
- `.claude/workflows/qa-fix.js:530-537` — the `SCOPE-DEVIATION ESCAPE` that
  the mis-classification was reaching; left untouched so genuine out-of-scope
  code changes still deviate.

## State

The change is implemented and pushed on branch
`qa-fix-instrument-signoff-classify` as draft PR #2910 (opened 2026-07-19, one
file changed, no failing checks). `qa-fix.js` has not been modified on
`origin/main` since the branch point (last change `6fd2f6ce`, 2026-06-19), so
the diff still applies. The node enters at phase `review`; the remaining work
is the review pass, QA, and merge.

## Verification

The change is prompt content, so there is no unit test that asserts the clause
text. Verify instead that the surrounding partition logic is unbroken and the
workflow still parses:

```verify
npx vitest run --project packages/intentionsutil --root .
```

Behavioral verification is observational: after merge, a qa-fix pass over a
residue item that is a heuristic sign-off on an internal instrument should
classify `already-satisfied` and drop as PASS rather than reaching the
fix-planner and parking the node to office-hours. The concrete regression to
watch is that no node re-parks with the same deviation reason on consecutive
qa-fix passes with an unchanged artifact.
