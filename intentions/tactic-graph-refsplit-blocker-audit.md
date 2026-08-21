---
id: tactic-graph-refsplit-blocker-audit
kind: tactic
statement: Determine whether tactic-graph-ref-split's 37 blockers encode real
  dependencies or a quiescence requirement that never converges — and if the
  latter, what makes its cutover incremental instead of one-sitting
owner: ai
status: raw
parent: null
rationale: "Surfaced by the 2026-08-14 /align round (strategy clarification
  237). ref-split is phase:implement with 37 blockers, 23 still open as of
  2026-08-14, and a cutover procedure that forbids phase handoff — Units 1-8
  through to merge in one sitting or do not start, because between main losing
  intentions/ and every worktree gaining the symlink the graph tooling that
  drives the handoff is itself broken. The blocker list reads as breadth-wide
  quiescence rather than mechanism dependency, and the fleet keeps minting
  tactics, so the set may never converge. Recorded explicitly as INFERENCE from
  the list's breadth: the blockers were not read individually this round. That
  verification is this tactic's first unit. SUPERSEDED IN PART, 2026-08-21: that
  first unit is DONE — the 2026-08-14 decision session read all 37 blockers
  individually and recorded the per-blocker classification in this node's body,
  confirming the inference. What the statement asks for has been determined;
  what remains is enactment on a DIFFERENT node (tactic-graph-ref-split's
  blocked_by and cutover procedure), which is outside this statement's scope.
  See clarifications 5 and 6 and the park reason."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications:
  - question: 2026-08-21 — Has ref-split's blocker set moved at all since the
      2026-08-14 audit recorded 37 blockers / 14 done / 23 open?
    answer: "No. Measured 2026-08-21 at origin/main 9abdb750 via listNodes
      (packages/intentionsutil/src/store.ts) over intentions/: total 37, done
      14, open 23, missing/pruned 0 — and the open set's phase membership is
      IDENTICAL to the 2026-08-14 record, node id for node id (implement 11,
      main-qa 7, qa 4, review 1). Seven days, zero net movement, no membership
      churn. This upgrades the node's central 'never converges' finding from an
      argument about the fleet's minting rate to a directly measured seven-day
      flatline."
  - question: 2026-08-21 — Can ref-split's open blocker set drain autonomously, or
      is it itself blocked on the author?
    answer: "It cannot drain autonomously. Measured 2026-08-21 at origin/main
      9abdb750: 10 of the 23 open blockers are themselves office_hours-parked —
      tactic-align-tactics-tactic-mode-drift-gate, tactic-census-scripted-tick,
      tactic-clarification-citation-ids,
      tactic-delegation-classification-derivation,
      tactic-graph-commit-delete-vs-edit-park-hardening,
      tactic-graph-tick-node-lane-auto-merge,
      tactic-manual-path-reservation-sweep, tactic-node-ancestry-context,
      tactic-office-hours-drain-claim, tactic-office-hours-select-fresh-main. So
      43% of the open set is waiting in the same office-hours queue this node is
      being parked into. This sharpens the moving-target finding: it is not only
      that the fleet mints new tactics faster than the set drains, it is that
      the EXISTING membership is itself author-blocked and cannot drain without
      sittings."
  - question: 2026-08-21 — Is this node's body claim that
      'tactic-graph-refsplit-read-coherence stays parked with it' true?
    answer: "No — stale as recorded, and it was never enacted. Measured 2026-08-21
      at origin/main 9abdb750: tactic-graph-refsplit-read-coherence is phase:
      null, office_hours: null, status: raw — classified 'draft' by
      classifyTactic (packages/intentionsutil/src/census.ts:13-18), NOT
      born-parked. The 2026-08-14 disposition asserted the park as a fact rather
      than performing it as a graph write. Either park that node or drop the
      claim; do not leave the record asserting a state the store does not hold."
  - question: 2026-08-21 — Has the interim this node warned would 'become permanent'
      under DEFER actually shipped?
    answer: "Yes, and the warning is now realized rather than predicted.
      tactic-graph-commit-landing-lock — which ref-split's record describes as
      'deleted when the ref split lands' — is measured at phase: done, status:
      codified on 2026-08-21 at origin/main 9abdb750. Under the recorded DEFER
      disposition plus the seven-day blocker flatline of clarification 1, the
      interim is live, load-bearing, and has no scheduled removal. That is the
      concrete accepted cost of DEFER and the sitting should price it
      explicitly."
  - question: 2026-08-21 — Was the 2026-08-14 disposition's rider — 're-cut
      ref-split's blocker set to the 8 mechanism-related nodes rather than
      waiting it out' — ever enacted?
    answer: "No. Measured 2026-08-21 at origin/main 9abdb750: tactic-graph-ref-split
      still carries all 37 blocked_by entries, byte-unchanged. The rider was
      recorded as a recommendation inside THIS node's body and never landed as
      an edit to that node. Enacting it means editing another node's ratified
      design — its blocked_by set and its one-sitting cutover procedure — which
      is outside this node's statement (a determination, not an enactment) and
      is a greenfield design change of the kind
      .claude/rules/design-proposals.md and the strategy's
      human-decided-conditions doctrine reserve to the author."
  - question: 2026-08-21 — Does this node still carry executable work under its own
      statement, and can /align-tactics express the answer?
    answer: "Not as written, and no. The statement asks to DETERMINE two things; the
      body's 2026-08-14 disposition section answers both — Q1 (quiescence,
      CONFIRMED, with all 37 blockers read individually and 8 classified as
      genuine mechanism dependencies) and Q2 (the
      seed-graph-main-as-mirror-then-symlink-everywhere-first framing that
      dissolves the one-sitting window) — and records the disposition DEFER. The
      residue is enactment on tactic-graph-ref-split, a different node and a
      different scope (clarification 5). This matters mechanically:
      /align-tactics lands only phase: implement and never phase: done (SKILL.md
      'Out of scope'), so a finalize here would stamp 'ready to implement' onto
      a node whose determination work is already complete — asserting executable
      scope that does not exist. The honest dispositions are author-owned:
      transition this node to done, or restate its statement to cover the
      enactment. Both are writes this skill cannot make."
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: >-
    TWO independent drift blockers stop this per-node finalize. Both need an
    author ruling, and a tactic-target session never writes the serving
    strategy, so both are recorded here on the target. NO PLAN WAS AUTHORED.


    (A) SIDE A — MAJOR SCOPE DEVIATION. The serving strategy's ARMED
    maintenance-burden band condition is measured FALSE on BOTH limbs. The
    condition (intentions/strategy-graph-native-dispatch.md, ARMED 2026-08-05
    /align interview) declares: 'the open machinery-defect population — open
    (phase set, not done) plus born-parked tactics serving this strategy — stays
    at or below 35% of all tactics serving this strategy, and is non-increasing
    across consecutive samples derived from intentions/ git history at read
    time', measured at arming as 59/197 = 30.0%. It states its own consequence
    in its own text: 'A burden growing without bound is this condition FAILING
    (which parks the strategy for an author decision), not merely more work to
    do.'


    MEASUREMENT, so a fresh session need not re-derive it: at origin/main
    9abdb750 on 2026-08-21, measured ON THE CALLER THREAD through the CANONICAL
    code path — listNodes imported directly from
    packages/intentionsutil/src/store.ts plus strategyBacklogBand and
    classifyTactic imported directly from packages/intentionsutil/src/census.ts,
    NOT a reimplementation of their rules — 316 tactics serve this strategy: 97
    done, 89 draft, 84 open, 46 born-parked. Backlog = (84+46)/316 = 130/316 =
    41.14%. Limb one (<=35% ceiling) is BREACHED by 6.14 points. Limb two
    (non-increasing) FAILS against the strategy's own recorded descent 47.6% ->
    38.2% -> 31.4% -> 24.6% and against the same-day ascending series 38.5%
    (fd98fd26) -> 39.4% (481572f1) -> 40.5% (3313bc46) -> 40.19% then 41.14%
    (9abdb750). The canonical align-tactics-census.ts could not be shelled out
    under the sandbox (npx tsx fails EPERM binding its IPC pipe); the
    direct-import path used here reaches the same functions the census script
    calls, which is strictly stronger than reimplementing them.


    THIS IS THE FIFTH NODE PARKED ON THIS ONE CONDITION inside roughly 48 hours.
    The four already parked and still sitting are
    tactic-supersession-retirement-sweep,
    tactic-graph-commit-park-content-durability,
    tactic-align-tactics-drift-dump-office-hours and
    tactic-align-tactics-immaterial-drift-redirect (verified by reading each
    park's own reason, not by grepping for the band phrase — 10 nodes MENTION
    the band but 6 of those are -drift-observations carriers that merely quote
    it). Every /align-tactics round on this strategy now parks here before
    authoring anything, so the lane is closed until the band is ruled.


    THE COMPOUNDING LOOP, quantified this round because it changes what a sane
    ruling looks like: classifyTactic
    (packages/intentionsutil/src/census.ts:13-18) scores born-parked as backlog
    and draft as neither, so every Side-A park converts its own target from
    draft to born-parked and moves one tactic INTO the numerator the condition
    measures. Of the 46 born-parked tactics, 13 are pure -drift-observations
    observation carriers with no plan, and 26 of 46 (57%) were parked on or
    after 2026-08-20. The loop is visible inside a single round: 40.19% at this
    session's branch cut, 41.14% after the preceding park landed. HOWEVER — and
    this is the part that defends the breach against being dismissed as an
    artifact — removing all 13 observation carriers from BOTH numerator and
    denominator still gives 117/303 = 38.61%, above the 35% ceiling. The lane's
    own bookkeeping inflates the figure by roughly 2.5 points; the breach
    survives its complete removal.


    (B) MATERIAL REQUIREMENT AMBIGUITY, folded here rather than raised
    separately because it decides what happens to this node no matter how the
    band is ruled: THIS NODE'S OWN WORK IS ALREADY DONE, and /align-tactics
    structurally cannot say so. The statement asks to DETERMINE two things. The
    body's 2026-08-14 disposition section answers both — Q1 quiescence CONFIRMED
    with all 37 blockers read individually and 8 classified as genuine mechanism
    dependencies; Q2 answered with the
    seed-graph-main-as-mirror-and-install-the-symlink-everywhere-first framing
    that dissolves the one-sitting window — and records the disposition DEFER
    with a rider. The residue is ENACTMENT on tactic-graph-ref-split (re-cut its
    37 blocked_by entries to the 8, rewrite its cutover procedure), which is a
    different node, a different scope, and a greenfield design change to a
    ratified record. /align-tactics lands only phase: implement and never phase:
    done (SKILL.md 'Out of scope'), so finalizing here would stamp 'ready to
    implement' onto a node whose determination is complete — asserting
    executable scope that does not exist. See clarifications 5 and 6.


    SIX MEASURED FINDINGS landed as this node's own clarifications this round
    rather than as a separate carrier (see the placement note below); the
    sitting should read them before ruling (B), because three of them — the
    seven-day blocker flatline, the 10-of-23 author-blocked open blockers, and
    the shipped-and-now-permanent tactic-graph-commit-landing-lock — are new
    evidence bearing on whether DEFER is still the right disposition.


    PLACEMENT NOTE, recorded so it does not read as an error: this round's
    Side-B observations were folded into this node's own clarifications and body
    round-record rather than minted as a separate born-parked
    -drift-observations carrier. That is deliberate and doubly grounded.
    Clarification 245/V1 forbids only an autonomous write to the STRATEGY's
    clarifications, which this is not — these are the target tactic's own. And
    minting a carrier when the park's own reason is a backlog-band breach would
    write a fresh born-parked tactic straight into the numerator the park is
    about, which is exactly the loop quantified above; 13 such carriers already
    exist. Since this node now sits in the office-hours queue itself, the
    observations reach the same sitting a carrier would have routed them to.


    NOTHING ABOUT THIS NODE IS DEFECTIVE as a record beyond the one stale claim
    in clarification 3.
  since: 2026-08-21
  recommendation: >-
    Two rulings are owed, and they are independent — rule both.


    RULING 1 — THE BAND, which must be made ONCE FOR THE WHOLE STRATEGY, not per
    node. Five nodes are now parked on it and every further /align-tactics round
    will park identically, so a per-node answer just re-opens the queue. Three
    explicit dispositions: (a) RE-AFFIRM the 35% ceiling and accept that the
    align-tactics lane on this strategy stays closed until the backlog is worked
    down — then say what drains it, because clarification 2's finding is that 10
    of 23 of ref-split's own open blockers are themselves author-parked, so the
    backlog cannot drain without sittings either; (b) RE-DECLARE the band
    against the grown population — the denominator went 197 -> 316 since arming
    and the recorded reading (58/236 = 24.6%) is stale by ~16 points and 80
    tactics, so a re-derivation is defensible on its face, and the honest
    re-derivation should decide whether pure -drift-observations carriers (13
    today, no plan, never dispatched) belong in the numerator at all, since
    removing them moves the figure 41.14% -> 38.61% without changing any real
    work; (c) ACCEPT the breach with a stated remediation and an explicit
    re-measure date. Whichever is chosen, ALSO refresh the strategy's `reading`
    field and say what becomes of the four already-parked nodes — they will not
    unpark themselves. Do NOT ask another autonomous round to re-measure first:
    this is the fifth independent measurement in 48 hours (38.5%, 39.4%, 40.5%,
    40.19%, 41.14%), all agreeing within 3 points and all rising.


    RULING 2 — THIS NODE'S DISPOSITION, which does not depend on the band. The
    determination this tactic exists to make is already complete in its body
    (clarification 6). Three explicit dispositions: (a) TRANSITION THIS NODE TO
    DONE — its statement is satisfied, its answer is recorded, and the enactment
    residue is genuinely different work; then decide separately whether to mint
    a new tactic for the enactment (re-cut ref-split's blocked_by to the 8
    mechanism-related nodes and rewrite its cutover procedure per Q2), which is
    a greenfield design change to a ratified record and so is an /align call,
    not an /align-tactics one; (b) RESTATE this node's statement to cover the
    enactment as well as the determination, and re-run /align-tactics on it once
    the band is ruled — this is the only path on which a finalize here is
    honest; (c) PRUNE it if the DEFER disposition means the enactment will not
    happen, but note that (c) leaves clarification 4's finding standing —
    tactic-graph-commit-landing-lock has shipped as done and its record still
    says it is deleted when the ref split lands, so something must reconcile
    that either way.


    TWO SMALL CLEANUPS the sitting can make in passing, both one-line:
    tactic-graph-refsplit-read-coherence is a draft, not parked, contradicting
    this node's body (clarification 3) — park it or drop the claim. And this
    node's re-plan needs no re-derivation of anything: all six clarifications
    carry their measurements, the origin/main sha they were taken at (9abdb750),
    and the exact code path used.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Determine whether tactic-graph-ref-split's 37 blockers encode real dependencies or a quiescence requirement that never converges — and if the latter, what makes its cutover incremental instead of one-sitting

Draft retained from the 2026-08-14 `/align` round. Not a plan.

## Status — PARKED to office_hours, 2026-08-21 (no plan authored)

An `/align-tactics tactic-graph-refsplit-blocker-audit` per-node finalize ran on
2026-08-21 against `origin/main` `9abdb750` and **parked without authoring a
plan**, on two independent grounds. Both are in `office_hours.reason`; the
ruling asks are in `office_hours.recommendation`. In short:

- **(A) Side A — the serving strategy's armed maintenance-burden band fails on
  both limbs**, re-measured on the caller thread through the canonical census
  functions at **130/316 = 41.14%** against a declared 35% ceiling, and rising.
  This is the **fifth** node parked on that one condition in ~48 hours, so the
  band must be ruled **once for the whole strategy**, not per node.
- **(B) This node's own determination work is already complete** — the
  2026-08-14 disposition below answers Q1 and Q2 and records DEFER — and
  `/align-tactics` lands only `phase: implement`, never `phase: done`, so it
  structurally cannot record that. Finalizing here would assert executable
  scope that does not exist.

Six measured findings from this round are landed as this node's own
`clarifications` (not as a separate carrier — see the placement note in the
park reason) and are summarized in the round record at the end of this body.
Three of them are new evidence bearing on whether DEFER is still right.

## What was measured, and what was only inferred

**Measured 2026-08-14** against `origin/main` — every blocker's `phase:` field read
directly: 37 blockers, **14 done, 23 open, 0 missing/pruned**. The 23 open, by
phase:

- `implement` (11): `attention-surface-instrument`, `demo-saas-acceptance`,
  `legacy-office-hours-entry-removal`, `mount-schema`, `nix-clean-system-drill`,
  `node-ancestry-context`, `office-hours-graph-read-cwd-whitespace`,
  `omit-default-serialization`, `preview-deploy-on-demand`,
  `realignment-coverage-sensor`, `schema-drift-guard`
- `main-qa` (7): `align-tactics-tactic-mode-drift-gate`,
  `dependency-justification-audit`, `graph-commit-delete-vs-edit-park-hardening`,
  `graph-tick-node-lane-auto-merge`, `manual-path-reservation-sweep`,
  `office-hours-drain-claim`, `office-hours-select-fresh-main`
- `qa` (4): `census-scripted-tick`, `tactic-delegation-classification-derivation`,
  `phase-evidence-fingerprint-bound`, `scope-fingerprint-plan-substance`
- `review` (1): `clarification-citation-ids`

**Inferred, not verified.** That this set encodes *quiescence* ("nothing may be in
flight during the cutover") rather than *mechanism dependency* ("ref-split's design
needs this to exist first") is read from the breadth of the list — `demo-saas-acceptance`,
`nix-clean-system-drill` and `preview-deploy-on-demand` have no obvious relation to
the graph store's ref layout. **The blockers were not read individually.** Verifying
that classification, per blocker, is this tactic's first unit. It may be wrong.

## Why the answer matters

`tactic-graph-ref-split`'s own cutover procedure states the constraint that makes
the blocker set decisive:

> **This node does not hand off between phases.** [...] between the moment `main`
> loses `intentions/` (Unit 8) and the moment every worktree has the `intentions`
> symlink, the graph tooling that drives the handoff is itself broken. A session
> that stops halfway leaves the fleet unable to read its own queue, and the recovery
> path (`park-node`, `office-hours-graph`) is part of what is broken. So the
> implementing session runs Units 1-8 through to merge in one sitting, or it does
> not start.

If the blockers are a quiescence requirement, they are a moving target: the fleet
mints tactics continuously, so the set may never reach zero, and the ratified
greenfield would be permanently unreachable while its interim
(`tactic-graph-commit-landing-lock`, explicitly "deleted when the ref split lands")
becomes permanent. If they are real dependencies, the count is simply progress and
nothing structural is wrong.

## The second question, only if the first answers "quiescence"

What makes the cutover incremental? The one-sitting constraint comes from a window
where `main` has lost `intentions/` but worktrees lack the symlink. Candidate
framings worth testing — none evaluated this round:

- install the symlink everywhere **first**, pointing at a `GRAPH_WT` seeded from a
  `graph-main` that is still a mirror of `main`'s `intentions/`, so no window exists;
- dual-write to `main` and `graph-main` through the cutover, making Unit 8 a
  no-reader-affecting deletion;
- keep `intentions/` on `main` permanently and take only the writer/ref changes —
  which raises the question of what the split still buys once the CI stamp is gone.

Note the interaction with `tactic-graph-commit-plumbing-default`: if the plumbing
default flips first, the stamp cost that motivated the split in the first place
(clarification 80) is unchanged — the scratch-branch CI stamp is a `main` branch-
protection cost, not a writer cost — so that flip does **not** subsume this.

## Disposition — 2026-08-14 (decision session, read-only, no diff)

This section closes the tactic's first unit: the per-blocker classification the
`rationale` recorded explicitly as INFERENCE. All 37 blockers were read
individually against `origin/main` at `da1c3c7f`.

### Q1 — real dependencies, or quiescence? **Quiescence. Measured.**

The counts stand as the section above recorded them (14 `done`, 23 open, 0
missing). What is new is that each open blocker's *relation to the ref layout*
is now classified rather than inferred from the list's breadth.

**8 of the 23 open blockers have a mechanism relation:**

| Blocker | Mechanism relation |
|---|---|
| `tactic-omit-default-serialization` | rewrites every node file — collides directly with Unit 1's `git subtree split --prefix=intentions`, whose output tree root *is* the node-file directory |
| `tactic-graph-commit-delete-vs-edit-park-hardening` | edits `graph-commit`, the exact file Unit 2 rewrites wholesale |
| `tactic-office-hours-select-fresh-main` | reads the very ref that moves |
| `tactic-graph-tick-node-lane-auto-merge` | batched `graph-commit` invocation |
| `tactic-census-scripted-tick` | batched `graph-commit` invocation |
| `tactic-realignment-coverage-sensor` | edits `read-sensors.ts` and `validate-graph.ts` — Unit 5's repointing surface |
| `tactic-schema-drift-guard` | edits `read-sensors.ts` and `validate-graph.ts` — same |
| `tactic-attention-surface-instrument` | edits `read-sensors.ts` — same |

(The decision session's first pass estimated "about 6". The figure is **8**: the
five `graph-commit`/ref-reading nodes plus three that edit the sensor scripts
Unit 5 repoints. Unit 5's surface is the *scripts* `read-sensors.ts` and
`lib-deleted-node-ids.ts`, not sensor *nodes* — the three above were found by
grepping the open blockers for those script paths.)

**The remaining 15 have no relation to the ref layout at all** beyond "must not
be in flight during a one-sitting cutover" — `tactic-demo-saas-acceptance`,
`tactic-nix-clean-system-drill`, `tactic-preview-deploy-on-demand`,
`tactic-mount-schema`, `tactic-dependency-justification-audit`, and the rest.
Nothing in ref-split's design needs any of them to exist first; they are on the
list because the cutover cannot tolerate concurrent work, which is a property of
the *procedure*, not of the design.

**So the `rationale`'s inference is CONFIRMED**, and with it the concern that
follows from it: the set is a moving target. The fleet mints tactics
continuously, so a blocker list whose membership rule is "nothing may be in
flight" never converges, and the ratified greenfield stays permanently
unreachable while its interim (`tactic-graph-commit-landing-lock`, explicitly
"deleted when the ref split lands") becomes permanent.

### Q2 — what makes the cutover incremental?

**The first candidate framing listed above is the right one**, and it dissolves
the constraint rather than working around it:

Seed `graph-main` as a mirror of `main:intentions/` and install the `intentions`
symlink everywhere **while `main` still carries the directory**. At no point is
there a window in which a reader is broken — during the transition both paths
resolve to the same content. Unit 8's deletion of `main:intentions/` then becomes
a final step that affects no reader, because every reader is already going
through the symlink.

That removes the one-sitting constraint, and with it the reason 15 of the 23
open blockers are on the list at all. The blocker set should be **re-cut** to the
8 mechanism-related nodes rather than waited out.

### Disposition: **(b) DEFER — ref-split does not land before Bundle 1**

With a rider: its blocker set should be re-cut per Q2 rather than waited out,
since the fleet mints tactics continuously and the set never converges on its
current membership rule.

`tactic-graph-refsplit-read-coherence` stays parked with it.

---

## Correction — the serialized PR plan's exposure claim is wrong

`plans/dispatch-rsi-serialized-pr-plan.md` states, under PR1's Dependencies,
that PR1 "Units 1–4 repair the CI-stamp/scratch-branch write mechanic that
ref-split replaces" and that "Units 5–8 survive either way". Read against
ref-split's own Unit 2 (`intentions/tactic-graph-ref-split.md`, the
delete-entirely and keep-unchanged lists), that split is **not** where the
exposure actually falls:

| PR1 unit | Under ref-split | Evidence in `tactic-graph-ref-split.md` |
|---|---|---|
| U1 far-ahead rebuild / `noop` | **deleted** | `ensure_intentions_only_base()` is on the delete-entirely list — "the far-ahead-worktree rebuild hazard this exists for is structurally impossible once landing never touches a worktree's checkout" |
| U2 sensor-validator scope + PR CI | **survives, and becomes more load-bearing** | Unit 2 step 5 makes `validate-graph.ts` the *sole* push gate, replacing `.github/workflows/graph-fast-path.yml`'s guard job |
| U3 prose refs vs the batch | **survives** | pure `schema.ts`; ref-independent |
| U4 fixture graph | **survives, and helps** | makes the CLI suite ref-independent instead of `origin/main`-coupled |
| U5 ORPHANED rc split | **deleted** | `await_checks` and its `CHECK_POLL_SECONDS`/`CHECK_TIMEOUT_SECONDS` globals are on the delete-entirely list |
| U6 `SNAP_DIR` immutability | **survives; is a prerequisite** | `snapshot()` is on the keep-unchanged list as "still the sole surviving copy of a writer's content on the fail-closed park path" — which is exactly the property U6 makes true |
| U7 npx park storm | **survives, reduced** | the `ensure_intentions_only_base` caller goes; the `check_base_freshness` call sites remain |
| U8 explicit ref on reads | **survives; is a prerequisite** | Unit 2 step 5 invokes `validate-graph.ts <tmp>` with an explicit directory argument |

So the real exposure is **U1 and U5 only** — not Units 1–4 — and three units
(U2, U6, U8) are things ref-split *needs to exist first*. PR1 proceeds with all
8 units under either disposition.

**PR15 is the PR genuinely at risk**: its Units 1–2 are subsumed by ref-split's
Unit 2 rewrite. Do not start PR15 before revisiting this disposition.

### Consequence accepted deliberately

U1 and U5 are implemented anyway, under DEFER, as a recorded accepted cost. U1
is the highest-severity item in PR1 — silent loss of a node edit, armed by any
unpushed local commit on `main` — and every one of the ~94 node closures the
serialized PR plan prescribes runs through that writer. Leaving it unfixed for
the length of the window is worse than the rework risk, and the rework risk is
bounded: if ref-split ever lands, this code is *deleted*, not migrated, so
nothing has to be re-derived.

---

## Round record — 2026-08-21 `/align-tactics` per-node finalize (PARKED)

Ran against `origin/main` `9abdb750`. Outcome: **parked to `office_hours`, no
plan authored**. Everything below is measured at that sha; a re-plan needs to
re-derive none of it.

### Why no Workflow fan-out ran, recorded so the coverage bound is explicit

The decompose/plan fan-out was **deliberately not invoked**. Two reasons, both
mechanical rather than judgment calls:

1. The Side-A blocker is a **measurement of a human-decided condition**, and the
   measurement was performed on this thread through the canonical code path
   (`listNodes` from `packages/intentionsutil/src/store.ts`, `strategyBacklogBand`
   and `classifyTactic` from `packages/intentionsutil/src/census.ts`, imported
   directly rather than reimplemented). A subagent cannot overturn a condition
   the author owns, and four prior rounds on this strategy reached the identical
   park.
2. `intentions/strategy-graph-native-dispatch.md` is **577 KB**. Passing its
   `clarifications` into `args` hits the known args-size ceiling, and truncating
   them is the exact failure that left `tactic-align-review-skill`'s Side-A sweep
   under-evidenced when its clause-coverage agent died.

**The bound this creates:** the Side-B sweep here is this thread's own
fact-checking of the node's recorded claims (the six clarifications), not a
Workflow-driven drift review. It is narrower in breadth than a full fan-out,
though every claim it does make is directly measured. Treat "no further Side-B
drift exists" as **unestablished**, not as checked-and-clear.

### The six measured findings (full text in `clarifications` 1–6)

| # | Finding | Measured value at `9abdb750` |
|---|---|---|
| 1 | Blocker set has not moved in 7 days | 37 total / 14 done / 23 open — membership **identical** to the 2026-08-14 record, node id for node id |
| 2 | The open set cannot drain autonomously | **10 of 23** open blockers are themselves `office_hours`-parked |
| 3 | This body's "read-coherence stays parked" claim is false | `tactic-graph-refsplit-read-coherence` is `phase: null`, `office_hours: null` → a **draft**, never parked |
| 4 | The interim warned about has shipped | `tactic-graph-commit-landing-lock` is `phase: done` — live, load-bearing, no scheduled removal |
| 5 | The 2026-08-14 rider was never enacted | `tactic-graph-ref-split` still carries all **37** `blocked_by` entries, unchanged |
| 6 | This node's stated work is complete | Q1 and Q2 both answered in the disposition above; residue is enactment on a *different* node |

Findings 1, 2 and 4 are the ones that bear on whether **DEFER** is still the
right disposition — they are new since the disposition was recorded.

### The band, and the compounding loop it sits in

Measured: 316 tactics serve `strategy-graph-native-dispatch` — 97 done, 89
draft, 84 open, 46 born-parked → backlog **130/316 = 41.14%** against a declared
**≤35%** ceiling (breached by 6.14 points). The non-increasing limb fails too,
against both the strategy's recorded descent (47.6% → 38.2% → 31.4% → 24.6%) and
the same-day ascending series (38.5% → 39.4% → 40.5% → 40.19% → 41.14%).

`classifyTactic` (`packages/intentionsutil/src/census.ts:13-18`) scores
`born-parked` as backlog and `draft` as neither, so **every Side-A park moves its
own target into the numerator the condition measures**. Of the 46 born-parked
tactics, **13** are pure `-drift-observations` carriers with no plan, and **26 of
46 (57%)** were parked on or after 2026-08-20.

The measurement that keeps this from being dismissed as an artifact: removing
all 13 observation carriers from **both** numerator and denominator still gives
**117/303 = 38.61%** — above the ceiling. The lane's own bookkeeping inflates the
figure by ~2.5 points; **the breach survives its complete removal.**

### Where the observations landed, and why

Folded into this node's own `clarifications` and this round record rather than
minted as a separate born-parked `-drift-observations` carrier. Deliberate:
clarification 245/V1 forbids only an autonomous write to the **strategy's**
clarifications (these are the tactic's own), and minting a carrier when the
park's own reason is a backlog-band breach would write a fresh born-parked
tactic straight into the numerator the park is about. Thirteen such carriers
already exist. This node is now in the office-hours queue itself, so the
observations reach the same sitting a carrier would have.
