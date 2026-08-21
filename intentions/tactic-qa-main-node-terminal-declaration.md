---
id: tactic-qa-main-node-terminal-declaration
kind: tactic
statement: /qa-main's node-lane escalation paths (AUTHOR, BARRIER, WAIT) declare
  no terminal disposition and write no graph state — they write job-dir markers
  and STOP — so every escalating qa-main pass strands its own session and leaves
  its node re-selectable until a downstream tier compensates; and the in-flight
  coverage ratchet records this path as already covered, so it would certify the
  gap as correct
owner: ai
status: raw
parent: null
rationale: "Confirmed live 2026-08-09 by direct measurement of a complete
  incident, then by reading the shipped skill. THE INCIDENT: dispatch-tick
  selected tactic-graph-auto-merge-office-hours-gate (phase main-qa,
  office_hours null) at 19:16:32 and launched /qa-main at 19:16:53. The pass did
  its job correctly — it found the node's single needs-main residue item
  pre-marked `Verifiability: AUTHOR`, declined to decide it, and at 19:18:09
  wrote office-hours-reason and office-hours-recommendation into its job dir via
  dispatch-mark-node-park, then went `state: done`. Its own transcript records
  the handoff it believed in: \"no git writes needed from this session;
  dispatch-tick's terminal_without_disposition_sweep will read these markers and
  park the node via park-node on origin/main. Stopping here.\" Nothing landed.
  THE MECHANISM: .claude/skills/qa-main/SKILL.md contains ZERO occurrences of
  mark-node-terminal. Its three escalation branches each call
  dispatch-mark-node-park and then \"**STOP**\"; that script's own header states
  it writes only $CLAUDE_JOB_DIR markers and that \"a later graph-native step
  reads these markers instead\". transition-node is invoked at SKILL.md:303 and
  :361 — the clean-pass path only — and :292 states outright that it \"runs only
  when *no* AUTHOR and *no* WAIT item remains\". The single park-node mention,
  at :399, is PROSE describing terminal_without_disposition_sweep's own call,
  not an invocation by qa-main. So the escalation path declares nothing and
  writes nothing. THE COMPENSATING TIERS BOTH DECLINED, SILENTLY: at 19:31:03
  terminal_without_disposition_sweep found the corpse and ROUTED it to the
  invalid-state lane rather than parking (routed=1, \"deferred, not parked;
  markers left intact\") — correct by its own design, but its summary line
  reports `terminal=1 parked=0 ... deferred=0` because routed is deliberately
  omitted from that string to keep it stable for journald greps and test
  oracles. At 19:31:49 the lane ran: `candidates=1 intervened=0 kept=1`, the
  KEEP arriving as router exit 4 (\"keep — positive evidence to do nothing this
  pass\"). Net result 13 minutes after the pass ended: node still phase main-qa
  with office_hours null (hence re-selectable, and it had already burned one
  spawn), session still holding a worker slot and unreapable because
  lib-session-reap.sh gate 4 requires a node-terminal marker that was never
  written. A monitor landed the park by hand (commit 18a27870, using the
  session's own marker text verbatim) and reaped the session. THE SECOND,
  SHARPER DEFECT: tactic-qa-fix-node-terminal-declaration's \"Corrected coverage
  table\" carries the row `/implement, /qa-main | clean-pass, escalation | yes,
  via transition-node / park-node`. That is right for clean-pass and WRONG for
  escalation, and its Unit 1 builds a mechanical coverage ratchet from that
  table with expected counts including `qa-main=0` for mark-node-terminal — so
  landing that ratchet would freeze this gap into a passing test as intended
  behaviour. Filing separately rather than amending that node follows the
  precedent it set itself: it registered /dispatch-conflict Lane 2 as a reasoned
  GAP row and said \"filing the Lane 2 fix as its own tactic is an
  author/office-hours follow-up, not this tactic's work\"."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: What is the serving strategy's armed maintenance-burden band measured
      at, and by what method, as of the 2026-08-21 /align-tactics tactic-mode
      round on this node?
    answer: "(Measured 2026-08-21 during the /align-tactics tactic-mode round on
      this node; caller-thread figure re-taken at origin/main 76abc77a.) The
      band was re-measured by importing listNodes
      (packages/intentionsutil/src/store.ts) together with strategyBacklogBand
      and classifyTactic (packages/intentionsutil/src/census.ts) directly,
      rather than reimplementing their rules or reusing a prior round's figure.
      At 76abc77a: backlog 138, total 316, 43.67% — 8.67 points over the 35%
      ceiling, composition 81 draft / 54 born-parked / 84 open / 97 done. The
      non-increasing limb was checked independently rather than taken from
      commit prose: the Workflow drift agent replayed the band at 14 consecutive
      intentions-touching commits through listNodesAtRef
      (packages/intentionsutil/scripts/lib-store-at-ref.ts) — 127/316 40.19%
      (b6582d6b 13:13:35-04:00), 127/316 (1a4c8a10), 128/316 40.51% (c192d1bb),
      128/316 (3313bc46), 129/316 40.82% (60f79efd), 130/316 41.14% (a10f8948),
      130/316 (9abdb750), 130/316 (787782c5), 131/316 41.46% (b6327d50), 132/316
      41.77% (c13224c9), 133/316 42.09% (000c2af4), 134/316 42.41% (2a493fff),
      135/316 42.72% (9a9312d4), 136/316 43.04% (b45c0d31 14:22:05-04:00) —
      monotonically non-decreasing, strictly rising 2.85 points in 69 minutes,
      and the caller thread extended it to 138/316 43.67% at 76abc77a. The
      composition measured at 000c2af4 (84 open, 49 born-parked, 86 draft, 97
      done) reproduces tactic-invalid-state-rc-f1c843b1's independently recorded
      composition for that same commit exactly, so the two measurements
      corroborate rather than merely agree."
  - question: Does the band's same-day rise come from new tactics being filed, or
      from the parks themselves — and does the band distinguish a park from a
      finalize?
    answer: "(Measured 2026-08-21 /align-tactics tactic-mode round on this node.)
      From the parks. The DENOMINATOR is FLAT at 316 across all 14 samples of
      the replayed series while the numerator rises 127 → 138, so every single
      increment in the ratio is a draft node converting to born-parked — i.e. a
      Side-A park landing. Not one point of the same-day rise came from new
      tactics being filed. classifyTactic
      (packages/intentionsutil/src/census.ts:13-18) scores born-parked into the
      backlog numerator but scores draft into neither, so each park on this
      condition moves its own target into the very population the condition
      measures. The sharper form, which the ruling needs: FINALIZING a draft to
      phase implement raises the numerator by exactly the same 1 that PARKING it
      does, so the band cannot distinguish a park from a finalize — every
      disposition of a draft except PRUNING looks identical to it, and pruning
      is the only autonomous-reachable move that lowers the ratio. No autonomous
      lane can converge out of that loop, which is why the band needs one ruling
      for the whole strategy rather than a per-node answer. The breach is
      nonetheless not an artifact of this bookkeeping: removing every
      observation carrier from BOTH numerator and denominator leaves 125/303 =
      41.25% by the mechanically reproducible id-suffix criterion
      (/-drift-observations$/, 13 nodes) and 122/300 = 40.67% by a broader
      observations?$ match (16 nodes)."
  - question: Is this node's recorded premise still true at origin/main, and have
      any of its cited anchors drifted?
    answer: "(Verified 2026-08-21 at origin/main 76abc77a during the /align-tactics
      tactic-mode round on this node; first verified by the Workflow drift agent
      at b45c0d31 and re-verified on the caller thread.) Every structural limb
      of this node's statement and rationale still holds, so the park records a
      blocked plan and not a refuted node. .claude/skills/qa-main/SKILL.md
      contains ZERO occurrences of mark-node-terminal; it contains exactly 3
      invocations of dispatch-mark-node-park, one per escalation branch, at :373
      (AUTHOR), :417 (BARRIER/cannot-verify) and :454 (WAIT); transition-node is
      invoked exactly twice, on the clean-pass and broken paths only;
      SKILL.md:292 still states verbatim that transition-node \"runs only when
      *no* AUTHOR and *no* WAIT item remains\"; and the single park-node mention
      is prose describing terminal_without_disposition_sweep's own call. TWO
      anchors in this node's own body have drifted by one line since it was
      written 2026-08-09: the second transition-node invocation cited as :361 is
      at :362, and the park-node prose cited as :399 is at :400. The :292 and
      :303 anchors are unchanged, and every count in the body's call-site table
      is still correct. Correct the two citations when the node is next planned;
      the off-by-one affects no claim. The \"Interim\" scope item is also still
      genuinely owed and still un-frozen:
      tactic-qa-fix-node-terminal-declaration's Unit-1 artifact
      .claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh
      does not exist on origin/main, so the qa-main=0 ratchet has not yet landed
      as a passing assertion."
  - question: Why did this node end up in a three-way duplicate cluster, and can the
      cluster regrow after the merge?
    answer: '(Recorded 2026-08-21 /align-tactics tactic-mode round on this node.)
      The duplication is structural, not an authoring slip, and it is worth
      carrying on the surviving record. dispatch-invalid-state-followup derives
      an auto-minted node id as tactic-invalid-state-rc-<first 8 hex of
      sha256(cause-slug)> and dedups on that id alone, where the cause slug is
      FREE TEXT supplied per occurrence. So the dedup key cannot see a
      hand-authored node covering the same cause — which is how this node,
      hand-filed 2026-08-09 as 3c1ce96b, was invisible to it — and it also fails
      BETWEEN two auto-minted rc nodes:
      "qa-main-cannot-verify-no-mark-node-terminal" hashes to fa3075ec and
      "qa-main-node-lane-park-marker-undeclared" hashes to f1c843b1, two
      free-text descriptions of one defect yielding two nodes and no collision.
      The two twins were minted 100 seconds apart in the same tick. So YES, the
      cluster this node survives can regrow: any future occurrence described in
      different words mints a fourth node pointing at the same qa-main
      escalation branches. Both twins were parked 2026-08-21 naming this node by
      id as "the better record" and recommending MERGE with this node as the
      survivor; the occurrence lines the merge owes this node are f1c843b1 =
      2026-08-06T00:05:36Z (source node
      tactic-review-code-review-invocation-contract, session
      361f3b83-0fa7-4ea0-828c-0d611f68eaf3) and fa3075ec = 2026-08-06T00:07:16Z
      (source node tactic-terminal-disposition-sweep-park-without-cas, session
      5063052d-a0ae-4445-abe0-5e856a5d).'
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    PARKED on TWO independent grounds, neither of which is a defect in this
    node. NO PLAN WAS AUTHORED. Every structural limb of this node's statement
    and rationale was re-verified live this round and none is refuted — this
    park records a blocked plan, not a wrong record.


    GROUND A — SIDE A: the serving strategy's ARMED maintenance-burden band
    condition measures FALSE on BOTH limbs, so this node cannot be planned
    against it. strategy-graph-native-dispatch declares (ARMED 2026-08-05 /align
    interview) that the open machinery-defect population — open (phase set, not
    done) plus born-parked tactics serving this strategy — stays at or below 35%
    of all tactics serving this strategy, AND is non-increasing across
    consecutive samples derived from intentions/ git history at read time.


    MEASUREMENT, taken on the CALLER thread (not by a subagent) by importing
    listNodes from packages/intentionsutil/src/store.ts together with
    strategyBacklogBand and classifyTactic from
    packages/intentionsutil/src/census.ts directly — the canonical functions
    themselves, not a reimplementation of their rules: at origin/main 76abc77a,
    backlog 138, total 316, = 43.67%. CEILING LIMB FAILS by 8.67 points.
    NON-INCREASING LIMB FAILS: the Workflow's drift agent replayed the band at
    14 consecutive intentions-touching commits through listNodesAtRef
    (packages/intentionsutil/scripts/lib-store-at-ref.ts) and found it
    monotonically non-decreasing across 69 minutes — 40.19% (b6582d6b,
    13:13:35-04:00) → 40.51% → 40.82% → 41.14% → 41.46% → 41.77% → 42.09%
    (000c2af4) → 42.41% (2a493fff) → 42.72% (9a9312d4) → 43.04% (b45c0d31,
    14:22:05-04:00) — and the caller thread then extended it to 43.67% at
    76abc77a. That is against the strategy's own recorded descent of 47.6 → 38.2
    → 31.4 → 24.6. The strategy's stored reading field still says 58/236 =
    24.6%, stamped 2026-08-10; it is stale by ~19 points and 80 tactics and must
    be RE-DERIVED, never reused — a reader trusting it concludes the band holds.
    The condition's own text settles the disposition: "A burden growing without
    bound is this condition FAILING (which parks the strategy for an author
    decision), not merely more work to do." Conditions are human-decided, and a
    per-node tactic-target session may not write the serving strategy, so the
    re-measurement and the ruling request are recorded here rather than on the
    strategy — the strategy's record is the incomplete half.


    THIS IS THE THIRTEENTH NODE PARKED ON THIS ONE CONDITION. Roster re-derived
    at 76abc77a by READING each parked node's office_hours.reason rather than by
    grep count (twelve already parked):
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect,
    tactic-align-tactics-migration-tightening-split,
    tactic-align-tactics-premise-preflight,
    tactic-graph-commit-park-content-durability,
    tactic-graph-refsplit-blocker-audit, tactic-graph-refsplit-read-coherence,
    tactic-invalid-state-rc-f1c843b1, tactic-invalid-state-rc-fa3075ec,
    tactic-node-scope-files-overlap-gate,
    tactic-session-reap-authorization-durability,
    tactic-supersession-retirement-sweep. COUNTING TRAP recorded so the next
    round does not re-inflate it: a regex over office_hours.reason for the band
    matches nineteen nodes at this commit, but seven are
    tactic-*-drift-observations carriers that merely MENTION the band; only a
    park BLOCKED ON it counts. Anchoring on /^SIDE A/ undercounts instead — the
    reasons are not uniformly worded.


    THE PARK FEEDS THE NUMERATOR, measured rather than asserted. Across the
    whole same-day series the DENOMINATOR is FLAT at 316 while the numerator
    rose 127 → 138; over this session's own window the composition moved draft
    86 → 81 and born-parked 49 → 54. So every point of the rise is a Side-A park
    converting its own draft target into a born-parked one, which classifyTactic
    (census.ts:13-18) scores into the backlog numerator while a draft scores
    into neither. Sharper form the ruling needs: FINALIZING a draft to phase
    implement raises the numerator by exactly the same 1 that PARKING it does,
    so the band cannot distinguish a park from a finalize — every disposition of
    a draft except pruning looks identical to it, and pruning is the only
    autonomous-reachable move that lowers the ratio. No autonomous lane can
    converge out of this.


    AND THE BREACH IS NOT AN ARTIFACT OF THAT BOOKKEEPING — pre-empting the
    obvious objection with a measurement. Remove every observation carrier from
    BOTH numerator and denominator and the breach survives: by the mechanically
    reproducible id-suffix criterion (/-drift-observations$/, 13 nodes) 125/303
    = 41.25%; by a broader observations?$ match (16 nodes) 122/300 = 40.67%.
    Both remain above 35%.


    GROUND B — FOLDED MATERIAL REQUIREMENT-AMBIGUITY: three premises this node's
    plan would depend on are unratified, and two of them are not writable from a
    per-node run at all.


    (i) THIS NODE IS NOW THE DESIGNATED SURVIVOR of a three-way duplicate
    cluster covering one defect, and it is owed the absorbed occurrence records
    of two siblings. tactic-invalid-state-rc-f1c843b1 (cause slug
    qa-main-node-lane-park-marker-undeclared) and
    tactic-invalid-state-rc-fa3075ec (cause slug
    qa-main-cannot-verify-no-mark-node-terminal) were BOTH parked earlier on
    2026-08-21 and BOTH name this node by id as "the better record", each
    recommending MERGE as option (a): keep this node as the single executable
    record, append their occurrence lines, and retire the twins or make them
    blocked_by it. Verified on the caller thread by reading both nodes'
    office_hours.reason and .recommendation in full at 76abc77a. This node's
    body, written 2026-08-09, predates both parks and mentions neither. Planning
    it standalone would author a plan against a scope the graph has since re-cut
    — and the merge itself edits siblings, which the tactic-target flow cannot
    express: its sole sibling-touching exception is the split, which ADDS a
    sibling rather than merging into one. The occurrence lines the merge owes
    this node: f1c843b1 = 2026-08-06T00:05:36Z, source node
    tactic-review-code-review-invocation-contract, session
    361f3b83-0fa7-4ea0-828c-0d611f68eaf3; fa3075ec = 2026-08-06T00:07:16Z,
    source node tactic-terminal-disposition-sweep-park-without-cas, session
    5063052d-a0ae-4445-abe0-5e856a5d.


    (ii) THE FIX DIRECTION IS A GENUINE TWO-WAY FORK that this node's own body
    defers to author ratification, and the shipped skill contradicts the
    greenfield arm in prose. Verified at 76abc77a:
    .claude/skills/qa-main/SKILL.md:307 states of the clean-pass path "the skill
    hands it the node id and never writes the graph directly", and the AUTHOR
    branch prose at :399-403 states that the sweep parking via park-node is the
    DESIGNED downstream mechanic. So calling park-node in-session is a scope
    decision against a stated design principle, exactly as the body says — while
    the cheaper marker-only arm frees the stranded session but leaves the node
    at office_hours null and re-selectable, closing half the defect. Nothing has
    resolved the fork since 2026-08-09, and the position has WORSENED rather
    than merely held: all three doctrine nodes the body defers to are still
    status raw / phase null, and TWO of them are now themselves
    office-hours-parked — tactic-terminal-declaration-verified-against-node and
    tactic-session-reap-authorization-durability, the latter parked during this
    very round — leaving only tactic-invalid-state-lane-diagnostics-unobservable
    as an unparked draft. The fork's owners are in the same queue as this node.


    (iii) THE "INTERIM, OWED REGARDLESS OF WHICH DIRECTION WINS" SCOPE ITEM IS
    NOT EXECUTABLE FROM THIS RUN. Correcting the coverage row still requires
    editing tactic-qa-fix-node-terminal-declaration, which at 76abc77a is status
    codified, phase qa, execution.pr 3044, blocked_by
    tactic-hold-fix-cap-qa-fix-node-terminal-declaration — i.e. mid-ladder and
    unmerged. Its wrong row is still at body line 193 ("| /implement, /qa-main |
    clean-pass, escalation | yes, via transition-node / park-node |"), its
    pinned mark-node-terminal baseline carrying qa-main=0 is still at line 251,
    and its dispatch-mark-complete baseline carrying qa-main=0 is at line 257
    (block opens at :256). Landing that correction means either editing a
    sibling node's body or pushing to an in-flight PR's branch — neither within
    a per-node tactic-target run's writable scope, and the latter opens a
    conflict window on an open PR. The author must assign ownership and the
    landing order, because #3044 merging unchanged would freeze this gap into a
    PASSING CI assertion, which is the second, sharper defect this node was
    filed to prevent.


    COVERAGE BOUND OF THIS ROUND, recorded rather than left implicit: the full
    Workflow fan-out DID run — 6 agents, 0 errors, 0 empty results, ~725k
    subagent tokens — so this round's Side-B drift sweep is genuinely evidenced
    rather than skipped, and the four clarifications landed on this node are its
    output. That is a stronger coverage claim than the recent band-parked rounds
    that bypassed the fan-out; it is not a claim that nothing else could be
    found.
  since: 2026-08-21
  recommendation: >-
    TWO rulings are owed, and they are independent — take them in the same
    sitting but decide them separately.


    RULING 1 — THE BAND, and it must be ruled ONCE FOR THE WHOLE STRATEGY, not
    for this node. A per-node answer just re-opens the queue at the next
    selection: thirteen nodes are now parked on this single condition and each
    new /align-tactics round on strategy-graph-native-dispatch parks another.
    Re-derive the figure before deciding (43.67% at 76abc77a, rising by roughly
    0.3 points per landed park; it will be higher by the time you read this).
    Three explicit dispositions:
      (a) RE-AFFIRM the 35% ceiling and order a drawdown — name what gets pruned or finished first, since the measurement above shows only PRUNING lowers the ratio; finalizing a draft moves it into the numerator exactly as parking does.
      (b) RE-DECLARE the band against the grown population. It was calibrated at arming against 197 tactics (59/197 = 30.0%); the population is now 316. A ceiling set for a 197-node strategy may simply be the wrong number for a 316-node one — that is a re-derivation, not a retreat.
      (c) ACCEPT the breach with a recorded remediation plan and a review date, which converts a failing condition into a tracked one.
    Whichever is chosen, SAY WHAT BECOMES OF THE THIRTEEN ALREADY-PARKED NODES.
    They will not unpark themselves: each needs clear-park -C <repo-root>
    <node-id> followed by a fresh /align-tactics <node-id> round. Also re-derive
    the strategy's stored reading in the same sitting — at 58/236 = 24.6% it is
    stale by ~19 points and 80 tactics, and any reader trusting it concludes the
    band holds.


    RULING 2 — THIS NODE'S OWN THREE PREMISES. Cheap and node-local; none needs
    the band ruled first.
      2a. THE MERGE. Confirm this node as the single surviving record for the /qa-main node-lane terminal-declaration defect, absorbing tactic-invalid-state-rc-f1c843b1 and tactic-invalid-state-rc-fa3075ec. Both twins already recommend exactly this and name this node, so the ruling is a confirmation, not a fresh design decision — take it together with the identical rulings owed on those two nodes. State whether the two occurrence lines (quoted verbatim in this park's reason) are appended to this node's body BEFORE it is planned, and whether the twins are retired outright or made blocked_by this node. Worth knowing while deciding: the cluster can REGROW. dispatch-invalid-state-followup derives an auto-minted id as tactic-invalid-state-rc-<first 8 hex of sha256(cause-slug)> and dedups on that id alone, where the cause slug is free text supplied per occurrence — so it cannot see a hand-authored node covering the same cause (this node, filed 2026-08-09 as 3c1ce96b, was invisible to it), and it fails between two auto-minted nodes too (the two twins were minted 100 seconds apart in the same tick). Any future occurrence described in different words mints a fourth node pointing at the same qa-main branches.
      2b. THE FIX DIRECTION. Choose (a) GREENFIELD — the escalation branches call park-node in-session (which already bundles its own mark-node-terminal <id> park declaration), making terminal_without_disposition_sweep a genuine crash backstop rather than the primary path, and amend .claude/skills/qa-main/SKILL.md:307's "never writes the graph directly" principle to cover the escalation branches explicitly; or (b) MARKER-ONLY — the branches declare mark-node-terminal <id> park and leave the office_hours write to the sweep, which frees the stranded session but leaves the node re-selectable at office_hours null. If (a), the ruling must also say what happens to dispatch-mark-node-park's browser-reachability rejection gate (exit 3), which park-node does NOT carry: port it, keep it as a pre-validation step, or wrap it — it must not be silently dropped.
      2c. THE INTERIM'S OWNER AND ORDER. Either the correction rides PR #3044 itself (tactic-qa-fix-node-terminal-declaration's own round amends its table row to a reasoned GAP row and re-pins its qa-main baseline before merge, mirroring how that table already registers /dispatch-conflict Lane 2), or this node's plan carries it and is sequenced strictly after #3044 merges, re-pinning the baseline to the new call-site count. What must not happen is #3044 merging unchanged.

    STATE FOR A FRESH SESSION. Nothing about this node is defective and no
    re-derivation of the round's findings is needed: its premise was re-verified
    live at 76abc77a (qa-main/SKILL.md still has ZERO mark-node-terminal
    occurrences, exactly 3 dispatch-mark-node-park invocations at
    :373/:417/:454, transition-node at :303 and :362 on the clean-pass and
    broken paths only, and the single park-node mention at :400 is prose). Four
    clarifications landed on this node this round carry the corrected anchors
    and the measured findings; the body's "2026-08-21 round record" section
    carries the reuse facts a re-plan needs, including a NEW finding that
    changes the WAIT branch's fix. Once the band is ruled and 2a-2c are
    answered, re-run /align-tactics tactic-qa-main-node-terminal-declaration; it
    is otherwise ready to plan.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# /qa-main's escalation paths declare no terminal disposition and write no graph state

## Context

Every other node-lane phase skill records its disposition and then closes.
`/dispatch-invalid-state` calls `mark-node-terminal <id> park` **after its
`graph-commit`**. `/dispatch-conflict` Lane 3 calls
`mark-node-terminal "$NODE_ID" conflict-hold` explicitly "so the session does not
hold". `/align-tactics` and `/qa-fix` call `mark-node-terminal … no-claim`.
`mark-node-terminal`'s closed enum already contains `park` for exactly this
shape.

`/qa-main`'s node lane is the exception. On its clean-pass path it does write the
graph itself (`transition-node "$N"`, then STOP). On its three escalation paths —
AUTHOR, BARRIER, WAIT — it writes marker files into `$CLAUDE_JOB_DIR` and stops,
writing neither the graph nor a terminal declaration. The asymmetry is inside one
skill, on adjacent branches.

The consequence is not a lost park in the ordinary sense. The park text survives
in the job dir; what is missing is any actor obliged to land it. The session
cannot be reaped (`lib-session-reap.sh` gate 4 needs a `node-terminal` marker),
and the node stays `office_hours: null`, so the selector may re-select it — the
"HELD and RE-SELECTABLE" churn loop that `lib-frozen-session-park.sh` describes
in its own header as the thing it exists to break, landing "the office_hours park
**the session itself owed**".

## Measured evidence — 2026-08-09

Target node: `tactic-graph-auto-merge-office-hours-gate`. Session `ef83a8a8`.

| time (EDT) | event |
|---|---|
| 19:16:32 | `dispatch-tick: graph 1 tactic-graph-auto-merge-office-hours-gate:tactic:main-qa` |
| 19:16:53 | `launched … /qa-main` |
| 19:18:09 | markers written via `dispatch-mark-node-park`; session `state: done` |
| 19:31:03 | `terminal_without_disposition_sweep`: `routed=1 kept-by-lane=0` — "deferred, not parked; markers left intact"; summary line reads `terminal=1 parked=0 observing=0 unmeasurable=0 deferred=0` |
| 19:31:49 | `invalid-state-sweep: candidates=1 intervened=0 kept=1` (router exit 4) |
| 19:35 | node still `phase: main-qa`, `office_hours: null`; session still held |
| — | monitor landed the park by hand (`18a27870`) and reaped the session |

Call-site counts read off the shipped `.claude/skills/qa-main/SKILL.md`:

| symbol | count | where |
|---|---|---|
| `mark-node-terminal` | **0** | — |
| `transition-node` | 2 invocations | `:303`, `:361` — clean-pass only; `:292` says it runs only when no AUTHOR and no WAIT item remains |
| `park-node` | 0 invocations | the one mention, `:399`, is prose describing the downstream sweep's call |
| `dispatch-mark-node-park` | 3 invocations | the AUTHOR, BARRIER and WAIT branches |

The bug-J detector (`find $CLAUDE_JOB_DIR -maxdepth 2 -name office-hours-reason`,
where any hit is by definition a park that did not land) fired correctly
throughout. It is the detection that works; the obligation is what is missing.

## Why the compensating machinery did not cover it

Two tiers exist below the skill and both declined, each defensibly:

1. `terminal_without_disposition_sweep` routed rather than parked. That is its
   documented pre-tier behaviour, and routed candidates are explicitly "DEFERRED,
   not resolved".
2. The invalid-state lane kept rather than intervened, on router exit 4 —
   "positive evidence to do nothing this pass".

Neither is a bug on its own reading. The gap is that the union of two correct
"not mine this pass" decisions is nobody, and the only actor with an
unconditional obligation — the session that made the judgment — was never given
one.

A related observability problem made this invisible rather than merely broken:
the KEEP is silent at all three layers (the router has six distinct `exit 4`
sites and surfaces no reason; the sweep's `4) KEPT=$(( KEPT + 1 ))` arm carries
no echo, unlike its neighbouring `ESCALATE_DEFERRED` arm which echoes the rc, and
unlike the cap branch whose comment reads "Deliberately NOT silent: a silent cap
reads as 'covered everything'"; and the summary names no node). That belongs to
tactic-invalid-state-lane-diagnostics-unobservable — recorded here as the reason
this went unnoticed, not re-diagnosed.

## Fix direction

**Greenfield.** `/qa-main`'s escalation branches should record-then-close like
every other lane: land the park with `park-node` (or the `hold-node` equivalent
where the class calls for it), then declare `mark-node-terminal <id> park`,
matching the ordering `/dispatch-invalid-state` already documents — the marker
after the graph write, never instead of it. The downstream sweep then becomes a
genuine backstop for crashes rather than the primary path for an ordinary,
successful escalation. This also closes the reap side for free: a declared
session is reapable by `dispatch-self-close` with no intervention.

Note the one real objection to weigh: the node lane deliberately forbids `gh` and
keeps sessions out of graph writes on some paths. `park-node` is a graph write,
so adopting it here is a scope decision, not a pure bug fix. The cheaper variant
— declare `mark-node-terminal <id> park` while still leaving the park itself to
the sweep — fixes the stranded session but leaves the node re-selectable, so it
addresses half the defect.

**Interim, and owed regardless of which direction wins.** Correct the coverage
row in tactic-qa-fix-node-terminal-declaration from "covered" to an explicit
reasoned GAP row, the pattern its Unit 1 already uses for `/dispatch-conflict`
Lane 2. Its ratchet encodes `qa-main=0` for `mark-node-terminal` as the expected
count; landing it unchanged would make this gap a passing assertion and much
harder to see later.

## Out of scope

- Re-diagnosing the invalid-state lane's silent KEEP — owned by
  tactic-invalid-state-lane-diagnostics-unobservable.
- The sweep's park lacking a CAS base — owned by
  tactic-terminal-disposition-sweep-park-without-cas.
- `dispatch-mark-node-park`'s browser-reachability rejection gate, which worked
  correctly here and is not implicated.
- The doctrine question of where reap authorization should live — owned by
  tactic-session-reap-authorization-durability and
  tactic-terminal-declaration-verified-against-node, both awaiting an author
  ratification.

## 2026-08-21 round record — `/align-tactics` tactic-mode, PARKED (no plan authored)

A per-node `/align-tactics tactic-qa-main-node-terminal-declaration` round ran to
completion and **parked on two independent grounds** rather than finalizing. The
grounds, the measurements, and the rulings owed are in `office_hours.reason` and
`office_hours.recommendation`; four clarifications landed on this node carry the
supporting figures. This section holds only the **reuse facts a re-plan needs**,
so a fresh session does not re-derive them.

Placement note, recorded so it does not read as an error: this round's immaterial
Side-B observations were folded here and into this node's own `clarifications`
rather than minted as a separate born-parked `-drift-observations` carrier. That
is the escalation carve-out — a round that parks its target routes its
observations to the same office-hours sitting the target now sits in, and minting
a carrier when the park's own ground is a backlog-band breach would write a fresh
born-parked node into the very numerator the park is about
(`strategyBacklogBand`, `packages/intentionsutil/src/census.ts:26-40`, scores
born-parked as backlog). No clarification was written to the serving strategy:
clarification 118 is OVERTURNED and the autonomous-substance invariant
(clarification 245, V1) binds.

### Anchor corrections to this node's own body

The call-site table under "Measured evidence — 2026-08-09" has drifted by one
line. Verified at `origin/main` 76abc77a:

| body cites | actual at 76abc77a |
|---|---|
| `transition-node` at `:303`, `:361` | `:303` and **`:362`** |
| `park-node` prose at `:399` | **`:400`** |
| `:292` (the "no AUTHOR and no WAIT" sentence) | unchanged, still exact |

Every **count** in that table is still correct: zero `mark-node-terminal`, three
`dispatch-mark-node-park` (now at `:373` AUTHOR, `:417` BARRIER, `:454` WAIT),
two `transition-node` invocations, zero `park-node` invocations. **Locate by
symbol and section heading when planning, not by these line numbers** — they have
moved twice already.

### The interim's exact edit sites

`tactic-qa-fix-node-terminal-declaration` at 76abc77a is `status: codified`,
`phase: qa`, `execution.pr: 3044`, `blocked_by:
[tactic-hold-fix-cap-qa-fix-node-terminal-declaration]`. Its Unit-1 artifact
`.claude/skills/dispatch-propagate/scripts/test-node-terminal-coverage.sh` **does
not exist** on `origin/main`, so the `qa-main=0` ratchet has not landed and this
gap is not yet a passing assertion. When the correction is finally made, the
three sites in that node's file are:

- `intentions/tactic-qa-fix-node-terminal-declaration.md:193` — the wrong
  coverage row, `| `/implement`, `/qa-main` | clean-pass, escalation | yes, via
  `transition-node` / `park-node` |`. It needs the reasoned-GAP shape that table
  already uses for `/dispatch-conflict` Lane 2.
- `:251` — Part B's `mark-node-terminal` baselines, carrying `qa-main=0`.
- `:257` — Part C's `dispatch-mark-complete` baselines, also carrying
  `qa-main=0` (that block opens at `:256`).

### Primitive facts verified this round

- `packages/intentionsutil/scripts/park-node` —
  `park-node [--pr <n>] [--base <blobsha>|<id>=<blobsha>|<manifest>] <node-id>
  <reason> [recommendation]`. Exit 0 parked-and-landed (the verdict comes from
  the sibling `verify-landed` primitive, **not** from `graph-commit`'s rc); 1
  write failed / not-landed / unknown; 2 usage; 3 stale `--base`
  (`stale-diagnosis` — re-diagnose, never park). It resolves `REPO_ROOT` from its
  own `SCRIPT_DIR`, fetches `origin/main`, overwrites the local node file with
  `origin/main`'s copy, then read-modify-writes and hands `graph-commit` a
  `--base` compare-and-swap token. **It already bundles its own
  `mark-node-terminal <id> park` declaration internally**, so the greenfield arm
  is one call rather than two — this matters to the plan.
- `packages/intentionsutil/scripts/mark-node-terminal <node-id> <disposition>`
  accepts exactly **eight** members: `advance demote park fix-attempt
  align-round no-claim conflict-resolved conflict-hold`. Its ownership gate
  writes only when `$CLAUDE_JOB_DIR/state.json`'s `.name` equals the node id, and
  it no-ops (exit 0) when `CLAUDE_JOB_DIR` is unset — an unconditional call is
  safe. Recorded discrepancy, **not** something to plan against: the serving
  strategy's reap condition enumerates a ninth member `park-clear`, and
  `grep -rn park-clear` across `packages/intentionsutil` and
  `.claude/skills/dispatch-propagate/scripts` returns nothing. The condition's
  own text says the member list is "the primitive's diagnostic detail, never
  doctrine", so the mismatch unseats nothing.
- `packages/intentionsutil/scripts/land-align-round` is the **existing precedent
  for the shape the Fix direction wants** — a thin wrapper that performs the
  graph write and writes the terminal marker in the *same process*, so a session
  dying between the two cannot exist. Test: `test-land-align-round.sh`. Reuse
  this shape rather than inventing one.
- `hold-node`, `arm-wait`, `release-wait`, `list-recheckable-waits.ts` and
  `wait-node-decide.ts` all exist at HEAD. Per `park-node`'s own header,
  `hold-node` — not `park-node` — is the correct primitive for a *retryable
  mechanical* state: it mints a born-parked `tactic-hold-*` node plus a
  `blocked_by` edge on the source rather than parking the source directly.
- The doctrine-ratchet bash test family, for any prose-ratchet unit: shared
  fixture `.claude/skills/dispatch-propagate/scripts/dispatch-test-fixture.sh`
  (`assert_eq` / `report_results` / `SCRIPT_DIR`), members
  `test-fix-checks-cas-guard.sh`, `test-dispatch-chain-worktree-ratchet.sh`,
  `test-dispatch-conflict-lane3-cwd-ratchet.sh`,
  `test-align-tactics-write-path-freshness.sh`. **CI-wiring trap:**
  `.claude/skills/**/test-*.sh` is not auto-discovered — a new suite must be
  wired explicitly in the hook-tests job of `.github/workflows/unit-tests.yml`
  and in `run-unit-tests.sh`.

### NEW finding — the WAIT branch's correct fix has changed since 2026-08-09

`.claude/skills/qa-main/SKILL.md:468-473` carries a forward pointer: "when
`tactic-wait-calendar-release` lands (the `attributes` sweep predicate, the
`attempts`/cap, and the `router.ts:343-355` draft-candidate exclusion), this
branch emits a WAIT hold node instead of parking. **Do not mint a WAIT hold node
before then** — without that router exclusion, a phase-less, `office_hours`-null
node is emitted as an `/align-tactics` candidate and spawns an align worker."

**That precondition is now satisfied.** At 76abc77a `tactic-wait-calendar-release`
is `phase: main-qa` (its code is on `main`), the router exclusion is live at
`packages/intentionsutil/src/router.ts:461` — `if (waitNodeIds.has(t.id))
continue;  // armed calendar WAIT, not an undecomposed draft`, backed by
`isWaitNode` imported at `:12` and the `waitNodeIds` set built at `:408-410` —
and `arm-wait` / `release-wait` / `list-recheckable-waits.ts` are all present.

So the WAIT branch's correct terminal is now plausibly **`arm-wait` plus a
terminal declaration**, not `park-node` plus a declaration: a *different* fix from
the AUTHOR and BARRIER branches. A plan must weigh explicitly whether the WAIT
branch is in this node's scope at all or is residue owed by
`tactic-wait-calendar-release` — it must not silently assume all three escalation
branches take the same fix. This interacts with the serving strategy's recorded
position that a deploy-lag `cannot-verify` is a mechanical retry hold and *not* an
`office_hours` park, while a verifiability `cannot-verify` is.

### Coverage bound of this round

The full Workflow fan-out **did** run — 6 agents, 0 errors, 0 empty results,
~725k subagent tokens — so this round's two-sided drift review is genuinely
evidenced rather than skipped, and the four clarifications above are its output.
That is a stronger coverage claim than the recent band-parked rounds that bypassed
the fan-out. It is not a claim that nothing further could be found: the round
stopped at the first two blocking grounds and authored no plan, so no
implementation-level design was explored.
