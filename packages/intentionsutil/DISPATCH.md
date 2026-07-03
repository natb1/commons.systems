# Graph-native dispatch — design reference

Status: **design, recorded 2026-07-03** under
`intentions/strategy-graph-native-dispatch.md`. The legacy GitHub-issue router
(`.claude/skills/dispatch-propagate/scripts/`) remains the live implementation
until its queue drains; this document is the specification the graph-native
router and the align skill family are built against. It extends the authority
doctrine in [SCHEMA.md](SCHEMA.md) ("Authority and the GitHub projection") and
executes its step 2: *migrate the dispatch router onto the graph*.

Four decisions here were settled by the author in the 2026-07-03
`/align-strategy` interview and are recorded as clarifications on the strategy
node; this document elaborates them but does not get to reverse them:

1. **Persisted phase.** A tactic node stores an explicit `phase` the router
   transitions. PR/CI are sensors, not ground truth.
2. **One write path.** Every graph edit is a single-node commit pushed directly
   to `main` with a rebase-retry loop, restricted to `intentions/` paths.
3. **Loop guard.** Strategy re-eligibility for `/align-tactics` requires a
   sensor reading fresher than the last completed tactic round; two rounds
   without validation parks the strategy.
4. **First-class parking.** `office_hours: {reason, since}` on goal-layer
   nodes replaces the `dispatch:office-hours` label.

## 1. State model

### 1.1 Tactic execution state

Schema extensions (all graph-owned; `validateNode` gates them):

```yaml
# on tactic nodes only
phase: align-tactics | implement | fix | qa | review | done   # persisted, router-transitioned
execution:
  branch: 2739-graph-native-dispatch-record   # worktree/branch anchor
  pr: 2740 | null                             # PR number once opened
  attempts: { fix: 0, qa: 0 }                 # counters formerly dispatch:*-attempt labels
  markers: []                                 # completion markers formerly dispatch:planned/qa-done/reviewed
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

- **Phase is persisted, transitions are sensed.** The router never re-derives
  phase from GitHub; it reads the node's `phase`, consults the relevant sensor
  (CI verdict, PR mergeability, review markers) and *then* commits a
  transition as a graph write. An out-of-band event — a hand-merged PR, a
  manually closed branch — is absorbed by a reconciler sweep that compares
  `execution.pr` state against GitHub and proposes corrective transitions; it
  is the graph-native analog of `dispatch-reconcile-merged`.
- **Plan lives in the tactic body.** Doctrine amendment: the node body remains
  a cosmetic render of `statement` for virtues, strategies, and delegations,
  but for tactics it is **authoritative plan content** — the full
  clean-session plan (`Context`, ordered units with `Scope` path:line anchors,
  per-unit `Recommended model`, `Dependencies`, `Reuse`, `Verification` with
  fenced ```verify blocks). One file per node keeps plan and state atomic
  under the write path.
- **Blocking** stays the tactic-layer subtree mechanism already recorded on
  `strategy-graph-drives-dispatch`: a `blocked_by: [<tactic-id>...]` edge on a
  tactic; nothing in a blocked subtree starts until every tactic in the
  blocking subtree completes; the router is the single enforcement point.
- **Completion prunes.** `phase: done` triggers removal of the node and its
  edges (the transient-tactic rule), recorded in the same commit that lands
  the transition. Strategy `rounds.last_completed` is stamped when the last
  child tactic prunes.

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
docs-class change (validate the graph, skip app pipelines), keeping the loop
cheap. A record is **schedulable once it is on `origin/main`** — the router
only ever reads the store at `origin/main`, never a branch, so a strategy
recorded on a branch is invisible until pushed.

The audit checkpoint that PR review would have provided is supplied upstream:
`/align-strategy` never writes substance the author did not decide in the
interview, and `strategy-explicit-intent`'s condition (substance
human-authored, agent assistance is drafting) still governs.

### 1.3 Parking (office-hours)

- **Apply:** any skill or the router sets `office_hours: {reason, since}` via
  `graph-commit`. Parking a strategy parks its whole subtree implicitly (the
  router skips descendants); tactics park individually.
- **Clear:** an interactive session's commit touching the node clears the
  field — the graph analog of the `UserPromptSubmit` strip hook. The
  office-hours queue view is a projection over `office_hours != null` nodes,
  replacing the label search.
- **Not-claude-eligible work** is representable for the first time: a tactic
  the model cannot perform (needs credentials, a physical action, a judgment
  call) is authored *born-parked*, decomposed into child tactics each sized
  for ≤30 author-minutes.

## 2. The align skill family

Three skills supersede `/file-issue` and `/plan-issue`. Existing `/align` rung
detection is retained: rung-0 (no virtue roots) feeds the new `/align`
onboarding flow, `refine-workflow` is superseded by `/align-strategy`, and the
rung-5 dialectic remains the scheduled periodic review.

### 2.1 `/align` (no arguments) — fork entrypoint and orientation

For forks of this repo and repos consuming it as a plugin.

1. **Orient.** Concise description of the system: a harness for long-horizon
   autonomous workflows built around the intention graph — virtues
   (permanent dispositions, roots), strategies (persistent, condition-bearing,
   signal-carrying goals), tactics (transient, completable, delegable work),
   delegations (attachment records). Graph primitives in one screen.
2. **Validate deployment.** intentionsutil installed and tests pass, store
   readable, `validateGraph` clean, router heartbeat wired.
3. **Review virtues.** Present inherited virtue roots (forks begin with this
   repo's; the harness assumes inherited virtues and strategies are
   preserved). Interview for additional virtues or clarification of ambiguous
   ones — Socratic, one question at a time, per the existing rung-0 flow.
   Commit and push virtue edits.
4. **Delegate to `/align-strategy`.** Then confirm at least one new or
   updated strategy exists; if none, tell the user the dispatch router has no
   work until a strategy is recorded.

### 2.2 `/align-strategy <optional requirements>` — record strategy under interview

The requirements-definition interface (supersedes `/file-issue`'s intake
role).

1. **Frame.** Identify virtues newly defined and lacking strategies; with
   requirements input, evaluate it as new strategy or edit to an existing
   strategy (duplicate/overlap detection against existing `strategy-*` nodes
   replaces `/file-issue` duplicate detection); with no input, evaluate
   existing strategies for improvement (conditions failing, signals stale,
   clarifications contradicted).
2. **Interview (dialectic).** Align with the author on: intent of the
   strategy; justification by virtues or parent strategies (`serves`/`parent`
   placement); benefit; signals (`success_signal` — observable, sensor,
   threshold, proxy status); the author circumstances the strategy is
   contingent on (`attributes.conditions`). Present edge cases and
   consequences, not just preferences; disagreements the author resolves are
   recorded as `clarifications` with dates. Strategies are conditional but
   persistent — they outlive their tactics to keep tracking signals.
3. **Advise on delegation and capture.** Where the strategy touches a
   delegation record, propose `recovers` edges and review-trigger updates;
   flag capture risk per the delegation kind's divergence/irreversibility
   axes.
4. **Record.** `graph-commit` the node(s). The interview is the audit; the
   push makes it schedulable.

### 2.3 `/align-tactics <strategy-node-id>` — break a strategy into executable tactics

The planning interface (supersedes `/file-issue` epic structuring +
decomposition and `/plan-issue`). Runs autonomously; parks on office-hours
under the same conditions as `/plan-issue` (requirement ambiguity, major
scope deviation, unverifiable blockers) — never `AskUserQuestion` mid-run.

1. **Scope.** Read the strategy node, its clarifications, conditions, signal,
   and round history. Drift review: does the strategy still hold against the
   current repo (conditions scan, convention re-read)? A failed condition
   parks the strategy back to `/align-strategy` territory instead of planning
   against a dead premise.
2. **Decompose to the signal.** Identify the minimum work to validate the
   strategy's `success_signal` this round — including, when `reading` is
   null, an instrument tactic that makes the sensor runnable (the
   fresh-reading gate demands it). Break into **PR-sized tactics** (leaf
   tactic = exactly one PR); larger shapes become tactic subtrees (`parent`
   edges), the graph-native epic. Order with `blocked_by` edges.
3. **Plan each claude-eligible tactic.** Explore/Plan subagent fan-out as
   `/plan-issue` does today; write the full clean-session plan into the
   tactic node body — Context, units with Scope anchors, per-unit
   `Recommended model` (`sonnet`/`opus` per the `/implement-unit` heuristic:
   cheapest model that will reliably complete the unit), Dependencies, Reuse,
   Verification with ```verify blocks. Tactic lands with `phase: implement`.
4. **Park non-claude-eligible tactics.** Anything requiring author action is
   authored born-parked (`office_hours` set) and decomposed into child chunks
   of ≤30 author-minutes each.
5. **Record.** One `graph-commit` per tactic (or small batch); stamp the
   strategy's round accounting.

### 2.4 Execution phases

Once a tactic node is on `origin/main` with `phase: implement`, the router
walks it through the same phase skills as today — implement, fix
(checks/conflicts), qa, review — with two changes: phase is read from and
written to the node instead of derived from labels, and completion markers,
attempt counters, and parking are `graph-commit` writes instead of label
edits. The phase skills' internals (worktree isolation, `/implement-unit`
delegation with per-unit models, `/commit-merge-push`, QA and review
fan-outs, auto-merge on clean review) carry over unchanged.

## 3. The router

### 3.1 Eligibility

A **strategy** is eligible for an `/align-tactics` session iff:

- `office_hours` is null, and
- it has no child tactics (no tactic `serves`/`parent`-traces to it with an
  open subtree), and
- its signal is not validated: `gap` non-null, or `reading` null, and
- the fresh-reading gate passes: `rounds.count == 0`, or a reading exists
  newer than `rounds.last_completed`, and
- `rounds.count < 2` (at the cap, the router parks it instead).

A **tactic** is eligible for its phase skill iff `office_hours` is null,
its `blocked_by` set is fully complete, `phase != done`, and its phase's
sensor gate is satisfied (e.g. CI verdict present before fix/qa routing).

### 3.2 Selection

The ladder mirrors today's, with strategies joining the pool:

1. current-worktree continuation → 2. main-health gate → 3. **resolved
attention rank, outermost** (already graph-native via `resolveAttention`;
strategies and tactics compete in one rank order) → 4. within a rank level,
phase ladder closest-to-done first: `review → fix → qa → implement →
align-tactics(strategy)`. Topic categories retire — topical priority is
expressed as attention on the owning strategy, which is what the rank axis
already encodes.

Claimed-set, reservation ledger, concurrency pacing (`dispatch-target-workers`
curve), the selection lock, and the `dispatch-spawn-tick` heartbeat carry
over unchanged — the heartbeat is the seam: the tick binary consults **both**
selectors during coexistence.

### 3.3 Coexistence and drain

- One lock, one pace budget, one claimed set spanning both routers; a
  worktree/branch anchor is claimed regardless of which router owns it.
- The legacy router only **drains**: it keeps advancing existing gh issues
  and PRs but new work enters exclusively via `/align-strategy` →
  `/align-tactics`. `intention-emit` (graph → gh issue) retires with the
  legacy router; `backfill`/`refresh` keep reconciling gh-backed tactics
  until the last one closes.
- Rank interleaving needs no bridge: legacy selection already orders by
  graph rank via `rank-map.ts`.
- **Removal:** when no open gh-backed tactic remains, delete the legacy
  selector/phase-derivation scripts, the `dispatch:*` label conventions, and
  the emit bridge; `trackers/` shrinks to the PR/CI sensor surface (the only
  gh state the graph-native router still reads).

### 3.4 Worktree anchoring

The `<issue-num>-<slug>` branch convention is re-keyed to node ids:
`<tactic-id>` becomes the branch/worktree/reservation/session key
(`tactic-first-sensor-pass` → `worktrees/tactic-first-sensor-pass`).
gh-backed tactics keep their numeric form during drain, so both keyspaces
coexist without collision.

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

1. **Schema + writer** — `phase`, `execution`, `office_hours`, `rounds`,
   body-authoritative-for-tactics; `graph-commit` primitive; CI
   `intentions/`-only fast path. (This PR records; a tactic round implements.)
2. **`/align-strategy`** — this session is the prototype run.
3. **`/align-tactics`** — first target: `strategy-graph-native-dispatch`
   itself (self-hosting: the strategy's first tactic round builds its own
   machinery).
4. **Router tick v2** — graph selector beside the legacy selector under one
   lock; new work stops entering gh.
5. **Drain, then remove** the legacy router per §3.3.
6. **README + `/align` fork entrypoint** — refocus docs on the graph-native
   orchestrator (started in this PR).
