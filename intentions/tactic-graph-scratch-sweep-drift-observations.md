---
id: tactic-graph-scratch-sweep-drift-observations
kind: tactic
statement: "Observation carrier, no plan, do not dispatch: two immaterial drift
  observations from the 2026-08-20 /align-tactics per-node round on
  tactic-graph-scratch-ref-leak — the maintenance-burden band's numerator
  wording reads three different values that straddle its own 35% threshold, and
  graph-commit's remote scratch-branch delete is a deliberate, documented
  exemption from the no-residue and no-silent-failure invariants"
owner: human
status: delegated
parent: null
rationale: "Minted 2026-08-20 by the /align-tactics per-node round on
  tactic-graph-scratch-ref-leak. That round's Side-B drift review surfaced two
  premises, both judged immaterial (neither gated the plan; drift.proceed stayed
  true and no park was written). Immaterial observations may not be written as
  clarifications on the serving strategy: clarification 118 permitted that and
  was OVERTURNED 2026-08-15 by violation V1 of the autonomous-substance
  invariant, which routes them to a born-parked observation node instead —
  because clarifications is an allowlist member of strategyFingerprint (so an
  autonomous write there soft-freezes every open child over something defined as
  gating nothing), because it is a requirement-entry surface reserved to the
  /align interview, and because a model-authored dated clarification is
  byte-indistinguishable from an author-ruled one. A tactic-target session
  additionally never touches the serving strategy's frontmatter at all. Both
  observations here are addressed to the strategy's OWN record — one to a
  condition's counting convention, one to the class boundary of two standing
  invariants — so neither is a tactic clarification that could have landed on
  the target node instead. Provenance to the minting node is recorded in prose
  here and in office_hours.reason: clarification 250 (2026-08-20) requires a
  durable STRUCTURAL provenance edge, but leaves the carrier field to an
  implementing tactic and forbids overloading blocked_by, and no such field
  exists in schema.ts today — so prose is what is available, matching every
  sibling carrier. This node carries no plan and must never be dispatched."
reading: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: null
execution: null
validates: []
blocked_by: []
office_hours:
  reason: "Born parked as an observation carrier — there is no plan here and
    nothing to dispatch. It exists because the 2026-08-20 /align-tactics
    per-node round on tactic-graph-scratch-ref-leak produced two immaterial
    Side-B drift observations with no other legal destination (see rationale).
    OBSERVATION 1 — the maintenance-burden band condition's numerator wording,
    \"open (phase set, not done) plus born-parked tactics\", reads three
    different values against the same corpus, and they straddle the 35%
    threshold: phase-set-and-not-done alone is 76/309 = 24.6%; adding the 34
    tactics parked with no phase is 110/309 = 35.6%; the union with every parked
    tactic including the 3 that are already done is 113/309 = 36.6%. The 24.6%
    reading exactly reproduces the value in the strategy's own 2026-08-10
    reading (58/236 = 24.6%), so that is the convention the recorded
    non-increasing series uses, and under it the band holds — but a reader
    applying the condition literally lands outside it. OBSERVATION 2 —
    graph-commit's remote scratch-branch delete is a deliberate, documented
    exemption from the no-residue (clarification 91) and no-silent-failure
    (clarification 93) invariants: cleanup() runs `git push origin --delete
    \"$SCRATCH_BRANCH\" >&2 || true` (graph-commit:902-903) under a header
    stating the delete is best-effort because \"a leftover scratch branch is
    harmless and would be overwritten by the next same-PID run\"
    (graph-commit:849-851), with the trap documented as \"deliberately
    incomplete: a SIGKILL fires no trap at all\" (graph-commit:865). The
    exemption is defensible on correctness grounds — test-graph-commit.sh cases
    54/55 kill a writer mid-stamp and ASSERT the surviving scratch ref as
    expected — so the residue is namespace hygiene, not landing correctness. It
    is nonetheless unbounded in practice: 10 refs on 2026-07-28, 14 on
    2026-08-20, and no production script anywhere lists or deletes
    refs/heads/graph/** (only the test-only drop_scratch_refs helper does).
    Neither observation gated the plan; the finalized node needs no park. Both
    are recorded in full in this node's body. CALLER-VERIFIED: the landing
    session re-measured both observations against origin/main before
    transcribing them here. Observation 1's three census readings and the
    34/3/13/135 sub-counts all reproduced exactly. Observation 2 was corrected
    on one limb — the drift phase reported 15 refs on 2026-08-20; the measured
    count is 14. Every graph-commit and test-graph-commit.sh anchor quoted above
    was read in the file and is exact."
  since: 2026-08-20
  recommendation: >-
    Read the two observations in the body and give each ONE of three
    dispositions — drop, clarify-only, or mechanize — then resolve this node. It
    is a carrier: once each entry is dispositioned there is nothing left to keep
    it open.


    Suggested dispositions, for the author to accept or override:


    Observation 1 (the band's numerator has no recorded counting convention) —
    CLARIFY-ONLY, and it is the more consequential of the two, because this
    condition FAILING parks the strategy for an author decision. Pin the
    convention in the condition text itself rather than leaving it to each
    reading round: say whether a born-parked tactic with no phase counts, and
    whether the 135 status:raw draft byproducts belong in the denominator at
    all. Two sub-questions worth settling in the same sitting: whether the 13
    born-parked observation carriers (this node will be the 14th) should count
    toward the burden they were created to record — they are minted BY the
    process the band measures, so counting them makes the band partly
    self-inflating — and whether the 3 done-but-parked tactics belong in either
    reading. Do not MECHANIZE before the convention is decided; a sensor built
    on the wrong numerator is worse than none. Do not DROP — the two readings
    differ by 11 points across a threshold that gates a strategy park.


    Observation 2 (the delete is a documented exemption from two standing
    invariants) — CLARIFY-ONLY is the likely read, and the finalized plan
    already acts on the actionable half: its Edit B replaces the `|| true` with
    a named diagnostic, so the silent limb is closed in code whether or not the
    record is amended. What a clarification would add is the class boundary
    itself — that clarifications 91 and 93 bind the node WRITE, while cleanup of
    a stamping artifact is contained by a collector living outside any single
    writer's lifetime rather than by that writer's own trap. Worth recording
    because the next reader of those two invariants will hit the same question.
    Do not MECHANIZE — there is nothing to enforce beyond what Edit B already
    does. DROP is defensible if you judge the boundary obvious, but note it was
    not obvious to this round: the exemption had to be read out of the code
    comments, not the graph.
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
## What this node is

An **observation carrier**. It holds two immaterial Side-B drift observations from the
2026-08-20 `/align-tactics` per-node round that finalized
`tactic-graph-scratch-ref-leak`. It carries **no plan**, and it must **never be
dispatched** — there is no unit of work here, only two things a human should look at and
decide about.

It exists because an autonomous session has nowhere else to put them. Immaterial
observations used to be written as dated `clarifications` on the serving strategy under
clarification 118; that permission was **OVERTURNED 2026-08-15** by violation V1 of the
autonomous-substance invariant. Three reasons, all of which apply here: `clarifications`
is an allowlist member of `strategyFingerprint`, so an autonomous write there would
soft-freeze every open child of `strategy-graph-native-dispatch` over something defined
as gating nothing; it is a requirement-entry surface reserved to the `/align` interview;
and a model-authored dated clarification is byte-indistinguishable from an author-ruled
one, which collapses provenance in the field that carries doctrine. Separately, a
tactic-target session never edits the serving strategy's frontmatter at all.

Both observations below are addressed to the **strategy's own record** — one to a
condition's counting convention, one to the class boundary of two standing invariants —
so neither could have landed as a clarification on the target tactic instead.

Nothing here gated the plan. `drift.proceed` stayed true, `parks` was empty, and
`tactic-graph-scratch-ref-leak` was finalized to `phase: implement` in the same round.

## Observation 1 — the maintenance-burden band's numerator has no recorded counting convention

The band condition reads, in part:

> the open machinery-defect population — **open (phase set, not done) plus born-parked
> tactics** serving this strategy — stays at or below 35% of all tactics serving this
> strategy, and is non-increasing across consecutive samples

"plus born-parked tactics" admits three defensible readings, and they **straddle the 35%
threshold**. Measured over `intentions/` at `origin/main`, 2026-08-20, against a
denominator of **309** tactics serving `strategy-graph-native-dispatch`:

| reading | count | share |
| --- | --- | --- |
| A — `phase` set and not `done`, only | 76 / 309 | **24.6%** |
| B — A plus the 34 tactics parked with no `phase` | 110 / 309 | **35.6%** |
| C — the union of A with *every* parked tactic, including the 3 already `done` | 113 / 309 | **36.6%** |

Reading A reproduces the strategy's own recorded 2026-08-10 reading exactly
(`58/236 = 24.6%`), so **A is the convention the recorded non-increasing series actually
uses**, and under it the band holds. But a reader applying the condition's literal
wording — which says "plus born-parked tactics" in terms — gets B or C and lands
**outside** the band. The condition FAILING is defined to park the strategy for an author
decision, so the gap between 24.6% and 35.6% is not bookkeeping.

Two sub-questions the deciding sitting should settle in the same pass:

- **Do observation carriers count?** There are **13** born-parked observation carriers
  serving this strategy today (this node makes 14): `tactic-align-tactics-gather-agent-death-silent`,
  `tactic-attributes-phase-squatter-drift-observations`,
  `tactic-base-pin-copy-recurrence-and-park-clear-disposition-gap`,
  `tactic-fingerprint-sha-provenance-drift-observations`,
  `tactic-graph-auto-merge-behind-arm-drift-observations`,
  `tactic-graph-commit-cross-arm-resolution-consistency`,
  `tactic-graph-plumbing-flip-drift-observations`,
  `tactic-graph-write-refresh-clobber-class-observation`,
  `tactic-harness-precondition-round-observations`,
  `tactic-observation-ladder-terminus-baseline-drift`,
  `tactic-optin-gated-widening-drift-observations`,
  `tactic-scope-stamp-coverage-out-of-graph-coupling-observation`, and
  `tactic-verify-landed-unknown-arm-drift-observations`. They are minted *by* the process
  the band measures, so counting them makes the band **partly self-inflating**: every
  autonomous round that records an observation raises the number the band reads. Under
  reading B they are 13 of the 34 parked-no-phase nodes — better than a third of the
  entire difference between A and B.
- **Does the denominator include drafts?** **135** of the 309 carry `status: raw` —
  draft byproducts retained by `/align` rounds, never decomposed. They inflate the
  denominator and so *depress* the ratio, which cuts the opposite way from the numerator
  question.

This is recorded as an observation for the next reading round, **not** as a band
determination. A per-node finalize does not measure the strategy's signal, and this round
did not attempt to.

## Observation 2 — the scratch-branch delete is a documented exemption from two standing invariants

Two standing invariants of this strategy bind the class of graph-write primitives:

- **Clarification 91 (no residue)** — a graph write that fails to land leaves no residue.
- **Clarification 93 (never silent)** — every graph write that fails to land surfaces a
  diagnostic naming the node and the failure, and no call site may swallow the error.

`graph-commit`'s remote scratch-branch delete violates the second on its face, and the
code says so deliberately. `cleanup()` runs

```sh
git push origin --delete "$SCRATCH_BRANCH" >&2 || true   # graph-commit:902-903
```

under a header (`graph-commit:849-851`) stating the remote delete is best-effort because
*"a leftover scratch branch is harmless and would be overwritten by the next same-PID run
— so its failure never masks the real exit status"*, with the trap itself documented as
*"deliberately incomplete: a SIGKILL fires no trap at all"* (`graph-commit:865`).

The exemption is **defensible on correctness grounds**, and that is worth recording as
clearly as the gap itself: `test-graph-commit.sh` cases 54/55 SIGKILL a writer parked
inside `await_checks()` and **assert the surviving scratch ref as expected behaviour**,
and a plain re-run of the identical invocation still lands. So the residue is a
**namespace-hygiene** problem, not a landing-correctness one.

It is nonetheless **unbounded in practice**. Origin carried 10 such refs on 2026-07-28
and **14** on 2026-08-20, growing through the three graph write-path PRs that landed in
between, and no production script anywhere in `packages/intentionsutil/scripts`,
`.claude/skills`, or `.github` lists or deletes `refs/heads/graph/**` — the only code that
does is `drop_scratch_refs()`, a test-only helper.

The class boundary this suggests, and the thing a clarification would actually add:
**clarifications 91 and 93 bind the node WRITE itself; cleanup of a *stamping artifact* is
contained by a collector living outside any single writer's lifetime, rather than by that
writer's own trap.** The finalized plan on `tactic-graph-scratch-ref-leak` builds exactly
that collector, and its Edit B independently replaces the `|| true` with a named
diagnostic — so the silent limb is closed in code whether or not the record is amended.

## Provenance and caller verification

Minted by the `/align-tactics` per-node finalize round on
`tactic-graph-scratch-ref-leak`, 2026-08-20, and landed in the same `graph-commit` as that
node's finalization.

Provenance to the minting node is recorded **in prose** — here, in `rationale`, and in
`office_hours.reason`. Clarification 250 (2026-08-20) requires a durable **structural**
provenance edge on every node minted during a run, but it explicitly leaves the choice of
carrier field to an implementing tactic, forbids overloading `blocked_by` (a blocking
edge, deleted by prune-on-done at exactly the moment provenance becomes interesting), and
requires the edge to ship with a check that fails when it is missing. No such field exists
in `schema.ts` today, so prose is what is available — the same shape every sibling
observation carrier uses.

**Caller verification.** Per the standing distrust of drift-phase factual claims, the
landing session re-measured both observations against `origin/main` before transcribing
them:

- Observation 1's three census readings (24.6% / 35.6% / 36.6%) and every sub-count
  (309 denominator, 76 phase-set-not-done, 34 parked-no-phase, 3 parked-and-done, 13
  observation carriers, 135 `status: raw`) **reproduced exactly**.
- Observation 2 was **corrected on one limb**: the drift phase reported **15** refs on
  origin at 2026-08-20; the measured count is **14**. Corrected above and in
  `office_hours.reason`.
- Every `graph-commit` and `test-graph-commit.sh` anchor quoted above was read in the
  file and is exact.
