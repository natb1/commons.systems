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

**The split is by question, not by topic.** This file answers *what to run
next, and in what order*; it owns bundle composition, execution order, the hard
ordering constraints and the cross-PR dependency edges. The plan answers *how to
run one PR*. The plan carried its own copy of the bundle table, the recommended
order and the dependency tree until 2026-08-29; the copies had drifted, so they
were consolidated here and the plan now points at this file.

> **This file carries no history.** Author rulings live on their nodes in
> `intentions/`; how the window reached its current state is in the commit
> history. What is written below is only what still governs work that has not
> happened yet. If you want to know why a decision went the way it did, read the
> node or the commit — do not expect a narrative here.

---

## Where this stands

| | |
|---|---|
| **Shipped** | **PR1** — graph write-path integrity, `fe0b1c4d` (#3095). Its eight nodes are closed. Every later PR builds on it. **PR18** — the durable-layer write fence, `478cc324` (#3134), Position 1. Bookkeeping landed `84cc158e`: four of its five nodes closed, one parked — see §"Position 1 — PR18". **PR15 (U0/U3/U4)** — the graph-commit simplification half of Position 2, `a4a964b8` (#3136). Bookkeeping landed `1f56e0c2`: all five of its nodes closed — see §"Position 2 — PR15". **PR16 (7 of 12 units)** — the node-mutation half, `96d22cb1` (#3138). Bookkeeping landed `c55710c4`: eight of its twelve nodes closed, four carried forward — see §"Position 2 — PR16". **PR5a (Units 1–6)** — record-time main-qa routing, `77bd7471` (#3140), Position 3. **Bookkeeping is still owed**: Unit 7's `Verifiability: WAIT` migration has not run and no node is closed — see §"Position 3 — PR5a" |
| **Retired** | **Position 0**, the in-flight overhang. Five clean draft-halves landed (#3099, #3101, #3102, #3104, #3105); seven drafts stay open by ruling, each absorbed by the bundle that owns its surface |
| **Discharged** | **Every author gate.** All ten prerequisite decisions were ruled at the 2026-08-28 sitting, the last two re-ruled 2026-08-29, and all eleven `office_hours` parks cleared. The two decisions that came due later — the PR15 ref-split revisit and where `tactic-retire-assessor-contract-docs` rides — were **ruled 2026-08-29**, as was the research lane's build-or-retire — **BUILD, folded into `/rsi-audit`** as an opt-in, token-targeted subskill with no schedule, which retired the weekly cron and dissolved two of that node's three owed rulings rather than answering them. The last open ruling — PR14's `tactic-rsi-reprioritization-outcome-audit`, what its observable (a) measures — was **ruled 2026-08-29, disposition (A) ratified as proposed** (baseline = complement cohort; interval = creation → phase-done for both cohorts).

**Seven further rulings were made 2026-08-29**, in two interview sittings called because the "no position waits on the author" claim this row used to carry was false at five positions. They are recorded in `plans/dispatch-rsi-author-rulings.md`, and each is transcribed onto its node. In summary: a sibling-carrier draft becomes a **completion record**, not a prune; `dispatch.config/target-workers.json` **relocates under XDG**; strategy clarification 131 is amended to **make its premise true** at the selection-time surface; **park-clearing on a verifiably dead premise is delegated** to the executor, as is clearing the parks that block Unit 7's migration from draining; plan-prose rulings absent from the graph are **transcribed into node bodies and flagged**; **record-time minting is correct** and the "already-merged" prose is stale; and PR20 **Units 1 and 3 are descoped** |
| **Measured** | **All three `/rsi-audit` runs, 2026-08-29**, recorded on their nodes. Two changed what their PR should do: PR7 must not carry the imported cache claim (measured ceiling **4.3%**, against 41–80%), and PR11 must set per-lens `model:` from `cost_usd`, since `price_proxy_usd` inverts the model ranking. See §"Three measurement runs" |
| **Next** | **Position 4**. Position 3 shipped as #3140, but its Unit 7 migration and node closeout are **still owed** and must land before Position 4's bookkeeping, since Unit 7 rewrites nodes later positions also touch |
| **Carried forward** | **Four PR16 units and the #3023 absorption**, none of which gate a later position. Units 1 and 6 hold live `blocked_by` edges; Units 8 and 9 are parked on unmade author rulings; #3023 is wholly unlanded and is a PR-sized change of its own — see §"Position 2 — PR16" |
| **Open parks** | **Far more than one.** This row read "One, from Position 1" until 2026-08-29; per-position pre-staging disproved it. Confirmed live parks: **Position 1** — `tactic-autonomous-body-write-wholesale-replace` (PR18 shipped one of its four surfaces by a local contract rather than the shared primitive the node exists to introduce, and six of its seven units are assigned nowhere; three dispositions are in `office_hours.recommendation`; it gates no position). **Position 4** — 1. **Position 6** — 1. **Position 7** — 6, five of them on one owed ruling. **Position 8** — 3, where the position entry claims one. **Position 9** — 6, where the plan banner claims none. Separately, **12 of the 17 nodes carrying live `Verifiability: WAIT` marks are parked**, and `packages/intentionsutil/src/router.ts:482` and `:529` skip any parked tactic — so those sources can never drain to `done`, deadlocking Unit 7's chain for them. Clearing is delegated to the executor by the 2026-08-29 ruling, on a verified-dead premise only, each clear reported after the fact |
| **Not started** | Positions 4 through 13. PR2 through PR20 |

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

**114 tactics are assigned across the sequence**, none twice, plus 13
surveyed-but-unassigned and 13 absorbed by the overhang retirement. 36 of the
114 sit on the graph read/write path — the largest single surface in the window,
and the one every other PR's bookkeeping runs through. It read 117 / 11 / 38
until 2026-08-29; see §"Coverage" in the plan for the reconciliation.

| # | Bundle | PRs | Nodes | Why here |
|---|---|---|---|---|
| ✅ | 1 · graph read/write path | PR1 | 8 | **SHIPPED `fe0b1c4d`** (#3095) |
| ✅ | 0 · retire the in-flight overhang | *no new PRs* | +13 | **RETIRED** — cleared the drafts every later bundle would conflict with |
| ✅ | 1c · durable-layer write fence | PR18 | 5 | **SHIPPED `478cc324`** (#3134). 4 nodes closed, 1 parked |
| **2** | 1b · graph plumbing | PR15 (U0/U3/U4) + PR16 | 13 | HOT. The closure toolchain itself. PR15's hold discharged 2026-08-29 — split, U1–2 dropped |
| **3** | 2a · record-time main-qa routing | PR5a | 1 | Must precede Bundle 2 |
| **4** | 2 · tick-path reconcilers and sweeps | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT. Runs on every tick, paused or not |
| **5** | 4 · instrument + finding surface | PR3 + PR4 | 16 | COLD, but unblocks positions 6 and 8 |
| **6** | 2b · supersession representation | PR19 | 3 | Real `blocked_by` edge onto PR4's write surface |
| **7** | 3 · dispatch runtime | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD. Nothing invokes it while paused |
| **8** | 5 · RSI chain | PR10 + PR11 + PR12 + PR14 | 10 | COLD. Needs PR2 + PR3 + PR4. **PR14's 3 are not all plannable — expect a subset** |
| **9** | 5b · `/align` charter + adversarial review | PR20 + assessor-doc retirement | 9 | **Must** precede the rename |
| **10** | 6 · skill rename | PR13 | 1 | Last, alone. Renames every path PR20 writes |
| **11** | 7 · merge queue + scan cadence | PR17 | 6 | COLD. Must be in place *before* the resumption |
| **12** | 8 · the four deferred A3 drafts | #3093 → #2856 → #3040 → #3037 | 4 | Bulk node-content rewrites invalidate every `--base` CAS manifest |
| **13** | 9 · the charter split | *one new PR* | 1 | Deferred past 12 for the same CAS reason. Node edit + paired code change in one branch |
| — | *staged resumption* | — | — | Sentinel off at `max_concurrent_workers: 1`, one node through the full ladder |
| — | *deferred outright* | PR8 U3 | 1 | Rewrites the freeze mechanism; only during an attended un-pause |

---

## Position by position

### Position 1 · Bundle 1c — PR18, the durable-layer write fence ✅ SHIPPED

Merged as **`478cc324`** (#3134), 2026-08-29. Bookkeeping landed `84cc158e`.

5 nodes. `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`,
`/review-fix`, `router.ts`, `graph-commit`'s park path.

**Four nodes closed, one parked.** `tactic-dispatch-conflict-substance-allowlist`,
`tactic-review-fix-porcelain-guard-script`,
`tactic-fleet-alarm-node-park-clobber-loop` and
`tactic-graph-commit-park-content-durability` carry `phase: done` and an
`execution.completion` citing the merge. Each also carries a body record of what
shipped against what is still owed.

`tactic-autonomous-body-write-wholesale-replace` is **parked, not closed**. This
plan scoped its Unit 1 to one live site and annotated the node "a draft, not a
plan … no verification block" — which was true of the 2026-08-15 draft but not of
the node, whose 2026-08-20 `/align-tactics` round finalized it to `phase:
implement` with seven units and a Verification section. Six of those seven did not
ship: the shared `node_body_write` primitive does not exist, so
`dispatch-eval-finding` was hardened in place by a **local** contract instead of
calling it, and the copy-paste the node exists to eliminate still sits at three
sites. Grepped across this plan, no PR section claims `node_body_write`,
`dispatch-diagnose-main`, or `dispatch-invalid-state-followup`'s copy, so closing
it would have dropped that work out of the graph. Three dispositions —
split, narrow-and-mint-a-successor, or close-as-superseded — are in the node's
`office_hours.recommendation`. **Nothing waits on it**; later positions do not
touch those surfaces.

Two follow-ups came out of PR18's review and are recorded on nodes rather than
built: the durable-write fence arguably belongs inside `write-node.ts` rather than
a `/dispatch-conflict` skill step (nothing forces a skill step to run), and
`/review-fix`'s Unit-1 probe — has the lane ever actually modified a pre-existing
node? — was not run, so that question is still unmeasured.

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

### Position 2 · Bundle 1b — PR15 ✅ SHIPPED + PR16 ✅ SHIPPED, the graph plumbing

15 nodes; the closure toolchain every later bundle's bookkeeping runs through.

**PR15 (U0/U3/U4) shipped 2026-08-29** as `a4a964b8` (#3136); its bookkeeping
landed as `1f56e0c2`. PR16 is the remaining half of this position. Details in
§"PR15 — what shipped" at the end of this section.

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

**PR15's conditional hold is discharged.** The revisit the 2026-08-14 ref-split
disposition demanded was held on **2026-08-29** and ruled a **split**: PR15
ships **Units 0, 3 and 4 only**. Units 1–2 are **not written** — ref-split's
Unit 2 rewrite subsumes them, and the ruling refuses to write code with a known
deletion date on the hot writer path. DEFER stands for ref-split itself; its
rider (incremental cutover, blocker re-cut from 23 to 8) stays on the record as
post-window work rather than being adopted into this window.

Two consequences the position must carry: PR15 now closes **2 nodes, not 4** —
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge` move to the ref-split deferral set,
which grows from three nodes to five. And **Unit 0 still ships**: it is the
layer-2 REMOVAL correctness fix, and it was always marked as shipping even if
PR15 split. PR16 never shared the exposure and proceeds independently.

Kept separate from Bundle 1 deliberately: both touch `graph-commit`, but Bundle
1 was correctness and this is simplification. Landing them together would mean a
regression in the writer could not be bisected against a known-good one.

#### PR15 — what shipped, 2026-08-29

Merged as `a4a964b8` (#3136). Bookkeeping landed `1f56e0c2`, closing **five**
nodes. Units 1–2 were not written, per the split ruling, so the
`GRAPH_COMMIT_WRITER` default remains `worktree`.

**The five closed nodes** — `tactic-graph-commit-invocation-classifier-bypass`
(Unit 0), `tactic-node-merge-list-removal-loss` (Unit 3),
`tactic-graph-commit-noop-shortcircuit-head-behind` (Unit 4),
`tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression`,
and `tactic-flake-hook-tests-graph-commit-fixture-clone`.

**Reconciling the node count.** The paragraph above says PR15 "now closes 2
nodes, not 4." That count is about the four *graph-commit tactic* nodes only,
two of which moved to the ref-split deferral set. The other three closed nodes —
list-removal, citation drift, fixture-clone flake — were never in that four and
are assigned to PR15 by the serialized plan. Five is the correct total; each was
audited unit-by-unit against the shipped diff before being closed.

**No node's closure depended on the unwritten Units 1–2.** This was checked
specifically. The one that could plausibly have depended on the default flip,
`tactic-graph-commit-noop-shortcircuit-head-behind`, was scoped from the outset
to close the *worktree*-writer gap **while** `worktree` remains the default, and
listed the default as out of scope. The two nodes Units 1–2 would have closed,
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge`, remain open and travel with
ref-split — they were not silently absorbed.

**One stale park cleared, not re-provisioned.**
`tactic-node-merge-list-removal-loss` carried an `office_hours` park since
2026-07-31 (`provision-node-worktree failed … exit 2`) — an environment failure,
not a substantive one. It was cleared in the same write that set `phase: done`.

**One GitHub-side action.** #2990's merged body cites its five regression cases
as "36-40"; they are at 48-52, having been shifted by an unrelated commit. The
body is deliberately left as historical text, and a correction comment was
posted on that PR instead. This mattered because no later plan section claims
that correction — closing the node with nothing posted would have dropped it
from the graph owed by nobody. The repo half re-anchors three in-file citations
to assertion text and establishes name-over-ordinal as the convention.

**Two residues carried as observe-in-production items**, not owed code: a
*contended* list removal actually landing on `main`, and a live tick showing a
behind-main worker skip the landing cycle (`pushed=none … context=noop`, no
landing-lock claim).

**Accepted behavior change** worth knowing before PR16 touches this writer: a
behind-but-clean worktree-writer run no longer fast-forwards the caller's
checkout as a side effect of `land()`'s rebase. `sync_main_checkout()` is the
sync path; do not add a compensating fast-forward.

**Verification at merge:** `test-graph-commit.sh` 124/0, `intentionsutil` vitest
1230/1230 across 56 files, `test-approve-workflow-commands.sh` 71/71,
`run-typecheck.sh` 3/3, `run-lint.sh` clean. Note for anyone citing these later:
node bodies across this set carried stale figures (711/38, 43, 84, "Case 84")
that were corrected at closing — the regression case is **Case 85**.

#### PR16 — what shipped, 2026-08-30

Merged as `96d22cb1` (#3138). Two graph writes landed alongside it: the sensor
and threshold writes as `8a823862`, and the closing batch as `c55710c4`.
**Eight of the twelve nodes are closed; four are carried forward.**

Shipped: **Units 2, 3, 4, 5, 7, 10, 11** plus the folded class-B instrument-arm
verification.

**Corrections that changed the work**, all found by auditing the units against
the nodes before implementing rather than after:

- **Unit 4's data set was 3 nodes, not the 6 the plan claimed** — verified two
  independent ways across all 751 nodes. A naive `grep` for `phase: main-qa`
  returns 68 files, almost all of them nodes with a legitimate *first-class*
  phase; backfilling against that set would have corrupted 65 healthy nodes.
- **Unit 4 was widened to match its node.** The plan scoped an
  `attributes.phase`-only rejection; the node specifies a general shadow-ban
  over every first-class field name, plus deleting all six squatter readers.
  Shipping the plan's version would have left the node half-done while looking
  complete. Census taken first: 50 distinct `attributes` keys, zero collisions.
- **Unit 11's premise was false.** The exit-1 `unknown` arm it calls untested
  was already covered; the real gaps were two jq-mode arms and the `rev-parse`
  arm. Rescoped, and all three proven non-vacuous by mutation.
- **Unit 5's verification step cannot pass and must not be treated as failure.**
  It says to confirm `deriveGap` returns `null`; 17 of 21 active records are
  unexercised, so the gap is correctly non-null. What was verified instead: the
  threshold is byte-identical to the reader's exported literal, and the gap goes
  `null` when the reading *is* that literal. The signal was **permanently
  unsatisfiable** before and is now merely unmet.
- **Unit 3 shipped without `--dir`, against the plan and per its node.** The
  plan's premise that PR1 had made this script's tree explicit is false — PR1
  touched it by comment only — but adding `--dir` would have shipped the defect
  the unit exists to close, because four sensors close over module-level store
  constants and a partial `--dir` reads one store while writing another.

**Rule-number collision, live.** PR16 took **Rule 23** for the attributes
shadow-ban. `tactic-supersession-edge-and-terminal` — Position 6's PR19 — claims
Rules **23 and 24**. Rule numbers are cross-referenced from node bodies and are
never reused, so **PR19 must renumber**. Recorded in `schema.ts`'s ledger
paragraph and above the function.

**Unit 10's fatal is opt-in by necessity.** `graph-fast-path.yml` runs the same
`validate-graph.ts intentions` command in the `guard` job that four required
contexts depend on, so an unconditional fatal would re-arm the 2026-08-14
repo-wide write outage. The `--strict-sensors` flag is armed only in the
post-merge job. Any later unit touching this validator must preserve that split.

**A regression is now on the record.** The class-B verification landed a fresh
reading on `strategy-graph-native-dispatch`, replacing a 19-day-old flattering
one: backlog moved `24.6% (non-increasing)` → **`40.5% (increasing)`**, outside
its ≤35% band. The instrument arm is confirmed working; the band breach is a
separate matter for that strategy.

##### Carried forward — four units and the #3023 absorption

None gate a later position.

- **Unit 1** (`transition-node` clobbers an uncommitted body edit) — its node
  holds a live `blocked_by` on `tactic-scope-fingerprint-plan-substance`, and
  the behavior is *documented in `transition-node` as intentional*, so "fixing"
  it would revert a recorded decision. Needs the contradiction ruled first.
- **Unit 6** (scope-stale shell coverage) — live `blocked_by` on
  `tactic-strategy-fingerprint-stamp-coverage`, i.e. on #3023.
- **Unit 8** (`strategy_fingerprint` sha provenance) — **there is no write site
  on `main`**: `transition-node` never writes a strategy-fingerprint stamp at
  all, so there is nothing to correct until #3023 lands. Its node is *also*
  parked on an unmade ruling — whether that field keeps its `{hash, sha}` form
  or drops `sha`. The plan does not mention that park.
- **Unit 9** (`validate-graph` passes on an empty store) — its node is parked,
  and the plan's claim that "Units 9 and 11 were never blocked" is **false for
  Unit 9**. Implementing it as scoped requires inverting
  `reader-required-dir.test.ts`'s currently-passing, deliberately-authored
  assertion that an empty *named* store is a legitimate graph — landed by PR1
  itself. That is the weakening `.claude/rules/test-integrity.md` forbids;
  it needs an author ruling, not a workaround.
- **#3023** — **none of its scope is on `main`.** Its clean-half spin-off #3100
  closed *without merging*, so this is a 20-file, roughly +1571/−90 change, not
  a conflicting remainder. Its only consumers here are Units 6 and 8, and Unit 8
  is blocked on a ruling regardless, so absorbing it now buys nothing.

**Verification at merge:** `intentionsutil` vitest 1252/1252 across 57 files
(from 1230/56), `test-graph-commit.sh` 124/0, `test-park-node.sh` 25/0,
`test-verify-landed.sh` 28/0 (from 25/0), `tsc --noEmit` exit 0,
`run-typecheck.sh` 3/3, `run-lint.sh` clean, and `validate-graph.ts intentions`
ok at 751 nodes both with and without `--strict-sensors`.

> Note for later positions: `run-lint.sh` and `run-typecheck.sh` diff
> `origin/main...HEAD`, so they are **vacuous on uncommitted work**. Running
> lint only after committing is what caught a net-new `as` cast every
> subagent's own run had reported clean.

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

The baselines this position was expected to unblock were **already taken on
2026-08-29** — see §"Three measurement runs". PR3 turned out not to gate them:
every lens they used already emits correctly. PR3 stays at this position for its
own reasons, not as a measurement prerequisite.

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
that a detached review survives its launcher's exit is Unit 1's **own acceptance
test**, not a gate on starting the PR — reading it as a prior gate is circular,
since it tests the re-parenting Unit 1 builds. **De-risked 2026-08-29**: a child
launched into a `systemd-run --user` transient unit survived the teardown of its
launching Bash tool call and completed 12s later. The honest limit is that this
killed a *background* task rather than a foreground tool call, so the interrupt
test is now a confirmation rather than a discovery — still owed before Unit 2
ships.

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

**PR11's measurement is done** — taken 2026-08-29, on a 30d window, because a
14d one returns no fan-out data at all under the freeze. Two results bind this
PR. First, the per-lens `model:` values must be anchored on the **measured 1.91×
opus-to-sonnet per-turn cost premium**, not on the imported ratios, which came
from configurations this repo does not run. Second, and easy to get wrong:
**`price_proxy_usd` ranks sonnet *above* opus** (37827 vs 31372) because the
proxy holds price constant to isolate token count. **Set `model:` from
`cost_usd`.** Fan-out for context: review launches 18.6 subagents per session at
6.3 per applied fix, with 31.8% of findings actionable.

`tradition-agentic-engineering` was verified on the trust half — three idioms
recorded as genuine external deference, context engineering excluded as
convergence — and PR11 may encode that. Its **lane half is re-scoped, not deferred**
(ruled 2026-08-29). There is no longer a lane to review: the research lane is
folded into `/rsi-audit` as an opt-in subskill with no schedule, so B3's lane
half now reviews **the fold** — does research-sourced input stay subordinate to
measurement in practice, and does the seed list steer anything now that it is a
source-trust filter rather than a crawl plan? That can be sat **after the first
research-mode run**, which an author-invoked pass makes available the day Unit 3
lands, instead of after two or three weekly cron firings. The circularity that
made it look unreachable inside the window is gone.

**PR14's readiness (updated 2026-08-29 evening).** Unit 3's node
(`tactic-rsi-research-skill`) had its park cleared 2026-08-29 and is now
`codified` with its plan in its body — its `blocked_by` edge onto
`tactic-rsi-lane-token-attribution` is satisfied inside this sequence, since
that node closes with PR3 at position 5. Unit 2's ruling landed the same day
(disposition (A) — see the status table) and its plan follows via the
`/align-tactics` finalize. Only Unit 1 can still fall out: its node is blocked
on `tactic-attention-namespaced-rank`, outside this plan — if that has not
landed when this position runs, ship Units 2–3 and leave Unit 1 open.

### Position 9 · Bundle 5b — PR20, the `/align` charter and adversarial review

9 nodes. **`tactic-retire-assessor-contract-docs` rides here** by the 2026-08-29
ruling — it was in no bundle, and PR20 already rewrites the `/align` skill
surface its third unit edits. Its other two units retire
`.claude/docs/delegability.md`, `.claude/docs/signal-identification.md` and
their `ref-*` skills. Land it in the same PR: the shared file is
`.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.

The other 8 are a new `/align-review` skill plus `assemble-review-pack`,
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

Nothing here waits on the author — the two decisions that did were ruled
2026-08-29 and are recorded below as discharged. The three measurement runs
that remained were all taken on 2026-08-29; the only residue is the *quality
half* of `tactic-dispatch-observation-masking`, which needs `by_phase_outcome`
data the freeze empties and so waits for the staged resumption.

### Three measurement runs — TAKEN 2026-08-29

All three were run and recorded on their nodes. **The window the plan named was
wrong in every case, for one reason worth carrying forward.**

> **The freeze hides the thing being measured.** The pause sentinel is dated
> **2026-08-10**, so a `7d` window holds 2 sessions, no worker or subagent
> sessions, and every dispatch phase at 0 turns; a `14d` window has 899 sessions
> but they are almost all `align-tactics`, and `by_phase_outcome` is `{}` with
> `sidecar_present` **0 of 122** eligible workers. The envelope-emitting phases
> are exactly the ones the freeze stops. **A 30d window straddling the freeze
> (2026-07-30..2026-08-29 — 5032 sessions, 225896 turns, `sidecar_present` 431
> of 695) is the narrowest one that reads anything**, and is what was run.
> Any later re-measurement must clear the same bar, and any before/after
> comparison must hold window width constant across the freeze boundary.

| Node | Gates | Result |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` | PR7 | **Baseline recorded; the imported claim is not credited.** `hit_ratio` 0.9570, raw `cache_read:cache_creation` 22.30:1. The decisive figure is that `cache_creation` is **4.3%** of all context tokens (1150179672 of 26796114528) — an append-only layout can only convert creation into read, so **4.3% is the arithmetic ceiling**, against an imported claim of 41–80%. `creation_churn` is **0 churned of 401 staggered** across 86 node groups, so the mechanism is not firing either. This is the kill the node was built to make possible. **Threshold note:** "ratio rises 15%" is reachable on the raw ratio (22.30 → 25.65) and impossible on `hit_ratio` (0.9570 → 1.10) — keep the raw reading |
| `tactic-rsi-measure-fanout-and-model-routing` | PR11 | **Measured, and the dated reading is recorded on `strategy-recursive-self-improvement`.** Review: 68 sessions, 1266 subagents (18.6/session), 736 findings, 234 actionable (**31.8%**), 201 fixed — 6.3 launches and \$12.92 per fix. QA: 130 sessions, 440 subagents, 63 fixed — 7.0 launches and \$31.87 per fix. Routing: opus 42% of turns but **57% of spend**, a measured **1.91×** per-turn premium. **`price_proxy_usd` inverts that ranking** (sonnet 37827 above opus 31372) because the proxy holds price constant — PR11 must set per-lens `model:` from `cost_usd`, never the proxy |
| `tactic-dispatch-observation-masking` | PR7 | **Cost half taken; quality half still deferred, now confirmed by measurement.** `context_over_120k`: 1029 sessions, \$48262 proxy — align-tactics 327, `<none>` 158, qa-fix 143, review-fix 136. `payload_bytes.total` 329624854, Bash and Read together **97%**. The 2026-08-19 economics finding **hardens**: at 4.3% cache-creation share, ingest-time capping is cache-safe and retro-masking is not. The quality half needs `by_phase_outcome`, which the freeze empties — ship PR7 against the cost half, treat quality as a follow-up |

*The `context_lens` prose fix this section used to ask for was already applied on
2026-08-28. The three surviving mentions in the node all name what was corrected;
every asserting use already reads `lenses.context_over_120k`. Nothing to do.*

### The PR15 ref-split revisit — RULED 2026-08-29, no longer open

It was ruled early rather than at position 2: **PR15 splits**, shipping Units 0,
3 and 4 and not writing Units 1–2. See position 2 above, and §"Decisions already
taken" in the plan.

### `tactic-retire-assessor-contract-docs` — RULED 2026-08-29, now at position 9

`phase: implement`, `owner: ai`, three units: retire `.claude/docs/delegability.md`,
`.claude/docs/signal-identification.md` and their `ref-*` skills, plus
`.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.

It was in no bundle, so the sequence could have run to completion without anyone
noticing it — the same failure mode the four deferred A3 drafts had before they
became position 12. **Ruled: it rides position 9**, whose PR20 already rewrites
the `/align` skill surface it edits, so the two touch the same files and review
together. It is small, and the freeze means no worker will pick it up on its
own. This makes position 9 **9 nodes, not 8**.

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

## Batch execution authority — granted 2026-08-29

Four standing grants from the author, so the batch never stalls on an
approval it already has:

1. **Auto-merge on green.** The batch merges each PR to `main` once CI is
   green, strictly serial in position order, runs the closing batch, then
   starts the next position. No per-PR merge approval is needed.
2. **Graph and planning writes are pre-authorized.** Park clears whose ruling
   is already recorded, node closures the plan names, and planning-document
   updates are the batch's to make; the author's standing instruction is that
   the batch focuses on implementation and resolves graph/planning bookkeeping
   itself. The PR16 Unit 5 threshold write on
   `strategy-exercise-recovery-paths` is explicitly included (its content is
   fully determined by the reader-then-threshold ruling).
3. **Decompose-first for thin scopes.** For PR12 (whole Scope), PR10 Units 1,
   2 and 5, and PR5a / PR20 Units 1–2 (node-body scopes), the batch's first
   action is writing the unit decomposition into the plan document and
   committing it, then implementing from it — so the decomposition survives
   any subagent death and is reviewable.
4. **PR6's interrupt demonstration is satisfied by the accepted proxy**
   (ruling recorded in the PR6 section); Units 2–3 need no attended test.

## Parallelism, for a batch executor

The window is a serialized waterfall — **merges land one at a time, in position
order**, and only one post-merge closing batch runs at a time (concurrent
`graph-commit` invocations conflict-park the loser, and every closing batch
must re-cut its worktree from the just-moved `origin/main`). Within that,
*implementation* may overlap exactly where this file already says the order can
flex: PR2 and PR5–PR9 are mutually independent and may be built in parallel
worktrees, and Bundles 3 and 4 share no files. Do not overlap two PRs inside
the same bundle — bundles are grouped *by shared code surface*, so intra-bundle
parallelism recreates the conflicts the bundling exists to avoid. Everything
else stays serial; the six hard orderings above are load-bearing either way.

---

## Cross-PR dependency edges

Moved here from the plan on 2026-08-29, so ordering has one home. The six
constraints above are the ones that cannot flex; this is the full picture at PR
granularity.

```
PR1  graph read/write integrity (8)    ── ✅ SHIPPED fe0b1c4d (#3095), nodes closed
 │
 ├── PR18 durable-layer write fence    ── its blocked_by cleared WITH PR1 → ready
 ├── PR15 graph-commit simplification  ── same file as PR1; SPLIT: U0/U3/U4 only
 ├── PR16 node-mutation scripts (11)   ── needs PR1 U4 + U8
 ├── PR2  ladder driver
 ├── PR3  audit instrument ───────────┐
 ├── PR4  finding write surface ──────┤──┐
 ├── PR5  reconciler tick cost        │  │
 ├── PR6  code-review lock            │  │
 ├── PR7  review orchestration cost   │  │
 ├── PR8  config fail-closed          │  │
 └── PR9  worktree/session lifecycle  │  │
                                      │  │
        PR19 supersession repr.  ◄────┼──┘ (needs PR4's write surface)
        PR10 rsi trigger chain  ◄─────┘ (needs PR2 + PR3)
        PR11 lens catalog       ◄─────┘ (needs PR3)
        PR12 intervention core  ◄─────── (needs PR11 + PR4)
        PR14 rsi prioritization + research lane
        PR20 /align charter + adversarial review ── MUST precede PR13
        PR13 dispatch skill rename ── LAST, alone
        PR17 merge queue + scan cadence ── COLD; before the sentinel comes off
```

PR2 and PR5–PR9 are mutually independent and may run in any order or in
parallel. PR1 was the only universal prerequisite, and it has landed.

**PR18** was pinned behind PR1 by a real `blocked_by` edge — now cleared — and
sits ahead of everything else by argument: it is the fence the remaining ~100
node closures write through. **PR16** repairs the scripts every node closure in
this plan runs, so it is worth landing early despite depending on two PR1 units.
**PR19** is pinned behind PR4 by a real `blocked_by` edge:
`tactic-persist-greenfield-drops` is `blocked_by
tactic-finding-search-all-producers`, PR4's central node — the one write surface
every creation site routes through, and supersession edges are written *by* that
surface. **PR20** is pinned *ahead* of PR13 because PR13 renames the skill file
PR20 edits — the one hard ordering constraint whose violation is silent rather
than a merge conflict. **PR17 is cold**: nothing in it fires while the sentinel
holds, so it belongs immediately before the staged resumption.

The four `blocked_by` edges landed in `da1c3c7f` are honored:
`audit-threshold-table → trigger-threshold-gate → session-sweep-trigger →
ladder-per-phase-evaluation` is the internal unit order inside PR10;
`eval-finding-ledger → duplicate-finding-sensor` is the internal unit order
inside PR4; `audit-cache-efficiency-lens → dispatch-cache-preserving-context`
puts that experiment after PR3; `ladder-worker-unstamped-audit-blind →
align-tactics-worker-transcript-unscanned` is the internal unit order in PR3.

---

## What this sequence does not cover

- **Eight deferred nodes**, with reasons: the ref-split cluster — now five, not
  three (`tactic-graph-ref-split`, `-blocker-audit`, `-read-coherence`, plus
  `tactic-graph-commit-plumbing-default` and
  `tactic-graph-commit-direct-three-way-merge`, which joined it on 2026-08-29
  when PR15 split),
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
- **Five in-scope nodes that no PR closes — CLOSED 2026-08-29 by author
  disposition.** `tactic-review-sitting-code-review-lock-design`,
  `tactic-review-band-derivation-ratification`,
  `tactic-review-tradition-agentic-engineering`,
  `tactic-review-supersession-derived-subpoints` and
  `tactic-review-dispatch-charter-split`. Inside the 114; their sittings were
  held at the 2026-08-28 round, and on 2026-08-29 the author ruled to close
  all five on the held sittings (band-derivation ratified alongside the
  observable-(a) ruling, its (b)-half re-validation). Each closes in the
  schema's precedented no-diff shape: `phase: done`, `execution` stays null,
  and a frontmatter clarification citing its sitting and the 2026-08-29
  disposition is the completion record. Nothing in the
  sequence is undriven anymore.
- **Those two bullets are the whole surveyed-but-unassigned set — 13 nodes**,
  8 deferred plus 5 adjacent. This list used to end with a third bullet reading
  *"Eleven documented-but-unassigned tactics from the third coverage pass"*,
  which read as a third disjoint set and made the sequence look as though it
  left 24 nodes uncovered. It was the same eight-plus-five, counted again at its
  2026-08-18 value of 6+5.

---

## One caveat that applies to the whole sequence

The plan's `phase: null` re-verification **expired on 2026-08-20, in both
directions.** Inward: 45 of the 102 node ids in its `### Nodes closed` sections
are now `phase: implement` on `origin/main`, moved by `/align-tactics`
finalization rounds run after the plan was written. Nothing about the
assignments changed — but *"these nodes are not in the ladder"* is no longer
true of the phase field, **and the tick reads the phase field**. Outward: the
same filter is why the plan originally never saw the ~20 in-charter nodes at
`phase: implement` with no PR — since censused and routed by the plan's fourth
coverage pass (see §"Coverage" there); that population is settled, and this
caveat survives only as the reason the filter can go stale again.

Treat every `path:line` anchor in the plan as a hint, not an address —
including the anchors carried in node bodies, several of which had already
drifted when the plan was written.
