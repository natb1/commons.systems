# Dispatch + RSI serialized PR plan

**Written** 2026-08-14 · **Graph base** `da1c3c7f` (702 nodes)
**Covers** all 94 open (`phase: null`) tactics in the dispatch-ladder / RSI /
evaluation-machinery / **graph-plumbing** scope: defects, integrity issues,
token-efficiency findings, ledger entries, and the feature/design nodes that
resolve them.

> **Revision 6 widened the scope** from 72 to 94. The original enumeration was
> ledger-driven and caught every open `tactic-eval-finding-*` node, but missed
> 32 graph read/write nodes that never produced a ledger entry — including
> `tactic-graph-ref-split`, which is `phase: implement` and **replaces the write
> path PR1 hardens**. Read Revision 6 before executing anything.

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

*(Revision 6 revised this table: Bundle 1 grew, Bundle 1b and Bundle 7 are new.)*

| # | Bundle | Was | Nodes | Risk |
|---|---|---|---|---|
| **0** | **`graph-ref-split` decision** *(R6)* | — | 0 | no diff — settles Bundle 1's shape |
| **1** | **Graph read/write path** | PR1 | 9 | HOT — *silent* failure |
| **1b** | **Graph plumbing** *(R6)* | PR15 + PR16 | 11 | HOT — the closure toolchain |
| **2** | **Tick-path reconcilers and sweeps** | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT — runs every tick |
| **3** | **Dispatch runtime (cold)** | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD — realized at resumption |
| **4** | **Instrument + finding surface** | PR3 + PR4 | 15 | COLD |
| **5** | **RSI chain** | PR10 + PR11 + PR12 + PR14 | 10 | COLD |
| **6** | **Skill rename** | PR13 | 1 | last, alone |
| **7** | **Merge queue + scan cadence** *(R6)* | PR17 | 6 | COLD — before the sentinel comes off |
| — | *deferred* | PR8 U3 | 1 | see below |
| | *pre-PR sessions* | | 6 | no diff |
| | **total** | | **94** | + 10 documented-not-assigned *(R6)* |

**Bundle 1 stays alone even at 9 nodes.** Its failure mode is *silent*: a
dropped node edit when local `main` is ahead, a destroyed snapshot, an abandoned
write reported as a content failure — and supervision does not catch silent
failures. Every other bundle's closing bookkeeping runs through it, so it lands
first and gets verified by reading `git show origin/main:` rather than by
trusting a verdict line.

**Bundle 1b is separate from Bundle 1 on purpose.** Both touch `graph-commit`,
but Bundle 1 is correctness and Bundle 1b is simplification. Landing them
together means a regression in the writer cannot be bisected against a known-good
one — the same argument that keeps Bundle 1 alone. Bundle 1b is also the work
most exposed to the Bundle 0 decision: if `graph-ref-split` lands, PR15 Units
1–2 are subsumed rather than merely stale.

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
- ~~**PR9 Unit 8 stays first overall.**~~ **Superseded by R1: the diff is
  confirmed lost.** It no longer has a deadline and no longer leads the order.
  Re-implement Unit 4 from the scope text as ordinary work inside Bundle 3.
- **PR8 Unit 1 rises** — the pace-curve config is untracked and unrecoverable.
- **PR8 Unit 3 is deferred outright.** It replaces the pause sentinel with a
  config field — i.e. it rewrites the mechanism currently enforcing the freeze,
  while the freeze depends on it. Land it during a deliberate, attended
  un-pause, never mid-window.

### Recommended order

*(Revised by Revision 6. Step 0 is withdrawn — Revision 5 measured 0 mergeable
node-lane PRs — and replaced by the `graph-ref-split` decision.)*

```
0.  Bundle 0           graph-ref-split decision              (no diff, gates 1)
1.  Bundle 1           graph read/write path                 (HOT, silent)
2.  Bundle 1b          graph plumbing                        (HOT, toolchain)
3.  Bundle 2           tick-path reconcilers + sweeps        (HOT, live)
4.  Bundle 4           instrument + finding surface          (unblocks 5)
5.  Bundle 3           dispatch runtime                      (COLD, big)
6.  Bundle 5           RSI chain
7.  Bundle 6           skill rename                          (last, alone)
8.  Bundle 7           merge queue + scan cadence            (COLD, pre-resume)
--  staged resumption: sentinel off at max_concurrent_workers: 1, one node
--  deferred: PR8 Unit 3, during an attended un-pause
```

Bundles 3 and 4 can swap or overlap — they share no files. Bundle 4 before 3
only because Bundle 5 depends on it.

**Bundle 1b may be deferred but not skipped.** If the Bundle 0 decision defers
`graph-ref-split`, PR16 (the closure toolchain) is worth landing at position 2 as
shown; PR15 can slide later without cost since it is simplification, not
correctness. If the decision is to land ref-split, re-scope both before starting.

**Bundle 7 sits last deliberately, after the skill rename.** Everything in it is
dormant while the sentinel holds, and it must be in place before the staged
resumption — otherwise that resumption measures an unbounded scan cadence and a
silent merge veto instead of measuring the fleet. It is the only bundle whose
position is set by the resumption rather than by dependencies.

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

**A second stale-reference class:** node bodies name
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. That skill
**does not exist on `main`** — it was folded into `rsi-audit`. The live path is
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh`. Measured repo-wide at
**27 files**, not the six visible from this plan's node set — see R3.

**A third:** node bodies cite
`packages/intentionsutil/scripts/render-rsi-plan.ts`, which was built in #3065
and **deleted in #3074** — deliberately, under its own retirement node. Measured
at **13 files**, and one of them is a scope hole in an open node rather than
stale prose. See R4; it supersedes the reading that the graph is inconsistent.

**The general lesson for whoever executes this plan:** two skill consolidations
(#3074, and the `dispatch-token-audit` → `rsi-audit` fold) moved or deleted
surfaces that ~10 open node bodies still address, and several lens nodes were
satisfied without their nodes being closed. **Re-verify every anchor and every
"missing" claim against the working tree before implementing it.** Roughly a
third of the apparent work in this scope may already be done.

---

# Revision 3 — resolutions for the pre-flight flags

Five items were flagged before execution. Each is resolved below, with the
verification that was actually run. **Two findings changed materially once
checked**: the ephemeral diff is confirmed unrecoverable, and the
`render-rsi-plan.ts` drift is both larger than reported and, in one node, a
scope hole rather than a prose nit.

## R1 — The ephemeral Unit 4 diff: write it off, do not plan recovery

**Status: confirmed lost.** This was the deadline item; the deadline passed.

Verified, in order:

| Check | Result |
|---|---|
| `/home/n8/.claude/jobs/09888b78/tmp/` | **Gone** — job dir deleted |
| `find` for `*unit4*` / `*deferred*.patch` under `~/.claude`, `/tmp/claude-1000` | no matches |
| `git stash list` | empty |
| Branches matching `*unit4*` / `*deferred*` | none |
| `origin/tactic-attention-per-tier-boost-migration` history | 6 commits, **no Unit 4 commit and no revert** — the work was reverted from the working tree, never committed |
| `git fsck --dangling` blobs grepped for `BOOST_LEVEL_VALUES` / `legacyTierKey` | 6 dangling blobs, **0 hits** |

The 36,973-byte patch does not exist anywhere. Do not spend a session hunting
for it.

**What survives, and it is more than it sounds.** The finding node
`tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir` records the
Unit 4 *scope* precisely: validateGraph rule 22, the two legacy compat-branch
deletions in `validateAttention`, the now-unused `legacyTierKey`, and the
`kind-kind.md` field-doctrine prose. What was lost is the implementation labor
and the verification against a synthetic post-migration store — not the
knowledge of what to build. Re-implementation from the scope text is tractable.

**Resolution:**

1. Re-implement Unit 4 from the scope text as a normal unit of Bundle 3. It is
   not recovery work; it is ordinary work with an unusually good spec.
2. Amend the finding node to record the loss as realized rather than
   prospective — its body currently says "this is a live opportunity to preserve
   it, not a post-mortem", which is no longer true. Set
   `attributes.measured_impact` to reflect a realized loss so the ledger does
   not keep advertising a recovery route that does not exist.
3. Adopt the node's own option 1 as the standing fix, because it needs no new
   mechanism: **a deferred-but-finished unit is committed to its branch and then
   reverted**, so git history carries the diff permanently at zero cost. Option
   3 in the node body — fail the escalation loudly when its recommendation cites
   a path under `$CLAUDE_JOB_DIR` — is the enforcement half, and is cheap: it is
   a string check on the recommendation text at the point the park is written.

Both halves belong in Bundle 3 alongside the escalation path they guard.

## R2 — Four shipped audit nodes: verify-and-close, and fix the read path

**Status: stands as flagged.** Confirmed against the working tree.

**Resolution — run this as Bundle 4's *first* unit, before any implementation.**
For each of `tactic-audit-instrument-scoping`,
`tactic-audit-permission-friction`, `tactic-audit-cache-efficiency-lens`, and
`tactic-rsi-round-trips-lens-carrier`: read the node's success criteria against
the cited anchor, then close with `phase: done` and `execution.resolved_by` set
to the commit that actually shipped it — recoverable with `git log -S` on the
lens key rather than guessed.

Two residuals to **check rather than assume**, because they are the plausible
reason these nodes were never closed:

- `tactic-audit-permission-friction` has a `/fewer-permission-prompts` closing
  step that may be genuinely outstanding even though the lens ships.
- Whether every fleet-denominator lens carries the `fleet-only` tag; the
  vocabulary exists at `aggregate-usage.sh:1164,1463`.

Only `review_effort` / `effort_yield` and `rsi_lane` need code.

**Root-cause fix, and it is already in scope.** These nodes stayed open because
the ledger read path cannot see the write path — recorded as
`tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`.
Prioritize that unit inside Bundle 4; without it, the next four lenses will
drift open the same way.

## R3 — The `dispatch-token-audit` fold: 27 files, not 6

**Status: larger than flagged.** The count of six was scoped to this plan's node
set. Repo-wide, **27 files** cite the folded skill.

The skill does not exist; `.claude/skills/rsi-audit/` is the live home.

**Resolution:** a single mechanical sweep, one commit, folded into Bundle 4 so
the prose and the instrument anchors land together. Rewrite each occurrence to
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh`, then confirm
`validate-graph.ts` still reports zero unresolved prose refs.

One caveat that prevents a blind `sed`: some citations are legitimately
historical — `tactic-rsi-audit-skill-rename` is `phase: done` and is *about* the
fold, so its mentions are correct as written. Rewrite citations that present the
path as **live**; leave citations that narrate the rename as history.

## R4 — `render-rsi-plan.ts`: 13 files, and one is a scope hole

**Status: materially changed on inspection.** Two corrections to the flag.

**First: the graph is not inconsistent.** `tactic-rsi-plan-skill` is `phase:
done` and its deliverable was deleted — but the deletion has its own node,
`tactic-rsi-plan-render-retire`, also `phase: done`, whose statement is "Delete
rsi-plan.md, render-rsi-plan.ts and the render half of rsi.ts". The graph
records a built-then-deliberately-retired deliverable, which is a correct
history, not a bookkeeping error. **Do not reopen `tactic-rsi-plan-skill`** — my
earlier suggestion to annotate it is unnecessary. The explanation is already
there, one node away.

**Second, and this is the finding that matters:** of the 13 citing files, one
uses the deleted script to justify *not doing work*.
`tactic-rsi-lane-token-attribution.md:127` is `phase: null` — open, planned into
Bundle 5 — and its **Reuse** section reads:

> `render-rsi-plan.ts` already renders the workflow split; it needs no change
> once the buckets are populated.

An implementer following that plan would populate the `rsi_lane` buckets and
discover nothing renders them. That is a scope hole in an open node's plan, not
stale prose — the node is under-scoped by exactly one renderer. **Fix the node's
Scope, not just its citation**, and do it before Bundle 5 is planned.

The rest classify cleanly, and only the stale group needs edits:

| Class | Files | Action |
|---|---|---|
| Correctly historical — says "retired", or narrates the deletion | `.claude/skills/rsi-audit/SKILL.md:256`, `tactic-rsi-plan-render-retire`, `tactic-rsi-plan-skill`, `tactic-ladder-await-phase-only-completion-test:24`, `strategy-recursive-self-improvement:1181,1224` | **none** |
| Stale — presents the script as live | `strategy-recursive-self-improvement:165,186,381,409,549,1013,1079`, `tactic-attention-namespaced-rank:822,826`, `tactic-graph-read-at-ref-cli:16`, `tactic-rsi-audit-workflow-attribution:59`, `tactic-rsi-external-acceptance-gate:108`, `tactic-rsi-research-skill:59`, `tactic-rsi-skill:39` | rewrite past-tense or repoint |
| **Scope hole** | `tactic-rsi-lane-token-attribution:127` | **re-scope the node** |

`tactic-rsi-reprioritization-outcome-audit` is split: `:43` already notes the
deletion, but `:88` still says "All work is in
`packages/intentionsutil/scripts/render-rsi-plan.ts`". Pick a new home for the
reprioritization-outcome derivation — `/rsi-audit` absorbed the rest of
`/rsi-plan`, so it is the natural host — and implement it there as PR14 Unit 2.

**The generalizable defect, worth its own tactic:** a consolidation PR deleted a
script that four open nodes' plans depended on, and nothing forced a re-check of
the nodes citing it. Candidate rule: a PR that deletes a file must re-check open
nodes whose bodies cite that path. This is mechanically checkable — the same
prose-ref index `validate-graph.ts` already maintains would catch it.

## R5 — PR6 stays gated on its office-hours sitting

**Status: stands, and the gate is load-bearing.**

Keep the gate; do not let Bundle 3's code-review units start first. The sitting
`/office-hours tactic-review-sitting-code-review-lock-design` must resolve a
specific contradiction rather than merely bless the design: the flock shipped in
#3078, yet `tactic-eval-finding-detached-code-review-dies-with-launcher` shows
the detached child dies with its launcher anyway despite `setsid`. That
falsifies the lock's premise — **a lock held by a process that dies with its
launcher is not a lock**, and the current design is held on trust.

**Resolution:** sequence the units so detachment is fixed and *demonstrated*
before the lock is trusted. Fix detachment (Unit 1), show a detached review
surviving its launcher's exit, and only then build on the lock (Unit 2).

A useful framing to hand the sitting: ask whether the lock should be held by the
detached child at all, or by a supervisor that outlives both. If the answer is
the supervisor, Unit 2 changes shape entirely — which is exactly why the sitting
must precede the code.

---

# Revision 4 — what must run before the *first* PR

**Added 2026-08-14.** The "Pre-PR sessions" table above lists each no-diff
session against the PR it gates. Asked directly which of them gate the **first**
PR, the answer is: **none of them.** Bundle 1 is PR1, whose Dependencies section
reads "None. This is the root PR." The earliest-gated PR in the table is PR6,
which sits inside Bundle 3 — fourth in the recommended order.

That is the literal answer, and it is incomplete. Four sessions should run
before Bundle 1 anyway — one because the freeze depends on it, three because the
table schedules them too late to be comparable.

## S1 — Park the open node-lane nodes (required, if the freeze is real)

Not in the table because it closes no node. It is the only thing standing
between "scheduled dispatch is paused" and "`main` does not move under these
PRs". Per Revision 2, the sentinel gates worker spawning; an `office_hours`
park is the one state `graph-auto-merge` will not merge past.

## S2–S4 — The three `/rsi-audit` baselines, moved forward

The table gates these on PR7 and PR11. Both come **after** Bundle 4 in the
recommended order (Bundle 4 is 3rd; PR7 is inside Bundle 3, 4th; PR11 is inside
Bundle 5, 5th). Bundle 4 contains PR3, which rewrites
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh` — the instrument all three
baselines read. A baseline taken after PR3 and compared against a later
measurement is measuring the instrument as much as the system.

Take all three now, while the instrument is stable. They produce no diff, so
they cost nothing but session time, and this is the only window in which the
before-and-after readings share a definition.

**Correct the window while moving them.** The table says `7d` and `14d`. The
sentinel was set 2026-08-10 11:51; as of 2026-08-14 a `7d` window is 4 of 7 days
paused, so the fleet denominators are diluted by a period with almost no worker
activity. Use a window reaching back before 2026-08-10 — `21d` for the two
filed as `7d` — and state the window on the node alongside the number.

## Revised pre-first-PR list

| # | Session | Why before PR1 |
|---|---|---|
| S1 | park open node-lane nodes | the sentinel does not freeze `main` |
| S2 | `/rsi-audit` — masking baseline | PR3 rewrites the instrument |
| S3 | `/rsi-audit` — `hit_ratio` baseline | PR3 rewrites the instrument |
| S4 | `/rsi-audit` — fan-out and model routing | PR3 rewrites the instrument |

The two `/office-hours` sittings measure nothing and stay where the table puts
them: `review-sitting-code-review-lock-design` before PR6 (Bundle 3), and
`review-band-derivation-ratification` / `review-tradition-agentic-engineering`
before PR10 / PR11 (Bundle 5).

## Caveat for every node write in S1–S4

All four sessions write graph nodes, and they run **before** PR1 fixes the write
path. They are therefore exposed to the exact bug PR1 Unit 1 closes: with any
unpushed local commit on `main`, an edit to an existing node can be dropped
while the verdict reads `landed context=noop`. Verify each write by reading
`git show origin/main:intentions/<id>.md`, never by trusting the verdict line.

---

# Revision 5 — both pre-PR items were wrong; the real one is data expiry

**Added 2026-08-14, after the author challenged S1 and S2–S4.** Both challenges
land. Measured rather than argued, the pre-first-PR list is neither "park the
node lane" nor "take three baselines".

## S1 is withdrawn — the drain has nothing to drain

`graph-auto-merge` says in its own header that it is **the only code that merges
a node-lane PR**, and its candidate set is: a graph-native tactic at
`phase: review`, carrying `execution.pr`, carrying the `reviewed` marker in
`execution.markers`, with no in-flight `execution.conflict` and `office_hours`
null.

Counted against `origin/main` on 2026-08-14:

| State | Count |
|---|---|
| `phase: review` with a PR, **mergeable now** | **0** |
| parked (`office_hours` set — held) | 2 |
| review-in-progress / conflicted (no `reviewed` marker) | 2 |

And there is no path from that state to a merge while the sentinel holds. The
`reviewed` marker is written by a review session; review sessions run only from
a spawned worker; the sentinel gates spawning. Ad-hoc PRs do not enter the
review phase, do not alter checks on existing PRs, and do not unpark nodes.

The one route worth checking was the pre-PR office-hours sittings themselves,
since clearing a park is exactly what they do — but **neither parked node
carries the `reviewed` marker** (`tactic-clarification-citation-ids`,
`tactic-office-hours-snapshot-wire-contract`). Unparking either returns it to
review-in-progress, which still needs a worker.

Revision 2's statement that the drain runs on every paused tick remains true.
What was wrong is the inference from it: the mechanism is live, the inventory is
empty. **Replace the parking session with a standing check** — re-run the
candidate count before each bundle, and park only if it is ever non-zero.

The residual is real but minor: sweeps and reconcilers still write node
*metadata* to `main`. That surfaces as a `graph-commit` CAS refusal (exit 1,
visible, re-runnable), not as unreviewed code landing under a PR.

## S2–S4 are withdrawn as scheduled, and replaced by an archive

The argument for moving them forward — "PR3 rewrites the instrument, so measure
while it is stable" — is weak. `aggregate-usage.sh` is versioned in git and
takes `--since` / `--until`, so any historical window can be recomputed later
with **any** instrument version: `git show <sha>:.claude/skills/rsi-audit/
scripts/aggregate-usage.sh` into a temp file, and point it at the data with
`DISPATCH_AUDIT_PROJECTS_ROOT` (the override its own test fixture uses,
`aggregate-usage.sh:49,187`). Replaying the pre-PR3 instrument against
post-resumption data is the apples-to-apples pair, and it is available at any
time.

The author's objection also stands on its own: the *after* reading needs
post-resumption fleet activity, so it cannot exist until well after resumption
no matter when the *before* reading is taken. Nothing about running the audits
early fixes that.

**The constraint that is real, and that neither of us had named, is retention.**
`aggregate-usage.sh` reads `$HOME/.claude/projects/**/*.jsonl` and selects its
window by **file mtime** (`find -newermt "$SINCE" ! -newermt "$UNTIL"`,
`:1459`). No `cleanupPeriodDays` is configured in either settings file, so
Claude Code's default retention applies — and the disk agrees: on 2026-08-14 the
oldest surviving transcript is dated **2026-07-14**, exactly 31 days back, with
nothing older. Pre-pause fleet history is being deleted at a day per day.

6,209 pre-pause transcripts survive today; on current behavior none survive 30
days from now, and a serialized window plus a 21-day post-resumption measurement
window will comfortably exceed that. That looked like it inverted the urgency —
the baselines are not perishable, the raw data is — and it prompted a proposal
to archive the tree. **That proposal is withdrawn in the subsection below**: the
expiring data is a record of a broken ladder, so preserving it buys nothing.

### The archive was proposed and is also withdrawn: the baseline is forward

Preserving the pre-pause transcripts only matters if a pre-pause measurement is
worth having, and it is not. **The ladder was not working during that period** —
these PRs close roughly seventy findings observed in exactly that window, in
combinations that varied day to day. A comparison between a broken before and a
fixed after is confounded past the point of use, so no amount of retained data
buys a usable baseline.

The right baseline is **forward**, and the plan already specifies where it comes
from: the staged resumption (sentinel off at `max_concurrent_workers: 1`, one
node through the full ladder). That is the first trustworthy fleet data this
repo will have, and it does not exist yet, so nothing about a working ladder can
be measured before the window.

Two of the three nodes do not need fleet data at all, which moves them rather
than blocking them:

| Node | Needs a working fleet? | When |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` (`hit_ratio`) | no — a property of how sessions are constructed | during the window, on the ad-hoc sessions themselves |
| `tactic-rsi-measure-fanout-and-model-routing` | no — a property of this harness's routing | during the window, on the ad-hoc sessions themselves |
| `tactic-dispatch-observation-masking` | yes — fleet-shaped | at the staged resumption |

The residual value of old transcripts is forensic rather than statistical, and
it is small: across the whole graph, 30 nodes cite a session UUID as evidence,
covering 23 distinct sessions. Three of those transcripts are already gone
(`tactic-plan-view-hot-lineage-panel`, `tactic-plan-view-table`,
`tactic-test-decision-log-prod-leak`) and **none of the three is in this plan's
scope**. So the ongoing expiry is not currently destroying evidence this work
depends on.

**Conclusion: no archive, no history older than the default retention, and no
measurement session before Bundle 1.**

The one retention change still worth making points forward, not back: raise
`cleanupPeriodDays` past the window plus the post-resumption measurement period,
so that the ad-hoc sessions' own transcripts and the staged-resumption data
survive until PR7 and PR11 read them. If the window runs longer than the default
retention, the data those PRs actually need expires before they measure it.

## Net effect on the pre-first-PR list

| Was | Now |
|---|---|
| S1 park the node lane | **withdrawn** — 0 mergeable, no path to non-zero while paused; keep as a pre-bundle check |
| S2–S4 `/rsi-audit` baselines | **withdrawn** — no pre-pause baseline is usable; two move into the window, one moves to the staged resumption |
| — | raise `cleanupPeriodDays` so *forward* data survives until PR7/PR11 read it |

**Nothing blocks Bundle 1.** The pre-first-PR list is empty.

*(Superseded on one item by Revision 6 below — the `graph-ref-split` decision
returns to this list.)*

---

# Revision 6 — the graph-plumbing gap

Triggered by the question *"are there any nodes that address graph reading or
writing integrity or efficiency that are not part of this plan?"* There are 32.

## What the enumeration missed, and why

The sweep that produced this plan was **ledger-driven**: it enumerated dispatch
and RSI findings, which in this graph means `tactic-eval-finding-*` nodes plus
the design nodes that resolve them. Measured against the graph, that sweep was
complete on its own terms — **every open `tactic-eval-finding-*` node is in this
plan; zero were missed.**

But the boundary it drew is narrower than the subsystem. Counting open
(`phase: null`) nodes serving a graph strategy (`strategy-graph-native-dispatch`,
`strategy-graph-integrity`, `strategy-graph-drives-dispatch`,
`strategy-graph-self-description`):

| | Count |
|---|---|
| In this plan | 38 |
| **Not in this plan** | **149** |

Most of that 149 is unrelated feature work. Filtering to nodes whose
**statement** names a graph read or write path — `graph-commit`, `dump-node.ts`,
`write-node.ts`, `validate-graph.ts`, `read-sensors.ts`, `park-node`,
`clear-park`, `transition-node`, `graph-auto-merge`, `store.ts`, `schema.ts` —
leaves **32**, none of them in the plan.

These are not new. Creation dates span **2026-07-12 to 2026-08-14**, so this is
a coverage gap, not a timing artifact of nodes written after the plan.

It matters because PR1's own Context is the argument for it: *"Every other PR in
this plan writes graph nodes to close its own tactics."* That sentence justifies
PR1 existing. It justifies these 32 equally — they sit on the same path, and
three of them lose data on it.

## The discriminator: hot during the window, cold until resumption

Revision 2 established that a paused fleet makes most ladder machinery cold. The
same test sorts these, and it is the right test here because **the ad-hoc window
drives every graph write by hand through exactly the hot set**:

- **Hot** — the path an ad-hoc supervised session uses to close its own nodes:
  `graph-commit`, the graph reads, the node-mutation scripts. All ~94 node
  closures this plan prescribes run through it.
- **Cold** — the path only an autonomous fleet uses: `graph-auto-merge`'s merge
  queue, `dispatch-fleet-watch`'s alert cadence, `/qa-main`'s node lane. Dormant
  while the sentinel holds.

Hot defects are load-bearing for this window. Cold defects are load-bearing for
the staged resumption.

## One item returns to the pre-first-PR list

Revision 5 concluded the pre-first-PR list is empty. That was correct on the
evidence then available. It is now wrong on one item.

**`tactic-graph-ref-split`** — `status: codified`, **`phase: implement`**, 37
blockers — is the only in-flight node in the set, and appears nowhere in this
plan:

> Greenfield: the intention graph lands on a dedicated graph-main branch
> validated by the write path alone (no CI stamp) — graph-commit becomes
> plumbing-based CAS push against origin/graph-main, replacing the
> CI-stamp/scratch-branch mechanic and the busy-main exhaustion it causes.

**It replaces the write path PR1 hardens.** PR1's Units 1–4 and PR15 below all
repair the CI-stamp/scratch-branch mechanic that ref-split deletes.

Its companion node was created **2026-08-14** and asks exactly the question a
freeze forces:

> `tactic-graph-refsplit-blocker-audit` — Determine whether
> tactic-graph-ref-split's 37 blockers encode real dependencies or a quiescence
> requirement that never converges — and if the latter, what makes its cutover
> incremental instead of one-sitting.

**A development freeze is precisely such a quiescence.** This window is the most
favorable condition ref-split will ever get, and simultaneously the window whose
PRs it would invalidate. Decide before Bundle 1, not during it:

| Decision | Consequence for this plan |
|---|---|
| **Ref-split lands first** | PR1 Units 1–4 and PR15 are largely moot; re-scope both against the CAS-push write path before writing code |
| **Ref-split deferred past the window** | Plan proceeds as written; `tactic-graph-refsplit-read-coherence` stays parked with it |
| **The 37 blockers are not real** | The audit's own finding — likely the largest single simplification available, and it reorders the bundles |

This is a **decision session, not an implementation session**. Note that
`/office-hours <node-id>` runs the graph-native lane over a *parked* node, and
`tactic-graph-refsplit-blocker-audit` carries `office_hours: null` — park it with
`park-node` first to use that lane, or run it as a plain ad-hoc analysis session.
The prompt is in `plans/dispatch-rsi-pre-pr-sessions.md` as session 0.

## New coverage

22 of the 32 are assigned to PRs; 10 are documented and deliberately unassigned.

| Where | Nodes | Why there |
|---|---|---|
| **PR1** (4 → 9) | +5 | data loss, abandoned writes, false parks, and the read-path root cause — hot, and every other PR depends on it |
| **PR15** (new) | 4 | `graph-commit` structural simplification — hot but not correctness; gated on the ref-split decision |
| **PR16** (new) | 7 | node-mutation scripts and schema validation — hot; the scripts every node closure runs |
| **PR17** (new) | 6 | merge queue and scan cadence — **cold**; run before the staged resumption, not during the window |
| deferred | 5 | the ref-split cluster (3) and scope-custody features (2) |
| adjacent, not claimed | 5 | see below |

**Deferred, with reasons:**

- `tactic-graph-ref-split` — the decision above; not an implementation item here.
- `tactic-graph-refsplit-blocker-audit` — *is* the decision session; no diff.
- `tactic-graph-refsplit-read-coherence` — conditional on ref-split landing;
  meaningless otherwise.
- `tactic-node-scope-files-overlap-gate` — a selector feature gating co-dispatch;
  needs a running fleet to exercise. Resumption work.
- `tactic-scope-stamp-in-graph` — `office_hours`-parked. Unpark before planning.

**Adjacent, surveyed and deliberately not claimed:**
`tactic-qa-main-node-terminal-declaration`, `tactic-invalid-state-rc-f1c843b1`,
`tactic-invalid-state-rc-fa3075ec` — all three are `/qa-main` node-lane paths
that write job-dir markers instead of graph state. Genuine write-integrity
defects, but `/qa-main` does not run while the sentinel holds, and they overlap
PR12's four-lane surface. Also `tactic-session-reap-authorization-durability` and
`tactic-park-cause-sensor-instrument` — both need a running fleet.

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
DECISION  graph-ref-split: land, defer, or dissolve the 37 blockers   (R6)
 │        ── settles the SHAPE of PR1 and PR15; no code
 ▼
PR1  graph read/write integrity (9)    ── unblocks everything (all node writes)
 ├── PR15 graph-commit simplification  ── same file as PR1; after it
 ├── PR16 node-mutation scripts        ── needs PR1 U4 + U8
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
        PR17 merge queue + scan cadence ── COLD; before the sentinel comes off
        PR13 dispatch skill rename ── LAST, alone
```

PR2 and PR5–PR9 are mutually independent and may run in any order or in
parallel once PR1 lands. PR1 is the only universal prerequisite.

**The three PRs Revision 6 added** slot in as follows. **PR15** edits the same
file as PR1 and must follow it, and is the PR most exposed to the ref-split
decision — do not start it before that decision. **PR16** repairs the scripts
every node closure in this plan runs, so it is worth landing early despite
depending on two PR1 units. **PR17 is cold**: nothing in it fires while the
sentinel holds, so it belongs immediately **before the staged resumption**, not
in the window — a resumption run against an unbounded scan cadence and a silent
merge veto measures the defects rather than the fleet.

The four `blocked_by` edges landed in `da1c3c7f` are honored:
`audit-threshold-table → trigger-threshold-gate → session-sweep-trigger →
ladder-per-phase-evaluation` is the internal unit order inside PR10;
`eval-finding-ledger → duplicate-finding-sensor` is the internal unit order
inside PR4; `audit-cache-efficiency-lens → dispatch-cache-preserving-context`
puts that experiment after PR3; `ladder-worker-unstamped-audit-blind →
align-tactics-worker-transcript-unscanned` is the internal unit order in PR3.

---

## Pre-PR sessions (no diff)

Seven sessions produce no code. Each is listed against the PR it gates, with the
prompt that starts it. **Run these before opening the PR they gate.** The full
prompts and merge prerequisites live in `plans/dispatch-rsi-pre-pr-sessions.md`.

> Six of these sessions' nodes are counted in the 94. Session 0's node,
> `tactic-graph-refsplit-blocker-audit`, is counted instead among Revision 6's
> 10 documented-not-assigned, because it is the ref-split cluster's decision
> step rather than in-scope work of its own.

| Run before | Node | Session prompt |
|---|---|---|
| **PR1** *(R6)* | `tactic-graph-refsplit-blocker-audit` | ad-hoc decision session — land, defer, or dissolve `tactic-graph-ref-split`'s 37 blockers. See `plans/dispatch-rsi-pre-pr-sessions.md` §0 |
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

Every other PR in this plan writes graph nodes to close its own tactics. Nine
open findings say that write path can silently lose an edit, can destroy the
writer's own content, can abandon a write on a GitHub reporting artifact, can
turn a transient `npx` failure into a fleet-wide park storm, can be blocked
repo-wide by an unrelated node, and cannot express a forward reference — and
that the **read** path can report a vacuous pass against the wrong tree. Fixing
them first makes every subsequent PR's bookkeeping trustworthy.

> **Gated on the ref-split decision** (Revision 6). If
> `tactic-graph-ref-split` lands first, Units 1–4 target a mechanic it deletes.
> Settle that before writing code here.

### Nodes closed (9)

- `tactic-eval-finding-noop-verdict-hides-dropped-node-edit`
- `tactic-eval-finding-sensor-validator-red-main-blocks-all-graph-writes`
- `tactic-eval-finding-eval-finding-forward-crossref-fails-ci`
- `tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening`
- `tactic-graph-commit-orphan-refusal-misattributed-content-failure` *(R6)*
- `tactic-graph-commit-snap-dir-merge-clobbers-original` *(R6)*
- `tactic-graph-commit-merge-npx-park-storm` *(R6)*
- `tactic-explicit-ref-graph-reads` *(R6)*
- `tactic-demote-node-stale-local-read` *(R6)*

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

**Unit 5 — an ORPHANED check row is misreported as a content failure, and the
write is abandoned.** `packages/intentionsutil/scripts/graph-commit:1830-1837`
(verified). `await_checks()` returns rc `2` for two different situations that
its own header comment already distinguishes: a required check that **concluded
non-success** (deterministic — the content fails CI, do not retry) and a
required check that is **ORPHANED** — no conclusion, parent check suite already
finished, so no verdict will ever arrive. Collapsing them means a GitHub
reporting artifact reaches the operator as *"the commit content fails CI; not
retrying (fix the content and re-run)"* — the one remedy that cannot work —
while the remedy that does work (re-push, which mints a fresh check suite) is
never attempted and **the graph write is abandoned**.

Fix: split rc `2` into content-failure and orphaned-suite, and route the
orphaned case to a bounded re-push rather than a refusal. The two conditions are
already kept separate at the query layer (`:1888`, the `.check_suite.id` fourth
field resolved via `check_suite_concluded()`); only the return code collapses
them. Out of scope: the #2457 populated-conclusion-behind-stale-status desync,
which is a third case and already handled.

**Unit 6 — the merge path destroys the writer's own pre-merge content.**
`packages/intentionsutil/scripts/graph-commit:793` (in `check_base_freshness()`)
and `:1203-1206` (in `replay_snapshot_onto_base()`) (verified). Both write
`run_merge_node`'s output over `SNAP_DIR/<id>.md`, which held the writer's
original unlanded content. On a later park for a **different** id in the same
multi-id batch, `park_write()`'s recovery text points the human at
`SNAP_DIR/<id>.md` claiming it holds their unlanded content, when it now holds
graph-commit's own already-landed merge result.

Fix: write merge output to a distinct path and leave `SNAP_DIR/<id>.md`
immutable for the life of the run, so the park recovery text stays true. This is
the highest-severity item in the PR: it is silent, it destroys author content,
and the recovery instructions actively mislead.

**Unit 7 — a transient `npx` failure becomes a fleet-wide park storm.**
`packages/intentionsutil/scripts/graph-commit:995` (verified) — `run_merge_node()`
shells out to `npx tsx "$MERGE_NODE_SCRIPT"`, and far-ahead replay now routes
**every** divergent node through it. When `npx` cannot run at all (sandbox
`EROFS`, cold cache, registry outage) the crash is indistinguishable from an
unresolvable divergence, so each node is pushed to `main` as an `office_hours`
park instead of failing with a clear environment error.

Fix: distinguish "the merger ran and could not resolve" from "the merger could
not start". Only the former is a park; the latter is an environment error that
dies loudly (`.claude/rules/code-style.md` — clear errors over defensive
fallbacks). Note the same doomed-spawn shape is already called out in a comment
at `:764`.

**Unit 8 — graph reads resolve their tree from cwd or script location, so a
wrong-directory invocation reports a vacuous pass.** Four readers disagree,
all verified:

| Reader | Roots from | Anchor |
|---|---|---|
| `dump-node.ts` | script location (`import.meta.url`) | `:38` |
| `write-node.ts` | script location (`import.meta.url`) | `:21` |
| `validate-graph.ts` | **cwd**, defaulting to `"intentions"` | `:73` |
| `demote-node-to-implement` | script location (`SCRIPT_DIR/../../..`) | `:53` |
| `graph-commit` | `-C` flag, else **cwd** | `:406` region |

So a read or verify invoked from the wrong directory silently targets the wrong
tree, and `validate-graph.ts` in particular can report a **vacuous pass** —
against a directory that does not exist or is not the graph. This is the general
form of the read-path defect this plan already carries one symptom of
(`tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`, PR4).

Fix: make the tree/ref an **explicit required argument** on every read, with no
cwd or script-location default. Additionally give `demote-node-to-implement` an
`origin/main` refresh before it reads (it already fetches at `:69` but reads its
own checkout). Out of scope: changing what any reader does once it has the right
tree.

> Both nodes here — `tactic-explicit-ref-graph-reads` and
> `tactic-demote-node-stale-local-read` — describe this same defect, one in
> general terms and one naming the specific readers. They are closed together by
> one unit deliberately; do not plan them as two.

### Dependencies

None in code — this is the root PR.

**One decision precedes it:** the `tactic-graph-ref-split` question in Revision
6. Units 1–4 repair the CI-stamp/scratch-branch write mechanic that ref-split
replaces with a CAS push against `origin/graph-main`. Units 5–8 survive either
way (Unit 5's check handling, Unit 6's snapshot immutability, Unit 7's merger
error class, and Unit 8's read-path explicitness are all independent of which
ref the graph lands on).

### Reuse

- `isPlainObject`, `validateNode` — `packages/intentionsutil/src/schema.ts`.
- Existing fixture-graph builders in `packages/intentionsutil/test/` (`anode()`
  at `office-hours.test.ts:54` builds a full `IntentionNode` fixture).
- `check_suite_concluded()` — `graph-commit`, already resolves the orphaned-suite
  condition Unit 5 needs; the information is present, only the return code
  collapses it.
- `test-park-node.sh` and the other `packages/intentionsutil/test/test-*.sh`
  shell harnesses — the pattern for Units 5–8's script-level coverage.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual, one per unit — none of these is covered by the suites above:

- **Unit 1** — with a deliberately unpushed local commit on `main`, run a
  `graph-commit` that edits an existing node; confirm the verdict is not
  `landed context=noop` and the edit is present at `origin/main`.
- **Unit 5** — cannot be provoked on demand (it needs GitHub to orphan a check
  row). Verify by unit-testing the rc mapping directly: assert that a concluded
  non-success and an orphaned suite produce **different** return codes, and that
  the orphaned path attempts a re-push.
- **Unit 6** — run a multi-id batch where one id merges cleanly and a second
  parks. Confirm `SNAP_DIR/<first-id>.md` still holds the writer's pre-merge
  content, byte-for-byte, after the run, and that the park recovery text names a
  file whose contents match what the writer intended to land.
- **Unit 7** — force the failure with `PATH` stripped of `npx` (or
  `MERGE_NODE_SCRIPT` pointed at a nonexistent file) on a divergent node.
  Confirm the run dies with an environment error and that **no** `office_hours`
  park reaches `origin/main`.
- **Unit 8** — run `validate-graph.ts` from a directory with no `intentions/`
  and confirm it now fails with a clear error instead of passing vacuously.

### Closing the nodes

After merge, for each of the 9 ids set `phase: done` and
`execution.resolved_by: <merge sha>` via `dump-node.ts` → jq → `write-node.ts`
→ `graph-commit -C <path>`.

> Close `tactic-explicit-ref-graph-reads` and
> `tactic-demote-node-stale-local-read` in the **same** batch — Unit 8 satisfies
> both, and closing one alone leaves a duplicate open against a fixed defect.

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

**Unit 8 — re-implement the lost deferred unit, and close the hole that lost
it.** ~~Recover the stranded diff.~~ **The diff is gone — see R1 for the six
checks that established it** (job dir deleted, no stash, no branch, no Unit 4
commit or revert in `origin/tactic-attention-per-tier-boost-migration`, and zero
hits across all 6 dangling blobs). Do not hunt for it.

Three parts, none time-critical:

1. Re-implement Unit 4 from the scope preserved on
   `tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir`:
   validateGraph rule 22, the two legacy compat-branch deletions in
   `validateAttention`, the now-unused `legacyTierKey`, and the `kind-kind.md`
   field-doctrine prose.
2. Make deferred-but-finished work durable by default: commit it to the branch,
   then revert it, so git history carries the diff permanently. No new mechanism.
3. Reject an escalation whose recommendation cites a path under
   `$CLAUDE_JOB_DIR` — a string check where the park is written.

### Dependencies

PR1.

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

# PR15 — `graph-commit` structural simplification *(added by R6)*

**Recommended model: opus** — restructures the writer whose failure mode is
silent data loss, on the same file PR1 edits.

### Context

PR1 fixes what `graph-commit` gets *wrong*. This PR removes machinery it does
not need: a `worktree` writer default that lets unrelated dirt in any checkout
block a graph write, a rebase that exists only to manufacture a conflict for a
merger that is already git-independent, a no-op short-circuit too narrow to fire
when it should, and an invocation shape the auto-mode classifier false-denies.

None of these is a correctness defect, so none is in PR1. All four are on the
**hot** path — the writer every node closure in this plan runs.

> **Gated on the ref-split decision** (Revision 6), harder than PR1 is. If
> `tactic-graph-ref-split` lands, `graph-commit` becomes a plumbing-based CAS
> push and Units 1–2 here are subsumed by that work rather than merely stale.
> **Do not start this PR before that decision.**

### Nodes closed (4)

- `tactic-graph-commit-plumbing-default`
- `tactic-graph-commit-direct-three-way-merge`
- `tactic-graph-commit-invocation-classifier-bypass`
- `tactic-graph-commit-noop-shortcircuit-head-behind`

### Scope

**Unit 1 — flip the writer default to plumbing.**
`packages/intentionsutil/scripts/graph-commit:406` (verified) —
`GRAPH_COMMIT_WRITER="${GRAPH_COMMIT_WRITER:-worktree}"`. Flip the default to
`plumbing` for every caller and delete the then-inert dirty-tree pre-flight
guard, so unrelated dirt in any checkout can neither block nor corrupt a graph
write. A comment at `:875` already notes the guard is "a no-op whenever
`GRAPH_COMMIT_WRITER` is left at its `worktree` default" — that dependency
inverts once this lands, so read it before deleting.

**Unit 2 — replace the rebase with a direct three-way merge.** The rebase exists
**only to produce a conflict** that layer 2 then unwinds in order to call
`merge-node.ts` — a merger that already takes `--base`/`--ours`/`--theirs` as
plain paths and is git-independent (`run_merge_node()`, `graph-commit:989-995`,
verified). Call the merger directly and delete the conflict-production path.

Sequencing is fixed by the node's own rationale: this is *"the remaining
structural simplification once the plumbing default lands"*. **Unit 1 before
Unit 2, in this PR.**

**Unit 3 — shape the invocation to the `allowedTools` matcher.** Give
`graph-commit` a form the matcher can prefix-match (a `-C` flag, no `cd`
compound) and add it to `permissions.allow`, so the auto-mode classifier never
false-denies the sole main-landing graph-write path. See
`.claude/rules/sandbox.md` — "Command pattern matching" — for the matcher's
known failure shapes; `graph-commit` is already called out there as the
exception that *requires* `-C`.

**Unit 4 — widen the no-op short-circuit.**
`packages/intentionsutil/scripts/graph-commit:2077` and `:3643-3659` (verified).
The short-circuit fires only on strict `HEAD == origin/main` SHA equality, so a
checkout strictly **behind** `origin/main` with nothing staged still runs the
full landing cycle — holding the landing lock for no benefit even though content
parity is already proven. Fix: short-circuit on proven content parity, not SHA
identity. The `:2066` comment records that the current scoping is deliberate;
preserve the reason it gives while widening the condition.

### Dependencies

**PR1** — same file, and PR1's units are correctness fixes that should land
first so a regression here is bisectable against a known-good writer.

Plus the ref-split decision, above.

### Reuse

- `run_merge_node()` — `graph-commit:989`. Unit 2 calls it directly rather than
  through a manufactured conflict.
- `.claude/rules/sandbox.md` "Command pattern matching" — the matcher rules Unit
  3 must satisfy.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: with a deliberately dirty unrelated file in the checkout, run a
`graph-commit` and confirm it lands (Unit 1). From a checkout reset one commit
behind `origin/main` with nothing staged, confirm the run short-circuits without
taking the landing lock (Unit 4). Confirm the `graph-commit` invocation is
auto-approved rather than prompting (Unit 3).

### Closing the nodes

After merge, for each of the 4 ids set `phase: done` and
`execution.resolved_by: <merge sha>`.

---

# PR16 — Node-mutation scripts and schema validation *(added by R6)*

**Recommended model: sonnet** — mostly mechanical: one extraction, one ordering
fix, two test-harness improvements, one arg-parser, one schema tightening. Unit
6's data backfill is the only part needing care.

### Context

These are the scripts an ad-hoc session runs to close a node: `park-node`,
`clear-park`, `transition-node`, `read-sensors.ts`, and the validator behind
them. One of them silently discards an uncommitted body edit; one pair carries
duplicated `--base` logic that has already drifted once; one accepts any
argument and then writes unconditionally.

**Hot** — this PR repairs the tools this plan's own bookkeeping depends on.

### Nodes closed (7)

- `tactic-transition-node-needs-main-residue-clobbered`
- `tactic-park-node-clear-park-base-pin-dedup`
- `tactic-read-sensors-arg-rejection-check-mode`
- `tactic-attributes-phase-squatter-retire`
- `tactic-orphaned-delegation-records-reading`
- `tactic-transition-node-scope-stale-test-coverage`
- `tactic-test-park-node-deps-precondition-guard`

### Scope

**Unit 1 — `transition-node` clobbers an uncommitted body edit before reading
it.** `transition-node`'s unconditional `origin/main` refresh of
`intentions/<id>.md` overwrites a working-tree body edit before it is ever read,
so `/qa-fix`'s `## needs-main residue` append never reaches `origin/main` and the
`review → main-qa` routing it exists to drive never fires. Fix: read the working
tree first, or refuse to refresh over an uncommitted edit rather than discarding
it (`.claude/rules/code-style.md` — clear errors over silent fallbacks).

*(Anchor from node body — re-locate. `demote-node-to-implement:217` shows the
same `git show origin/main:… > file` shape and is the closest verified analogue.)*

**Unit 2 — extract the duplicated `--base` pin resolution.** `park-node` and
`clear-park` carry byte-identical `--base` pin-resolution blocks — manifest-file
branch, `<id>=<sha>` pair branch, bare-sha branch, 40-hex validation, and the
`BASE_SUPPLIED` empty-value guard. They have already drifted once in spirit: the
guard had to be hand-applied to both call sites. Extract one sourced helper both
scripts call.

> **`lib.sh` constraint** — `.claude/skills/dispatch-propagate/scripts/lib.sh`
> must stay copyable standalone; adding a new `source` to it turns ~17 CI
> fixtures red while staying green locally. Put the helper in a **new** file the
> two scripts source directly, not in `lib.sh`.

**Unit 3 — `read-sensors.ts` accepts any argument, then writes.**
`packages/intentionsutil/scripts/read-sensors.ts:1719` (verified) — `main()`
parses only `process.argv.includes("--report")` and silently drops every other
argument, then runs an **unconditional write pass** against the `intentions/` of
whichever checkout the script file lives in. Fix: reject unrecognized arguments,
and add a no-write `--check` mode.

> This compounds with PR1 Unit 8: the script both ignores what you asked for and
> resolves its own tree. Land PR1 first so the tree half is already explicit.

**Unit 4 — retire the `attributes.phase` squatter.** Backfill the 6 remaining
`phase: null` + `attributes.phase: main-qa` nodes to first-class `phase`, delete
the squatter fallback readers, and make `validate-graph` **reject** any
`attributes.phase` key so the misroute class cannot recur.

> `attributes` is `Record<string, unknown>` (`schema.ts:244`), so this is a real
> schema tightening — unlike PR4's ledger retirement. It therefore **does** trip
> the origin/main data test, which is exactly what **PR1 Unit 4** fixes. PR1
> before this unit, not optional.

**Unit 5 — decide the fate of `readDelegationRecordsReading`.**
`read-sensors.ts`'s `readDelegationRecordsReading` is unreachable from production
code (superseded by two per-strategy reading functions landed on
`tactic-first-sensor-pass`), but it is **the only code implementing a doctrine
rule** — excluding declined delegation records from unexercised counts for
`strategy-exercise-recovery-paths`. Deleting it silently drops the rule.

This unit needs an **author decision** before code: does the rule still govern
the new readings? If yes, port it and delete the dead function. If no, record
that on the node and delete. Do not delete without deciding — that is the
failure mode the node exists to prevent.

**Unit 6 — `transition-node` scope-stale test coverage.** Add shell-level
coverage for two behaviors: (a) a scope-stale `main-qa` node transitions to
`done` rather than being demoted to `implement`; (b) the scope-fingerprint stamp
is read and refreshed at the **main-checkout root**, not the invoking PR-branch
worktree, when `transition-node` runs with cwd inside a nested
`.claude/worktrees/<id>`.

**Unit 7 — `test-park-node.sh` precondition guard.** Fail fast with a clear
"install dependencies first" error when the harness root has no `node_modules`,
instead of dangling a symlink into every clone and surfacing the missing
precondition as an opaque `tsx ERR_MODULE_NOT_FOUND` inside one unrelated-looking
case.

### Dependencies

**PR1** — Unit 4 here is red-by-construction until PR1 Unit 4 lands, and Unit 3
assumes PR1 Unit 8's explicit-tree reads.

### Reuse

- `dump-node.ts` → jq → `write-node.ts` → `graph-commit` — the closure pipeline
  Unit 4's backfill uses (`plans` §"Closing nodes after each merge").
- `packages/intentionsutil/test/test-*.sh` — the existing shell harness pattern
  for Units 6 and 7.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

> The `validate-graph.ts` fence passes an **explicit** `intentions` argument.
> Before PR1 Unit 8 that is merely good practice; after it, it is required.

Manual: run `read-sensors.ts --nonsense` and confirm it exits non-zero without
writing (Unit 3). Confirm `grep -rn 'attributes\.phase' intentions/` returns zero
hits after the backfill (Unit 4). Run `test-park-node.sh` in a clone with no
`node_modules` and confirm the error names the missing precondition (Unit 7).

### Closing the nodes

After merge, for each of the 7 ids set `phase: done` and
`execution.resolved_by: <merge sha>`. Unit 5's node closes with the author's
decision recorded in its body **whichever way the decision goes**.

---

# PR17 — Merge queue and scan cadence *(added by R6)*

**Recommended model: sonnet** — bounded, independent efficiency and
observability fixes; no shared state between units.

### Context

These six are **cold**: they sit on the autonomous-fleet path —
`graph-auto-merge`'s merge queue, `dispatch-fleet-watch`'s alert cadence, the
scratch-ref cleanup a killed writer skips. None of them fires while the pause
sentinel holds, so none is load-bearing for the ad-hoc window.

They **are** load-bearing for the staged resumption, which is where this plan's
first trustworthy fleet data comes from. A resumption run against an unbounded
scan cadence and a silent merge veto produces measurements of the defects rather
than of the fleet.

**Run this PR after the window's hot work and before the sentinel comes off.**

### Nodes closed (6)

- `tactic-graph-auto-merge-office-hours-hold-observability`
- `tactic-graph-auto-merge-behind-arm-out-of-band`
- `tactic-hold-alerts-unbounded-scan-cadence`
- `tactic-hold-alerts-uncapped-alert-rows`
- `tactic-graph-scratch-ref-leak`
- `tactic-graph-digest-quality-followups`

### Scope

**Unit 1 — the `office_hours` hold is a silent, unbounded merge veto.**
`graph-auto-merge` declines to merge any node carrying `office_hours`, and
reports nothing. Surface held-for-office-hours counts to the tick's alarm/health
signal and escalate a node held across many consecutive ticks, so a mass or stuck
park cannot silently drain the node-lane merge queue.

This is the node-lane analogue of a finding this plan already accepts: Revision
5 measured the queue at **0 mergeable, 2 parked** — a state that is currently
invisible unless someone queries it by hand.

**Unit 2 — decide what `behind` means.** A PR head that is already an ancestor of
`main` — commits landed out of band — is currently routed into the sync arm,
where the update-branch call is an empty-diff no-op that the mergeable gate then
silently declines. Decide the correct disposition (most likely: recognize it as
already-landed and close the PR) and implement it.

**Unit 3 — cap the hold-alert scan cadence.**
`packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts` (`:113`, calling
`listUnclaimedHoldAlerts` from `src/hold-alerts.ts:91` — both verified). Its
full-graph `resolveAttention` scan runs on `dispatch-fleet-watch`'s **5-minute**
timer even though the predicate's own threshold is a **24-hour** age bound —
~288 redundant full-store scans/day, growing with the graph. Fix: run it on a
cadence proportional to its own threshold.

**Unit 4 — cap the alert rows.** `listUnclaimedHoldAlerts` has no cap on rows
returned, so a backlog of unclaimed manual holds against a few high-attention
sources scales both the per-pass claim-probe count and the pushed alarm-node body
size without limit. A `topK` parameter already exists at the call site
(`list-unclaimed-hold-alerts.ts:113`) — make it binding rather than advisory, and
report what was dropped rather than truncating silently.

**Unit 5 — stop leaking scratch refs.** Sweep origin's orphaned
`refs/heads/graph/*` scratch branches, and close the reason writers keep leaking
them: cleanup is a best-effort `EXIT`-trap step that a killed or hard-failing
writer never reaches. A trap is the wrong mechanism for a guarantee — move the
sweep to the next writer's startup, where it runs unconditionally.

**Unit 6 — `graph-digest.ts` quality follow-ups.** Deferred from the
`tactic-graph-digest-tooling` review (#2865): bound NEAR-DUP and CLOSURE below
O(n²), add stop-word filtering to near-dup tokens, tie STORED-DEFAULTS to schema
defaults, factor the repeated table render/truncation shape, and validate that
`DigestInput` bodies/rawTexts are keyed 1:1 with nodes.

At 702 nodes the O(n²) passes are the binding cost; do that sub-unit first and
measure before deciding how much of the rest is worth doing.

### Dependencies

**PR1** — for trustworthy node closure, as with every PR here. Nothing else;
Units 1–6 are mutually independent and may be split if the PR runs large.

Unit 1 overlaps PR5's reconciler surface only conceptually, not in code.

### Reuse

- `listUnclaimedHoldAlerts`'s existing `topK` option
  (`src/hold-alerts.ts:91`) — Unit 4 makes it binding rather than adding a
  parameter.
- The tick alarm/health signal PR2 touches — Unit 1 emits into it.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: park a node in the node lane and confirm the hold now appears in the
tick's health output rather than silently vetoing the merge (Unit 1). Time
`graph-digest.ts` against the full 702-node graph before and after Unit 6 and
record both numbers on the node — this PR's only measurable claim.

### Closing the nodes

After merge, for each of the 6 ids set `phase: done` and
`execution.resolved_by: <merge sha>`.

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

All **94** in-scope open tactics are assigned; none appears twice.

| PR | Nodes | Surface |
|---|---|---|
| PR1 | 9 | `graph-commit`, `schema.ts`, `sensors.ts`, `office-hours.test.ts`, `dump-node.ts`, `validate-graph.ts` |
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
| PR15 *(R6)* | 4 | `graph-commit` — writer default, merge path, invocation, short-circuit |
| PR16 *(R6)* | 7 | `transition-node`, `park-node`/`clear-park`, `read-sensors.ts`, `validate-graph` |
| PR17 *(R6)* | 6 | `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs |
| pre-PR sessions | 6 | no diff |
| deferred *(R6)* | 5 | ref-split cluster (3) + scope-custody features (2) |
| adjacent, unclaimed *(R6)* | 5 | `/qa-main` node lane (3) + fleet-dependent (2) |
| **total** | **94** | + 10 documented-not-assigned |

**Revision 6 delta:** +22 assigned (5 into PR1, plus PR15/PR16/PR17), +10
documented but deliberately unassigned. The 32 nodes it surveyed were all open
and none was in the plan before; creation dates span 2026-07-12 to 2026-08-14.

Of the 94, **26 are on the graph read/write path** (PR1's 9, PR15's 4, PR16's 7,
PR17's 6) — the largest single surface in the plan, and the one every other PR's
bookkeeping runs through.
