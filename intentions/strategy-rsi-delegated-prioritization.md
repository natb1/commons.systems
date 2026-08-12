---
id: strategy-rsi-delegated-prioritization
kind: strategy
statement: The model holds ordering of dispatch-delegated tactics inside
  author-set strategy bands — every reordering logged, bounded, and answerable
  to the fitness function
owner: human
status: refining
parent: strategy-recursive-self-improvement
rationale: "Recorded 2026-08-11 by the /align round that subdivided
  strategy-recursive-self-improvement into ranking-namespace children, executing
  the concrete work its child-strategy clarification records as owed. This child
  owns the machinery that holds the delegatee to the ordering bound the parent
  records: /rsi-evaluate (the delegated evaluation and reprioritization
  subagent), the attributes.priority_log anti-thrash provenance and its lint,
  and the structural namespacing of rank so a delegated boost cannot invert the
  author's cross-strategy order. The delegation itself is not being unwound —
  ordering stays delegated — but its blast radius is, which is why the node
  carries a recovers edge to delegation-anthropic-claude. Ranking function:
  tactics serving it resolve one band above tactics left directly on the parent,
  and one below the rsi-plan surface child."
reading: null
serves: []
recovers:
  - delegation-anthropic-claude
clarifications:
  - question: Steelman — is this a delegation boundary rather than a goal?
      delegation-anthropic-claude already records the delegated scope, so a
      strategy restating it is a duplicate seam; what is missing is an edge, not
      a node.
    answer: "(Diverged on the conclusion 2026-08-11, its edge adopted; reasons
      recorded.) The rival is right on both of its premises and wrong on what
      follows. It is right that the boundary lives on the delegation — the prior
      same-day round extended delegation-anthropic-claude's delegated scope
      verbatim to 'tactical prioritization of dispatch-delegated work — ordering
      owner: ai tactics toward the recorded fitness function'. It is right that
      an edge was missing, and that edge is now on this node. But a delegation
      node records WHAT IS DELEGATED; by schema it carries no success_signal and
      takes no children, so it cannot own the work of holding the delegatee to
      the bound. That work — building /rsi-evaluate, landing the priority_log
      lint, making the rank algebra structural — needs an owner that can be
      validated and can hold tactics, and that is a strategy. Parsimony is
      satisfied because the two nodes say different things: the delegation says
      what was handed over, this strategy says what the author is doing about
      the capture risk of having handed it over."
  - question: "Why does this node carry recovers: [delegation-anthropic-claude] when
      the prior round considered that edge and declined it?"
    answer: "(Recorded 2026-08-11 interview, reversing the prior same-day
      disposition on new ground.) The prior round declined the edge on
      strategy-recursive-self-improvement because that round NARROWED the blast
      radius of a delegated authority without unwinding it, and 'recovers'
      seemed to overstate a bound that leaves the delegation intact. /align's
      step 3 says to record the edge even when the unwinding is only partial,
      and the ground has changed: this node's entire content is reducing
      reliance on the delegatee's unbounded judgment — scoping its ordering
      authority to a band, logging every write it makes, and moving the bound
      from behavior into structure. That is partial recovery by design, and it
      is now a whole strategy rather than one clarification, so the edge is
      proportionate where before it was not. The delegation's own risk profile
      supports it: divergence low-moderate, irreversibility not gated
      (artifacts, workflow, and evaluation context are all in-repo), with
      recovery cost tracking the frontier-vs-open-weight capability gap. The
      risk that would grow that cost is the delegatee quietly widening its own
      authority, which is exactly what the namespacing bound prevents. No
      recovers edge is added to the rsi-plan-surface sibling, which unwinds
      nothing."
  - question: What work is in scope, and what stays on the parent?
    answer: "(Recorded 2026-08-11 interview; author selected the wide scope over a
      skill-only scope.) In scope, and repointed to this node in the recording
      round: tactic-rsi-evaluate-skill (the skill itself),
      tactic-priority-provenance-schema (the priority_log and rsi_task schema
      documentation plus the ownership-boundary and marks-asymmetry lint), and
      tactic-attention-namespaced-rank (making the (tier, band, residual) key
      structural). The last of those keeps its existing serves edge to
      strategy-graph-drives-dispatch as well — it is genuinely cross-cutting,
      and under band = max across distributors the multi-serves edge resolves it
      to the higher of the two bands. The narrower alternative — scoping this
      node to the skill alone and leaving the schema and rank work on the parent
      at band 6 — was declined because the strategy's success_signal could then
      only measure that a skill exists, not whether delegated ordering is
      actually bounded, and the bound is the thing the author asked for.
      Everything else serving the parent stays there: the research lane, the
      acceleration review, token attribution, the external acceptance gate, and
      the rsi skill family proper."
  - question: Why is the success signal paired — an outcome half and an integrity
      half — rather than one or the other?
    answer: "(Recorded 2026-08-11 interview.) Because each half alone is passed by a
      distinct failure. Integrity alone — zero cross-strategy inversions, zero
      unlogged attention writes — is scored perfectly by a /rsi-evaluate that
      reorders nothing at all, which conforms to every bound while delivering
      none of the acceleration the delegation exists for. Outcome alone —
      front-loaded tactics closing faster than baseline — is scored perfectly by
      a model that buys throughput precisely by inverting the author's
      strategies, which is the capture this whole node exists to prevent. The
      conjunction is the claim: ordering authority is being exercised, and
      exercised inside its bounds. Neither half is sufficient and the threshold
      requires both. Both sensors are already drafted in the graph rather than
      invented here — the outcome half is the reprioritization-outcome section
      on tactic-rsi-plan-priority-render, the integrity half is the lint on
      tactic-priority-provenance-schema — so the signal is readable once those
      land, and until then it reads honestly as insufficient data rather than as
      passing."
  - question: Why is the signal a proxy?
    answer: (Recorded 2026-08-11 interview.) is_proxy is true on both halves. The
      outcome half proxies acceleration of value delivery by closure interval,
      which measures how fast work finishes rather than how much it was worth —
      a model that front-loads cheap tactics scores well without accelerating
      anything valuable. The integrity half proxies 'the delegatee did not
      exceed its authority' by counting the violations that are mechanically
      detectable, which cannot see a reordering that is technically within
      bounds but against the author's intent. Both are the best available
      readings and neither is the thing itself; the mitigation for both is the
      same one the parent's anti-thrash clarification names — every reordering
      carries its rationale in priority_log, and rsi-plan.md renders what moved
      each iteration, so the author can audit judgment the sensors cannot score.
  - question: Why does this child declare no serves of its own?
    answer: "(Recorded 2026-08-11 after adversarial review.) It was created serving
      virtue-alignment-of-attachments and virtue-progressive-detachment — the
      parent's set exactly. kind-strategy's 'Does a sub-strategy re-declare its
      parent's serves?' clarification answers no: sub-strategies inherit, the
      parent edge already carries the parent's claims down, and a child authors
      serves only for a virtue claim BEYOND its parent's. An exact duplicate
      adds no rank information while doubling the review surface, and a serves
      edge is a ranking act deserving weight-level care. Removed; inheritance
      through parent is deliberate. Confirmed rank-inert before removal: virtues
      carry no attention, and this node resolves identically with and without
      the edges."
  - question: Where does the reprioritization-outcome audit live, and why did it move?
    answer: "(Recorded 2026-08-11 after adversarial review, correcting a misfile
      made in the round that created this node.) This strategy's signal names an
      outcome sensor — did nodes the model front-loaded close faster than the
      queue's baseline? — and that sensor was originally filed inside
      tactic-rsi-plan-priority-render, which serves the sibling
      strategy-rsi-plan-surface. That inverts the very stay-vs-move principle
      the same round recorded on the parent: the audit's completion moves THIS
      strategy's signal and does not move the surface child's at all, so it
      belonged here. Worse, it made this strategy's signal unreadable until a
      tactic outside its own subtree landed. It is now split out as
      tactic-rsi-reprioritization-outcome-audit, serving this strategy, carrying
      both the per-iteration reprioritization delta and the post-hoc outcome
      audit. The rendering of that section into rsi-plan.md remains the surface
      child's concern; deriving the measurement is this strategy's."
  - question: Against which quantity is the cross-strategy inversion count in
      success_signal (b) measured -- a distributing strategy's authored term or
      its resolved rank?
    answer: "(Recorded 2026-08-12, office-hours round that cleared
      tactic-attention-namespaced-rank's park.) Its RESOLVED rank. The signal
      named cross-strategy rank inversions without naming the quantity, and that
      gap blocked the implementing tactic: the two candidate band derivations
      make the threshold reachable or unreachable as literally written. Under
      band = the distributing strategy's resolved rank -- the definition
      kind-kind's rank-algebra clarification records and this round ratifies --
      a tactic can never outrank a tactic of a higher-resolved-rank strategy,
      because band dominates residual lexicographically, so the count is
      structurally zero once tactic-attention-namespaced-rank lands and the
      threshold (both counts in (b) stay at zero) is genuinely achievable. Under
      band = the strategy's authored term, the ~1828 inversions measured against
      resolved rank on 2026-08-11 would stay live and this half of the threshold
      could never be met, since the signal and capture terms are computed per
      node and are not distributed downward
      (packages/intentionsutil/src/attention.ts lines 553-556). Measuring
      against resolved rank is therefore both the stricter reading and the one
      the rank key can actually enforce. Caveat carried forward for the
      implementer: the ~1828 figure predates the sum-to-max multi-distributor
      combinator fix that tactic-attention-namespaced-rank also owns, so it must
      be re-measured before being used as a baseline rather than assumed.
      Author-directed: the author accepted this resolution on trust rather than
      deriving it, so it is enrolled for re-validation as a born-parked
      office-hours review sitting (tactic-review-band-derivation-ratification)."
tooling_goals: []
success_signal:
  observable: (a) the median closure interval of tactics the model front-loaded,
    against the dispatch queue's baseline closure interval; and (b) the count of
    cross-strategy rank inversions -- measured against each distributing
    strategy's RESOLVED rank, the quantity band is derived from (settled
    2026-08-12) -- plus the count of model attention writes carrying no
    priority_log entry
  sensor: tactic-rsi-reprioritization-outcome-audit's outcome section (joining
    attributes.priority_log entry dates with node closure dates), plus
    validate-graph's ownership-boundary and marks-asymmetry lint from
    tactic-priority-provenance-schema — both tactics serve THIS strategy, so the
    signal is readable from inside its own subtree
  threshold: "front-loaded tactics close at or below the baseline interval across
    consecutive iterations, AND both counts in (b) stay at zero. Either half
    passing alone is a failure, not a partial win: integrity without outcome
    describes a model that reorders nothing, outcome without integrity describes
    one that buys throughput by inverting the author's strategies"
  is_proxy: true
attention:
  boost: 1
  override: null
  rationale: "Author-directed 2026-08-11: +1 over the parent's AUTHORED 6 gives
    this child an authored 7, and the authored term is what distributes to its
    tactics — second within the strategy-recursive-self-improvement subtree,
    behind the rsi-plan surface child's authored 8 and ahead of tactics left
    directly on the parent at 6. Chosen relative to the parent, not on an
    absolute scale: the value means 'one band above the parent'. The ordering
    between the two children is the author's: the surface that makes harness
    state readable ranks ahead of the machinery that reorders within it, because
    the author cannot audit the reordering without first being able to read the
    plan. CORRECTED 2026-08-11 after adversarial review, two ways. (1) This
    node's RESOLVED rank is 8.5, not 7: the signal term adds 1 and the capture
    term adds 0.5. Resolved figures are derived and must not be restated as if
    authored; the durable claim is the authored 7 and its relation to the
    parent. (2) The 0.5 is not incidental — it is the price of the recovers edge
    added to delegation-anthropic-claude in the same round. captureScore for
    that delegation is (divergence 'low-moderate' = 2 + irreversibility gated =
    1) / 6 = 0.5, and attention.ts gives it to this strategy and to every tactic
    serving it. So the author's directed one-band separation from the surface
    child is delivered as 0.5 at the strategy level (9 vs 8.5) and 0.5 at the
    tactic level (8 vs 7.5), not 1. The ORDER the author directed is preserved,
    which is what was asked; the magnitude is not. This is left as-is rather
    than compensated by raising the boost, because inflating an authored value
    to cancel a derived term would make the authored number mean two things at
    once — but it is recorded here so a future rerank starts from the real
    figure."
  tier: 1
phase: null
execution: null
validates: []
blocked_by: []
office_hours: null
pace_exempt: false
rounds: null
attributes:
  conditions:
    - "the ownership boundary holds as recorded on the parent — the author owns
      all strategy and virtue attention plus owner: human tactics; the model
      owns ordering of owner: ai tactics and may create, rewrite, or remove
      their attention without author input"
    - attributes.priority_log stays outside the substance fingerprints, as
      queue_summary already is — otherwise logging a reordering would freeze the
      reordered node's open children and the anti-thrash record would cost more
      than it is worth
    - the fitness function stays recorded and author-owned — the model optimizes
      toward it and never redefines it; a proposed change to the criterion is an
      /align escalation, not a delegated write
    - the model's only tier instrument stays classification — adding a missing
      bug_fix or security mark, never removing or downgrading one, and never
      writing attributes.tier directly
---
# The model holds ordering of dispatch-delegated tactics inside author-set strategy bands — every reordering logged, bounded, and answerable to the fitness function
