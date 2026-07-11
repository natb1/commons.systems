---
id: tactic-graph-native-dispatch-fold
kind: tactic
statement: Fold strategy-graph-native-dispatch's superseded clarification chains
  into its body and move settled router mechanism down — the strategy keeps the
  standing posture
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 /align-strategy review round: the node
  carries 44 clarifications with at least five superseded-in-place chains plus
  router mechanism detail (fuses, fingerprints, quorum floors) that is
  tactic/package-doc-grade — a design document wearing a strategy node.
  kind-strategy's body-function rule (2026-07-09) names the strategy body as the
  fold-target; this tactic performs the fold and shrinks the surface where
  ordinal-citation bugs breed."
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
blocked_by:
  - tactic-nontactic-body-durability
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# tactic-graph-native-dispatch-fold

## Context

strategy-graph-native-dispatch accumulated 44 clarifications during the
migration's design rounds; several chains supersede each other in place
(backlog band → calculated attention; mid-flight-edit rule → scope
fingerprint → chain of custody; re-selection recovery → fuse-bounded), and
settled mechanism detail is recorded at dialectic grain. Per kind-strategy's
body-function rule (2026-07-09), settled design notes belong in the node body;
the clarification list should carry the live dialectic record.

## Scope

- For each superseded-in-place chain: fold the surviving rule into a body
  section (with its dates and provenance), and compress the superseded
  entries to short pointers at the chain's surviving entry — never silently
  delete a dated record (git history is provenance, but in-node pointers keep
  the chain legible).
- Move settled router mechanism (fuses, fingerprint gates, quorum floors,
  claiming semantics) into body sections; package-doc-grade detail may move
  to packages/intentionsutil docs with body pointers.
- The strategy's conditions, signal, and live (unsuperseded) clarifications
  are untouched — the posture stays in frontmatter.
- Prefer landing AFTER tactic-clarification-citation-ids so folded content
  can cite entries by id; coordinate with any in-flight round on this
  strategy (soft-freeze semantics).

## Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```
- No clarification chain remains where a later entry silently contradicts an
  earlier one without a pointer; body sections carry the folded rules.
