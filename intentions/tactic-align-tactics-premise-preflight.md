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
  reached that confirmation cheaply is exactly the ordering question a planning
  session must establish first, and it remains open."
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
# /align-tactics runs its blocking-premise check before the drift review and decomposition, so a node that cannot be planned parks cheaply instead of after a full-length session
