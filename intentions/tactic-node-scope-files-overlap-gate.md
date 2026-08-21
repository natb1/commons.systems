---
id: tactic-node-scope-files-overlap-gate
kind: tactic
statement: "Declare a tactic's write set as machine-readable scope.files on the
  node and gate selection on it: the selector refuses to co-dispatch candidates
  whose declared write sets intersect"
owner: ai
status: raw
parent: null
rationale: "Retained from the 2026-07-27 /align-strategy round (strategy
  clarification on the declared write set). Root cause of the 2026-07-25/26
  provision exit-11 storm on tactic-scope-fingerprint-plan-substance: worktree
  isolation keys on node id, so two tactics editing the same file are invisible
  to each other for as long as their branches stay unmerged. PR #2918 held a
  rewrite of .claude/skills/qa-fix/references/needs-main-followups.md for about
  9.5h while main took 41 commits. The author chose a hard selection gate over
  an advisory variant this round; the scope.files field is also the prerequisite
  tactic-code-diff-scope-custody compares its diff against. Awaiting an
  /align-tactics round to finalize."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: Are the node's own exit-11 evidence figures — 28 events since
      2026-07-15, 9 on 2026-07-25 — reproducible from a named source?
    answer: "No, not from journald, and the reproducible series tells a different
      story. Measured 2026-08-21 on the caller thread: journald user retention
      reaches back to 2026-01-01, so this is not a retention artifact, yet
      `journalctl --user --since 2026-07-24 --until 2026-07-27` carries ZERO
      `provision-node-worktree` lines of any kind — the storm date the rationale
      names logged nothing. What IS reproducible is `does not merge clean`
      (provision-node-worktree's two exit-11 sites, lines 394 and 409): 37
      events since 2026-07-15, daily 07-16:4, 07-19:2, 07-30:9, 07-31:4,
      08-03:3, 08-04:7, 08-09:4, 08-10:3, 08-12:1 — peaking on 2026-07-30, not
      07-25. The original figures presumably came from session transcripts
      rather than journald. This does NOT refute the node; it means the
      finalizing round must re-derive the rate from a named, reproducible source
      before citing one, and should not carry the 28/9 figures forward
      unattributed. Recorded 2026-08-21 /align-tactics park round."
  - question: Did the collision the node exists to prevent stop after the node was
      filed — is the node stale by resolution?
    answer: No. 22 of the 37 reproducible provisioner merge-conflict events landed
      on or after 2026-07-30, i.e. AFTER the 2026-07-27 author decision that
      filed this node, so the phenomenon continued well past filing. Recorded
      2026-08-21 /align-tactics park round.
  - question: There have been no provisioner merge-conflict events since 2026-08-12
      — has the problem self-resolved?
    answer: "No — that quiet is the PAUSE, not a fix. Measured this round on the
      caller thread: `dispatch_pause_state`
      (.claude/skills/dispatch-propagate/scripts/lib-pause-state.sh) returns
      `paused`, and the strategy's own attributes.queue_summary dated 2026-08-11
      already recorded the pause. Scheduling gates worker spawning, so a paused
      fleet cannot co-dispatch and therefore cannot collide. Read the nine-day
      quiet as the sensor being off, never as the defect being closed. Recorded
      2026-08-21 /align-tactics park round."
  - question: Does the author's 2026-07-27 choice of a HARD selection gate over an
      advisory variant still rest on the concurrency premise it was made under?
    answer: "PROPOSED, not ratified — this is an unrecorded material premise and is
      why the finalizing round needs the author. The hard-gate choice was made
      2026-07-27 against a fleet running at higher concurrency. As of 2026-08-21
      `dispatch.config/target-workers.json` declares `max_concurrent_workers: 3`
      and scheduling is paused. The node's own `## Known risk` section warns a
      hard gate on a wrong declaration starves the queue; that false-blocking
      cost scales inversely with headroom, so at three workers one
      wrongly-blocked candidate withholds a third of the fleet, where at the
      original concurrency it withheld a small fraction. Whether the hard-gate
      shape survives the reduced-concurrency premise is a condition-shaped,
      human-decided question this round cannot ratify — it is carried to
      office_hours with the Side-A park rather than landed as settled. Recorded
      2026-08-21 /align-tactics park round."
  - question: Are the four `## Open questions for /align-tactics` still genuinely
      open, or has any of the mechanism landed since 2026-07-27?
    answer: "All four are still open, and no part of the mechanism has landed.
      Verified live this round (2026-08-21): Q1/Q3 — `schema.ts` carries no
      `scope.files`-shaped field (its only `scope` matches are unrelated prose
      at lines 680/687/695) and `packages/intentionsutil/src/router.ts` contains
      no `overlap`, `intersect`, `writeSet`, or `write_set` match, so nothing
      declares or intersects a write set today; Q2 — the `graph-select-target`
      shell gate still exists at
      `.claude/skills/dispatch-propagate/scripts/graph-select-target`, so the
      router.ts-vs-shell-gate binding-site question is still a live choice; Q4 —
      `refs/graph/landing-lock` is still the graph-write serializer
      (`packages/intentionsutil/scripts/graph-commit`,
      `.claude/skills/dispatch-propagate/scripts/lib.sh`), so the
      intentions-only-lane carve-out question still has its premise. The node is
      not superseded. Recorded 2026-08-21 /align-tactics park round."
  - question: Does `scope.files` collide with the scope-custody fingerprint
      machinery that already exists?
    answer: "They are different mechanisms and the finalizing round must not
      conflate them. The existing scope-custody chain hashes a node's PLAN
      SUBSTANCE to decide whether its phase state is trustworthy —
      `isScopeStale` at `packages/intentionsutil/src/transitions.ts:467` (null
      stamp reads NOT stale, the documented bootstrap fail-open) over a
      machine-local `.scope-fingerprint` stamp. `scope.files` as this node
      proposes it is a declared WRITE SET consumed at selection, which is
      unrelated to that hash. Three siblings already sit on the fingerprint seam
      — `tactic-scope-stamp-in-graph` (born-parked),
      `tactic-scope-stamp-coverage-out-of-graph-coupling-observation`
      (born-parked), `tactic-scope-fingerprint-plan-substance` (phase: qa) — so
      a finalizing round that reuses `scope` naming without disambiguating in
      the plan text will collide with them in review. Recorded 2026-08-21
      /align-tactics park round."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    SIDE A — the serving strategy's ARMED maintenance-burden condition measures
    FALSE on BOTH limbs, so this round parks before authoring a plan. Conditions
    are human-decided and the condition's own text says a burden growing without
    bound IS the condition failing, so no autonomous round may proceed past it.
    Re-measured on the CALLER thread this round (2026-08-21) through the
    canonical census functions imported directly — `listNodes` from
    `packages/intentionsutil/src/store.ts` plus
    `strategyBacklogBand`/`classifyTactic` from
    `packages/intentionsutil/src/census.ts` — not by reimplementing their rules
    and not via the census script (which cannot be shelled out under the
    sandbox). LIMB 1 (ceiling): 132/316 = 41.77% against a declared 35% ceiling.
    Class split: 87 draft, 48 born-parked, 84 open, 97 done. LIMB 2
    (non-increasing): the 2026-08-21 series alone runs 38.5% -> 39.4% -> 40.5%
    -> 40.19% -> 41.14% -> 41.77%, rising intra-day, against the strategy's own
    recorded descent of 47.6 -> 38.2 -> 31.4 -> 24.6. The strategy's STORED
    `reading` still says 58/236 = 24.6% — stale by roughly 17 points and 80
    tactics; re-derive it, never reuse it.


    THIS IS THE SIXTH NODE PARKED ON THIS ONE CONDITION, after
    tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours,
    tactic-align-tactics-immaterial-drift-redirect, and
    tactic-graph-refsplit-blocker-audit. Two counting traps, both real: grepping
    office_hours.reason for the band matches more nodes than are actually
    blocked on it (the extras are observation carriers that merely MENTION it),
    and the reasons are not uniformly worded (three open `SIDE A`, one opens
    `MAJOR SCOPE DEVIATION`), so a `/SIDE A/`-anchored regex undercounts. Read
    each reason.


    THE PARK FEEDS THE NUMERATOR. `classifyTactic` (census.ts:13-18) scores
    `born-parked` as backlog and `draft` as neither, so each Side-A park moves
    its own target INTO the numerator the condition measures — including this
    one: this node is a draft today, counted in the denominator only, and lands
    in the numerator the moment this park is written. No autonomous lane can
    exit that loop.


    THE BREACH IS NOT A BOOKKEEPING ARTIFACT. Of the 48 born-parked tactics, 16
    are pure observation carriers with no plan. Removing all 16 from BOTH
    numerator and denominator still gives 116/300 = 38.67% — still above 35%.
    The lane's own bookkeeping inflates the figure by about 3 points; the breach
    survives its complete removal.


    COVERAGE BOUND OF THIS ROUND — no Workflow fan-out ran. The serving strategy
    file is 577 KB, so passing its clarifications into the Workflow `args`
    exceeds the size limit, and truncating them is what left an earlier round's
    Side-A sweep under-evidenced; a subagent cannot overturn a human-decided
    condition in any case. Consequently NO full Side-B drift sweep ran: treat
    'no further drift' as UNESTABLISHED, not checked-and-clear. What this round
    DID verify live is scoped to the target node itself and is recorded as six
    clarifications — the non-reproducibility of the node's own 28/9 exit-11
    figures against journald, the 37-event reproducible series peaking
    2026-07-30, the finding that 22 of 37 events postdate the node's filing, the
    finding that the nine-day quiet since 2026-08-12 is the PAUSE and not a fix,
    the live re-verification that all four open questions remain genuinely open
    with no part of the mechanism landed, and the disambiguation of
    `scope.files` from the existing scope-custody fingerprint.


    FOLDED MATERIAL PREMISE (Side B, proposed not ratified): the author's
    2026-07-27 choice of a HARD selection gate over an advisory variant was made
    at a higher fleet concurrency. Today `max_concurrent_workers` is 3 and
    scheduling is paused, so the false-blocking cost the node's own `## Known
    risk` section warns about now withholds a third of the fleet per
    wrongly-blocked candidate. That is condition-shaped and human-decided; it
    rides here rather than landing as settled.
  since: 2026-08-21
  recommendation: >-
    RULE THE BAND ONCE FOR THE WHOLE STRATEGY, not per node. A per-node answer
    just re-opens the queue and the next round parks again — this is the sixth
    park on this single condition, and the park-feeds-the-numerator loop
    (born-parked scores as backlog, draft does not) means each sitting that
    answers only one node raises the measurement for the next. Three
    dispositions to choose among: (a) RE-AFFIRM the 35% ceiling as correct and
    treat 41.77% as a real breach requiring a drawdown plan — say which cohort
    drains and by when; (b) RE-DECLARE the band against the grown population —
    316 tactics now versus 197 at arming (2026-08-05, 59/197 = 30.0%) — if 35%
    was calibrated to a smaller graph, noting that the breach survives removing
    all 16 observation carriers (116/300 = 38.67%) so a carrier-hygiene fix
    alone will not clear it; or (c) ACCEPT the current level with an explicit
    remediation commitment and re-arm the condition at a level you intend to
    hold. WHICHEVER YOU CHOOSE, SAY WHAT BECOMES OF THE SIX ALREADY-PARKED NODES
    — they will not unpark themselves, and each is a finalize that was ready to
    run.


    SECOND, AND SEPARABLE — this node needs one decision the band does not
    cover: does the HARD selection gate survive the reduced-concurrency premise?
    You chose hard-over-advisory on 2026-07-27 at a higher worker ceiling. At
    `max_concurrent_workers: 3` a single wrong `scope.files` declaration
    withholds a third of the fleet, which is the node's own recorded Known risk
    with its blast radius multiplied. If you re-affirm HARD, the finalizing
    round should carry one of the node's own listed mitigations as a required
    plan unit (seed the declaration from the plan's path:line anchors; widen
    from the observed diff; or treat declaration-vs-diff mismatch as a review
    finding). If you now prefer ADVISORY, say so explicitly — it changes the
    node's statement, not just its plan, and it changes what
    `tactic-code-diff-scope-custody` (blocked_by this node) is comparing
    against.


    THIRD, A CHEAP ONE: the node's rationale cites '28 exit-11 events since
    2026-07-15, 9 on 2026-07-25' and those figures are not reproducible from
    journald (which reaches back to 2026-01-01 and logs nothing from the
    provisioner on 07-24..26). The reproducible series is 37 events since 07-15
    peaking 2026-07-30. If you know the original source, name it in the node;
    otherwise the finalizing round should replace the figures with the journald
    series so the evidence is re-derivable.


    DO NOT read the absence of provisioner conflicts since 2026-08-12 as the
    problem closing — dispatch is paused; the sensor is off, not clear.
  session_type: other
pace_exempt: false
rounds: null
attributes: {}
---
# Declare a tactic's write set as machine-readable scope.files on the node and gate selection on it: the selector refuses to co-dispatch candidates whose declared write sets intersect

## Context — the failure this prevents

Worktree isolation keys on **node id**: one worktree per node, liveness detected
as live session <=> worktree (`strategy-graph-native-dispatch` body, §Worktree
Claiming & Liveness). Two tactics that write the *same file* are therefore not in
conflict as far as the router is concerned, and nothing anywhere in the graph
records which files a tactic intends to touch — the plan body carries only prose
`path:line` anchors, which no machinery reads.

The consequence is that an unmerged branch is an **invisible write set**.
`origin/main` is the only surface on which two in-flight tactics can see each
other, so for as long as a branch stays unmerged its edits are undetectable to
every other tactic. Measured instance (2026-07-25/26): PR #2918 held a rewrite of
`.claude/skills/qa-fix/references/needs-main-followups.md` for about 9.5h while
`origin/main` took 41 commits. A second tactic corrected the same paragraph in the
opposite direction. The collision surfaced only at
`provision-node-worktree`'s pre-worker merge — exit 11 — which is a deadlock, not
a transient: the only actor who could resolve the conflict is the worker that
provisioning refuses to start. 28 exit-11 events since 2026-07-15, 9 on 07-25
alone.

## Target behavior (author-decided 2026-07-27)

- **`scope.files` on the node** — a machine-readable declared write set, authored
  at `/align-tactics` time alongside the plan's prose anchors. Shape (glob list vs
  literal path list vs both) is an open question for the finalizing round.
- **Hard gate at selection.** The selector refuses to co-dispatch a candidate
  whose declared write set intersects any in-flight tactic's, deferring the loser
  to a later tick. The author explicitly chose this over an advisory /
  rank-penalty variant: detection at provision time *is* the exit-11 hold this
  exists to prevent, so prevention has to bind at **selection**, before a second
  branch is ever cut.

## Known risk the finalizing round must address

`scope.files` starts out **author/agent-declared**, so it will sometimes be wrong
or incomplete. A hard gate on a wrong declaration starves the queue (false
blocking) or fails to prevent (false clearing). Candidate mitigations to weigh:
seed the declaration from the plan's `path:line` anchors; widen it automatically
from the observed diff (the sibling
[[tactic-code-diff-scope-custody]] already computes that diff); treat a
declaration-vs-diff mismatch as a review finding rather than a hard failure.

## Relationship to sibling work

[[tactic-code-diff-scope-custody]] is `blocked_by` this tactic — a diff-level gate
needs a declared scope to compare against. It is not merely sequenced: `scope.files`
is a shared prerequisite, and the two tactics are the prevent- and detect- halves
of one mechanism.

## Open questions for /align-tactics

1. `scope.files` shape: globs, literal paths, or both? Does a directory entry
   imply its subtree?
2. Where does the intersection check bind — `router.ts`'s candidate loop, or the
   `graph-select-target` shell gate? What is the in-flight set (nodes with a
   non-null `execution.branch`? a live worktree? both)?
3. Does a deferred candidate need any recorded state (a skip reason in the
   selection log) or is silent deferral to the next tick sufficient?
4. Does the gate apply to the `intentions/`-only graph-commit lane at all, or only
   to code-carrying phases? (Graph writes already serialize on
   `refs/graph/landing-lock`.)

## Round record — 2026-08-21 /align-tactics (per-node, PARKED Side A)

A per-node `/align-tactics tactic-node-scope-files-overlap-gate` finalize round
ran and **parked without authoring a plan**. The node stays a draft: `status:
raw`, `phase: null`, no `execution`. What follows is what the round measured, so
the next session does not re-derive it.

### Why it parked

The serving strategy's **armed maintenance-burden condition** measures false on
**both** limbs. Conditions are human-decided, and the condition's own text says a
burden growing without bound *is* the condition failing — so an autonomous round
may not proceed past it. Full figures are in `office_hours.reason`; in short,
**132/316 = 41.77%** against a **35%** ceiling, rising across six same-day
samples. This is the **sixth** node parked on this one condition.

The measurement was taken **on the caller thread**, importing `listNodes`
(`packages/intentionsutil/src/store.ts`) and `strategyBacklogBand` /
`classifyTactic` (`packages/intentionsutil/src/census.ts`) directly, rather than
reimplementing their rules or shelling out to `align-tactics-census.ts` (which
the sandbox blocks).

### Coverage bound — read this before trusting the round's breadth

**No Workflow fan-out ran.** The serving strategy file is 577 KB, so passing its
`clarifications` into the Workflow `args` exceeds the size limit, and truncating
them is exactly what under-evidenced an earlier round's Side-A sweep. A subagent
cannot overturn a human-decided condition in any case.

Consequently **no full Side-B drift sweep ran**. Treat "no further drift" as
**unestablished**, not checked-and-clear. Everything verified this round is
scoped to this node's own body claims and its four open questions.

### What the round did verify live

| Claim checked | Result |
| --- | --- |
| The rationale's "28 exit-11 events since 2026-07-15, 9 on 2026-07-25" | **Not reproducible from journald.** Retention reaches 2026-01-01, so this is not an expiry artifact, yet `journalctl --user --since 2026-07-24 --until 2026-07-27` carries **zero** `provision-node-worktree` lines of any kind. |
| The reproducible series | `does not merge clean` (the provisioner's two exit-11 sites, `provision-node-worktree:394` and `:409`): **37 events since 2026-07-15**, daily `07-16:4, 07-19:2, 07-30:9, 07-31:4, 08-03:3, 08-04:7, 08-09:4, 08-10:3, 08-12:1` — peak **2026-07-30**, not 07-25. |
| Is the node stale by resolution? | **No.** 22 of the 37 events landed on or after 2026-07-30 — *after* the 2026-07-27 decision that filed this node. |
| No events since 2026-08-12 — closed? | **No — that is the PAUSE.** `dispatch_pause_state` returns `paused` (measured this round); the strategy's own `attributes.queue_summary` dated 2026-08-11 already recorded it. A paused fleet cannot co-dispatch, so it cannot collide. The sensor is off, not clear. |
| Q1/Q3 premises (`scope.files`, intersection check) | **Still open, nothing landed.** `schema.ts` has no `scope.files`-shaped field; `router.ts` has no `overlap` / `intersect` / `writeSet` / `write_set` match. |
| Q2 premise (binding site) | **Holds.** `.claude/skills/dispatch-propagate/scripts/graph-select-target` still exists, so the router.ts-vs-shell-gate choice is still live. |
| Q4 premise (graph lane) | **Holds.** `refs/graph/landing-lock` is still the graph-write serializer (`packages/intentionsutil/scripts/graph-commit`, `.claude/skills/dispatch-propagate/scripts/lib.sh`). |
| Sibling edge | **Holds.** `tactic-code-diff-scope-custody` still carries `blocked_by: [tactic-node-scope-files-overlap-gate]`. |

### Naming hazard for the finalizing round

`scope.files` (a declared **write set**, consumed at selection) is **not** the
existing scope-custody fingerprint (a hash of a node's **plan substance**,
consumed to decide whether phase state is trustworthy — `isScopeStale`,
`packages/intentionsutil/src/transitions.ts:467`, over a machine-local
`.scope-fingerprint` stamp). Three siblings already sit on the fingerprint seam:
[[tactic-scope-stamp-in-graph]] and
[[tactic-scope-stamp-coverage-out-of-graph-coupling-observation]] (both
born-parked) and [[tactic-scope-fingerprint-plan-substance]] (`phase: qa`). A
plan that reuses `scope` naming without disambiguating will collide with them in
review.

### The folded material premise

The author chose a **hard** selection gate over an advisory variant on
2026-07-27, at a higher fleet concurrency. Today `dispatch.config/target-workers.json`
declares `max_concurrent_workers: 3` and scheduling is paused. The false-blocking
cost this node's own `## Known risk` section warns about scales inversely with
headroom, so one wrongly-blocked candidate now withholds a **third of the fleet**.
Whether the hard-gate shape survives that premise is condition-shaped and
human-decided; it rides to office-hours with the Side-A park rather than landing
as settled. See `office_hours.recommendation`.

### Incidental observation

`.claude/skills/align-tactics/SKILL.md` cites `frozenTacticSelectable` at
`packages/intentionsutil/src/router.ts:496`; it is actually at `:638`. Recorded
here rather than as a separate observation carrier, since minting born-parked
carriers on this strategy feeds the very band this round parked on.
