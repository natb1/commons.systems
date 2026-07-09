---
id: tactic-serves-inheritance-full-strip
kind: tactic
statement: strip redundant serves entries graph-wide per the extended
  inheritance rule — partial parent-overlaps at the strategy layer and
  parent-duplicated strategy entries at the tactic layer — and state the rule on
  kind-tactic
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-09 emulated /align-audit run: 26
  strategies re-declare at least one virtue their parent already carries, 17
  reading-chunk tactics re-declare strategy-philosophical-grounding from parent
  tactic-tradition-reading-program, and 14 dispatch tactics re-declare
  strategy-graph-native-dispatch from parent tactic-graph-native-dispatch. The
  author ratified extending kind-strategy's serves-inheritance rule to partial
  overlaps and to the tactic layer (clarification 'Does the serves-inheritance
  rule extend to partial overlaps and to the tactic layer?' on
  strategy-graph-integrity, same date). Coordinates with
  tactic-graph-self-consistency-sweep Unit 4, which strips only the seven full
  duplicate sets — re-derive the redundancy list at execution from the digest's
  dup-serves table (or its prototype) so the two never double-edit."
reading: null
gap: null
serves:
  - strategy-graph-integrity
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
# strip redundant serves entries graph-wide per the extended inheritance rule — partial parent-overlaps at the strategy layer and parent-duplicated strategy entries at the tactic layer — and state the rule on kind-tactic

Retained draft from the 2026-07-09 emulated /align-audit run — input to a
future /align-tactics pass; not yet a plan.

## Context

kind-strategy's serves-inheritance clarification (2026-07-09) stripped only
the seven full duplicate sets via tactic-graph-self-consistency-sweep Unit 4.
The emulated audit found the redundancy wider, and the author ratified
extending the rule to partial overlaps and to the tactic layer
(strategy-graph-integrity, clarification 'Does the serves-inheritance rule
extend to partial overlaps and to the tactic layer?').

## Scope (draft)

1. **State the rule on kind-tactic** — mirror kind-strategy's sub-strategy
   inheritance clarification for tactic subtrees: a child tactic authors
   serves only for a strategy claim beyond its parent's; re-declared entries
   add no rank information (attention flows down parent and serves alike).
2. **Strip redundant entries** — re-derive the list at execution from the
   digest's DUP-SERVES table (tactic-graph-digest-tooling, or its ad-hoc
   equivalent): at 2026-07-09, 26 strategies re-declare at least one parent
   virtue; 17 reading-chunk tactics re-declare strategy-philosophical-grounding
   from tactic-tradition-reading-program; 14 dispatch tactics re-declare
   strategy-graph-native-dispatch from tactic-graph-native-dispatch. Strip
   only the redundant entries (a node keeping additional non-parent claims
   keeps them); done-present nodes being pruned by the sweep drop out of the
   list naturally.
3. **Coordinate with sweep Unit 4** — if tactic-graph-self-consistency-sweep
   lands first its seven full sets are already gone; never double-edit.

All edits through write-node.ts; one graph-commit.

Out of scope: changing resolveAttention; the delegation-kind's
intentionally-loose serves.
