# The dispatch/RSI window — state and serial PR sequence

**The scope of the window:** retire the open in-flight bugs, then land the
greenfield design for the RSI, for `/align` graph management (its tooling and
its data structure), and for the dispatch ladder (including automated
scheduling) — executed serially, by hand, while all other implementation work is
frozen.

This file is the **index**: where the window stands, and what order the rest of
it runs in. The executable per-PR detail is in
`plans/dispatch-rsi-serialized-pr-plan.md` — every section there is
clean-session-executable, and this file deliberately does not restate it.

> **This file carries no history.** Author rulings live on their nodes in
> `intentions/`; how the window reached its current state is in the commit
> history. What is written below is only what still governs work that has not
> happened yet. If you want to know why a decision went the way it did, read the
> node or the commit — do not expect a narrative here.

---

## Where this stands

| | |
|---|---|
| **Shipped** | **PR1** — graph write-path integrity, `fe0b1c4d` (#3095). Its eight nodes are closed. Every later PR builds on it |
| **Retired** | **Position 0**, the in-flight overhang. Five clean draft-halves landed (#3099, #3101, #3102, #3104, #3105); seven drafts stay open by ruling, each absorbed by the bundle that owns its surface |
| **Discharged** | **Every author gate.** All ten prerequisite decisions were ruled at the 2026-08-28 sitting, the last two re-ruled 2026-08-29, and all eleven `office_hours` parks cleared. No position in the sequence is waiting on the author |
| **Next** | **Position 1 — PR18**, the durable-layer write fence. Nothing gates it |
| **Not started** | Positions 1 through 13. PR2 through PR20 |

The rulings that shape unit work are carried in the position entries below and,
in full, in the PR sections of the plan. Nothing else from the sitting needs to
be read.

---

## The premise: the freeze is held, not waited out

Four ground rules, set by the author, hold across everything below.

1. **No carrier node.** These PRs are implemented ad-hoc, in sessions that
   bypass the dispatch ladder. No node carries `execution.pr`; a PR is a plain
   branch off `main`.
2. **Node bookkeeping is an explicit post-merge step**, not a ladder
   transition. Each PR section in the plan ends with the exact write that closes
   its nodes.
3. **All three large refactors are in scope** — lens-catalog decomposition,
   intervention-core extraction, dispatch skill rename — and are sequenced last,
   because each rewrites surfaces the earlier PRs edit.
4. **The freeze does not lift until this sequence is done.** The pause sentinel
   is not an outage to work around and not a window that might close mid-flight;
   it is the enabling condition. Any step reading "before resumption" means
   before *that* point, not before some externally scheduled restart.

**What the freeze does not stop.** The sentinel gates worker *spawning* and
scheduling. It does not gate ledger bookkeeping and **it does not freeze
`main`** — a paused tick still runs five sweeps and drains the node lane. Plan
accordingly: `main` moves under you while the window is open, which is why the
plan's anchors need re-verification and why several PRs guard against a
concurrently landed write being clobbered.

---

## The sequence

Every position is a **bundle** — PRs grouped by shared code surface, because the
work is serialized and the cost of a large PR is lower than the cost of two PRs
touching the same file.

**117 tactics are assigned across the sequence**, none twice, plus 11
documented-and-deliberately-unassigned and 13 absorbed by the overhang
retirement. 38 of the 117 sit on the graph read/write path — the largest single
surface in the window, and the one every other PR's bookkeeping runs through.

| # | Bundle | PRs | Nodes | Why here |
|---|---|---|---|---|
| ✅ | 1 · graph read/write path | PR1 | 8 | **SHIPPED `fe0b1c4d`** (#3095) |
| ✅ | 0 · retire the in-flight overhang | *no new PRs* | +13 | **RETIRED** — cleared the drafts every later bundle would conflict with |
| **1** | 1c · durable-layer write fence | PR18 | 5 | HOT. The fence ~100 remaining node closures write through |
| **2** | 1b · graph plumbing | PR15 + PR16 | 15 | HOT. The closure toolchain itself. PR15 carries a conditional hold |
| **3** | 2a · record-time main-qa routing | PR5a | 1 | Must precede Bundle 2 |
| **4** | 2 · tick-path reconcilers and sweeps | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT. Runs on every tick, paused or not |
| **5** | 4 · instrument + finding surface | PR3 + PR4 | 16 | COLD, but unblocks positions 6 and 8 |
| **6** | 2b · supersession representation | PR19 | 3 | Real `blocked_by` edge onto PR4's write surface |
| **7** | 3 · dispatch runtime | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD. Nothing invokes it while paused |
| **8** | 5 · RSI chain | PR10 + PR11 + PR12 + PR14 | 10 | COLD. Needs PR2 + PR3 + PR4 |
| **9** | 5b · `/align` charter + adversarial review | PR20 | 8 | **Must** precede the rename |
| **10** | 6 · skill rename | PR13 | 1 | Last, alone. Renames every path PR20 writes |
| **11** | 7 · merge queue + scan cadence | PR17 | 6 | COLD. Must be in place *before* the resumption |
| **12** | 8 · the four deferred A3 drafts | #3093 → #2856 → #3040 → #3037 | 4 | Bulk node-content rewrites invalidate every `--base` CAS manifest |
| **13** | 9 · the charter split | *one new PR* | 1 | Deferred past 12 for the same CAS reason. Node edit + paired code change in one branch |
| — | *staged resumption* | — | — | Sentinel off at `max_concurrent_workers: 1`, one node through the full ladder |
| — | *deferred outright* | PR8 U3 | 1 | Rewrites the freeze mechanism; only during an attended un-pause |

---

## Position by position

### Position 1 · Bundle 1c — PR18, the durable-layer write fence

5 nodes. `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`,
`/review-fix`, `router.ts`, `graph-commit`'s park path.

Front of the queue for two reasons. Mechanically, its one `blocked_by` edge
cleared when PR1's nodes closed, so it is ready and nothing else is. By
argument, it is the fence that decides what an **autonomous** writer may do to
durable node content — and roughly a hundred node closures still run through
that fence. It sits ahead of Bundle 1b because it carries no ref-split exposure
and PR15 does.

Two rulings shape its units:

- **Unit 4** (fleet-alarm frozen-tactic clobber) implements **both** remedies
  (a) and (b). They fix different halves of the loop; neither alone closes it.
- **Unit 5** (park content, delete/modify) takes the **ordinary branch only**,
  and records the delete/modify residue rather than handling it.

### Position 2 · Bundle 1b — PR15 + PR16, the graph plumbing

15 nodes; the closure toolchain every later bundle's bookkeeping runs through.

**PR16** (11 nodes — `transition-node`, `park-node`/`clear-park`,
`read-sensors.ts`, `validate-graph`, `verify-landed`) is the half worth landing
here. It absorbs #3023, #2975 and #2974. Two rulings shape its units:

- **Unit 10** (sensor de-registration) ships in a fixed order: **shape (2)
  first** — a post-merge check on `main` that cannot deny a write, and therefore
  cannot re-arm the repo-wide write outage — **and it must FAIL the post-merge
  `graph-validate` job, not warn on stderr.** Shape (1), the node-scoped fatal
  inside `guard`, follows only once its new `origin/main` read has a proven
  failure-open path. The premise was verified live: `main` is not in
  `unit-tests.yml`'s `branches-ignore` and `graph-validate` is a job inside that
  workflow, so (2) needs only the binding-comparison check and no new workflow.
- **Unit 5** (`readDelegationRecordsReading`): the rule **still governs** — port
  it, **retarget** its two tests, amend the threshold, then delete the dead
  function. The threshold half is sequenced **reader-then-threshold**: the
  reader must first gain a canonical, date-free met-state string, and the
  threshold is then set to *exactly* that string. `deriveGap` is trimmed
  case-insensitive string equality, so a reader that embeds its read date can
  never meet any fixed threshold — rewording the threshold alone is a silent
  no-op.

**PR15** (4 nodes — `graph-commit` simplification) carries a **conditional
hold**, which comes due when this position is reached: the 2026-08-14 ref-split
disposition recorded *defer*, but attached a standing instruction to revisit it
before PR15 starts, because ref-split's Unit 2 rewrite would subsume PR15's
Units 1–2. **Decide that before opening PR15.** PR16 does not share the exposure
and may proceed independently.

Kept separate from Bundle 1 deliberately: both touch `graph-commit`, but Bundle
1 was correctness and this is simplification. Landing them together would mean a
regression in the writer could not be bisected against a known-good one.

### Position 3 · Bundle 2a — PR5a, record-time main-qa routing

1 node. Small and out of order on purpose: it was never in the original scope,
and it must precede Bundle 2's reconciler work.

### Position 4 · Bundle 2 — tick-path reconcilers and sweeps

10 nodes: PR5 plus PR9 Units 2 and 6 and PR2 Unit 6.

**This is the only bundle that is hot because it is running right now.** The
sentinel does not stop the tick: `reconcile-graph-merged` is in the drain on
every tick, and PR5's base-pin unit prevents a concurrently landed write being
clobbered — a live risk precisely because `main` is still moving under the
window. PR5 reads as pure efficiency work for a paused system and is not.

PR5 absorbs #3002 and the already-landed half of #3064. Its conflict-lane unit
must be coordinated with #3018's conflict-lane work, now in PR8 — **one policy,
not two**.

### Position 5 · Bundle 4 — PR3 + PR4, instrument and finding surface

16 nodes. COLD in itself, but it comes before Bundle 3 because positions 6 and 8
both depend on it.

**PR4** retires the ledger primitive: a doctrine change with a 40-node data
migration and five writers collapsing into one write surface. That surface is
what PR19 writes supersession edges through, which is the hard edge into
position 6. **PR3** repairs the audit instrument's residual lenses and
measurement blind spots — and most of it may be a bookkeeping pass rather than
an implementation, because the graph says four of its nodes are open and the
code says otherwise. **Verify every "missing" claim before implementing**; see
the plan's section of that name.

Run `/rsi-audit 7d` for a baseline before changing anything — PR3 is what makes
the two RSI measurement runs readable.

### Position 6 · Bundle 2b — PR19, supersession representation

3 nodes: `schema.ts` (`superseded_by` + terminal), `/align-tactics` drops,
`lint-verify-fence-paths.sh`.

Pinned behind PR4 by a real `blocked_by` edge —
`tactic-persist-greenfield-drops` is blocked by
`tactic-finding-search-all-producers`, PR4's central node, because supersession
edges are written *by* that write surface.

The two sub-points this PR encodes were ruled, and **Unit 1 must encode the
ruled form, not the original wording**:

- **Sub-point one — amended.** An in-flight node (`execution` non-null) still
  gets the supersession edge and still gets **no park**, so a similarity
  judgment never halts live work. But the edge **must carry its expiry event** —
  normally that in-flight PR's own merge or closure — because the
  interim-live-risk exception is only permitted when an expiry is named.
  **Encode the field in Unit 1 alongside `superseded_by`**: adding it after
  PR19 lands is a data migration, not an edit.
- **Sub-point two — ratified**, with the per-unit drop's carrier stated
  explicitly: the node's own unit list, not the edge and not a park.

Absorbs #3041 directly. **Keep #3093, #2856 and #3040 out** — they rewrite node
content in bulk and belong at position 12, after the bookkeeping.

### Position 7 · Bundle 3 — dispatch runtime

25 nodes: PR2's remainder, PR6, PR7, PR8 Units 1–2, PR9's remainder.

Deliberately large. Nothing invokes any of it while paused, so the cost of
bundling is not a broken window — it is that the first fleet start after
resumption becomes a single pass/fail boolean. **Mitigate with the staged
resumption, not by splitting**: that converts the boolean into a diagnosable
test and is worth more than any split.

**PR6's locking design was ratified**, and the apparent contradiction that
gated it — the flock shipped, yet the detached child dies with its launcher —
was never a defect in the lock. It is a defect in the detachment beneath it:
`dispatch-code-review` already runs `setsid`, already disowns, and already
refuses to start without it, and the child died anyway. So the flock stands,
held by the child, and **Unit 1 is re-parenting via a `systemd-run --user`
transient unit** — not the falsified process-group remedy. The demonstration
that a detached review survives its launcher's exit is still owed **before Unit
2 is trusted**.

PR8 Unit 1 is more urgent than its position suggests — the pace-curve config is
untracked and unrecoverable.

### Position 8 · Bundle 5 — the RSI chain

10 nodes: PR10 (trigger chain) + PR11 (lens catalog decomposition) + PR12
(intervention core) + PR14 (prioritization and research lane).

The band derivation PR10 writes into config was ratified on the code's ground.
Its second sub-point — that the cross-strategy inversion count was structurally
zero and so unfalsifiable — is **superseded rather than answered**: the residual
no longer exists, because the sort key is now `(tier, band, score, depth)`. The
`success_signal` amendment that followed is already landed.

**PR11 needs `/rsi-audit 14d` first.** The catalog declares a `model:` per lens,
and both imported fan-out/model-routing findings were measured on configurations
this repo does not run. **Measure before fixing the values.**

`tradition-agentic-engineering` was verified on the trust half — three idioms
recorded as genuine external deference, context engineering excluded as
convergence — and PR11 may encode that. Its **lane half is deferred**: it cannot
be reviewed until `/rsi-research` has run, and `/rsi-research` is built by
**PR14 Unit 3, in this same position**. Revisit it after this bundle lands, not
before.

### Position 9 · Bundle 5b — PR20, the `/align` charter and adversarial review

8 nodes; a new `/align-review` skill plus `assemble-review-pack`,
`graph-commit --review`, `/align` and `/align-tactics` skill text, and a
`validate-graph` lint.

The `/align-audit` disposition that gated this position is discharged: the
strategy-wide band breach was ruled **(c) accept with remediation**, keeping the
35% target and naming this sequence itself as the drain plan.

### Position 10 · Bundle 6 — PR13, the skill rename

1 node, repo-wide. **Last and alone**, and the ordering against position 9 is
not a preference: PR20 edits `.claude/skills/align-tactics/SKILL.md` and PR13
renames that skill to `/dispatch-plan`. Running them in the other order orphans
every path PR20 writes — the same failure this repo has already hit once, where
a rename left `verify` fences pointing at a deleted skill. **The violation is
silent, not a merge conflict**, which is what makes it dangerous.

Absorbs #2946's contested half: it edits eight skill bodies, every one of which
this PR renames by path. Sequence `tactic-legacy-office-hours-entry-removal`
*after* this PR — it moves anchors under PR9, PR16 and PR20 at once.

### Position 11 · Bundle 7 — PR17, merge queue and scan cadence

6 nodes: `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs.

**The only bundle whose position is set by the resumption rather than by
dependencies.** Everything in it is dormant while the sentinel holds, and it
must be in place before the staged resumption — otherwise that resumption
measures an unbounded scan cadence and a silent merge veto instead of measuring
the fleet.

### Position 12 · Bundle 8 — the four deferred A3 drafts

#3093 → #2856 → #3040 → #3037, **in that order**. All four are bulk
node-content rewrites, which is why they are last: each one invalidates every
`--base` CAS manifest, so any node bookkeeping still in flight would have to be
re-derived.

- **#3093** first (92 frontmatters, `attention.boost`+`tier` →
  `attention.boosts`). Largest blast radius, purely mechanical, and it touches
  two nodes this plan closes — so it runs after the closures, not before.
- **#2856** then **#3040** — both edit `schema.ts` and `attention.ts`, so they
  conflict with each other; land one, rebase the other.
- **#3037** last. It edits `graph-commit` and `dispatch-select-tick`, the tools
  every preceding closure runs through. Landing here also means **#3037 rebases
  over PR15**, not the reverse, so PR15's anchors stay stable.

### Position 13 · Bundle 9 — the charter split

1 node (`tactic-review-dispatch-charter-split`), one new PR. Deferred past
position 12 for the same reason Bundle 8 is: an exclusive re-serve of 316
children invalidates every `--base` CAS manifest still in flight. What is
recorded on the node today is the **spec**, not the edit.

**The shape, as ruled.** Three charters, cut along the strategy body's existing
sections: *recording surface* (Serialization & Commit, Other Settled Mechanism);
*router and selection* (Router Mechanism, Phase Transitions & Fix State,
Fingerprint & Freeze, Pace/Backlog/Attention, Review & QA Disposition); *session
lifecycle* (Worktree Claiming & Liveness, Recovery & Session Lifecycle,
Execution Substrate). The re-serve is **exclusive**, and the parent's
defect-ratio `success_signal` is **retired** in favour of per-charter bands.

**Why the retirement is not bookkeeping.** `strategyBacklogBand`
(`packages/intentionsutil/src/census.ts:30-32`) selects children by
`n.serves.includes(strategyId)` — direct membership, **no ancestry walk**. An
exclusive re-serve therefore removes children from the parent's denominator
outright: the parent would not measure the same population re-cut, it would
measure a shrinking rump, and at `total === 0` it returns `pct: null` rather
than erroring. Leaving the ratio in place yields a signal that reads green
because it measures almost nothing.

**The node edit and the code change must land together, in one ordinary branch
and PR.** `packages/intentionsutil/test/lifecycle-sensor.test.ts:330` asserts
that `LIFECYCLE_SENSOR_NAME` (`read-sensors.ts:485`) equals this strategy's
`success_signal.sensor` **verbatim**, and a second guard in the same file
requires every registered sensor name to be recorded by some node. **Editing
either side alone turns CI red**, and `graph-commit` cannot carry the code half.
`read-sensors.ts` also hardcodes `BACKLOG_STRATEGY_ID =
"strategy-graph-native-dispatch"` and `BACKLOG_BAND_PCT = 35`, both of which the
retirement makes stale.

### Then: the staged resumption

Not a midpoint. Per ground rule 4 it happens only after the last position above
has merged and its nodes are closed, so **no bundle may be sequenced against
it**. Remove the sentinel with `max_concurrent_workers: 1`, walk one node
through the full ladder, and only then restore normal concurrency.

**PR8 Unit 3 stays deferred past even that.** It replaces the pause sentinel
with a config field — it rewrites the mechanism enforcing the freeze while the
freeze depends on it. Land it during a deliberate, attended un-pause, never
mid-window.

---

## Open items that are not positions

Nothing here waits on the author. Three are measurement runs, one is a decision
that comes due mid-sequence, and one is work with no sequenced home.

### Three measurement runs

They need an `/rsi-audit` run, not author time. All three are `owner: ai`, and
two can run unattended today.

| Node | Gates | Run |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` | PR7 | `/rsi-audit 7d` — read `hit_ratio` (`aggregate-usage.sh:1211`) and record the baseline **before** changing prompt-prefix handling. Its `blocked_by` edge reads as "Bundle 4 first," but the blocker's deliverable already shipped — live by the code, open by the graph. Position 5 runs before position 7 anyway, so following the graph costs nothing |
| `tactic-rsi-measure-fanout-and-model-routing` | PR11 | `/rsi-audit 14d` — measure this harness's own fan-out and model routing before the catalog fixes a per-lens `model:`. The instrument already counts `subagents_launched` (`aggregate-usage.sh:1052-1070`). Load-bearing: setting those values from unmeasured external numbers is the exact error this node exists to prevent |
| `tactic-dispatch-observation-masking` | PR7 | **Splits.** The cost half runs now, on this window's own sessions. The **quality half cannot precede the PR it gates** — it needs dispatch-phase sessions with a working ladder, which Bundle 3 delivers, and PR7 is inside Bundle 3. Ship PR7 against the cost half; treat the quality half as a follow-up that may revise it. *(The node's rationale calls the third lens `context_lens`; no such key exists — it is `lenses.context_over_120k`. Fix the prose while you are in the node.)* |

### The PR15 ref-split revisit

A real decision, due when **position 2** is reached and not before. See that
position, and §"Decisions already taken" in the plan for what was deferred and
why.

### `tactic-retire-assessor-contract-docs` has no sequenced position

`phase: implement`, `owner: ai`, three units: retire `.claude/docs/delegability.md`,
`.claude/docs/signal-identification.md` and their `ref-*` skills, plus
`.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.

It is not in the 117 and appears in no bundle, so this sequence can be executed
to completion without anyone noticing it — the same failure mode the four
deferred A3 drafts had before they became position 12. **Recommendation, not a
ruling:** ride it at position 9, whose PR20 already rewrites the `/align` skill
surface it edits. It is small, and the freeze means no worker will pick it up.

---

## The orderings that are not preferences

Most of the sequence can flex — Bundles 3 and 4 can swap or overlap, since they
share no files, and PR2 and PR5–PR9 are mutually independent. Six constraints
cannot:

1. **PR20 before PR13** (position 9 before 10). A rename orphans the paths the
   other PR writes, silently.
2. **PR4 before PR19** (position 5 before 6). A real `blocked_by` edge, and
   supersession edges are written by PR4's surface.
3. **PR5a before Bundle 2** (position 3 before 4).
4. **PR17 before the resumption** (position 11). Otherwise the resumption
   measures the wrong thing.
5. **Bundle 8 after all node bookkeeping** (position 12). Bulk content rewrites
   invalidate every CAS manifest.
6. **The charter split after Bundle 8** (position 13). Same CAS reason, larger
   blast radius — 316 children re-served.

---

## What this sequence does not cover

- **Six deferred nodes**, with reasons: the ref-split cluster
  (`tactic-graph-ref-split`, `-blocker-audit`, `-read-coherence`),
  `tactic-node-scope-files-overlap-gate` and `tactic-scope-stamp-in-graph`
  (both need a running fleet, i.e. resumption work), and
  `tactic-demote-node-stale-local-read` (blocked behind
  `tactic-phase-evidence-fingerprint-bound`).
- **Five adjacent nodes, surveyed and deliberately not claimed** —
  `tactic-qa-main-node-terminal-declaration` and the two
  `tactic-invalid-state-rc-*` nodes are `/qa-main` node-lane paths that write
  job-dir markers instead of graph state; `/qa-main` does not run while the
  sentinel holds and they overlap PR12's surface. Plus
  `tactic-session-reap-authorization-durability` and
  `tactic-park-cause-sensor-instrument`, which need a running fleet.
- **Eleven documented-but-unassigned tactics** from the third coverage pass.

---

## One caveat that applies to the whole sequence

The plan's `phase: null` re-verification **expired on 2026-08-20, in both
directions.** Inward: 45 of the 102 node ids in its `### Nodes closed` sections
are now `phase: implement` on `origin/main`, moved by `/align-tactics`
finalization rounds run after the plan was written. Nothing about the
assignments changed — but *"these nodes are not in the ladder"* is no longer
true of the phase field, **and the tick reads the phase field**. Outward: the
same filter is why the plan never saw the ~20 in-charter nodes at
`phase: implement` with no PR.

Treat every `path:line` anchor in the plan as a hint, not an address —
including the anchors carried in node bodies, several of which had already
drifted when the plan was written.
