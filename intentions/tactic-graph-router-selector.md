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
phase: review
execution:
  branch: tactic-graph-router-selector
  pr: 2785
  attempts:
    qa: 1
  markers:
    - qa-done
  strategy_fingerprint: null
validates: []
blocked_by:
  - tactic-graph-dispatch-schema
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
  main-qa → review → fix → qa → implement → align-tactics(strategy)
  (strategy clarification 22). Calculated
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

## Unit 3 — node-id worktrees at the native default location

**Recommended model:** sonnet

Scope: node-id worktrees — tactic ids for phase sessions and strategy
ids for `/align-tactics` sessions (uniform node-id keying, strategy
clarifications 12–13; substrate clarification 23; spec §3.4) — are
Claude Code native worktrees at the harness default location,
`<project-root>/.claude/worktrees/<node-id>`, with `main` checked out at
the project root. `.claude/hooks/worktree-create.sh` today intercepts
every creation, hard-rejects non-`<issue-num>-<slug>` names, anchors at
the git common dir (the legacy `.bare` layout), and writes a gh identity
stub — all legacy-lane conventions. Re-scope it: a `<node-id>` name is
placed at the native default location (project-root
`.claude/worktrees/`; keep the direnv warm-up, no gh stub, no
git-common-dir anchoring), while `<issue-num>-<slug>` names keep the
legacy behavior until the gh lane drains. No graph-native path may
assume the `.bare` common dir or the sibling `worktrees/` container.
(This removes the friction the 2739 and 2740 sessions hit: a
graph-native session needing a synthetic numeric anchor just to name
its worktree.)

## Unit 4 — workflow-native tick execution for node targets

**Recommended model:** opus

Depends on: Units 1–3.

Scope: execute a graph selection as a thin tick workflow instead of
extending the legacy launch chain (strategy clarifications 24–25, recorded
2026-07-06; supersedes this unit's previous
`dispatch-materialize-spawn`/`dispatch-launch-worker` extension — the
legacy launch scripts stay issue-lane-only and retire with the drain,
`tactic-legacy-router-removal`):
- `dispatch-select-tick` hands the node-id selection set to a tick
  workflow script (Workflow primitive) that fans out one `agent()` per
  selected node, capped by the pace-derived worker target. The workflow
  script is thin composition per the strategy's thin-script condition —
  it holds no selection, transition, or provisioning logic of its own.
- Directive mapping unchanged from the previous scope: strategy →
  `INVOKE /align-tactics <node-id>`; tactic by persisted `phase` →
  implement → `/implement`, fix → `/fix-checks`, qa → `/qa-fix`, review →
  `/review-fix`, main-qa → `/qa-main` (node lane per
  `tactic-main-qa-phase`; sensor gate: PR merged and prod deploy landed).
  Phase derivation never runs for node targets — phase is persisted
  (strategy clarification 1).
- Mechanics stay owned and deterministic: a
  `provision-node-worktree <node-id>` primitive (plain `git worktree add`
  of `<project-root>/.claude/worktrees/<node-id>` from origin/main +
  origin/main merge + CI-ready gate where a PR exists, preserving the
  merged-tree guarantee; Unit 3, strategy clarification 23) that the
  agent invokes as one command — agents never hand-roll provisioning.
  (The invoked phase skills accept node targets only once
  `tactic-phase-skill-node-targets` lands — until then a launched phase
  agent exits at the skill's Step 0; the bootstrap-transition doctrine
  covers the interim, so this unit does not gate on it.)
- Model and effort routing (strategy clarification 17, routing parity):
  the tick resolves each `agent()`'s `model`/`effort` options from the
  persisted `phase` via `dispatch-phase-model` / `dispatch-phase-effort`
  and the audit-written policy file, same fail-closed demotable allowlist
  — the phase is already in hand (no SKILL→PHASE case map to fall
  through), so the legacy lane's `/qa-main`-inherits-Opus routing hole
  (`tactic-noncodegen-session-model-defaults` unit 1) cannot reproduce
  here: `main-qa → claude-sonnet-*` per the policy, and `/align-tactics`
  strategy sessions route per clarification 17 (interview/decomposition
  on Opus, Explore fan-out on Sonnet or Haiku).
- Tick granularity (strategy clarification 24): the workflow executes
  only currently-eligible phases and exits; the transition write
  (`graph-commit`) schedules the next phase next tick; CI waits happen
  between ticks. Workflow resume is same-session only, so a dead tick
  recovers by the next tick's re-selection from origin/main — no journal
  dependency.
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

## main-qa residue (qa 2026-07-06)

- dispatch-graph-tick.js's agent() call sets options.model directly from dispatch-phase-model output (full pinned IDs like claude-sonnet-4-6/claude-opus-4-8); all other Workflow-tool call sites in this repo (qa-fix.js, review-fix.js) use the short alias ('opus'/'sonnet') for that option instead. On the first live graph tick that routes a qa/review/fix-checks/main-qa node through dispatch-graph-tick.js, confirm the spawned subagent actually runs on the intended model (not just that it ran) -- check the agent's actual model, not just success. If agent() silently ignores or errors on a pinned ID, fix by mapping to the short alias in dispatch-graph-tick.js while preserving the version-pinning intent (do not blindly downgrade to a floating alias without first confirming what version the alias resolves to).
- The worker_cap default of 8 added to dispatch-graph-tick.js (commit ca4e0257) is currently inert in the live call path: dispatch-graph-execute always invokes the workflow with a single-element selections array and worker_cap:1 (one runner session per node). This is fine as forward-compatible plumbing per the author's own framing, but has no test coverage and is unexercised -- worth a sanity check the first time a multi-node single-workflow-instance invocation is ever wired.

## Amendment (2026-07-06): tick worker cap default

Author-directed during the second emulated tick: the unit-4 tick workflow
(`.claude/workflows/dispatch-graph-tick.js`) keeps its per-invocation
`worker_cap` arg but now defaults to 8 — parity with the legacy router's
`max_concurrent_workers` (`dispatch.config/target-workers.json`) — instead of
running uncapped when invoked without a cap. Landed on the PR branch as
commit ca4e0257. The pace-derived target from dispatch-select-tick remains
the normal cap source; the default binds only a direct/uncapped invocation.
