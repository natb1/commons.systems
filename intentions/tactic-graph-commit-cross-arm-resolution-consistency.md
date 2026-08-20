---
id: tactic-graph-commit-cross-arm-resolution-consistency
kind: tactic
statement: "Observation carrier from the 2026-08-20 /align-tactics round on
  tactic-graph-commit-direct-three-way-merge: graph-commit's two writer arms
  resolve same-node contention differently in two named cases, so
  GRAPH_COMMIT_WRITER is today a resolution policy and not only a build
  mechanism"
owner: human
status: delegated
parent: null
rationale: "The /align-tactics drift phase surfaced this as an unrecorded but
  IMMATERIAL Side-B premise: it does not gate the target tactic's plan (that
  plan decides both cases inside itself), but the cross-arm-consistency
  requirement outlives the tactic that retires the rebase arm. Strategy
  clarification 245 / violation V1 forbids an autonomous lane from writing the
  serving strategy's clarifications, and a tactic-target session never touches
  strategy frontmatter at all, so this born-parked carrier is the observation's
  only legal destination. A human promotes it into a clarification, or drops it,
  at office hours."
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
  reason: "Observation carrier, not planned work — one immaterial Side-B drift
    observation from the 2026-08-20 /align-tactics tactic-mode round on
    tactic-graph-commit-direct-three-way-merge, with no legal autonomous
    destination. The candidate standing requirement: graph-commit's same-node
    contention resolution should be observably identical whichever primitive
    built the commit — GRAPH_COMMIT_WRITER selects a BUILD mechanism, never a
    resolution policy. Verified divergent in-session against origin/main in two
    named cases. (1) A --prune of an id a peer has already deleted: the plumbing
    arm reads it as a moved blob and parks (reconcile_plumbing_base,
    graph-commit:1794-1798, and its own comment at graph-commit:1776-1784
    conceding the case), where the rebase arm saw both sides delete and carried
    on. (2) Two writers touching different LINES of the same node file: the
    worktree arm lets git textually auto-merge without ever invoking
    merge-node.ts, whereas the plumbing arm routes every base movement through
    the field-level merge — a mechanism substitution inside ladder layer 1,
    arguably an upgrade (the field merge is the more semantic of the two), but
    it changes which merger runs in the common non-conflicting case. Case (1)
    already has a recorded tie-breaker rather than needing a new ruling: this
    strategy's serialization-ladder condition involves the author 'only at a
    true-conflict office_hours park', and both sides agreeing a node should be
    gone is convergence, not conflict. Case (2) has no recorded tie-breaker."
  since: 2026-08-20
  recommendation: "Read the body, then pick one of three dispositions — do not
    treat this as work to dispatch. (a) DROP: judge the two divergences
    adequately handled inside tactic-graph-commit-direct-three-way-merge's own
    plan (Unit 1 converges case (1); Unit 2 makes case (2) moot by deleting the
    arm) and close this carrier with no clarification. (b) CLARIFY-ONLY: record
    the cross-arm-consistency requirement as a strategy clarification in an
    /align interview — it is a standing requirement that outlives the tactic,
    which is the layer-placement test kind-tactic applies — and close this
    carrier. (c) MECHANIZE: if case (2)'s mechanism substitution is judged a
    real behavior change rather than an upgrade, file a separate tactic for a
    differential test that runs the same contention fixture through both
    resolution paths and asserts identical outcomes; note that such a test has a
    shelf life, since tactic-graph-commit-direct-three-way-merge deletes one of
    the two arms. Nothing here blocks that tactic — it was planned to phase
    implement in the same round that minted this node."
  session_type: requirement-discovery
pace_exempt: false
rounds: null
attributes: {}
---

# Observation carrier: graph-commit's two writer arms resolve same-node contention differently

## What this node is

**An observation carrier, not planned work. Do not dispatch it.** It has no plan
body, no units, and no verification section, and it is deliberately born parked to
`office_hours` with `owner: human`.

It exists because the 2026-08-20 `/align-tactics` tactic-mode round on
`tactic-graph-commit-direct-three-way-merge` surfaced one **immaterial** Side-B drift
observation, and an autonomous lane has nowhere legal to put it. Strategy
clarification 245 (violation V1 of the autonomous-substance invariant) overturned
clarification 118: no autonomous lane may append to the serving strategy's
`clarifications`, because `clarifications` is an allowlist member of
`strategyFingerprint` — writing one would soft-freeze *every* open child of the
strategy for an observation defined as gating nothing — and because a model-authored
dated clarification is byte-indistinguishable from an author-ruled one. A
tactic-target session additionally never touches the serving strategy's frontmatter
at all. So the observation lands here, and a human promotes or drops it at office
hours.

`proceed` stayed true and the round ran on uninterrupted: the target tactic was
finalized to `phase: implement` with a full plan in the same `graph-commit`.

## The candidate standing requirement

> `graph-commit`'s same-node contention resolution should be observably identical
> whichever primitive built the commit. `GRAPH_COMMIT_WRITER` selects a **build
> mechanism**, never a **resolution policy**.

That requirement is not recorded anywhere today. It is a *standing* requirement — it
outlives `tactic-graph-commit-direct-three-way-merge`, the tactic that retires one of
the two arms — which is the layer-placement test `kind-tactic` applies, and the reason
it is worth a human's eye rather than being folded into that tactic's plan.

## The two divergences, verified in-session against origin/main

### 1. `--prune` of an id a peer has already deleted

The plumbing arm compares each id's blob at the previous base against its blob at the
fresh base. A `--prune` id whose node a peer already deleted reads as a *moved blob*,
so it takes the prune sentinel branch and parks
(`reconcile_plumbing_base`, `graph-commit:1794-1798`). The rebase arm saw both sides
delete and carried on.

`reconcile_plumbing_base`'s own comment block concedes this
(`graph-commit:1776-1784`), defending it as "conservative in one edge" on the grounds
that "the plumbing writer's one opt-in caller today never prunes". That defense stops
holding the moment `tactic-graph-commit-plumbing-default` flips the default, because
`land-align-round` / `graph-commit --prune` callers would then be on the plumbing arm.

**This case already has a recorded tie-breaker** — it needs no new ruling. This
strategy's serialization-ladder condition involves the author "only at a true-conflict
`office_hours` park", and both sides agreeing a node should be gone is *convergence*,
not conflict. `tactic-graph-commit-direct-three-way-merge` Unit 1 converges it on that
reading.

### 2. Two writers touching different lines of the same node file

Today the worktree arm lets git textually auto-merge two writers who touched disjoint
lines of the same node file, **without ever invoking `merge-node.ts`**. The plumbing
arm routes every base movement through the field-level merge.

That is a mechanism substitution *inside* serialization-ladder layer 1, not a loss —
the field merge is the more semantic of the two. But it means retiring the rebase
changes which merger runs in the common **non-conflicting** case, which is the high-
volume path, not an edge.

**This case has no recorded tie-breaker.** It is the half of the observation most
likely to be worth recording.

## Recommendation — three dispositions, pick one

See `office_hours.recommendation` for the full text. In brief:

- **(a) Drop** — judge both divergences adequately handled inside
  `tactic-graph-commit-direct-three-way-merge`'s own plan (Unit 1 converges case 1;
  Unit 2 makes case 2 moot by deleting the arm) and close this carrier with no
  clarification.
- **(b) Clarify-only** — record the cross-arm-consistency requirement as a strategy
  clarification in an `/align` interview, and close this carrier.
- **(c) Mechanize** — if case 2's mechanism substitution is judged a real behavior
  change rather than an upgrade, file a separate tactic for a differential test that
  runs one contention fixture through both resolution paths and asserts identical
  outcomes. Note its shelf life: `tactic-graph-commit-direct-three-way-merge` deletes
  one of the two arms.

Nothing here blocks that tactic. It was planned to `phase: implement` in the same
round that minted this node, and both landed in one `graph-commit`.

## Provenance

2026-08-20 `/align-tactics tactic-graph-commit-direct-three-way-merge` round, drift
phase, Side B, `material: false`, `plan_depends: false`. The round's second unrecorded
premise (that the worktree arm still exists and is still the default, so this node's
scope is a live rewrite rather than a no-op absorbed by a sibling) was verified true
in-session and proposed **no** clarification — it belongs in that tactic's own
Dependencies/Scope sections, and it is there. It is not carried here.
