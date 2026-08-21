---
id: tactic-align-tactics-premise-preflight
kind: tactic
statement: The cost of an /align-tactics run that parks on an unratified premise
  is reduced upstream at record time — by the align round's self-consistency
  walk and the ordering-inversion lint — not by reordering /align-tactics, whose
  premise refusal is Side B of the drift review and cannot precede the gather
  evidence all three of its reasoning phases consume
owner: ai
status: raw
parent: null
rationale: "Retained (retain-not-refine) from the 2026-08-12 /align interview
  that recorded the self-consistency condition on
  strategy-graph-native-dispatch. The artifact is the /align-tactics skill,
  owned by that strategy. Unlike its two sibling mechanisms this one does not
  prevent the defect — it reduces the cost of discovering one: the 2026-08-12
  /dispatch-ladder run spent roughly 13 minutes of Opus before parking
  tactic-attention-namespaced-rank (2184103c) on a premise that was already
  unratified when the session started. UNVERIFIED PREMISE, flagged at record
  time by the recording session: the saving assumes the blocking-premise check
  can legally run before the drift review, which was NOT confirmed against
  /align-tactics' actual step order during the interview. A planning session
  must establish that ordering first; if the drift review is a prerequisite of
  premise detection, this tactic reduces to a smaller saving or to nothing.
  RECURRENCE 2026-08-14, second observed instance — recorded here rather than
  minted as a second node, per the find-before-minting rule and the whole-graph
  search set recorded on strategy-graph-native-dispatch the same day. A
  /dispatch-ladder run on tactic-align-review-skill spent 964s (16m04s) of Opus
  inside /align-tactics, 53.6% of the 1800s default await window
  (dispatch-ladder-run:372), and advanced zero rungs before parking on an
  unratified premise: the --review gate's discrimination mechanism (parked
  4e7131f1, cleared fe3ad88c once the author ratified option (a), the
  caller-declared seam). Same shape as the 2026-08-12 instance — the premise was
  already unratified when the session started — and 24% costlier; cumulative
  measured spend across the two instances is roughly 1744s. This instance does
  NOT settle the unverified premise above, and this round declines to claim that
  it does. The contradiction's STATEMENT is a two-document read — this node's
  item 3 against the serving strategy's scoping ruling, both readable without
  the drift review — but the park's own CONFIRMATION of it required verifying
  the item-3 predicate against five caller implementations in the codebase (the
  park text records 'Verified against origin/main d5770f6e' for /align-tactics,
  qa-fix, dispatch-diagnose-main, dispatch-eval-finding and /context-chunks).
  Whether a blocking-premise check placed before the drift review would have
  reached that confirmation cheaply was the ordering question that instance left
  open. RECONCILED 2026-08-21 (/align-tactics per-node drift review): it is no
  longer open. Clarification 3 settled it on 2026-08-14 and withdrew the
  reordering mechanism on structural grounds, and this round re-verified those
  grounds against current HEAD — buildDriftPrompt :699 (called :1126),
  buildDecomposePrompt :837 (called :1170) and buildPlanPrompt :928 (called
  :1225) all consume gather, so gather is the RUN's input and no premise check
  can precede it as a reordering. The sentence this replaces was stale residue
  from the pre-2026-08-14 record, not live disagreement; what this node carries
  forward is its measured_impact as cost evidence, not a mechanism claim."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Can the blocking-premise check legally run before the drift review, as
      this tactic's statement assumes — the UNVERIFIED PREMISE flagged at record
      time?
    answer: "Largely answered by reading on 2026-08-14, in the 'reduces to a smaller
      saving' direction the flag anticipated; the residue is narrower than the
      original question. Three facts, established against
      .claude/workflows/align-tactics.js at that date. ONE — there is no
      separate blocking-premise check to reorder. Premise detection IS Side B of
      the drift review (buildDriftPrompt, align-tactics.js:699); the two-sided
      review is one agent call, so 'run the premise check before the drift
      review' asks to move a step ahead of the step it is part of, and is not a
      coherent reordering. TWO — the drift review already runs early. The phase
      order is gather (:1047), drift (:1124), decompose (:1168), plan (:1202),
      assemble (:1262). A Side B park sets proceed=false, so decompose and plan
      — the Opus-heavy phases — never ran in either observed instance. The
      statement's saving ('parks cheaply instead of after a full-length
      session') therefore assumes a cost that was not being paid. THREE — the
      real ordering dependency is on gather, not on decompose or plan.
      buildDriftPrompt takes gather as an argument (called at :1126) and
      instructs the agent to reason over 'the gather-phase evidence'.
      Concretely, candidate_premises is a REQUIRED field of CORPUS_SCHEMA (:122,
      item type :137), emitted by the gather corpus agent (:670), collected at
      :1110 and bundled into gather at :1120 — it is literally the candidate
      premise list Side B sweeps. Gather is unconditional and first (:1049-1092:
      up to three reuse hunts, one corpus scan, one clause-coverage agent, all
      model sonnet, agentType general-purpose, run under parallel()), so every
      park pays gather in full and nothing can park ahead of it. Consequence for
      this tactic: the available saving is skipping GATHER, not reordering
      against the drift review, and its size is bounded by gather's share of a
      parking run rather than by the whole session. A planning round should
      re-scope the statement to that seam before decomposing it. What remains
      open is not the ordering — that is settled — but whether Side B can still
      reach a correct park with gather's evidence withheld; see the sibling
      clarification recording the experiment that would settle it."
  - question: What would settle the remaining question — whether Side B can park
      correctly without gather's evidence — and what does that experiment
      involve?
    answer: "Recorded 2026-08-14. Three components, one of them decisive and cheap.
      DECISIVE REPLAY: re-run buildDriftPrompt
      (.claude/workflows/align-tactics.js:699) on the two observed parking
      instances — tactic-align-review-skill (parked 4e7131f1, cleared fe3ad88c)
      and tactic-attention-namespaced-rank (parked 2184103c) — under two
      conditions each: gather populated as the real run produced it, versus
      gather stubbed empty ({reuse: [], corpus: {existing_children,
      candidate_premises: [], corpus_hits: []}, clause: {reuse_candidates: [],
      notes: ''}}). Then check whether Side B still emits the same material
      unrecorded premise and the same requirement-ambiguity park. This is
      offline and costs four Opus agents: buildDriftPrompt is a pure function,
      and both nodes plus their serving strategy are readable at known commits
      (the tactic-align-review-skill park text pins its own verification base at
      origin/main d5770f6e). READING: if the park still fires with gather empty,
      the check is gather-independent and a pre-gather refusal is real —
      re-scope the tactic to that seam. If it does not fire, gather is a
      prerequisite of premise detection and this tactic 'reduces to a smaller
      saving or to nothing', exactly as the record-time flag allowed; prune it.
      MISSING MEASUREMENT: a per-phase cost split (gather versus drift) for a
      parking run, which is what sizes the saving even on a positive result. NOT
      recoverable for the 2026-08-14 instance — no Workflow journal.jsonl and no
      wf_* transcript directory survives for that window under /home/n8/.claude,
      searched 2026-08-14 — so this needs a fresh instrumented run or retained
      Workflow journals. RESIDUAL RISK, to weigh even if the replay is positive:
      Side B's own discriminator is plan_depends ('does a plan actually depend
      on it'), but no plans exist at drift time either, so the agent is ALREADY
      anticipating. A pre-gather check inherits that same anticipation problem
      with strictly less evidence, and whether it can hold the
      material/immaterial line without corpus evidence is the substantive design
      question a plan must answer. PRIOR: this session expects the replay to
      come back gather-dependent. The tactic-align-review-skill park did not
      merely assert a contradiction — it CONFIRMED one by verifying the item-3
      predicate against five caller implementations across the codebase, which
      is precisely the evidence gather's reuse hunts and corpus scan exist to
      produce. That is an expectation from one instance, not a result, and it
      does not substitute for running the replay."
  - question: The verification experiment is expensive relative to what it decides.
      Can the design be settled without running it, and what does that
      settlement leave standing?
    answer: "Settled 2026-08-14 without running the replay; the reordering mechanism
      this node originally proposed is WITHDRAWN, and the node is retained as
      the cost evidence redirecting that mechanism upstream. The withdrawn
      statement was: '/align-tactics runs its blocking-premise check before the
      drift review and decomposition, so a node that cannot be planned parks
      cheaply instead of after a full-length session'. STRUCTURAL GROUNDS, which
      hold whichever way the replay would have gone. ONE — there is nothing to
      reorder against. gather is not the drift review's input, it is the RUN's
      input: buildDecomposePrompt(strategy, drafts, gather, drift) at
      .claude/workflows/align-tactics.js:837 (called :1170) and
      buildPlanPrompt(strategy, tactic, gather, mode) at :928 (called :1225)
      consume it alongside buildDriftPrompt at :699 (called :1126). A shared
      prerequisite of all three reasoning phases cannot be made conditional on a
      park that only Side B is positioned to declare, so any premise check
      placed ahead of it is an ADDITIVE agent call on every run, not a
      reordering of calls already made. TWO — the expected value is marginal on
      those terms. A preflight paid on every run to save gather on the minority
      that park is net-positive only if its cost is below the parking rate times
      gather's cost, and gather is five parallel sonnet agents (:1049-1092), not
      the run's dominant expense. THREE — the error costs are asymmetric in the
      wrong direction. A false negative is free: the run falls through to the
      real Side B. A false positive parks a node Side B would have cleared,
      costing a full park cycle plus author attention at office hours — strictly
      more than the gather it saved. A pre-gather check sees strictly less
      evidence than Side B, so it inflates precisely the false-positive rate
      that carries the asymmetric cost. PREDICTION for the declined replay,
      recorded so a later round can see what was expected rather than assume the
      question was ducked: Side B with gather stubbed empty does NOT reproduce
      either park, i.e. the check is gather-dependent. Basis: the
      tactic-align-review-skill park did not merely assert its contradiction, it
      CONFIRMED it by verifying the item-3 predicate against five caller
      implementations (its park text records 'Verified against origin/main
      d5770f6e'), which is gather's corpus-and-reuse territory; a pre-gather
      agent holds the node text and the strategy text and nothing else. This
      prediction is a tiebreaker, not the ground — grounds ONE through THREE
      settle the design either way, which is why the experiment was declined
      rather than merely deferred. If a future round has cause to reopen this,
      the sibling clarification records the replay design in full and it remains
      runnable at four Opus agents. WHAT THE SETTLEMENT LEAVES STANDING. The
      measured cost is real and unaddressed: 1744s of autonomous Opus across two
      instances for zero ladder rungs. Both parked on a premise that was ALREADY
      UNRATIFIED WHEN THE SESSION STARTED — upstream of any /align-tactics
      scheduling — so an upstream mechanism avoids the whole of that spend
      rather than gather's fraction of it. The mechanisms already exist as draft
      siblings retained by the same 2026-08-12 clarification on
      strategy-graph-native-dispatch: tactic-align-round-self-consistency-walk
      (the record-time walk) and tactic-validate-graph-ordering-inversion-lint
      (the mechanical backstop). This node's measured_impact is the cost
      evidence that prioritizes those two, and its own mechanism claim is
      withdrawn in their favour. SCOPE LIMIT PRESERVED: this does not reopen the
      ratified /align versus /align-tactics boundary. Both observed parks turned
      on the node's own item contradicting its serving strategy's ruling — an
      INTERNAL CONSISTENCY defect, inside what an align round already owes for
      its own output — not the plannability judgment the 2026-08-12 SCOPE LIMIT
      declined to assign it. The redirect is to a duty /align already holds, not
      a new one."
  - question: Does the serving strategy's ARMED maintenance-burden band still hold,
      measured fresh at this round?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review on
      tactic-align-tactics-premise-preflight.) THIRD independent same-day
      reproduction of the serving strategy's maintenance-burden band failure,
      measured on this worktree at 3313bc46 by a hand scan over intentions/*.md
      frontmatter applying census.ts:13-40's classifyTactic rules verbatim
      (phase 'done' -> done; phase non-null -> open; phase null with
      office_hours null -> draft; else born-parked): 316 tactics serve
      strategy-graph-native-dispatch — 97 done, 91 draft, 84 open, 44
      born-parked — giving backlog (84 open + 44 born-parked) / 316 = 40.5%.
      That is above the author-declared 35% ceiling and ABOVE both earlier
      same-day readings (fd98fd26 at 38.5%, 481572f1 at 124/315 = 39.4%), so the
      required non-increasing limb now fails within the day's own three samples,
      not merely against the recorded 2026-08-10 snapshot. The strategy's
      recorded reading (58/236 = 24.6%, series 47.6 -> 38.2 -> 31.4 -> 24.6) is
      stale by roughly 16 points and must not be read as current. The instrument
      is not in doubt: census.ts's classifyTactic/strategyBacklogBand was
      confirmed correct by both prior parks reproducing the 2026-08-10 sample
      exactly before re-measuring; the drift is in the strategy's snapshot, not
      the measurement code."
  - question: Does the per-node drift gate interact with the backlog it parks over,
      and if so how is that recorded rather than acted on?
    answer: "(Recorded 2026-08-21 /align-tactics per-node drift review.) This is the
      FOURTH per-node round in a single day to park on a strategy-level
      condition failure it re-derived independently:
      tactic-graph-commit-park-content-durability (fd98fd26) and
      tactic-supersession-retirement-sweep (481572f1) on this strategy's
      maintenance-burden band, tactic-align-round-self-consistency-walk
      (3313bc46) on strategy-discovered-requirements' authored-boost condition,
      and now this node on the band again. OBSERVATION, gating nothing and
      offered for the author's disposal rather than as a ruling: the per-node
      drift gate re-measures the same strategy-level failure once per selected
      node, so one author decision is discovered N times at N autonomous
      sessions' cost, and each such park converts a draft (denominator only)
      into a born-parked node (numerator and denominator) — parking this node
      moves the band from 128/316 = 40.5% to 129/316 = 40.8%. The gate's
      designed response to a backlog-band failure therefore increments the
      backlog it is responding to. This is recorded here rather than acted on:
      the Side A contract is categorical and three sibling rounds applied it the
      same way, so diverging alone would be exactly the autonomous-substance
      overreach clarification 245 exists to prevent. The four parks are
      disposable in one sitting."
  - question: Does anything in this round reopen the settled ordering question or
      the withdrawn reordering mechanism?
    answer: "(Re-verified 2026-08-21 against .claude/workflows/align-tactics.js at
      3313bc46.) The ordering question this node was minted to settle remains
      SETTLED, and nothing in this round reopens it — the citations in the
      node's third clarification still resolve exactly: buildDriftPrompt at :699
      (called :1126), buildDecomposePrompt at :837 (called :1170),
      buildPlanPrompt at :928 (called :1225), with candidate_premises a required
      CORPUS_SCHEMA field at :122/:137 collected at :1110. Gather is the RUN's
      input consumed by all three reasoning phases, not the drift review's
      private prerequisite, so no premise check can be placed ahead of it as a
      reordering; any such check is an additive agent call on every run. The
      mechanism claim stays WITHDRAWN and the node stays a cost-evidence record
      redirecting to tactic-align-round-self-consistency-walk and
      tactic-validate-graph-ordering-inversion-lint. Consequence for the
      eventual finalize: the body_markdown this node wants is a short retirement
      note citing intentions/kind-tactic.md's retirement doctrine, not a
      units-of-work plan — PLAN_SCHEMA offers no 'retire in place,
      evidence-only' category, and padding units onto a settled finding would
      manufacture machinery backlog against a band already failing."
  - question: Are there contradictions inside this node's own record that the
      disposing sitting should reconcile?
    answer: (Found 2026-08-21 /align-tactics per-node drift review; free to catch,
      so recorded per clarification 227's self-consistency duty rather than left
      for a later session to rediscover.) This node's own record contradicts
      itself in two places and should be reconciled at the same sitting that
      disposes the park. FIRST, the rationale still closes with 'Whether a
      blocking-premise check placed before the drift review would have reached
      that confirmation cheaply is exactly the ordering question a planning
      session must establish first, and it remains open' — while the frontmatter
      statement and the third clarification both record the question as settled
      2026-08-14 and the mechanism as withdrawn. SECOND, the markdown body's H1
      is still the WITHDRAWN statement verbatim ('/align-tactics runs its
      blocking-premise check before the drift review and decomposition, so a
      node that cannot be planned parks cheaply instead of after a full-length
      session'), which the third clarification explicitly quotes as the claim it
      retired. Both are stale residue from the pre-2026-08-14 record, not live
      disagreement; neither changes the disposition, and no plan depends on
      either.
  - question: What did the caller thread verify independently of the Workflow, and
      what changed between the Workflow's read and this round's landing?
    answer: "(Recorded 2026-08-21 by the /align-tactics caller thread, after the
      Workflow returned.) FOUR verifications and one new fact. ONE — the band
      measurement was reproduced through the canonical helper rather than a hand
      scan: listNodes(\"intentions\") fed to strategyBacklogBand
      (packages/intentionsutil/src/census.ts:26) returned backlog 128, total
      316, pct 0.4051 at origin/main 3313bc46 — matching the drift agent's
      independent hand scan of 97 done / 91 draft / 84 open / 44 born-parked
      exactly — and 130/316 = 41.1% after freshening to origin/main 787782c5.
      TWO — Side B's prune-exposure claim was checked leg by leg and holds:
      isLedgerEntry (packages/intentionsutil/src/schema.ts:535-538) returns
      node.kind === \"tactic\" && attributes.ledger_entry === true;
      graph-census-debt.ts:179 gates donePresent on phase === \"done\" &&
      !isLedgerEntry(n) && !isLiveRearmTarget(n); and tactic-eval-finding-ledger
      is at phase implement, unlanded. kind-tactic.md:240-245's retirement
      doctrine is written in the ledger-entry context, which is exactly why it
      does not protect a measured_impact carrier that lacks the flag. THREE —
      the count of nodes blocked on this same condition is FIVE, not three:
      enumerated at 787782c5 by scanning every tactic office_hours.reason and
      keeping only parks blocked ON the band, the set is
      tactic-supersession-retirement-sweep,
      tactic-graph-commit-park-content-durability,
      tactic-align-tactics-drift-dump-office-hours,
      tactic-align-tactics-immaterial-drift-redirect, and this node. The
      counting trap is real — fifteen nodes mention the band in their park
      reason and six of those are -drift-observations carriers that merely quote
      it. FOUR, and NEW since the Workflow read its corpus — one of the two
      upstream mechanisms this node exists to prioritize has already moved:
      tactic-validate-graph-ordering-inversion-lint is now status: codified,
      phase: implement, serving strategy-graph-integrity, finalized between this
      round's gather and its landing; tactic-align-round-self-consistency-walk
      is born-parked serving strategy-discovered-requirements. Neither serves
      strategy-graph-native-dispatch any more. Clarification 3 above, which
      calls them \"draft siblings retained by the same 2026-08-12 clarification
      on strategy-graph-native-dispatch\", is therefore stale on both halves —
      the sibling relation and the strategy. That does not change the
      disposition; it strengthens it, because the redirect this node argues for
      is now half-consumed."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    TWO drift blockers stop this per-node finalize; both need an author ruling,
    and a tactic-target session never writes the serving strategy, so both are
    recorded here on the target.


    (A) SIDE A, MAJOR SCOPE DEVIATION — the serving strategy's ARMED
    maintenance-burden band condition FAILS on both limbs, so this round would
    plan against a dead premise. The condition declares: "the open
    machinery-defect population — open (phase set, not done) plus born-parked
    tactics serving this strategy — stays at or below 35% of all tactics serving
    this strategy, and is non-increasing across consecutive samples", ARMED
    2026-08-05 at 59/197 = 30.0%. MEASURED TWICE, INDEPENDENTLY, THIS ROUND. The
    Workflow's drift agent hand-scanned intentions/*.md frontmatter applying
    census.ts:13-40's classifyTactic verbatim at origin/main 3313bc46 and got
    316 tactics serving strategy-graph-native-dispatch (97 done, 91 draft, 84
    open, 44 born-parked), backlog 128/316 = 40.5%. This caller thread ran the
    canonical path instead — listNodes("intentions") fed to strategyBacklogBand
    (packages/intentionsutil/src/census.ts:26, the same helper
    read-sensors.ts:707 uses) — and reproduced 128/316 = 40.5% exactly at that
    same tree, then RE-MEASURED after freshening to origin/main 787782c5 and got
    backlog 130, total 316 = 41.1%. Both limbs fail: 41.1% breaches the 35%
    ceiling, and the same-day series 38.5% (fd98fd26) -> 39.4% (481572f1) ->
    40.5% (3313bc46) -> 41.1% (787782c5) is monotonically RISING, so the
    non-increasing limb fails within the day's own four samples and not merely
    against the strategy's stale 2026-08-10 snapshot of 58/236 = 24.6%. The
    instrument is not in doubt — a sibling round validated strategyBacklogBand
    by replaying it at commit 5588b62d and reproducing that recorded 24.6%
    sample exactly — so the drift is in the strategy's stored reading, which is
    stale by roughly 16 points and must not be read as current. The condition's
    own text makes this an author decision, not a session's: "A burden growing
    without bound is this condition FAILING (which parks the strategy for an
    author decision), not merely more work to do." That decision belongs on the
    strategy node, which a tactic-target session may not write.


    FIFTH NODE BLOCKED ON THIS ONE CONDITION, enumerated at origin/main 787782c5
    by scanning every tactic's office_hours.reason and keeping only parks
    actually BLOCKED ON the band (not the six -drift-observations carriers that
    merely mention it): tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect, and now this node. One
    ruling clears all five. A sixth park the same day,
    tactic-align-round-self-consistency-walk, is blocked on a DIFFERENT failed
    condition (strategy-discovered-requirements' authored-boost condition) and
    is not cleared by this ruling.


    THE COMPOUNDING LOOP, recorded because it is invisible from inside any
    single round and bears directly on the ruling. classifyTactic
    (packages/intentionsutil/src/census.ts:13-18) scores born-parked as backlog
    and draft as neither, so a Side-A park converts its target from
    denominator-only into the numerator. Parking THIS node moves the band from
    130/316 = 41.1% to 131/316 = 41.5%. The gate's designed response to a
    backlog-band failure therefore increments the backlog it is responding to,
    and each of the five parks above did the same — which is why the series
    rises monotonically across them. No autonomous lane can exit this: the Side
    A contract is categorical, four sibling rounds applied it identically, and
    diverging alone would be exactly the autonomous-substance overreach
    clarification 245 exists to prevent. So this round applies the contract and
    records the loop rather than acting on it.


    (B) SIDE B, MATERIAL UNRECORDED PREMISE — the terminal disposition this node
    actually wants is not mechanically safe today. The node's mechanism claim is
    withdrawn (settled 2026-08-14, clarification 3); what remains is a
    cost-evidence record whose whole value is attributes.measured_impact (1744s
    of autonomous Opus across two instances for zero ladder rungs). Retiring it
    to phase "done" assumes intentions/kind-tactic.md's retirement doctrine —
    "An entry retires by transitioning to phase: done with measured_impact
    intact. Nothing is reset" (kind-tactic.md:240-245) — protects any
    measured_impact carrier. It does not, and this caller thread verified each
    leg: isLedgerEntry (packages/intentionsutil/src/schema.ts:535-538) keys on
    attributes.ledger_entry === true, and graph-census-debt.ts:179 exempts ONLY
    isLedgerEntry and isLiveRearmTarget from donePresent, so a phase: done node
    carrying measured_impact but no ledger_entry lands on the owed-prune
    candidate list like any finished tactic. The retirement doctrine is written
    in the LEDGER-ENTRY context, which is precisely why it does not reach this
    node — this node carries no ledger_entry. The generalization that would fix
    it, tactic-eval-finding-ledger (re-keying the exemption to measured_impact
    presence, whoever wrote it), is at phase implement and NOT landed. So
    finalizing to done before that lands puts the 1744s of evidence on the prune
    list — a candidate list a human acts on rather than an automatic delete, but
    the exact list this node must never appear on.


    DISCOVERED AFTER THE WORKFLOW RAN, and it strengthens the disposition rather
    than changing it: one of the two upstream mechanisms this node exists to
    prioritize has already moved. tactic-validate-graph-ordering-inversion-lint
    is now status: codified, phase: implement (finalized between this round's
    gather and its landing) serving strategy-graph-integrity;
    tactic-align-round-self-consistency-walk is born-parked serving
    strategy-discovered-requirements. Neither serves
    strategy-graph-native-dispatch any more — clarification 233's 2026-08-14
    amendment records the edge drop and its reason — so this node's
    clarification 3, which calls them "draft siblings retained by the same
    2026-08-12 clarification on strategy-graph-native-dispatch", is stale on
    both halves. The redirect it argues for is already half-consumed.


    NOT A REASON FOR THIS PARK, recorded so it is not re-litigated: the ordering
    question the node was minted to answer is SETTLED, and was re-verified this
    round against current HEAD — buildDriftPrompt :699 (called :1126),
    buildDecomposePrompt :837 (called :1170) and buildPlanPrompt :928 (called
    :1225) all still consume gather, so gather is the RUN's input and no premise
    check can precede it as a reordering. Nothing here reopens the withdrawal.


    PLACEMENT OF THIS ROUND'S IMMATERIAL OBSERVATIONS WAS DELIBERATE: they are
    folded into this node's own clarifications and its body's round-record
    section rather than minted as a born-parked observation carrier.
    Clarification 245/V1's invariant — no autonomous write to the serving
    strategy's clarifications — is satisfied either way, and minting a carrier
    when the park's own reason is a backlog-band breach would write a new
    born-parked node into the very numerator this park is about.
  since: 2026-08-21
  recommendation: >-
    Four steps, in order; the first is the only one that needs a decision.


    (1) RULE ON THE BAND — this is the blocking decision and it clears five
    parks at once (tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect, and this node). Three
    dispositions, stated so the sitting is a choice rather than a re-derivation:
    (a) RE-AFFIRM 35% and halt new machinery decomposition on this strategy
    until the backlog drains below it — the condition read literally, accepting
    that the lane stays closed; (b) RE-DECLARE the band against the grown
    population — the condition was armed at 59/197 = 30.0% when the strategy had
    197 tactics and now measures 130/316 = 41.1% at 316, so a band set against
    the 2026-08-05 population may simply be the wrong number for a strategy that
    has since grown 60%; (c) ACCEPT the breach with remediation — keep 35% as
    the target, declare an explicit drain plan (which of the 130 backlog nodes
    prune, which finish), and un-park the five. Weigh (a) against the
    compounding loop recorded in the reason: under (a) every further
    /align-tactics round on this strategy parks and each park adds one to the
    numerator, so the lane does not merely stall, it measurably worsens the
    metric that closed it. This session takes no position between the three —
    the condition is human-decided (condition 4) and a per-node session may not
    write the strategy.


    (2) FOR THIS NODE SPECIFICALLY, once the band is ruled, the disposition is
    cheap and needs NO plan: retire it to phase "done" with
    attributes.measured_impact intact, and replace the body with a short
    retirement note citing kind-tactic.md's retirement doctrine and redirecting
    to tactic-align-round-self-consistency-walk and
    tactic-validate-graph-ordering-inversion-lint. Do NOT author units of work.
    The finding is settled, the mechanism is withdrawn, and PLAN_SCHEMA has no
    "retire in place, evidence-only" category — padding units onto a settled
    finding would manufacture exactly the machinery backlog the failing band
    measures.


    (3) SEQUENCE THAT RETIREMENT SAFELY. Retiring to done today puts the 1744s
    of evidence on the owed-prune candidate list, per Side B of the reason.
    Three ways out, cheapest first: stamp attributes.ledger_entry: true on this
    node as an interim exemption (legacy-compatible per
    tactic-eval-finding-ledger's own plan, and a one-field write); or sequence
    the retirement AFTER tactic-eval-finding-ledger lands its re-keying of the
    exemption to measured_impact presence (it is at phase implement); or leave
    the node open until then. Whichever is chosen, do not retire it unprotected.


    (4) WHILE THE NODE IS OPEN, its two internal contradictions are already
    reconciled by this round and need no further action — noted here only so the
    sitting does not re-find them. The rationale's closing sentence said the
    ordering question "remains open" while the statement and clarification 3
    record it as settled 2026-08-14; that sentence is amended in this round's
    write. The markdown H1 was still the withdrawn statement verbatim; the body
    is replaced in this round's write. Both were stale residue from the
    pre-2026-08-14 record, not live disagreement.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes:
  measured_impact:
    - metric: align_tactics_s_before_park
      value: 964
      unit: seconds
      window: tactic-align-review-skill ladder 2026-08-14T14:57:37Z..15:13:41Z
      sensor: events.jsonl launched-to-halt delta
      measured: 2026-08-14
    - metric: ladder_rungs_advanced_for_that_spend
      value: 0
      unit: count
      window: tactic-align-review-skill ladder 2026-08-14
      sensor: events.jsonl
      measured: 2026-08-14
    - metric: share_of_await_window_consumed
      value: 0.536
      unit: fraction
      window: tactic-align-review-skill ladder 2026-08-14, 1800s default TIMEOUT_S
        (dispatch-ladder-run:372)
      sensor: events.jsonl + dispatch-ladder-run default
      measured: 2026-08-14
    - metric: align_tactics_s_before_park_prior_instance
      value: 780
      unit: seconds
      window: tactic-attention-namespaced-rank ladder 2026-08-12, park 2184103c —
        approximate, 'roughly 13 minutes' as recorded in this node's rationale
      sensor: node rationale
      measured: 2026-08-12
    - metric: instances_observed
      value: 2
      unit: count
      window: 2026-08-12..2026-08-14
      sensor: graph read + events.jsonl
      measured: 2026-08-14
    - metric: cumulative_autonomous_s_before_park
      value: 1744
      unit: seconds
      window: 2026-08-12 and 2026-08-14 instances combined
      sensor: events.jsonl + node rationale
      measured: 2026-08-14
---
# The cost of an /align-tactics run that parks on an unratified premise is reduced upstream at record time, not by reordering /align-tactics

**This node is parked, not planned — and deliberately carries no plan.** Its
original mechanism claim (reordering `/align-tactics`' premise check ahead of the
drift review) was WITHDRAWN on 2026-08-14; see frontmatter clarification 3 for
the three structural grounds. What the node carries forward is the measured cost
evidence in `attributes.measured_impact`: 1744s of autonomous Opus across two
instances for zero ladder rungs. There are no units of work here and none should
be authored — see `office_hours.recommendation` step (2).

The previous body was a single H1 reproducing the WITHDRAWN statement verbatim,
which contradicted the frontmatter `statement` that replaced it. That residue is
what this round removed.

Read `office_hours.reason` for the two drift blockers that stopped the finalize,
and `office_hours.recommendation` for the four-step disposition. The rest of this
body is the round record — reuse facts a re-plan should not have to re-derive.

## Round record — /align-tactics per-node drift review, 2026-08-21

Disposition: `escalated`. Side A and Side B both fired; the round authored no
plan and made no write to the serving strategy.

### Where the immaterial observations went, and why

Into this node's own `clarifications` (entries 4–8) and this section — **not** a
born-parked observation carrier. `strategy-graph-native-dispatch` clarification
245 / violation V1 forbids an autonomous write to the serving strategy's
`clarifications` and routes immaterial drift to a carrier node instead. That
routing assumes a round that PROCEEDS, leaving the observations homeless. This
round parked, so the target itself lands in the same office-hours sitting a
carrier would route to, and the carrier is redundant. It would also be actively
harmful here: `strategyBacklogBand` scores a born-parked node as backlog, so
minting one would write into the very numerator this park is about. The
invariant V1 protects is satisfied either way.

### The band measurement — how to re-derive it, not what it said

Do not reuse the figures below; re-derive. The canonical path is
`listNodes("intentions")` fed to `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:26`), the same helper
`packages/intentionsutil/scripts/read-sensors.ts:707` uses. `classifyTactic`
(`census.ts:13-18`) is the rule it applies: `phase: done` → done; non-null
`phase` → open; null `phase` with null `office_hours` → draft; otherwise
born-parked. Backlog is open + born-parked over all tactics serving the strategy.

Measured this round: 128/316 = 40.5% at `origin/main` 3313bc46, and 130/316 =
41.1% after freshening to 787782c5. The Workflow's drift agent reached the same
40.5% by an independent hand scan (97 done / 91 draft / 84 open / 44
born-parked), so the instrument is corroborated two ways. The strategy's stored
`reading` still says 58/236 = 24.6% and is stale by roughly 16 points.

The measurement moves inside a single round — this round's own two samples differ
by 0.6 points — because concurrent sibling parks land while the round runs. A
report written at the end must re-measure rather than quote the opening figure.

### The prune exposure that blocks a clean retirement

`kind-tactic.md:240-245` says an entry "retires by transitioning to `phase:
done` with `measured_impact` intact." That doctrine is written in the
**ledger-entry** context and does not reach this node, which carries no
`ledger_entry`. The mechanics:

- `isLedgerEntry` (`packages/intentionsutil/src/schema.ts:535-538`) returns
  `node.kind === "tactic" && attributes.ledger_entry === true`.
- `packages/intentionsutil/scripts/graph-census-debt.ts:179` gates the
  owed-prune candidate list on
  `n.phase === "done" && !isLedgerEntry(n) && !isLiveRearmTarget(n)`.
- `tactic-eval-finding-ledger`, which would re-key that exemption to
  `measured_impact` presence, is at `phase: implement` and NOT landed.

So retiring this node to `done` today puts its evidence on the owed-prune
candidate list. A human acts on that list rather than an automatic delete, but it
is the one list this node must never appear on.

### The upstream redirect is already half-consumed

Verified at 787782c5, after the Workflow read its corpus:

- `tactic-validate-graph-ordering-inversion-lint` — `status: codified`,
  `phase: implement`, `serves: [strategy-graph-integrity]`. Finalized between
  this round's gather and its landing.
- `tactic-align-round-self-consistency-walk` — born-parked,
  `serves: [strategy-discovered-requirements]`, blocked on that strategy's
  authored-boost condition (a different failure from this node's).

Neither serves `strategy-graph-native-dispatch` any more; clarification 233's
2026-08-14 amendment records the edge drop and its reason. Frontmatter
clarification 3's description of them as "draft siblings retained by the same
2026-08-12 clarification on strategy-graph-native-dispatch" is stale on both
halves.

### What is settled and must not be re-litigated

The ordering question this node was minted to answer. Re-verified against
`.claude/workflows/align-tactics.js` at current HEAD: `buildDriftPrompt` :699
(called :1126), `buildDecomposePrompt` :837 (called :1170) and `buildPlanPrompt`
:928 (called :1225) all consume `gather`. `gather` is therefore the RUN's input,
not the drift review's private prerequisite, so no premise check can be placed
ahead of it as a *reordering* — any such check is an additive agent call on every
run. Nothing in this round reopens the withdrawal.
