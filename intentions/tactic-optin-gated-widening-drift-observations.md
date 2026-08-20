---
id: tactic-optin-gated-widening-drift-observations
kind: tactic
statement: "Observation carrier (born-parked, for author promotion): a defect
  fixed behind an opt-in flag leaves the DEFAULT path uncovered and its
  regression case covers only the opted-in arm, so the graph reads as fixed
  while the shipped path still carries the defect — plus a second half of the
  anchor-decay pattern, the 'obsolete if X lands' escape that is never
  re-evaluated against X's phase"
owner: human
status: delegated
parent: null
rationale: Minted 2026-08-20 by the /align-tactics tactic-mode finalize of
  tactic-graph-commit-noop-shortcircuit-head-behind, as the born-parked
  observation node clarification 245 violation V1 mandates for the drift
  review's IMMATERIAL path (superseding clarification 118's
  strategy-clarifications write; no autonomous lane may edit durable-layer
  substance, and a tactic-target session never touches the serving strategy's
  frontmatter at all). All three of that round's Side-B premises were immaterial
  — the finalize proceeded uninterrupted and absorbed each into its own plan
  body — but the generalizations behind two of them are strategy-level record
  questions a human may want promoted into a clarification at office hours.
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
  reason: "Observation carrier, not planned work — two generalizable observations
    from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-graph-commit-noop-shortcircuit-head-behind that have no legal
    autonomous destination. (1) OPT-IN-GATED FIX LEAVES THE DEFAULT PATH
    UNCOVERED, measured this round: graph-commit's nothing-staged no-op
    short-circuit was widened to the HEAD-behind case, but only inside a
    GRAPH_COMMIT_WRITER == plumbing arm
    (packages/intentionsutil/scripts/graph-commit:3943-3944). The default writer
    is still worktree (graph-commit:418) and the tactic that would flip it
    (tactic-graph-commit-plumbing-default) is status raw / phase null, so the
    defect is live on every shipped invocation. The regression coverage is
    asymmetric in exactly the same way: test-graph-commit.sh Case 74, titled 'a
    clean checkout merely BEHIND origin/main is still a no-op', exercises the
    plumbing arm only, so the suite reads as covering the behaviour while the
    default path is untested. The question for the author: does a fix landed
    behind an opt-in flag discharge the defect it was filed against, or must the
    default path carry it (and its regression case) before the node can reach
    done? (2) THE OBSOLESCENCE ESCAPE IS NEVER RE-EVALUATED: this node's
    Provenance carried 'close this as obsolete if tactic-graph-ref-split lands
    first'. Nothing checks such an escape — it was re-checked this round only
    because a caller note asked for it (ref-split is at phase implement, not
    landed, so the work stands). This is the second half of the anchor-decay
    pattern already carried by tactic-observation-draft-anchor-decay, whose
    first half (a draft body's file and carrier anchors decaying silently
    between /align retention and /align-tactics finalize) fired again here: the
    stored anchor graph-commit:1699 now points at unrelated code. No autonomous
    lane may write either observation to the serving strategy's clarifications
    (clarification 245 / V1, which overturned clarification 118), so this
    carrier is their destination."
  since: 2026-08-20
  recommendation: "Three dispositions, pick one per observation rather than one
    for the pair. (a) DROP — judge both as one-off round noise and prune this
    node; observation 2's first half is already carried by
    tactic-observation-draft-anchor-decay, so dropping loses only the
    escape-clause half. (b) CLARIFY-ONLY — promote observation 1 into a dated
    strategy clarification stating whether an opt-in-gated fix discharges its
    defect, and whether a regression case that covers only the opted-in arm
    counts as coverage; the immediate instance is already being closed by
    tactic-graph-commit-noop-shortcircuit-head-behind, so this buys the general
    rule, not the fix. (c) MECHANIZE — file a tactic for a validate-graph or
    planlint check that flags a tactic body whose stored path:line anchors no
    longer resolve and whose 'obsolete if <node-id> lands' escape names a node
    not at phase done; fold the escape-clause half of observation 2 into
    tactic-observation-draft-anchor-decay rather than tracking it twice. Do NOT
    dispatch this node: it carries no plan and no unit of work."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---
# Observation carrier (born-parked, for author promotion): a defect fixed behind an opt-in flag leaves the DEFAULT path uncovered and its regression case covers only the opted-in arm, so the graph reads as fixed while the shipped path still carries the defect — plus a second half of the anchor-decay pattern, the 'obsolete if X lands' escape that is never re-evaluated against X's phase

## What this node is

An **observation carrier**. It has no plan, no units of work, and no
verification section, and it must **not** be dispatched. It exists because
clarification 245 (violation V1, ruled 2026-08-14, extended 2026-08-15)
overturned clarification 118: the `/align-tactics` drift review's **immaterial**
Side-B path may no longer append a dated entry to the serving strategy's
`clarifications`, and a tactic-target session never touches the serving
strategy's frontmatter at all. The legal destination for an immaterial
observation is one born-parked node serving the strategy, which a human
promotes into a clarification — or drops — at office hours.

Minted 2026-08-20 by the `/align-tactics` tactic-mode finalize of
`tactic-graph-commit-noop-shortcircuit-head-behind`. That round's drift review
returned three Side-B premises, all **immaterial** (`material: false`,
`plan_depends: false`) — the finalize proceeded uninterrupted and absorbed each
into its own plan body. What is recorded here is only the **generalizable** form
of two of them, which is a strategy-level record question rather than plan
substance.

## Observation 1 — a fix landed behind an opt-in flag leaves the default path uncovered, and so does its test

Measured against `origin/main` `8a233524`.

`graph-commit`'s nothing-staged no-op short-circuit exists so that an
invocation which cannot change `origin/main` exits without buying a landing
lock, a `graph/**` scratch push and an `await_checks` CI stamp. The HEAD-behind
case — a checkout strictly behind `origin/main` whose per-id content already
matches it — **was** widened into that short-circuit, but only inside a
writer-gated arm:

```sh
# packages/intentionsutil/scripts/graph-commit:3943-3944
if [[ "$head_sha" == "$main_sha" ]] \
   || [[ "$GRAPH_COMMIT_WRITER" == "plumbing" && "$all_ids_match_main" -eq 1 ]]; then
```

`GRAPH_COMMIT_WRITER` defaults to `worktree` (graph-commit:418, whose own
comment records that the default deliberately stays `worktree` and that only
`dispatch-eval-finding` opts into `plumbing` today). The tactic that would flip
the default, `tactic-graph-commit-plumbing-default`, is `status: raw` /
`phase: null`. So the defect is live on essentially every shipped invocation,
while the code reads as though it had been handled.

The regression coverage is asymmetric in exactly the same way, and more
misleadingly. `test-graph-commit.sh` Case 74 is titled **"a clean checkout
merely BEHIND origin/main is still a no-op"** — a title that names the general
behaviour — but its body exports `GRAPH_COMMIT_WRITER=plumbing` before invoking,
so it exercises the opted-in arm only. A reader auditing the suite for coverage
of the behind-main case finds it and stops.

**The question for the author.** Does a fix landed behind an opt-in flag
discharge the defect it was filed against — or must the default path carry the
fix, and a regression case pinned to the default path, before the node may
reach `done`? A subsidiary question if the answer is the latter: should a test
whose title states a general behaviour but whose body pins a non-default mode be
required to say so in its title?

The immediate instance is already being closed —
`tactic-graph-commit-noop-shortcircuit-head-behind` was finalized this same
round with a plan that makes the guard writer-agnostic and adds the
default-writer regression case. What is open here is the general rule, not the
fix.

## Observation 2 — the "obsolete if X lands" escape is never re-evaluated

The finalized node carried this line in its Provenance section:

> **Obsolescence note:** this whole surface disappears if
> `tactic-graph-ref-split` lands first (it deletes the CI stamp cycle and
> `await_checks` entirely) — close this as obsolete in that case.

Nothing checks such an escape. No selector, validator or planlint rule reads
"obsolete if `<node-id>` lands" and compares that node's `phase`. It was
re-checked this round only because the caller thread hand-wrote a note asking
for it — and the check mattered: `tactic-graph-ref-split` is at
`phase: implement`, **not** landed, so the work stands rather than being closed
as obsolete. Had it been at `done`, the round would have spent a full Opus plan
authoring on a dead surface.

This is the **second half** of a pattern already carried, for its first half, by
`tactic-observation-draft-anchor-decay` ("a retained draft tactic's body anchors
… decay silently between `/align` retention and `/align-tactics` finalize, and
nothing detects it"). That first half also fired here, independently: the stored
Provenance anchor `packages/intentionsutil/scripts/graph-commit:1699` now points
at unrelated code in `build_commit_plumbing()`, the file having grown to 4012
lines. Two decay surfaces, one detector missing — which is why the
recommendation below suggests folding this half into that node rather than
tracking it twice.

## The third premise, recorded as absorbed only

The round's third Side-B premise — that widening the guard needs no new
`git merge-base --is-ancestor` call, because `unpushed` and `all_ids_match_main`
are already computed in the same block — is **pure plan substance**, not a
generalizable record question. It was absorbed into
`tactic-graph-commit-noop-shortcircuit-head-behind`'s own plan (Context, fact 1
and fact 2) and is named here only so the round's drift output is fully
accounted for. It needs no author attention.

## Provenance

- **Minted by:** `/align-tactics tactic-graph-commit-noop-shortcircuit-head-behind`,
  tactic mode, 2026-08-20, landed in the same `land-align-round` call as the
  finalized target.
- **Doctrine:** clarification 245 / violation V1 (immaterial drift mints a
  born-parked observation node; clarification 118 is `OVERTURNED 2026-08-15`).
- **Drift status this round:** `proceed: true`, `side_a_failed_conditions: []`,
  `parks: []`, `deviation: false`. Nothing here blocked the finalize.
- **Related carrier:** `tactic-observation-draft-anchor-decay` (the first half
  of observation 2).
