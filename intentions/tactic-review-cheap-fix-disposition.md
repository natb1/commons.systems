---
id: tactic-review-cheap-fix-disposition
kind: tactic
statement: "review-phase cheap-fix disposition: the residue classify step fixes
  cheap out-of-contract findings in scope and defers only expensive ones
  (fix-everything-cheap doctrine, cost as a second resolve-in-scope trigger
  refining clarification 19)"
owner: ai
status: raw
parent: null
rationale: Surfaced 2026-07-13 /align-strategy interview recording the
  fix-everything-cheap clarification (cost as a second resolve-in-scope trigger
  refining clarification 19). Implements the disposition-policy change in
  review-fix.js's residue-classification step.
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
# review-phase cheap-fix disposition: fix cheap out-of-contract findings in scope, defer only expensive ones

> Draft context retained by `/align-strategy` on 2026-07-13 — not yet a
> finalized unit plan. `/align-tactics` decomposes this into PR-sized units.

## Context

`strategy-graph-native-dispatch`'s 2026-07-13 fix-everything-cheap
clarification adds **cost** as a second resolve-in-scope trigger to
clarification 19: a confirmed finding is resolved in the review phase's
content-fix loop when it either breaks the tactic's contract (clar 19's
original trigger) **or** is cheaper to fix than to defer; only a confirmed
out-of-contract finding that is *expensive* (a real refactor) defers to a
draft tactic. Cost touches only the resolve↔defer boundary — the ignore
category (refuted / unreachable / below-threshold / defensive-fallback) is
unchanged.

Today `review-fix.js`'s residue-classification step
(`.claude/workflows/review-fix.js`, the classify → defer → file logic around
`:548-640` and the deferred filings around `:863-`) routes every confirmed
out-of-contract finding straight to a deferred filing. This tactic changes
that step into a fix-cheap / defer-expensive fork.

## Scope (to be decomposed by /align-tactics)

- In the residue classification, add a cheap-vs-expensive determination for
  confirmed out-of-contract findings: **cheaper-to-fix-than-to-defer** →
  route to the in-scope fix lane (the review phase's content-fix loop, before
  the `review → done` transition); **expensive** → the existing
  deferred-filing path (draft tactic per component).
- Leave contract-breaking findings (always resolve) and the ignore category
  exactly as clar 19 sets them — cost touches only resolve↔defer.
- Keep the PR-review-comment audit trail recording **every** disposition,
  the cheap-fixed ones included, so a fixed-in-PR finding is still recorded
  (graph-as-sole-tracker, clar 30).

## Overlap / sequencing

Shares the `review-fix.js` residue-disposition surface with
`tactic-review-phase-trust-builtin-review` (which drops the findings-only
wrapper and routes the review skills' *unfixed residue* through the same
classify → defer → file logic). `/align-tactics` should sequence the two
together: trust-builtin defines **what** reaches the residue step; this
defines **how** that residue is dispositioned by cost. Neither changes clar
19's three-way structure or its adversarial-confirm requirement.

## Open question for /align-tactics

Where the cheap-vs-expensive judgment lives — a heuristic in the classifier
subagent's prompt ("cheaper to fix than to defer"; examples: reuse a helper /
consolidate a read / add validation / tighten a regex = cheap; an algorithmic
rewrite or a new data structure = expensive) versus any mechanical signal.
The clarification records the *principle*, not a code rule; decomposition
picks the encoding.
