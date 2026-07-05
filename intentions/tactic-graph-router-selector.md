---
id: tactic-graph-router-selector
kind: tactic
statement: "router v2 (a): graph selector beside the legacy selector —
  eligibility gates, resolved-rank order, phase ladder, node-id worktree keys"
owner: ai
status: codified
parent: tactic-graph-native-dispatch
rationale: "First half of the router migration: selection reads the graph at
  origin/main under the existing lock, pace budget, and heartbeat; the legacy
  selector keeps draining gh under the same lock. Emits the selection log the
  strategy's sensor reads."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
phase: implement
execution: null
validates: []
blocked_by:
  - tactic-graph-dispatch-schema
  - tactic-align-tactics-skill
office_hours: null
pace_exempt: false
rounds: null
attributes: {}
---
# router v2 (a): graph selector beside the legacy selector — eligibility gates, resolved-rank order, phase ladder, node-id worktree keys

## Context

Router v2, first half: selection. The graph selector runs beside the legacy
gh selector under the same lock, pace budget, and claimed set; the
`dispatch-spawn-tick` heartbeat is the seam — during coexistence the tick
consults both selectors. Eligibility and ordering spec:
`intentions/tactic-graph-native-dispatch.md` §3.1–3.2. The store is read at
`origin/main` only, never a branch.

## Unit 1 — graph-select-target

**Recommended model:** opus

Scope: new `.claude/skills/dispatch-propagate/scripts/graph-select-target`:
- Strategy eligibility (spawns an `/align-tactics` session): `office_hours`
  null; no non-draft child tactics **on the strategy's signal path**
  (drafts are input; off-path tactics — no `blocked_by`/`parent` chain to
  a `validates`-terminal — linger at derived demoted rank by design,
  strategy clarifications 9/11); signal unvalidated (`gap` non-null or
  `reading` null); fresh-reading gate (`rounds.count == 0` or a reading
  newer than `rounds.last_completed`); `rounds.count < 2` — at the cap,
  park the strategy instead.
- Tactic eligibility (spawns its phase session): `office_hours` null;
  `phase` not in {draft, done}; `blocked_by` fully complete (a pruned
  blocker is complete — prune-on-done makes absence completion); phase
  sensor gate satisfied (e.g. CI verdict present before fix/qa).
- Order: resolved attention rank outermost — node-keyed, directly from
  `resolveAttention` (`packages/intentionsutil/src/attention.ts`, via
  `src/goals.ts`); the retired node↔issue rank-map bridge is not revived.
  Within a rank level, phase ladder closest-to-done first:
  review → fix → qa → implement → align-tactics(strategy). Calculated
  attention (weighted sum of authored, signal-satisfaction, and
  capture-resolution terms, strategy clarification 11) arrives inside
  `resolveAttention` via `tactic-calculated-attention` — no selector logic
  of its own.
- Soft-freeze gate (strategy clarification 10): before selecting within a
  subtree, recompute the serving strategy's substance fingerprint
  (statement, clarifications, conditions, serves, success_signal,
  tooling_goals); any open tactic stamped with a stale
  `execution.strategy_fingerprint` → skip new selections in that subtree,
  let in-flight phases finish, enqueue one re-evaluation `/align-tactics`
  session for the strategy, and log the freeze to the selection log.
- Uniform claiming (strategy clarification 13): every selection enters the
  claimed set / reservation ledger under its node id — strategy ids
  included, so an in-flight `/align-tactics` session keeps its strategy
  unselectable until its tactics land on `origin/main` (the eligibility
  gates alone still pass mid-session).
- Pace-exempt probe lane (strategy clarification 14, legacy `priority`
  parity): when the paced worker target is 0, first check
  `dispatch-target-workers --exhausted` — `exhausted` is a hard stop no
  flag overrides; otherwise probe eligible nodes with `pace_exempt: true`
  and admit at most one gate-exempt worker — bypassing the gate, not the
  count or the rank order. Spec: `tactic-graph-native-dispatch` §3.2.
- Emit one selection-log line per invocation (jsonl in the dispatch state
  dir alongside the phase log written by `dispatch-write-phase-log`) — the
  input `tactic-dispatch-lifecycle-sensor` reads.

## Unit 2 — tick consults both selectors

**Recommended model:** opus

Depends on: Unit 1.

Scope: `.claude/skills/dispatch-propagate/scripts/dispatch-select-tick`
(invoked by `dispatch-tick`): under the one selection lock, query
graph-select-target first, fall back to the legacy
`dispatch-select-target`; one claimed set and one reservation ledger
spanning both keyspaces (node ids and issue numbers); one pace budget
across both, with strategy `/align-tactics` sessions counted as workers.
The tick's existing at-cap priority bypass extends across keyspaces: the
probe consults graph pace-exempt nodes (Unit 1's lane) alongside the
legacy `--priority-only` probe, still admitting at most one gate-exempt
worker total.

## Unit 3 — node-id worktree keys

**Recommended model:** sonnet

Scope: `.claude/hooks/worktree-create.sh` — accept `<node-id>` worktree
names alongside the `<issue-num>-<slug>` convention: tactic ids for phase
sessions and strategy ids for `/align-tactics` sessions (uniform node-id
keying, strategy clarifications 12–13; spec §3.4). Draining legacy gh
work keeps its numeric names. (This removes the friction the 2739 and
2740 sessions hit: a graph-native session needing a synthetic numeric
anchor just to name its worktree.)

## Unit 4 — launch chain for node targets

**Recommended model:** opus

Depends on: Units 1–3.

Scope: extend the post-selection launch chain to node-id targets, so a
graph selection actually becomes a running worker (selection alone leaves
the launch scripts issue-only):
- `.claude/skills/dispatch-propagate/scripts/dispatch-materialize-spawn`
  and `dispatch-launch-worker`: accept a `<node-id>` target alongside
  `<issue-num>` (keyspace split: all-numeric = legacy issue, otherwise
  node id); worktree path and spawn `--name` are the node id (Unit 3's
  hook accepts it).
- For node targets, `dispatch-route`'s phase *derivation* is bypassed —
  phase is persisted (strategy clarification 1). The directive comes from
  the node: strategy → `INVOKE /align-tactics <node-id>`; tactic by
  `phase` → implement → `/implement`, fix → `/fix-checks`, qa →
  `/qa-fix`, review → `/review-fix`. The deterministic provisioning
  prelude (worktree provision + origin/main merge, CI-ready gate where a
  PR exists) runs unchanged, preserving the merged-tree guarantee.
- `dispatch-spawn-job` is reused as-is (generic primitive): `--name` =
  node id, `--cwd` = the node-id worktree, prompt = the mapped skill
  invocation.
- Mechanical failure dispositions (provision-failed, merge conflict that
  cannot invoke `/fix-conflicts`, wrong-worktree) park the node via the
  `office_hours` graph write instead of an office-hours label —
  coordinate with `tactic-graph-router-transitions`, which owns the
  ongoing phase/marker writes, and use the `graph-commit` primitive.

## Dependencies

- `tactic-graph-dispatch-schema` — the fields the gates read.
- `tactic-align-tactics-skill` — the session type a selected strategy
  spawns.
- `tactic-calculated-attention` — should land before the selector goes
  live so the derived terms are in effect from the first tick; not a hard
  blocker for this tactic (the selector functions without it, minus the
  derived terms), but it does hard-block `tactic-legacy-router-removal`.
- `tactic-graph-commit` — Unit 4's failure-disposition park writes go
  through the primitive; not a hard blocker for Units 1–3 (selection and
  the tick wiring make no graph writes).

## Reuse

- `resolveAttention`/`src/goals.ts`, the selection lock,
  `dispatch-target-workers` pacing (count mode and the `--exhausted`
  hard-floor query, reused as-is by the pace-exempt lane), and the
  `dispatch-spawn-tick` heartbeat — all unchanged.

## Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: dry-run graph-select-target against the live store — with this
subtree present it selects nothing while `blocked_by` chains are incomplete
and selects `tactic-graph-dispatch-schema` once its (empty) blocker set
qualifies; a legacy gh issue still drains under the same lock in the same
tick.

## Implementation notes

One subagent per unit, `model` per tag; constrain to working-tree edits.
