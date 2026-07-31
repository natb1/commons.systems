---
id: tactic-qa-main-verifiability-sort-criterion
kind: tactic
statement: qa-main's cannot-verify branch sorts needs-main residue on whether an
  item is reachable by Claude-in-Chrome rather than on whether it is
  machine-verifiable at all, so every git, journal, log or shell check that the
  browser tool cannot perform is parked to office_hours as cannot-verify —
  waking the author for items no author is needed for, and producing exactly the
  mis-sort the graph's own greenfield design calls a mis-sort by construction
owner: ai
status: raw
parent: null
rationale: "The bootstrap plan recorded this as an open seam with no owning
  node; this node is that owner. On 2026-07-31 four office_hours parks were
  opened by /qa-main on four different nodes, and all four gave the same reason
  — 'not browser-verifiable', typically adding that url_path is the placeholder
  'current' rather than a real route. All four were then machine-verified in a
  single session with journalctl, ls, jq, git show and grep, no browser and no
  author input. Results: tactic-frozen-session-debug-count item 10 PASS on eight
  consecutive dispatch-sweep log lines;
  tactic-router-spawn-window-duplicate-worker items 9 and 10 PASS, item 10 on
  direct live-ledger observation during a real spawn window;
  tactic-standdown-winner-liveness item 1 PASS on 21 post-merge tick sweeps.
  Only two of the seven items across those four nodes were genuinely
  author-required — a defaults ruling and a contract-surface ruling — and both
  were answered by the author in minutes once separated from the research the
  machine could do. So the sort produced roughly five false parks out of seven
  items. The graph's greenfield design is explicit that this is the wrong
  predicate: strategy-graph-native-dispatch.md:2224-2227 says only a
  VERIFIABILITY cannot-verify — the item cannot be machine-checked AT ALL —
  becomes an office_hours park; :2221 says parking a machine-checkable item
  wakes the author for something no author is needed for; :2195-2200 says a
  cannot-verify park on a machine-sorted node IS a mis-sort by construction; and
  :3182-3188 says the sort is an explicitly recorded state on the verification
  node, never inferred. The browser predicate is the INTERIM implementation,
  single-sourced in dispatch-main-qa-triage and qa-main/SKILL.md:297, and the
  greenfield clarification at :2192-2194 says the sorting predicate is
  'unchanged' while that predicate is still written in browser terms in
  qa-fix/references/needs-main-followups.md:65-72 — which is the seam. At least
  four further sibling nodes carry the same misroute:
  tactic-drain-disposition-diagnosis-cas, tactic-mechanical-park-producers,
  tactic-main-post-merge-validation and tactic-execution-pr-merge-verification.
  Direction for planning, not a plan: sort on machine-verifiable vs
  author-required, and give the lane a third outcome besides pass and park — a
  not-yet-observed WAIT that holds the node for re-selection instead of waking a
  human, since several of these items are valid checks whose event simply has
  not happened yet. That WAIT case is the resolution pattern at :2212-2229 (a
  mechanical retry hold via blocked_by against a tracked wait), not an
  office_hours park. A park reason that cites browser-reachability should be
  rejected by the lane rather than written. Interim attention scaffolding only —
  tactic-attention-tier-ranking replaces the numeric scheme with lexicographic
  (tier, rank) and max-lifting, and tactic-attention-boost-scripts converts
  these boosts to tier/bug_fix marks."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention:
  boost: 50
  override: null
  rationale: "Bootstrap re-scale 2026-07-31: Wave A of the three-band interim
    scale (50 / 20 / 10) that puts write-path and pipeline-integrity work above
    ordinary feature work. Belongs in this band on the band's own criterion — it
    is the root cause of a park class that has already stalled at least eight
    nodes in main-qa, each park costing an author interrupt for work a machine
    can do, and the strategy tracks mis-sort rate as a measured threshold.
    blocked_by is empty, so this promotion lifts no blocker and cannot compound.
    status stays raw and phase stays null so the selector emits it as an
    /align-tactics candidate for planning, not as an implement candidate."
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    /align-tactics finalize (2026-07-31): cannot author this tactic's plan — two
    premises the plan would depend on are unrecorded and conflict with recorded
    text, per the align-tactics Workflow's two-sided drift review. (1) WHERE THE
    SORT MARK LIVES: condition 20 (attributes.conditions, last entry) requires
    the machine-verifiable/author-required sort to be "an explicitly recorded
    state on the verification node, never inferred from whether office_hours
    happens to be set" (because office_hours is cleared on drain, erasing the
    mark). But the 2026-07-28 record-time-routing clarification encodes the sort
    as exactly that inference: "Birth state IS the routing decision:
    machine-verifiable -> office_hours null; author-required -> office_hours
    {reason, since, recommendation}", and defines the mis-sort measurement on
    it. No explicit sort field exists in the node schema (verified:
    packages/intentionsutil/src/schema.ts has no
    verifiab/machine_verifiable/sort field), and adding one is the kind of
    schema change the author's mechanical-park-producers clarification declined
    for the adjacent park taxonomy ("No, and no schema change"). This tactic's
    own author-required outcome IS an office_hours park today, so its plan
    cannot be written without knowing which recorded text governs. (2) THE WAIT
    OUTCOME HAS NO COMPLIANT SHAPE: the tactic's own scope requires a third
    "WAIT" lane outcome (a not-yet-observed deploy-lag hold that must never wake
    a human), but the only recorded resolution — reuse the tracked
    mechanical-retry-hold pattern — does not fit: hold-node-decide.ts (shipped
    by tactic-mechanical-park-producers, PR #2970) always writes a non-null
    office_hours onto the hold tactic (hold-node-decide.ts:182-186), and every
    office_hours-bearing node is admitted into the human /office-hours queue
    (officeHours.ts:44) — so a hold-node-shaped WAIT still wakes the author,
    defeating the point. The alternative (an office_hours-null wait node) is
    re-selected by the router every tick (router.ts:300 requires
    office_hours===null for eligibility) with nothing defined to advance it to
    phase:done, and an uncapped re-check loop conflicts with condition 10's
    declared-finite-cap requirement. No deploy-wait primitive exists anywhere in
    the repo today. Both are genuinely author-decided taxonomy calls (the author
    personally ruled "no schema change" on the adjacent park-taxonomy question),
    not something a planner may infer.


    Recommend: run an /align-strategy interview on
    strategy-graph-native-dispatch to answer two questions, then re-invoke
    /align-tactics tactic-qa-main-verifiability-sort-criterion to finalize this
    tactic's plan against the ratified answers: (a) where does the
    machine-verifiable/author-required sort mark live now that
    record-time-routing encodes it as office_hours-null-vs-non-null on birth,
    given condition 20 forbids inferring the sort from office_hours — a new
    recorded field (name and home: attributes.*, a first-class frontmatter
    field, or an execution.* member), or is condition 20 narrowed to the
    measurement read only; (b) does the WAIT outcome get a new office_hours-null
    hold kind that never enters the human queue, what advances it to phase:done
    so blockersComplete clears the source's blocked_by edge (a re-selected
    /qa-main pass, or a separate deploy sensor), and what finite re-check cap
    does condition 10 require before an exhausted WAIT becomes a genuine
    office_hours park.


    Pre-researched facts for that /align-strategy round, so it does not
    re-derive them (found by this session's drift review, verified against
    origin/main at HEAD be86cd49 / origin 0e381b8a): dispatch-main-qa-triage is
    NOT actually the live single source of the verifiability predicate despite
    its own header's claim — the graph-native node lane explicitly skips it
    (qa-main/SKILL.md:117, "Skip dispatch-main-qa-triage (it reads a gh issue)")
    and its only remaining caller sits in the now-unreachable legacy issue lane
    (dead since the 2026-07-26 legacy-router removal and repo-wide GitHub Issues
    disablement) — the predicate that actually executes today is hand-inlined
    prose at qa-main/SKILL.md:112-119 and
    qa-fix/references/needs-main-followups.md:32,65-72, and correcting the sort
    means editing those live sites, not the dead script. Also:
    tactic-legacy-router-removal (phase done) still carries the strategy's only
    validates: [strategy-graph-native-dispatch] edge, recorded against the
    now-retired migration-completion threshold rather than the current
    steady-state success_signal (which has zero validators and reading:null) —
    this stale edge risks mis-gating future /align-tactics eligibility checks as
    "already covered". Also: two line citations inside the strategy's own
    2026-07-28 clarifications have drifted (graph-select-target:631-642 ->
    actually :646-656; router.ts:197 -> actually :300,:344,:374) though their
    factual claims still hold. Sibling context: a draft tactic
    tactic-mainqa-record-time-routing (status raw, phase null) specs the
    RECORD-TIME ROUTING mechanism separately and its own Unit 1 assumes the
    current (disputed) browser-based predicate as given — a future pass on that
    sibling should reconcile once this tactic's predicate question is ratified.
  since: 2026-07-31
  recommendation: Run /align-strategy on strategy-graph-native-dispatch to ratify
    the sort-mark location and the WAIT outcome's node shape (see reason for the
    two questions and pre-researched facts), then re-invoke /align-tactics
    tactic-qa-main-verifiability-sort-criterion to finalize this tactic's plan.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---

# tactic-qa-main-verifiability-sort-criterion

## Evidence — four parks, four wrong reasons, 2026-07-31

Every park below was opened by `/qa-main` on the same stated ground, and every
one was resolved without a browser.

| node | park reason (operative claim) | what the check actually was | outcome |
|---|---|---|---|
| `tactic-frozen-session-debug-count` | "not browser-verifiable ... url_path 'current'" | grep one log file + one daemon query | **PASS** |
| `tactic-router-spawn-window-duplicate-worker` | "url_path is 'current' ... requires observing accumulated production behavior" | journal self-join + `ls` the reservation ledger | **PASS** (both items) |
| `tactic-standdown-winner-liveness` | "neither has a real url_path ... live dispatch-fleet infrastructure state" | count sweep lines in the journal | **PASS** (item 1); item 2 genuinely author-required |
| `tactic-prune-conflict-recovery-silent-loss` | "url_path is the placeholder 'current' ... asks a human to confirm a design tradeoff" | genuinely a design ruling — but its three research steps were all machine-answerable | park destination right, **reason wrong** |

Seven residue items across four nodes. Five were machine-verifiable and were
parked anyway. Two were genuine author rulings, and both were answered in minutes
once the machine-answerable research was separated out and presented with them.

The last row is the instructive one: the park landed in the right bucket **by
accident**. Its reason — placeholder `url_path`, non-prod-observable outcome —
would equally mis-sort a fully machine-checkable item. So the reason text is not
usable as precedent even where the destination happens to be correct.

## The seam

The greenfield criterion and the interim implementation disagree, and the
clarification that was supposed to reconcile them asserts they do not:

- `strategy-graph-native-dispatch.md:2224-2227` — only a VERIFIABILITY
  cannot-verify (the item cannot be machine-checked at all) becomes a park.
- `:2221` — parking a machine-checkable item wakes the author for something no
  author is needed for.
- `:2195-2200` — a cannot-verify park on a machine-sorted node **is** a mis-sort
  by construction.
- `:2192-2194` — the sorting predicate is "unchanged" by the greenfield move.

But that predicate is still written in browser terms, in
`qa-fix/references/needs-main-followups.md:65-72`, and implemented in browser
terms in `dispatch-main-qa-triage` and `qa-main/SKILL.md:297`. "Unchanged" is
therefore load-bearing in the wrong direction: it preserves the interim browser
predicate as if it were the greenfield one.

## Scope sketch — direction only, not a plan

- Sort on **machine-verifiable vs. author-required**. A check the browser tool
  cannot perform is still machine-verifiable and must not park.
- Add a third outcome. Today the lane has pass and park; several of these items
  are valid checks whose event has not occurred yet (`tactic-standdown-winner-liveness`
  item 1c, and the observe-in-production signal on
  `tactic-prune-conflict-recovery-silent-loss`). Those need a **WAIT** that holds
  the node for re-selection — the mechanical retry hold at `:2212-2229` — not an
  author interrupt.
- Reject a park reason that cites browser-reachability, at the point of writing.
- When an item genuinely is author-required, do the machine-answerable research
  first and attach it, so the author gets a yes/no rather than an assignment.

## Verification

- Replay the seven residue items above through the corrected sort: five must
  route to pass or wait, two to author-required.
- The four sibling nodes named in the rationale must re-sort the same way.
- A park reason containing "browser-verifiable" must fail the lane's own checks.
