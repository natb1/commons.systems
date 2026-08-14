---
id: strategy-discovered-requirements
kind: strategy
statement: "The author's requirement is discovered under interview and recorded
  completely enough that the record alone carries it — /align's charter:
  elicitation, capture-completeness, and independent challenge of the draft"
owner: human
status: refining
parent: strategy-explicit-intent
rationale: "The /align interview is the only place an author's requirement
  enters the graph, and no node owned that practice. Its tactics sat on
  strategy-graph-native-dispatch, whose charter is that orchestration state
  lives in intention nodes — a charter requirement discovery does not fit — and
  whose success_signal reads its open children as a dispatch machinery-defect
  backlog, so interview-quality work held there would be counted as a dispatch
  defect once phase-set. This node is the missing sibling in
  strategy-explicit-intent's family, which is organized by
  property-of-the-record: strategy-graph-integrity asks whether the record is
  coherent, strategy-graph-review-curriculum whether it is still believed,
  strategy-graph-self-description whether it is self-describing,
  strategy-verified-requirements whether each requirement names its verifying
  sensor, strategy-graph-mounts where its boundaries lie,
  strategy-attention-surface where it meets the author's attention, and
  strategy-graph-drives-dispatch how it enters execution. None of the seven asks
  whether the record is faithful to what the author actually meant and complete
  enough to stand alone. That is this node's charter, and it is exactly what
  /align is answerable for. Scope is the whole skill, not only elicitation:
  framing and the onboarding funnel (Step 1), the Socratic dialectic over
  intent/placement/benefit/signal/conditions with its interview-type
  classification and deferral mechanics (Step 2), delegation-capture advice
  (Step 3), byproduct retention as draft tactics (Step 4), the record landing
  with its freeze classification and round provenance (Step 5), the
  clause-coverage walk that discharges the record-completeness contract (Step
  6), and the adversarial draft-review gate that is the audit's second reader.
  Step 0 (claim and isolate) and /align-tactics are deliberately out of scope —
  both are dispatch machinery, not discovery; the body says so explicitly.
  Capture note: the interview is drafted by the delegatee under audit
  (delegation-anthropic-claude) while the requirement being discovered is the
  author's own — the same tension strategy-explicit-intent records for the graph
  as a whole. The loop is controlled, not unwound, so no recovers edge is
  authored here; the controls are the non-delegable-interview condition below
  and the adversarial draft review, which is precisely a second reader placed
  against Claude-drafted records."
reading: null
serves: []
recovers: []
clarifications:
  - question: How was this strategy authored, and what is owed?
    answer: "Authored 2026-08-13 in a background Claude session at the author's
      explicit direction (\"execute recommendation\"), from a recommendation
      that same session produced and the author approved in the same exchange.
      It has NOT been through an /align interview: no Socratic dialectic fixed
      its intent, placement, benefit, signal or conditions, and the statement,
      conditions, signal and boost are Claude-drafted from a design conversation
      rather than author-authored. This is recorded plainly because
      strategy-explicit-intent's rationale reserves virtue and strategy
      substance for the author with agent assistance as drafting, never
      derivation — so this node is drafting awaiting ratification, and its
      substance is provisional until a full /align round runs against it. That
      round is the reason this node is born-parked rather than merely annotated:
      prose in a clarification is read by nobody, whereas office_hours makes the
      owed round dispatchable and keeps the autonomous lane from decomposing
      unratified author-reserved substance into planned work. The precedent
      being followed is tactic-align-audit-legacy-review's third and fourth
      clarifications, where an autonomous session made author-reserved decisions
      while citing a direction no record corroborated and the sitting later
      classified it a scope over-read; the direction here is corroborated by the
      session transcript that landed this commit, and the ratification is still
      owed rather than assumed. (Recorded 2026-08-13)"
  - question: Which /align-family tactics serve this strategy, and which stay on
      strategy-graph-native-dispatch?
    answer: "The line is the skill boundary: /align records intent, so its tactics
      serve this strategy; /align-tactics turns recorded intent into
      dispatchable work and is a dispatch phase worker, so its tactics stay.
      Operationally — a tactic that changes what the interview elicits, or what
      the record must carry, serves this strategy; a tactic that changes how a
      session is claimed, planned, transitioned or merged stays on
      strategy-graph-native-dispatch. Landed 2026-08-13:
      tactic-align-review-skill and tactic-align-round-self-consistency-walk
      name this strategy FIRST and strategy-graph-native-dispatch second — an
      honest multi-entry serves per the artifact-owner rule, because each
      touches artifacts of both (graph-commit's --review flag and the
      self-consistency condition there, the /align skill here), and because a
      node-assigned session receives the doctrine it implements only through its
      serves chain, so dropping the second edge would strip the draft-review
      gate and self-consistency conditions from those tactics' own ancestry
      projection. tactic-align-strategy-new-steps-revision moves here outright
      from the parent, strategy-explicit-intent, as a refinement to a more
      specific home. Deliberately NOT moved, each for a stated reason:
      tactic-align-skill-draft-selectability-stale-prose is finished work — its
      closure condition was PR #3081, which merged 2026-08-13T19:35Z, and the
      corrected prose is live in .claude/skills/align/SKILL.md; re-homing it
      would have promoted a completed node to the top of the queue, so it stays
      put and a phase-done transition with completion evidence is owed instead.
      The five tactic-align-tactics-* nodes and
      tactic-align-session-claiming-liveness-correction are dispatch machinery.
      tactic-finding-search-all-producers cross-cuts six finding producers, of
      which /align Step 4 is only one. tactic-align-audit-skill serves
      strategy-graph-integrity, because the audit is an integrity instrument,
      not a discovery one. tactic-align-audit-legacy-review is already achieved
      with a prune owed. tactic-park-cause-sensor-instrument stays with the
      signal clause it instruments — see the signal clarification below.
      (Recorded 2026-08-13)"
  - question: Why a child of strategy-explicit-intent rather than of
      strategy-graph-native-dispatch, whose own statement names the align skill
      family?
    answer: "Two reasons carry the placement, and a third is its consequence rather
      than its justification. (1) Charter: strategy-graph-native-dispatch's
      charter is that orchestration state lives in intention nodes and dispatch
      runs on the graph; requirement discovery is not orchestration, and
      strategy-explicit-intent's rationale already names the align dialectic
      among its own artifacts. (2) Signal hygiene:
      strategy-graph-native-dispatch's success_signal reads its open children as
      a machinery-defect backlog ratio, so interview-quality tactics held there
      are counted as dispatch defects once phase-set. (3) The consequence the
      author asked for: a node's resolved score is its own authored boost plus
      its lineage's, so as a child of strategy-graph-native-dispatch this
      strategy's score would be its boost plus that strategy's 5.333 and every
      rerank of the router migration would silently move /align's priority with
      it; under strategy-explicit-intent, whose score is 0, the authored boost
      is the score. This is deliberately NOT stated as the decisive reason:
      kind-strategy calls parent structural nesting rather than roll-up and
      warns that a serves edge is a ranking act deserving weight-level care, so
      choosing structure to control the ranking function would record a
      workaround as doctrine. Reasons 1 and 2 stand alone; reason 3 is what
      makes the correct placement also the one the author wanted. Alternatives
      considered and rejected, recorded so they are not re-proposed as new: (a)
      a child of strategy-graph-native-dispatch with an authored boost of 3,
      which reaches the same rank today (3 + 5.333 = 8.333) — declined on
      reasons 1 and 2, not on arithmetic; (b) per-node boosts on the four
      tactics with no new node, which satisfies the author's rank requirement
      literally and cheaply, with no serves churn and no fingerprint change —
      declined because it gives future /align tactics no home and no inherited
      rank, which is a charter argument rather than a rank one; (c) the ideal
      greenfield, which is not this change at all —
      strategy-graph-native-dispatch carries 275 tactic children under one
      defect ratio, and the right design splits it by charter (recording
      surface, router and selection, session lifecycle) with this node as one of
      several children. This round is the migration path's first step, not the
      greenfield; carving out /align leaves 272. The greenfield is recorded here
      per .claude/rules/design-proposals.md and is owed its own round. (Recorded
      2026-08-13)"
  - question: Why does the record-gap signal clause stay on
      strategy-graph-native-dispatch when it measures this strategy's charter?
    answer: "Because moving it breaks a registered sensor and turns main red, and
      that coupling was invisible from the graph alone.
      strategy-graph-native-dispatch's success_signal.sensor string is the
      registry key that read-sensors.ts's LIFECYCLE_SENSOR_NAME mirrors
      character-for-character, guarded by
      packages/intentionsutil/test/lifecycle-sensor.test.ts; while the two
      differ the lifecycle sensor is de-registered by name and reads nothing at
      all — which is exactly what happened when the 2026-08-12 round appended
      that clause (56039748). This round's first draft moved the clause here and
      was caught by the adversarial draft review before landing. So the clause
      and its unimplemented instrument, tactic-park-cause-sensor-instrument,
      stay where they are for now. Migrating them is owed and cannot ride an
      /align round: the paired code change lands outside intentions/, which
      graph-commit does not carry, so it needs an ordinary tactic and a PR.
      Consequence recorded honestly in this node's own success_signal: its
      sensor is presently UNINSTRUMENTED here. The deeper defect is the
      mechanism — a registry keyed on verbatim node prose has now bitten three
      times — and the greenfield fix is to key sensors on a stable id carried on
      the node rather than on the sensor's own wording. (Recorded 2026-08-13)"
  - question: Was the id confusable with strategy-verified-requirements, and why keep it?
    answer: Considered and kept, with the risk recorded.
      strategy-discovered-requirements and strategy-verified-requirements differ
      by one word and both concern requirements, so mis-serving between them is
      a live routing risk; strategy-requirement-discovery and
      strategy-faithful-record were the alternatives weighed. The pairing is
      kept because it makes the boundary decidable from the names alone —
      discovery of what the author meant versus verification that a recorded
      requirement stays true — which is the same judgment the boundary
      clarification above exists to support, and each node's clarifications name
      the other. If a round is ever observed serving the wrong one, this
      disposition is the thing to revisit, and the rename is cheap while both
      nodes are young. The author has not weighed in on the name; it is part of
      what the owed ratifying round settles. (Recorded 2026-08-13)
tooling_goals: []
success_signal:
  observable: "a recording round's output carries downstream work with no author
    re-consultation: an /align-tactics session plans from the landed record
    alone, and a park attributable to the upstream recording round's own record
    gap is the visible failure of that"
  sensor: UNINSTRUMENTED as of 2026-08-13, stated rather than implied. The reading
    this signal wants is a park-cause count over office_hours.reason across
    parked nodes, counting /align-tactics parks attributable to an upstream
    recording round's own record gap — the reading that surfaced three such
    parks on 2026-08-12. It is not implemented anywhere
    (tactic-park-cause-sensor-instrument is the open tactic that would implement
    it), and the clause naming it is currently registered as part of
    strategy-graph-native-dispatch's lifecycle sensor string, which
    read-sensors.ts's LIFECYCLE_SENSOR_NAME mirrors character-for-character;
    migrating it here needs a paired code change outside intentions/ and is owed
  threshold: parks attributable to an upstream recording round's own record gap
    trend to zero
  is_proxy: true
attention:
  boosts:
    "1": 8
  rationale: "Author-directed 2026-08-13: rank /align's own improvement above the
    rsi cluster without lifting strategy-graph-native-dispatch's other open
    children. Measured at origin/main 33d6f779 —
    strategy-recursive-self-improvement authored 6 (resolved score 6),
    strategy-rsi-delegated-prioritization authored 1 on top of it (resolved
    score 7.5), strategy-graph-native-dispatch authored 5 (resolved score
    5.333). Band dominates score in the (tier, band, score, depth) key and a
    child bands on its parent's resolved score, so the rsi cluster's best band
    is 7.5 and an authored 8 clears it by 0.5. Two limits of that figure are
    recorded rather than left to be rediscovered. FIRST, 7.5 is the top of the
    SELECTABLE tier-1 field, not of tier 1: the tactic-attention-surface-*
    cohort resolves to band 8.5 and is invisible to the router only because
    those nodes are office-hours parked, so an unpark restores four nodes above
    this cohort. SECOND, this node's own band is 0, since
    strategy-explicit-intent carries no boost — so its own /align-tactics
    decomposition round ranks far below the rsi cluster even though its children
    outrank it. That is accepted: /align tactics are minted by interview rather
    than by decomposition, so the pipeline does not run through this node's own
    round. It is also an instance of the band-derivation question already owed
    at tactic-review-band-derivation-ratification (band derives from parents'
    RESOLVED score, so a node under an unauthored parent is structurally banded
    to 0); re-validate the two together there, not here. The value is absolute
    rather than parent-relative, unlike strategy-rsi-delegated-prioritization's
    deliberate +1: under a score-0 parent the authored figure IS the resolved
    score. kind-kind calls boosts a relative claim, so the invariant the number
    encodes is written as a condition on this node instead of being left
    implicit in the scalar. No recovers edge is authored, so no capture term
    inflates it — the surprise recorded on
    strategy-rsi-delegated-prioritization, where a same-round recovers edge
    silently added 0.5. This lifts tier 1 only; a bug_fix, security or
    strategy-main-health node still preempts on the tier axis, which is
    intended."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: Born-parked at creation 2026-08-13. This node's substance — statement,
    conditions, success_signal and the authored boost of 8 — is Claude-drafted
    from a design conversation and directed by the author with "execute
    recommendation", but it has NOT been through an /align interview, and
    strategy-explicit-intent reserves strategy substance for the author with
    agent assistance as drafting, never derivation. The park keeps the
    autonomous lane from decomposing unratified author-reserved substance into
    planned work; it does NOT hold up the round's purpose, since the tactics
    serving this node are unparked and already carry the intended band of 8.
  since: 2026-08-13
  recommendation: "Run /align against strategy-discovered-requirements to ratify
    or rework its statement, conditions, signal and boost, then clear the park.
    Four things are specifically owed at that sitting: (1) ratify or rework the
    id, weighed against the confusable sibling strategy-verified-requirements;
    (2) rule on whether the /align actuator tooling_goal and the
    draft-review-gate and self-consistency conditions should migrate here from
    strategy-graph-native-dispatch, which is the half of the re-homing this
    round deliberately did not do; (3) confirm the boost of 8 against the
    then-current rsi band and the parked 8.5 cohort; (4) decide whether the
    greenfield recorded in clarification 3 — splitting
    strategy-graph-native-dispatch by charter — is worth its own round."
  session_type: other
pace_exempt: false
rounds: null
attributes:
  conditions:
    - "the /align interview stays non-delegable — a human author is present and
      the elicitation is a dialectic, not a form. If the interview is ever run
      unattended, re-derive this strategy from its virtues rather than defend
      it: its whole charter presumes a person whose intent is being discovered
      (Recorded 2026-08-13)"
    - the graph record stays the SOLE carrier from a recording round to every
      downstream session — no session memory, no side channel, no author
      re-consultation. If a durable side channel is introduced, the
      capture-completeness half of this strategy loses its point and must be
      re-derived (Recorded 2026-08-13)
    - "the authored boost of 8 encodes a RELATION the scalar cannot hold —
      'ranks above the rsi cluster's band' — not an absolute worth. The
      mechanism stores only a number, so this condition is where the invariant
      lives: if strategy-recursive-self-improvement or
      strategy-rsi-delegated-prioritization is reranked such that their band
      reaches 8 or above, this figure is stale and must be re-derived rather
      than defended. A single +1 on the rsi parent is enough to invert it
      silently, and that node's boost already moved 4 to 6 inside one month
      (Recorded 2026-08-13)"
---
# The author's requirement is discovered under interview and recorded completely enough that the record alone carries it

## The roles this strategy owns

`/align`'s charter is wider than elicitation. The roles below are the settled
scope, read off `.claude/skills/align/SKILL.md` at origin/main `33d6f779`; they
are listed here so a tactic's placement is decidable without re-reading the
skill.

1. **Framing** (Step 1) — classify the input as a new strategy or an amendment
   to an existing one; with no prompt, the onboarding funnel that orients,
   validates the deployment, and walks the author to a crafted prompt before
   falling through into the interview.
2. **The dialectic** (Step 2) — the Socratic elicitation that fixes intent,
   placement, benefit, signal and conditions, with its interview-type
   classification, its question mechanics, and its deferral mechanics. This is
   the non-delegable core and the reason the skill is whole-session Opus.
3. **Delegation-capture advice** (Step 3) — what the round's subject delegates,
   and whether that delegation is being deepened or unwound.
4. **Byproduct retention** (Step 4) — tactical byproducts retained as draft
   tactic nodes rather than lost with the session, deduped against the open
   tactic set before minting.
5. **Recording** (Step 5) — the landing itself: freeze classification, the
   delegation-sweep disposition, round provenance, and `graph-commit`.
6. **Completeness discharge** (Step 6) — the requirement-clause coverage walk
   that discharges the record-completeness contract.
7. **Adversarial draft review** — the independent second reader placed against
   the draft before it lands. Doctrine home is the gate condition on
   `strategy-graph-native-dispatch` (2026-08-11); the implementation is
   `tactic-align-review-skill`, which serves this strategy.

Roles 2, 6 and 7 carry the charter: discovery, completeness, and independent
challenge. Roles 1, 3, 4 and 5 are the mechanics that serve them.

The list is complete against SKILL.md's step headings with one deliberate
exclusion, stated so a future tactic's placement stays decidable: **Step 0 —
Claim and isolate** (`SKILL.md:71`) is dispatch machinery, not discovery. It is
the same worktree-claim mechanism every phase worker uses, so a defect in it
serves `strategy-graph-native-dispatch` — which is why
`tactic-align-session-claiming-liveness-correction` stayed there.

## What is deliberately not here

`/align-tactics` — decomposing a recorded strategy into dispatchable tactic
subtrees — is a dispatch phase worker and stays on
`strategy-graph-native-dispatch`. The boundary rule and the node-by-node
disposition are the second clarification in frontmatter.

The half of the re-homing this round deliberately did **not** do: the `/align`
actuator `tooling_goal`, the draft-review-gate condition, and the
self-consistency condition all still live on `strategy-graph-native-dispatch`.
Moving doctrine is a bigger claim than moving tactics and belongs to the author's
ratifying round, not to a background session — it is item (2) in this node's
park recommendation. Until then the two tactics that implement that doctrine
carry a second `serves` edge to `strategy-graph-native-dispatch` so their
ancestry projection still delivers it.

`/align-audit` is an integrity instrument and stays on
`strategy-graph-integrity`: it never interviews and never rewrites strategy
substance, so it answers "is the record coherent", not "is the record what the
author meant".

## Rank

This node carries an authored tier-1 boost of 8, which reaches every tactic
serving it by lineage rather than by per-node boosts — the mechanism
`strategy-graph-review-curriculum`'s own attention rationale describes. The
figure, its measurement, and why it is absolute rather than parent-relative are
in the `attention.rationale`; nothing here restates them.
