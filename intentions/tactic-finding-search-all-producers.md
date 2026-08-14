---
id: tactic-finding-search-all-producers
kind: tactic
statement: Every finding producer searches the open tactic set before minting —
  /align Step 4, /review-fix, /qa-main, /qa-fix, /rsi and /rsi-audit record a
  recurrence on the existing node instead of writing a second one
owner: ai
status: raw
parent: null
rationale: Drafted 2026-08-14 by the /align round that dissolved the finding
  ledger as a distinct graph primitive. tactic-eval-finding-ledger removes the
  rsi-specific primitive; this node installs the discipline that primitive
  carried into every producer, which is the half that makes the change uniform
  rather than merely a deletion. Recorded because merge-on-similarity is today
  followed only by /rsi and /rsi-audit while every other producer mints freely.
reading: null
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

# Every finding producer searches the graph before minting a node

Drafted 2026-08-14 by the `/align` round that dissolved the finding ledger as a
distinct graph primitive. The sibling node `tactic-eval-finding-ledger` removes
the rsi-specific *primitive*; this one installs the *discipline* it carried into
every producer, which is the half that makes the change uniform rather than
merely a deletion.

Governing record: the "How is a finding recorded on the graph, and does the
producer change the answer?" clarification on
`strategy-graph-native-dispatch` (2026-08-14).

## The gap

Merge-on-similarity is today a discipline only `/rsi` and `/rsi-audit` follow,
through `dispatch-eval-finding`. Every other producer mints a fresh node each
time with no duplicate check:

- `.claude/skills/align/SKILL.md` Step 4 — interview byproducts, written
  straight through `write-node.ts`.
- `.claude/skills/review-fix/SKILL.md` — `blocked_by` follow-ups.
- `.claude/skills/qa-main/SKILL.md` — implement-chain bug records.
- `.claude/skills/qa-fix/SKILL.md` — needs-main residue.

## Scope

Add a find-before-minting step to each producer's skill: read the open tactic
set, judge whether this finding **is** one already recorded, and on a match
record the recurrence on that node — bump the `recurrence_count` record on
`attributes.measured_impact` and refresh the body — instead of writing a new
node. On no match, mint an ordinary draft tactic (`phase` absent, `serves` the
strategy owning the artifact touched, per strategy clarification 27's
artifact-owner placement rule).

The search must not be scoped to an id prefix or to any producer-private
attribute. That is the whole point: the recorded failure
(`tactic-eval-finding-eval-finding-list-misses-nonledger`) is a duplicate that
escaped **because** the search was namespace-scoped.

Prefer one shared write surface over four hand-written procedures — the
generalized successor to `dispatch-eval-finding` — so the discipline lives in
code rather than in four copies of the same prose. This is the mechanical-floor
doctrine: scripts carry what is mechanical, skill prose carries only what needs
judgment. The similarity judgment itself stays with the model and stays in the
skill.

## Dependencies

`tactic-eval-finding-ledger` must land first, or at least its writer change: the
search surface these producers call is the one that node generalizes.

## The cost this round did not measure

Adding a mandatory search step to `/review-fix` and `/qa-main` costs those
phases a graph read and a similarity judgment per finding, per run. That cost was
**not** measured before the requirement was recorded, and the author accepted the
recommendation with that limit stated. Measure it as part of planning: if the
per-run cost is material, the honest fallback is a cheaper search (statement-only
match over open tactics) rather than exempting a producer, since an exempt
producer reintroduces exactly the namespace problem being retired.

## Verification

- A second finding of an already-recorded defect, produced by a **different**
  producer than the first, updates the existing node and mints nothing.
- No producer's search is scoped to an id prefix or a class attribute.
- The baseline figures on `tactic-eval-finding-eval-finding-list-misses-nonledger`
  (`duplicate_finding_nodes_same_defect: 2`,
  `finding_nodes_outside_ledger_namespace: 1`) do not grow.
