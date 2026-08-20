---
id: tactic-graph-plumbing-flip-drift-observations
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-graph-commit-plumbing-default: three Side-B drift observations
  with no legal autonomous destination — a rollback heuristic that goes vacuous
  under a global plumbing writer, a stale line-anchor and a stale in-prose claim
  inside strategy clarification 237 itself, and a backlog series whose
  non-increasing clause tripped while its ceiling held"
owner: human
status: delegated
parent: null
rationale: "Auto-created by the 2026-08-20 /align-tactics tactic-mode finalize
  of tactic-graph-commit-plumbing-default. The Workflow's drift phase returned
  three immaterial Side-B observations as clarifications_to_add. A per-node
  tactic-target session may not write them to the serving strategy: strategy
  clarification 245 (violation V1 of the autonomous-substance invariant)
  overturned clarification 118, and
  .claude/skills/align-tactics/references/tactic-target.md forbids any strategy
  frontmatter write from this path. They are recorded here instead, born-parked,
  for a human to promote, mechanize, or drop at office hours. This node carries
  NO plan and must not be dispatched."
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
  reason: "Observation carrier, not planned work — three Side-B drift observations
    from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-graph-commit-plumbing-default, with no legal autonomous destination
    (clarification 245 / V1 forbids an autonomous lane writing strategy
    clarifications, and a tactic-target session never touches the serving
    strategy's frontmatter at all). (1) ROLLBACK HEURISTIC GOES VACUOUS:
    release-wait:205 and demote-node-to-implement:154 decide whether their
    pre-write copy is still the correct restore target from HEAD_BEFORE !=
    head_now plus an EXPECT_BLOB content check; under a global plumbing writer a
    landed write never moves HEAD and never touches the tree, so BOTH guards
    pass and the EXIT trap restores pre-write bytes over content already on
    origin/main. park-node:435-455 and clear-park are immune (they take
    verify-landed's origin/main verdict); arm-wait:220-244 and hold-node carry
    NEITHER guard, so they have the hazard on both writers today — pre-existing,
    not caused by the flip. The finalized plan absorbs the fixable half as Unit
    1 (a post-land residue clear inside graph-commit, which restores the
    EXPECT_BLOB guard's meaning) plus Unit 5's annotation; what stays unrecorded
    is the generalization. (2) STRATEGY CLARIFICATION 237 CARRIES A STALE ANCHOR
    AND A STALE CLAIM: it cites graph-commit:3502 for the guard call site and
    says the guard 'sits in land(), not try_land()'. Measured at origin/main
    6ce8702d: assert_clean_outside_ids is defined at :3591 and called exactly
    once at :3794, inside main() (:3648) — not land() (:2950), not try_land()
    (:2743). The substance is unchanged and if anything stronger (a main()-level
    pre-flight gated on the writer). Only the author may amend a clarification.
    (3) BACKLOG BAND — CEILING HOLDS, NON-INCREASING CLAUSE TRIPPED: measured
    via read-sensors.ts readBacklogBand/readBacklogSeries against origin/main,
    86/297 = 29.0% (band ≤35% holds), but the series renders 31.1% → 28.0% →
    21.9% → 29.0% (increasing), against the strategy's last recorded reading of
    58/236 = 24.6% with a non-increasing series. This round read that as the
    maintenance-burden condition NOT failing — the ceiling holds, the full 28d
    trend is still strongly down (53.1% → 29.0%), the tactic population grew 236
    → 297 so the ratio's denominator moved too, and one in-band uptick does not
    meet the condition's own failure test ('a burden growing without bound').
    That reading is the author's to overturn."
  since: 2026-08-20
  recommendation: "Three separable dispositions, one per observation; none blocks
    the other. (1) For the rollback heuristic: either MECHANIZE — file a tactic
    deriving every graph-write primitive's rollback decision from
    verify-landed's origin/main verdict (the shape park-node already uses),
    covering arm-wait and hold-node, which are unguarded on both writers today;
    or CLARIFY-ONLY — record it as a standing invariant under clarification 193
    ('the success verdict is read back from post-push REMOTE state') extended to
    the caller layer, and let the flip's Unit 1 carry the immediate correctness;
    or DROP if Unit 1 is judged sufficient. (2) For the stale anchor in
    clarification 237: CLARIFY-ONLY — amend the clarification's citation to
    graph-commit:3591 (definition) / :3794 (call site, in main()) at the next
    /align sitting, or DROP as immaterial since the substance is unchanged and
    tactic-graph-commit-plumbing-default's own body now carries the corrected
    anchors. (3) For the backlog series: nothing to do this round, but WATCH — a
    second consecutive increasing sample, or any sample above 35%, should be
    treated as condition 18 FAILING and park the strategy for an author
    decision. If the author disagrees with this round's reading, overturn it now
    rather than waiting for the second sample. After dispositioning all three,
    resolve this node (phase -> done) or prune it; it carries no plan and must
    never be dispatched to an implement lane."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---

# Observation carrier — 2026-08-20 `/align-tactics` round on `tactic-graph-commit-plumbing-default`

## What this node is

An **observation carrier**, not planned work. It has no plan, no units, and no
verification, and it must **never** be dispatched to an implement lane. It
exists because the 2026-08-20 `/align-tactics` tactic-mode round finalizing
`tactic-graph-commit-plumbing-default` produced three immaterial Side-B drift
observations that have no legal autonomous destination:

- A per-node `/align-tactics <tactic-id>` session never writes the serving
  strategy's frontmatter at all
  (`.claude/skills/align-tactics/references/tactic-target.md`).
- Strategy clarification **245** (violation **V1** of the autonomous-substance
  invariant) **overturned** clarification 118, which had allowed a per-node
  session to append clarifications. The immaterial path now mints one
  born-parked observation node instead, and the round proceeds uninterrupted.

A human promotes the worthwhile ones into clarifications, mechanizes them as
tactics, or drops them, at office hours. The full reason text and a
three-way recommendation are in `office_hours`; this body records the
supporting detail.

## Observation 1 — the `HEAD moved` rollback heuristic goes vacuous under a global plumbing writer

`release-wait:205` and `demote-node-to-implement:154` each decide whether their
pre-write copy is still the correct restore target from two guards:
`HEAD_BEFORE != head_now`, and an `EXPECT_BLOB` content comparison against what
the script itself wrote. The rollback is an `EXIT` trap firing on
`MUTATED == 1 && rc != 0` (`release-wait:241-244`), so it runs in the window
where `graph-commit` **landed** and the script then failed a later step — for
`release-wait`, the post-land `fetch` / `rev-parse` / parse verification at
`:374-396`.

Under the worktree writer a landed write moves the checkout's HEAD, so guard 1
is a real signal. Under a global plumbing writer it never does, and the writer
never touches the tree either, so **both** guards pass and the trap writes the
pre-write bytes over content already on `origin/main` — a stale dirty tracked
file, which is exactly the residue strategy clarification 91 forbids and which
makes `git merge --ff-only` refuse fleet-wide.

Already immune: `park-node:435-455` and `clear-park` discard `graph-commit`'s rc
and take `verify-landed`'s `origin/main` verdict, setting `MUTATED=0` on
`landed`. Unguarded on **both** writers today, and therefore **not** caused by
the flip: `arm-wait:220-244` (its trap restores from the captured blob
unconditionally — no HEAD guard, no blob guard) and `hold-node`.

**What the finalized plan already absorbs.** `tactic-graph-commit-plumbing-default`
Unit 1 adds a post-land residue clear inside `graph-commit`, which changes the
on-disk blob on the landed path and so restores the `EXPECT_BLOB` guard's
meaning; Unit 5 annotates the three call sites. So the immediate correctness of
the flip is covered. **What stays unrecorded** is the generalization — that a
graph-write primitive's rollback decision must derive from `verify-landed`'s
`origin/main` verdict rather than from local HEAD movement — and the two
primitives (`arm-wait`, `hold-node`) that are unguarded regardless. That
generalization is an application of ratified clarification **193** ("the success
verdict is read back from post-push REMOTE state") to the caller layer, not a
new decision.

## Observation 2 — strategy clarification 237 carries a stale anchor and a stale in-prose claim

Clarification 237 cites `graph-commit:3502` for the guard call site and states
that `assert_clean_outside_ids` "sits in `land()`, not `try_land()`".
`tactic-graph-commit-plumbing-default`'s own draft body repeated both, and added
`:3300` for the definition.

Measured at `origin/main` `6ce8702d` (`graph-commit` is now **4012** lines):

| Claim | Recorded | Actual |
| --- | --- | --- |
| `assert_clean_outside_ids` definition | `:3300` | `:3591` |
| Guard call site | `:3502` | `:3794` (gated, `:3793-3795`) |
| Enclosing function | `land()` | `main()` (`:3648`) — not `land()` (`:2950`), not `try_land()` (`:2743`) |

The **substance is unchanged and if anything stronger** than recorded: the guard
is a `main()`-level pre-flight gated on `GRAPH_COMMIT_WRITER == worktree`, so
flipping the default makes it unreachable with no cutover and no `ref-split`
dependency. `graph-commit:418` still reads `worktree`, confirming the flip has
not landed.

Recorded here rather than fixed because only the author may amend a
clarification. The corrected anchors are already carried in
`tactic-graph-commit-plumbing-default`'s finalized body, so nothing downstream
depends on this being amended.

## Observation 3 — the backlog band's ceiling holds, but its non-increasing clause tripped

Measured via `read-sensors.ts` `readBacklogBand` / `readBacklogSeries` against
`origin/main`:

- **86 / 297 = 29.0%** — inside the declared ≤35% band. Ceiling clause **holds**.
- Series: **31.1% → 28.0% → 21.9% → 29.0%** — **increasing** on the last step.

The strategy's last recorded `reading` is `58/236 = 24.6%` with a non-increasing
28d series, so both the ratio and the series have moved since.

**This round read that as condition 18 NOT failing**, and proceeded:

1. The ceiling clause holds.
2. The full 28d trend is still strongly down: 53.1% → 29.0%.
3. The tactic population grew 236 → 297 over the same window, so the ratio's
   denominator moved too — which is precisely the property the band was declared
   as a ratio to get (clarification 11).
4. One in-band uptick does not meet the condition's own failure test: "a burden
   growing without bound … not merely more work to do".

That reading is **the author's to overturn**. The watch condition is in
`office_hours.recommendation`: a second consecutive increasing sample, or any
sample above 35%, should be treated as the condition FAILING and park the
strategy for an author decision.

## Provenance

Produced by `/align-tactics tactic-graph-commit-plumbing-default`, 2026-08-20,
tactic-mode finalize, worktree cut from `origin/main` `6ce8702d`. All three
observations were returned by the Workflow's drift phase as
`clarifications_to_add`; observation 1's `arm-wait` limb was **corrected on the
caller thread** — the drift phase reported `arm-wait:233` as carrying the same
two guards as its siblings, and it carries neither.
