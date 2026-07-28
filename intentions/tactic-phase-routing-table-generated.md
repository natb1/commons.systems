---
id: tactic-phase-routing-table-generated
kind: tactic
statement: Generate the phase-routing table in skill docs from forwardPhase
  between sentinels, with a CI drift check, so hand-written ladder prose cannot
  diverge from transitions.ts
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-27 /align-strategy round (strategy
  clarification on the routing-doctrine home). A qa to main-qa edge that
  forwardPhase never implemented was introduced to qa-fix prose 2026-07-11
  (ae63fb30, #2844) and survived 15 days, then acted as an attractor that turned
  a textual merge conflict into a semantic one. It has already regenerated in
  tactic-transition-node-stamp-landed-body's plan body (phase review, PR #2973)
  even though origin/main's qa-fix docs are now correct — evidence that
  correcting instances does not stop recurrence. Cheapest of the three
  structural fixes and independent of the other two. Awaiting an /align-tactics
  round to finalize."
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
# Generate the phase-routing table in skill docs from forwardPhase between sentinels, with a CI drift check, so hand-written ladder prose cannot diverge from transitions.ts

## Context — a phase edge that exists in no code

`forwardPhase` / `reconcileMergedPhase`
(`packages/intentionsutil/src/transitions.ts`) are the single code home of phase
routing. `forwardPhase("qa", hasResidue)` returns `"review"` **unconditionally**;
`main-qa` is reachable only via `review -> main-qa` when there is `needs-main`
residue, because `main-qa` is post-merge by definition.

A `qa -> main-qa` edge that has never existed in that code was introduced to
`/qa-fix` prose on 2026-07-11 (`ae63fb30`, #2844) and survived **15 days**. During
that window it acted as an *attractor*: two independent tactics wrote opposite
corrections to the same paragraph, which is what turned their merge conflict from
textual into semantic and produced the exit-11 deadlock of 2026-07-25/26.

Correcting the instances is demonstrably not enough. `qa-fix/SKILL.md` and its
references on `origin/main` are now correct — and the phantom has **already
regenerated**: [[tactic-transition-node-stamp-landed-body]] (phase `review`, PR
#2973) asserts in its plan body that a residue at `qa` routes `qa -> main-qa`, and
expects stdout `transitioned t-stamp qa -> main-qa`. The implementer silently wrote
the correct `qa -> review`, so shipped code is unaffected and that stale plan text
was deliberately left in place rather than pay a `review -> implement`
scope-custody demotion for a documentation-only defect. That is four independent
regenerations of the same non-existent edge.

## Target behavior

Every prose restatement of the phase ladder in a skill doc is **generated** from
`forwardPhase` / `reconcileMergedPhase` between sentinels, and a CI check fails on
drift. Hand-authored ladder prose stops being a thing that can exist.

The repo already has the two ingredients: the machinery-sentinel convention used by
`append-machinery-section.ts`, and a CI lint hook (`run-lint.sh` /
`lint-prose-rules.sh`) that fails with remediation inline.

## Why this one is cheap and independent

Unlike its two siblings from the same round
([[tactic-node-scope-files-overlap-gate]], [[tactic-code-diff-scope-custody]]) this
tactic needs no schema change, no selector change, and no new node field. It is a
generator, a set of sentinel blocks, and a CI check. It is `blocked_by` nothing.

## Open questions for /align-tactics

1. Which docs get a generated block? Census the hand-written ladder restatements
   first (`qa-fix`, `review-fix`, `qa-main`, `implement`, `dispatch-propagate`, the
   `strategy-graph-native-dispatch` body itself?).
2. Is the generated artifact a table, a list, or a prose paragraph — and does it
   need to carry the residue conditionality (`review -> main-qa | done`) or only
   the edges?
3. Does the CI check regenerate-and-diff, or parse the sentinel block and compare
   semantically? Regenerate-and-diff is simpler but noisier on formatting.
4. Do intention-node plan bodies fall in scope? The fourth regeneration was in a
   node body, not a skill doc — but node bodies are fingerprinted scope, so a
   generator writing into them would trip custody gates.
