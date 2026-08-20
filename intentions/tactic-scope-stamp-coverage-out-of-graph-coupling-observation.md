---
id: tactic-scope-stamp-coverage-out-of-graph-coupling-observation
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics tactic-mode
  round on tactic-transition-node-scope-stale-test-coverage: the new MAIN_ROOT
  shell coverage necessarily pins the scope-fingerprint stamp's CURRENT
  out-of-graph, gitignored location, coupling it to tactic-scope-stamp-in-graph
  — plus a second recurrence of the align-tactics gather clause-agent silent
  death already carried by tactic-align-tactics-gather-agent-death-silent"
owner: human
status: delegated
parent: null
rationale: null
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
  reason: "Observation carrier, not planned work — two observations from the
    2026-08-20 /align-tactics tactic-mode round on
    tactic-transition-node-scope-stale-test-coverage that have no legal
    autonomous destination (clarification 245 / V1 forbids an autonomous lane
    writing them to the serving strategy's clarifications, and a tactic-target
    session never touches strategy frontmatter at all). (1) COUPLING, recorded
    so a future migration knows this coverage moves with it: the Unit-3
    MAIN_ROOT case that round planned asserts the stamp resolves to
    <main-root>/.claude/worktrees/<id>.scope-fingerprint — the same convention
    restamp-scope-fingerprint.ts's writeScopeStamp writes — which is gitignored,
    machine-local state (.gitignore line 1, `worktrees/`). That is exactly the
    structural gap clarification 115 (2026-07-27) records and draft
    tactic-scope-stamp-in-graph carries. The test follows the code and takes NO
    position on whether the stamp should stay out of the graph; if
    tactic-scope-stamp-in-graph lands, this coverage is updated with it rather
    than treated as a commitment to the present location. It does not overlap
    tactic-scope-fingerprint-plan-substance, which narrows what the fingerprint
    HASHES, not where it is read from or written to. (2) RECURRENCE, measured
    this round: the gather phase's clause-coverage evidence agent again died
    with `StructuredOutput retry cap (5) exceeded — 5 failed calls with no valid
    output`, so the Opus drift agent ran Side A with clauseEvidence at its empty
    default while the returned result still reported drift.proceed true, parks
    empty, deviation false. Second observed occurrence; the defect itself is
    already carried by tactic-align-tactics-gather-agent-death-silent
    (born-parked) and is NOT re-filed here — this entry only adds the recurrence
    count and the payload shape that triggered it (30 conditions + 9
    clarifications, ~52KB args)."
  since: 2026-08-20
  recommendation: "Disposition the two separately at office hours. For (1) the
    choices are: DROP (the coupling is obvious enough from the plan body and
    needs no durable record); CLARIFY-ONLY (promote it into a strategy
    clarification cross-referencing tactic-scope-stamp-in-graph, so a
    stamp-in-graph migration round finds it); or MECHANIZE (add a blocked_by /
    prose cross-reference between the two tactics so the migration cannot land
    without re-reading this coverage). For (2) the choices are: DROP (fold into
    the existing carrier at its own sitting); COUNT-ONLY (record the second
    occurrence on tactic-align-tactics-gather-agent-death-silent and leave the
    fix scoped there); or ESCALATE (the recurrence justifies promoting that
    carrier out of born-parked into planned work, since a silently half-blind
    Side-A review is now a repeating, not a one-off, condition). This node
    carries no plan and must not be dispatched."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier — out-of-graph stamp coupling, and a gather-agent death recurrence

## What this node is

An **observation carrier**, not planned work. It has **no plan** and must **not** be
dispatched. It exists because the two observations below were surfaced by an autonomous
`/align-tactics` round and have no legal autonomous destination:
`strategy-graph-native-dispatch` clarification **245** (violation **V1** of the
autonomous-substance invariant, which OVERTURNED clarification 118) forbids an autonomous
lane appending clarifications to a serving strategy, and a tactic-target session never
touches the serving strategy's frontmatter at all.

**Provenance:** the 2026-08-20 `/align-tactics` tactic-mode round finalizing
`tactic-transition-node-scope-stale-test-coverage` against `origin/main` `c9bf5320`. Both
entries arrived as the drift review's **immaterial** Side-B premises (`material: false`,
`plan_depends: false`), so the round proceeded uninterrupted, exactly as the immaterial
path requires.

A human disposes of each at office hours; see `office_hours.recommendation` for the
explicit choices per entry.

## Observation 1 — the new MAIN_ROOT coverage pins the stamp's out-of-graph location

The round planned a Unit-3 shell case asserting that `transition-node`, invoked with cwd
inside a nested linked worktree, resolves the scope-fingerprint stamp at the **main
checkout root** rather than at the invoking worktree — the `MAIN_ROOT` vs `REPO_ROOT`
divergence. To assert that, the case necessarily hard-codes the stamp's present path
convention:

```
<main-root>/.claude/worktrees/<id>.scope-fingerprint
```

which is the convention `writeScopeStamp` writes
(`packages/intentionsutil/scripts/restamp-scope-fingerprint.ts`), and which is **gitignored
machine-local state** — `.gitignore` line 1, `worktrees/`.

That is precisely the structural gap **clarification 115** (2026-07-27) records: the gate
deciding whether the graph's phase state is trustworthy lives entirely *outside* the graph,
so a fresh clone or a second machine has no stamps at all and `isScopeStale` fail-opens.
Draft `tactic-scope-stamp-in-graph` carries that gap.

**What the coverage does and does not claim.** It asserts where the stamp resolves
**today** and takes **no** position on whether the stamp should stay out of the graph. If
`tactic-scope-stamp-in-graph` lands and moves the stamp into tracked graph state, this
coverage is **updated with it** — it is not a commitment to the present location, and it is
not a reason to defer that migration.

**Not an overlap with `tactic-scope-fingerprint-plan-substance`** (phase `qa`): that tactic
narrows what the fingerprint **hashes** (excluding machinery-appended body sections). This
coverage is about **where the stamp is read from and written to**. Different axis; neither
subsumes the other.

The reason to record this at all is directional: a future stamp-in-graph migration round
should discover that this shell coverage exists and must move with it, rather than find a
red test and treat it as an obstacle.

## Observation 2 — recurrence of the gather clause-agent silent death

**The defect itself is already carried** by `tactic-align-tactics-gather-agent-death-silent`
(born-parked, `phase: null`). It is **not re-filed here.** This entry adds only the
recurrence count and the payload shape that triggered it.

Measured this round: the `align-tactics` Workflow's gather-phase **clause-coverage evidence
agent** (the `clause` gather job) failed with

```
agent({schema}): StructuredOutput retry cap (5) exceeded — 5 failed calls with no valid output
```

against a payload of **30 `attributes.conditions` + 9 clarifications** (~52KB of `args`
total). The aggregation null-guards every gather result, so `clauseEvidence` stayed at its
empty default and the Opus drift agent ran **Side A with no per-clause repo evidence**.

The degradation stayed **silent in the returned result**: `drift.proceed` was `true`,
`parks` was empty, `deviation` was `false`. The only signal was the Workflow tool's
`failures` line, which a caller who does not read it would miss entirely.

This is the **second observed occurrence** of the same failure, the first being the
2026-08-19 round on `tactic-reclaim-audit-spawn-handoff-expired-count`. Both ran against
`strategy-graph-native-dispatch`, whose conditions array is the largest in the graph — so
payload size is the obvious suspect, but neither occurrence isolated it.

The round it affected was disclosed honestly by its caller rather than reported as a clean
pass; that disclosure discipline is the current mitigation, and it is a session-discipline
mitigation for a mechanical defect, which is why the carrier tactic exists.
