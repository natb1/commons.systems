# Dispatch + RSI serialized PR plan

**Written** 2026-08-14 · **Last revised** 2026-08-20 · **Graph base** `920492be`
**Covers** the 117 tactics in the dispatch-ladder / RSI / evaluation-machinery /
graph-plumbing / `/align`-charter scope that were `phase: null` **at scope-build
time (2026-08-14)**: defects, integrity issues, token-efficiency findings,
ledger entries, and the feature/design nodes that resolve them. A further 11
nodes are surveyed, documented and deliberately unassigned — see §"Coverage".

> **The `phase: null` filter is what left work out.** Work already past
> `phase: null` on 2026-08-14 was never a candidate, so the plan is silent on
> 20 in-charter nodes at `phase: implement`/`qa` and on the 20 in-charter open
> draft PRs that overlap its files. That overhang is censused and dispositioned in
> §"In-flight work outside this plan" — **read it before starting PR18 or PR5**,
> the two positions it lands on.

> ## Where this stands
>
> **PR1 has shipped** — `fe0b1c4d` ("pr1: graph write-path integrity", #3095),
> merged 2026-08-15, all eight units, its eight nodes closed to `phase: done`.
> Its section is kept only as the **shipped baseline** every later PR builds on:
> a unit index of what the write path now does, not work to execute.
>
> **PR18 is next, and nothing gates it.** Its one `blocked_by` edge cleared when
> PR1's nodes closed. The pre-first-PR list is empty apart from one settings
> change — see §"Retention: the one forward-looking change". The one open PR that
> appeared to reach it, **#3037**, was settled on 2026-08-20: it does not carry
> the defect, it carries the fix, so it is deferred to A3 and **PR18 Unit 1
> narrows to a single site**. See Bundle 0 step 1. PR18 can start.

---

## How to use this document

The work is being **serialized** — other development is frozen — so this plan
optimizes for **fewer, larger PRs** grouped by shared code surface rather than
one PR per node.

Four ground rules were set by the author and are assumed throughout:

1. **No carrier node.** These PRs are implemented **ad-hoc, in ad-hoc sessions
   that bypass the dispatch ladder.** No node carries `execution.pr`, no node is
   driven through align-tactics → implement → review → qa. A PR is a plain
   branch off `main`.
2. **Node bookkeeping is an explicit post-merge step**, not a ladder
   transition. Each PR section ends with the exact write that closes its nodes;
   the mechanics and the seven hazards on that path are in §"Closing nodes after
   each merge".
3. **All three large refactors are in scope** (lens-catalog decomposition,
   intervention-core extraction, dispatch skill rename) and are sequenced last,
   because each one rewrites surfaces the earlier PRs edit.
4. **The freeze is held for this plan, and does not lift until this plan is
   done.** The pause sentinel is not an outage to be worked around and not a
   window that might close mid-flight. It is the enabling condition: this
   document is a **waterfall execution that exploits a dispatch-ladder freeze to
   accelerate dispatch and alignment work**, doing serially and by hand what the
   ladder cannot do while it is running through itself. So the sentinel stays
   set until every PR here has merged and every node here is closed. Any step
   that reads "before resumption" means before *that* point, not before some
   externally scheduled restart.

Every PR section is **clean-session-executable**: a session with no memory of
this analysis can execute it from the section text alone.

> **Anchor freshness.** `path:line` anchors below were re-verified against
> `da1c3c7f` unless marked *(from node body — re-locate)*. Several anchors
> carried in node bodies had already drifted; those are corrected here. Anchors
> in *any* node body should be treated as hints, not addresses.

---

## The freeze: what it stops, and what it does not

> **The freeze is this plan's premise, not its environment.** Per ground rule 4:
> the sentinel does not lift until every PR in this document has merged and every
> node in it is closed. The plan exists *because* the ladder is frozen — it is a
> waterfall execution taking advantage of that freeze to accelerate dispatch and
> alignment work, rewriting the machinery the ladder itself runs on, which is
> only safe while nothing is running on it. Read the rest of this section as
> "what the freeze does and does not stop **while we hold it**", never as a clock
> counting down to a resumption someone else controls.

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

**The drain mechanism is live, but its inventory is empty.** `graph-auto-merge`
says in its own header that it is the only code that merges a node-lane PR, and
its candidate set is: a graph-native tactic at `phase: review`, carrying
`execution.pr`, carrying the `reviewed` marker in `execution.markers`, with no
in-flight `execution.conflict` and `office_hours` null. Counted against
`origin/main` on 2026-08-14:

| State | Count 2026-08-14 | Recount 2026-08-20 |
|---|---|---|
| `phase: review` with a PR, **mergeable now** | **0** | **0** |
| parked (`office_hours` set — held) | 2 | 2 |
| review-in-progress / conflicted (no `reviewed` marker) | 2 | 1 |

> **Recount 2026-08-20 — the margin is now one marker wide.** Three nodes sit at
> `phase: review`, all carrying `execution.pr` and `markers: [planned, qa-done]`,
> none carrying `reviewed`, all with `execution.conflict: null`. Two are the
> known parked pair. The third —
> `tactic-reap-safety-behind-branch-false-positive` (#3052) — is **unparked, and
> its PR is `MERGEABLE`**. It is a single `reviewed` marker away from being an
> auto-merge candidate, and that marker is the only thing the sentinel actually
> withholds. The standing check below is no longer a formality: run it, and if
> #3052 is landed by hand per Bundle 0 Step 2, the count returns to two parked
> nodes and the margin re-widens.

There is no path from that state to a merge while the sentinel holds: the
`reviewed` marker is written by a review session, review sessions run only from
a spawned worker, and the sentinel gates spawning. Ad-hoc PRs do not enter the
review phase, do not alter checks on existing PRs, and do not unpark nodes.
Neither parked node carries the `reviewed` marker
(`tactic-clarification-citation-ids`,
`tactic-office-hours-snapshot-wire-contract`), so even the pre-PR office-hours
sittings cannot produce a merge candidate — unparking either returns it to
review-in-progress, which still needs a worker.

**So: no parking session. Instead, a standing check** — re-run the candidate
count before each bundle, and park the node lane only if it is ever non-zero.
An `office_hours` park is the one state `graph-auto-merge` will not merge past.

The residual is real but minor: sweeps and reconcilers still write node
*metadata* to `main`. That surfaces as a `graph-commit` CAS refusal (exit 1,
visible, re-runnable), not as unreviewed code landing under a PR.

**Three units that look cold are hot.** `standdown_recheck_sweep` (PR9 Unit 2),
`terminal_without_disposition_sweep` (PR2 Unit 6) and `reconcile-graph-merged`
(PR5) are all on the paused-tick path. A bug in them breaks things *during* the
window, not at resumption. They are pulled into Bundle 2 for that reason.

## What is genuinely cold

Nothing spawns a worker, so nothing reaches: the whole ladder driver
(`dispatch-ladder-*`), `dispatch-code-review`, the `/review-fix` orchestration,
`dispatch-target-workers` (the paused branch exits before `dispatch-select-tick`),
`provision-node-worktree`, and `dispatch-eval-finding` (only `/rsi` calls it,
and `/rsi` spawns from the ladder).

The graph write path is the opposite of cold: **the ad-hoc window drives every
graph write by hand through exactly the hot set** — `graph-commit`, the graph
reads, the node-mutation scripts. All ~100 remaining node closures run through
it. That is why the graph-plumbing bundles sit at the front of the order, and
why `graph-auto-merge`'s merge queue, `dispatch-fleet-watch`'s alert cadence and
`/qa-main`'s node lane (PR17) sit at the back: they are the path only an
autonomous fleet uses, dormant while the sentinel holds.

## Why this is many PRs and not one

Three arguments were made against a single PR. Under ad-hoc supervised
execution, one survives intact and two are weakened but still load-bearing:

| Argument | Status |
|---|---|
| The machinery under repair lands the repair | **Collapses** for everything cold — nothing runs it. Survives for the tick-path items and for `graph-commit`, which every ad-hoc session still uses to close nodes. |
| Verification harnesses are per-surface | **Weakened.** It was about attributing a regression automatically; a supervised author can run all 15 suites and read the output. The ladder suites (`test-dispatch-ladder-*.sh`) and the instrument suite (`test-aggregate-usage.sh`) remain separate harnesses with separate fixtures, so a combined PR still cannot report which surface regressed. |
| PR13 renames what the others edit | **Intact.** It renames the skill family the other PRs edit by path; bundling it with anything guarantees conflicts on every file. It must be last and alone. |

The bundling below is the compromise: grouped by shared code surface, ordered so
each bundle's verification surface is independent.

---

## In-flight work outside this plan

*Censused 2026-08-20 against `origin/main` after `git fetch`. Supersedes nothing
above; it fills the hole the `phase: null` scope filter left.*

### Why there is an overhang at all

§"Coverage" records how the scope was built: three passes, each one selecting
nodes and then re-verifying every assigned node was **`phase: null` on
`origin/main`**. That filter is what makes the plan tractable, and it is also
the whole of the omission. A node that had already been planned, or already had
a draft PR pushed, was not `phase: null` on 2026-08-14 — so it was never a
candidate, no matter how squarely it sat in the charter or how directly it
edited a file a plan PR rewrites.

Two populations came through that filter untouched:

| Class | Count | State | What it does to this plan |
|---|---|---|---|
| **A — open draft PRs in charter** | **20** of 30 open | 16 `CONFLICTING`, 4 `MERGEABLE`, all but one draft; oldest untouched since 2026-07-28 | Partitioned 12 A1 / 4 A2 / 4 A3. **#3037 was a presumed hard blocker and is not** (Bundle 0 step 1). They move anchors under PR4/PR5/PR9/PR12/PR15/PR16/PR18/PR19/PR20 |
| **B — planned nodes, no PR** | **20** of 55 | 19 at `phase: implement`, 1 at `qa`; plan body written, **no branch, no commits, no PR** | Invisible today; **tick-selectable the moment the sentinel lifts**, which would violate ground rule 1 |

Class B is the one this plan had no way to see. Those nodes are not stalled work
— they are *finished plans awaiting a worker*. Verified: none of the 55 has a
remote branch, none has commits ahead of `main`, and only one has a worktree.
They are inert precisely and only because the pause sentinel holds.

> **Class B is a ground-rule collision, not just a coverage gap.** Ground rule 1
> says no node in this plan is driven through the ladder and no node carries
> `execution.pr`. But **45 of this plan's own 102 assigned nodes are now at
> `phase: implement`** — moved there by `/align-tactics` finalization rounds run
> after the plan was written, not by anything in this document. At the moment
> the sentinel comes off, the tick cannot tell this plan's `implement` nodes
> from the class-B `implement` nodes: it will select whichever ranks highest and
> spawn a ladder worker on it. That produces exactly the ladder-driven PR ground
> rule 1 forbids, on a node this plan intends to close by hand.
>
> **This is already settled by ground rule 4.** The sentinel stays set until
> this plan's PRs have merged and its node bookkeeping is complete, so the
> collision above never gets a chance to fire. That is the *function* of the
> freeze, not a concession to it. What this class-B finding adds is the size of
> the exposure the moment the sentinel does come off: 45 plan nodes plus 19
> class-B nodes are all tick-selectable at once, so the bookkeeping in
> §"Closing nodes after each merge" is what makes resumption safe — finish it
> before lifting, and there is nothing left for the tick to grab wrongly.

### Class A — the 20 in-charter open PRs, and what to do with each

**The disposition rule.** For a `CONFLICTING` draft whose surface a plan PR
rewrites anyway, rebasing it is wasted work: the plan PR re-authors the same
lines, and the draft's value is the *node*, not the diff. So the default is
**close the PR, keep the node, fold the node into the plan PR that owns its
surface** — which is also what makes the node's fix land under the plan's own
verification rather than a stale branch's. Land-first is reserved for PRs that
are already `MERGEABLE` and cheap; a third class is sequenced *after* the plan
because it rewrites node content en masse.

**A1 — close and absorb (12, none yet closed).** *Was 13; #3037 was reclassified
to A3 on 2026-08-20 after verification — see Bundle 0 step 1.* The intended
treatment: close the PR with a comment pointing at this section, leave the node
at `phase: implement`, delete the branch, and add the node to the named PR's
`### Nodes closed` list and its `### Scope`.

> **Each close must pass the redundancy test in Bundle 0 step 5 first.** The one
> A1 disposition that was verified in full was refuted, and two spot-checks of
> the rest fail as written. Treat the table below as *candidates* with a named
> target, not as a settled disposition.

| PR | Node | Absorb into | Why |
|---|---|---|---|
| **#3023** | `tactic-strategy-fingerprint-stamp-coverage` | **PR16** (as a new unit, ahead of Unit 8) | This plan already names it a hard dependency of PR16 Unit 8 in two places. Absorbing converts a wait into a unit |
| **#3002** | `tactic-autonomous-ci-pending-liveness-bound` | **PR5** | `reconcile-graph-review-stall` is PR5's *entire* scope surface. #3002 also *adds* per-tick `gh` calls to the file PR5 exists to make cheaper — landing it first would defeat PR5's own measurement |
| **#3064** | `tactic-graph-review-exclusion-stall-recovery-main-qa-regression` | **PR5** | Same file, same region as #3002, and the two conflict with each other. One PR converges all three |
| **#3054** | `tactic-blocked-session-invisible-to-census` | **PR18** Unit 4 (+PR9 reuse) | `dispatch-fleet-alarm:316-325`, `:618`; `lib-claude-agents.sh` |
| **#3056** | `tactic-graph-execute-fresh-main-read` | **PR9** Unit 3 (+PR20 for the skill text) | `provision-node-worktree:113`, `test-provision-node-worktree.sh` |
| **#2993** | `tactic-qa-main-park-base-cas` | **PR12** | `.claude/hooks/dispatch-stop.sh` is named verbatim in PR12's Scope |
| **#2975** | `tactic-phase-evidence-fingerprint-bound` | **PR16** (+PR18 for `router.ts`) | Also unblocks `tactic-demote-node-stale-local-read`, one of this plan's six deferred nodes — absorbing it retires a deferral |
| **#2974** | `tactic-scope-fingerprint-plan-substance` | **PR16** (+PR5 `store.ts`, PR20 `tactic-target.md`) | `transition-node` is PR16's surface |
| **#2946** | `tactic-node-ancestry-context` | **PR13** | It edits eight skill bodies; PR13 renames all of them. Any other home guarantees a conflict with the rename |
| **#3057** | `tactic-bounded-work-in-progress` | **PR8** Unit 3 (+PR18 `router.ts:540-556`) | `dispatch-config-load:342-344` |
| **#3018** | `tactic-conflict-lane-exit11-retry-bound` | **PR8** Unit 3, coordinated with PR5's conflict-lane unit | `dispatch-tick:266-300`; same lane, different mechanism — converge the policy once |
| **#3041** | `tactic-clarification-citation-ids` | **PR19** (+PR4/PR18 `schema.ts`, `router.ts`) | **Node is `office_hours`-parked** and is one of this plan's two named pre-PR sittings. Resolve the sitting first, then absorb — see Step 4 |

**A2 — land first (4).** All `MERGEABLE` today. Each is cheaper to merge than to
carry, and merging retires its anchor drift permanently.

| PR | Node | Effect on the plan |
|---|---|---|
| **#3052** | `tactic-reap-safety-behind-branch-false-positive` | Shifts three PR9 Unit 1 anchors (`lib-session-reap.sh:286-291`, `:374`, `:548`). Also the node the freeze recount flags — landing it returns the drain inventory to two parked nodes |
| **#3084** | `artifact-plan-view` | Only `unit-tests.yml` overlap (PR16). Non-draft. The plan-view nodes are deliberately out of scope per §"Retention" — landing the PR does not change that |
| **#2805** | `tactic-office-hours-snapshot-wire-contract` | No plan-file overlap at all. **Parked** — this plan's other named pre-PR sitting. Resolve the sitting, then land |
| **#2879** | `tactic-align-audit-skill` | No file overlap with PR20. Lands a single new skill file. Related to PR20's required pre-PR sitting `tactic-align-audit-legacy-review` only by subject, not by a declared edge |

**A3 — sequence after this plan's bookkeeping (4).** The first three rewrite node
*content* in bulk. Landing any of them mid-plan invalidates every
`graph-commit --base` CAS manifest pinned before it — the hazard §"Closing nodes
after each merge" already warns about — and would collide with roughly a hundred
node closures still to run. The fourth, #3037, is here for a different reason:
it is real, un-reimplemented work that edits `graph-commit`.

| PR | Node | Bulk change |
|---|---|---|
| **#3037** | `tactic-census-scripted-tick` | *(moved from A1, 2026-08-20.)* 1,582 added lines / 15 files: retires `dispatch-graph-census` for `dispatch-census-tick` + `census-tick.ts` + `census-decide.ts`, with two new test suites. **No unit in this plan reimplements it.** Edits `graph-commit` (+12/−5) and `dispatch-select-tick`, so it lands after this plan's closures. It also *carries the fix* for what PR18 Unit 1 called its second site — see Bundle 0 step 1 |
| **#3093** | `tactic-attention-per-tier-boost-migration` | Rewrites **92** `intentions/*.md` frontmatters; migrates `attention.boost`+`tier` → `attention.boosts`. Touches two nodes this plan closes. This plan cites its *branch* once but never tracked it as work |
| **#2856** | `tactic-mount-schema` | `schema.ts`, `attention.ts`, `goals.ts`, 13 test files |
| **#3040** | `tactic-delegation-classification-derivation` | `schema.ts`, `attention.ts`, plus 22 `delegation-*.md` nodes |

**Leave alone — out of charter (10).** #3016 (blog prerender), #3039
(demo-saas scaffold), #2848 (nix instance flake), #2874 (tailscale health
check), #2877 / #2878 (recovery drills), #2798 (sync-reader), #2873
(participation-log instrument), #3096 (wezterm), and #3044
(`tactic-qa-fix-node-terminal-declaration`, already routed out of this plan by
author ruling at §PR2).

### Class B — planned nodes with no PR, in charter

None of these has a branch or a commit. Each carries a written plan body and
waits only for a worker. Absorbing a class-B node costs no PR closure and no
rebase — it is purely an edit to a plan section's `### Nodes closed` and
`### Scope`.

> **FOLDED 2026-08-20 (Bundle 0 step 6) — 12 of the 20.** The table below is now
> a record of *where each node went*, not a to-do list. Landed in their target
> sections: `node-merge-list-removal-loss` (**PR15 Unit 0**),
> `rebuild-snapshot-stale-revert-main-qa-regression` and
> `flake-hook-tests-graph-commit-fixture-clone` (PR15 Verification),
> `review-code-review-invocation-contract-main-qa-regression` (PR6),
> `select-tick-main-sync-gated-on-caller-cwd`, `worker-self-close-configurable`
> and `dispatch-config-template` (PR8),
> `dispatch-stop-backstop-comment` (PR12),
> `graph-native-signal-instrument-arm-main-qa-regression` (PR16),
> `schema-drift-guard` (PR19), `review-lows-automation` (PR3), and
> `mainqa-record-time-routing` (**§PR5a**, its own PR — step 3).
>
> **Not folded, by ruling, and each for a different reason:**
> `align-session-claiming-liveness-correction` is an **invalid state** to fix,
> not work to absorb; `office-hours-graph-read-cwd-whitespace` is moot if the
> legacy lane is deleted, so it resolves against the node below it;
> `legacy-office-hours-entry-removal`, `omit-default-serialization` and
> `serves-inheritance-full-strip` are deferred past the plan; and
> `graph-function-docs`, `ratchet-teeth-census` and `model-portability-inventory`
> stay documented-not-assigned.

| Node | Phase | Disposition |
|---|---|---|
| `tactic-node-merge-list-removal-loss` | implement, **parked** | **→ PR15.** `graph-commit`'s layer-2 field merge cannot express a REMOVAL: the base-free list union silently restores a deleted `blocked_by`/`serves` entry and reports a clean auto-resolve. **Deterministic, not a race, and `--base` does not protect against it.** This plan runs ~100 node closures through that merge. Highest-value item on this page. Its park is a stale `provision-node-worktree` exit-2 from 2026-07-31 — clear it, do not re-provision |
| `tactic-mainqa-record-time-routing` | implement | **DONE 2026-08-20 — now §PR5a**, Bundle 2a, sequenced before PR5. Unblocked in substance (#3051 merged); its `blocked_by` edge is stale-but-written |
| `tactic-review-code-review-invocation-contract-main-qa-regression` | implement | **→ PR6.** Corrects the recorded `dispatch-code-review` invocation contract (`--comment` / `--no-comment`, and whether the `/code-review low --fix` pre-stage completes). PR6 owns that script |
| `tactic-select-tick-main-sync-gated-on-caller-cwd` | implement | **→ PR8.** `dispatch-select-tick` gates its main-checkout sync on the caller's cwd, so one stray dirty file wedges every writer. On the paused-tick path |
| `tactic-worker-self-close-configurable` | implement | **→ PR8** (`dispatch-config-load`), with the `dispatch-stop.sh` half coordinated with PR12 |
| `tactic-dispatch-config-template` | implement | **→ PR8.** Records the `dispatch.config/` instance-repo convention — tracked human-edited config vs gitignored machine-written artifacts. PR8 is the config PR |
| `tactic-dispatch-stop-backstop-comment` | implement, **parked** | **→ PR12.** One stale comment at `dispatch-stop.sh:62-63`. Trivial; fold it into whichever PR touches the file first |
| `tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression` | implement | **→ PR15 verification.** `test-graph-commit.sh` case numbers cited in a merged PR body drifted when an unrelated commit inserted cases |
| `tactic-flake-hook-tests-graph-commit-fixture-clone` | implement | **→ PR15 verification.** Fixture clones race source-side git object relocation; one clone failure cascades into 11 misattributed failures. PR15 runs that suite hardest |
| `tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression` | implement | **→ PR16** (`read-sensors.ts`). A merged unit never executed against a clean clone |
| `tactic-schema-drift-guard` | implement | **→ PR19.** CI guard that every field, rule, enum and vocabulary `schema.ts` enforces is declared on a kind node. PR19 is the `schema.ts` PR and would be its first beneficiary |
| `tactic-review-lows-automation` | implement | **→ PR3** (`aggregate-usage.sh`, `dispatch-reclaim-audit`, `lib.sh`) |
| `tactic-align-session-claiming-liveness-correction` | **qa** | **Invalid state — fix, do not absorb.** It sits at `phase: qa` with `execution.pr: null` and `markers: [planned]` only. It is a *record correction* to another node's body: it needs a `graph-commit`, never a PR. Land it as a graph write during this plan's bookkeeping and transition it to `done` |
| `tactic-office-hours-graph-read-cwd-whitespace` | implement | **Resolve against the node below first.** It hardens directive parsing in the legacy office-hours entry lane. If that lane is deleted, this is moot — close it rather than implement it |
| `tactic-legacy-office-hours-entry-removal` | implement | **Defer to resumption, explicitly.** It deletes the legacy label-lane office-hours entry surface *and* the legacy `<issue-num>-<slug>` worktree lane, repointing the `settings.json` `UserPromptSubmit` hook and the nix wiring. A deletion that large moves anchors under PR9, PR16 and PR20 at once. Sequence it after PR13, or after the plan |
| `tactic-omit-default-serialization` | implement | **Class A3 treatment.** `writeNode` omitting default-valued fields stops ~3,700 lines of serialized defaults being written — i.e. it rewrites nearly every node file. Same CAS-manifest hazard as #3093. After the bookkeeping |
| `tactic-serves-inheritance-full-strip` | implement | **Class A3 treatment.** Strips redundant `serves` entries graph-wide. Same reason |
| `tactic-graph-function-docs` | implement | Documented, not assigned. Docs only (`kind-kind.md`, `intentions/README.md`) |
| `tactic-ratchet-teeth-census` | implement | Documented, not assigned. Instrument manifest; PR3-adjacent but not on any plan PR's surface |
| `tactic-model-portability-inventory` | implement | Documented, not assigned. Inventory document; touches `lib-claude-agents.sh` and `dispatch-graph-execute` by citation only |

**Surveyed and ruled out of charter (35 of the 55).** The
`tactic-attention-surface-*` family (7), `tactic-demo-saas-*` (4),
`tactic-mount-*` (3), `tactic-goals-page-mount-views`, and the nix / wezterm /
blog / budget / reading / delegation-instrument nodes. Several touch
`read-sensors.ts`, `write-node.ts` or `validate-graph.ts` in a *verification*
block only — filename overlap without surface overlap. They are named here so a
later census does not re-derive the same negative.

**Not in flight — the 41 `main-qa` nodes.** A separate untracked cohort sits at
`phase: main-qa` with no PR. Their code is **already on `main`**: they are
post-merge verification residue, not work. They cannot conflict. They matter for
one reason only — several landed *after* this plan's anchors were verified, so
they are anchor-drift sources. §"Read this before planning any of it" already
tells you to re-locate; this is why.

### Bundle 0 — retire the overhang before PR18

Ordered so each step reduces the next one's cost. No step opens a new PR.

1. **Settle #3037 against PR18 Unit 1. — DONE 2026-08-20; the recommendation was
   refuted by the reading it ordered.** This step said to read
   `census-tick.ts`'s `spliceBody()` first, then close #3037 and absorb
   `tactic-census-scripted-tick` into PR18. The reading was done. It refutes the
   premise, and the disposition is reversed:

   > **The defect does not survive the port.** On #3037's branch,
   > `packages/intentionsutil/scripts/census-tick.ts:163` `spliceBody()` has
   > **exactly one call site** — `:327`, immediately after `writeNode(...)`, on a
   > path guarded twelve lines earlier by
   > `if (existsSync(join(args.dir, `${defectId}.md`))) { …; continue; }`. It can
   > therefore only ever splice a node it minted microseconds before, whose body
   > is the generated `# <statement>` placeholder. Its own doc comment says so:
   > *"`writeNode` only generates the placeholder for a brand-new file (it
   > preserves an existing body verbatim), so this runs immediately after the
   > mint."* **#3037 is not a carrier of the defect — it is the fix for it.** The
   > `existsSync` skip is precisely the guard the main-side script lacks.

   Two consequences, both applied to this document:

   - **#3037 moves A1 → A3** (sequence after the plan's bookkeeping). It is not
     a stale draft whose diff a plan PR re-authors; it is 1,582 added lines
     across 15 files — two new TypeScript entry points, two new test suites —
     that **no unit in this plan reimplements**. Closing it would discard the
     work and hand PR18 a scripted-census-tick charter it does not have. Its A3
     hazard is the ordinary one: it edits `graph-commit` (+12/−5) and
     `dispatch-select-tick`, so land it after this plan's node closures, not
     during them.
   - **PR18 Unit 1 narrows to one measured site** — see §PR18. The second site,
     `dispatch-graph-census:133-140`, stays on `main` untouched for the duration
     of this plan, which is safe because **the census does not run while the
     sentinel holds**: it is not among the six things a paused tick does
     (§"The freeze"). Its fix already exists, implemented and tested, in #3037.

   **The precedent this sets for step 5 is the opposite of the one intended.**
   Verify before closing — see the gate added there.

2. **Land the four A2 PRs** (#3052, #3084, then #2805 and #2879 after their
   sittings). Cheapest anchor drift on the board, and #3052 re-widens the freeze
   margin. Re-run §"The freeze"'s standing candidate count afterwards.

3. **Sequence `tactic-mainqa-record-time-routing` as its own PR, before PR5. —
   DONE 2026-08-20.** It is now **§PR5a**, listed as Bundle 2a and placed at
   position 3 in §"Recommended order", immediately ahead of Bundle 2. Its plan of
   record stays in the node body (a finalized seven-unit plan, `fcb792af`); the
   PR5a section indexes those units and carries the sequencing, the stale
   `blocked_by` edge, and the PR5 file collision. Landing it first puts the
   rebase cost on the smaller of the two diffs.

4. **Clear the two parks — they are not "sittings".** *Corrected 2026-08-20 after
   reading both `office_hours` blocks.* This step called them pre-PR sittings and
   implied `/office-hours` design sessions. Neither is. Neither appears in
   §"Pre-PR sessions (no diff)". Both are **operational parks**, and they need
   different handling:

   - **`tactic-office-hours-snapshot-wire-contract` (#2805) — its blocker is
     already gone.** Park reason (2026-08-03): a `/review-fix` pass could not
     invoke the code-review instrument, so the PR carries no Lane-A review — a
     coverage gap, explicitly "rather than a diff defect". Its own recommendation
     says the highest-value action is not on this PR but on the instrument fix,
     `tactic-review-code-review-invocation-contract` / **#3007** — and **#3007
     merged 2026-08-03**. So the systemic cause is fixed and the park's
     suggested order ("land the instrument fix, then clear this park") is
     already half-executed. What remains is a judgement the author still owns:
     **accept the Lane-A coverage gap on this PR, or run `/code-review max
     --fix` against the branch first.** The park's own text frames per-PR review
     as "the expensive path". Two gotchas it records, both still live: run
     `transition-node` from a main-based checkout, and check scope freshness
     first or `transition-node` **demotes the node to `implement`** and loses
     the review work.
   - **`tactic-clarification-citation-ids` (#3041) — the park's alarm is stale;
     no content is at risk.** Park reason (2026-08-10) is a
     `standdown-winner-dead-work-unpushed`: a session stood down for a winner no
     longer registered with the Claude daemon, and that winner "left work
     UNPUSHED" at `837b1bf6` in
     `.claude/worktrees/tactic-clarification-citation-ids`. **Measured
     2026-08-20 — the unpushed set contains no authored work:**

     ```
     git log --oneline --no-merges origin/main..837b1bf6 \
       --not origin/tactic-clarification-citation-ids
     # (empty)
     ```

     All six authored commits — Units 1/2/3 of the citation conversion plus the
     fingerprint-stability and type-safety-marker fixes — are **already on
     `origin/tactic-clarification-citation-ids`**. The three commits the park
     names (`837b1bf6`, `4b145b91`, `d37dfa90`) are all
     `Merge remote-tracking branch 'origin/main'` merges; they carry no original
     content. The worktree head is *behind* the remote branch head
     (`60260eb4`), not ahead of it in substance.

     So the push-first dance the recommendation prescribes is unnecessary. What
     still applies: release the holding session with `claude stop <job-id>`,
     **never `claude rm`** — that deletes the session *and* its worktree — then
     `clear-park`. A worktree-isolated session cannot do the worktree half:
     `git -C` to a sibling is refused (`.claude/rules/sandbox.md`), and
     `claude agents --json` needs `dangerouslyDisableSandbox` or it silently
     returns `[]` and reports the worktree free. Run it from the main checkout.

     > **This is the second stale park alarm found in one pass.** #2805's blocker
     > was fixed 17 days before this reading; #3041's "unpushed work" was already
     > pushed. Re-measure a park's stated cause before acting on its
     > recommendation — the recommendation text is a snapshot of the moment the
     > park was written, and nothing re-verifies it.

5. **Close the remaining 12 A1 PRs and fold their nodes in — NOT mechanical.
   Gate each one.** This step originally read "mechanical once step 1 sets the
   precedent". Step 1 set the opposite precedent, so a gate is required before
   any close. **Nothing in A1 has been closed as of 2026-08-20.**

   > **The redundancy test.** The A1 rule assumes the draft's diff is worthless
   > because *the plan PR re-authors the same lines*. That is a claim about the
   > **plan PR's units**, not about file-name overlap, and it must be checked per
   > PR before the close:
   >
   > 1. List the draft's changed files (`gh pr view <n> --json files`).
   > 2. For each, find the unit in the target section's `### Scope` that
   >    re-authors that region. Not the file — the *region*.
   > 3. Any file with no such unit is **work the close would destroy** and the
   >    plan would silently owe. Either write the unit that covers it, or
   >    reclassify the PR to A3.
   >
   > **The 12 carry ~10,900 added lines between them.** Two spot-checks already
   > fail the test as written:
   >
   > - **#3002 → PR5.** PR5's `### Scope` is six *localized efficiency* edits at
   >   `reconcile-graph-review-stall:146/:186/:214/:220` plus a conflict lane and
   >   a base pin — it does not re-author the file. #3002 is 911 lines across 10
   >   files and **adds behavior** (a CI-pending strike counter, a `CI_STALL_IDS`
   >   hold block, a new `hold-node-decide.ts`). Six of its ten files appear
   >   nowhere in PR5's scope. Absorbing it makes PR5 a different PR than the one
   >   whose **Recommended model: sonnet** was chosen for "five localized fixes".
   > - **#3064 → PR5.** Same file, but its hunks are at `:42/:59/:98/:221` —
   >   three of the four outside every anchor PR5 names — plus
   >   `apply-fix-state.ts` and `transitions.ts`, which PR5 does not touch.
   >
   > The *conflict-lane* half of the PR5 rationale survives: three producers of
   > one policy should converge in one PR. The rest does not.

   For any PR that **passes** the gate: close with a pointer to this section,
   delete the branch, add the node id to the target PR's `### Nodes closed`, and
   add its surface to that PR's `### Scope`.

6. **Fold the class-B nodes into their named PR sections. — DONE 2026-08-20.**
   Twelve folded; each target section's `### Nodes closed` count was raised and a
   note added explaining what the node contributes and how to treat it. Full
   index in the class-B blockquote above.

   `tactic-node-merge-list-removal-loss` went first, as instructed, and became
   **PR15 Unit 0** — numbered 0 rather than 5 because it is the only
   *correctness* fix in a PR that is otherwise simplification, and PR15 carries a
   standing ref-split HOLD on its Units 1–2. If that hold ever splits the PR,
   Unit 0 must still ship: every node closure in this plan runs through the merge
   path it repairs.

   One correction found while folding: the disposition table described the defect
   as restoring a deleted `blocked_by`/`serves` entry. The node's own statement is
   wider — `blocked_by`, `serves`, **`validates`**, *and* an **`attributes`-key
   deletion**. PR15 Unit 0 scopes all four.

7. **Do not lift the sentinel.** There is no decision here to take — ground rule
   4 settles it: the freeze is held for this plan and lifts only when the plan is
   complete. Parking this plan's 45 `phase: implement` nodes is not an
   alternative that buys an earlier resumption; it is at most a redundant second
   interlock, and it costs 45 node writes through the very merge path
   `tactic-node-merge-list-removal-loss` says is broken (step 6). Leave the
   sentinel set, finish the plan, and lift it once §"Closing nodes after each
   merge" has run for the last PR. Ground rule 1 has no other enforcement.

**After Bundle 0** — *projected when written; revised 2026-08-20 after steps 1
and 5 were executed.* The original projection was 117 → **131** nodes (+13
class-A absorbed, +1 `mainqa-record-time-routing` sequenced). It no longer holds:
**#3037's absorption was refuted**, and the remaining 12 are now gated
candidates rather than settled closes, so the class-A contribution is between
**0 and +12**, not a fixed +13. The floor is therefore **118** (117 + the
sequenced `mainqa-record-time-routing`) and the ceiling **130**. Class-A PRs
deferred to post-plan rose from 3 to **4**. What did not change: 4 PRs to land,
3 class-B nodes deferred, 10 out-of-charter PRs untouched.

> **Do not quote 131.** The number is now an output of the step-5 gate, not an
> input to it. Recompute it when the gate has been run on all 12.

---

## Bundles

| # | Bundle | PRs | Nodes | Risk |
|---|---|---|---|---|
| ✅ **1** | **Graph read/write path** | PR1 | 8 | **SHIPPED `fe0b1c4d` (#3095)** |
| **0** | **Retire the in-flight overhang** | no new PR — 4 lands, **0–12** closes (gated), 1 sequencing | **+1 to +13** | **IN PROGRESS 2026-08-20** — steps 1 and 4 executed; step 5 gated |
| **2a** | **Record-time main-qa routing** | PR5a | 1 | before Bundle 2 — see §PR5a |
| **1c** | **Durable-layer write fence** | PR18 | 5 | HOT — guards every node write that follows |
| **1b** | **Graph plumbing** | PR15 + PR16 | 15 | HOT — the closure toolchain |
| **2** | **Tick-path reconcilers and sweeps** | PR5 + PR9 U2,U6 + PR2 U6 | 10 | HOT — runs every tick |
| **4** | **Instrument + finding surface** | PR3 + PR4 | 16 | COLD |
| **2b** | **Supersession representation** | PR19 | 3 | needs PR4's write surface |
| **3** | **Dispatch runtime (cold)** | PR2 rest + PR6 + PR7 + PR8 U1–2 + PR9 rest | 25 | COLD — realized at resumption |
| **5** | **RSI chain** | PR10 + PR11 + PR12 + PR14 | 10 | COLD |
| **5b** | **`/align` charter + adversarial review** | PR20 | 8 | must precede the rename |
| **6** | **Skill rename** | PR13 | 1 | last, alone |
| **7** | **Merge queue + scan cadence** | PR17 | 6 | COLD — before the sentinel comes off |
| — | *deferred* | PR8 U3 | 1 | see below |
| | *pre-PR sessions* | | 9 | no diff |
| | **total** | | **117** | + 11 documented-not-assigned |

**Why Bundle 1 stayed alone, and why its successors inherit the argument.** Its
failure mode was *silent*: a dropped node edit when local `main` is ahead, a
destroyed snapshot, an abandoned write reported as a content failure — and
supervision does not catch silent failures. Every other bundle's closing
bookkeeping runs through it, so it landed first and was verified by reading
`git show origin/main:` rather than by trusting a verdict line. Bundles 1c and
1b are the same shape.

**Bundle 1b is separate from Bundle 1 on purpose.** Both touch `graph-commit`,
but Bundle 1 was correctness and Bundle 1b is simplification. Landing them
together would mean a regression in the writer could not be bisected against a
known-good one. Bundle 1b is also the work most exposed to the ref-split
question — see §"Decisions already taken".

**Bundle 1c is the front of the queue.** Two reasons, and the first is
mechanical: `tactic-graph-commit-park-content-durability` was `blocked_by` two
of PR1's own nodes, **both of which closed with PR1**, so it is unblocked and
ready. The second is Bundle 1's own argument — this bundle is the fence that
decides what an **autonomous** writer may do to durable node content, and
roughly a hundred node closures still run through that fence. It is deliberately
ahead of Bundle 1b, because Bundle 1c carries no ref-split exposure and PR15
does. PR1's commit message names the seam: candidate (c) of the SNAP_DIR ruling
"was not adopted… The seam for it is deliberately one function: both recovery
branches call `preservedContent()` and neither composes path wording of its
own." PR18 Unit 5 is the work that seam was left for.

**Bundle 3 is deliberately large (25 nodes).** Nothing invokes any of it while
paused, so the cost of bundling is not a broken window — it is that the first
fleet start after resumption becomes a single pass/fail boolean. Mitigate that
with a **staged resumption** rather than by splitting: remove the sentinel with
`max_concurrent_workers: 1`, walk one node through the full ladder, and only
then restore normal concurrency. That converts the boolean into a diagnosable
test and is worth more than any split. Note that the resumption is the *end* of
this plan, not a midpoint — per ground rule 4 it happens after the last PR here
has merged and its nodes are closed, so no bundle may be sequenced against it.

**PR8 Unit 3 is deferred outright.** It replaces the pause sentinel with a
config field — i.e. it rewrites the mechanism currently enforcing the freeze,
while the freeze depends on it. Land it during a deliberate, attended un-pause,
never mid-window.

### Recommended order

```
✅  Bundle 1           graph read/write path       SHIPPED fe0b1c4d (#3095)
0.  Bundle 0           retire the in-flight overhang   ← START HERE (2026-08-20)
1.  Bundle 1c          durable-layer write fence             (HOT)
2.  Bundle 1b          graph plumbing                        (HOT, toolchain)
3.  Bundle 2a          PR5a record-time main-qa routing      (before Bundle 2)
4.  Bundle 2           tick-path reconcilers + sweeps        (HOT, live)
5.  Bundle 4           instrument + finding surface          (unblocks 5, 2b)
6.  Bundle 2b          supersession representation           (needs PR4)
7.  Bundle 3           dispatch runtime                      (COLD, big)
8.  Bundle 5           RSI chain
9.  Bundle 5b          /align charter + adversarial review   (before rename)
10. Bundle 6           skill rename                          (last, alone)
11. Bundle 7           merge queue + scan cadence            (COLD, pre-resume)
--  staged resumption: sentinel off at max_concurrent_workers: 1, one node
--  deferred: PR8 Unit 3, during an attended un-pause
```

**Bundle 0 is new and displaces Bundle 1c from the front.** It opens no PR: it
lands four already-mergeable PRs, closes thirteen conflicting drafts whose nodes
fold into the sections above, sequences one node as its own PR, and restates that
the sentinel is held to the end (ground rule 4). It went first for one mechanical
reason — **#3037 deletes `dispatch-graph-census`, which is Bundle 1c's Unit 1
target** — and that reason is now discharged: step 1 was executed on 2026-08-20,
#3037 was deferred rather than closed, and Bundle 1c's Unit 1 was narrowed to the
site that survives. Full census and per-item disposition: §"In-flight work
outside this plan".

Bundles 3 and 4 can swap or overlap — they share no files. Bundle 4 comes before
3 only because Bundles 5 and 2b depend on it.

**The order redistributes rather than simply demoting the ladder.** PR2 (ladder
driver) drops sharply — it was second because everything ran through it, and
nothing runs through it now; only its Unit 6 is urgent, and that moves to
Bundle 2. PR5 (reconciler tick cost) rises: it reads as pure efficiency work for
a paused system, but `reconcile-graph-merged` is in the drain on every tick, and
PR5's base-pin unit prevents a **concurrently landed write being clobbered** — a
live risk precisely because `main` is still moving. PR8 Unit 1 rises too: the
pace-curve config is untracked and unrecoverable.

**Bundle 1b may be deferred but not skipped.** PR16 (the closure toolchain) is
worth landing at position 3 as shown. **PR15 carries an explicit hold**: the
ref-split disposition named it as the one PR its own Unit 2 rewrite would
subsume, and directed that the disposition be revisited before PR15 starts. PR16
does not share that exposure and may proceed independently of it.

**Bundle 5b must land before Bundle 6, and that ordering is not a preference.**
PR20 edits `.claude/skills/align-tactics/SKILL.md`; PR13 **renames that skill**
to `/dispatch-plan`. Running them in the other order orphans every path PR20
writes — the same failure this repo has already hit once, where a rename left
`verify` fences pointing at a deleted skill.

**Bundle 7 sits last deliberately, after the skill rename.** Everything in it is
dormant while the sentinel holds, and it must be in place before the staged
resumption — otherwise that resumption measures an unbounded scan cadence and a
silent merge veto instead of measuring the fleet. It is the only bundle whose
position is set by the resumption rather than by dependencies.

---

## Dependency order

```
PR1  graph read/write integrity (8)    ── ✅ SHIPPED fe0b1c4d (#3095), nodes closed
 │
 ├── PR18 durable-layer write fence    ── its blocked_by cleared WITH PR1 → ready
 ├── PR15 graph-commit simplification  ── same file as PR1; HOLD on ref-split revisit
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

## Read this before planning any of it: verify every "missing" claim

The graph says these four nodes are open. The code says otherwise. **Verify
before implementing — most of PR3 may be a bookkeeping pass, not an
implementation.**

| Node | Claimed missing | Actually on `main` |
|---|---|---|
| `tactic-audit-instrument-scoping` | `--session` / `--node` scoping | **Present** — `aggregate-usage.sh:22,34,42`; scope object emitted at `:1463,1488` |
| `tactic-audit-permission-friction` | permission-friction lens | **Present** — `lenses.permission_friction`, `aggregate-usage.sh:835` |
| `tactic-audit-cache-efficiency-lens` | cache hit-ratio lens | **Present** — `hit_ratio` emitted at `aggregate-usage.sh:1211` |
| `tactic-rsi-round-trips-lens-carrier` | `scriptable_round_trips` carrier | **Present** — `boot_preamble` block, `aggregate-usage.sh:1335` |

Genuinely absent, confirmed by zero matches in the instrument:

- `review_effort` / `effort_yield` → `tactic-audit-review-effort-yield-lens` is real work.
- `rsi_lane` → `tactic-rsi-lane-token-attribution` is real work.

**Close the four as Bundle 4's first unit, before any implementation.** For each,
read the node's success criteria against the cited anchor, then close with
`phase: done` and `execution.completion` set to the commit that actually shipped
it — recoverable with `git log -S` on the lens key rather than guessed.

Two residuals to **check rather than assume**, because they are the plausible
reason these nodes were never closed:

- `tactic-audit-permission-friction` has a `/fewer-permission-prompts` closing
  step that may be genuinely outstanding even though the lens ships.
- Whether every fleet-denominator lens carries the `fleet-only` tag; the
  vocabulary exists at `aggregate-usage.sh:1164,1463`.

**The root cause is in scope.** These nodes stayed open because the ledger read
path cannot see the write path — recorded as
`tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`.
Prioritize that unit inside Bundle 4; without it, the next four lenses drift open
the same way.

### Two stale-path classes, both larger than they look

**`dispatch-token-audit` — 27 files.** Node bodies name
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. That skill does
**not** exist on `main`; it was folded into `rsi-audit`, and the live path is
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh`. Measured repo-wide at 27
files, not the six visible from this plan's node set.

Fix it as a single mechanical sweep, one commit, folded into Bundle 4 so the
prose and the instrument anchors land together; then confirm `validate-graph.ts`
still reports zero unresolved prose refs. One caveat prevents a blind `sed`:
some citations are legitimately historical — `tactic-rsi-audit-skill-rename` is
`phase: done` and is *about* the fold, so its mentions are correct as written.
Rewrite citations that present the path as **live**; leave citations that narrate
the rename as history.

**`render-rsi-plan.ts` — 13 files, and one is a scope hole.** The script was
built in #3065 and deleted in #3074, deliberately, under its own retirement
node. The graph is **not** inconsistent about this: `tactic-rsi-plan-skill` is
`phase: done` and its deliverable was deleted, but the deletion has its own node,
`tactic-rsi-plan-render-retire`, also `phase: done`, whose statement is "Delete
rsi-plan.md, render-rsi-plan.ts and the render half of rsi.ts". That is a
correct history. **Do not reopen `tactic-rsi-plan-skill`.**

The finding that matters: of the 13 citing files, one uses the deleted script to
justify *not doing work*. `tactic-rsi-lane-token-attribution.md:127` is
`phase: null` — open, planned into Bundle 5 — and its **Reuse** section reads:

> `render-rsi-plan.ts` already renders the workflow split; it needs no change
> once the buckets are populated.

An implementer following that plan would populate the `rsi_lane` buckets and
discover nothing renders them. That is a scope hole in an open node's plan, not
stale prose — the node is under-scoped by exactly one renderer. **Fix the node's
Scope, not just its citation**, and do it before Bundle 5 is planned.

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

**The general lesson:** two skill consolidations (#3074, and the
`dispatch-token-audit` → `rsi-audit` fold) moved or deleted surfaces that ~10
open node bodies still address, and several lens nodes were satisfied without
their nodes being closed. **Re-verify every anchor and every "missing" claim
against the working tree before implementing it.** Roughly a third of the
apparent work in this scope may already be done.

---

## Decisions already taken

These are settled. They are recorded because later sections depend on them, not
as history to re-litigate.

### `graph-ref-split`: DEFER — it does not land before this plan

`tactic-graph-ref-split` (`status: codified`, `phase: implement`, 37 blockers)
replaces the CI-stamp/scratch-branch write mechanic with a plumbing-based CAS
push against `origin/graph-main`. A read-only decision session
(`tactic-graph-refsplit-blocker-audit`) ran on 2026-08-14 and found:

- **Its blocker list encodes quiescence, not dependencies.** Of the 23 open
  blockers, 8 have a mechanism relation to the ref layout; the remaining 15 have
  none beyond "must not be in flight during a one-sitting cutover" — a property
  of the *procedure*, not the design. A blocker list whose membership rule is
  "nothing may be in flight" never converges while the fleet mints tactics.
- **The cutover can be incremental.** Seed `graph-main` as a mirror and install
  the `intentions` symlink *while `main` still carries the directory*; no window
  exists in which a reader is broken. That dissolves the one-sitting constraint,
  and the blocker set should be re-cut to the 8 rather than waited out.

**Disposition: DEFER.** Ref-split does not land before this plan's bundles.

Its exposure to PR1 was narrower than first thought. Read against ref-split's own
delete/keep lists, only **U1 (far-ahead rebuild / `noop`) and U5 (ORPHANED rc
split)** are deleted by it; U2, U3, U4, U6, U7 and U8 all survive, and U6 and U8
are things ref-split *needs to exist first*. U1 and U5 shipped anyway as a
recorded accepted cost — U1 was the highest-severity item in the plan, and if
ref-split ever lands this code is *deleted*, not migrated, so nothing has to be
re-derived.

**PR15 is the PR genuinely at risk** — its Units 1–2 are subsumed by ref-split's
Unit 2 rewrite. Do not start PR15 before revisiting this disposition.

Three nodes are deferred with ref-split: `tactic-graph-ref-split` itself,
`tactic-graph-refsplit-blocker-audit` (the decision session, no diff), and
`tactic-graph-refsplit-read-coherence` (conditional on ref-split landing,
meaningless otherwise).

### The `SNAP_DIR` park contract: freeze plus `.merged.md`

`snapshot()` writes `$SNAP_DIR/<id>.md` and **never rewrites it**; the merge
paths write `$SNAP_DIR/<id>.merged.md`; every reader that wants "what this run
intended to land" — `ensure_intentions_only_base()`'s replay and `print_verdict`
— **prefers `.merged.md` when it exists**; `park_write()` names both paths and
labels which is the writer's own content and which is `graph-commit`'s partial
merge.

This reverses the narrower contract PR #2989 landed. The defect forcing the
reversal: a multi-id batch fails closed as a unit, so when id A's layer-3 merge
resolved and id B's did not, the recovery text points the human at
`SNAP_DIR/A.md` claiming it holds their unlanded content when it actually holds
a blend with a concurrent writer's landed one. Because the concurrent writer
chooses which field to touch, **they choose which of the losing writer's ids lose
their evidence** — accidental normally, targeted if that writer is adversarial.

PR1 shipped both halves: `snapshot()` is now the sole writer of `<id>.md`,
`snap_merged_file()` and `snap_intended_file()` exist (`graph-commit:1008`,
`:1010`), six readers were classified individually, and all **three** clobber
sites are redirected — including the one in `build_commit_plumbing()`
(`graph-commit:1650-1652`) that neither the node nor this plan had named.
`test-graph-commit.sh` case 48 stayed green, so the node's own "cannot build
without breaking tests" park was refuted before it was ruled on.

Candidate (c) of that contract — that a machine-local `mktemp` pointer cannot
durably hold the losing writer's content — **was not adopted** by PR1 and is
`tactic-graph-commit-park-content-durability`, now **PR18 Unit 5**.

### The explicit-ref read-path partition

Three co-extensive raw nodes claimed overlapping files. The partition:

| Node | Owns |
|---|---|
| `tactic-explicit-ref-graph-reads` | the required-explicit-argument contract + **exactly four files**: `validate-graph.ts`, `write-node.ts`, `dump-node.ts`, `clear-park` — **plus** its one bare caller, `.claude/skills/align/scripts/validate-deployment.sh:53` |
| `tactic-demote-node-stale-local-read` | `demote-node-to-implement` **alone** — and it does **not** close with the node above |
| `tactic-graph-read-at-ref-cli` | a new `storeAtRef` CLI; separable under any shape |

Out of scope: `transition-node` (claimed by `tactic-graph-ref-split`) and
`graph-commit` (a writer; its `-C`/cwd resolution is already ratified by
clarification 86). Already converted and not to be re-done:
`check-node-selection.ts:14-15`, `compute-freshness.ts`.

PR1 shipped the first row — four readers plus every caller — and left
`demote-node-to-implement` untouched.

### `demote-node-to-implement` is a reader **and** a writer, and is not PR1's

Its tree must be a required explicit argument, with no cwd default and no
script-location default, and `transition-node` updated in the same change to
pass it. The cwd fallback is not merely weaker here, it is **wrong**:
`transition-node` runs inside the worker's worktree, so the caller's cwd gives
the same wrong answer the script's own location gives today, while the demotion
must act on the main checkout.

This work belongs to `tactic-demote-node-stale-local-read`, which is **deferred**
— `blocked_by tactic-phase-evidence-fingerprint-bound` (`phase: qa`) — and was
never part of PR1. It remains `status: raw`, `phase: null`, `execution: null`.
**Do not close it against `fe0b1c4d`, and do not re-derive its plan from its
body:** its defect 3 is already fixed, its line citations have all moved, and the
remedy it prescribes for defect 1 does not fix its own defect. Re-derive from the
current file.

### The ephemeral Unit 4 diff is written off

A 36,973-byte patch (the deferred Unit 4 of
`tactic-attention-per-tier-boost-migration`) lived only in a deleted job dir.
Confirmed lost: the job dir is gone, no `*unit4*` / `*deferred*.patch` under
`~/.claude` or `/tmp/claude-1000`, `git stash list` empty, no matching branches,
the branch's 6 commits contain no Unit 4 commit and no revert, and 6 dangling
`git fsck` blobs contain zero hits for `BOOST_LEVEL_VALUES` / `legacyTierKey`.
**Do not spend a session hunting for it.**

What survives is more than it sounds: the finding node
`tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir` records the
scope precisely — validateGraph rule 22, the two legacy compat-branch deletions
in `validateAttention`, the now-unused `legacyTierKey`, and the `kind-kind.md`
field-doctrine prose. Re-implement it from the scope text as ordinary work in
Bundle 3, amend the finding node to record the loss as realized rather than
prospective (its body still says "this is a live opportunity to preserve it, not
a post-mortem"), and adopt its option 1 as the standing fix: **a
deferred-but-finished unit is committed to its branch and then reverted**, so git
history carries the diff permanently at zero cost. The enforcement half is
cheap — fail the escalation loudly when its recommendation cites a path under
`$CLAUDE_JOB_DIR`, a string check at the point the park is written. Both halves
belong in Bundle 3 alongside the escalation path they guard.

### PR6 stays gated on its office-hours sitting

The sitting `/office-hours tactic-review-sitting-code-review-lock-design` must
resolve a specific contradiction rather than merely bless the design: the flock
shipped in #3078, yet `tactic-eval-finding-detached-code-review-dies-with-launcher`
shows the detached child dies with its launcher anyway despite `setsid`. That
falsifies the lock's premise — **a lock held by a process that dies with its
launcher is not a lock** — and the current design is held on trust.

Sequence the units so detachment is fixed and *demonstrated* before the lock is
trusted: fix detachment (Unit 1), show a detached review surviving its launcher's
exit, and only then build on the lock (Unit 2). A useful framing to hand the
sitting: ask whether the lock should be held by the detached child at all, or by
a supervisor that outlives both. If the answer is the supervisor, Unit 2 changes
shape entirely — which is exactly why the sitting must precede the code.

### `strategy-discovered-requirements` is a separate charter

The `/align` charter split off `strategy-graph-native-dispatch`:

> The author's requirement is discovered under interview and recorded completely
> enough that the record alone carries it — `/align`'s charter: elicitation,
> capture-completeness, and **independent challenge of the draft**.

That last clause is the adversarial draft-review gate; its implementation node's
park cleared when the author ratified the caller-declared `--review` seam. It is
**PR20**. The split also partly discharges `tactic-review-dispatch-charter-split`
— `strategy-graph-native-dispatch` had 275 tactic children sharing one
defect-ratio signal. One charter is now split out; that sitting remains open for
whether more should be.

---

## Retention: the one forward-looking change

`aggregate-usage.sh` reads `$HOME/.claude/projects/**/*.jsonl` and selects its
window by **file mtime** (`find -newermt "$SINCE" ! -newermt "$UNTIL"`, `:1459`).
No `cleanupPeriodDays` is configured in either settings file, so Claude Code's
default retention applies — measured on 2026-08-14, the oldest surviving
transcript was exactly 31 days back, with nothing older.

**Raise `cleanupPeriodDays` past the window plus the post-resumption measurement
period**, so the ad-hoc sessions' own transcripts and the staged-resumption data
survive until PR7 and PR11 read them. If the window runs longer than the default
retention, the data those PRs need expires before they measure it.

**No archive of the pre-pause transcripts.** Preserving them would only matter if
a pre-pause measurement were worth having, and it is not: the ladder was not
working during that period — these PRs close roughly seventy findings observed in
exactly that window, in combinations that varied day to day — so a comparison
between a broken before and a fixed after is confounded past the point of use.
The right baseline is **forward**: the staged resumption (sentinel off at
`max_concurrent_workers: 1`, one node through the full ladder) is the first
trustworthy fleet data this repo will have. The forensic residual is small:
across the whole graph, 30 nodes cite a session UUID as evidence covering 23
distinct sessions; three of those transcripts are already gone
(`tactic-plan-view-hot-lineage-panel`, `tactic-plan-view-table`,
`tactic-test-decision-log-prod-leak`) and none of the three is in this plan's
scope.

**No measurement session before the first PR either.** `aggregate-usage.sh` is
versioned in git and takes `--since` / `--until`, so any historical window can be
recomputed later with any instrument version — `git show
<sha>:.claude/skills/rsi-audit/scripts/aggregate-usage.sh` into a temp file, then
point it at the data with `DISPATCH_AUDIT_PROJECTS_ROOT` (the override its own
test fixture uses, `aggregate-usage.sh:49,187`). Replaying the pre-PR3 instrument
against post-resumption data is the apples-to-apples pair, available at any time.
Two of the three audit nodes need no fleet data at all and move into the window
itself; only `tactic-dispatch-observation-masking` is fleet-shaped and waits for
the staged resumption.

| Node | Needs a working fleet? | When |
|---|---|---|
| `tactic-dispatch-cache-preserving-context` (`hit_ratio`) | no — a property of how sessions are constructed | during the window, on the ad-hoc sessions themselves |
| `tactic-rsi-measure-fanout-and-model-routing` | no — a property of this harness's routing | during the window, on the ad-hoc sessions themselves |
| `tactic-dispatch-observation-masking` | yes — fleet-shaped | at the staged resumption |

---

## Pre-PR sessions (no diff)

These sessions produce no code. Each is listed against the PR it gates, with the
prompt that starts it. **Run these before opening the PR they gate.** The full
prompts and merge prerequisites live in `plans/dispatch-rsi-pre-pr-sessions.md`.

| Run before | Node | Session prompt |
|---|---|---|
| PR6 | `tactic-review-sitting-code-review-lock-design` | `/office-hours tactic-review-sitting-code-review-lock-design` |
| PR7 | `tactic-dispatch-observation-masking` | `/rsi-audit 7d` then record the masking measurement on the node |
| PR7 | `tactic-dispatch-cache-preserving-context` | `/rsi-audit 7d` — read `hit_ratio` (shipped, `aggregate-usage.sh:1211`) and record the baseline before changing prompt-prefix handling |
| PR10 | `tactic-review-band-derivation-ratification` | `/office-hours tactic-review-band-derivation-ratification` |
| PR11 | `tactic-review-tradition-agentic-engineering` | `/office-hours tactic-review-tradition-agentic-engineering` |
| PR11 | `tactic-rsi-measure-fanout-and-model-routing` | `/rsi-audit 14d` — measure this harness's own fan-out and model routing before the catalog fixes a per-lens `model:` |
| PR16 | `tactic-sensor-deregistration-gate` | `/office-hours tactic-sensor-deregistration-gate` — rule between **(1)** a node-scoped fatal inside `guard` and **(2)** a post-merge check on `main`. Blocks PR16 Unit 10 only. Shape (1) puts a new `origin/main` read inside the job whose failure mode is repo-wide write denial — the 2026-08-14 outage — so this is a real risk decision, not a preference |
| PR19 | `tactic-review-supersession-derived-subpoints` | `/office-hours tactic-review-supersession-derived-subpoints` — ratify or overturn two Claude-derived sub-points of the supersession analysis |
| PR20 | `tactic-align-audit-legacy-review` | `/office-hours tactic-align-audit-legacy-review` — decide `/align-audit`'s inclusion of the two engines the `/align` consolidation retired |
| *(none — advisory)* | `tactic-review-dispatch-charter-split` | `/office-hours tactic-review-dispatch-charter-split` — whether more charters should split out of `strategy-graph-native-dispatch` |

Three of these are load-bearing, not ceremonial:

- **`review-sitting-code-review-lock-design`** ratifies a locking design the
  author currently holds **on trust, not verification** — and PR6 implements
  that design. Ratify first or PR6 may implement a refuted design.
- **`rsi-measure-fanout-and-model-routing`** exists because both imported
  findings were measured on configurations this repo does not run. PR11's lens
  catalog declares a `model:` per lens; setting those from unmeasured external
  numbers is the exact error the node was written to prevent.
- **`review-supersession-derived-subpoints`** ratifies two sub-points that
  **Claude derived, not the author** — that in-flight nodes get a supersession
  edge but no park, and that only a fully superseded node is parked. PR19 builds
  the edge and the terminal those two sub-points describe the behavior of. Ratify
  first, or PR19 encodes an unratified inference in the schema.

---

## Execution hazards this plan has already hit

These are not node work; they are things to know before starting any PR. Each
cost real time once already.

1. **`/code-review --fix` may write nothing.** In PR1 all six findings came back
   unapplied — "parent bg session hasn't isolated yet". The pass still *reports*
   as if it ran. Check that fixes actually landed in the tree before trusting a
   `--fix` run, and be ready to apply them by hand.
2. **`origin/main...main` = `0 0` is often unreachable, and usually does not
   matter.** Only the left number (unpushed local commits) is hazardous.
   `sync_main_checkout` uses `git -C`, which a worktree-isolated session
   **refuses** toward the primary checkout — so an isolated session cannot
   fast-forward `main` at all. Run closing batches from a fresh worktree cut at
   `origin/main` and verify *that* checkout is 0 ahead.
3. **An identical local test result is not evidence CI will pass.** PR1's review
   dismissed nine `test-park-node.sh` failures as pre-existing; measured against
   an `origin/main` scratch worktree the count was indeed identical — and
   `hook-tests` still went red in CI, for a different reason entirely. The two
   environments fail differently.
4. **`assert_absent` pins go vacuous when the literal they assert changes.**
   PR1 changed emitted `clear-park` text; a pin asserting the *old* string would
   have kept passing while asserting nothing. Re-pin `assert_absent` sites
   whenever you change emitted text — PR16 and PR18 both change emitted text.
5. **Four test harnesses emulate the merge inside a `PATH` shim.** See the
   warning in PR15 Unit 2 — that unit changes the spawn site and will orphan all
   four.
6. **A data migration and the schema tightening that rejects its pre-migration
   spelling cannot share a PR.** This document violates that rule in two places
   today (PR16 Unit 4, PR4 Unit 1), survivable only because PR1 Unit 4 fixed the
   `origin/main` data test — which is precisely the crutch the rule says not to
   lean on. The rule is PR20 Unit 8's work.
7. **The closing-write mechanics have seven hazards of their own** — the required
   `-C`, the `pushed=none context=noop` failure signature, the `--base` batch
   that must not carry a create, and four more. They are in §"Closing nodes after
   each merge"; read that section before the first closing batch, not after.

---

# PR1 — Graph write-path integrity ✅ SHIPPED — the baseline you build on

Merged as **`fe0b1c4d` — "pr1: graph write-path integrity (#3095)"**,
2026-08-15, all eight units. Its eight nodes closed to `phase: done` in
`1192d6f8` and `063b3df2`; two implementation-record notes landed in
`063b3df2`.

**This is not work.** It is an index of what the write path does now, kept
because later sections cite these units by number and because five of the eight
units define contracts the remaining PRs must not break. The design constraints
it shipped under are in §"Decisions already taken"; what it left undone is five
residual nodes, filed on `main` as `920492be` and routed to PR4 Unit 8, PR16
Units 9–11 and PR20 Unit 8.

| Unit | What shipped |
|---|---|
| 1 | `graph-commit` far-ahead rebuild no longer drops an edit to an existing node under a `landed context=noop` verdict; the false-landed guard compares the pre-reset blob |
| 2 | one unbound sensor name no longer denies every graph write repo-wide; the validator runs on the introducing push and the guard failure is node-scoped |
| 3 | `validateGraphProseRefs` resolves prose refs against the batch under write plus `origin/main` (but `batchIds` still has no caller — a residual, now PR4 Unit 8) |
| 4 | the `office-hours.test.ts` data assertions run against a fixture graph, so a PR may migrate node data and tighten the schema reading it |
| 5 | an ORPHANED check row is no longer misreported as a content failure; the orphaned case routes to a bounded re-push instead of abandoning the write |
| 6 | the merge path writes merge output to a distinct path, leaving `SNAP_DIR/<id>.md` immutable so park recovery text stays true |
| 7 | a merger that cannot *start* (`npx`/sandbox failure) dies as an environment error instead of parking every node; the `npx tsx` spawn was removed |
| 8 | graph reads take an explicit tree/ref — `validate-graph.ts` requires `<intentionsDir>`, `dump-node.ts`/`write-node.ts` require `--dir` — so a wrong-directory read can no longer pass vacuously |

`tactic-demote-node-stale-local-read` was removed from PR1's scope by
clarification 243, did **not** ship, and remains `phase: null`, deferred behind
`tactic-phase-evidence-fingerprint-bound`. Do not close it against `fe0b1c4d`.

---

# PR2 — Ladder driver: exit codes, halt telemetry, completion detection

**Recommended model: opus** — one 1544-line bash driver with overloaded exit
codes and two mirror-image probe bugs; changes interact.

> **Execution mode — ad hoc, NOT `/dispatch-ladder`.** Author ruling,
> 2026-08-19 office-hours sitting. This PR is implemented by hand; no ladder
> invocation drives any part of it, including the stranded-node recovery in
> Unit 7. The three office-hours parks that blocked it are cleared (landed
> `aee9b0cf`), and their rulings are folded into Units 3, 6 and 7 below.

### Context

Nine findings land on the same three scripts. The driver overloads exit codes
`0`/`2`/`10`, so `dispatch-ladder-run` branches by parsing stdout strings; the
halt path — the one that spawns the evaluator — emits neither timing fields nor
the failure cause it already holds; and the await probe both false-stalls and
false-succeeds depending on which rung it is on.

### Nodes closed (7 — two more already landed out-of-band)

- `tactic-dispatch-ladder-exit-code-space` *(the structural change; do first)*
- `tactic-eval-finding-halt-path-emits-no-timing-fields`
- `tactic-eval-finding-ladder-halt-drops-captured-cause`
- `tactic-eval-finding-ladder-ci-wait-swallows-blocked-node`
- `tactic-ladder-await-interrupt-rung-vacuous-advanced`
- `tactic-eval-finding-main-dirt-halts-ladder-as-violation`
- `tactic-eval-finding-terminal-without-disposition-dominates-clock`
  *(reduced to measurement — see Unit 6; the only implementable residual is the
  owed investigation, and it is unplanned)*

Already `phase: done` at `origin/main` as of `aee9b0cf`. **Do not re-implement
either one** — both shipped out-of-band and were closed by the 2026-08-19
office-hours sitting after re-verification:

- `tactic-ladder-await-phase-only-completion-test` — shipped as PR #3077
  (`execution.lane_pass`, `apply-lane-pass.ts`, the `--since` launch window).
  This retires **half of Unit 3**; see the unit.
- `tactic-ladder-terminus-owns-main-qa` — shipped as PR #3091 (`terminus.ts`,
  `ladder-terminus-census.ts`, the `ladder-terminus` sensor, the
  `dispatch-ladder-run` classification wiring). **Unit 7 is now the enforcement
  residual only**, and its scope item 2 is re-homed onto the new node
  `tactic-ladder-run-answerable-across-node-boundary` (blocked, out of this PR).

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
`.phase != "$FROM_PHASE"` at `:440` (verified). Two defects, same probe — **one
is already fixed**:

- *False stall — DONE, do not rebuild.* Shipped as PR #3077 and re-verified at
  `origin/main` on 2026-08-19: `Execution.lane_pass` and the
  `LanePass {at, lane, phase, sha}` interface in `schema.ts`, the orthogonal
  writer `apply-lane-pass.ts`, the `--since` window
  (`dispatch-ladder-await:292-339`), the `execution.lane_pass` probe inserted
  **after** the `.phase != FROM_PHASE` arm (`:456-461`), the lane-complete
  verdict at exit 0 (`:523-525`), and `dispatch-ladder-run`'s `PASS_SINCE`
  threading (`:1315`, `:1380`, `:1368`). Both producing lanes stamp
  (`dispatch-conflict/SKILL.md` Step 7b; `qa-fix/references/auto-fix-lane.md`
  item 6). Coverage is green: 7 `lane_pass` cases in
  `test-dispatch-ladder-await.sh` (48 passed) and 17 in
  `apply-lane-pass.test.ts`.
  **Load-bearing invariant a later editor must not undo:** the stamp is
  compared against a **launch window** (`--since`, seeded from `PASS_SINCE`
  captured *before* the advance), never read as mere presence — a
  merely-present stamp would mask a genuine stall at a later pass on the same
  phase. And it is a deliberately **orthogonal** field, not folded into
  `execution.fix` / `execution.conflict`, because those are live routing
  interrupts the selector re-dispatches on and a completion record must not
  double as a dispatch instruction.
- *False success — this is the whole of Unit 3's remaining work.* `fix` and
  `conflict` are awaited rungs that are not `Phase` members, so
  `.phase != "$FROM_PHASE"` is trivially true and `advanced` (`:443`) is
  returned unconditionally. The `review` carve-out at `:428` is the existing
  pattern to follow. There is a **producer-side half**: on the router's
  conflict-interrupt entry the selector's awaited rung is `conflict`, but the
  stamp passes the node's persisted phase, so phase equality cannot match —
  `dispatch-conflict/SKILL.md:1305-1312` records this as a known gap and
  assigns it here ("Whoever fixes that must make this call pass `conflict` on
  the interrupt path"). It costs nothing today *only because* the phase probe
  fires first and vacuously returns `advanced`; fixing the vacuous arm without
  the producer-side half converts a silent pass into a false stall.

> Stale cross-reference to ignore:
> `intentions/tactic-dispatch-ladder-exit-code-space.md` lists
> `tactic-ladder-await-phase-only-completion-test` under "await test coverage
> gaps". That note predates the shipped coverage and is **not** an outstanding
> obligation.

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

**Unit 6 — terminal-without-disposition: RULED OUT OF THIS PR, one
investigation only.** The measurement stands — neither phase declared a
node-terminal marker, so each finished phase stayed registered until the sweep
freed it, and 49.5% of a 9644s run elapsed after the work was already public.
But the remediation is **not** built here. Author ruling, 2026-08-19
office-hours sitting (shape (ii) of three):

- `dispatch-ladder-advance`'s **exit-13 refusal stands as designed.** Its
  guarding comment at `:165-203` — "auto-releasing another session's claim is a
  policy act, and this driver may sequence, never gate" — is ratified, not
  merely tolerated. Do not relax it in this PR or any other without a fresh
  ruling.
- **The marker work is routed to the per-skill declaration family** under
  `strategy-graph-native-dispatch`: `tactic-align-tactics-mark-terminal-skipped`
  (PR #3047, landed), `tactic-qa-fix-node-terminal-declaration`,
  `tactic-qa-main-node-terminal-declaration`. Building it here would record the
  same root-cause defect on a second tactic, which
  `strategy-recursive-self-improvement`'s own `success_signal` forbids in terms,
  and would put an orchestration repair under a strategy whose statement is
  "measurement, not a second orchestrator".
- **Knob-tuning is not a path.** The 300s `DISPATCH_TERMINAL_DISPOSITION_GRACE_S`
  floor was not the dominant term: 3092s of the 4290s align-tactics block
  elapsed with the phase finished and *no actor at all*, and the invalid-state
  lane then burned a further 1196s on a node whose work was already at
  `origin/main`. The dominant term is the sweep's **invocation cadence** once
  the driver had halted (falling back to the fleet tick's ~15-minute heartbeat)
  plus the invalid-state hop.

**What remains in scope here is one investigation**, owed regardless of shape
and cheap: establish which write path the 2026-08-14 align-tactics round
actually took. `land-align-round --terminal` shipped 2026-08-05 and
`align-tactics/SKILL.md:353-380` already mandated the marker, so this is **not**
a missing-instruction gap. Live candidates: an exit-12 no-claim path; a
`graph-commit` park whose own push failed (documented as writing no marker **by
design**); a batch/strategy-mode land; or a session that died before reaching
the land at all. This investigation is **unplanned** — run
`/align-tactics tactic-eval-finding-terminal-without-disposition-dominates-clock`
before implementing it.

**Unit 7 — terminus: enforcement residual only.** The instrument already
shipped as PR #3091 (merge `de347430`, 2026-08-14) and
`tactic-ladder-terminus-owns-main-qa` is now `phase: done` crediting it:
`packages/intentionsutil/src/terminus.ts` (`classifyTerminus`,
`ladderTerminusCensus`, `findUnstructuredWaits`),
`packages/intentionsutil/scripts/ladder-terminus-census.ts`, the
`ladder-terminus` sensor in `read-sensors.ts`, and `dispatch-ladder-run`'s
`classify_terminus` / `classify_absent_node` / halt wiring with 48 shell
assertions. **Do not rebuild any of it.** Two things moved out; what is left is
enforcement, folded into this PR by author ruling on 2026-08-19:

*Out of this PR entirely.* The original scope item 2 — "the requirement follows
the work, not the node", making a run answerable for spawned main-qa work
**across a node boundary** — is re-homed onto the new node
`tactic-ladder-run-answerable-across-node-boundary`, `blocked_by`
`tactic-mainqa-record-time-routing` — which is **no longer raw**: it was
finalized to `phase: implement` on 2026-08-20 (`fcb792af`) carrying a
seven-unit plan in its own node body, and is itself `blocked_by`
`tactic-wait-calendar-release` — whose PR **#3051 merged 2026-08-20**
(`38934c61`), so that edge is now stale-but-written rather than live. It is **no
longer "out of this plan"**: Bundle 0 step 3 sequenced it in as **§PR5a**,
ahead of PR5. See PR5a's Dependencies, and the file-collision note under PR5's
Dependencies for the one place its scope touches this plan's. That is the
governing rule from PR #3091's own "Not in this PR" section: *no cross-node
machinery is built while no caller can exercise it.*

*In this PR, executed ad hoc.* `ladder-terminus-census.ts --strict` is wired
into nothing today, by the script's own deliberate choice, and the node's
recorded threshold of **0 violations** is unmet. Baseline re-measured
2026-08-19 at `origin/main`: `merged-not-done=29 excused=24 violations=5`, plus
2 unstructured waits. Sequence:

1. **Recover the three plain stranded nodes by hand.** They involve no wait at
   all — `tactic-align-tactics-mark-terminal-skipped` (#3047),
   `tactic-dependency-justification-audit` (#2875),
   `tactic-graph-commit-landing-signal-unreliable` (#3050), all sitting at
   `phase: main-qa`. **Do not invoke `/dispatch-ladder` on them** — the author's
   ruling for this PR is ad-hoc execution throughout, notwithstanding
   clarification 232's corollary that the ladder would pick each up wherever it
   stands. This moves the observable 5 → 2.
2. **Then decide the two remaining prose waits**, which is the whole of
   clarification 232's open question and is much sharper once step 1 lands:
   - `tactic-attention-namespaced-rank` names a real node
     (`tactic-attention-per-tier-boost-migration`) and **is expressible as a
     `blocked_by` edge today**, no new machinery.
   - `tactic-pause-disables-merge-lane` awaits an **episode** — a heartbeat tick
     with the pause sentinel present and a reviewed green node-lane PR pending
     merge. That is neither a node nor a calendar deadline, so neither
     `blocked_by` nor `tactic-wait-calendar-release`'s `wait_until` shape fits.
     Inventing a shape for it deserves its own tactic, not a unit here — so for
     this one take clarification 232's recorded escape: **the sensor stays
     approximate and says so**, which means `ladder-terminus-census.ts` states
     the approximation in its own output rather than leaving readers to infer
     it, and this node's `success_signal` threshold is amended off 0.
3. **Only then wire `--strict`** — it is gated on step 2's answer.

**Two invariants bound every option here** (both carried in the shipped code's
doc comments, and restated in the node's clarifications so a later reader does
not undo them): `classifyTerminus` requires a **strict** enumeration
(`listNodesStrict`, `terminus.ts:46-55`) because it and `router.ts`'s
`blockersComplete` fail open in *opposite* directions on a missing `byId` entry;
and `findUnstructuredWaits` must **never** feed back into `classifyTerminus` to
reclassify a prose wait as excused (`terminus.ts:153-162`). Closing the wait gap
means converting prose to real `blocked_by` edges — **never** loosening the
predicate.

Re-measure with
`npx tsx packages/intentionsutil/scripts/ladder-terminus-census.ts intentions --lint`
before and after, rather than citing any stored figure.

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

> **In-flight overhang (2026-08-20).** Class B, no PR:
> **`tactic-review-lows-automation`** — the 2026-07-05 review lows on the live
> surface (CI-wrapper false-green patterns, hook edge defects, `fetch-*`
> error-helper dedup), touching `aggregate-usage.sh`, `dispatch-reclaim-audit`
> and `lib.sh`. See §"In-flight work outside this plan".

**Recommended model: sonnet** — mostly additive jq lenses in one script, with
one `find` predicate fix. Escalate to opus only if Unit 1 finds the scoping
work genuinely incomplete.

### Context

The instrument is `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` (1547
lines). Three of its lens nodes are already shipped and only need verification
and closing; two lenses are genuinely missing; and three findings say the
instrument is blind to the very workers it is meant to measure.

### Nodes closed (10)

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
- `tactic-review-lows-automation` *(folded in 2026-08-20, Bundle 0 step 6)*

> **The folded node lands on this PR's exact surface** — `aggregate-usage.sh`,
> `dispatch-reclaim-audit` and `lib.sh`, the three files this PR already edits.
> No new surface, so it costs a unit rather than a PR.

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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
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

### Nodes closed (7)

- `tactic-eval-finding-ledger` *(doctrine + migration; do first)*
- `tactic-finding-search-all-producers`
- `tactic-eval-finding-in-flight-guard-permanent-after-execution-completes`
- `tactic-eval-finding-list-reads-working-tree-stale-after-plumbing-land`
- `tactic-eval-finding-skipped-locked-exit-zero-chained-caller-proceeds`
- `tactic-duplicate-finding-sensor` *(blocked_by the first — do last)*
- `tactic-graph-prose-ref-batch-wiring` *(Unit 8 — PR1 residual)*

> **Unit 8's node was filed after the fact**. PR1's closing batch could
> not carry a `create` (see the `--base` hazard in §"Closing nodes after each
> merge"), so it landed separately on `main` as `920492be`. It is `owner: ai`,
> `status: raw`, unparked and unblocked.

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

**Unit 8 — wire `batchIds` to a real caller**.
PR1 Unit 3 taught `validateGraphProseRefs` to resolve a prose ref against the
ids of the batch under write, so a node may cite a sibling the same batch is
minting. **The library half landed; no caller passes it.** Verified on
`063b3df2`: `batchIds` appears only inside
`packages/intentionsutil/src/schema.ts` (declared `:1633` with the default
`new Set<string>()`, read at `:1643`/`:1648`/`:1668`), and the sole production
caller — `packages/intentionsutil/scripts/validate-graph.ts:206` — passes four
arguments, so the parameter takes its empty default on every real invocation.

The failure this leaves open is **cross-invocation**, and it is on this PR's own
surface: `/rsi` calls `dispatch-eval-finding` **once per finding**, so each
minted node is written by a separate `graph-commit`, and a node citing a sibling
minted moments earlier by a different invocation still fails to resolve. PR1
closed against the within-invocation case only — `graph-commit` already stages
every id of a single invocation, which is why that half was already working
before PR1 touched it.

Scope: give `validate-graph.ts` a `--batch <id[,id…]>` flag that feeds the fifth
argument, and have the write path declare the ids in flight when it invokes the
validator. Land it here because Unit 3 collapses the five private follow-up
writers into **one** surface every producer calls — that surface is the only
place that knows the whole set of ids a producer run intends to mint, and
therefore the only place a `--batch` declaration can be honest. Wiring it before
Unit 3 would mean teaching five writers the same thing and then deleting four.

> **File the node first.** This residual has no node: it was found during PR1's
> review, and PR1's closing batch could not carry a `create` (see the
> `--base` hazard in §"Closing nodes after each merge"). The affected node,
> `tactic-eval-finding-eval-finding-forward-crossref-fails-ci`, closed with an
> implementation-record note stating the library half landed and the caller half
> did not — so the record is honest, but the remaining work is **unrepresented
> in the graph** until this node is filed.

### Dependencies

PR1. Units 1 → 2 → 7 internally. Unit 8 after Unit 3.

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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: after the migration, confirm `grep -rl 'ledger_entry' intentions/`
returns nothing, and that `graph-census-debt` still exempts every node carrying
`measured_impact` from its prunable set (compare prunable counts before/after —
they must be equal).

---

# PR5a — Record-time main-qa routing

*Added 2026-08-20 by Bundle 0 step 3. This node was never in the plan's scope —
it was `phase: implement` on 2026-08-14, so the `phase: null` filter excluded it
(§"In-flight work outside this plan", class B).*

**Recommended model: opus** — seven units, and the core of it is a correctness
change to where post-merge verification work is *filed*, not a mechanical edit.

### Context

`/qa-fix` records post-merge verification work as a **residue section appended to
the source tactic's body**. The routing unit is therefore the source tactic,
which has exactly one destination — so the record-time triage that
`needs-main-followups.md` already mandates cannot be expressed at all. The fix
makes the destination the unit: `/qa-fix` mints standalone `tactic-mainqa-*`
nodes grouped by destination, and the source goes `review → done` instead of
carrying residue forward.

### Nodes closed (1)

- `tactic-mainqa-record-time-routing`

### Scope

**The plan of record is the node body**, not this section. It is not a draft: it
was finalized to `phase: implement` on 2026-08-20 (`fcb792af`) and carries a
complete seven-unit plan with `Context`, binding author rulings, a target design,
`Reuse`, and a `Verification` section with auto-runnable fences. Read it at
`intentions/tactic-mainqa-record-time-routing.md`:

| Unit | Heading in the node body |
|---|---|
| 1 | `src/mainqaRouting.ts` — the pure routing decision |
| 2 | `mint-mainqa-nodes` — the landing half |
| 3 | `.claude/rules`-conformant prose lint pass on the new script |
| 4 | the reconciler must not absorb a node already at `main-qa` |
| 5 | `/qa-fix` Step 3.6 node lane — mint destination nodes instead of appending residue |
| 6 | `/qa-main` node lane — the target is the verification node |
| 7 | migrate the live `Verifiability: WAIT` marks (Ruling 3) |

The body also carries an explicit **"Out of scope — named follow-ups (Ruling 4)"**
section. Honour it: those follow-ups are not this PR's work.

### Dependencies

**PR15 and PR16** (Bundle 1b) land first — this PR runs node writes through the
closure toolchain, and Unit 4 edits a reconciler. It goes **before PR5**, which
is the one deliberate ordering choice here.

> **`blocked_by` is still written, and is stale.** The node carries
> `blocked_by: [tactic-wait-calendar-release]`. That blocker's PR, #3051,
> **merged 2026-08-20** (`38934c61`), moving it to `phase: main-qa`. The edge
> clears when the reconciler runs, not by hand — so expect to see the node
> *edge-blocked on paper and unblocked in substance*. Do not hand-edit the edge;
> do not wait on it either.

### Reuse

The node body has its own `Reuse` section (line ~702) naming the existing
helpers. Two facts from outside it that matter, both consequences of #3051's
merge: `--dir` is now **required** on `write-node.ts` and `dump-node.ts`, and
`graph-census-debt.ts`, `schema.ts`, `router.ts` and `dispatch-tick` all moved.
Re-locate every anchor before editing.

### Verification

Use the node body's own `Verification` section — it splits `Auto-runnable`
(line ~787) from `Manual / observe-in-production` (line ~843). Do not invent a
replacement.

### Closing the nodes

One node, closed by the standard post-merge write in §"Closing nodes after each
merge". Sequencing note: it is `phase: implement` today and **is not to be driven
through the ladder** — ground rule 1 applies to it exactly as to every other node
in this plan.

> **File collision with PR5 — land this one first.** Unit 4 edits
> `reconcile-graph.ts` (`:139-141` / `:175`) and
> `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged` (`:135`),
> both of which PR5 also touches. The concerns are disjoint — correctness here,
> tick cost there — so either order works, but the second one rebases. This is
> the smaller diff, so it goes first. See PR5's Dependencies note.

---

# PR5 — Reconciler tick cost

> **In-flight overhang (2026-08-20) — this PR is the second-most exposed.** Two
> open drafts rewrite `reconcile-graph-review-stall`, which is this PR's *entire*
> scope surface, and they conflict with each other:
> **#3002** (`tactic-autonomous-ci-pending-liveness-bound`) — adds a CI-pending
> strike counter and a new `CI_STALL_IDS` hold block, i.e. it *adds* per-tick
> `gh` calls and subprocess work to the file this PR exists to make cheaper.
> **#3064** (`tactic-graph-review-exclusion-stall-recovery-main-qa-regression`)
> — hunks at 42/59/98/221 of the same file. Close both and absorb their nodes so
> one PR converges all three concerns. See §"In-flight work outside this plan".
> #3018's conflict-lane work (absorbed into PR8) must be coordinated with this
> PR's own conflict-lane unit — one policy, not two.

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

> **File collision, not a dependency — `tactic-mainqa-record-time-routing`.**
> That node is outside this plan and lands as its own PR, but its Unit 4 edits
> the same two files this PR touches: `reconcile-graph.ts` (its `isOpen` and
> pass-1 enumeration at `:139-141` / `:175`, against this PR's retention-scan
> work at `:186`) and `.claude/skills/dispatch-propagate/scripts/reconcile-graph-merged`
> (its inline `open` set at `:135`, against this PR's shared-enumeration
> refactor). The concerns are disjoint — correctness there, tick cost here — so
> either order works, but whichever lands second rebases over the other.
> **Do not fold that node into this PR:** it is `blocked_by`
> `tactic-wait-calendar-release` (PR #3051, an open draft outside this plan),
> and absorbing it would gate this PR on that draft while raising a
> five-efficiency-fix sonnet PR to an opus correctness change.
>
> **UPDATE 2026-08-20 — the gating half of that reason is gone; the ruling
> stands on the other half.** #3051 **merged** at 16:31 (`38934c61`), so
> `tactic-wait-calendar-release` is now `phase: main-qa` and absorbing
> `tactic-mainqa-record-time-routing` would no longer gate this PR on an open
> draft. Two things follow, and neither reverses the "do not fold":
>
> - The **`blocked_by` edge is still written** on
>   `tactic-mainqa-record-time-routing` — the wait node is at `main-qa`, not
>   `done`, and the reconciler clears the edge, not a hand edit. Treat the node
>   as unblocked in substance and still edge-blocked on paper.
> - The **model argument survives intact**: folding a seven-unit opus
>   correctness change into a five-fix sonnet efficiency PR is still the wrong
>   trade. Keep it a separate PR — it is now simply an *unblocked* one, so it
>   can be sequenced deliberately rather than waited on. **Done — it is now
>   §PR5a**, Bundle 2a, immediately ahead of this PR, so the rebase cost falls on
>   the smaller diff. See §PR5a and Bundle 0 step 3.
>
> Also note #3051's merge moved this PR's own anchors: it touched
> `graph-census-debt.ts`, `schema.ts`, `router.ts` and `dispatch-tick`, and made
> `--dir` **required** on `write-node.ts` / `dump-node.ts`. Re-locate before
> editing.

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

> **In-flight overhang (2026-08-20).** Class B, no PR:
> **`tactic-review-code-review-invocation-contract-main-qa-regression`** —
> corrects the recorded `dispatch-code-review` invocation contract (whether
> `--comment` is always passed, and whether the built-in `/code-review low --fix`
> pre-stage runs to completion). This PR owns that script. See §"In-flight work
> outside this plan".

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

### Nodes closed (5)

- `tactic-eval-finding-detached-code-review-dies-with-launcher`
- `tactic-code-review-detached-node-lock`
- `tactic-dispatch-code-review-concurrent-write-attribution`
- `tactic-dispatch-code-review-reject-pattern-self-match`
- `tactic-review-code-review-invocation-contract-main-qa-regression` *(folded in 2026-08-20, Bundle 0 step 6)*

> **The folded node is a record correction, not a code change — but do not skip
> it.** It corrects the *recorded* `dispatch-code-review` invocation contract:
> which of `--comment` / `--no-comment` is actually passed, and whether the
> `/code-review low --fix` pre-stage runs to completion. PR6 owns that script, so
> this is the one PR where the recorded contract and the real one can be
> reconciled in the same change. It is a `main-qa` regression node: the code it
> describes **already merged** (#3007, 2026-08-03) — what never happened is the
> post-merge verification. Verify against the merged behavior, then correct the
> record; do not re-implement.

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

> **In-flight overhang (2026-08-20) — this PR gains the most nodes.** Class A:
> **#3057** (`tactic-bounded-work-in-progress`, `dispatch-config-load:342-344`)
> and **#3018** (`tactic-conflict-lane-exit11-retry-bound`,
> `dispatch-tick:266-300` — coordinate the lane policy with PR5). Class B, no PR
> and no branch: **`tactic-select-tick-main-sync-gated-on-caller-cwd`** (the sync
> is gated on the caller's cwd, so one stray dirty file wedges every writer — and
> it is on the *paused-tick* path, so it is hot now),
> **`tactic-worker-self-close-configurable`** (the `dispatch-stop.sh` half
> coordinates with PR12), and **`tactic-dispatch-config-template`** (records the
> `dispatch.config/` instance-repo convention). See §"In-flight work outside this
> plan".

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

### Nodes closed (6)

- `tactic-dispatch-config-untracked-pace-curve`
- `tactic-target-workers-max-silent-corrupt-fallback`
- `tactic-dispatch-pause-config-field`
- `tactic-select-tick-main-sync-gated-on-caller-cwd` *(folded in 2026-08-20, Bundle 0 step 6)*
- `tactic-worker-self-close-configurable` *(folded in 2026-08-20 — `dispatch-stop.sh` half coordinated with PR12)*
- `tactic-dispatch-config-template` *(folded in 2026-08-20)*

> **Three class-B folds, all on this PR's config surface.**
>
> - **`tactic-select-tick-main-sync-gated-on-caller-cwd`** — `dispatch-select-tick`
>   gates its main-checkout sync on the **caller's cwd**, so a single stray dirty
>   file wedges every writer. This one is **on the paused-tick path**, so unlike
>   the rest of this PR it is *hot*: it can bite during the freeze, not only at
>   resumption. Reconcile it with `sync_main_checkout`'s own requirement that
>   tree-updating git ops run with the sandbox override
>   (`.claude/rules/sandbox.md`).
> - **`tactic-worker-self-close-configurable`** — the `dispatch-config-load` half
>   belongs to this PR's Unit 3; the `.claude/hooks/dispatch-stop.sh` half
>   overlaps PR12's surface. **Do not split the policy across two PRs** — decide
>   here, and have PR12 consume the field rather than re-deriving it.
> - **`tactic-dispatch-config-template`** — records the `dispatch.config/`
>   instance-repo convention: tracked human-edited config versus gitignored
>   machine-written artifacts. This is the config PR, so the convention is
>   documented here or nowhere.

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

> **In-flight overhang (2026-08-20).** **#3052**
> (`tactic-reap-safety-behind-branch-false-positive`) is **`MERGEABLE` today** and
> shifts three of Unit 1's anchors (`lib-session-reap.sh:286-291`, `:374`,
> `:548`). It is the cheapest item on the board — **land it** (Bundle 0 Step 2)
> and re-locate, rather than absorbing it. Class A absorb: **#3056**
> (`tactic-graph-execute-fresh-main-read`) into Unit 3
> (`provision-node-worktree:113`, `test-provision-node-worktree.sh`).

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
it.** ~~Recover the stranded diff.~~ **The diff is gone — see §"The ephemeral
Unit 4 diff is written off" for the six checks that established it** (job dir
deleted, no stash, no branch, no Unit 4
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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
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

> **In-flight overhang (2026-08-20).** Class A: **#2993**
> (`tactic-qa-main-park-base-cas`) — `.claude/hooks/dispatch-stop.sh` is named
> verbatim in this PR's Scope. Class B: **`tactic-dispatch-stop-backstop-comment`**
> (parked; one stale comment at `dispatch-stop.sh:62-63`, now that `graph-commit`
> is far-ahead-safe). Fold both — see §"In-flight work outside this plan".

**Recommended model: opus** — extracting a shared core from four lanes.

### Context

Four invalid-state lanes duplicate evaluation logic. Extract the shared
evaluation core and make each lane a thin selector over **core + lens catalog +
the one write surface**, adding a variance-debugging lens and a closed
remediation list declared in its own frontmatter.

### Nodes closed (2)

- `tactic-rsi-intervention-special-cases`
- `tactic-dispatch-stop-backstop-comment` *(folded in 2026-08-20, Bundle 0 step 6)*

> **The folded node is one stale comment** at
> `.claude/hooks/dispatch-stop.sh:62-63` — trivial, and homed here only because
> this is the first PR in the order that touches the file. If PR8's
> `tactic-worker-self-close-configurable` fold lands its `dispatch-stop.sh` half
> first, fix the comment there instead and close this node from that PR. Either
> home is correct; two homes is not.

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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual: drive one invalid state per lane and confirm each produces the same
remediation as before the extraction.

> **Hook edit warning:** this touches `.claude/hooks/dispatch-stop.sh` — run
> **all** `hooks/test-*.sh` suites.

---

# PR13 — Dispatch skill family rename

> **In-flight overhang (2026-08-20).** Class A: **#2946**
> (`tactic-node-ancestry-context`) edits eight skill bodies — `align-tactics`,
> `align-strategy`, `implement`, `fix-checks`, `office-hours`, `qa-fix`,
> `qa-main`, `review-fix` — every one of which this PR renames by path. There is
> no other home for it that does not guarantee a conflict with the rename.
> Also sequence **`tactic-legacy-office-hours-entry-removal`** (class B, no PR)
> *after* this PR or after the plan: it deletes the legacy label-lane entry
> surface and the legacy `<issue-num>-<slug>` worktree lane, moving anchors under
> PR9, PR16 and PR20 at once.

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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
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

# PR15 — `graph-commit` structural simplification

> **In-flight overhang — FOLDED 2026-08-20 (Bundle 0 step 6).** All three
> class-B absorptions are now in this section, not pending:
> **`tactic-node-merge-list-removal-loss`** → **Unit 0** (numbered 0 because it
> is the one *correctness* fix here and must survive a split);
> **`tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression`**
> and **`tactic-flake-hook-tests-graph-commit-fixture-clone`** →
> §Verification. Node count 4 → 7.
>
> **Correction to the anchor warning:** #3037 is **not** absorbed into PR18 — it
> was deferred to class A3 on 2026-08-20 (Bundle 0 step 1). It still edits
> `graph-commit` (+12/−5), so it still shifts this PR's anchors — but it now
> lands *after* this plan, which means **this PR's anchors are stable and #3037
> rebases over PR15**, not the reverse.

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

> **HOLD — this is the PR the ref-split disposition named as genuinely at risk**
> The 2026-08-14 audit disposed **DEFER**, and PR1 proceeds
> under it — but it singled this PR out: "**PR15 is the PR genuinely at risk**:
> its Units 1–2 are subsumed by ref-split's Unit 2 rewrite. Do not start PR15
> before revisiting this disposition."
>
> The disposition also carries a rider that could change the answer: ref-split's
> cutover **can** be made incremental (seed `graph-main` as a mirror and install
> the `intentions` symlink while `main` still carries the directory), and its
> blocker set should be **re-cut from 23 open to the 8 with a real mechanism
> relation** rather than waited out. If that re-cut happens, ref-split becomes
> reachable inside this window and Units 1–2 here should not be written at all.
>
> Units 3–4 carry no such exposure and could be split out if PR15 stalls.

### Nodes closed (7)

- `tactic-graph-commit-plumbing-default`
- `tactic-graph-commit-direct-three-way-merge`
- `tactic-graph-commit-invocation-classifier-bypass`
- `tactic-graph-commit-noop-shortcircuit-head-behind`
- `tactic-node-merge-list-removal-loss` *(folded in 2026-08-20, Bundle 0 step 6 — Unit 0 below)*
- `tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression` *(folded in 2026-08-20 — Verification)*
- `tactic-flake-hook-tests-graph-commit-fixture-clone` *(folded in 2026-08-20 — Verification)*

### Scope

**Unit 0 — the layer-2 field merge must be able to express a REMOVAL.**
*Folded in 2026-08-20 (Bundle 0 step 6) from `tactic-node-merge-list-removal-loss`.
It is numbered 0 because it is a **correctness** fix and the rest of this PR is
simplification — if PR15 is ever split or stalled on the ref-split hold, this
unit ships anyway.*

`graph-commit`'s layer-2 merge shells out via `run_merge_node()` to
`packages/intentionsutil/scripts/merge-node.ts:83`, which delegates to
`packages/intentionsutil/src/node-merge.ts`. The list merge is a **base-free
union**, so it has no way to distinguish "this entry was never here" from "this
entry was deliberately deleted". A removal that meets a concurrent land is
therefore **silently reverted, and `graph-commit` exits 0 reporting a clean
layer-2 auto-resolve.**

- **Not a race in the usual sense.** The union rule is base-free, so the
  restoration is **deterministic** for any removal that meets a concurrent land.
- **`--base` does not save you.** The node's own scope says so explicitly, and
  names the two call sites that already pass `base` — layer 2 at
  `graph-commit:688` (stage `:1:`) — which is why passing it is not the fix.
- **The affected fields are wider than "blocked_by/serves".** The node's
  statement names `blocked_by`, `serves`, **`validates`**, *and* an
  **`attributes`-key deletion**. Treat all four as in scope.
- **Observed in production**, 2026-07-25, on `tactic-align-tactics-workflow`
  (PR #2931): one write set `office_hours: null` **and** removed a satisfied
  `blocked_by` edge; the null applied, the edge came back, exit 0. The drain
  session only caught it by independently re-reading `origin/main` on its own
  verification step, then had to rebuild the node and land a second commit — so
  a "single atomic graph operation" took two.

**The plan of record is the node body**, which carries two units, a settled
design decision, an explicit *"What is deliberately NOT in scope"* section, and
a *"Citation drift in the node's own rationale"* section correcting several of
its own anchors. Read it before touching anything:

| Unit | Heading in `intentions/tactic-node-merge-list-removal-loss.md` |
|---|---|
| 1 | base-aware three-way list and attributes-key merge |
| 2 | direct-import coverage for the merge-node CLI round-trip — `merge-node.ts` has **zero** test coverage today |

> **Why this outranks everything else on this page.** Roughly a hundred node
> closures in this plan run through that merge, and §"Closing nodes after each
> merge" tells you to close nodes by editing exactly the fields this defect
> reverts. Until Unit 0 lands, every closure that removes a `blocked_by` edge
> while another writer is landing can silently un-remove it **and report
> success** — the plan's bookkeeping would then be quietly wrong in a way no
> verdict line shows. Its `office_hours` park is a stale `provision-node-worktree`
> exit-2 from 2026-07-31: clear the park, do not re-provision.

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

> **This unit will break four test harnesses, and they fail in a way that does
> not reproduce locally** *(learned the expensive way in PR1)*.
> Four suites emulate the three-way merge inside a **`PATH` shim**, keyed on the
> exact command `graph-commit` spawns:
> `packages/intentionsutil/scripts/test-{graph-commit,park-node,transition-node,demote-node-to-implement}.sh`.
> PR1 Unit 7 changed that spawn from `npx tsx merge-node.ts` to
> `node --import tsx/esm merge-node.ts` and orphaned the emulation in three of
> them; each was found separately, and the third only after CI went red on a
> job that had not run on the previous commit. **Changing the call site — which
> is exactly what this unit does — orphans all four again.**
>
> Two properties make this trap expensive. First, the failure is **CI-only**:
> those suites already fail locally for an unrelated host reason, so an
> identical local pass/fail count against `origin/main` is *not* evidence the
> change is safe. Second, the pre-PR1 code treated a merge tool that could not
> start as an ordinary content divergence and **parked**, so the emulation
> breaking used to look like a passing test. Update all four shims in the same
> commit as the call-site change, and confirm `hook-tests` is green — not just
> `unit-tests`.

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

**Unit 0** needs a verification the suite above cannot give: a *concurrent*
removal. Construct it directly — build base/ours/theirs fixture nodes where
`ours` deletes a `blocked_by` entry and `theirs` edits an unrelated field, run
the merge, and assert the entry stays deleted. The node body's Unit 2 specifies
this as an exported `mergeNodeFiles(...)` direct-import test
(`packages/intentionsutil/test/merge-node-cli.test.ts`); prefer that to a shell
harness, because `merge-node.ts` has **zero** test coverage today and a
round-trip test is the thing actually missing.

**Two class-B `test-graph-commit.sh` defects fold into this section**
*(2026-08-20, Bundle 0 step 6)*. This PR runs that suite hardest, so it is the
right place to fix them, and both are verification-integrity defects rather than
product defects:

- **`tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression`**
  — `test-graph-commit.sh` case *numbers* cited in a merged PR body drifted when
  an unrelated commit inserted cases ahead of them. The citations now point at
  the wrong cases. Re-anchor them, and prefer case *names* to ordinals so the
  next insertion cannot repeat it.
- **`tactic-flake-hook-tests-graph-commit-fixture-clone`** — fixture clones race
  source-side git object relocation, and **one clone failure cascades into 11
  misattributed failures**, so the suite blames cases that are fine. That
  matters here beyond flake-cleanliness: this PR's Unit 2 warning says a
  CI-only, non-locally-reproducing failure in these harnesses already cost PR1
  dearly. A cascade that misattributes 11 failures is precisely what makes that
  trap expensive to diagnose. Fix the cascade before relying on the suite to
  judge Units 1–2.

### Closing the nodes

After merge, for each of the 7 ids set `phase: done` and
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge").

---

# PR16 — Node-mutation scripts and schema validation

> **In-flight overhang (2026-08-20).** Three class-A absorptions and one class-B:
> **#3023** (`tactic-strategy-fingerprint-stamp-coverage`) — this plan already
> names it a hard dependency of Unit 8 ("confirm it has merged before starting
> Unit 8"). It is still an unmerged `CONFLICTING` draft, so **absorb it as a new
> unit ahead of Unit 8** rather than waiting on it.
> **#2975** (`tactic-phase-evidence-fingerprint-bound`) — also unblocks
> `tactic-demote-node-stale-local-read`, retiring one of this plan's six
> deferrals. **#2974** (`tactic-scope-fingerprint-plan-substance`) — same
> `transition-node` surface. Class B:
> **`tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression`**
> (`read-sensors.ts`, a merged unit never run against a clean clone).

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

### Nodes closed (12)

- `tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression` *(folded in 2026-08-20, Bundle 0 step 6)*
- `tactic-transition-node-needs-main-residue-clobbered`
- `tactic-park-node-clear-park-base-pin-dedup`
- `tactic-read-sensors-arg-rejection-check-mode`
- `tactic-attributes-phase-squatter-retire`
- `tactic-orphaned-delegation-records-reading`
- `tactic-transition-node-scope-stale-test-coverage`
- `tactic-test-park-node-deps-precondition-guard`
- `tactic-fingerprint-stamp-sha-provenance`
- `tactic-validate-graph-empty-store-pass` *(Unit 9 — PR1 residual)*
- `tactic-sensor-deregistration-gate` *(Unit 10 — PR1 residual; born parked)*
- `tactic-verify-landed-unknown-arm-untested` *(Unit 11 — PR1 residual)*

> **The folded class-B node is a `read-sensors.ts` verification gap**, listed
> first because it is a precondition rather than a peer: a merged unit's
> fresh-reading landing **was never executed against a clean clone**, so the
> instrument arm this PR's other units depend on has never actually been proven
> to run outside a warm worktree. Verify it before trusting any sensor reading
> this PR produces. It is a `main-qa` regression node — the code merged, the
> post-merge verification did not happen — so verify against merged behavior,
> do not re-implement. Compare `.claude/rules/sandbox.md` on why a clean-clone
> run differs: `--dir`-less script invocations and `claude agents --json` both
> behave differently outside a provisioned worktree.

> **The last three were filed after PR1 merged**, landing on `main` as
> `920492be` — PR1's closing batch could not carry a `create` (see the `--base`
> hazard in §"Closing nodes after each merge").
>
> **Unit 10's node is parked and `owner: human`.** Its `office_hours` record
> carries the (1)/(2) gate-shape question as an open decision rather than a
> chosen design — deliberately, because shape (1) re-arms the 2026-08-14
> repo-wide write outage if its `origin/main` read fails closed. Clear the park
> before implementing Unit 10; Units 9 and 11 are `owner: ai` and unblocked.

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

**Unit 8 — the `strategy_fingerprint` sha stamp records the wrong commit.**
The stamp writes the **pre-commit `HEAD`**, so it pairs a
post-edit hash with the commit that does not produce it. Any later reader
comparing "the fingerprint as of sha X" against the tree at X therefore compares
a hash to a tree that never generated it, and the soft-freeze blast radius it
feeds is computed off that mismatch.

This lands here rather than in its own PR because the write happens on
`transition-node`'s stamp path — Units 1 and 6 above are already on that path,
and Unit 6's test coverage is where this behavior gets pinned.

> **Sequencing with `tactic-strategy-fingerprint-stamp-coverage`.** That node is
> `phase: qa` — in flight on the ladder, *not* part of this plan — and it wires
> the live-router stamp write through `transition-node` in the first place. It is
> the code path this unit corrects. **Confirm it has merged before starting Unit
> 8**; if it has not, this unit has no write site to fix yet and should be split
> out rather than blocking the other seven.

**Unit 9 — `validate-graph` still passes on an empty store** *(PR1 residual)*.
PR1 Unit 8 made `<intentionsDir>` required and made a
**missing** directory exit 2. It did not close the neighbouring case: a
directory that **exists and contains no nodes** still exits **0** and prints
`ok — 0 nodes`. Measured on merged `main` at `063b3df2`:

```
$ node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts <empty dir>
ok — prose refs: 0 unresolved (10 grandfathered by baseline)
ok — sensors: 10 registered, …
rc=0
```

That contradicts the file's own stated contract three lines above the guard —
`validate-graph.ts:111`, *"Validating 'nothing' is never a pass"* — which is
written as though the required-argument change had already settled it. The
comment is the specification; the code is one `statSync` short of meeting it.
Fix: after enumeration, exit non-zero when the store resolved to zero nodes,
with a message that names the resolved absolute path. Keep it distinct from the
exit 2 usage errors so a caller can tell "you pointed me nowhere" from "you
pointed me at the wrong place".

> Low severity on its own, high severity in combination: this is the exact
> shape of vacuous pass PR1 Unit 8 existed to eliminate, and every `verify`
> fence in this plan now runs `validate-graph.ts intentions` from a repo root.
> A run from the wrong cwd reports a clean graph.

**Unit 10 — a node prose reword still de-registers a sensor with nothing going
red** *(PR1 residual — gated on the sitting below)*. PR1 Unit 2
narrowed the validator so a red sensor-registration check can no longer block
every graph write. What it did not do is give the **de-registration** case any
failing gate at all. The sensor name is coupled to node prose by exact string
match, so rewording a node silently unbinds it, and:

- `graph-validate` runs `validate-graph.ts`, which PR1 made **non-fatal** on
  precisely this condition — so it can never go red on it;
- `unit-tests.yml` declares `branches-ignore: [main, 'graph/**']`, and
  `graph-validate` lives in that same workflow — so for a write that lands via
  a `graph/**` push, **neither job runs at all**.

The result is a reword that lands green while the sensor reads `null`, with
only a stderr line in the guard log. The brief scoped this to a *node-scoped
failure*; what shipped is a warning. This is an under-delivery against the
unit's own scope, not a reviewer preference.

**This unit needs a ruling before code** — the two candidate shapes are
materially different and one of them is dangerous:

1. **Node-scoped fatal in `guard`** — fail only when the name was bound at
   `origin/main` and is unbound after this write. This is the literal wording,
   and it gates at write time. But it puts a **new `origin/main` read inside the
   one job whose failure mode is repo-wide write denial** — which is the
   2026-08-14 outage (54 minutes, three blocked writes, none about sensors) that
   PR1 Unit 2 exists to prevent. Getting it wrong re-arms exactly that.
2. **Post-merge check on `main`** — cannot deny any write, so it cannot re-arm
   the outage, but it detects after the fact and needs a **new workflow**:
   nothing currently runs on `main` push outside path-scoped deploys.

Recommendation carried from PR1's review: **(2) first** for the detection floor,
**(1) later** as the real gate. Do not implement either without the sitting.

**Unit 11 — `verify-landed`'s unknown-node arm is untested** *(PR1 residual)*.
PR1's post-merge QA exercised `verify-landed` at 0/4/4/2 and
confirmed the absent-node path returns **exit 4** rather than a false "landed".
The **exit 1** "unknown" arm was never reached — it is not reachable read-only,
so the QA pass could not cover it. This is the script every closure in this plan
uses as its second, independent verification, and an untested arm in it is an
untested arm in the bookkeeping of ~100 remaining node closures. Add shell-level
coverage that drives it deliberately.

### Dependencies

**PR1** — Unit 4 here is red-by-construction until PR1 Unit 4 lands, and Unit 3
assumes PR1 Unit 8's explicit-tree reads.

**`tactic-strategy-fingerprint-stamp-coverage`** (`phase: qa`, outside this plan)
— Unit 8 only. See the note above.

**The sensor-gate sitting** — Unit 10 only, and blocking for that unit. Units
9 and 11 are independent and can land without it.

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
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
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

After merge, for each of the 8 ids set `phase: done` and
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge"). Unit 5's node closes with the author's
decision recorded in its body **whichever way the decision goes**.

---

# PR17 — Merge queue and scan cadence

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

This is the node-lane analogue of a finding this plan already accepts: the
freeze section measured the queue at **0 mergeable, 2 parked** — a state that is
currently invisible unless someone queries it by hand.

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
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge").

---

# PR18 — Durable-layer write fence

> **In-flight overhang — settled 2026-08-20 for #3037, open for #3054.**
> **#3037** (`tactic-census-scripted-tick`) was to be closed and absorbed here.
> **It is not.** Reading `census-tick.ts`'s `spliceBody()` showed the defect does
> **not** survive the port — the ported function is mint-only behind an
> `existsSync` skip, i.e. it is the fix. #3037 moved to A3 (land after this
> plan). **Unit 1 loses its second site**, which stays on `main` untouched;
> see the note in Unit 1 and Bundle 0 step 1.
> **#3054** (`tactic-blocked-session-invisible-to-census`) — Unit 4's
> `dispatch-fleet-alarm` anchors. Still a `CONFLICTING` draft, still a close-and-
> absorb *candidate*, but it must pass Bundle 0 step 5's redundancy test first:
> it is 1,325 lines across 10 files, six of them test suites this PR has no unit
> for.

**Recommended model: opus** — four of the five units decide what an unattended
writer is *permitted* to do to durable content, and getting the fence wrong in
the permissive direction is silent.

### Context

Every node in this PR is the same defect in a different place: **an autonomous
writer overwriting durable content nobody asked it to touch.** Two scripts
replace a node's whole markdown body; `/dispatch-conflict` guards the durable
layer with prose instead of code; `/review-fix`'s node-write fence is an
instruction rather than a script; a mechanical re-mint silently wipes any park
landed on a `tactic-fleet-alarm-*` node; and `park_write` preserves the losing
writer's content only as a pointer into a `mktemp` dir its own text concedes may
not outlive the session.

This is the **hot** path and it goes first. PR1 fixed what `graph-commit` gets
wrong; this fixes what the *callers around it* are allowed to do. Roughly a
hundred node closures in this plan still run through that fence.

> **Anchor freshness — read this first.** PR1 (`fe0b1c4d`) rewrote large parts of
> `graph-commit`, and the anchors in these nodes' bodies predate it.
> `park_write()` moved from `:2778` to **`:3029`**, `cleanup()` from `:862` to
> **`:852`**, the `SNAP_DIR` `mktemp -d` from `:3479` to **`:3770`**. The
> anchors below were re-verified against `origin/main` at `063b3df2`. Treat every
> line number in a node body as a hint.

### Nodes closed (5)

- `tactic-autonomous-body-write-wholesale-replace`
- `tactic-dispatch-conflict-substance-allowlist`
- `tactic-review-fix-porcelain-guard-script`
- `tactic-fleet-alarm-node-park-clobber-loop`
- `tactic-graph-commit-park-content-durability`

### Scope

**Unit 1 — an unattended body write must be an append or a splice, never a
wholesale replace.** **One live site** *(was two — revised 2026-08-20)*:

- `.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding:743-761` —
  `splice_body()` keeps the frontmatter and **replaces everything after it**. It
  already refuses an incomplete frontmatter fence and rolls back from a captured
  blob on failure; what it cannot do is tell a body it generated from one a human
  wrote. Three callers, and only the first is correct: `:1127` the **mint** (a
  create authors its own body — leave it), `:1223` the **recurrence** path, and
  `:1027` the **resolved** path. The latter two run against a node that already
  exists.
> **Dropped: `dispatch-graph-census:133-140`.** It was listed here as "the
> equivalent on every run after the first". That description is wrong, and the
> site is out of scope for this PR. Reading it (2026-08-20): the script computes
> `PRIOR_BLOB` from `origin/main:intentions/$NODE_ID.md` and its own comment
> calls absence "the EXPECTED born-fresh case" and presence "the rare same-day
> id-collision race". So the wholesale replace only reaches a pre-existing body
> **on that race**, not on every subsequent run. Three reasons to leave it:
> **(1)** the fix already exists in #3037, which adds the `existsSync` skip the
> bash lacks; **(2)** `dispatch-graph-census` does not run while the sentinel
> holds — the census is not one of the six things a paused tick does, so the
> race cannot fire during this plan; **(3)** fixing it here writes into a file
> #3037 deletes, which is the exact "land a fix into a file another open PR
> deletes" hazard Bundle 0 warns about. Re-check when #3037 lands (A3).

Why this is substance and not bookkeeping: the body is half of
`tacticScopeFingerprint` — `packages/intentionsutil/src/router.ts:131`
(verified), the pair `(statement, body)`. A body write **is** a scope-substance
write.

*(The node is a draft, not a plan: it carries the measurement and the shape of
the fix but no verification block. Decompose before building.)*

**Unit 2 — replace `/dispatch-conflict`'s prose doctrine guard with a mechanical
refusal.** `.claude/skills/dispatch-conflict/SKILL.md`'s reconciliation lane
tells the subagent to set `.<field>` per resolved field — an **unconstrained `jq`
filter** — then `write-node.ts`, then `graph-commit`. The same skill explicitly
puts durable-layer `statement`, `rationale` and clarification text in scope while
instructing the model never to synthesize substance. **That instruction is the
entire guard.** Two sub-units:

- **A** — export `STATE_FIELDS` from `packages/intentionsutil/src/schema.ts`: the
  router- and sensor-owned set (`phase`, `execution`, `office_hours`, `reading`,
  `attention`, `rounds`, `status`, `blocked_by`). This is the small, enumerable
  half. *(No `STATE_FIELDS` exists there today — verified; this creates it.)*
- **B** — refuse, and park for a human, when the target id resolves to a
  durable-layer kind (`virtue`, `strategy`, `delegation`, `kind`, `tradition`)
  and the field is not in `STATE_FIELDS`.

> **Build B as a negative check, not a positive allowlist.** It was ruled as a
> positive allowlist of the six `strategyFingerprint` fields on 2026-08-14 and
> **corrected on 2026-08-15**, because the positive form fails **open** — and the
> measured fallthrough included `rationale`, the field named *first* in the
> doctrine this skill reconciles against and not a `strategyFingerprint` field.
> `.claude/rules/code-style.md` is the same instinct: refuse clearly rather than
> fall through.

**Unit 3 — make `/review-fix`'s Step-5 porcelain guard executable.**
`.claude/skills/review-fix/SKILL.md` specifies a complete, correct fence — every
new `git status --porcelain` entry against a pre-fork baseline must be exactly
`??`, its path exactly `intentions/<id>.md` for an id the subagent returned, and
every returned id must have a matching entry. **It is entirely prose and nothing
runs it**, so the census's claim that review-fix is "mechanically fenced" was
false. Extract it to a script under
`.claude/skills/dispatch-propagate/scripts/` taking the baseline file, the after
file and the returned-ids file; exit non-zero naming the offending path and its
status; call it from the Step-5 lane in place of the checklist; add a test suite
in the shape the sibling lint scripts use.

> **Carrier change, not a policy change.** Do not tighten or loosen what the
> guard accepts while moving it.

**Unit 4 — stop `/align-tactics` selecting mechanically-managed alarm nodes.**
The selector has no concept of a mechanically-managed tactic, so
`tactic-fleet-alarm-*` — a family minted and resolved only by
`dispatch-fleet-alarm` — is treated as an author-authored draft. Any park landed
on one is wiped by the next mint. Evidence: the candidate emission at
`router.ts:540-556`, the alarm writer's closed-detection at
`dispatch-fleet-alarm:316-325` and unconditional mint-fresh overwrite at `:618`,
the clobbered-park commit pair `894e653a` → `7ff0962d`, and ~14 repeats of the
mint/park/clobber cycle on one node — 14 ending in a frozen worker rather than a
clean disposition. *(Anchors from the node body — re-locate.)*

> **This unit needs an author decision before code.** The node deliberately stops
> at diagnosis: **(a)** exclude the `tactic-fleet-alarm-<kind>` family from
> `router.ts`'s frozen-tactic candidate loop, or **(b)** additionally harden
> `dispatch-fleet-alarm`'s `classify()` to be park-aware as defense in depth.
> (a) is the fix; (b) is optional hardening. Record the choice on the node.

**Unit 5 — a park must carry the losing writer's content, not a pointer to it.**
`park_write()` (`graph-commit:3029`, verified) is the fail-closed path whose
whole purpose is to preserve what the losing writer meant to say. It preserves it
by pointing at `SNAP_DIR`, a bare `mktemp -d` (`:3770`, verified).
`park_and_exit()` sets `KEEP_SNAP=1` (`:3329`) so `cleanup()` (`:852`) spares it
— which survives the *process*, not the machine, the tmp reaper, or the
container. The recommendation text concedes it twice: content is preserved
"(this machine only — may not survive past this session)" (`:3118-3119`).

This is candidate **(c)** of clarification 241, which adopted (b) and left this
open: "(b) and (c) are complements, not substitutes; (c) should be filed as its
own tactic." PR1 left the seam in one place — both recovery branches call
`preservedContent()` and neither composes path wording of its own.

> **Two branches, and only one is fixable the obvious way.** The ordinary
> lost-writer branch commits `origin/main`'s content plus the `office_hours`
> block, so carrying content in `office_hours.recommendation` repairs it. The
> **delete/modify** branch does not land the record at all — by its own text the
> `office_hours` record "is LOCAL ONLY — it exists nowhere on origin/main,
> because the node does not." A fix addressing only the first branch **must say
> so on the node** rather than closing it silently.

### Dependencies

**PR1** — shipped. Unit 5's node was `blocked_by`
`tactic-graph-commit-snap-dir-merge-clobbers-original` and
`tactic-eval-finding-noop-verdict-hides-dropped-node-edit`; **both closed with
PR1**, so the edge is clear.

Units 1–4 are mutually independent and independent of Unit 5. If the PR runs
large, Unit 5 splits off cleanly — it is the only one touching `graph-commit`.

**Must precede PR13** — Unit 3 edits `.claude/skills/review-fix/SKILL.md`, which
PR13 renames to `/dispatch-review`.

### Reuse

- `.claude/skills/dispatch-propagate/scripts/lint-prose-rules.sh` and
  `lint-verify-fence-paths.sh` — the established shape for a lane guard that is a
  script plus a test suite, for Unit 3.
- `preservedContent()` in `graph-commit` — PR1's deliberate single seam for Unit 5.
- `packages/intentionsutil/src/schema.ts`'s existing exported constant blocks
  (`STATUSES:21`, `PHASES:59`, `LANE_PASS_LANES:120` — verified) — the pattern
  `STATE_FIELDS` follows in Unit 2A.
- `tacticScopeFingerprint` (`router.ts:131`) — the definition that makes Unit 1's
  case.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

Manual, and each of these is the actual claim:

- **Unit 1** — take a node with a hand-written body, drive `dispatch-eval-finding`
  down its *recurrence* path, and confirm the human prose survives.
- **Unit 2** — attempt a `rationale` write to a `strategy-*` id through the
  `/dispatch-conflict` lane and confirm it refuses and parks. `rationale` is the
  specific field the 2026-08-15 correction was made for; testing a
  `strategyFingerprint` field instead would pass under the *broken* design.
- **Unit 3** — run the extracted script against a baseline/after pair containing a
  modified `.claude/` file and confirm non-zero with the path named.
- **Unit 5** — park a write, then delete `SNAP_DIR`, and confirm the record on
  `origin/main` still carries the losing writer's content.

### Closing the nodes

After merge, for each of the 5 ids set `phase: done` and
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge"). Unit 4's node closes with the (a)/(b)
decision recorded in its body. If Unit 5 addresses only the ordinary branch,
record the delete/modify residue on its node before closing.

---

# PR19 — Supersession representation

> **In-flight overhang (2026-08-20).** Class A: **#3041**
> (`tactic-clarification-citation-ids`, `router.ts` + `schema.ts`) — its node is
> `office_hours`-parked and is one of this plan's two named pre-PR sittings, so
> **resolve the sitting first, then absorb** (Bundle 0 Step 4). Class B:
> **`tactic-schema-drift-guard`** — a CI guard that every field, rule, enum and
> vocabulary `schema.ts` enforces is declared on a kind node; this PR is the
> `schema.ts` PR and its first beneficiary. Keep #3093, #2856 and #3040 *out* —
> they rewrite node content in bulk and belong after the bookkeeping.

**Recommended model: opus** — Unit 1 is a schema change with a data migration
behind it, and the terminal it adds is one the router must not mistake for
`done`.

### Pre-PR session (required)

`/office-hours tactic-review-supersession-derived-subpoints` — ratifies two
sub-points that **Claude derived, not the author**: that in-flight nodes get a
supersession edge but no park, and that only a fully superseded node is parked.
This PR encodes exactly those two behaviors. **Ratify first**, or the schema
carries an unratified inference.

### Context

Supersession cannot be represented in this graph at all today. When one node's
design replaces another's, the only available moves are to close the old node as
`done` — which is false, it was not done — or to leave it open forever. So
`/align-tactics` computes `greenfield_drops` and then **discards them into the
round report**, where they die with the transcript.

Three units: the representation, the producer that writes it, and the sweep that
catches prose left pointing at superseded work.

### Nodes closed (4)

- `tactic-supersession-edge-and-terminal`
- `tactic-persist-greenfield-drops`
- `tactic-supersession-retirement-sweep`
- `tactic-schema-drift-guard` *(folded in 2026-08-20, Bundle 0 step 6)*

> **The folded node is a CI guard**, and this PR is its first beneficiary. It
> asserts that every field, rule, enum and vocabulary term `schema.ts` enforces
> is **declared on a kind node** — i.e. that the executable schema and the
> documented graph cannot drift apart. This PR *adds* a schema field
> (`superseded_by`) and a status terminal (`superseded`), which is exactly the
> change the guard exists to catch when its kind-node declaration is forgotten.
> Land the guard in the same PR that first exercises it, and let this PR's own
> additions be its first test case.

### Scope

**Unit 1 — add a first-class `superseded_by` edge and a `superseded` status
terminal.** `packages/intentionsutil/src/schema.ts` — the edge follows
`blocked_by`'s shape (`:239` in the interface, `:271` optional, `:1012-1013` in
the validator — verified), and the terminal extends `STATUSES` (`:21`, verified:
`["raw", "refining", "delegated", "codified"]`).

Three things this unit must settle, all of which are graph-wide:

- **`superseded` is a terminal, not a phase.** A superseded node is not `done`;
  anything counting completion must not count it as such.
- **Edge validation** — `superseded_by` gets the same existence rule
  `blocked_by` has (`schema.ts:1067` notes these edges have no separate existence
  rule today — read it before adding one).
- **The router must not select a superseded node.** `schema.ts:458` already
  warns about silently dropping a node "and any `blocked_by` gate it holds";
  the same hazard applies here.

> **Schema tightening plus data migration in one PR is the exact pair
> `tactic-eval-finding-origin-main-data-test-blocks-atomic-schema-tightening`
> was filed about** — and that node closed with **PR1 Unit 4**, which fixed
> `office-hours.test.ts` running branch schema code against live `origin/main`
> data. That fix is what makes this unit landable atomically. Confirm PR1 U4 is
> in `main` before starting.

**Unit 2 — persist `/align-tactics`' `greenfield_drops` as supersession edges.**
Instead of discarding them into the round report, write them onto the graph
through the shared creation surface. The two sub-points the pre-PR sitting
ratifies govern the behavior here: an in-flight node gets the edge but no park;
only a fully superseded node is parked.

**Unit 3 — widen the retirement sweep from verify fences to body prose.**
`.claude/skills/dispatch-propagate/scripts/lint-verify-fence-paths.sh` (verified)
today extracts ```verify blocks via the shared `lib-verify-fence.sh` parser
(`:69-70`) and fails at the commit that orphans a fence-named path. Widen it to
body prose and add a park lane, so an open node whose plan names a deleted skill
or script is caught **at the commit that deletes it** rather than by the session
that later tries to execute it.

> **The baseline file must not grow.** `verify-fence-path-baseline.json`
> (`:74`) is the accepted-debt list. Widening the scanner will surface existing
> hits; resolve them or record them deliberately — a silently grown baseline
> converts this guard into decoration. This repo has already been bitten by a
> rename that orphaned fences.

### Dependencies

**PR4** — `tactic-persist-greenfield-drops` is `blocked_by`
`tactic-finding-search-all-producers`, PR4's central node: the one find-or-recur
write surface every creation site routes through. Unit 2 writes supersession
edges *through* that surface, so it is genuinely downstream.

**PR1** — shipped; Unit 4 of it is what makes Unit 1 landable atomically (above).

**The pre-PR sitting** — required, see above.

Unit 3 is independent of both and may land separately.

### Reuse

- `blocked_by`'s full implementation path in `schema.ts` — interface, optional
  field, `validateIdArray` call, existence rule — the template for
  `superseded_by`.
- `lib-verify-fence.sh` — the existing parser Unit 3 widens rather than replaces.
- PR4's find-or-recur write surface — Unit 2's writer.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-typecheck.sh
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual: set `superseded_by` on a node and confirm the router does not select it
and no completion count treats it as `done` (Unit 1). Run an `/align-tactics`
round that produces a `greenfield_drop` and confirm the edge reaches
`origin/main` (Unit 2). Delete a script named in an open node's body prose and
confirm the sweep fails at that commit (Unit 3).

### Closing the nodes

After merge, for each of the 3 ids set `phase: done` and
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge").

---

# PR20 — `/align` charter: adversarial draft review

**Recommended model: opus** — Unit 1 builds a review gate whose whole value is
judgment quality, and three units revise interview skill text where the wording
*is* the mechanism.

> ## ⚠ MUST LAND BEFORE PR13
>
> PR13 renames `/align-tactics` to `/dispatch-plan`. Units 3–5 edit
> `.claude/skills/align-tactics/SKILL.md` and its `references/`. Running PR13
> first orphans every path this PR writes — and that failure is **silent**, not a
> merge conflict.

### Pre-PR session (required)

`/office-hours tactic-align-audit-legacy-review` — decides `/align-audit`'s
inclusion of the two engines the `/align` consolidation retired (the rung-5
dialectic and the `/align-strategy` improvement pass), and ratifies or reworks
the successor-cadence deferral.

### Context

A new strategy landed on 2026-08-13: **`strategy-discovered-requirements`**,
split out of `strategy-graph-native-dispatch`.

> The author's requirement is discovered under interview and recorded completely
> enough that the record alone carries it — `/align`'s charter: elicitation,
> capture-completeness, and **independent challenge of the draft**.

That last clause has no implementation. This PR builds it, plus the interview
integrity fixes recorded alongside it.

The reason the charter needs an adversarial gate at all: `/align` output is the
one case with **no downstream reader**. "The interview is the audit." An
`/align-tactics` subtree gets read again at plan, implement, PR review and QA; a
strategy record does not.

### Nodes closed (8)

- `tactic-align-review-skill`
- `tactic-align-strategy-new-steps-revision`
- `tactic-align-round-self-consistency-walk`
- `tactic-align-tactics-drift-dump-office-hours`
- `tactic-align-tactics-immaterial-drift-redirect`
- `tactic-validate-graph-ordering-inversion-lint`
- `tactic-align-tactics-premise-preflight`
- `tactic-align-tactics-migration-tightening-split` *(Unit 8 — PR1 residual;
  filed after the fact, landed on `main` as `920492be`)*

### Scope

**Unit 1 — the `/align-review` gate.** `tactic-align-review-skill` carries a full
decomposition in its body (~14.5 KB) — **read it rather than re-deriving**. Four
deliverables:

1. **`.claude/skills/align-review/SKILL.md`** (new — verified absent). Executed
   by an independent subagent launched with an explicit `model: opus` **launch
   parameter, not skill frontmatter**, with no drafting-session context; also
   author-invocable standalone. Output rubric: verdict (greenfield /
   mostly-greenfield / brownfield-shaped), a requirement-clause coverage table,
   and findings ranked MATERIAL/MINOR each carrying a concrete alternate design.
   **MINOR is format-only** — anything changing what the record says is MATERIAL
   by construction, and a challenge to recorded doctrine is always MATERIAL.
2. **`assemble-review-pack`** (new, in that skill's `scripts/`) — builds the pack
   from **on-disk artifacts, never session narrative**, and **fails closed** when
   any producer file is missing. That fail-closed property is what makes the pack
   spec enforceable rather than aspirational.
3. **`graph-commit --review <report-file>`** — a receipt floor, content-bound
   like `--base`: the report carries the ids it reviewed plus a digest of the
   exact `write-node` input JSON it was given; `graph-commit` recomputes that
   digest from the staged files and refuses on mismatch, so a shape-changing
   disposition breaks a stale round-1 receipt mechanically. `--ack <reason>`
   opt-out recorded as a commit trailer.
4. **Amend `.claude/skills/align/SKILL.md`** — the producer writes feeding the
   pack, and the gate itself between draft construction and the `graph-commit`
   call in Step 5, capped at two review rounds per bundle.

> **The receipt floor must NOT refuse every caller's write.** Binding scope,
> ruled 2026-08-14: the gate covers an `/align` round's own output only — the
> `strategy-*` substance it writes and any new node file it mints.
> `/align-tactics` decompositions, `qa-fix` finding nodes and router transitions
> are **out of scope**. Refusing unconditionally would impose an adversarial
> review round on every autonomous decomposition, which the author explicitly
> ruled out. Gate predicate: the commit creates or modifies a `strategy-*` field
> other than the router-owned ones (`phase`, `execution`, `office_hours`,
> `reading`, `attention`), or creates any new node file.

**Unit 2 — revise `/align-strategy`'s two new Step 2 interview steps.** The 2.3
doctrinal-consistency gate and the 2.5 steelman challenge: make the gate test the
**finalized rationale and post-steelman intent** rather than the draft, record
clean passes, define its overlapping-strategies scope, and **cross-reference
rather than restate** the shared `origin/main`, question-mechanics and
tradition-record rules. The node carries a full plan (~9 KB).

**Unit 3 — `/align` Step 6 gains a self-consistency walk** over the round's own
output. *(Draft, ~200 bytes — decompose before building.)*

**Unit 4 — pass `office_hours` into the `/align-tactics` drift payload.** The
drift agent is instructed to weigh the strategy's own `office_hours` and is never
given the field. Fix all **four dump sites** so the instruction and the data
agree. *(Draft — decompose.)*

**Unit 5 — redirect `/align-tactics`' immaterial drift observations.** Today they
are written as **strategy clarifications** — an autonomous lane editing
durable-layer substance. Redirect to a born-parked observation node instead.

> This is the same invariant PR18 enforces mechanically. It lands here rather
> than in PR18 only to keep all `/align-tactics` skill-text edits in one PR.
> **`tactic-align-tactics-per-node-clarifications`** (closed `done` 2026-08-15)
> is the node that proved the current instruction is not even executable: a
> per-node round has *no legal destination* for these observations —
> `write-path.md` says write strategy clarifications, `tactic-target.md` forbids
> any strategy write, the park escape is closed by the autonomy contract, and
> `DRIFT_SCHEMA` emits `{answer}` with no question. Read it before building.

**Unit 6 — `validateGraph` ordering-inversion lint.** Warn when node X's body
names node Y while `Y.blocked_by` contains X. **Warn-level, surfaced for session
disposition, never a hard fail.** *(Draft — decompose.)*

**Unit 7 — close `tactic-align-tactics-premise-preflight` with the outcome.**
This node is a **recorded decision, not new work**: it withdraws the preflight
reorder mechanism and redirects the measured cost upstream to Units 3 and 6 —
`/align-tactics`' premise refusal is Side B of the drift review and cannot
precede the evidence its three reasoning phases consume. Verify Units 3 and 6
landed, record that on the node, and close it. **No code.**

**Unit 8 — record the "one PR per migration step" rule** *(PR1 residual)*.
PR1 Unit 4's node carried a planning-time rule that PR1 deliberately
left out of scope as `/align-tactics` doctrine rather than graph-write code, and
recommended as a follow-up node: **a data migration and the schema tightening
that rejects its pre-migration spelling cannot share a PR.** The tightening
rejects the old spelling; the migration is what removes the old spelling; put
them in one PR and the PR is red against `origin/main` data from its first
commit until its last.

Scope: write the rule into `.claude/skills/align-tactics/SKILL.md` as a
decomposition constraint — when a unit both migrates data and tightens the
schema that validates it, split it into two units with an explicit ordering
dependency. Land it here because this PR already owns the `/align` +
`/align-tactics` SKILL text.

> **This plan violates the rule in two places today, and both should be split
> when their PR is executed.** **PR16 Unit 4** backfills 6 nodes off
> `attributes.phase` *and* makes `validate-graph` reject the key in one unit —
> its own text concedes it "**does** trip the origin/main data test". **PR4 Unit
> 1** strips `attributes.ledger_entry` from 40 nodes *and* removes the reader in
> the same PR. Both are currently survivable only because PR1 Unit 4 fixed that
> data test — which is precisely the crutch this rule says not to lean on.

> **The node is `tactic-align-tactics-migration-tightening-split`**, filed after
> PR1 merged and landed on `main` as `920492be`. This unit is doctrine
> text, not a code change; filing it is what keeps the rule from being lost,
> since PR1's own node closed `done` and its body is now a historical archive.
> The node's scope covers both halves — the SKILL text *and* reconciling the two
> units that violate the rule today.

### Dependencies

**PR18** — Unit 5 here is the policy half of the invariant PR18 enforces
mechanically. Not a hard block, but landing PR18 first means Unit 5 is a
redirection into an already-guarded lane rather than an unenforced convention.

**PR1** — shipped; Unit 1's `--review` flag extends `graph-commit`'s existing
`--base` content-binding pattern, which PR1 left intact.

**Must precede PR13** — see the banner above.

**The pre-PR sitting** — required, see above.

### Reuse

- **`--base`'s content-binding implementation in `graph-commit`** — Unit 1's
  `--review` is explicitly specified as "content-bound like `--base`". Reuse the
  digest-and-refuse machinery rather than writing a second one.
- `.claude/skills/align-tactics/references/{write-path,tactic-target,autonomy}.md`
  — the reference-file pattern Units 4–5 edit, and where the contradiction Unit 5
  resolves is recorded.
- `.claude/rules/design-proposals.md` — an input to the review pack, and the
  standard `/align-review`'s greenfield verdict is measured against.
- `validate-graph.ts`'s existing warn-level lints — the shape Unit 6 follows.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual, and the first two are the ones that matter:

- **Unit 1, scope** — run an `/align-tactics` decomposition and a `qa-fix` finding
  write and confirm **neither** is refused for a missing receipt. This is the
  ruled boundary and the easiest thing to get wrong.
- **Unit 1, binding** — produce a review report, change a staged node's content,
  and confirm `graph-commit --review` refuses on digest mismatch.
- **Unit 1, fail-closed** — delete one producer file and confirm
  `assemble-review-pack` fails rather than emitting a partial pack.
- **Unit 4** — dump the drift payload at each of the four sites and confirm
  `office_hours` is present in all four.

### Closing the nodes

After merge, for each of the 7 ids set `phase: done` and
the `execution.completion` object — **not** `resolved_by`, which is not a schema field and is dropped silently (see §"Closing nodes after each merge"). Unit 7's node closes on the recorded
outcome, not on a diff.

---

## Closing nodes after each merge

Because these PRs bypass the ladder, **no transition happens automatically.**
After each merge, for every node the PR closed:

1. `node --import tsx/esm packages/intentionsutil/scripts/dump-node.ts --out-dir <dir> <id>…`
2. jq-merge `phase: "done"` and the `execution.completion` object (see below)
3. `node --import tsx/esm packages/intentionsutil/scripts/write-node.ts --file <dir>/<id>.json`
   — the single validation gate
4. `node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions`
5. `packages/intentionsutil/scripts/graph-commit -C <repo path> --base <manifest> -m <msg> <id>…`

> **Both of those forms changed with PR1, and the old ones now fail.** Step 4
> without the `intentions` argument **exits 2** — PR1 Unit 8 made the store an
> explicit required argument (`validate-graph.ts`, `requirePositional`), so every
> argument-less invocation this plan used to carry is now a usage error rather
> than a pass. And `npx tsx` is the spawn form PR1 Unit 7 removed from
> `graph-commit`: the `tsx` CLI opens an IPC unix socket that this repo's
> sandboxed runner refuses with `EPERM … /tmp/…/tsx-*.pipe`. The
> `node --import tsx/esm` loader form needs no npm resolution and opens no
> socket. Measured on `063b3df2`: bare invocation `rc=2`, explicit-argument
> invocation `rc=0`.

**The field is `execution.completion`, not `execution.resolved_by`.**
`resolved_by` **does not exist in the schema** — an easy mistake to repeat,
because nothing rejects it. `write-node.ts` drops unknown
keys silently, so writing it produces a node that reads `phase: done` with **no
completion record at all**, and every gate reports success. The real shape is the
`Completion` interface (`packages/intentionsutil/src/schema.ts:659`, reachable as
`execution.completion` at `:685`):

```json
"execution": { "completion": { "mergedAt": "<ISO8601Z>", "mergeCommitSha": "<merge sha>", "graphCommitSha": "<the graph-commit sha>" } }
```

`execution` also requires `branch`, `pr`, `attempts`, `markers`, and
`strategy_fingerprint` — dump the node first and merge into what is already
there rather than composing an `execution` object from scratch.

Seven hazards on this path, each of which has bitten before:

- **`graph-commit` requires an explicit `-C`.** It resolves the repo root from
  `-C`/`--repo`, else **cwd** — never from its own location. Without it you
  commit the wrong checkout and it exits 0 as a landing that landed nothing.
- **`pushed=none context=noop` is a failure signature**, not a success. A
  successful land reads `context=push-reported-success`.
- **Local `main` ahead of `origin/main` silently drops node edits** — this was
  PR1 Unit 1, and it **is fixed**: the far-ahead case now rebuilds the edit on an
  intentions-only base and reports `context=push-reported-success`. Verified live
  against merged `main`. The fetch-and-check step below is still worth running,
  but it is no longer the only thing standing between you and a silent drop.
- **`origin/main...main` = `0 0` may be unreachable, and that is not a blocker.**
  The two counts are not symmetric. Unpushed **local** commits (the left number)
  are the hazardous direction; being merely *behind* is harmless. The sanctioned
  fix, `sync_main_checkout`, uses `git -C`, which a **worktree-isolated session
  refuses toward the primary checkout** — so an isolated session cannot
  fast-forward the user's `main` at all. What works: run the closing batch from a
  **fresh worktree cut at `origin/main`** and verify *that* checkout is 0 ahead.
  PR1's own closing batch ran this way.
- **A node *create* must not ride in a `--base` batch of *edits*.** The
  compare-and-swap manifest pins pre-images per id; an id with no pre-image
  corrupts the batch. File new nodes in a separate `graph-commit` call. This is
  why PR1's two follow-up nodes were filed after the closing batch, not in it.
- **`write-node.ts` drops unknown keys**, and re-dumping a node after editing it
  wipes the edit. Dump once, edit, write. This is the same mechanism that makes
  `execution.resolved_by` vanish without complaint.
- **Verify by reading `git show origin/main:intentions/<id>.md`**, not by
  trusting the verdict line. `verify-landed --blob` is the second, independent
  check; PR1 used both.

---

## Coverage

All **117** in-scope tactics are assigned; none appears twice.

| PR | Nodes | Surface |
|---|---|---|
| ✅ PR1 | 8 | **SHIPPED `fe0b1c4d`** — `graph-commit`, `schema.ts`, `sensors.ts`, `office-hours.test.ts`, `dump-node.ts`, `validate-graph.ts` |
| PR2 | 9 | `dispatch-ladder-{run,advance,await}` |
| PR3 | 9 | `aggregate-usage.sh`, `stamp-dispatch-session.sh` |
| PR4 | 7 | `dispatch-eval-finding`, `schema.ts`, `graph-census-debt.ts`, `validate-graph.ts` |
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
| PR15 | 4 | `graph-commit` — writer default, merge path, invocation, short-circuit · **HOLD** |
| PR16 | 11 | `transition-node`, `park-node`/`clear-park`, `read-sensors.ts`, `validate-graph`, `verify-landed` |
| PR17 | 6 | `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs |
| **PR18** | 5 | `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`, `/review-fix`, `router.ts`, `graph-commit` park path |
| **PR19** | 3 | `schema.ts` (`superseded_by` + terminal), `/align-tactics` drops, `lint-verify-fence-paths.sh` |
| **PR20** | 8 | **new** `/align-review` skill + `assemble-review-pack`, `graph-commit --review`, `/align` + `/align-tactics` SKILL text, `validate-graph` lint |
| pre-PR sessions | 9 | no diff — 10 sittings, of which `sensor-deregistration-gate` is counted under PR16 |
| deferred | 6 | ref-split cluster (3) + scope-custody (2) + `demote-node-stale-local-read` |
| adjacent, unclaimed | 5 | `/qa-main` node lane (3) + fleet-dependent (2) |
| **total** | **117** | + 11 documented-not-assigned |

**How the scope was built.** The original sweep was ledger-driven — every open
`tactic-eval-finding-*` node plus the design nodes resolving them — and was
complete on its own terms, but narrower than the subsystem. A second pass
counted open nodes serving a graph strategy
(`strategy-graph-native-dispatch`, `strategy-graph-integrity`,
`strategy-graph-drives-dispatch`, `strategy-graph-self-description`) whose
**statement** names a graph read or write path: 32 more, none of them in the
plan, creation dates spanning 2026-07-12 to 2026-08-14 — a coverage gap, not a
timing artifact. 22 were assigned (PR1, PR15, PR16, PR17); 10 are documented and
deliberately unassigned. A third pass added the `/align` charter and supersession
work (PR18, PR19, PR20). Every assigned node was re-verified `phase: null` on
`origin/main`.

> **That `phase: null` re-verification expired on 2026-08-20 — in both
> directions.**
>
> **Inward:** 45 of the 102 node ids listed across the `### Nodes closed`
> sections are now `phase: implement` on `origin/main`, moved there by
> `/align-tactics` finalization rounds run after this plan was written. 54 are
> still `null`, 2 are `done`, 1 is `main-qa`. Nothing about the assignments
> changed — but "these nodes are not in the ladder" is no longer true of the
> phase field, and the tick reads the phase field. See the ground-rule collision
> note in §"In-flight work outside this plan".
>
> **Outward:** the same filter is why the plan never saw the ~20 in-charter
> nodes at `phase: implement` with no PR, or the 20 in-charter open draft PRs.
> A fourth pass on 2026-08-20 censused both; they are dispositioned in that
> section. Post-Bundle-0 the total becomes **131**.

Of the 117, **38 are on the graph read/write path** — PR1's 8, PR15's 4, PR16's
11, PR17's 6, PR18's 5, PR19's 3 and PR4's `batchIds` unit — plus PR20's
`--review` unit, which adds a receipt gate to that same writer. It is the largest
single surface in the plan, and the one every other PR's bookkeeping runs
through.

**Deferred, with reasons:**

- `tactic-graph-ref-split`, `tactic-graph-refsplit-blocker-audit` and
  `tactic-graph-refsplit-read-coherence` — the ref-split cluster; see
  §"Decisions already taken".
- `tactic-node-scope-files-overlap-gate` — a selector feature gating
  co-dispatch; needs a running fleet to exercise. Resumption work.
- `tactic-scope-stamp-in-graph` — `office_hours`-parked. Unpark before planning.
- `tactic-demote-node-stale-local-read` — blocked behind
  `tactic-phase-evidence-fingerprint-bound` (`phase: qa`).

**Adjacent, surveyed and deliberately not claimed:**
`tactic-qa-main-node-terminal-declaration`, `tactic-invalid-state-rc-f1c843b1`
and `tactic-invalid-state-rc-fa3075ec` — all three are `/qa-main` node-lane paths
that write job-dir markers instead of graph state. Genuine write-integrity
defects, but `/qa-main` does not run while the sentinel holds, and they overlap
PR12's four-lane surface. Also `tactic-session-reap-authorization-durability` and
`tactic-park-cause-sensor-instrument` — both need a running fleet.

**What is done:** PR1 (8 nodes), the ref-split decision, and the five residual
nodes it discovered. **What is next:** PR18. Nothing gates it — its one
`blocked_by` edge cleared when PR1's nodes closed.
