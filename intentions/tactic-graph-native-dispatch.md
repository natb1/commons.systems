---
id: tactic-graph-native-dispatch
kind: tactic
statement: "Build graph-native dispatch — subtree parent: schema, graph-commit,
  align skills, router v2, instrument, legacy removal"
owner: ai
status: refining
parent: null
rationale: "Finalized 2026-07-03 by the trial /align-tactics
  strategy-graph-native-dispatch run, consuming this node's own retained draft
  per the retain-not-refine contract. Now the subtree parent — the graph-native
  epic: the nine children carry the clean-session plans; this body holds the
  shared spec (state model, skill family, router) and the /file-issue +
  /plan-issue coverage matrix that gates legacy removal. Not directly executable
  (no phase); it completes when its last child completes, stamping the
  strategy's round accounting."
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
# Build graph-native dispatch — subtree parent: schema, graph-commit, align skills, router v2, instrument, legacy removal

**Subtree parent** — finalized 2026-07-03 by the trial `/align-tactics
strategy-graph-native-dispatch` run, which consumed this node's own retained
draft; amended the same day by the second interview round (strategy
clarifications 8–10), whose mid-flight edit rule was executed on this very
subtree as the first re-evaluation. The eleven children carry the
clean-session plans; this body holds the shared spec they reference (§1–3),
the coverage matrix that gates legacy removal (§4), and the subtree map
(§5). The author decisions are binding (dated clarifications on the
strategy node). The legacy GitHub-issue
router (`.claude/skills/dispatch-propagate/scripts/`) remains the live
implementation until its queue drains. This subtree executes step 2 of the
migration direction in `packages/intentionsutil/SCHEMA.md`: *migrate the
dispatch router onto the graph*.

Interim note: the schema fields below do not exist first-class yet, so this
subtree's own nodes carry `phase`, `blocked_by`, `office_hours`, `backlog`
(and the strategy's `rounds`) under free-form `attributes`;
`tactic-graph-dispatch-schema` promotes the fields and migrates these nodes.

## 1. State model

### 1.1 Tactic execution state

Schema extensions (all graph-owned; `validateNode` gates them):

```yaml
# on tactic nodes only
phase: draft | align-tactics | implement | fix | qa | review | done
backlog: false                 # true = off-signal-path, demoted (clarification 9)
execution:
  branch: <node-id>            # worktree/branch anchor
  pr: 2740 | null              # PR number once opened
  attempts: { fix: 0, qa: 0 }  # counters formerly dispatch:*-attempt labels
  markers: []                  # formerly dispatch:planned/qa-done/reviewed
  strategy_fingerprint: <hash> # serving strategy's substance at plan time
                               # (soft-freeze trigger, clarification 10)
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

- **Draft phase.** `phase: draft` (equivalently: no phase set) marks
  retained tactical context from strategy work. The router never selects a
  draft tactic, and drafts do not count as children for strategy
  eligibility — they are `/align-tactics` input.
- **Phase is persisted, transitions are sensed.** The router never
  re-derives phase from GitHub; it reads the node's `phase`, consults the
  relevant sensor (CI verdict, PR mergeability), and commits the transition
  as a graph write. Out-of-band events (a hand-merged PR) are absorbed by a
  reconciler sweep.
- **Plan lives in the tactic body.** Doctrine amendment (recorded on the
  strategy): the body remains a cosmetic render for virtues, strategies,
  and delegations, but is authoritative content for tactics — draft context
  before finalization, the full clean-session plan after. Store change
  required: `writeNode` must preserve tactic bodies (until it ships, bodies
  are hand-maintained; backfill never touches sourceless tactics).
- **Blocking** stays the tactic-layer subtree mechanism recorded on
  `strategy-graph-drives-dispatch`: `blocked_by: [<tactic-id>...]`; nothing
  in a blocked subtree starts until the blocking subtree completes; the
  router is the single enforcement point.
- **Completion prunes.** `phase: done` removes the node and its edges in
  the same commit that lands the transition; the strategy's
  `rounds.last_completed` is stamped when the last child prunes.

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

Commits are restricted to `intentions/` paths — a `graph-commit` that
stages anything else fails loudly. CI treats `intentions/`-only pushes as a
docs-class change (validate the graph, skip app pipelines). A record is
**schedulable once it is on `origin/main`** — the router only reads the
store at `origin/main`, never a branch. The audit a PR checkpoint would
have provided is supplied upstream: `/align-strategy` never writes
substance the author did not decide in the interview.

### 1.3 Parking (office-hours)

- **Apply:** any skill or the router sets `office_hours: {reason, since}`
  via `graph-commit`. Parking a strategy parks its subtree implicitly;
  tactics park individually.
- **Clear:** an interactive session's commit touching the node — the graph
  analog of the `UserPromptSubmit` strip hook. The office-hours queue view
  is a projection over `office_hours != null` nodes.
- **Not-claude-eligible work** is authored *born-parked* and decomposed
  into child tactics each sized for ≤30 author-minutes.

## 2. The align skill family

Three skills supersede `/file-issue` and `/plan-issue`. Existing `/align`
rung detection is retained: rung-0 feeds the `/align` onboarding flow,
`refine-workflow` is superseded by `/align-strategy`, the rung-5 dialectic
remains the scheduled periodic review.

### 2.1 `/align` (no arguments) — fork entrypoint and orientation

1. **Orient.** Concise description: a harness for long-horizon autonomous
   workflows built around the intention graph — virtues (permanent
   dispositions, roots), strategies (persistent, condition-bearing,
   signal-carrying goals), tactics (transient, completable, delegable
   work), delegations (attachment records). Graph primitives in one screen.
2. **Validate deployment.** intentionsutil installed and tests pass, store
   readable, `validateGraph` clean, router heartbeat wired.
3. **Review virtues.** Present inherited virtue roots (forks begin with the
   upstream repo's; inherited virtues and strategies are assumed
   preserved). Interview for additional or ambiguous virtues — Socratic,
   one question at a time, per the existing rung-0 flow. Commit and push.
4. **Delegate to `/align-strategy`.** Then confirm at least one new or
   updated strategy exists; if none, tell the user the dispatch router has
   no work until a strategy is recorded.

*(Off the minimum path to the success signal — recorded as the first
backlog tactic, `tactic-align-skill`: fully planned, selectable at demoted
rank per clarification 9. Round 1 had deferred it by omission; the
re-evaluation converted it.)*

### 2.2 `/align-strategy <optional requirements>` — record strategy under interview

1. **Frame.** Identify virtues newly defined and lacking strategies; with
   requirements input, evaluate as new strategy or edit to an existing one
   (overlap detection against `strategy-*` nodes); with no input, evaluate
   existing strategies for improvement (conditions failing, signals stale,
   clarifications contradicted).
2. **Interview (dialectic).** Align with the author on: intent;
   justification by virtues or parent strategies (`serves`/`parent`
   placement); benefit; signals (`success_signal`); the author
   circumstances the strategy is contingent on (`attributes.conditions`).
   Present edge cases and consequences; resolutions recorded as dated
   `clarifications`. For UI-design requirements, supplement the
   ask-questions tool with the design system's design canvas: build
   mockup/variant artifacts on `@commons-systems/ds`, sync via DesignSync
   to the claude.ai/design canvas, and put competing interpretations and
   edge cases in front of the author visually. Canvas artifacts are
   interview aids, not deliverables. (Caveat: a freshly synced component is
   absent from the canvas until the project is opened/refreshed.)
3. **Advise on delegation and capture.** Propose `recovers` edges and
   review-trigger updates where the strategy touches a delegation; flag
   capture risk per the delegation kind's divergence/irreversibility axes.
4. **Retain draft tactics.** Tactical context naturally developed during
   the session is dumped into draft tactic nodes (`status: raw`, no
   execution phase, `serves` the strategy) — retain, not refine.
5. **Record.** `graph-commit` the node(s). The interview is the audit; the
   push makes the strategy schedulable. Editing a strategy with open
   non-draft tactics queues a soft freeze and re-evaluation of the open
   subtree — warn the author at record time (clarification 10).

### 2.3 `/align-tactics <strategy-node-id>` — break a strategy into executable tactics

Runs autonomously; parks on office-hours under the same conditions as
`/plan-issue` — never `AskUserQuestion` mid-run.

1. **Scope.** Read the strategy node, clarifications, conditions, signal,
   round history, and any draft child tactics. Drift review is two-sided
   (clarification 8): a failed recorded condition parks the strategy back
   to `/align-strategy` territory; AND the session sweeps for unrecorded
   conditions the round's plans newly depend on — a material discovery is
   proposed as a dated clarification and parks for author ratification;
   immaterial observations land as clarifications without interrupting.
2. **Decompose to the signal.** Minimum work to validate the
   `success_signal` this round — including, when `reading` is null, an
   instrument tactic. Consume draft tactics: finalize, split, merge, or
   prune. PR-sized leaves; subtrees via `parent` edges; order with
   `blocked_by`. Off-path work worth recording lands as a backlog tactic
   (`backlog: true`, fully planned, demoted) — never deferred by omission
   (clarification 9).
3. **Plan each claude-eligible tactic** into the node body with per-unit
   `Recommended model` (implement-unit heuristic). Lands
   `phase: implement`.
4. **Park non-claude-eligible tactics** born-parked, ≤30 author-minutes.
5. **Record.** One `graph-commit` per tactic (or small batch); stamp the
   strategy's round accounting and each tactic's
   `execution.strategy_fingerprint`. Re-evaluation mode (clarification
   10): invoked on fingerprint mismatch, the session amends, prunes, or
   confirms the open tactics instead of decomposing fresh, then re-stamps.

### 2.4 Execution phases

Once a tactic is on `origin/main` with `phase: implement`, the router walks
it through the same phase skills as today — implement, fix, qa, review —
with two changes: phase is read from and written to the node instead of
derived from labels, and completion markers, attempt counters, and parking
are `graph-commit` writes instead of label edits. Phase-skill internals
(worktree isolation, `/implement-unit` delegation, `/commit-merge-push`,
QA/review fan-outs, auto-merge on clean review) carry over unchanged.

## 3. The router

### 3.1 Eligibility

A **strategy** is eligible for an `/align-tactics` session iff:

- `office_hours` is null, and
- it has no **non-draft, non-backlog** child tactics (drafts are input,
  not blockers; backlog tactics linger at demoted rank by design), and
- its signal is not validated: `gap` non-null, or `reading` null, and
- the fresh-reading gate passes: `rounds.count == 0`, or a reading exists
  newer than `rounds.last_completed`, and
- `rounds.count < 2` (at the cap, the router parks it instead).

A **tactic** is eligible for its phase skill iff `office_hours` is null,
`phase` is neither `draft` nor `done`, its `blocked_by` set is fully
complete, and its phase's sensor gate is satisfied.

**Soft-freeze gate** (clarification 10): before selecting within a
subtree, the router recomputes the serving strategy's substance
fingerprint; any open tactic stamped with a stale
`execution.strategy_fingerprint` freezes the subtree — no new selections,
in-flight phases finish, one re-evaluation `/align-tactics` session is
queued, the freeze is logged to the selection log. State writes
(`reading`/`gap`/`rounds`/`office_hours`) never change the fingerprint.

### 3.2 Selection

1. current-worktree continuation → 2. main-health gate → 3. **resolved
attention rank, outermost** (already graph-native via `resolveAttention`;
strategies and tactics compete in one rank order; calculated attention
composes the authored boost/override with the derived signal-path factor —
backlog and off-path nodes resolve one tier lower, clarification 9) →
4. within a rank level, phase ladder closest-to-done first: `review → fix
→ qa → implement → align-tactics(strategy)`. Topic categories retire —
topical priority is authored attention on the owning strategy.

Claimed-set, reservation ledger, concurrency pacing
(`dispatch-target-workers` curve), the selection lock, and the
`dispatch-spawn-tick` heartbeat carry over unchanged — the heartbeat is the
seam: the tick consults **both** selectors during coexistence.

### 3.3 Coexistence and drain

- One lock, one pace budget, one claimed set spanning both routers.
- The legacy router only **drains**: it advances existing gh issues/PRs;
  new work enters exclusively via `/align-strategy` → `/align-tactics`.
  `intention-emit` retires with the legacy router; `backfill`/`refresh`
  keep reconciling gh-backed tactics until the last one closes.
- Rank interleaving needs no bridge: legacy selection already orders by
  graph rank via `rank-map.ts`.
- **Removal:** when no open gh-backed tactic remains, delete the legacy
  selector/phase-derivation scripts, the `dispatch:*` label conventions,
  and the emit bridge; `trackers/` shrinks to the PR/CI sensor surface.

### 3.4 Worktree anchoring

The `<issue-num>-<slug>` branch convention is re-keyed to node ids:
`<tactic-id>` becomes the branch/worktree/reservation/session key.
gh-backed tactics keep their numeric form during drain, so both keyspaces
coexist.

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

## 5. Subtree (round 1, recorded 2026-07-03; re-evaluated same day)

Eleven children, each a leaf = one PR unless noted. `blocked_by` (under
`attributes` until the schema tactic promotes it) encodes the order:

```
tactic-graph-dispatch-schema ──────────────┬──► tactic-signal-path-attention
tactic-intentions-branch-protection (park) ┤
                                           ▼
                                  tactic-graph-commit
                                     │           │
              tactic-align-strategy-skill   tactic-align-tactics-skill
                     │               │           │
  tactic-align-skill (backlog) ◄─────┤   tactic-graph-router-selector ◄── also blocked_by schema
                                     │           │
                                     │   tactic-graph-router-transitions ◄── also blocked_by graph-commit
                                     │           │
                                     │   tactic-dispatch-lifecycle-sensor (instrument)
                                     │           │
                                     └──► tactic-legacy-router-removal ◄── + drain gate (plan step 0)
```

- **Instrument:** `tactic-dispatch-lifecycle-sensor` — required in round 1
  because the strategy's `reading` is null (fresh-reading gate).
- **Born-parked:** `tactic-intentions-branch-protection` — author-only,
  ≤30 minutes.
- **Backlog:** `tactic-align-skill` — off the minimum path to the success
  signal, fully planned, selectable at demoted rank (clarification 9).
  Round 1 had deferred it by omission; the re-evaluation converted it.
- **Re-evaluation (2026-07-03):** the second interview round (strategy
  clarifications 8–10) edited the strategy mid-flight; per clarification
  10 the open plans were amended in the same change — the first execution
  of the soft-freeze re-evaluation, run inline because no router exists
  yet. Added by it: `tactic-signal-path-attention` (on-path: the router
  being built must implement the recorded attention semantics) and
  `tactic-align-skill` (backlog).
- This parent is not directly executable (no `phase`); it completes when
  its last child completes, which stamps the strategy's `rounds`.
