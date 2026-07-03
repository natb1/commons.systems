---
id: tactic-graph-native-dispatch
kind: tactic
statement: Build graph-native dispatch — schema extensions, graph-commit, the
  align skills, router v2, legacy drain (draft; finalize via /align-tactics)
owner: ai
status: raw
parent: null
rationale: "Draft tactical content retained from the 2026-07-03 /align-strategy
  session, per the retain-not-refine contract recorded on
  strategy-graph-native-dispatch: strategy work keeps the tactical context it
  naturally develops, in the graph, without owning tactical documentation
  quality. The node body is the draft. /align-tactics
  strategy-graph-native-dispatch finalizes it — splitting into PR-sized tactics
  with clean-session plans and model tags — and prunes this node. A draft tactic
  (status raw, no execution phase) never blocks its strategy's /align-tactics
  eligibility; it is that session's input."
reading: null
gap: null
serves:
  - strategy-graph-native-dispatch
recovers: []
clarifications: []
tooling_goals: []
success_signal: null
attention: null
attributes: {}
---
# Build graph-native dispatch — schema extensions, graph-commit, the align skills, router v2, legacy drain (draft; finalize via /align-tactics)

**DRAFT** — retained context from the 2026-07-03 `/align-strategy` session,
not a finalized plan. `/align-tactics strategy-graph-native-dispatch` consumes
this body: it splits, re-plans, and prunes. The four author decisions it
elaborates are binding (recorded as clarifications on the strategy node); the
elaboration itself is revisable. The legacy GitHub-issue router
(`.claude/skills/dispatch-propagate/scripts/`) remains the live implementation
until its queue drains. This work executes step 2 of the migration direction
in `packages/intentionsutil/SCHEMA.md`: *migrate the dispatch router onto the
graph*.

## 1. State model

### 1.1 Tactic execution state

Schema extensions (all graph-owned; `validateNode` gates them):

```yaml
# on tactic nodes only
phase: draft | align-tactics | implement | fix | qa | review | done
execution:
  branch: <node-id>            # worktree/branch anchor
  pr: 2740 | null              # PR number once opened
  attempts: { fix: 0, qa: 0 }  # counters formerly dispatch:*-attempt labels
  markers: []                  # formerly dispatch:planned/qa-done/reviewed
```

```yaml
# on any goal-layer node (strategy or tactic)
office_hours: { reason: "<why>", since: 2026-07-03 } | null
```

```yaml
# on strategy nodes — /align-tactics round accounting
rounds:
  count: 0                    # completed tactic rounds
  last_completed: null        # timestamp of last round's final tactic completion
```

- **Draft phase.** `phase: draft` (equivalently: no phase set, as on this
  node) marks retained tactical context from strategy work. The router never
  selects a draft tactic for execution, and draft tactics do not count as
  children for strategy eligibility — they are `/align-tactics` input.
- **Phase is persisted, transitions are sensed.** The router never re-derives
  phase from GitHub; it reads the node's `phase`, consults the relevant
  sensor (CI verdict, PR mergeability, review markers), and then commits a
  transition as a graph write. Out-of-band events (a hand-merged PR) are
  absorbed by a reconciler sweep — the graph-native analog of
  `dispatch-reconcile-merged`.
- **Plan lives in the tactic body.** Doctrine amendment (recorded on the
  strategy): the body remains a cosmetic render for virtues, strategies, and
  delegations, but is authoritative content for tactics — draft context
  before finalization, the full clean-session plan after (`Context`, ordered
  units with `Scope` path:line anchors, per-unit `Recommended model`,
  `Dependencies`, `Reuse`, `Verification` with fenced ```verify blocks).
  Store change required: `writeNode` must preserve tactic bodies instead of
  regenerating them from `statement`. Until that ships, draft bodies are
  hand-maintained (safe interim: backfill never touches sourceless tactics).
- **Blocking** stays the tactic-layer subtree mechanism recorded on
  `strategy-graph-drives-dispatch`: `blocked_by: [<tactic-id>...]`; nothing
  in a blocked subtree starts until the blocking subtree completes; the
  router is the single enforcement point.
- **Completion prunes.** `phase: done` removes the node and its edges (the
  transient-tactic rule) in the same commit that lands the transition;
  strategy `rounds.last_completed` is stamped when the last child prunes.

### 1.2 Write path — direct-push with rebase-retry

All writers (skills, router, workers, reconciler) use one primitive:

```
graph-commit <node-id> [...node-id]:
  1. write node(s) through write-node.ts (the single validation gate)
  2. git add intentions/<id>.md ... && git commit
  3. git pull --rebase origin main   # intentions/-only commits rebase cleanly
  4. git push origin HEAD:main
  5. on push reject → goto 3 (bounded retries, then park the writer's target)
  6. on rebase conflict → same-node concurrent edit: re-read, re-apply, retry;
     if the semantic conflict survives re-application, park to office_hours
```

Commits are restricted to `intentions/` paths — a `graph-commit` that stages
anything else fails loudly. CI treats `intentions/`-only pushes as a
docs-class change (validate the graph, skip app pipelines). A record is
**schedulable once it is on `origin/main`** — the router only reads the store
at `origin/main`, never a branch. The audit checkpoint PR review would have
provided is supplied upstream: `/align-strategy` never writes substance the
author did not decide in the interview.

### 1.3 Parking (office-hours)

- **Apply:** any skill or the router sets `office_hours: {reason, since}` via
  `graph-commit`. Parking a strategy parks its subtree implicitly; tactics
  park individually.
- **Clear:** an interactive session's commit touching the node — the graph
  analog of the `UserPromptSubmit` strip hook. The office-hours queue view is
  a projection over `office_hours != null` nodes.
- **Not-claude-eligible work** is authored *born-parked* and decomposed into
  child tactics each sized for ≤30 author-minutes.

## 2. The align skill family

Three skills supersede `/file-issue` and `/plan-issue`. Existing `/align`
rung detection is retained: rung-0 feeds the new `/align` onboarding flow,
`refine-workflow` is superseded by `/align-strategy`, the rung-5 dialectic
remains the scheduled periodic review.

### 2.1 `/align` (no arguments) — fork entrypoint and orientation

1. **Orient.** Concise description: a harness for long-horizon autonomous
   workflows built around the intention graph — virtues (permanent
   dispositions, roots), strategies (persistent, condition-bearing,
   signal-carrying goals), tactics (transient, completable, delegable work),
   delegations (attachment records). Graph primitives in one screen.
2. **Validate deployment.** intentionsutil installed and tests pass, store
   readable, `validateGraph` clean, router heartbeat wired.
3. **Review virtues.** Present inherited virtue roots (forks begin with the
   upstream repo's; the harness assumes inherited virtues and strategies are
   preserved). Interview for additional or ambiguous virtues — Socratic, one
   question at a time, per the existing rung-0 flow. Commit and push.
4. **Delegate to `/align-strategy`.** Then confirm at least one new or
   updated strategy exists; if none, tell the user the dispatch router has
   no work until a strategy is recorded.

### 2.2 `/align-strategy <optional requirements>` — record strategy under interview

1. **Frame.** Identify virtues newly defined and lacking strategies; with
   requirements input, evaluate as new strategy or edit to an existing one
   (overlap detection against `strategy-*` nodes); with no input, evaluate
   existing strategies for improvement (conditions failing, signals stale,
   clarifications contradicted).
2. **Interview (dialectic).** Align with the author on: intent;
   justification by virtues or parent strategies (`serves`/`parent`
   placement); benefit; signals (`success_signal`); the author circumstances
   the strategy is contingent on (`attributes.conditions`). Present edge
   cases and consequences; resolutions recorded as dated `clarifications`.
3. **Advise on delegation and capture.** Propose `recovers` edges and
   review-trigger updates where the strategy touches a delegation; flag
   capture risk per the delegation kind's divergence/irreversibility axes.
4. **Retain draft tactics.** Tactical context naturally developed during the
   session is dumped into draft tactic nodes (`status: raw`, no execution
   phase, `serves` the strategy) — retain, not refine: no plan schema, no
   quality obligations. Tactical documentation is `/align-tactics`'s job.
5. **Record.** `graph-commit` the node(s). The interview is the audit; the
   push makes the strategy schedulable.

### 2.3 `/align-tactics <strategy-node-id>` — break a strategy into executable tactics

Runs autonomously; parks on office-hours under the same conditions as
`/plan-issue` (requirement ambiguity, major scope deviation, unverifiable
blockers) — never `AskUserQuestion` mid-run.

1. **Scope.** Read the strategy node, its clarifications, conditions, signal,
   round history, and any draft child tactics (this node is the worked
   example). Drift review: does the strategy still hold against the current
   repo? A failed condition parks the strategy back to `/align-strategy`
   territory instead of planning against a dead premise.
2. **Decompose to the signal.** Identify the minimum work to validate the
   strategy's `success_signal` this round — including, when `reading` is
   null, an instrument tactic that makes the sensor runnable. Consume draft
   tactics: finalize, split, merge, or prune them. Break into **PR-sized
   tactics** (leaf tactic = exactly one PR); larger shapes become tactic
   subtrees (`parent` edges), the graph-native epic. Order with `blocked_by`
   edges.
3. **Plan each claude-eligible tactic.** Explore/Plan subagent fan-out as
   `/plan-issue` does today; write the full clean-session plan into the
   tactic node body with per-unit `Recommended model` (`sonnet`/`opus` per
   the `/implement-unit` heuristic: cheapest model that will reliably
   complete the unit). Tactic lands with `phase: implement`.
4. **Park non-claude-eligible tactics** born-parked, chunked to ≤30
   author-minutes.
5. **Record.** One `graph-commit` per tactic (or small batch); stamp the
   strategy's round accounting.

### 2.4 Execution phases

Once a tactic is on `origin/main` with `phase: implement`, the router walks
it through the same phase skills as today — implement, fix
(checks/conflicts), qa, review — with two changes: phase is read from and
written to the node instead of derived from labels, and completion markers,
attempt counters, and parking are `graph-commit` writes instead of label
edits. Phase-skill internals (worktree isolation, `/implement-unit`
delegation, `/commit-merge-push`, QA/review fan-outs, auto-merge on clean
review) carry over unchanged.

## 3. The router

### 3.1 Eligibility

A **strategy** is eligible for an `/align-tactics` session iff:

- `office_hours` is null, and
- it has no **non-draft** child tactics (draft tactics are input, not
  blockers), and
- its signal is not validated: `gap` non-null, or `reading` null, and
- the fresh-reading gate passes: `rounds.count == 0`, or a reading exists
  newer than `rounds.last_completed`, and
- `rounds.count < 2` (at the cap, the router parks it instead).

A **tactic** is eligible for its phase skill iff `office_hours` is null,
`phase` is neither `draft` nor `done`, its `blocked_by` set is fully
complete, and its phase's sensor gate is satisfied (e.g. CI verdict present
before fix/qa routing).

### 3.2 Selection

1. current-worktree continuation → 2. main-health gate → 3. **resolved
attention rank, outermost** (already graph-native via `resolveAttention`;
strategies and tactics compete in one rank order) → 4. within a rank level,
phase ladder closest-to-done first: `review → fix → qa → implement →
align-tactics(strategy)`. Topic categories retire — topical priority is
authored attention on the owning strategy.

Claimed-set, reservation ledger, concurrency pacing
(`dispatch-target-workers` curve), the selection lock, and the
`dispatch-spawn-tick` heartbeat carry over unchanged — the heartbeat is the
seam: the tick consults **both** selectors during coexistence.

### 3.3 Coexistence and drain

- One lock, one pace budget, one claimed set spanning both routers.
- The legacy router only **drains**: it advances existing gh issues/PRs; new
  work enters exclusively via `/align-strategy` → `/align-tactics`.
  `intention-emit` retires with the legacy router; `backfill`/`refresh` keep
  reconciling gh-backed tactics until the last one closes.
- Rank interleaving needs no bridge: legacy selection already orders by
  graph rank via `rank-map.ts`.
- **Removal:** when no open gh-backed tactic remains, delete the legacy
  selector/phase-derivation scripts, the `dispatch:*` label conventions, and
  the emit bridge; `trackers/` shrinks to the PR/CI sensor surface.

### 3.4 Worktree anchoring

The `<issue-num>-<slug>` branch convention is re-keyed to node ids:
`<tactic-id>` becomes the branch/worktree/reservation/session key. gh-backed
tactics keep their numeric form during drain, so both keyspaces coexist.

## 4. Coverage matrix

Every legacy behavior maps to a home in the new family; nothing silently
drops. (Behavior inventory anchors: `.claude/skills/file-issue/SKILL.md`,
`.claude/skills/plan-issue/SKILL.md`.)

### `/file-issue` → `/align-strategy` + `/align-tactics`

| Legacy behavior | New home |
|---|---|
| Multi-topic separation into independent issues | `/align-strategy` frame step: multi-strategy separation; independent tactic subtrees per strategy |
| Duplicate detection (keyword + corpus scan) | `/align-strategy` overlap detection over `strategy-*` nodes; `/align-tactics` over open tactic nodes |
| 8-category quality evaluation | Interview dialectic (compliance/clarity/correctness/recommendations folded into interview probes); relevance + open-alignment = drift review in `/align-tactics` step 1 |
| Decomposition hard gate (leaf = one PR) | `/align-tactics` step 2 — PR-sized leaf invariant, subtrees for larger shapes |
| Epic structuring (sub-issues + epic label) | Tactic subtrees via `parent` edges; `resolve-epic` becomes subtree-completion pruning |
| Type/topic classification | Retired as ordering input (topics were a rank proxy); attention on the owning strategy is the ordering |
| `blocked_by` dependency wiring | `blocked_by` tactic edges (already the recorded blocking design) |
| `--follow-up` provenance, sentinel return block, attribution sidecars | Provenance = `serves` edge + emitting session in the commit; return contract = written node ids |
| Finalize (assign, `help wanted`) | Retired — presence on `origin/main` with `phase` set *is* schedulability |

### `/plan-issue` → `/align-tactics`

| Legacy behavior | New home |
|---|---|
| Idempotency via plan-comment marker | Plan-in-body presence + `phase` field |
| Relevance/drift review, convention drift, merged-PR overlap | Step 1 drift review (unchanged in substance) |
| Open-blocker re-check | `blocked_by` edge completeness check |
| Sequencing auto-defer on unmerged-PR precondition | `blocked_by` edge on the owning tactic; conservative aggregation → park |
| Explore/Plan subagent fan-out, reuse-first, design proposals | Step 3, unchanged |
| Plan-comment schema (Context/units/Scope/model/Dependencies/Reuse/Verification+```verify) | Tactic node body, same schema |
| Per-unit model tags (`sonnet`/`opus`, implement-unit heuristic) | Same, heuristic home unchanged (`implement-unit/SKILL.md`) |
| Clarification/deviation gate → office-hours, no `AskUserQuestion` | Same conditions → `office_hours` field |
| `dispatch:planned` label, marker-before-label ordering | Single atomic `graph-commit` landing plan + `phase: implement` together — the ordering hazard disappears |
| Trivial-task skip | Unchanged |

## 5. Migration sequence

1. **Schema + writer** — `phase` (incl. `draft`), `execution`,
   `office_hours`, `rounds`, tactic-body preservation in `writeNode`;
   `graph-commit` primitive; CI `intentions/`-only fast path.
2. **`/align-strategy`** — the 2026-07-03 session is the prototype run.
3. **`/align-tactics`** — first target: `strategy-graph-native-dispatch`
   itself, consuming this draft (self-hosting: the strategy's first tactic
   round builds its own machinery).
4. **Router tick v2** — graph selector beside the legacy selector under one
   lock; new work stops entering gh.
5. **Drain, then remove** the legacy router per §3.3.
6. **README + `/align` fork entrypoint** — refocus docs on the graph-native
   orchestrator (README refocus landed with the strategy record).
