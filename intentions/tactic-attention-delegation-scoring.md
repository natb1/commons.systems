---
id: tactic-attention-delegation-scoring
kind: tactic
statement: Make delegations score-bearing and `recovers` a parent edge — capture
  becomes lineage, replacing the capped capture term
owner: ai
status: raw
parent: null
rationale: "Byproduct of the 2026-08-12 /align round that unified the ranking
  model on strategy-graph-drives-dispatch. The round ruled `recovers` a true
  parent edge, but kind-delegation has no `goal_layer: true`, so delegations
  carry no attention field and there is nothing for a recovering strategy to
  inherit — the rule cannot be implemented without this change. Split out from
  tactic-attention-namespaced-rank because it is a schema change to a kind node
  plus a derivation, not a resolver change, and because it carries an open
  decision the resolver work does not need to wait on."
reading: null
serves:
  - strategy-graph-drives-dispatch
recovers: []
clarifications:
  - question: What is owed before this can be implemented?
    answer: "(Recorded 2026-08-12; the cap half RESOLVED 2026-08-12, see the
      cap-decision clarification below — nothing on this node is open now.) The
      cap decision. Today the capture term is capped at min(1, sum) so a
      strategy recovering several severe delegations cannot swamp authored
      intent. Read as lineage the natural form is NO cap, with severity
      calibrated onto the same integer scale as authored per-tier boosts
      instead — but that was left open by the author at the close of the round
      and must be settled before implementation, not decided inside it. Scope
      otherwise: derive each delegation's score from its divergence and
      irreversibility axes using the existing scoring helpers in
      packages/intentionsutil/src/attention.ts rather than a second
      implementation; add `recovers` to the parent relation; delete the capture
      term. 19 recovers edges across 22 delegations are in scope. The
      self-updating property must be preserved: raising a delegation's
      divergence level re-ranks every recovering strategy with no authoring
      act. (Amended 2026-08-12: the `goal_layer: true` flip on kind-delegation
      is REMOVED from scope — see the cap-decision clarification.)"
  - question: Is the capture cap kept, and on what scale does a delegation score?
    answer: "(Decided 2026-08-12 at author request, on measurement of the live
      graph.) NO CAP, and the whole capture apparatus collapses to one derived
      boost plus one weight constant. THE CAP GOES, at zero behavioral cost:
      across all 18 recovering nodes the axis sum maxes at 6 of a possible 6,
      so min(1, sum) reduces nothing today — 17 nodes recover exactly one
      delegation and one (strategy-author-approved-copy) recovers two. Keeping
      it would also reintroduce a kind-specific rule, the asymmetry-by-kind
      kind-kind clarification 1 was amended to retire, since summing several
      parents is what the model does everywhere else. THE `/6` GOES WITH IT:
      divergenceScore and irreversibilityScore already return integers 0..3, so
      their raw sum is an integer 0..6 and the divisor exists only to fit the
      [0,1] cap regime. captureScore, captureScoreFor and CAPTURE_TERM_WEIGHT
      all delete. THE SCALE IS THE REAL DECISION, and it must not be skipped:
      post-migration authored boosts run min 1 / median 20 / p75 50 / max 96,
      strongly bimodal at 20 (32 nodes) and 50 (26 nodes), so a raw 1..6 would
      make capture invisible — and 15 of the 18 recovering strategies carry NO
      authored boost at all, so capture is their entire rank claim. Today the
      opposite holds: raw boosts have median 3 with 46% below 1.0, so the [0,1]
      capture term is currently competitive with half the authored graph.
      Preserving that relative weight across the migration requires ONE named
      constant, DELEGATION_SEVERITY_WEIGHT = 10, giving a range of 10..60 that
      spans both authored modes. Net: three mechanisms (divisor, cap, term
      weight) become one constant. NO `goal_layer` FLIP IS NEEDED — this is
      what makes the change small. resolveAttention's authored fixpoint already
      sweeps EVERY node and lets an ineligible node relay its distributors'
      outgoing set, filtering to eligible only when building the output map, so
      a delegation can seed a derived boost into the lineage sum while never
      appearing as a rankable node. Flipping goal_layer instead would make
      office_hours and pace_exempt legal on delegations (validateGraph rule 5
      gates all three on the same flag) and would add all 22 delegations to
      hold-alerts.ts's top-K pool, shifting its cutoff. Also note the fixpoint
      already dedupes by source id (`next.set(src, amt)`), which is exactly the
      round's count-each-lineage-node-once rule, so no new dedup is required.
      The derived boost is tier-invariant: per-tier namespacing exists because
      an AUTHORED magnitude is chosen against a tier's scale, and nothing is
      authored here."
  - question: How does the derived delegation score interact with the closed level
      vocabulary settled after this node's cap decision?
    answer: "(Raised 2026-08-12, AFTER the cap decision above; OPEN — the one
      undecided item on this node.) The author later closed kind-kind's per-band
      question by making the authored boost vocabulary a closed set of absolute
      levels (background 5 / low 10 / normal 20 / high 50 / urgent 85; see
      tactic-attention-per-tier-boost-migration). DELEGATION_SEVERITY_WEIGHT =
      10 yields 10, 20, 30, 40, 50, 60 — and 30, 40 and 60 are values no author
      can express. This is NOT a validation conflict: the derived boost is
      computed inside resolveAttention and never written to a node's attention,
      so the write-path vocabulary check that replaces retired rule 20 does not
      see it, and an off-vocabulary SCORE is not anomalous because scores are
      sums of boosts. An implementer must not apply the vocabulary check to
      resolved values. What is open is whether a delegation should speak the
      author's vocabulary: (1) keep the weight, preserving six distinct monotone
      contributions; or (2) map severity onto the levels and delete
      DELEGATION_SEVERITY_WEIGHT entirely — one fewer constant and
      commensurability by construction, at the cost of collapsing six
      severities onto five levels (the live graph carries severities 1..5 across
      22 delegations, so little is lost). Recommendation is (2), on the same
      reasoning that decided the cap and the vocabulary; the mapping itself is
      the judgment call. Not folded in unilaterally because the cap decision is
      already recorded as settled."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by:
  - tactic-attention-namespaced-rank
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# Make delegations score-bearing and `recovers` a parent edge — capture becomes lineage, replacing the capped capture term

Draft — retained interview context per the retain-not-refine contract.

## Why this is separable from the resolver work

`tactic-attention-namespaced-rank` widens the parent relation to include
`recovers`. That edit is inert until a delegation has a score to confer:
`kind-delegation` carries no `goal_layer: true`, so a delegation has no
`attention` field at all today. This node supplies the missing half — a
schema change to a kind node plus a derivation — and it also carries an
open decision the resolver work does not need to wait on.

## Scope

1. Seed each delegation's derived boost in `resolveAttention`'s authored
   fixpoint as `divergenceScore(d) + irreversibilityScore(d)`, scaled by
   `DELEGATION_SEVERITY_WEIGHT` (see below). **Reuse** those two helpers in
   `packages/intentionsutil/src/attention.ts` rather than writing a second
   implementation — their free-text token matching is deliberate (the live
   store carries compound values such as `low-moderate`) and must be
   preserved.
2. Add `recovers` to the parent relation (this is item 1 of
   `tactic-attention-namespaced-rank`'s scope; it is inert until step 1
   lands).
3. Delete `captureScore`, `captureScoreFor`, `CAPTURE_TERM_WEIGHT` and the
   capture term from the composition step; the value now arrives as lineage.
4. Confirm the self-updating property survives: raising a delegation's
   divergence level must re-rank every recovering strategy with no authoring
   act.

**Explicitly NOT in scope:** flipping `goal_layer: true` on
`intentions/kind-delegation.md`. An earlier draft of this node carried that
as step 1; it is unnecessary and harmful — see below.

## Cap decision (settled 2026-08-12)

**No cap, no `/6`, one weight constant.**

`divergenceScore` and `irreversibilityScore` already return integers `0..3`,
so their raw sum is an integer `0..6`. The `/6` divisor and the `min(1, sum)`
cap both exist only to satisfy the *Weights* invariant of the old regime
(derived terms bounded by `SIGNAL_TERM_WEIGHT + CAPTURE_TERM_WEIGHT = 2` so an
authored boost still dominates). That regime is gone: capture is lineage, and
a delegation is an ordinary parent.

Measured on the live graph, the cap is inert — across all 18 recovering nodes
the axis sum maxes at **6 of a possible 6**, so `min(1, sum)` reduces nothing.
17 recover exactly one delegation; `strategy-author-approved-copy` recovers
two. Keeping the cap would also reintroduce the kind-specific asymmetry that
`kind-kind` clarification 1 was amended to retire.

### The scale is the real decision — do not skip it

| scale | authored boosts (post-migration) | delegation contribution |
|---|---|---|
| min | 1 | 1 |
| median | 20 | 3 |
| p75 | 50 | 4 |
| max | 96 | 6 |

The authored distribution is strongly bimodal at **20** (32 nodes) and **50**
(26 nodes). A raw `1..6` contribution against that would make capture
effectively invisible — and **15 of the 18 recovering strategies carry no
authored boost at all**, so capture is their entire rank claim. Today the
reverse holds: raw `attention.boost` has median 3 with 46% of values below
1.0, so the `[0,1]` capture term is currently competitive with half the
authored graph.

Preserving that relative weight across the migration takes **one named
constant**:

```
DELEGATION_SEVERITY_WEIGHT = 10   // severity 1..6 -> 10..60
```

which spans both authored modes. Net simplification: three mechanisms
(divisor, cap, term weight) collapse to one constant.

## OPEN — interaction with the level vocabulary (raised 2026-08-12, after)

The cap decision above was settled BEFORE the author closed the per-band
question by making the authored boost vocabulary a closed set of absolute
levels — background 5 / low 10 / normal 20 / high 50 / urgent 85
(`tactic-attention-per-tier-boost-migration`;
`strategy-graph-drives-dispatch` carries the doctrine). The two have an
interaction that is **not yet decided**.

`DELEGATION_SEVERITY_WEIGHT = 10` yields contributions of 10, 20, 30, 40, 50,
60. Three of those (30, 40, 60) are values no author can express.

**This is not a validation conflict.** The derived boost is computed inside
`resolveAttention` and never written to a node's `attention`, so the
write-path vocabulary check that replaces retired rule 20 does not see it.
Nor is an off-vocabulary *score* anomalous — scores are sums of boosts and sit
off-vocabulary constantly. An implementer must not apply the vocabulary check
to resolved values.

**What is open** is whether a delegation should speak the same vocabulary as
an author. Two options:

1. **Keep the weight** (as recorded above). Preserves full resolution: six
   distinct severities map to six distinct contributions, monotone and
   injective.
2. **Map severity onto the levels** and delete `DELEGATION_SEVERITY_WEIGHT`
   entirely — one fewer constant, and a delegation then makes a claim in
   exactly the language an author uses. Costs resolution: six severities
   collapse onto five levels (in practice the live graph carries severities
   1..5 across 22 delegations, so little is lost).

**Recommendation: option 2**, on the same reasoning that decided the cap and
the vocabulary — prefer one fewer mechanism, and prefer commensurability by
construction. The mapping itself would be the judgment call.

Not folded into the decision above unilaterally because that decision is
already recorded as settled; this is flagged for the author rather than
silently revised.

## Why no `goal_layer` flip

`resolveAttention`'s authored fixpoint already sweeps **every** node and lets
an ineligible node relay its distributors' outgoing set, filtering to eligible
nodes only when building the output map
(`packages/intentionsutil/src/attention.ts`, the `authoredOutgoing` loop). So
a delegation can seed a derived boost into the lineage sum while never
appearing as a rankable node. No schema change is required.

Flipping the flag instead would cost two things:

- `validateGraph` rule 5 gates `attention`, `office_hours` and `pace_exempt`
  on the same flag, so `office_hours` and `pace_exempt` would become legal on
  delegations — a delegation is not parkable and not pace-exempt.
- All 22 delegations would enter `hold-alerts.ts`'s top-K pool (every node in
  `resolveAttention`'s output map with `phase !== "done"` and
  `office_hours === null`), shifting its cutoff.

The router is unaffected either way — `selectGraphTargets` filters to
`kind === "tactic"` before selection.

## Two properties that come free

- **Dedup.** The fixpoint already dedupes by source id (`next.set(src, amt)`),
  which is exactly the round's count-each-lineage-node-once rule.
- **Tier invariance.** The derived boost is the same in every tier. Per-tier
  namespacing exists because an *authored* magnitude is chosen against a
  tier's scale; nothing is authored here.

## Measured scope

19 `recovers` edges across 22 delegation nodes (live graph, 2026-08-12).
Delegation axis sums: `1:3  2:6  3:5  4:5  5:3` (0 delegations at 0 or 6).
