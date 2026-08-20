---
id: tactic-attention-blocking-orthogonal
kind: tactic
statement: SUPERSEDED 2026-08-12 — blocking orthogonality is retired; blocked_by
  moves inside the parent relation and the precedence lift is deleted (see
  tactic-attention-namespaced-rank)
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-13 /align-strategy round
  (author-dictated): blocking must be an orthogonal concept to boosting —
  blocking nodes are serialized ahead of what they block by a distinct
  mechanism, ranked higher but never boosted higher. Supersedes the 2026-07-07
  backward additive flow (strategy-graph-drives-dispatch clarifications amended
  same date), whose compounding arithmetic could silently overtake intentionally
  top-ranked nodes — unacceptable once strategy-main-health carries the standing
  boost 100."
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: Is this node still live work?
    answer: "(Recorded 2026-08-12 /align round on strategy-graph-drives-dispatch,
      author-dictated.) No — superseded in full, and deliberately so. This node
      carried the 2026-07-13 ruling that blocking must be orthogonal to
      boosting: drop the backward blocked_by flow from the authored term and
      serialize blockers by a separate max-based effectivePrecedence lift. The
      2026-08-12 unification reverses it. blocked_by is a parent edge again, so
      a blocker is a child of what it blocks and outranks it by construction,
      and effectivePrecedence is deleted rather than kept alongside. The hazard
      that motivated orthogonality — additive compounding silently overtaking
      top-ranked nodes — is retired by per-node deduplication of lineage,
      measured that day on the live graph (max score 273 under the per-path form
      against 122 under dedup, with no overtaking). The implementation sketch in
      this node's body is kept as the record of the superseded design; the live
      scope moved to tactic-attention-namespaced-rank. This node is a prune
      candidate, not work."
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
# make blocking orthogonal to boosting: drop the authored term's backward blocked_by flow in resolveAttention; serialize blockers by max-based precedence in router ordering

Draft — retained interview context per the retain-not-refine contract.

## Decided model (author-dictated 2026-07-13)

Blocking and boosting are orthogonal. Blockers are serialized ahead of
what they block — ranked higher, never boosted higher. Doctrine home:
`strategy-graph-drives-dispatch` clarifications (the two 2026-07-07
backward-flow entries, amended 2026-07-13). This restores the 2026-07-02
"ordering constraints are never expressed through attention" separation
in full.

## Implementation sketch

- `packages/intentionsutil/src/attention.ts`, `resolveAttention` authored
  term: `distributorIds` currently includes `reverseBlockers` (the nodes a
  candidate blocks) — remove that relation, leaving the downward
  `parent`/`serves` flow unchanged. The pure-parent-cycle guard stays; the
  monotone fixpoint may simplify once the widened relation (and its mixed
  cycles) is gone.
- Router ordering (`router.ts` / `goals.ts`): add a precedence lift used
  for **ordering only** —
  `effectivePrecedence(n) = max(resolvedRank(n), max over m with n ∈
  m.blocked_by of effectivePrecedence(m))` — recursive over reverse
  blocked_by, memoized; `validateGraph` rule 15 forbids `blocked_by`
  cycles, so it terminates. The node's displayed/explained rank value stays
  its own resolved rank.
- The structural **signal term is unaffected**: `computeSignalPath`'s
  blocked_by walk is boolean reachability with a flat +1 — not additive
  compounding.
- Update the attention tests that encode the 2026-07-07 backward-additive
  expectations to the new doctrine (a doctrine change, not test
  weakening).

## Why now

The additive backward flow's compounding could silently overtake
intentionally top-ranked nodes (recorded live lesson, 2026-07-07) —
unacceptable once `strategy-main-health` carries the standing boost 100
that red-main fix tactics inherit (`strategy-graph-native-dispatch`,
2026-07-13). With max-based serialization nothing compounds, so no
`blocked_by` arithmetic can pass an authored 100.

## Verification sketch

Unit tests on `resolveAttention` + router ordering: a blocker of a
boost-100 node orders ahead of unrelated rank-99 work while its own rank
value is unchanged; a node blocking two hot nodes takes the max, not the
sum; downward flow cases unchanged.

## Note (2026-07-18)

Absorbed in part by draft tactic-attention-tier-ranking: under the tier model
the precedence lift operates on the lexicographic (tier, rank) pair, and that
tactic carries the implementation (including dropping the superseded backward
blocked_by additive flow this draft targeted). See
strategy-graph-drives-dispatch's 2026-07-18 clarifications.
