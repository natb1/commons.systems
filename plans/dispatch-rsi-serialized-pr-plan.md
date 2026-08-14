# Dispatch + RSI serialized PR plan

**Written** 2026-08-14 · **Graph base** `da1c3c7f` (702 nodes)
**Covers** all 72 open (`phase: null`) tactics in the dispatch-ladder / RSI /
evaluation-machinery scope: defects, integrity issues, token-efficiency
findings, ledger entries, and the feature/design nodes that resolve them.

---

## How to use this document

The work is being **serialized** — other development is frozen — so this plan
optimizes for **fewer, larger PRs** grouped by shared code surface rather than
one PR per node.

Three ground rules were set by the author and are assumed throughout:

1. **No carrier node.** These PRs are implemented **ad-hoc, in ad-hoc sessions
   that bypass the dispatch ladder.** No node carries `execution.pr`, no node is
   driven through align-tactics → implement → review → qa. A PR is a plain
   branch off `main`.
2. **Node bookkeeping is an explicit post-merge step**, not a ladder
   transition. Each PR section ends with the exact write that closes its nodes.
3. **All three large refactors are in scope** (lens-catalog decomposition,
   intervention-core extraction, dispatch skill rename) and are sequenced last,
   because each one rewrites surfaces the earlier PRs edit.

Every PR section is **clean-session-executable**: a session with no memory of
this analysis can execute it from the section text alone.

> **Anchor freshness.** `path:line` anchors below were re-verified against
> `da1c3c7f` unless marked *(from node body — re-locate)*. Several anchors
> carried in node bodies had already drifted; those are corrected here. Anchors
> in *any* node body should be treated as hints, not addresses.

---

---

# Revision 2 — regrouped for ad-hoc supervised execution

**Added 2026-08-14, after confirming these PRs bypass the ladder entirely and
scheduled dispatch is paused.** The fourteen sections below remain the
authoritative **unit-level specs** — every anchor, scope boundary and
verification step still applies. What changes is the **bundling and the order**.

## The pause does not mean what the grouping assumed

Verified on this host: the sentinel is present at
`/home/n8/.local/share/commons-dispatch/paused` (set 2026-08-10), so autonomous
scheduling is genuinely off. But `dispatch-tick`'s own header says it plainly:

> A paused tick is **NOT inert** … the branch below reaps the reservation
> ledger, runs the four other sweeps, and **DRAINS THE NODE LANE** — a reviewed,
> green, unparked node-lane PR is still squash-merged to `main` by
> `graph-auto-merge` and absorbed by `reconcile-graph-merged`. The sentinel
> gates worker **SPAWNING** and scheduling; it does not gate ledger bookkeeping,
> and **it does not freeze `main`**.

Read from the paused branch itself, this still runs on **every** tick:

1. `reservation_sweep` — `lib-reservation-ledger.sh`
2. `standdown_recheck_sweep` — `lib-standdown-recheck.sh`
3. `stale_hold_recheck_sweep`
4. `frozen_session_sweep`
5. `terminal_without_disposition_sweep`
6. the node-lane drain — `graph-auto-merge` then `reconcile-graph-merged`

### Two consequences, both actionable

**`main` is not frozen.** Any of the ~30 open PRs that reaches reviewed + green
+ unparked will squash-merge to `main` during this window, on a paused tick,
with no worker involved. If the intent is a real freeze, the sentinel is not
enough — per the same comment, **an `office_hours` park is the one thing
`graph-auto-merge` will not merge past.** Park the open node-lane nodes, or
expect main to move under these PRs.

**Three "cold" units are actually hot.** `standdown_recheck_sweep` (PR9 Unit 2),
`terminal_without_disposition_sweep` (PR2 Unit 6) and `reconcile-graph-merged`
(PR5) are all on the paused-tick path. A bug in them breaks things *during* the
window, not at resumption.

## What is genuinely cold

Nothing spawns a worker, so nothing reaches: the whole ladder driver
(`dispatch-ladder-*`), `dispatch-code-review`, the `/review-fix` orchestration,
`dispatch-target-workers` (the paused branch exits before `dispatch-select-tick`),
`provision-node-worktree`, and `dispatch-eval-finding` (only `/rsi` calls it,
and `/rsi` spawns from the ladder).

**This is where the merging headroom is.** The original rejection of a single PR
rested on three arguments; under ad-hoc supervised execution only one survives
intact:

| Original argument | Status now |
|---|---|
| The machinery under repair lands the repair | **Collapses** for everything cold — nothing runs it. Survives only for the tick-path items and for `graph-commit`, which every ad-hoc session still uses to close nodes. |
| Verification harnesses are per-surface | **Weakened.** It was about attributing a regression automatically; a supervised author can run all 15 suites and read the output. |
| PR13 renames what the others edit | **Intact.** Unaffected by who drives. |

## Regrouped: 14 → 6 PRs (+1 deferred)

| # | Bundle | Was | Nodes | Risk |
|---|---|---|---|---|
| **1** | **Graph write path** | PR1 | 4 | HOT — *silent* failure |
| **2** | **Tick-path reconcilers and sweeps** | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT — runs every tick |
| **3** | **Dispatch runtime (cold)** | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD — realized at resumption |
| **4** | **Instrument + finding surface** | PR3 + PR4 | 15 | COLD |
| **5** | **RSI chain** | PR10 + PR11 + PR12 + PR14 | 10 | COLD |
| **6** | **Skill rename** | PR13 | 1 | last, alone |
| — | *deferred* | PR8 U3 | 1 | see below |
| | *pre-PR sessions* | | 6 | no diff |
| | **total** | | **72** | |

**Bundle 1 stays alone and small even though it is only 4 nodes.** Its failure
mode is a *silently dropped* node edit when local `main` is ahead — and
supervision does not catch silent failures. Every other bundle's closing
bookkeeping runs through it, so it lands first and gets verified by reading
`git show origin/main:` rather than by trusting a verdict line.

**Bundle 3 is deliberately large (25 nodes).** Nothing invokes any of it while
paused, so the cost of bundling is not a broken window — it is that the first
fleet start after resumption becomes a single pass/fail boolean. Mitigate that
with a **staged resumption** rather than by splitting: remove the sentinel with
`max_concurrent_workers: 1`, walk one node through the full ladder, and only
then restore normal concurrency. That converts the boolean into a diagnosable
test and is worth more than any split.

## The order changes — in the opposite direction from what you would expect

Knowing the ladder is not a blocker does **not** simply demote everything. It
redistributes:

- **PR2 (ladder driver) drops sharply.** It was second because everything ran
  through it. Nothing runs through it now. Only its Unit 6 is urgent, and that
  moves to Bundle 2.
- **PR5 (reconciler tick cost) rises.** It reads as pure efficiency work for a
  paused system, but `reconcile-graph-merged` is in the drain on every tick, and
  PR5's base-pin unit prevents a **concurrently landed write being clobbered** —
  a live risk precisely because main is still moving.
- **PR9 Unit 8 stays first overall.** The 36,973-byte deferred diff exists only
  in an ephemeral job scratch dir. It is the one item with a deadline, and it is
  independent of everything. Do it before anything else.
- **PR8 Unit 1 rises** — the pace-curve config is untracked and unrecoverable.
- **PR8 Unit 3 is deferred outright.** It replaces the pause sentinel with a
  config field — i.e. it rewrites the mechanism currently enforcing the freeze,
  while the freeze depends on it. Land it during a deliberate, attended
  un-pause, never mid-window.

### Recommended order

```
0.  PR9 Unit 8         recover the ephemeral deferred diff   (deadline)
0b. park open node-lane nodes  if main is meant to be frozen (see above)
1.  Bundle 1           graph write path                      (HOT, silent)
2.  Bundle 2           tick-path reconcilers + sweeps        (HOT, live)
3.  Bundle 4           instrument + finding surface          (unblocks 5)
4.  Bundle 3           dispatch runtime                      (COLD, big)
5.  Bundle 5           RSI chain
6.  Bundle 6           skill rename                          (last, alone)
--  staged resumption: sentinel off at max_concurrent_workers: 1, one node
--  deferred: PR8 Unit 3, during an attended un-pause
```

Bundles 3 and 4 can swap or overlap — they share no files. Bundle 4 before 3
only because Bundle 5 depends on it.

---

## Read this before planning any of it: four nodes are already shipped

The graph says these are open. The code says otherwise. **Verify before
implementing — most of PR3 may be a bookkeeping pass, not an implementation.**

| Node | Claimed missing | Actually on `main` |
|---|---|---|
| `tactic-audit-instrument-scoping` | `--session` / `--node` scoping | **Present** — `aggregate-usage.sh:22,34,42`; scope object emitted at `:1463,1488` |
| `tactic-audit-permission-friction` | permission-friction lens | **Present** — `lenses.permission_friction`, `aggregate-usage.sh:835` |
| `tactic-audit-cache-efficiency-lens` | cache hit-ratio lens | **Present** — `hit_ratio` emitted at `aggregate-usage.sh:1211` |
| `tactic-rsi-round-trips-lens-carrier` | `scriptable_round_trips` carrier | **Present** — `boot_preamble` block, `aggregate-usage.sh:1335` |

Genuinely absent, confirmed by zero matches in the instrument:

- `review_effort` / `effort_yield` → `tactic-audit-review-effort-yield-lens` is real work.
- `rsi_lane` → `tactic-rsi-lane-token-attribution` is real work.

**A second stale-reference class:** six node bodies name
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. That skill
**does not exist on `main`** — it was folded into `rsi-audit`. The live path is
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh`. Fix the prose in PR3.

**A third:** four node bodies cite
`packages/intentionsutil/scripts/render-rsi-plan.ts`, which was built in #3065
and **deleted in #3074**. Its owning node `tactic-rsi-plan-skill` is
`phase: done`, so the graph shows a completed node whose deliverable a later
consolidation removed. Handled in PR14 Unit 2.

**The general lesson for whoever executes this plan:** two skill consolidations
(#3074, and the `dispatch-token-audit` → `rsi-audit` fold) moved or deleted
surfaces that ~10 open node bodies still address, and several lens nodes were
satisfied without their nodes being closed. **Re-verify every anchor and every
"missing" claim against the working tree before implementing it.** Roughly a
third of the apparent work in this scope may already be done.

---

## Why not one PR

The author asked whether a single PR is feasible. It is not, for three reasons
that are specific to this repo rather than general PR-size preference:

1. **The machinery under repair is the machinery that lands the repair.** PR2
   edits `dispatch-ladder-run`/`-advance`/`-await`; PR4 edits the graph write
   surface every node update flows through; PR6 edits `dispatch-code-review`. A
   single PR that breaks any of them leaves no working path to land the fix, and
   nothing to bisect.
2. **Verification is per-surface and mutually exclusive.** The ladder suites
   (`test-dispatch-ladder-*.sh`) and the instrument suite
   (`test-aggregate-usage.sh`) are separate harnesses with separate fixtures. A
   combined PR cannot report which surface regressed.
3. **PR13 renames the skill family** the other twelve PRs edit by path. Bundling
   it with anything guarantees conflicts on every file; it must be last and
   alone.

**14 PRs**, ordered so each one's verification surface is independent.

---

## Dependency order

```
PR1  graph write-path integrity        ── unblocks everything (all node writes)
 ├── PR2  ladder driver
 ├── PR3  audit instrument ───────────┐
 ├── PR4  finding write surface ──────┤
 ├── PR5  reconciler tick cost        │
 ├── PR6  code-review lock            │
 ├── PR7  review orchestration cost   │
 ├── PR8  config fail-closed          │
 └── PR9  worktree/session lifecycle  │
                                      │
        PR10 rsi trigger chain  ◄─────┘ (needs PR2 + PR3)
        PR11 lens catalog       ◄─────┘ (needs PR3)
        PR12 intervention core  ◄─────── (needs PR11 + PR4)
        PR14 rsi prioritization + research lane
        PR13 dispatch skill rename ── LAST, alone
```

PR2 and PR5–PR9 are mutually independent and may run in any order or in
parallel once PR1 lands. PR1 is the only universal prerequisite.

The four `blocked_by` edges landed in `da1c3c7f` are honored:
`audit-threshold-table → trigger-threshold-gate → session-sweep-trigger →
ladder-per-phase-evaluation` is the internal unit order inside PR10;
`eval-finding-ledger → duplicate-finding-sensor` is the internal unit order
inside PR4; `audit-cache-efficiency-lens → dispatch-cache-preserving-context`
puts that experiment after PR3; `ladder-worker-unstamped-audit-blind →
align-tactics-worker-transcript-unscanned` is the internal unit order in PR3.

---

## Pre-PR sessions (no diff)

Six in-scope nodes produce no code. Each is listed against the PR it gates,
with the prompt that starts it. **Run these before opening the PR they gate.**

| Run before | Node | Session prompt |
|---|---|---|
| PR6 | `tactic-review-sitting-code-review-lock-design` | `/office-hours tactic-review-sitting-code-review-lock-design` |
| PR7 | `tactic-dispatch-observation-masking` | `/rsi-audit 7d` then record the masking measurement on the node |
| PR7 | `tactic-dispatch-cache-preserving-context` | `/rsi-audit 7d` — read `hit_ratio` (shipped, `aggregate-usage.sh:1211`) and record the baseline before changing prompt-prefix handling |
| PR10 | `tactic-review-band-derivation-ratification` | `/office-hours tactic-review-band-derivation-ratification` |
| PR11 | `tactic-review-tradition-agentic-engineering` | `/office-hours tactic-review-tradition-agentic-engineering` |
| PR11 | `tactic-rsi-measure-fanout-and-model-routing` | `/rsi-audit 14d` — measure this harness's own fan-out and model routing before the catalog fixes a per-lens `model:` |

Two of these are load-bearing, not ceremonial:

- **`review-sitting-code-review-lock-design`** ratifies a locking design the
  author currently holds **on trust, not verification** — and PR6 implements
  that design. Ratify first or PR6 may implement a refuted design.
- **`rsi-measure-fanout-and-model-routing`** exists because both imported
  findings were measured on configurations this repo does not run. PR11's lens
  catalog declares a `model:` per lens; setting those from unmeasured external
  numbers is the exact error the node was written to prevent.

---

# PR1 — Graph write-path integrity

**Recommended model: opus** — concurrency semantics and a false-negative
verification path; the failure mode is silent data loss.

### Context

Every other PR in this plan writes graph nodes to close its own tactics. Four
open findings say that write path can silently lose an edit, can be blocked
repo-wide by an unrelated node, and cannot express a forward reference. Fixing
them first makes every subsequent PR's bookkeeping trustworthy.

### Nodes closed (4)

- `tactic-eval-finding-noop-verdict-hides-dropped-node-edit`
- `tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`
- `tactic-eval-finding-eval-finding-forward-crossref-fails-ci`
- `tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening`

### Scope

**Unit 1 — `graph-commit` far-ahead rebuild drops edits.**
`packages/intentionsutil/scripts/graph-commit:3261` *(from node body —
re-locate)*. When local `main` carries any unpushed commit, the far-ahead
rebuild resets the tree to `origin/main`; the false-landed guard then compares
two blobs equal by construction, so an **edit to an existing node** is dropped
while the verdict reads `landed context=noop`. The caller's own post-write
verification cannot catch it because it hashes the local working-tree path
`graph-commit` is entitled to leave on a different base.

Fix: the guard must compare against the **pre-reset** blob, and `noop` must
stop being reachable on a path that reset the tree. Out of scope: the
multi-bundle stash behavior and the landing lock.

**Unit 2 — one unbound sensor name denies every graph write repo-wide.**
`packages/intentionsutil/src/sensors.ts:78-125`,
`packages/intentionsutil/scripts/read-sensors.ts:1184-1215` *(from node body —
re-locate)*. `validateRegisteredSensorNames` throws inside the graph-fast-path
guard whose four required contexts all declare `needs: guard`, so one unbound
name blocks all writes — and the validator never runs on the main push that
introduces it. Fix: run the validator on the introducing push, and downgrade
the guard failure from repo-wide denial to a node-scoped one.

**Unit 3 — forward cross-references fail CI.**
`packages/intentionsutil/src/schema.ts:1656` *(from node body — re-locate)*.
`validateGraphProseRefs` rejects an entry naming a sibling the same batch has
not landed yet, so a batch write fails after 3 attempts and rolls back. Fix:
resolve prose refs against **the batch under write** plus `origin/main`, not
`origin/main` alone.

**Unit 4 — origin/main data test blocks atomic schema tightening.**
`packages/intentionsutil/test/office-hours.test.ts:853-891` (verified — the
CLI tests run against this repo's real `origin/main`). Any PR that both
migrates node data and tightens the schema reading it is red-by-construction
until merge. Fix: run those assertions against a **fixture** graph, keeping one
explicitly-marked smoke assertion against live `origin/main`.

> Verified during planning: this trap does **not** catch PR4's ledger
> retirement. `attributes` is `Record<string, unknown>` (`schema.ts:244`), so
> dropping `attributes.ledger_entry` from 40 nodes tightens nothing. Unit 4 is
> worth doing on its own merits, not as a PR4 prerequisite.

### Dependencies

None. This is the root PR.

### Reuse

- `isPlainObject`, `validateNode` — `packages/intentionsutil/src/schema.ts`.
- Existing fixture-graph builders in `packages/intentionsutil/test/` (`anode()`
  at `office-hours.test.ts:54` builds a full `IntentionNode` fixture).

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: with a deliberately unpushed local commit on `main`, run a
`graph-commit` that edits an existing node and confirm the verdict is not
`landed context=noop` and the edit is present at `origin/main`.

### Closing the nodes

After merge, for each of the 4 ids set `phase: done` and
`execution.resolved_by: <merge sha>` via `dump-node.ts` → jq → `write-node.ts`
→ `graph-commit -C <path>`.

---

# PR2 — Ladder driver: exit codes, halt telemetry, completion detection

**Recommended model: opus** — one 1544-line bash driver with overloaded exit
codes and two mirror-image probe bugs; changes interact.

### Context

Nine findings land on the same three scripts. The driver overloads exit codes
`0`/`2`/`10`, so `dispatch-ladder-run` branches by parsing stdout strings; the
halt path — the one that spawns the evaluator — emits neither timing fields nor
the failure cause it already holds; and the await probe both false-stalls and
false-succeeds depending on which rung it is on.

### Nodes closed (9)

- `tactic-dispatch-ladder-exit-code-space` *(the structural change; do first)*
- `tactic-eval-finding-halt-path-emits-no-timing-fields`
- `tactic-eval-finding-ladder-halt-drops-captured-cause`
- `tactic-eval-finding-ladder-ci-wait-swallows-blocked-node`
- `tactic-ladder-await-phase-only-completion-test`
- `tactic-ladder-await-interrupt-rung-vacuous-advanced`
- `tactic-eval-finding-main-dirt-halts-ladder-as-violation`
- `tactic-eval-finding-terminal-without-disposition-dominates-clock`
- `tactic-ladder-terminus-owns-main-qa`

### Scope

**Unit 1 — one shared exit-code space.** Carve `refused`, `idle-wait`,
`idle-requeue`, `complete` out of the overloaded `0`/`2`/`10` in
`.claude/skills/dispatch-ladder/scripts/dispatch-ladder-advance` and
`dispatch-ladder-await`, and make `dispatch-ladder-run` branch on codes instead
of stdout strings. Do this unit first — the rest are easier once the codes are
distinct.

**Unit 2 — halt emits timing + cause.** `halt()` at
`dispatch-ladder-run:708`, whose `log_event halt` call is at `:727` (both
verified). It currently emits only `{terminus}`:

```sh
fields=$(jq -nc --arg terminus "$TERMINUS" '{terminus: $terminus}' 2>/dev/null) \
  || fields="{\"terminus\":\"unknown\"}"
log_event halt "$PHASE" "$DISPOSITION" "$DETAIL" "$fields"
```

The `timing_fields()` helper **already exists** at `dispatch-ladder-run:583`
(header at `:572`) and is called on the clean branches at `:1397` and `:1429`.
Merge its object into halt's. Separately, `ADV_ERR_LAST` is captured at
`:1329` and folded into the **requeue** event only (`:1502`) — fold it into
halt's detail too. Both anchors verified; both are the same function, which is
why they share a PR rather than blocking each other.

**Unit 3 — completion signals that are not a phase change.**
`dispatch-ladder-await`'s `graph_verdict()` at `:377` decides completion from
`.phase != "$FROM_PHASE"` at `:440` (verified). Two defects, same probe:

- *False stall:* the conflict lane and a qa fixing pass complete by pushing and
  writing job-dir markers without touching graph phase → reported `stalled`.
  A `lane_pass` probe already exists at `:458` — verify how much of this is
  already covered before writing new code.
- *False success:* `fix` and `conflict` are awaited rungs that are not `Phase`
  members, so `.phase != "$FROM_PHASE"` is trivially true and `advanced` (`:443`)
  is returned unconditionally. The `review` carve-out at `:428` is the existing
  pattern to follow.

**Unit 4 — blocked node is not honest silence.** `graph-select-target` collapses
blocked/parked/done/absent/reviewed into one empty answer with the reason only
in stderr prose, so `dispatch-ladder-run` classifies a permanently blocked node
as `ci-wait` and re-polls for the full `--ci-wait-s` hour. Emit a distinct
reason and branch on it.

**Unit 5 — transient main dirt is not a contract breach.** One unrelated
modified `intentions/` file made `provision-node-worktree` refuse its
`git merge --ff-only`, `dispatch-graph-execute` return `park-failed`, and
`dispatch-ladder-advance:452-455` *(from node body — re-locate)* route it
through the failed catch-all to exit 11 — classifying a transient environment
state as `violation`. Give it its own disposition.

**Unit 6 — terminal-without-disposition dominates the clock.** Neither phase
declared a node-terminal marker, so each finished phase stayed registered until
the sweep freed it — 49.5% of a 9644s run elapsed after the work was already
public. Make phase completion declare its own marker rather than waiting for
the sweep.

**Unit 7 — terminus owns main-qa.** `dispatch-ladder-advance:239-245`,
`packages/intentionsutil/src/transitions.ts:75-78`,
`dispatch-graph-execute:189` *(all from node body — re-locate)*. Drive the node
to a terminal state including spawned main-qa work, instead of ending at merge
and leaving the post-merge write to a fleet reconciler the run does not control.
**This is the largest unit — if PR2 is running long, split Unit 7 into its own
PR2b; nothing else here depends on it.**

### Dependencies

PR1 (node bookkeeping). Units 1 → 2/3/4/5 within the PR.

### Reuse

- `timing_fields()` — `dispatch-ladder-run:583`. Do not write a second one.
- The `review` carve-out — `dispatch-ladder-await:428` — is the shape Unit 3's
  new carve-outs should copy.
- `log_event`'s structured-fields fifth argument (documented in its header).

### Verification

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-advance.sh
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-await.sh
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-status.sh
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-spawn.sh
```

Manual: force a halt (kill a phase worker mid-run) and confirm the `halt`
record in `events.jsonl` carries `elapsed_s`, `await_repolls`, `window_s`
**and** the advance stderr cause. Confirm a blocked node halts promptly instead
of re-polling for the full CI-wait window.

> These suites are **not auto-discovered by CI** — run them explicitly.

---

# PR3 — Audit instrument: residual lenses and measurement blind spots

**Recommended model: sonnet** — mostly additive jq lenses in one script, with
one `find` predicate fix. Escalate to opus only if Unit 1 finds the scoping
work genuinely incomplete.

### Context

The instrument is `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` (1547
lines). Three of its lens nodes are already shipped and only need verification
and closing; two lenses are genuinely missing; and three findings say the
instrument is blind to the very workers it is meant to measure.

### Nodes closed (9)

*Verify-and-close (likely no diff):*
- `tactic-audit-instrument-scoping`
- `tactic-audit-permission-friction`
- `tactic-audit-cache-efficiency-lens`
- `tactic-rsi-round-trips-lens-carrier`

*Real work:*
- `tactic-audit-review-effort-yield-lens`
- `tactic-rsi-lane-token-attribution`
- `tactic-eval-finding-sidecar-monitor-post-filter-self-conceals`
- `tactic-eval-finding-ladder-worker-unstamped-audit-blind`
- `tactic-eval-finding-align-tactics-worker-transcript-unscanned`

### Scope

**Unit 1 — residual verification (do first, may be diff-free).** For each of
the four verify-and-close nodes, read the node's success criteria and check it
against the instrument. Evidence gathered during planning:

| Node | Evidence on `main` |
|---|---|
| `audit-instrument-scoping` | `--session`/`--node` documented `aggregate-usage.sh:21-47`; `scope:{type,id}` emitted `:1463,1488` |
| `audit-permission-friction` | `lenses.permission_friction` rollup, `:835` |
| `audit-cache-efficiency-lens` | `hit_ratio: {window, by_phase}`, `:1211` |
| `rsi-round-trips-lens-carrier` | `boot_preamble` block, `:1335`; `scriptable_round_trips` present |

Residual work actually observed: `audit-permission-friction` also asks for a
closing `/fewer-permission-prompts` step on the attended audit — check whether
that exists. `audit-instrument-scoping` asks for fleet-denominator lenses tagged
**fleet-only**; the vocabulary appears at `:1164` and `:1463` — confirm every
fleet-denominator lens carries it.

**Unit 2 — stale path prose.** Six node bodies name
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. That skill
does not exist on `main`. Correct the prose to
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh` in every node body this
PR touches. (Prose-only; `validate-graph` prose refs must stay at 0 unresolved.)

**Unit 3 — review-effort yield lens.** Confirmed absent (zero matches for
`review_effort` / `effort_yield`). Add findings and applied fixes per built-in
`/code-review` run, bucketed by effort level, so the `high` raise can be
compared against its own `low` baseline.

**Unit 4 — rsi-lane token attribution.** Confirmed absent (zero matches for
`rsi_lane`). Make rsi-family and research-lane session spend attributable, so
the strategy's per-workflow spend condition can be read at all.

**Unit 5 — sidecar monitor self-conceals.** `aggregate-usage.sh:1347-1349`
(verified):

```
sidecar_eligible: ( [ $sessions[] | select(.type=="worker") ] | length ),
sidecar_present:  ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ),
```

`$sessions` is the **post-filter** list, so under `--node` a session missing its
sidecar leaves both numerator and denominator, and the monitor reports
`eligible:0 / rate:null` — indistinguishable from "no workers scanned" —
exactly when the stamping it monitors has failed. Compute the sidecar
denominator over the **pre-filter** candidate set.

**Unit 6 — ladder workers born unstamped.** Detached ladder phase workers get no
`.dispatch-stamp.json`, so `--node` scans zero files. The `SessionStart` hook
(`.claude/hooks/stamp-dispatch-session.sh`) does not mint stamps for
`claude --bg` workers. Mint at spawn.

**Unit 7 — align-tactics worker transcript unreachable.** `aggregate-usage.sh:1458`
(verified) restricts candidate project dirs:

```sh
\( -name '*worktrees*' -o -name '*--bare' \) -print0
```

`dispatch-graph-execute` spawns the align-tactics phase with
`--cwd PROJECT_ROOT`, so its top-level transcript lands in the main-checkout
project dir and is excluded at **every** scope. Every align-tactics evaluation
ever produced has measured only subagents. Widen the predicate to include the
main-checkout project dir.

> Unit 6 → Unit 7 is the landed `blocked_by` edge: minting the sidecar is
> necessary but not sufficient. Do them in that order inside this PR.

### Dependencies

PR1. Units 6 → 7 internally.

### Reuse

- The existing lens-emission jq block at `aggregate-usage.sh:1376` (`lenses: {`)
  — add new lenses there rather than building a parallel path.
- `.claude/hooks/stamp-dispatch-session.sh` — extend, don't duplicate.

### Verification

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
.claude/skills/rsi-audit/scripts/test-audit-aggregate-writer.sh
.claude/skills/rsi-audit/scripts/test-topic-usage-writer.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: run `aggregate-usage.sh --node <a node with a completed ladder run>` and
confirm (a) `sidecar_eligible` is non-zero, (b) the align-tactics orchestrating
turn appears, not just its subagents.

> **Hook edit warning:** Unit 6 touches `.claude/hooks/`. Per project
> convention a hook change requires running **all** `hooks/test-*.sh` suites,
> not just the one that looks related.

---

# PR4 — Finding write surface: retire the ledger primitive

**Recommended model: opus** — a doctrine change with a 40-node data migration
and five writers collapsing into one.

### Context

`tactic-eval-finding-ledger` is the doctrine root and was rewritten
2026-08-14 to retire the ledger as a distinct graph primitive. It carries an
explicit `## What is retired` / `## Out of scope` split — read it first; it is
authoritative and this section summarizes it.

### Nodes closed (6)

- `tactic-eval-finding-ledger` *(doctrine + migration; do first)*
- `tactic-finding-search-all-producers`
- `tactic-eval-finding-in-flight-guard-permanent-after-execution-completes`
- `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`
- `tactic-eval-finding-skipped-locked-exit-zero-chained-caller-proceeds`
- `tactic-duplicate-finding-sensor` *(blocked_by the first — do last)*

### Scope

**Unit 1 — retire the class marker.** Remove `isLedgerEntry`
(`packages/intentionsutil/src/schema.ts:529` — verified) and its one live call
site (`packages/intentionsutil/scripts/graph-census-debt.ts:143` — verified):

```ts
if (n.phase === "done" && !isLedgerEntry(n)) donePresent.push(n.id);
```

Re-key that prune exemption to **any node carrying
`attributes.measured_impact`**. Then strip `attributes.ledger_entry` from the
**40** nodes that carry it (`grep -rl 'ledger_entry: true' intentions/`). Update
`intentions/kind-tactic.md`.

**Unit 2 — retire the namespace as a membership test.** In
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`: `ID_PREFIX`
at `:258`, the prefix+attribute filter at `:422-428`, and the anchored id regex
at `:593` (all verified):

```sh
if [[ ! "$ID" =~ ^tactic-eval-finding-[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
```

Widen mint-or-reuse search from the `tactic-eval-finding-*` namespace to the
whole open tactic set.

**Unit 3 — one find-or-recur write surface.** Merge the five private follow-up
writers (`dispatch-invalid-state-followup`, `dispatch-followup-exists`,
`dispatch-security-followup`, `dispatch-qa-needs-main-followup`, and
`dispatch-eval-finding` itself) into one surface every producer calls: an
optional deterministic key plus a whole-graph similarity search, with a
key/search **disagreement recorded as a finding** rather than resolved silently.

> Out of scope per the doctrine node: the find-before-minting step inside each
> producer's *skill* body. That is `tactic-finding-search-all-producers`'s own
> scope — which is Unit 3 here, so keep the skill-body edits minimal and
> mechanical.

**Unit 4 — in-flight guard is permanent.** `dispatch-eval-finding:936`,
`:1004`, `:1166` *(from node body — re-locate)*. The guard gates on
`execution == null`, but `execution` stays non-null after a fix merges, so a
fixed entry can never record another occurrence. Gate on "execution is
non-null **and** not yet resolved".

**Unit 5 — `--list` reads a stale working tree.** `dispatch-eval-finding:44-51`,
`:420-424`, `graph-commit:1481` *(from node body — re-locate)*. The plumbing
writer never moves the checkout HEAD and restores node files to HEAD content
after a verified land, so the read path cannot see the write path and the
similarity judgment mints duplicate slugs. Read from `origin/main`, not the
working tree.

**Unit 6 — lost writes exit 0.** `dispatch-eval-finding:205-208`, `:298` *(from
node body — re-locate)*. `skipped-locked` and `skipped-in-flight` are documented
lost writes but exit `0` like `landed`, so a chaining caller proceeds as if the
write succeeded — one `--resolved-by` loss let a chained `--retire` retire an
entry with no `resolved_by`. Give them distinct non-zero codes.

**Unit 7 — duplicate-findings sensor.** Count distinct tactics recording the
same root-cause defect, read over tactics carrying `attributes.measured_impact`,
attributed to `/rsi`. **Must come after Unit 1** — the node's own
`## Dependencies` section says the namespace must stop being the membership test
before the count is meaningful.

### Dependencies

PR1. Units 1 → 2 → 7 internally.

### Reuse

- `attributes.measured_impact` is already validated by `validateGraph` rule 21
  and documented on `intentions/kind-tactic.md` — the re-keyed exemption reads
  an existing, enforced field.
- The existing similarity-search helper inside `dispatch-eval-finding` (`:422`
  block) is the base for Unit 3's whole-graph search.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: after the migration, confirm `grep -rl 'ledger_entry' intentions/`
returns nothing, and that `graph-census-debt` still exempts every node carrying
`measured_impact` from its prunable set (compare prunable counts before/after —
they must be equal).

---

# PR5 — Reconciler tick cost

**Recommended model: sonnet** — five localized efficiency fixes in one
340-line script, plus one CAS pin.

### Context

`reconcile-graph-review-stall` runs every tick and duplicates work
`reconcile-graph-merged` did moments earlier in the same tick: a second full
`intentions/` scan, a duplicate PR-JSON fetch, a redundant CI-verdict REST
call, and a fresh `node --import tsx/esm` subprocess **per candidate per tick**
to evaluate a pure two-string predicate.

### Nodes closed (7)

- `tactic-review-stall-listnodes-duplicate-scan`
- `tactic-review-stall-pr-json-duplicate-fetch`
- `tactic-review-stall-ci-verdict-cache-miss`
- `tactic-review-stall-predicate-subprocess-spawn`
- `tactic-review-stall-conflict-lane`
- `tactic-reconcile-review-stall-base-pin`
- `tactic-done-node-retention-scan-cost`

### Scope

All anchors *(from node bodies — re-locate)* in
`.claude/skills/dispatch-propagate/scripts/reconcile-graph-review-stall`:

- **`:146-150`** — second full `intentions/` scan per tick. Share one
  materialized node enumeration with `reconcile-graph-merged`.
- **`:186`** — duplicate `gh_pr_view_rest` fetch. Memoize per-PR JSON for the
  tick, or fold the check into `reconcile-graph-merged`'s existing per-PR loop.
- **`:214`** (with `.claude/skills/dispatch-propagate/scripts/lib.sh:829-831`) —
  read `.mergeable` first so `CONFLICTING` short-circuits without a CI call, and
  skip candidates whose head sha is unchanged since the last sweep found no
  regression.
- **`:220`** — evaluate the pure `reviewStallRoute` predicate inline in bash, or
  batch all candidates through one subprocess.
- **Conflict lane** — enter conflict resolution on a `CONFLICTING` reviewed node
  instead of holding it, converging the two conflict producers on one policy.
- **Base pin** — pin the diagnosis-time base blob on the landing
  `graph-commit` so a concurrently landed write is three-way merged rather than
  clobbered by a stale in-memory node.

**Separately**, `tactic-done-node-retention-scan-cost`: bound the cost of
retaining done tactics on disk for the every-tick full-scan callers —
`packages/intentionsutil/scripts/reconcile-graph.ts:186`,
`packages/intentionsutil/src/store.ts:128`,
`packages/intentionsutil/scripts/graph-census-debt.ts:160` *(from node body —
re-locate)*.

### Dependencies

PR1. Independent of PR2–PR4.

### Reuse

- `reconcile-graph-merged`'s existing `listNodes` pass and per-PR loop — the
  point of four of these units is to **share** them, not to add caches.
- `lib.sh`'s existing `gh_pr_view_rest` / `dispatch_ci_verdict_rest` helpers.

> **`lib.sh` constraint:** `lib.sh` must stay copyable standalone. Adding a new
> `source` line to it breaks ~17 CI fixtures that copy it alone — they go red in
> CI while passing locally.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run one tick with timing before and after; confirm the `intentions/`
scan count drops from 2 to 1 and the per-candidate `node` subprocess count
drops to at most 1 per tick.

---

# PR6 — Detached code-review: locking and attribution

**Recommended model: opus** — process lifetime, kernel locks and a
write-attribution race.

### Pre-PR session (required)

```
/office-hours tactic-review-sitting-code-review-lock-design
```

The flock design this PR implements is currently held **on trust, not
verification** — the author delegated the design choice. Ratify before building.

### Context

Four findings on `dispatch-code-review` (1411 lines). One is a falsification:
the node lock shipped in PR #3078, but the detached child **still dies with its
launcher** despite `setsid` — so the lock node's fix does not hold.

### Nodes closed (4)

- `tactic-eval-finding-detached-code-review-dies-with-launcher`
- `tactic-code-review-detached-node-lock`
- `tactic-dispatch-code-review-concurrent-write-attribution`
- `tactic-dispatch-code-review-reject-pattern-self-match`

### Scope

**Unit 1 — the child is not actually detached.** Interrupting the launching
Bash tool call killed the child session 3ms later and both in-flight max-effort
angle subagents 96ms later, destroying a 4.5-hour-budgeted review 63 seconds
after it started, leaving the phase with no graph change. Establish real
detachment (process group / session leader) and verify by interrupting the
launcher.

**Unit 2 — lock for the child's own lifetime.** A kernel-released `flock` held
by the detached child and honored by every worktree-claim path, so a survivor
that outlives its session cannot have another worker spawned into the tree it is
still writing. Depends on Unit 1: a lock held by a child that dies with its
launcher is not a lock.

**Unit 3 — concurrent-write attribution.** `dispatch-code-review:141` and
`:227`, `.claude/skills/review-fix/SKILL.md:263-271`, `review-fix.js:1080`
*(from node bodies — re-locate)*. The before/after `git stash create` window has
no exclusivity lock on the reviewed worktree, so any concurrent writer during
the nested `claude -p /code-review` has its edits silently attributed to the
review's `fixed[]` output and committed under review-fix's name. Unit 2's lock
is the mechanism.

**Unit 4 — rejection-signature self-match.** `dispatch-code-review:190-193`,
`.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs:88`
*(from node bodies — re-locate)*. The check greps the **entire** combined
stdout+stderr for literal reject strings with no structural scoping, so a review
that quotes the literal rejection text false-positives and spuriously hard-stops
a successful review. Scope the match structurally.

### Dependencies

PR1, and the office-hours ratification above. Units 1 → 2 → 3 internally.

### Reuse

- The lock shipped in PR #3078 — repair it rather than replacing it; Unit 1 is
  the reason it does not currently hold.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh
```

Manual: launch a detached review, interrupt the launching call, and confirm the
child survives and completes. Then attempt to spawn a second worker into the
same worktree and confirm it is refused while the lock is held.

---

# PR7 — Review-phase orchestration cost

**Recommended model: sonnet** — three concrete plumbing fixes; the umbrella
node records the measurement, it does not require a redesign.

### Pre-PR sessions (recommended)

```
/rsi-audit 7d
```

Run once to record the current baseline for
`tactic-dispatch-observation-masking` and
`tactic-dispatch-cache-preserving-context` before changing anything. The
`hit_ratio` lens is already shipped (`aggregate-usage.sh:1211`), so the
cache baseline is readable today.

### Context

Measured on the review phase of `tactic-attention-namespaced-rank`
(2026-08-13T22:44:24Z–23:01:54Z): phase price proxy **$76.09**, of which the
**orchestrator session alone was $37.47 across 109 turns** — 2.7× what all five
review lenses spent combined ($13.72). Only **18%** of spend looked at the diff.
Wall clock divides the same way: ~830s of the 1026s phase is fixed
orchestration that does not scale with delta size. Yield for the whole $76.09:
10 findings, **0 actionable**, 0 fixes — against a 1-file, +2/-2, comment-only
delta.

This PR takes the three sub-findings with concrete, non-redesign fixes, worth
roughly **270s and $5.50** of that floor. The remaining ~$62 is the
orchestrator's own 109 turns; the umbrella node records that as an open
question and explicitly does not propose a fix here.

### Nodes closed (5)

- `tactic-eval-finding-review-fix-workflow-args-rederived-each-pass`
- `tactic-eval-finding-phase-log-writer-issue-num-param-undocumented-for-pr-lane`
- `tactic-eval-finding-workflow-file-writes-cost-subagent-roundtrips`
- `tactic-review-cheap-fix-disposition`
- `tactic-eval-finding-review-orchestration-outspends-review-lenses` *(closes as
  measured-and-partially-addressed; see below)*

### Scope

**Unit 1 — args contract re-derived every pass.** The `/review-fix` worker
greps `.claude/workflows/review-fix.js` on every pass — three greps, ~100s,
dumping 80 arg lines plus the script's first 60 into a context already at
193,827 tokens — because `.claude/skills/review-fix/SKILL.md` carries an args
block that **nothing declares authoritative**. Declare it authoritative and add
a check that fails if it drifts from the script.

**Unit 2 — phase-log writer param undocumented for the PR lane.**
`dispatch-write-phase-log:1-38` *(from node body — re-locate)* documents its
positional argument as `<issue-num>` and errors with "an issue-num argument is
required", but a node-lane node has no issue and carries only `execution.pr`.
Every node-lane worker spends ~3 attempts and ~70s rediscovering that the PR
number is correct. Document it; accept both names.

**Unit 3 — workflow file writes cost subagent round-trips.** Four of the twelve
subagents a `/review-fix` pass launches exist only to write two result JSON
files and stat them — **$3.70 and 9 turns of model inference for a write plus a
`wc`** — because the Workflow tool has no filesystem access. The result still
records `coverage_incomplete: true` because the size check is not exact. Give
the script a non-subagent write path, or drop the round-trip and compute the
check exactly.

**Unit 4 — cheap-fix disposition.** Make the residue classify step fix cheap
out-of-contract findings in scope and defer only expensive ones (cost as a
second resolve-in-scope trigger).

**On closing the umbrella node:** it closes as *measured, floor partially
reduced*. Its remaining open question — whether the Step 1 classifier sequence,
context pack and Step 7 marker/sidecar/envelope tail can collapse into fewer
script invocations — should be **re-recorded as a new tactic** rather than
silently dropped. Note that `dispatch-derive-node-target` ran **three times** in
the measured pass (once sandbox-denied, once with the override, once purely to
re-extract `PR_NUM`); that is the cheapest visible thread to pull.

### Dependencies

PR1. Independent of PR2–PR6.

### Reuse

- `.claude/skills/review-fix/SKILL.md` already carries the args block — Unit 1
  makes it authoritative rather than writing a new one.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: run one `/review-fix` pass against a trivial delta and compare
`aggregate-usage.sh --session <id>` against the $76.09 / 248-turn baseline
above. Expect the subagent count to drop from 12 by at least 3, and the args
re-derivation greps to disappear entirely.

---

# PR8 — Dispatch config: fail closed, and version the pace curve

**Recommended model: sonnet** — small, well-specified, three files.

### Context

`dispatch.config/target-workers.json` is the pace curve every scheduling
decision reads and is **today the sole gate holding the fleet at zero workers**.
It is untracked **and** not gitignored in the main checkout — no version
history, no review path, no recovery if the tree is cleaned. Meanwhile
`dispatch-target-workers --max` silently returns the baked-in default `8` on a
corrupt or unreadable config, so the fail-closed guard never engages for the
realistic config-tamper case.

> The untracked `dispatch.config/` directory is visible in the repo's current
> `git status` — this is a live exposure, not a hypothetical.

### Nodes closed (3)

- `tactic-dispatch-config-untracked-pace-curve`
- `tactic-target-workers-max-silent-corrupt-fallback`
- `tactic-dispatch-pause-config-field`

### Scope

**Unit 1 — track the pace curve.** Decide tracked-with-history vs
gitignored-with-a-committed-template, and implement whichever. Either is
acceptable; the current state — neither — is not.

**Unit 2 — fail closed on a corrupt config.** `dispatch-target-workers:227` and
`:238-262`, `dispatch-select-tick:707` and `:744` *(from node bodies —
re-locate)*. Surface the failure instead of returning `8`. Per
`.claude/rules/code-style.md`, a clear error beats a defensive fallback — this
is that rule's exact case.

**Unit 3 — pause becomes a config field.** Replace the pause sentinel file with
a `dispatch.config/*.json` boolean as the **sole** mechanism, failing closed on
any config read error. `dispatch-tick:266-300`, `dispatch-config-load:342-344`,
`.claude/skills/dispatch-propagate/scripts/lib.sh:1837` *(from node body —
re-locate)*.

### Dependencies

PR1. Independent of the rest.

### Reuse

- `dispatch-config-load` is the single config read path — route Units 2 and 3
  through it rather than adding reads.
- `target-workers.example.json` is the existing template if Unit 1 goes the
  gitignore route.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-config-load.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-config-scope.sh
```

Manual: corrupt `dispatch.config/target-workers.json` and confirm
`dispatch-target-workers --max` exits non-zero with a descriptive error rather
than printing `8`. Confirm the pause field stops the tick and the sentinel file
no longer has any effect.

---

# PR9 — Worktree and session lifecycle

**Recommended model: opus** for Units 1–2 (a reap that can delete the wrong
checkout), **sonnet** for the rest. Split if convenient.

### Context

Seven findings on how sessions claim, hold and release worktrees. Two are
destructive-risk: the reap can treat a repo-root session's checkout as a
removable node worktree, and the standdown sweep can erase a stand-down while a
live session still holds the node name.

### Nodes closed (8)

- `tactic-reap-session-worktree-classification`
- `tactic-standdown-clear-no-worktree-live-session`
- `tactic-provision-worktree-script-tests`
- `tactic-graph-worktree-implicit-invocation`
- `tactic-eval-finding-worktree-isolation-guard-refuses-worker-commands`
- `tactic-reclaim-audit-spawn-handoff-expired-count`
- `tactic-dispatch-explicit-ci-wait`
- `tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir`

### Scope

**Unit 1 — classify reap candidates before resolving paths.**
`lib-session-reap.sh:286-291`, `:374`, `:548`, `provision-node-worktree:113`
*(from node bodies — re-locate)*. Classify a candidate as
having-a-node-worktree **versus** running-at-the-repo-root **before** the sweep
resolves any worktree path, so the reap never treats a repo-root session's
checkout as removable.

**Unit 2 — standdown clear must not race a live session.**
`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:619`,
`dispatch-graph-execute:185-200` *(from node bodies — re-locate)*. The
cleared-no-worktree branch erases a stand-down while a live session still holds
the node name, silently re-creating the deadlock the tactic removes for
`strategy-*` nodes, which never get a pre-provisioned worktree.

**Unit 3 — provision script test coverage.** Add script-level coverage for
`provision-node-worktree`'s worker-start gate integration (selected-phase arg,
exit 12/13 pass-through, scope-fingerprint stamp write) in
`test-provision-node-worktree.sh`.

**Unit 4 — implicit worktree resolution.** A graph-operation wrapper that
resolves the target node worktree itself, so sessions stop restating absolute
`.claude/worktrees/<id>` paths in every Bash call.

**Unit 5 — document the isolation guard properly.** The Claude Code built-in
worktree-isolation guard hard-refused **6 worker commands in one align-tactics
phase** — 75% of that phase's non-schema tool errors and all 6 of its
`policy_blocks`, at $0.84 of retry price proxy — because
`.claude/rules/sandbox.md` documents the too-complex-to-verify variant only as a
passing clause under a `git -C` heading, and frames the cd-and-command variant
as a permission-prompt cost rather than a hard refusal. Give the guard its own
section. *(Docs only — but it is the cheapest token win in this plan.)*

**Unit 6 — reclaim audit is blind to a fourth reason.**
`dispatch-reclaim-audit:194`, `lib-reservation-ledger.sh:626` *(from node
bodies — re-locate)*. The RATE source greps exactly two literals —
`(dead-session-stranded)` and `(live-worker-redundant)` — so
`spawn-handoff-expired` shows up nowhere. Add it.

**Unit 7 — explicit lane waits out CI.** Make the explicit-node dispatch lane
wait out in-flight CI up to the reservation TTL instead of skipping, leaving the
autonomous and `--manual` paths unchanged.

**Unit 8 — recover the stranded deferred diff.** The implement phase deferred a
fully-implemented, verified Unit 4 and left the **36,973-byte diff only at
`$CLAUDE_JOB_DIR/tmp/unit4-deferred.patch`** — a job scratch directory the
harness deletes with the job. Check whether job `09888b78` still exists; if the
patch survives, commit it somewhere durable, and if it does not, mark the node
as lost work and record what was in it. **Do this unit first — it is the only
one in this plan with a deadline.**

### Dependencies

PR1. Unit 8 is time-critical and independent of everything.

### Reuse

- `lib-claude-agents.sh`'s `claude_sessions_under` / `worktree_has_live_session`
  for Units 1–2. Note these shell out to `claude agents --json`, which returns
  an empty `[]` under the sandbox rather than erroring — those call sites need
  the sandbox override or they silently conclude "no live sessions".

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-lib-session-reap.sh
.claude/skills/dispatch-propagate/scripts/test-provision-node-worktree.sh
.claude/skills/dispatch-propagate/scripts/test-reclaim-audit.sh
.claude/skills/dispatch-propagate/scripts/test-dispatch-ci-ready.sh
```

```verify
.claude/skills/dispatch-propagate/scripts/run-rules-check.sh
.claude/skills/dispatch-propagate/scripts/run-rules-test.sh
```

Manual: with a live repo-root session running, run the reap sweep and confirm
its checkout is classified as not-removable.

---

# PR10 — RSI trigger chain

**Recommended model: opus** — four nodes forming a strict dependency chain that
defines when the harness evaluates itself.

### Pre-PR session (required)

```
/office-hours tactic-review-band-derivation-ratification
```

Re-validates the 2026-08-12 band/residual resolution held on trust across
`kind-kind`, `strategy-rsi-delegated-prioritization` and
`tactic-attention-namespaced-rank`. The thresholds this PR writes into config
inherit that derivation.

### Context

Today `/rsi` fires only at ladder phase boundaries. This PR builds the full
trigger chain: the audit writes cut points into config, a gate reads and
compares them, a sweep fires on ended sessions across **both** drivers, and the
ladder evaluates at every phase boundary.

The `blocked_by` edges landed in `da1c3c7f` define the unit order exactly:

```
rsi-audit-threshold-table → rsi-trigger-threshold-gate
                          → rsi-session-sweep-trigger
                          → ladder-per-phase-evaluation
```

### Nodes closed (5)

1. `tactic-rsi-audit-threshold-table`
2. `tactic-rsi-trigger-threshold-gate`
3. `tactic-rsi-session-sweep-trigger`
4. `tactic-ladder-per-phase-evaluation`
5. `tactic-rsi-external-acceptance-gate`

### Scope

**Unit 1 — threshold table.** Have `/rsi-audit` write per-phase-kind
cost-per-unit-of-change cut points into config on its fleet pass, so the trigger
gate reads a cheap table instead of recomputing the distribution.

**Unit 2 — the gate.** Gate `/rsi` on four trigger families: outcome
(unconditional), relative cost-per-unit-of-change, an absolute ceiling, and a
sampling floor — with `k`, the ceiling and `N` author-owned config. The node is
explicit that the gate does a **read-and-compare and nothing else**; keep it
that small.

**Unit 3 — lane-agnostic session sweep.** Replace the ladder-only
phase-boundary spawn with a sweep over ended sessions' `dispatch-stamp`
sidecars, so `/rsi` fires for phase **and** unattended-intervention sessions on
both drivers, scoped to the exact session id. `dispatch-ladder-run:124`,
`.claude/skills/dispatch-ladder/SKILL.md:365` *(from node body — re-locate)*.
Apply the gate, then spawn.

**Unit 4 — per-phase evaluation.** Make `/dispatch-ladder` evaluate at every
phase boundary — the driver spawns a fire-and-forget per-phase evaluation job
and never waits — and narrow the closing pass to cross-phase synthesis only.
`dispatch-ladder-run:677` *(from node body — re-locate; note `spawn_phase_eval`
is already called from `halt()` at `:729`)*.

**Unit 5 — external acceptance gate.** Gate RSI's own harness changes on an
acceptance signal outside RSI's control, and record the rate at which
self-passed changes are refuted by it. This is the safety property for
everything above: without it, the harness grades its own homework.

### Dependencies

**PR2** (the ladder driver this hooks into) and **PR3** (the instrument the gate
reads, and the sidecar minting Unit 3 sweeps). Strict internal unit order 1→4.

### Reuse

- `spawn_phase_eval` already exists in `dispatch-ladder-run` and is already
  guarded twice (on the phase having launched, and on it not already having been
  evaluated) — Unit 4 extends it rather than adding a second spawn path.
- PR3's sidecar minting is what makes Unit 3's sweep non-empty.

### Verification

```verify
.claude/skills/dispatch-ladder/scripts/test-dispatch-ladder-run.sh
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Manual: run one ladder phase to completion and confirm exactly one `/rsi` job
spawns, scoped to that session id, and that the gate's read-and-compare appears
in the log with the config values it read.

---

# PR11 — RSI lens catalog decomposition

**Recommended model: opus** — a structural rewrite of two skills.

### Pre-PR sessions (required)

```
/office-hours tactic-review-tradition-agentic-engineering
/rsi-audit 14d
```

The first verifies `tradition-agentic-engineering` — an already-load-bearing
claim held on trust. The second satisfies
`tactic-rsi-measure-fanout-and-model-routing`: this catalog declares a `model:`
per lens, and both imported fan-out/model-routing findings were measured on
configurations this repo does not run. **Measure before fixing the values.**

### Context

`/rsi` carries a seven-lens prose list (`.claude/skills/rsi/SKILL.md:88-146`,
`:175-202`) and `/rsi-audit` a twelve-lens one
(`.claude/skills/rsi-audit/SKILL.md:110-140`) *(anchors from node body —
re-locate)*. Neither is machine-readable, so every consumer re-reads prose.

### Nodes closed (1)

- `tactic-rsi-lens-catalog-decomposition`

### Scope

Decompose both prose lists into one `/rsi-lens-*` skill catalog whose
frontmatter declares each lens's **carrier field, scope tag, execution mode and
model**, and reduce both skills to thin selectors over it.

Out of scope: changing what any lens measures. This is a re-housing, not a
re-derivation — a lens whose output changes in this PR is a bug.

### Dependencies

**PR3** — the catalog's `carrier field` entries must name fields the instrument
actually emits, and PR3 both adds two lenses and corrects the stale
`dispatch-token-audit` paths. Building the catalog first would encode paths that
do not exist.

### Reuse

- The scope vocabulary already exists in the instrument
  (`any-scope` / `fleet-only`, `aggregate-usage.sh:1164`, `:1463`) — the
  catalog's `scope tag` should use that vocabulary, not a new one.

### Verification

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Manual: run `/rsi-audit 7d` before and after and diff the reports. Lens output
must be identical; only the skill structure changes.

> **Sensor-name coupling:** a registered sensor's name is coupled to node prose
> **exactly**. Renaming a lens that is also a registered sensor name silently
> de-registers it. Check `read-sensors` before renaming anything.

---

# PR12 — RSI intervention core

**Recommended model: opus** — extracting a shared core from four lanes.

### Context

Four invalid-state lanes duplicate evaluation logic. Extract the shared
evaluation core and make each lane a thin selector over **core + lens catalog +
the one write surface**, adding a variance-debugging lens and a closed
remediation list declared in its own frontmatter.

### Nodes closed (1)

- `tactic-rsi-intervention-special-cases`

### Scope

`dispatch-invalid-state`, `dispatch-diagnose-main`, `dispatch-node-reap`,
`dispatch-conflict`, `.claude/hooks/dispatch-stop.sh` *(from node body —
re-locate)*.

### Dependencies

Both are the node's own landed `blocked_by` edges:

- **PR11** — the lens catalog is one of the three things each lane selects over.
- **PR4** — `tactic-finding-search-all-producers` is "the one write surface".

Building this before either means writing against interfaces that do not exist.

### Reuse

- PR4 Unit 3's find-or-recur write surface — this PR is its second consumer and
  the proof it generalizes.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: drive one invalid state per lane and confirm each produces the same
remediation as before the extraction.

> **Hook edit warning:** this touches `.claude/hooks/dispatch-stop.sh` — run
> **all** `hooks/test-*.sh` suites.

---

# PR13 — Dispatch skill family rename

**Recommended model: sonnet** — mechanical, but must be exhaustive and atomic.

### Context

Rename for uniform `/dispatch-*` naming: `/align-tactics` → `/dispatch-plan`,
`/qa-fix` → `/dispatch-qa`, `/review-fix` → `/dispatch-review`. The node says
common standards are extracted **only if a concrete consumer emerges** — do not
invent one.

### Nodes closed (1)

- `tactic-dispatch-skill-standards-extraction`

### Scope

Every reference to the three skills: skill directories, `SKILL.md` frontmatter
`name:`, all `.claude/skills/**` cross-references, `.claude/workflows/*.js`,
`.claude/rules/*.md`, `.claude/settings.json` `allowedTools` patterns, and node
prose in `intentions/`.

### Dependencies

**All twelve preceding PRs.** This renames files they edit; running it earlier
guarantees conflicts in every one of them. **Last, and alone.**

### Reuse

Nothing — this is a rename.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/run-rules-check.sh
.claude/skills/dispatch-propagate/scripts/run-rules-test.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts
```

Manual: grep the whole repo for each old name and confirm zero hits outside
historical node bodies.

> **Atomicity requirement.** A skill rename orphans `verify` fences: the
> baseline count of fences referencing the renamed skills **must not grow**, and
> the rename plus every fence update must land in the **same PR**. A rename
> split across two PRs leaves fences pointing at a skill that no longer exists.

---

# PR14 — RSI prioritization and research lane

**Recommended model: opus** for the prioritization writer (it writes attention),
**sonnet** for the research skill.

### Context

Three nodes that extend RSI beyond evaluation into prioritization and scheduled
research. Grouped last because one is blocked on work **outside this plan's
scope**.

### Nodes closed (3)

- `tactic-rsi-audit-prioritization-writer` — **blocked outside this plan.** Its
  `blocked_by` names `tactic-attention-namespaced-rank`, which is not in this
  scope and has an open branch. Confirm that node has landed before starting.
- `tactic-rsi-reprioritization-outcome-audit`
- `tactic-rsi-research-skill`

### Scope

**Unit 1 — delegated attention writer.** Within-band boosts on `owner: ai`
tactics, each appended to `attributes.priority_log` with a read-before-write
anti-thrash check. `packages/intentionsutil/src/attention.ts`, `src/router.ts`,
`scripts/write-node.ts` *(from node body — re-locate)*.

**Unit 2 — outcome audit.** Derive the reprioritization delta and the post-hoc
outcome audit: did tactics `/rsi-evaluate` front-loaded actually close faster
than the queue baseline?

> **The node's anchor is dead.** It names
> `packages/intentionsutil/scripts/render-rsi-plan.ts`, which **does not
> exist**: it was built in #3065 and **deleted in #3074** ("Collapse the rsi
> skill family into /rsi and /rsi-audit"). `tactic-rsi-plan-skill`, which owned
> it, is `phase: done` — so the graph records a completed node whose deliverable
> was later removed by a consolidation, and three other node bodies still cite
> the file. This unit must first pick a new home for the derivation (most likely
> `/rsi-audit` itself, which absorbed the rest of `/rsi-plan`), then implement
> it there. Fix the stale citations in
> `tactic-rsi-audit-workflow-attribution.md:59`,
> `tactic-rsi-research-skill.md:59` and
> `tactic-attention-namespaced-rank.md:822` while you are in the graph.

**Unit 3 — research skill.** Build `/rsi-research` and its weekly harness-cron
schedule — the scheduled `/deep-research` sensor lane of the RSI strategy.

### Dependencies

PR3 and PR10. Unit 1 additionally depends on `tactic-attention-namespaced-rank`,
which is **outside this plan** — if it has not landed, ship Units 2–3 and leave
Unit 1 open rather than blocking the PR.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run the writer in dry-run against the live graph and confirm the
anti-thrash check refuses a second boost inside the same window.

---

## Closing nodes after each merge

Because these PRs bypass the ladder, **no transition happens automatically.**
After each merge, for every node the PR closed:

1. `npx tsx packages/intentionsutil/scripts/dump-node.ts --out-dir <dir> <id>…`
2. jq-merge `phase: "done"` and `execution.resolved_by: "<merge sha>"`
3. `npx tsx packages/intentionsutil/scripts/write-node.ts --file <dir>/<id>.json`
   — the single validation gate
4. `npx tsx packages/intentionsutil/scripts/validate-graph.ts`
5. `packages/intentionsutil/scripts/graph-commit -C <repo path> --base <manifest> -m <msg> <id>…`

Five hazards on this path, each of which has bitten before:

- **`graph-commit` requires an explicit `-C`.** It resolves the repo root from
  `-C`/`--repo`, else **cwd** — never from its own location. Without it you
  commit the wrong checkout and it exits 0 as a landing that landed nothing.
- **`pushed=none context=noop` is a failure signature**, not a success. A
  successful land reads `context=push-reported-success`.
- **Local `main` ahead of `origin/main` silently drops node edits** — this is
  exactly PR1 Unit 1. Until PR1 lands, fetch and confirm `HEAD...origin/main` is
  `0 0` before every `graph-commit`.
- **`write-node.ts` drops unknown keys**, and re-dumping a node after editing it
  wipes the edit. Dump once, edit, write.
- **Verify by reading `git show origin/main:intentions/<id>.md`**, not by
  trusting the verdict line.

---

## Coverage

All **72** in-scope open tactics are assigned; none appears twice.

| PR | Nodes | Surface |
|---|---|---|
| PR1 | 4 | `graph-commit`, `schema.ts`, `sensors.ts`, `office-hours.test.ts` |
| PR2 | 9 | `dispatch-ladder-{run,advance,await}` |
| PR3 | 9 | `aggregate-usage.sh`, `stamp-dispatch-session.sh` |
| PR4 | 6 | `dispatch-eval-finding`, `schema.ts`, `graph-census-debt.ts` |
| PR5 | 7 | `reconcile-graph-review-stall`, `reconcile-graph.ts`, `store.ts` |
| PR6 | 4 | `dispatch-code-review` |
| PR7 | 5 | `review-fix.js`, `review-fix/SKILL.md`, `dispatch-write-phase-log` |
| PR8 | 3 | `dispatch-{target-workers,config-load,tick}` |
| PR9 | 8 | `lib-session-reap.sh`, `provision-node-worktree`, `sandbox.md` |
| PR10 | 5 | `/rsi`, `/rsi-audit`, `dispatch-ladder-run` |
| PR11 | 1 | `/rsi` + `/rsi-audit` → `/rsi-lens-*` |
| PR12 | 1 | four invalid-state lanes |
| PR13 | 1 | repo-wide rename |
| PR14 | 3 | `attention.ts`, `router.ts`, `/rsi-research` |
| pre-PR sessions | 6 | no diff |
| **total** | **72** | |
