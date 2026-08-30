# Dispatch + RSI serialized PR plan

> ## ⚠ READ THIS BEFORE EXECUTING ANY POSITION
>
> **1. Anchors are hints, not addresses.** Treat every `path:line` anchor in this
> document as a search hint. Locate the code by **content** — the symbol name,
> the quoted line, the surrounding block — and never by the line number. This is
> not a caution about a few stale numbers: measured 2026-08-29, PR5's Scope had
> 8 dead anchors of 8, PR19 Unit 1 had 6 of 6, PR4 had 11 of 12, PR9 Unit 1 had
> 4 of 4. Anchors labelled "verified" in this document are included in those
> counts. Several anchors were copied out of node bodies **that themselves record
> the anchor as already wrong**. If a quoted line is not at the quoted number,
> that is the expected case, not evidence the work is done.
>
> **2. The node body is the authority; this document is not.** Where this
> document and the `intentions/` node body disagree about scope, design,
> sequencing or model, **the node governs** — the sole exceptions are the
> explicit rulings in `plans/dispatch-rsi-author-rulings.md`, which override
> both. Before implementing any unit, open every node in that PR's `### Nodes
> closed` list and read its Scope, its `## Out of scope`, its
> `clarifications:` and its `office_hours` block. This document was written
> before many of those nodes were finalized and reproduces superseded drafts
> in several places.
>
> **3. Check the park before you plan the unit.** A node with a non-null
> `office_hours` is not autonomously selectable — `packages/intentionsutil/src/router.ts:482`
> and `:529` both `continue` on it. No PR section in this document lists its own
> parked nodes, and the index's "Open parks" row is incomplete. Run
> `LC_ALL=C grep -a -A1 '^office_hours:' intentions/<node>.md` on every node in
> the PR before starting.
>
> **4. Searching `intentions/` needs `LC_ALL=C grep -a`.** One node file carries
> a literal NUL byte; plain `grep -n` prints nothing for it and still exits 0, so
> a census taken with plain grep silently undercounts.

**Covers** the 114 tactics in the dispatch-ladder / RSI / evaluation-machinery /
graph-plumbing / `/align`-charter scope that were `phase: null` **at scope-build
time (2026-08-14)**: defects, integrity issues, token-efficiency findings,
ledger entries, and the feature/design nodes that resolve them. A further 13
nodes are surveyed, documented and deliberately unassigned — see §"Coverage".

> **It was 117 until 2026-08-29.** One node left the graph (`tactic-align-audit-legacy-review`,
> pruned) and two moved from PR15 into the deferred set, which is counted
> *outside* this total. The surveyed-but-unassigned figure rose 11 → 13 by the
> same two. §"Coverage" shows the full reconciliation.

> **The `phase: null` filter is what left work out.** Work already past
> `phase: null` on 2026-08-14 was never a candidate, so the plan is silent on
> 20 in-charter nodes at `phase: implement`/`qa` and on the 20 in-charter open
> draft PRs that overlap its files. What survives of that overhang is in
> §"In-flight work outside this plan" — **read it before starting PR18 or PR5**,
> the two positions it lands on.

> ## Where this stands
>
> **PR1 has shipped** — `fe0b1c4d` (#3095), all eight units, its eight nodes
> closed. Its section is kept only as the **shipped baseline** every later PR
> builds on: a unit index of what the write path now does, not work to execute.
>
> **The overhang is retired** and **every author gate is discharged**. No PR
> below is waiting on a decision.
>
> **PR18 is next, and nothing gates it.** Its one `blocked_by` edge cleared when
> PR1's nodes closed. The pre-first-PR list is empty — the one former settings
> item is already satisfied, see §"Retention — SATISFIED 2026-08-29, no action
> needed".

---

## How to use this document

> **The index for this window is `plans/dispatch-rsi-sequence.md`.** That file
> carries where the window stands and the execution order — the bundle
> positions with each one's node count, hard dependencies and the rulings that
> shape its units. Read it to know *what to do next*. Read **this** document for
> the executable detail: every PR section here is clean-session-executable and
> the index deliberately does not restate it.

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

> **Where this file lives.** On `main`, at
> `plans/dispatch-rsi-serialized-pr-plan.md`, alongside the index
> `plans/dispatch-rsi-sequence.md`. A clean session reads both from `main`; no
> branch checkout is needed. Updates land as ordinary commits on `main`.

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
in-flight `execution.conflict` and `office_hours` null.

**That set has been empty at every count taken since the window opened.** There
is no path from the current state to a merge while the sentinel holds: the
`reviewed` marker is written by a review session, review sessions run only from
a spawned worker, and the sentinel gates spawning. Ad-hoc PRs do not enter the
review phase, do not alter checks on existing PRs, and do not unpark nodes.

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

*The overhang was retired at position 0. What remains below is the routing that
still governs work: which bundle absorbs which still-open draft, and where the
planned-but-unbuilt nodes went. The census and per-draft disposition that
produced this routing are in the commit history.*

### Why there is an overhang at all

§"Coverage" records how the scope was built: three passes, each one selecting
nodes and then re-verifying every assigned node was **`phase: null` on
`origin/main`**. That filter is what makes the plan tractable, and it is also
the whole of the omission. A node that had already been planned, or already had
a draft PR pushed, was not `phase: null` on 2026-08-14 — so it was never a
candidate, no matter how squarely it sat in the charter or how directly it
edited a file a plan PR rewrites.

Two populations came through that filter untouched: **20 open draft PRs in
charter**, and **20 planned nodes with a written plan body but no branch, no
commits and no PR**. The second is the one this plan had no way to see. Those
nodes are not stalled work — they are *finished plans awaiting a worker*, inert
precisely and only because the pause sentinel holds.

> **The class-B population is a ground-rule collision, and it is still live.**
> Ground rule 1 says no node in this plan is driven through the ladder and no
> node carries `execution.pr`. But **45 of this plan's own 102 assigned nodes
> are now at `phase: implement`** — moved there by `/align-tactics` finalization
> rounds run after the plan was written, not by anything in this document. At
> the moment the sentinel comes off, the tick cannot tell this plan's
> `implement` nodes from the class-B `implement` nodes: it will select whichever
> ranks highest and spawn a ladder worker on it. That produces exactly the
> ladder-driven PR ground rule 1 forbids, on a node this plan intends to close
> by hand.
>
> **Ground rule 4 is what defuses it.** The sentinel stays set until this plan's
> PRs have merged and its node bookkeeping is complete, so the collision never
> gets a chance to fire. That is the *function* of the freeze, not a concession
> to it. What this adds is the size of the exposure the moment the sentinel does
> come off: 45 plan nodes plus 19 class-B nodes are all tick-selectable at once,
> so the bookkeeping in §"Closing nodes after each merge" is what makes
> resumption safe — finish it before lifting, and there is nothing left for the
> tick to grab wrongly.

### The seven drafts still open, and the bundle that absorbs each

**Held open by ruling, not by omission.** The redundancy test was run on all
twelve contested drafts and none passed: 8,006 of their 10,866 added lines merge
into today's `main` cleanly and live in modules this plan never mentions, so
blanket-closing was refused. The disposition became *split at the conflict
boundary* — the clean half lands as its own PR, the contested half is absorbed.
Five clean halves have landed (#3099, #3101, #3102, #3104, #3105) and their
source drafts are closed. For the seven below, the contested content is still
worth reading as a diff when its bundle is reached.

| PR | Node | Absorb into | Why |
|---|---|---|---|
| **#3023** | `tactic-strategy-fingerprint-stamp-coverage` | **PR16** (as a new unit, ahead of Unit 8) | This plan already names it a hard dependency of PR16 Unit 8 in two places. Absorbing converts a wait into a unit |
| **#2975** | `tactic-phase-evidence-fingerprint-bound` | **PR16** (+PR18 for `router.ts`) | Also unblocks `tactic-demote-node-stale-local-read`, one of this plan's six deferred nodes — absorbing it retires a deferral |
| **#2974** | `tactic-scope-fingerprint-plan-substance` | **PR16** (+PR5 `store.ts`, PR20 `tactic-target.md`) | `transition-node` is PR16's surface |
| **#3002** | `tactic-autonomous-ci-pending-liveness-bound` | **PR5** | `reconcile-graph-review-stall` is PR5's *entire* scope surface. #3002 also *adds* per-tick `gh` calls to the file PR5 exists to make cheaper — landing it first would defeat PR5's own measurement |
| **#2993** | `tactic-qa-main-park-base-cas` | **PR12** | `.claude/hooks/dispatch-stop.sh` is named verbatim in PR12's Scope. **Close and absorb as written** — a split buys nothing here, 90% of the diff is the contested file |
| **#3057** | `tactic-bounded-work-in-progress` | **PR8** Unit 3 (+PR18 `router.ts:540-556`) | `dispatch-config-load:342-344` |
| **#3041** | `tactic-clarification-citation-ids` | **PR19** (+PR4/PR18 `schema.ts`, `router.ts`) | **Absorb directly.** No sitting gates it — the node is `office_hours: null`, `owner: ai`, `phase: review`; its park was a mechanical fleet park, cleared 2026-08-21. **Close and absorb as written** — 84% of the diff is contested |

### The four drafts sequenced last — position 12

#3093 → #2856 → #3040 → #3037, in that order; the ordering is not free and is
given in the index. All four rewrite node *content* in bulk, so each invalidates
every `graph-commit --base` CAS manifest pinned before it — the hazard
§"Closing nodes after each merge" warns about — and would collide with the
roughly one hundred node closures still to run.

| PR | Node | Bulk change |
|---|---|---|
| **#3093** | `tactic-attention-per-tier-boost-migration` | Rewrites **92** `intentions/*.md` frontmatters; migrates `attention.boost`+`tier` → `attention.boosts`. Touches two nodes this plan closes |
| **#2856** | `tactic-mount-schema` | `schema.ts`, `attention.ts`, `goals.ts`, 13 test files |
| **#3040** | `tactic-delegation-classification-derivation` | `schema.ts`, `attention.ts`, plus 22 `delegation-*.md` nodes |
| **#3037** | `tactic-census-scripted-tick` | 1,582 added lines / 15 files: retires `dispatch-graph-census` for `dispatch-census-tick` + `census-tick.ts` + `census-decide.ts`, with two new test suites. **No unit in this plan reimplements it.** Edits `graph-commit` and `dispatch-select-tick`, so it lands after this plan's closures — which also means it rebases over PR15, not the reverse. It *carries the fix* for what PR18 Unit 1 originally called its second site, which is why **PR18 Unit 1 is narrowed to a single site** |

**Out of charter, leave alone (10).** #3016 (blog prerender), #3039 (demo-saas
scaffold), #2848 (nix instance flake), #2874 (tailscale health check), #2877 /
#2878 (recovery drills), #2798 (sync-reader), #2873 (participation-log
instrument), #3096 (wezterm), and #3044
(`tactic-qa-fix-node-terminal-declaration`, routed out of this plan by author
ruling at §PR2).

### Planned nodes with no PR — where the unfolded ones went

Twelve of the twenty were folded into the PR sections that own their surface and
appear there in `### Nodes closed`; they need nothing further here. The eight
below were **not** folded, each for its own reason, and those reasons still
govern.

| Node | Disposition |
|---|---|
| `tactic-align-session-claiming-liveness-correction` (`phase: qa`) | **Invalid state — fix, do not absorb.** It sits at `phase: qa` with `execution.pr: null` and `markers: [planned]` only. It is a *record correction* to another node's body: it needs a `graph-commit`, never a PR. Land it as a graph write during this plan's bookkeeping and transition it to `done` |
| `tactic-office-hours-graph-read-cwd-whitespace` | **Resolve against the node below first.** It hardens directive parsing in the legacy office-hours entry lane. If that lane is deleted, this is moot — close it rather than implement it |
| `tactic-legacy-office-hours-entry-removal` | **Defer, explicitly.** It deletes the legacy label-lane office-hours entry surface *and* the legacy `<issue-num>-<slug>` worktree lane, repointing the `settings.json` `UserPromptSubmit` hook and the nix wiring. A deletion that large moves anchors under PR9, PR16 and PR20 at once. Sequence it **after PR13**, or after the plan |
| `tactic-omit-default-serialization` | **Position-12 treatment.** `writeNode` omitting default-valued fields stops ~3,700 lines of serialized defaults being written — i.e. it rewrites nearly every node file. Same CAS-manifest hazard as #3093. After the bookkeeping |
| `tactic-serves-inheritance-full-strip` | **Position-12 treatment.** Strips redundant `serves` entries graph-wide. Same reason |
| `tactic-graph-function-docs` | Documented, not assigned. Docs only (`kind-kind.md`, `intentions/README.md`) |
| `tactic-ratchet-teeth-census` | Documented, not assigned. Instrument manifest; PR3-adjacent but not on any plan PR's surface |
| `tactic-model-portability-inventory` | Documented, not assigned. Inventory document; touches `lib-claude-agents.sh` and `dispatch-graph-execute` by citation only |

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

## `main` can be red without anyone knowing — check before blaming a PR

Found 2026-08-21, while every clean-half PR sat `BLOCKED` on a `unit-tests`
failure none of them caused.

`.github/workflows/unit-tests.yml` carried `branches-ignore: main`. **The unit
suite never ran on `main`.** The green "Push on main" runs in the Actions list
are a *different* workflow, so a breakage that landed on `main` produced no red
anywhere — it became visible only on the next PR, which then appeared to have
broken something it never touched.

> **SETTLED 2026-08-23: `main` is no longer ignored.** The author ruled that the
> suite should run where breakage lands. `main` was removed from
> `branches-ignore` in #3108; `graph/**` stays ignored, because those refs carry
> intention-node commits with no source to test. The first `unit-tests` run ever
> to execute on `main` — run `32648102857`, on merge commit `6528ceec` —
> completed **success**, all 17 jobs green. Post-merge breakage now surfaces on
> `main` itself instead of on the next unrelated contributor's PR.

That is exactly what happened. `artifacts/plan-view` had been red on `main`
since the attention-boosts migration: `lineage.ts`'s `authoredAmount` read
`attention.override` and `attention.boost`, neither of which exists any more
(`Attention` is now `{ boosts: Record<string, number>, rationale }`), so it
returned `0` for every node — no band spine, no heat. Two tests failed.
Fixed in #3103 by reading `boosts[tier]`, matching the canonical read at
`packages/intentionsutil/src/attention.ts:592`.

**How to apply, before debugging any PR-only CI failure:**

1. Check whether the failing tests touch files your branch changed at all.
2. If not, prove it: `git diff origin/main --stat -- <the failing workspace>`.
   An empty diff with a failing test means the failure is `main`'s.
3. Fix `main` on its own PR first, then update the blocked branches onto it.
   Do not rebase-and-hope, and do not weaken the test.

**The same blind spot hides a second violation.** `lint-verify-fence-paths.sh`
has never run on `main` either, and `intentions/tactic-strategy-fingerprint-stamp-coverage.md`
cites `test-strategy-stamp-doctrine.sh` three times in its verify fences while
that script does not exist on `main` at all. The linter tolerates it only
because it unions `HEAD`, `origin/main` *and* git history — the path exists on
the draft branch. Any PR that *deletes* a cited path is caught immediately;
`main` sitting in the violation permanently is not. Expect more of this class:
**every check that skips `main` can accumulate debt there silently.**

**A third instance of the same class, now closed.** `run-typecheck.sh` **skipped**
`artifacts/plan-view` entirely with `origin/main baseline fails`, because
`rows.ts:137` read `resolved.value` — a field the four-component `RankKey`
(`tier`/`band`/`score`/`depth`) replaced. A skipped workspace is a silent
workspace, and the script said so plainly: `No workspace was typechecked: 0
non-TS, 1 baseline-skipped. This run verified nothing — it is not a pass.`

> **SETTLED 2026-08-23: carry the whole key; do not collapse it.** Collapsing
> `RankKey` into plan-view's single `rank` scalar was a design decision, not a
> mechanical substitution, so #3103 deliberately left it for an author ruling.
> The author ruled in #3108: carry the key **whole** and order with
> `compareRankKeyDesc` (`packages/intentionsutil/src/attention.ts:39`), the
> exported comparator that exists so consumers do not each re-derive the
> ordering. Collapsing to one scalar was rejected because it drops `tier`, and
> tier isolation is doctrine (`attention.ts:416-419`).
>
> Two details the fix turned up. First, the stale read was not merely untyped —
> it was **dead**: `resolved?.value` evaluated to `undefined` for every row, so
> `rank` was uniformly `0` and the rank tie-break never fired; ordering fell
> through to `id.localeCompare`. Second, the separate `tier` comparison in the
> row sort had to go, because `tier` is that comparator's dominant component —
> comparing it twice, once against the display `tier` and once inside the key,
> is how the two drift apart. Rows with no `ResolvedAttention` now carry
> `rank: null` and sort after every ranked row rather than being handed a
> fabricated zero.
>
> **This single line was the entire baseline failure.** Checking `origin/main`'s
> plan-view files out in isolation produced exactly one error —
> `rows.ts(137,23): error TS2339: Property 'value' does not exist on type
> 'ResolvedAttention'.` — so with the fix the workspace typechecks clean and
> `run-typecheck.sh` stops skipping it. A silent workspace became a checked one.

## `.claude/agents` in a sandboxed worktree — a phantom, never an action

A sandboxed `git status` inside a worktree reports `?? .claude/agents`. It is
**not a file.** `ls -la` shows a character-special device, type `1,3`
(`/dev/null`), owned `nobody:nogroup`; the identical command with
`dangerouslyDisableSandbox: true` reports `No such file or directory` and a
clean tree. The sandbox implements path denial by bind-mounting `/dev/null`
over the denied path, and that mount leaks into the worktree's visible
namespace for the life of the session.

It was committed once by a `git add -A` in a worktree, and removed again in
`83d490ae`. **The fix is procedural, not a `.gitignore` entry** —
`.claude/agents/` is a real Claude Code directory for agent definitions, and
ignoring it repo-wide would hide legitimate files from every future session to
suppress a phantom that does not exist on disk.

- Never `git add -A` from a sandboxed worktree session; stage named paths.
- Before trusting any `git status`-driven file collection, re-run it with
  `dangerouslyDisableSandbox: true`.
- Do **not** try to `rm` or `umount` it — sandboxed, that reports `Device or
  resource busy`. It needs no cleanup.

Same root cause as the `config.worktree` failure mode in
`.claude/rules/sandbox.md`, and the reason `git worktree remove` must never run
sandboxed.

---

## Bundles, order and dependencies — the index owns these

Bundle composition, the execution order, the hard ordering constraints and the
cross-PR dependency edges live in `plans/dispatch-rsi-sequence.md`. They were
duplicated here until 2026-08-29 and had already drifted apart in two places
— a bundle's node count, and a ruling recorded in one file and not the other —
so this document no longer carries a second copy.

**Read the index to decide what to run next. Read this document to run it.**

Everything a PR needs in order to execute is inside its own section: its
`### Dependencies` names the PRs that must precede it, and its `### Scope`
carries the internal unit order. Nothing below depends on the sections that
were removed.

---

## Read this before planning any of it: verify every "missing" claim

The graph says these three nodes are open — a fourth, struck below, closed on
`origin/main` on 2026-08-30. The code says otherwise. **Verify before
implementing — most of PR3 may be a bookkeeping pass, not an implementation.**

| Node | Claimed missing | Actually on `main` |
|---|---|---|
| `tactic-audit-instrument-scoping` | `--session` / `--node` scoping | **Present** — `aggregate-usage.sh:22,34,42`; scope object emitted at `:1463,1488` |
| ~~`tactic-audit-permission-friction`~~ | permission-friction lens | **CLOSED 2026-08-30 on `origin/main` (`91bc7cc9`)** — Ruling-1 completion record against PR #3074. Out of PR3's scope. Lens present in `aggregate-usage.sh`; locate `lenses.permission_friction` by name |
| `tactic-audit-cache-efficiency-lens` | cache hit-ratio lens | **Present** — `hit_ratio` emitted at `aggregate-usage.sh:1211` |
| `tactic-rsi-round-trips-lens-carrier` | `scriptable_round_trips` carrier | **Present** — `boot_preamble` block, `aggregate-usage.sh:1335` |

Genuinely absent, confirmed by zero matches in the instrument:

- `review_effort` / `effort_yield` → `tactic-audit-review-effort-yield-lens` is real work.
- `rsi_lane` → `tactic-rsi-lane-token-attribution` is real work.

> **⛔ DO NOT CLOSE THE FOUR AS A FIRST UNIT.** *(Struck 2026-08-30.* This
> paragraph used to read "Close the four as Bundle 4's first unit, before any
> implementation. For each, read the node's success criteria against the cited
> anchor, then close with `phase: done` and `execution.completion` set to the
> commit that actually shipped it."*)* Two of the three are **not** close-only:
> `tactic-audit-cache-efficiency-lens` (`office_hours: null`, `phase: implement`,
> `status: codified`, units at `:177` and `:254`) and
> `tactic-rsi-round-trips-lens-carrier` (`office_hours: null`, `phase: implement`,
> `status: codified`, units at `:160` and `:252`) each carry a full two-unit
> plan. Closing them to `phase: done` discards planned, selectable work. The
> other one — `tactic-audit-instrument-scoping` — is `office_hours`-parked and is not
> executor-dischargeable without clearing the park.
>
> Read each node's units *and* success criteria first. Close only the nodes that
> genuinely have no unit left to build; build the rest. See PR3 Unit 1 in Scope.

Two residuals to **check rather than assume**, because they are the plausible
reason these nodes were never closed:

- ⚠ **Resolved differently than this bullet expected.** The
  `/fewer-permission-prompts` closing step *is* outstanding — but the node closed
  anyway on 2026-08-30 (`91bc7cc9`) as a Ruling-1 completion record, and the
  outstanding half was transcribed into the node body rather than kept as a park.
  It is clarification 43's owed collision check, and the node body records that
  the check cannot be performed from here at all. What shipped substitutes an
  attended `git diff .claude/settings.json` review — a design substitution owed
  ratification, on a `phase: done` node no router selects. Do not treat it as
  PR3 work.
- **⛔ Struck 2026-08-30 — do not ratify the `fleet-only` tag.** This bullet used
  to read "Whether every fleet-denominator lens carries the `fleet-only` tag; the
  vocabulary exists at `aggregate-usage.sh:1164,1463`." Ratifying the binary tag
  is the exact move PR3 Unit 1 and PR11's Reuse both strike. Record the scoping
  question as answered by the sibling node and move on.

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
| Correctly historical — says "retired", or narrates the deletion | `.claude/skills/rsi-audit/SKILL.md:256`, `tactic-rsi-plan-render-retire`, `tactic-rsi-plan-skill`, `tactic-ladder-await-phase-only-completion-test:24`, `strategy-recursive-self-improvement:1181,1224`, `tactic-rsi-research-skill:389` | **none** |
| Stale — presents the script as live | `strategy-recursive-self-improvement:165,186,381,409,549,1013,1079`, `tactic-attention-namespaced-rank:822,826`, `tactic-graph-read-at-ref-cli:16`, `tactic-rsi-audit-workflow-attribution:59`, `tactic-rsi-external-acceptance-gate:108`, `tactic-rsi-skill:39` | rewrite past-tense or repoint |
| **Scope hole** | `tactic-rsi-lane-token-attribution:127` | **re-scope the node** |

> **`tactic-rsi-research-skill` was reclassified out of the stale row
> (2026-08-29).** Two reasons, and both bite an implementer who trusts the old
> entry. The `:59` anchor was already wrong on `origin/main` — line 59 is the
> timer-installer clarification, not a `render-rsi-plan.ts` citation; the real
> mention is at `:389`. And that line sits inside `## Draft context (2026-08-10
> /align research-lane round)`, which the node's own 2026-08-20 clarification
> covers: *"read all three as HISTORICAL, and do not rewrite the dated draft
> prose that names them."* So the citation is correctly historical and
> **must not be rewritten** — editing it would overturn a standing ruling to
> satisfy a bookkeeping sweep.

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

**PR15 was the PR genuinely at risk** — its Units 1–2 are subsumed by ref-split's
Unit 2 rewrite. That revisit was held on **2026-08-29 and is now discharged**:
**PR15 splits.** Units 1–2 are not written; Units 0, 3 and 4 ship. DEFER stands
for ref-split itself, and the rider (incremental cutover, blocker re-cut from 23
to 8) is kept on the record as post-window work rather than adopted into this
window. See PR15's own section for the full ruling.

Five nodes are deferred with ref-split. Three from the original disposition:
`tactic-graph-ref-split` itself, `tactic-graph-refsplit-blocker-audit` (the
decision session, no diff), and `tactic-graph-refsplit-read-coherence`
(conditional on ref-split landing, meaningless otherwise). Two added by the
2026-08-29 split, being exactly what PR15's dropped units would have closed:
`tactic-graph-commit-plumbing-default` and
`tactic-graph-commit-direct-three-way-merge`.

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

### The code-review lock: ratified, with its precondition repaired

**The flock design is ratified, held by the detached child; its broken
precondition is repaired rather than the design replaced.** PR6 implements this;
nothing about it is open.

The contradiction this had to resolve: the flock shipped in #3078, yet
`tactic-eval-finding-detached-code-review-dies-with-launcher` shows the detached
child dies with its launcher anyway despite `setsid` — **a lock held by a
process that dies with its launcher is not a lock.**

The contradiction resolves *in favor of* the design, because it was never a
defect in the lock. It is a defect in the detachment the lock stands on, and
the node itself supplies the falsification: `dispatch-code-review` already runs
`setsid`, already disowns, and already hard-refuses to start without it, so
"establish real detachment via process group / session leader" is a remedy that
**has already shipped and does not work**. `setsid` detaches a process from its
controlling terminal; it does not re-parent the process out of the launcher's
cgroup, and the cgroup is what the harness tears down when the Bash tool call
is interrupted. Both halves were measured on this host.

So the fix is re-parenting, not detaching: `systemd-run --user` places the child
in its **own** transient unit, outside the launcher's cgroup, where a teardown
of the launcher's cgroup cannot reach it. See Unit 1.

The open question — *should the lock be held by the detached child at all, or by
a supervisor that outlives both?* — was answered **child**. Once re-parenting
makes the child genuinely outlive its launcher, a supervisor buys nothing and
adds a second process whose own death is a new failure mode. Unit 2 keeps its
shape.

Unit ordering matters: fix detachment (Unit 1), *show* a detached review
surviving its launcher's exit, and only then build on the lock (Unit 2). The
ruling ratifies the design, not the premise — the demonstration is **Unit 1's own
acceptance test**, not a prior gate on starting the PR.

> **The "still owed" clause is struck (2026-08-30).** This paragraph used to end
> "the demonstration is still owed before Unit 2 is trusted." The 2026-08-29
> ruling recorded in commit `08870461` (PR #3132) discharged it: the author
> accepted the background-teardown proxy, so **Units 2–3 ship without an attended
> interrupt test**. See the RULED block in §PR6.

### `strategy-discovered-requirements` is a separate charter

The `/align` charter split off `strategy-graph-native-dispatch`:

> The author's requirement is discovered under interview and recorded completely
> enough that the record alone carries it — `/align`'s charter: elicitation,
> capture-completeness, and **independent challenge of the draft**.

That last clause is the adversarial draft-review gate; its implementation node's
park cleared when the author ratified the caller-declared `--review` seam. It is
**PR20**.

**Whether more charters should split out is now answered: three, exclusively
re-served.** That is Bundle 9, sequenced last — see the index. It does not
affect PR20, which implements the `/align` charter the earlier split already
established.

---

## Retention — SATISFIED 2026-08-29, no action needed

`aggregate-usage.sh` reads `$HOME/.claude/projects/**/*.jsonl` and selects its
window by **file mtime** (`find -newermt "$SINCE" ! -newermt "$UNTIL"`, `:1459`).

The original requirement — raise `cleanupPeriodDays` past the window plus the
post-resumption measurement period, so the transcripts PR7 and PR11 read
survive until they are measured — is already met: `cleanupPeriodDays: 180` is
set in the user settings (`~/.claude/settings.json`, verified 2026-08-29). The
earlier claim that no retention was configured came from a 2026-08-14
measurement and is stale. 180 days exceeds the 90 the author ruled sufficient;
do not lower it. **No settings change is required before the first PR.**

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

## Measurement runs before the PRs they gate

**Every office-hours sitting this plan once gated a PR on has been held**, and
each ruling is recorded on its node and carried into the PR section that
implements it. Nothing below needs the author.

The three `/rsi-audit` runs that remained were **taken on 2026-08-29** and
recorded on their nodes. They produced no code. Each set a value its PR would
otherwise have taken from an unmeasured source, and two of the three changed
what the PR should do.

**The window every one of them names in this plan was wrong.** The freeze hides
exactly what these runs measure: the pause sentinel is dated 2026-08-10, so a
`7d` window holds 2 sessions and no dispatch phase at all, and a `14d` window
returns `by_phase_outcome {}` with `sidecar_present` 0 of 122 eligible workers.
A **30d** window straddling the freeze (2026-07-30..2026-08-29, 5032 sessions,
`sidecar_present` 431 of 695) is the narrowest one that reads anything, and is
what was run. Hold window width constant across the freeze boundary in any
before/after comparison.

| Run before | Node | Result |
|---|---|---|
| PR7 | `tactic-dispatch-cache-preserving-context` | **Baseline recorded and the imported claim refused.** `hit_ratio` 0.9570; raw `cache_read:cache_creation` 22.30:1; `cache_creation` is **4.3%** of context tokens, which is the arithmetic ceiling on what an append-only layout can save — against an imported 41–80%. `creation_churn` **0 of 401 staggered** sessions. PR7 must not carry the external magnitude |
| PR7 | `tactic-dispatch-observation-masking` | **Cost half taken.** `context_over_120k` 1029 sessions / \$48262 proxy; `payload_bytes.total` 329624854 with Bash + Read at 97%. Ingest-time capping is cache-safe; retro-masking is not. Quality half still deferred and now confirmed unreadable — `by_phase_outcome` carries only review and qa, and nothing at 14d. *(The `context_lens` prose fix this row used to ask for was already applied 2026-08-28 — every asserting use reads `lenses.context_over_120k`. Nothing to do.)* |
| PR11 | `tactic-rsi-measure-fanout-and-model-routing` | **Measured; dated reading recorded on `strategy-recursive-self-improvement`.** Review 68 sessions / 1266 subagents / 31.8% actionable / 6.3 launches per fix at \$12.92; QA 130 / 440 / 7.0 per fix at \$31.87. Opus is 42% of turns and 57% of spend — a **1.91×** measured per-turn premium. **`price_proxy_usd` inverts the model ranking**, so the per-lens `model:` values must be set from `cost_usd` |

**PR3 was expected to make the first two readable; it was not needed.** Every
lens these runs used already emits correctly. Run PR3 at position 5 regardless —
it is in the sequence for its own reasons — but it does not gate a re-measurement.

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

*Model: opus* — exit-code redesign across interacting scripts

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

*Model: sonnet* — verified anchors, merge existing helper output

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

> **⚠ THERE ARE TWO PRODUCER-SIDE HALVES, NOT ONE. The bullet above names only
> the `dispatch-conflict` one. All three units below ship in ONE PR, or none of
> them do.**
>
> The governing node is
> `intentions/tactic-ladder-await-interrupt-rung-vacuous-advanced.md`
> (`phase: implement`, `office_hours: null`, already in this PR's closed list).
> It carries a **three**-unit plan, and its Unit 3 states the dependency in
> terms:
>
> > **Dependencies** — Units 1 and 2. Landing this gate without them turns every
> > `fix` and conflict-interrupt pass into a `stalled` halt.
>
> and, earlier in the same node:
>
> > The vacuity fix and the stamp fix must land in the same change — otherwise
> > the first correct-looking fix to the phase probe converts a dormant mismatch
> > into a live one and turns every conflict-interrupt pass into a `stalled`.
>
> - **Node Unit 1 — `/fix-checks` writes the `fix`-rung lane-pass stamp.**
>   `.claude/skills/fix-checks/SKILL.md` **only**. `/fix-checks` stamps nothing
>   today — the file contains **no `apply-lane-pass` callsite at all** — so once
>   Unit 3 removes the vacuous `advanced`, the ladder has no durable evidence to
>   read on the `fix` rung. Two `apply-lane-pass.ts --stamp --lane fix-checks
>   --phase fix` insertions inside the node-lane completion section: one in the
>   push-outcome block, inserted **after** the `apply-fix-state --record-push
>   "$HEAD_SHA"` call and **before** the single `graph-commit --base` line
>   (reusing the already-computed `HEAD_SHA`), and the second at the section's
>   other state-only write seam. Locate both by content — the anchors in the
>   node have drifted.
> - **Node Unit 2 — `dispatch-conflict` Step 7b stamps the rung, not the node's
>   persisted phase.** This is the half the bullet above already describes.
> - **Node Unit 3 — gate the phase probe on `Phase` membership, and prove it.**
>   `dispatch-ladder-await` + `test-dispatch-ladder-await.sh`, plus
>   doc-comment-only corrections in `packages/intentionsutil/src/schema.ts` and
>   `packages/intentionsutil/scripts/apply-lane-pass.ts`.
>
> **Failure mode if the plan is followed as originally written:** the executor
> lands the `Phase`-membership gate plus the conflict stamp and turns **every
> `/fix-checks` pass into a false `stalled` halt** — a live-ladder outage with no
> warning anywhere in the plan text.

> Stale cross-reference to ignore:
> `intentions/tactic-dispatch-ladder-exit-code-space.md` lists
> `tactic-ladder-await-phase-only-completion-test` under "await test coverage
> gaps". That note predates the shipped coverage and is **not** an outstanding
> obligation.

*Model: opus* — producer-side coordination, false-stall risk

**Unit 4 — blocked node is not honest silence.** `graph-select-target` collapses
blocked/parked/done/absent/reviewed into one empty answer with the reason only
in stderr prose, so `dispatch-ladder-run` classifies a permanently blocked node
as `ci-wait` and re-polls for the full `--ci-wait-s` hour. Emit a distinct
reason and branch on it.

*Model: sonnet* — emit reason code, branch on it

**Unit 5 — transient main dirt is not a contract breach.** One unrelated
modified `intentions/` file made `provision-node-worktree` refuse its
`git merge --ff-only`, `dispatch-graph-execute` return `park-failed`, and
`dispatch-ladder-advance` *(anchor drifted — locate the failed catch-all by
content)* route it through that catch-all to exit 11 — classifying a transient
environment state as `violation`.

> **⚠ THE ONE-DISPOSITION FIX DOES NOT FIX THE DEFECT. Read the node before
> planning.** Governing node:
> `intentions/tactic-eval-finding-main-dirt-halts-ladder-as-violation.md`.
>
> The node's correction D records that `violation` is **not derived from the
> exit code at all**: `classify_terminus` in `dispatch-ladder-run` falls through
> to `printf 'violation'` for any healthy mid-ladder node on any halt. So —
>
> > This makes the finding stronger, and it means re-routing the disposition to
> > exit 10 does not by itself fix the classification. **Both halves have to
> > change.**
>
> and on the disposition arm specifically:
>
> > *Give the disposition its own arm instead of the `failed|*)` catch-all.*
> > **Adopted, and extended** — necessary but not sufficient … Adopted together
> > with the terminus fix (Unit 5) and the graded retry (Units 1-4), so the run
> > first *retries* rather than halting at all.

**Build the node's six units, not one:**

1. **New `dispatch-sync-main` script** + `test-dispatch-sync-main.sh` + CI
   registration. *(opus)* — the repair primitive the rest depends on. It appears
   nowhere else in these plan files; it is net-new scope.
2. `provision-node-worktree` returns **rc 5/6** instead of exit 2, so the caller
   can tell a transient sync failure from a contract breach. *(sonnet)*
3. `dispatch-graph-execute` answers a transient sync failure with a **repair,
   never a park**. *(opus)*
4. The ladder **retries** at **both** halt sites — including the second site in
   `dispatch-ladder-run` that the finding's original write-up missed. *(opus)*
5. A new **`excused-environment`** terminus token threaded across
   `dispatch-ladder-run`, `dispatch-ladder-status`, the ladder `SKILL.md` and the
   tests — this is the half that actually stops `violation` being spent on
   transient environment state.
6. Retire the tick's inline copy of the sync logic *(conditional on unit 1)*.

**Ship-as-written failure mode:** the exit code changes, `classify_terminus`
still prints `violation`, the finding recurs, and the record reads as fixed.

*Model: opus* — four of the node's six units are opus; this is not a
one-disposition change

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

*Model: opus* — unplanned investigation requiring judgment

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
longer "out of this plan"**: the overhang retirement sequenced it in as **§PR5a**,
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

*Model: opus* — step 2 decides wait representations

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

> **In-flight overhang.** Planned, no PR:
> **`tactic-review-lows-automation`** — the 2026-07-05 review lows on the live
> surface (CI-wrapper false-green patterns, hook edge defects, `fetch-*`
> error-helper dedup). See §"In-flight work outside this plan".
>
> **⚠ Corrected 2026-08-30 — the named surface was wrong.** This banner used to
> end "touching `aggregate-usage.sh`, `dispatch-reclaim-audit` and `lib.sh`".
> Its three units touch **none** of those:
> `intentions/tactic-review-lows-automation.md` (`office_hours: null`,
> `phase: implement`, `status: codified`) scopes Unit 1 to `run-lint.sh` and
> `run-typecheck.sh`, Unit 2 to `statusline.sh` and `worktree-remove.sh`, and
> Unit 3 to `fetch-psi.sh` and `fetch-analytics.sh`. `aggregate-usage.sh`,
> `dispatch-reclaim-audit` and `lib.sh` appear only under the node's
> ***"Dispositions of the findings left out of this node's plan"***. The fold is
> a **disjoint** surface from the rest of this PR — see the matching callout in
> `### Nodes closed` and Unit 8 in Scope.

**Recommended model: sonnet** — mostly additive jq lenses in one script, with
one `find` predicate fix. Escalate to opus only if Unit 1 finds the scoping
work genuinely incomplete.

### Context

The instrument is `.claude/skills/rsi-audit/scripts/aggregate-usage.sh` (1547
lines). Three of its lens nodes are already shipped and only need verification
and closing; two lenses are genuinely missing; and three findings say the
instrument is blind to the very workers it is meant to measure.

### Nodes closed (9)

*Residual verification — ⚠ NOT close-only. Two of these three are `phase:
implement`, `status: codified` and carry full two-unit plans; see Unit 1 in
Scope before closing anything:*
- `tactic-audit-instrument-scoping` *(⚠ parked — `office_hours` non-null,
  `phase: null` on `origin/main` 2026-08-30; not autonomously selectable)*
- `tactic-audit-cache-efficiency-lens`
- `tactic-rsi-round-trips-lens-carrier`

> **⛔ `tactic-audit-permission-friction` was REMOVED from this list 2026-08-30.**
> It closed on `origin/main` as `91bc7cc9` — a Ruling-1 sibling-carrier
> completion record: `status: codified`, `phase: done`, `office_hours: null`,
> `execution.completion` against PR #3074. PR3 has nothing to close on it and
> must not re-stamp it. **Two items its 2026-08-18 park raised are NOT
> discharged** — the side-A failed condition and clarification 43's
> never-performed `/fewer-permission-prompts` collision check. Both are
> transcribed on the node under *"Two items the 2026-08-18 park raised that
> Ruling 1 does NOT answer"* and are owed to an `/align` pass on
> `strategy-token-economy`. That node is now `phase: done`, so no router will
> ever surface them — carry the items forward here or they are lost.

*Real work:*
- `tactic-audit-review-effort-yield-lens`
- `tactic-rsi-lane-token-attribution`
- `tactic-eval-finding-sidecar-monitor-post-filter-self-conceals`
- `tactic-eval-finding-ladder-worker-unstamped-audit-blind`
- `tactic-eval-finding-align-tactics-worker-transcript-unscanned`
- `tactic-review-lows-automation` *(folded in from the overhang)*

> **⚠ CORRECTED 2026-08-30 — the folded node does NOT land on this PR's
> surface, and it has no unit.** This callout used to claim
> `tactic-review-lows-automation` lands on `aggregate-usage.sh`,
> `dispatch-reclaim-audit` and `lib.sh`. Its three units touch **none** of those.
> Its real surface is `run-lint.sh`, `run-typecheck.sh`, `statusline.sh`,
> `worktree-remove.sh`, `fetch-psi.sh` and `fetch-analytics.sh` — a disjoint set
> from everything else in this PR.
>
> It also sits in the `### Nodes closed` list above with **no unit in Scope
> implementing it** — see Unit 8 below, added 2026-08-30. If Unit 8 is not built,
> remove the node from the closed list rather than closing it undone.

### Scope

**Unit 1 — residual verification (do first). ⚠ NOT close-only.** Read each of
the three nodes' units *and* success criteria before deciding anything is
diff-free.

> **Corrected 2026-08-30.** This unit used to be framed as "verify-and-close
> (likely no diff)" across all four. Two of them —
> `tactic-audit-cache-efficiency-lens` and `tactic-rsi-round-trips-lens-carrier`
> — are `phase: implement`, `status: codified`, and carry **full two-unit
> plans**. They are not close-only, and the "close the four verify-and-close
> nodes before any implementation" instruction is **not** transcribed onto any
> node (see `plans/dispatch-rsi-author-rulings.md`: DO NOT TRANSCRIBE — it would
> canonize this contradiction).

Evidence gathered during planning:

| Node | Evidence on `main` |
|---|---|
| `audit-instrument-scoping` | `--session`/`--node` documented `aggregate-usage.sh:21-47`; `scope:{type,id}` emitted `:1463,1488` |
| `audit-cache-efficiency-lens` | `hit_ratio: {window, by_phase}`, `:1211` |
| `rsi-round-trips-lens-carrier` | `boot_preamble` block, `:1335`; `scriptable_round_trips` present |

> *(`audit-permission-friction` was the fourth row here until 2026-08-30. It
> left PR3's scope when the node closed on `origin/main` as `91bc7cc9` — see the
> ⛔ callout under `### Nodes closed (9)`. Its lens is present in
> `aggregate-usage.sh`; locate `lenses.permission_friction` by name if you need
> it, but do not verify or re-stamp the node from here.)*

Residual work actually observed: `audit-instrument-scoping` asks for
fleet-denominator lenses tagged **fleet-only**.

> *(This paragraph also used to say `audit-permission-friction` "asks for a
> closing `/fewer-permission-prompts` step on the attended audit — check whether
> that exists". Struck 2026-08-30: that step is genuinely outstanding, but it is
> **not PR3 work** — the node closed anyway as a Ruling-1 completion record and
> the outstanding half was transcribed into the node body. See the bullet under
> §"Read this before planning any of it".)*

> **⛔ Do NOT ratify the `fleet-only` tag across every fleet-denominator lens.**
> *(Struck 2026-08-30.* This paragraph used to end "the vocabulary appears at
> `:1164` and `:1463` — confirm every fleet-denominator lens carries it".*)*
> That is the exact tag `tactic-rsi-lens-catalog-decomposition` **rules
> insufficient** (`:159-161`): the binary `any-scope`/`fleet-only` vocabulary
> cannot hold, because four ruled lenses are `[node]`-only and are exactly the
> ones ***"the binary vocabulary had no word for"***. That node rules the **new
> `scope: [node, fleet]` list** in its place.
>
> *(Citation corrected 2026-08-30. This paragraph used to attribute both the
> ruling and the new list to `tactic-rsi-round-trips-lens-carrier`. It rules
> neither: that node keeps the binary vocabulary and refines it — its Unit 1 at
> `:160` re-tags a lens **`any-scope`**, its Reuse at `:325` says ***"do not
> invent a new tag vocabulary"***, and `:310` puts the bracket-tag column out of
> scope. The list is `tactic-rsi-lens-catalog-decomposition`'s, which is PR11's
> own node.)* Ratifying the binary tag here would
> canonize a vocabulary PR10 then has to unpick — see PR10's Reuse note. Record
> the scoping question as answered by the sibling node and move on.

*Model: sonnet* — verification against explicit criteria table

**Unit 2 — stale path prose.** Six node bodies name
`.claude/skills/dispatch-token-audit/scripts/aggregate-usage.sh`. That skill
does not exist on `main`. Correct the prose to
`.claude/skills/rsi-audit/scripts/aggregate-usage.sh` in every node body this
PR touches. (Prose-only; `validate-graph` prose refs must stay at 0 unresolved.)

*Model: sonnet* — mechanical path correction in prose

**Unit 3 — review-effort yield lens.** Confirmed absent (zero matches for
`review_effort` / `effort_yield`).

> **⚠ THE NODE IS PARKED, AND THE ORIGINAL SPEC IS NOT SHIPPABLE.**
> `intentions/tactic-audit-review-effort-yield-lens.md` carries a non-null
> `office_hours` (`since: 2026-08-18`) recording **"AUTHOR RULING NEEDED, (a) or
> (b)"**, because the findings axis has **no admissible input**: nothing on the
> live surface emits per-source findings counts keyed by effort, so "findings and
> applied fixes per built-in `/code-review` run, bucketed by effort level" cannot
> be computed from source-verified data. This is one of the four Position-5 parks
> the index omitted until 2026-08-30.
>
> **EXECUTOR DECISION, 2026-08-30 — take option (b)** (recorded for ratification
> in `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"):
>
> > (b) ship the lens on **source-verified figures only** — `touched_files_count`
> > as the fix-yield term plus effort, model, wall clock and price proxy — and
> > record that the findings half of clarification 46's comparison is **not
> > measurable today**, so the `high` raise stays an unmeasured quality bet on
> > the findings axis.
>
> Why (b): option (a) requires a coordinated write-side instrumentation change
> across five surfaces (`.claude/docs/outcome-envelope.md`,
> `dispatch-emit-outcome`, both `review-fix` terminal call sites, and
> `aggregate-usage.sh`'s reader) **and** an explicit ruling that a
> structuring-subagent-parsed findings count clears condition 3's "accounting is
> verified" bar — a doctrine change inventing a provenance standard this batch
> has no mandate to set. (b) ships a real lens today on figures that are already
> source-verified and records the unmeasurable half honestly.
>
> **Consequences to carry:** `result.json`'s per-source dispositions stay
> **non-durable** — that is a deliberate design choice, and (b) does not disturb
> it. Clear the park in the same write, citing this decision.

*Model: sonnet* — additive jq lens over source-verified fields only

**Unit 4 — rsi-lane token attribution.** Make rsi-family and research-lane
session spend attributable, so the strategy's per-workflow spend condition can be
read at all.

> **⚠ The missing `rsi_lane` bucket is NOT the defect.**
> `intentions/tactic-rsi-lane-token-attribution.md`: *"The original draft's
> framing — 'bucket rsi as rsi' — **is wrong and is retired here.**"* This unit
> used to open "Confirmed absent (zero matches for `rsi_lane`)", reading the
> absent bucket as the finding. It is not. **Read the node's own ruled scope
> before planning the unit**; do not implement an `rsi_lane` bucket on the
> strength of the grep.

*Model: opus* — attribution semantics are ruled on the node, not left open

**Unit 5 — sidecar monitor self-conceals.** `aggregate-usage.sh:1347-1349`
(verified):

```
sidecar_eligible: ( [ $sessions[] | select(.type=="worker") ] | length ),
sidecar_present:  ( [ $sessions[] | select(.type=="worker" and .artifact!=null) ] | length ),
```

`$sessions` is the **post-filter** list, so under `--node` a session missing its
sidecar leaves both numerator and denominator, and the monitor reports
`eligible:0 / rate:null` — indistinguishable from "no workers scanned" —
exactly when the stamping it monitors has failed.

> **⛔ Do NOT apply the pre-filter denominator remedy — but the node is NOT
> parked, and this unit IS built.** *(Corrected 2026-08-30; the earlier
> 2026-08-30 pass itself got this wrong and said "The node PARKS it … Ship PR3
> without this unit and leave the node parked", tagged "Model: n/a — parked, not
> implemented in this PR". Both halves are false.)*
> `intentions/tactic-eval-finding-sidecar-monitor-post-filter-self-conceals.md`
> is `status: codified` (`:11`), `phase: implement` (`:27`),
> **`office_hours: null`** (`:31`) — unparked and selectable — and carries a full
> three-unit plan (`:223`, `:301`, `:362`, plus Reuse at `:396` and Verification
> at `:445`).
>
> What the node rules out is the **pre-filter remedy specifically**: at `--node`
> scope it would report a window-wide population as the denominator of a
> node-scoped field, which "silently changes what a documented field means and
> would need an author ruling" (`:169-170`). The "must park" clause at `:176-178`
> is conditional and prospective — *"A **future round** that instead redefines
> the node-scope denominator owes an author ruling and must park for it"* — and
> does not describe this node.
>
> **Build the node's ruled shape instead.** It is deliberately additive precisely
> so that no ruling is owed: emit a distinguishable count of candidates dropped
> for want of a stamp, plus a `sidecar_coverage_measurable` flag, leaving
> `sidecar_eligible` / `sidecar_present` / `sidecar_present_rate` untouched at
> `:1346-1354` (that is the node's own Unit 1 item 5 at `:255` — a guard inside
> the work, not a reason to skip it). Read the node's three units before
> planning.
>
> **Closed-list consequence.** This node sits in `### Nodes closed` above.
> Apply the same rule stated there for Unit 8: if the three units are not built,
> **remove the id from the closed list** rather than closing it undone.

*Model: sonnet* — additive jq fields plus regression tests, per the node's ruled shape

**Unit 6 — ladder workers born unstamped.** Detached ladder phase workers get no
`.dispatch-stamp.json`, so `--node` scans zero files.

> **⚠ THE ROOT CAUSE IN THE OLD TEXT IS REFUTED, AND ITS FIX IS IMPOSSIBLE TO
> BUILD.** This unit used to read: "The `SessionStart` hook
> (`.claude/hooks/stamp-dispatch-session.sh`) does not mint stamps for
> `claude --bg` workers. Mint at spawn."
> `intentions/tactic-eval-finding-ladder-worker-unstamped-audit-blind.md` records
> that claim verbatim and answers ***"That is refuted."*** — the hook's own
> transcript output proves `SessionStart:startup` **does** fire for detached
> `claude --bg` workers, and local `git` access works. And **"Mint at spawn" is a
> launcher-side mint, which the node rejects as *structurally impossible***.
> Following the old text builds a mechanism that cannot exist.
>
> **The actual defect, per the node:** *"the hook process does not run in the
> session's own working tree."* The worker is born with cwd = its worktree, but
> the hook executes with cwd = the **main checkout** (on `main`), so Mode A's
> worker-branch gate correctly no-ops. Every git read in Mode A takes ambient
> cwd, which the hook does not control.
>
> **The node's ruled fix — one stamp writer, taking its tree as an argument,
> driven only by hooks:** `dispatch-stamp-session` stops inferring the tree from
> ambient cwd and takes **`--repo-dir` explicitly** (the same lesson already
> applied to `dump-node.ts --dir`, `validate-graph`'s positional store, and
> `graph-commit -C`). The hook resolves the session's real working tree **from
> the payload it already receives** and passes it in. The same hook is bound a
> second time to `Stop` as an **idempotent-create backstop**. No skill prose, no
> per-lane duplication, no new instrument.
>
> **Also rejected on the node, do not revive:** a per-phase-skill scripted mint
> (sandboxed Bash cannot write under `~/.claude/projects`, and a forgotten
> `dangerouslyDisableSandbox` fails silently at exit 0); a mint inside
> `dispatch-context-pack` (same sandbox denial); backfilling the unstamped window
> (`repo`/`base_sha` would be fabricated join keys).
>
> **Live hazard to keep in mind:** because the sidecar *path* comes from the
> payload while the *content* comes from ambient cwd, a hook running in a main
> checkout that happens to be on a `tactic-*`/`graph-*` branch would mint a
> sidecar for someone else's session carrying the **wrong** `node_id` — worse
> than absence. Audited 2026-08-18: all 1682 existing sidecars are consistent, so
> no misattribution has occurred yet.
>
> **Execution note:** `.claude/hooks/`, `.claude/skills/` and
> `.claude/settings.json` are read-only sandbox carve-outs — see
> `.claude/rules/sandbox.md`.

*Model: opus* — the fix is a payload-derived tree resolution plus a second hook
binding, not rote wiring

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

*Model: sonnet* — widen one find predicate

**Unit 8 — the folded `tactic-review-lows-automation` node** *(added 2026-08-30 —
the node was in `### Nodes closed` with no unit implementing it)*. Its three
units are the 2026-07-05 review lows on the live surface: CI-wrapper false-green
patterns, hook edge defects, and `fetch-*` error-helper dedup. **Its surface is
disjoint from the rest of this PR** — `run-lint.sh`, `run-typecheck.sh`,
`statusline.sh`, `worktree-remove.sh`, `fetch-psi.sh`, `fetch-analytics.sh` —
so it neither reuses nor conflicts with the instrument work. Read the node's own
three units; do not re-derive them from this sentence.

> If this unit is not built, **remove the node from the `### Nodes closed` list**
> rather than closing work that did not ship. Do not close it undone.

*Model: sonnet* — three localized script fixes on a disjoint surface

### Dependencies

PR1. Units 6 → 7 internally. Unit 8 is independent of Units 1–7 and may land in
any order.

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
and the private finding-writers collapsing into one write surface.

> **⚠ "Five writers" is struck (2026-08-30).** This line used to end "and five
> writers collapsing into one".
> `intentions/tactic-finding-search-all-producers.md:377-380` records that census
> as measured wrong — the real figures are **16 CREATE sites / 47 write calls /
> 27 callers** — and says in terms: ***"The census's 'five writers' was wrong
> about both."*** Enumerate the CREATE sites from the node's measured census
> before scoping the collapse; a five-writer scope silently leaves eleven
> producers minting outside the surface. See PR4 Unit 1 in Scope.

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

> **Unit 8's node was filed after the fact**, and it is **PARKED**. PR1's
> closing batch could not carry a `create` (see the `--base` hazard in §"Closing
> nodes after each merge"), so it landed separately on `main` as `920492be`.
> `intentions/tactic-graph-prose-ref-batch-wiring.md` is `owner: ai`,
> `status: raw`, `phase: null`, `execution: null`, `blocked_by: []` — **and its
> `office_hours` is NON-NULL, `since: 2026-08-19**, `session_type:
> requirement-discovery`, with a recommendation recorded. It is not
> executor-dischargeable and it is not autonomously selectable
> (`packages/intentionsutil/src/router.ts:482` / `:529` skip parked tactics).

### Scope

**Unit 1 — retire the class marker.** Remove `isLedgerEntry`
(`packages/intentionsutil/src/schema.ts:529` — verified) and its one live call
site (`packages/intentionsutil/scripts/graph-census-debt.ts:143` — verified):

```ts
if (n.phase === "done" && !isLedgerEntry(n)) donePresent.push(n.id);
```

Re-key that prune exemption to **any node carrying
`attributes.measured_impact`**. Update `intentions/kind-tactic.md`.

> **⛔ DO NOT RUN THE BULK STRIP.** *(Struck 2026-08-30.* This unit used to
> continue: "Then strip `attributes.ledger_entry` from the **40** nodes that
> carry it (`grep -rl 'ledger_entry: true' intentions/`)."*)*
> `intentions/tactic-eval-finding-ledger.md` puts the bulk strip in its
> **`## Out of scope`** section — the migration is not this node's work.
> Independently, the count is wrong: measured 2026-08-30, **42** files carry the
> attribute, not 40, so the verification fence built on "40" fails regardless of
> the doctrine question.

*Model: sonnet* — verified anchors, doc update only; no data migration

**Unit 2 — retire the namespace as a membership test.** In
`.claude/skills/dispatch-propagate/scripts/dispatch-eval-finding`: widen the
**mint-or-reuse search** from the `tactic-eval-finding-*` namespace to the whole
open tactic set. The site is the prefix+attribute filter near `:422-428`
*(anchor drifted — locate by content)*.

> **⛔ `ID_PREFIX` and the anchored id regex are NOT part of this unit.**
> *(Struck 2026-08-30.* This unit used to list `ID_PREFIX` at `:258` and the
> anchored id regex at `:593` — `^tactic-eval-finding-[a-z0-9]+(-[a-z0-9]+)*$` —
> in its retire list.*)* The node rules the opposite: ***"The mint namespace
> stays."*** and ***"Do not repurpose `ID_PREFIX` as a search filter."***
> `/rsi`'s own entries keep minting into `tactic-eval-finding-*`; what changes is
> only what the *search* looks at.

*Model: sonnet* — widen one filter

**Unit 3 — one find-or-recur write surface.** Collapse the private follow-up
writers into one surface every producer calls: an optional deterministic key plus
a whole-graph similarity search, with a key/search **disagreement recorded as a
finding** rather than resolved silently.

> **⛔ DO NOT USE A FIVE-WRITER LIST.** *(Struck 2026-08-30.* This unit used to
> enumerate exactly five — `dispatch-invalid-state-followup`,
> `dispatch-followup-exists`, `dispatch-security-followup`,
> `dispatch-qa-needs-main-followup`, `dispatch-eval-finding`.*)*
> `intentions/tactic-finding-search-all-producers.md` records that census as
> **measured wrong**: the real figures are **16 CREATE sites / 47 calls / 27
> callers**. The plan's list also omits `dispatch-fleet-alarm`, which appears
> even in the node's own stale table. **Enumerate the CREATE sites from the
> node's measured census** before planning the collapse; a five-writer scope
> silently leaves eleven producers minting outside the surface.

> Out of scope per the doctrine node: the find-before-minting step inside each
> producer's *skill* body. That is `tactic-finding-search-all-producers`'s own
> scope — which is Unit 3 here.
>
> **The "keep the skill-body edits minimal and mechanical" constraint is
> struck** *(2026-08-30)*: it is contradicted by the node's own item 5, which
> requires a non-mechanical edit. It is also flagged **DO NOT TRANSCRIBE** in
> `plans/dispatch-rsi-author-rulings.md` — it was executor prose, not a ruling.

*Model: opus* — 16 CREATE sites collapse into one design

**Unit 4 — in-flight guard is permanent.** `dispatch-eval-finding:936`,
`:1004`, `:1166` *(from node body — re-locate)*. The guard gates on
`execution == null`, but `execution` stays non-null after a fix merges, so a
fixed entry can never record another occurrence.

> **Gate on `execution != null` **and** the node is an OPEN tactic.** *(Corrected
> 2026-08-30.* This unit used to say "Gate on 'execution is non-null **and** not
> yet resolved'."*)* The node **refutes the resolution-keyed reading twice** and
> adopts open-tactic membership instead — `isOpenTactic`, not a `resolved_by`
> probe. Use the node's condition verbatim; the two are not equivalent, because a
> resolved entry may still be an open tactic and vice versa.

*Model: sonnet* — narrow guard-condition change

**Unit 5 — `--list` reads a stale working tree.** `dispatch-eval-finding:44-51`,
`:420-424`, `graph-commit:1481` *(from node body — re-locate)*. The plumbing
writer never moves the checkout HEAD and restores node files to HEAD content
after a verified land, so the read path cannot see the write path and the
similarity judgment mints duplicate slugs. Read from `origin/main`, not the
working tree.

*Model: sonnet* — decision made, redirect the read

**Unit 6 — lost writes exit 0.** `dispatch-eval-finding:205-208`, `:298` *(from
node body — re-locate)*. `skipped-locked` and `skipped-in-flight` are documented
lost writes but exit `0` like `landed`, so a chaining caller proceeds as if the
write succeeded — one `--resolved-by` loss let a chained `--retire` retire an
entry with no `resolved_by`.

> **Give them ONE shared non-zero code, not two.** *(Corrected 2026-08-30.* This
> unit used to read "Give them distinct non-zero codes."*)* The node's §3 is
> titled ***"One code, not two"*** and forbids the split: the caller's only
> decision is "did the write land", and two codes invite a caller to branch on a
> distinction that carries no action.

*Model: sonnet* — exit-code plumbing

**Unit 7 — duplicate-findings sensor.** Count distinct tactics recording the
same root-cause defect, read over tactics carrying `attributes.measured_impact`,
attributed to `/rsi`. **Must come after Unit 1** — the node's own
`## Dependencies` section says the namespace must stop being the membership test
before the count is meaningful.

*Model: opus* — root-cause similarity semantics undefined

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

> **⛔ THE ORIGINAL UNIT-8 SCOPE IS REFUTED. RESCOPED TO THE NODE'S OPTION 3 —
> RETIRE `batchIds`.**
>
> The scope this section previously directed — *"give `validate-graph.ts` a
> `--batch <id[,id…]>` flag that feeds the fifth argument, **and** have the write
> path declare the ids in flight when it invokes the validator"* — is the node's
> option 1 **plus** its option 2, and the node's park refutes **both by name**,
> verified at HEAD on 2026-08-19 (`origin/main` `cfd3b4f0`):
>
> > **Option 1** (a `--batch` flag fed by `graph-fast-path.yml`) **cannot work as
> > framed**: the workflow can enumerate only the current push, and the failure
> > is cross-push by construction.
> > **Option 2** (the writer declares it) **cannot work as framed either**:
> > `dispatch-eval-finding` is a different process from the validator and can
> > pass it no argument.
>
> **BOUNDING RISK recorded on the node:** an id declared but never minted lands a
> genuinely dangling prose reference on `main`; the next unrelated graph write's
> guard job validates the whole store, goes red, and — because all four required
> contexts declare `needs: guard` — **blocks every graph writer in the repo**.
> That is the 2026-08-14 repo-wide write-denial class.
>
> **EXECUTOR DECISION, 2026-08-30 (recorded for ratification in
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"): rule the node's OPTION 3 directly — NO, store content only.**
> The node's own `office_hours.recommendation` states that this is sufficient and
> that the strategy question need not be opened: *"If you would rather not open
> the strategy question at all, ruling option 3 directly on this node is
> sufficient to unblock it."* Options 1 and 2 are both verified unimplementable,
> and `batchIds` is an unwired fifth parameter with no production caller — so the
> honest outcome is to delete the affordance rather than build a declaration
> channel that cannot be made honest.
>
> **Unit 8's rescoped work, verbatim from the node's option 3:**
>
> - Delete the `batchIds` parameter and its exemption from
>   `validateGraphProseRefs`.
> - **Rewrite** (do not delete) the tests at
>   `packages/intentionsutil/test/schema.test.ts` *(anchor drifted — the node
>   cites `:2296-2352`; locate by content)* so they document why the exemption is
>   **not** offered. Coverage of the surrounding prose-ref rule must not shrink;
>   `.claude/rules/test-integrity.md` forbids weakening a test, and a test for a
>   deleted parameter is replaced, never dropped.
> - Add the hand-ordering constraint plus the retryable-after-reordering note to
>   `/rsi` step 6 (`.claude/skills/rsi/SKILL.md` — locate step 6 by content).
> - Keep the node body's **reproduction requirement**: mint two ledger entries in
>   separate `dispatch-eval-finding` invocations where the first names the
>   second, and confirm the failure before and the intended behavior after.
>
> **Clear the park in the same change**, citing the option-3 ruling in the
> clear-park commit, per the node's step 1.
>
> The sequencing argument that previously justified landing Unit 8 after Unit 3
> ("that surface is the only place a `--batch` declaration can be honest") rests
> on option 2's premise and is refuted with it. Unit 8 no longer depends on Unit
> 3 at all and may land in any order within PR4.

> **The node already exists — do not file a second one.** This paragraph
> previously read "This residual has no node", contradicting the same PR
> section's own statement above that the node was filed after the fact and
> landed on `main` as `920492be`. The node is
> `intentions/tactic-graph-prose-ref-batch-wiring.md`; it is present, it is
> parked, and minting a duplicate would create the duplicate-target pair that
> clarification 78 (`4a83dfc1`) was ratified to prevent.
>
> The affected node,
> `tactic-eval-finding-eval-finding-forward-crossref-fails-ci`, closed with an
> implementation-record note stating the library half landed and the caller half
> did not — so that record is honest, and the remaining work **is** represented
> in the graph, on the parked node above.

*Model: sonnet* — flag wiring, scope fully specified

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

*Added by the overhang retirement. This node was never in the plan's original
scope — it was `phase: implement` on 2026-08-14, so the `phase: null` filter
excluded it (§"In-flight work outside this plan").*

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

> **Two hazards in Unit 7's own enumeration, measured 2026-08-30.**
>
> 1. **The node's enumeration misses the NUL-byte node.** The node names 13
>    `main-qa` + 1 `qa` = 14 nodes / 20 marks "measured at `f8bea654`". Measured
>    today: **15 nodes / 22 bullets**. The missing one is
>    `tactic-review-verify-per-file-batching` (`phase: main-qa`, parked, 2
>    bullets) — the file that carries a literal NUL byte, which a plain `grep`
>    silently drops. An executor following the enumeration literally skips it,
>    and the node's own ```verify``` fence uses a file-level `grep -q` that
>    **will** flag it — so the migration fails its own verification. **Use
>    `LC_ALL=C grep -a` and re-take the census before implementing.**
> 2. **The `blocked_by` edge does not clear as the Dependencies section below
>    claims.** That section says the blocker's PR merged 2026-08-20 and "The edge
>    clears when the reconciler runs, not by hand." Verified:
>    `intentions/tactic-wait-calendar-release.md` is `phase: main-qa`, unparked —
>    but `blockersComplete` (`packages/intentionsutil/src/router.ts:307-313`)
>    requires `blocker.phase === "done"`. The node stays **unselectable** until
>    the blocker reaches `done`, not merely until its PR merges.
>
> Also correct the index's "12 of the 17" claim: right numerator, wrong
> denominator. Under both Unit 7's spec and the node's own verify predicate the
> population is **15 nodes, 12 of them parked**. "17" is reachable only by
> counting non-`done` tactics that merely mention the string. The operative
> conclusion — 12 parked sources deadlock the migration chain — stands.

*Model: opus* — correctness change to residue routing

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
> **PR8 owns the single conflict policy; PR5 has NO conflict-lane unit.**
> *(Corrected 2026-08-30.* This sentence used to read "#3018's conflict-lane work
> (absorbed into PR8) must be coordinated with this PR's own conflict-lane unit —
> one policy, not two." It presupposes the conflict-lane unit that
> `tactic-review-stall-conflict-lane`'s dead-premise park deleted; see Scope.
> There is nothing left here to coordinate.*)*
>
> The **#3002 and #3064 absorptions above stand** — they are recorded plan-side
> facts about which drafts this PR converges, not rulings. No node rules on
> either; treated as executor bookkeeping and left in place (recorded for
> ratification in `plans/dispatch-rsi-author-rulings.md`).

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
- **`:186`** — duplicate `gh_pr_view_rest` fetch. Memoize the PR JSON
  **narrowly, within the review-stall sweep only — never exported tick-wide.**
  *(Corrected 2026-08-30.* The former wording offered "memoize per-PR JSON for
  the tick" as an option. `intentions/tactic-review-stall-pr-json-duplicate-fetch.md`
  rejects it by name — *"That option is rejected here … do not take it"*, and
  *"the memo must be narrowly armed … never exported tick-wide"* — because a
  tick-wide memo feeds a cached **pre-merge** body to `graph-select-target`'s
  freshness read and **reintroduces the stale-review-target bug**.*)*
- **`:214`** (with `.claude/skills/dispatch-propagate/scripts/lib.sh:829-831`) —
  read `.mergeable` first so `CONFLICTING` short-circuits without a CI call.
  *(Corrected 2026-08-30.* This bullet used to add "and skip candidates whose
  head sha is unchanged since the last sweep found no regression". That is
  verbatim the node's Fix 2, which
  `intentions/tactic-review-stall-ci-verdict-cache-miss.md` marks *"is
  deliberately SCOPED OUT"*. Keep only the `.mergeable`-first short-circuit.*)*
- **`:220`** — add the **documented superset cost pre-filter** that already ships
  on the sibling callsite, so the `node --import tsx/esm` subprocess is skipped
  on the overwhelmingly common quiet candidate.
  *(Corrected 2026-08-30.* This bullet used to offer "evaluate the pure
  `reviewStallRoute` predicate inline in bash, or batch all candidates through
  one subprocess". `intentions/tactic-review-stall-predicate-subprocess-spawn.md`
  **refuses both by name**: *"Do not reimplement the routing rule in bash, and do
  not batch."*)*
  - Copy `graph-select-target`'s `_gate_maybe_interrupt` guard verbatim in
    shape: skip the spawn when
    `[[ "$_CI_VERDICT" != "failing" && "$_CI_MERGEABLE" != "CONFLICTING" ]]`.
    This decides nothing — `interruptRoute`'s published doc comment and the
    exhaustive `transitions.test.ts` case named *"the shell pre-filter's superset
    invariant"* pin that the answer is `null` outside those two conditions.
  - **Keep the full documented superset. Do not narrow it to `ci == failing`**,
    even though this sweep's `conflict` route is a deliberate retired no-op — the
    node records that judgement call explicitly so it is not relitigated.
  - **Do not author a duplicate** of the superset-invariant test; it exists and
    is exhaustive.
  - Two units, **both sonnet**: (1) the guard, (2) regression cases pinning it in
    the existing harness.
- ~~**Conflict lane**~~ — **⛔ DELETED 2026-08-30. Do not build this unit.**
  It read: "enter conflict resolution on a `CONFLICTING` reviewed node instead of
  holding it, converging the two conflict producers on one policy."
  `intentions/tactic-review-stall-conflict-lane.md` is **parked on a dead
  premise** and its recommendation is to prune: the arm was retired to a bare
  `continue` in `fa9c4338`, and **three sibling PR5 nodes build on that
  retirement** — re-adding the lane breaks them. (This is Position 4's one park,
  which the index does carry.) PR8 owns the single conflict policy.
- **Base pin** — pin the diagnosis-time base blob on the landing
  `graph-commit` so a concurrently landed write is three-way merged rather than
  clobbered by a stale in-memory node.

**Separately**, `tactic-done-node-retention-scan-cost`: bound the cost of
retaining done tactics on disk for the every-tick full-scan callers.

> **⚠ The three call sites this paragraph used to name are the node's
> `### Explicitly out of scope` list.** It cited `reconcile-graph.ts:186`,
> `store.ts:128` and `graph-census-debt.ts:160`. The node forbids all three:
> *"never edit `listNodes` / `listNodesStrict` / `listNodesResilient` themselves,
> and never edit the four call sites it wires"* (the reconcile band belongs to
> `tactic-review-stall-listnodes-duplicate-scan`).
>
> **The node's real three call sites**, which
> `tactic-review-stall-listnodes-duplicate-scan` deliberately left unwired "to be
> picked up by later tactics" — and this node *is* that later tactic — are:
> `packages/intentionsutil/scripts/select-targets.ts` (the enumeration near
> `:58`), `dispatch-graph-census`, and `dispatch-graph-scope-sweep`. Locate each
> by content.
>
> **Two units, per the node:**
> 1. **A *tolerant* cached read** — `listNodesCached(dir, cacheDir)` added to
>    `packages/intentionsutil/src/store-cache.ts` (extend that file, do **not**
>    fork it), wired into census and scope-sweep, which use `listNodes` rather
>    than `listNodesStrict` and must keep degrading rather than fail closed.
> 2. **A tree-sha-keyed path for `graph-select-target`**, whose store is a `git
>    archive` snapshot of `origin/main` into a fresh `mktemp -d` — a different
>    directory every tick, so a resolved-dir-plus-fingerprint key can never hit.
>
> **Prerequisite, and a `blocked_by` edge:** the node is
> `blocked_by [tactic-review-stall-listnodes-duplicate-scan]`, which owns the
> `store-cache.ts` primitive. Before writing any code, confirm
> `packages/intentionsutil/src/store-cache.ts` exists on `origin/main` and exports
> `storeFingerprint` and `listNodesStrictCached`. **If it does not, stop and
> leave the edge in place — do not park, and do not reimplement the primitive
> here.**

*Model: per unit — read each node's own `**Recommended model**` line; do NOT
apply one PR-level tag.* This line used to read "*Model: sonnet* — localized
efficiency fixes, clear shapes". Corrected 2026-08-30: **8 of the node-authored
units in this PR are rated `opus` by their own nodes**, and a PR-level `sonnet`
silently overrides every one of them. The predicate-spawn node's two units are
genuinely `sonnet`; the retention-scan, base-pin and CI-verdict units are not.

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
>   the smaller diff. See §PR5a.
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

> **In-flight overhang.** Planned, no PR:
> **`tactic-review-code-review-invocation-contract-main-qa-regression`** —
> corrects the recorded `dispatch-code-review` invocation contract (whether
> `--comment` is always passed, and whether the built-in `/code-review low --fix`
> pre-stage runs to completion). This PR owns that script. See §"In-flight work
> outside this plan".

**Recommended model: opus** — process lifetime, kernel locks and a
write-attribution race.

> **No gate.** The flock design this PR implements was ratified by the author:
> the flock stays, held by the detached child, and Unit 1 is re-scoped to
> `systemd-run --user` re-parenting. See §"The code-review lock: ratified, with
> its precondition repaired" for the full ruling.

### Context

Four findings on `dispatch-code-review` (1411 lines). One is a falsification:
the node lock shipped in PR #3078, but the detached child **still dies with its
launcher** despite `setsid` — so the lock node's fix does not hold. Ruled
2026-08-28: the lock design stands, the detachment under it does not, and the
repair is `systemd-run --user` re-parenting (Unit 1).

### Nodes closed (5)

- `tactic-eval-finding-detached-code-review-dies-with-launcher`
- `tactic-code-review-detached-node-lock`
- `tactic-dispatch-code-review-concurrent-write-attribution`
- `tactic-dispatch-code-review-reject-pattern-self-match`
- `tactic-review-code-review-invocation-contract-main-qa-regression` *(folded in from the overhang)*

> **The folded node carries a LIVE defect, not only a record correction.**
> *(Corrected 2026-08-30 — this callout used to say "a record correction, not a
> code change".)* It does correct the *recorded* `dispatch-code-review`
> invocation contract — which of `--comment` / `--no-comment` is actually passed,
> and whether the `/code-review low --fix` pre-stage runs to completion — and PR6
> owns that script, so this is the one PR where the recorded contract and the
> real one can be reconciled in the same change.
>
> **But the node's live defect is a possibly-broken comment-posting path:** zero
> reviews were posted across #3049, #2990 and #3047. A record-only pass would
> leave that unfixed while reading as complete.
>
> **Verification must include a non-zero count** from
> `gh api repos/:owner/:repo/pulls/<n>/reviews` on a PR this PR's own
> `dispatch-code-review` run reviews. If the count is zero, the posting path is
> broken and this is a code change, not a record correction.

### Scope

**Unit 1 — the child is not actually detached.** Interrupting the launching
Bash tool call killed the child session 3ms later and both in-flight max-effort
angle subagents 96ms later, destroying a 4.5-hour-budgeted review 63 seconds
after it started, leaving the phase with no graph change.

**Re-scoped by the author's ruling — see §"The code-review lock: ratified, with
its precondition repaired".** This unit previously read *"Establish real
detachment (process group / session leader)."* **Do not implement that.** It is
precisely the remedy the
node's own *Corrected diagnosis (2026-08-14)* falsified: `dispatch-code-review`
already runs `setsid`, already disowns, and already hard-refuses to start
without it. Building it again reimplements shipped code and leaves the bug.

Implement **`systemd-run --user` transient-unit re-parenting** instead. The
failure is not a missing session leader; it is cgroup membership. `setsid`
detaches from the controlling terminal but leaves the child inside the
launcher's cgroup, and interrupting the Bash tool call tears that cgroup down.
`systemd-run --user` starts the child in its own transient unit outside that
cgroup, so the teardown cannot reach it.

Keep the existing `setsid`/disown handling — it is not harmful and the
hard-refuse guard is a real precondition check; this unit adds re-parenting
around it rather than replacing it.

**Verification is unchanged and is the whole point:** interrupt the launching
Bash tool call and confirm the child review runs to completion and produces its
graph change. That interrupt test is the confirming step — a re-parenting that
is not demonstrated against a real interrupt is exactly the on-trust state this
sitting existed to end.

*Model: opus* — process lifecycle and cgroup subtleties

**Unit 2 — lock for the child's own lifetime. ⚠ ALREADY SHIPPED — close the
node, do not rebuild.** The design is a kernel-released `flock` held by the
detached child and honored by every worktree-claim path, so a survivor that
outlives its session cannot have another worker spawned into the tree it is
still writing.

> **The node is a completion record.**
> `intentions/tactic-code-review-detached-node-lock.md`: ***"SCOPE ALREADY LANDED
> IN FULL — this node is a completion record, not a draft."*** and ***"NO
> RESIDUAL DEFECT FOUND."*** The flock shipped in PR #3078. What did **not**
> hold was the detachment beneath it — that is Unit 1, and it is a different
> node.
>
> **Close it per Author Ruling 1** (sibling-carrier drafts become completion
> records): stamp `execution.completion` with #3078's merge facts, move
> `status: raw -> codified` and `phase: null -> done`, do **not** prune. The
> ladder has no `null -> done` transition, so this is
> `dump-node.ts --dir` → jq-patch → `write-node.ts --dir` → `graph-commit -C`.
> Clear its `office_hours` park in the same write.

*Model: sonnet* — bookkeeping close, no code

**Unit 3 — concurrent-write attribution. ⚠ CLOSE, DO NOT BUILD.** The described
race: the before/after `git stash create` window has no exclusivity lock on the
reviewed worktree, so any concurrent writer during the nested
`claude -p /code-review` has its edits silently attributed to the review's
`fixed[]` output and committed under review-fix's name.

> **The mechanism already shipped, and planning this unit authors dead work.**
> `intentions/tactic-dispatch-code-review-concurrent-write-attribution.md`:
> ***"Planning the node as written authors units that rebuild a shipped lock —
> dead work."*** The lock Unit 2 names as "the mechanism" is the same #3078
> flock that already landed.
>
> **Close it per Author Ruling 1**, the same shape as Unit 2 above, and clear its
> `office_hours` park in the same write.

*Model: sonnet* — bookkeeping close, no code

**Unit 4 — rejection-signature self-match.** `dispatch-code-review:190-193`,
`.claude/skills/dispatch-propagate/scripts/review-fix-instrument-probe.mjs:88`
*(from node bodies — re-locate)*. The check greps the **entire** combined
stdout+stderr for literal reject strings with no structural scoping, so a review
that quotes the literal rejection text false-positives and spuriously hard-stops
a successful review. Scope the match structurally.

*Model: sonnet* — scoped match, clear fix

### Dependencies

PR1. Units 1 → 2 → 3 internally, and **Unit 1's interrupt demonstration gates
Unit 2** — the design was ratified, the demonstration was not.

> **The demonstration is Unit 1's own acceptance test, not a prior gate on
> starting PR6.** It was briefly tracked as an owed item blocking the PR, which
> is circular — it tests the `systemd-run --user` re-parenting that Unit 1
> builds. Nothing gates *starting* this PR; the demonstration gates *trusting
> Unit 2*, which is what the Scope section already said.
>
> **De-risked 2026-08-29.** The mechanism was demonstrated on this host ahead
> of the PR: a child launched into a `systemd-run --user` transient unit
> survived the teardown of the launching Bash tool call and ran to completion,
> writing its marker 12s later. The 2026-08-28 sitting had established topology
> only (PPID 314, own `app.slice` cgroup, `flock` released on child exit) and
> explicitly *not* survival of a launcher teardown. **Honest limit:** that run
> killed a *background* task, which is the same class of teardown but not
> literally a user interrupting a foreground tool call. So Unit 1's interrupt
> test is now a **confirmation**, not a discovery.
>
> **RULED 2026-08-29 — the proxy is accepted.** The author accepted the
> background-teardown demonstration as satisfying the owed confirmation: it
> exercises the same re-parenting mechanism, so Units 2–3 ship without an
> attended interrupt test. The literal foreground-interrupt confirmation is an
> optional follow-up the author may run at any attended moment; it no longer
> gates anything.
>
> **Provenance (added 2026-08-30):** this ruling is genuine and recorded in
> commit `08870461` (PR #3132), whose body states "PR6 interrupt gate ruled:
> proxy accepted, Units 2-3 ship without the attended interrupt test." An earlier
> audit pass wrongly called it fabricated; it is not. It is **owed transcription
> onto its node** and a numbered entry in
> `plans/dispatch-rsi-author-rulings.md` — it appears in neither today. Until
> then it is a plan-only ruling under Ruling 5, and it **supersedes** the two
> sibling passages that used to say the demonstration was still owed (one
> earlier in this file, one in `plans/dispatch-rsi-sequence.md` §"Position 7").
> Both have been struck as of 2026-08-30.

### Reuse

- The lock shipped in PR #3078 — repair it rather than replacing it; Unit 1 is
  the reason it does not currently hold.

### Verification

```verify
.claude/skills/dispatch-propagate/scripts/test-dispatch-code-review.sh
```

Manual: launch a detached review as a background task, tear the launcher down,
and confirm the child survives and completes (the accepted proxy for the
foreground-interrupt test — see the ruling above). Then attempt to spawn a
second worker into the same worktree and confirm it is refused while the lock
is held.

---

# PR7 — Review-phase orchestration cost

**Recommended model: sonnet** — three concrete plumbing fixes; the umbrella
node records the measurement, it does not require a redesign.

### Run before opening this PR — SATISFIED 2026-08-29

The required baseline run was **already taken on 2026-08-29 and recorded on
both nodes** (`tactic-dispatch-observation-masking`,
`tactic-dispatch-cache-preserving-context`) — see §"Measurement runs before the
PRs they gate". Do not re-run it: it had to be taken on a **30d** window,
because the freeze empties shorter ones (a `7d` window holds 2 sessions and no
worker sessions at all). Read the recorded results off the nodes instead.

Two recorded results bind this PR: the cache-creation share is **4.3%** of all
context tokens — the arithmetic ceiling for any append-only layout, which kills
the imported 41–80% claim — and this PR ships against the masking measurement's
**cost half only**. Its quality half needs `by_phase_outcome`, which the freeze
empties; it is a follow-up that may revise this PR.

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
orchestrator's own 109 turns.

> **⚠ The umbrella node is NOT an open question.** *(Corrected 2026-08-30 — this
> paragraph used to end "the umbrella node records that as an open question and
> explicitly does not propose a fix here".)* It is `phase: implement` with
> **three fully-specified units and a stated target**. Read them before deciding
> what this PR carries.

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
block that nothing declares authoritative.

> **⛔ "Declare it authoritative" is the option the node RULES OUT.** *(Corrected
> 2026-08-30.* The unit used to end "Declare it authoritative and add a check
> that fails if it drifts from the script."*)* The node rules that approach
> ***"prose discipline with no gate"***, and says a bare "authoritative" sentence
> would be ***"a lie the moment it landed"*** — the block currently **enshrines
> three phantom fields** that do not exist in the script, so declaring it
> authoritative canonizes them.
>
> **Build the node's ruled mechanism instead**: the gate comes first and the
> declaration follows from it. Read the node's own unit before planning; do not
> ship the sentence without the check that makes it true, and reconcile the three
> phantom fields as part of the same change.

*Model: sonnet* — gate first, then declare

**Unit 2 — phase-log writer param undocumented for the PR lane.**
`dispatch-write-phase-log:1-38` *(from node body — re-locate)* documents its
positional argument as `<issue-num>` and errors with "an issue-num argument is
required", but a node-lane node has no issue and carries only `execution.pr`.
Every node-lane worker spends ~3 attempts and ~70s rediscovering that the PR
number is correct. **Document it. Do not add an alias.**

> **⛔ The "accept both names" arg alias is struck.** *(Corrected 2026-08-30 —
> the unit used to read "Document it; accept both names" with the model tag
> "docs plus arg alias".)* The node rules ***"no positional-argument semantics
> change, **no new flag**, no callsite change."*** The unit is a documentation
> correction on the existing positional argument and its error message, and
> nothing else.

*Model: sonnet* — documentation only

**Unit 3 — workflow file writes cost subagent round-trips.** Four of the twelve
subagents a `/review-fix` pass launches exist only to write two result JSON
files and stat them — **$3.70 and 9 turns of model inference for a write plus a
`wc`** — because the Workflow tool has no filesystem access. The result still
records `coverage_incomplete: true` because the size check is not exact.

> **⛔ BOTH OFFERED APPROACHES ARE REFUSED BY THE NODE.** *(Struck 2026-08-30.*
> This unit used to end "Give the script a non-subagent write path, or drop the
> round-trip and compute the check exactly", tagged "*Model: opus* — plan leaves
> the approach open".*)* The node refuses both by name; the approach is **not**
> left open, and it is not the plan's to pick. **Read the node's own ruled
> approach before planning this unit** and implement that. Do not implement
> either sentence above.

*Model: opus* — implement the node's ruled approach, not the plan's options

**Unit 4 — cheap-fix disposition. ⚠ ALREADY SHIPPED — close, do not re-plan.**
The described change: make the residue classify step fix cheap out-of-contract
findings in scope and defer only expensive ones (cost as a second
resolve-in-scope trigger).

> **The work shipped in PR #2887.**
> `intentions/tactic-review-cheap-fix-disposition.md`: ***"Do NOT re-plan this
> node as written."***
>
> **Close it per Author Ruling 1** — stamp `execution.completion` with #2887's
> merge facts, `status: raw -> codified`, `phase: null -> done`, do not prune,
> and clear the park in the same write. Note the node still carries
> *"(a) COMPLETION RECORD. Stamp the node against the carrying PR and retire
> it."* as an **unanswered park option** rather than as the ruling — Ruling 1 is
> what answers it, and it is owed transcription onto the node.

*Model: sonnet* — bookkeeping close, no code

**On closing the umbrella node:** *(corrected 2026-08-30)* it does **not** close
as "measured, floor partially reduced" with its remainder re-recorded elsewhere.
The node is `phase: implement` and carries three specified units against a stated
target — the question of whether the Step 1 classifier sequence, context pack and
Step 7 marker/sidecar/envelope tail can collapse into fewer script invocations is
**already scoped on the node**, not an open question needing a new tactic.
**The "re-record as a new tactic" instruction is struck**: minting a successor
for work the node already carries creates a duplicate-target pair. Note that `dispatch-derive-node-target` ran **three times** in
the measured pass (once sandbox-denied, once with the override, once purely to
re-extract `PR_NUM`); that is the cheapest visible thread to pull.

### Dependencies

PR1. Independent of PR2–PR6.

### Reuse

- **⛔ Do NOT "make the existing args block authoritative".** *(Corrected
  2026-08-30.* This bullet used to read: "`.claude/skills/review-fix/SKILL.md`
  already carries the args block — Unit 1 makes it authoritative rather than
  writing a new one."*)* The node rules that approach **"prose discipline with no
  gate"** and calls a bare "authoritative" sentence **"a lie the moment it
  landed"** — the block enshrines three phantom fields that are not in the
  script. See Unit 1 in Scope and
  `intentions/tactic-eval-finding-review-fix-workflow-args-rederived-each-pass.md`
  (`:33-40`, `:206-208`).
- `.claude/workflows/review-fix.js`'s entry point — the node's ruled primary is an
  entry-time args validation that fails loudly on a missing/unknown field. The
  SKILL.md block is the cheap complement that follows the gate, reconciled against
  the script's real 20 fields, never the whole fix.

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

> **In-flight overhang — this PR gains the most nodes.** Open drafts:
> **#3057** (`tactic-bounded-work-in-progress`, `dispatch-config-load:342-344`)
> and **#3018** (`tactic-conflict-lane-exit11-retry-bound`,
> `dispatch-tick:266-300` — coordinate the lane policy with PR5). planned, no PR
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
- `tactic-select-tick-main-sync-gated-on-caller-cwd` *(folded in from the overhang)*
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

**Unit 1 — track the pace curve. ⚠ ALREADY DECIDED — do not re-open the
choice.** *(Corrected 2026-08-30.* This unit used to read "Decide
tracked-with-history vs gitignored-with-a-committed-template, and implement
whichever. Either is acceptable".*)*

> **Author Ruling 2 decided it, and NEITHER offered option is the answer.**
> `plans/dispatch-rsi-author-rulings.md`: ***"Ruled: RELOCATE UNDER XDG"***,
> beside the pause sentinel, following clarification 107. The rationale is that
> the pace curve is **per-user**, so a fork must inherit no scheduling knob from
> upstream — which is exactly what both of the plan's options would have caused.
>
> **Do NOT change the `target_n` value** as part of this work. Zero is the weekly
> pace curve — a deliberate pause, never a defect to fix.
>
> **The three-way conflict, and how it is resolved.** Three documents named three
> destinations: Ruling 2's XDG, this unit's two options, and
> `intentions/tactic-dispatch-config-template.md`, which says
> `target-workers.json` *"migrates, tracked"* in the instance repo.
>
> **EXECUTOR DECISION, 2026-08-30 (for ratification — see
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"): Ruling 2 governs the LIVE file; the template node governs a
> TEMPLATE, and the two are reconcilable rather than competing.** Ship both: the
> live, per-user `target-workers.json` relocates under XDG beside the pause
> sentinel, and a **tracked template** (defaults only, no live values) stays in
> the instance repo so a fork has a starting point without inheriting this
> deployment's schedule. An author ruling overrides a node body per the reading
> order at the top of this document, so no ruling is owed here — but the template
> node's "migrates, tracked" wording needs correcting to say *the template*
> migrates tracked, not the live file.

*Model: sonnet* — XDG relocation plus a tracked defaults template

**Unit 2 — fail closed on a corrupt config.** `dispatch-target-workers:227` and
`:238-262`, `dispatch-select-tick:707` and `:744` *(from node bodies —
re-locate)*. Surface the failure instead of returning `8`. Per
`.claude/rules/code-style.md`, a clear error beats a defensive fallback — this
is that rule's exact case.

*Model: sonnet* — surface error instead of fallback

**Unit 3 — pause becomes a config field. ⛔ DEFERRED OUTRIGHT — DO NOT
IMPLEMENT IN THIS WINDOW.**

The index defers this unit outright: *"deferred outright | PR8 U3 | 1 | Rewrites
the freeze mechanism; only during an attended un-pause"*
(`plans/dispatch-rsi-sequence.md`, the `— | *deferred outright*` row of the
bundle table). The unit would replace the pause sentinel file — **the mechanism
currently enforcing the freeze this entire batch runs under** — while the freeze
is in force and unattended. It is the highest blast-radius instruction in the
batch.

**Ship PR8 as Units 1–2 only.** Unit 3 runs only during an attended un-pause,
with the author present, as its own PR.

Author Ruling 2 points the same way independently
(`plans/dispatch-rsi-author-rulings.md`, ANCHOR `Ruled: RELOCATE UNDER XDG`):
it settles "condition 16, which still names a `dispatch.config` pause field that
does not exist while the live mechanism is the sentinel file". Building the
config-field pause here would be building toward a condition the ruling already
retired.

*Model: n/a — not implemented in this window*

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
than printing `8`.

> **No pause-field check.** Unit 3 is deferred outright (see Scope); the pause
> sentinel file remains the live mechanism and **must keep working** at the end
> of this PR. If the sentinel has stopped taking effect, that is a regression,
> not a pass.

---

# PR9 — Worktree and session lifecycle

> **In-flight overhang — both items landed; re-locate before implementing.**
> **#3052** (`tactic-reap-safety-behind-branch-false-positive`) merged as
> `4dfb4648` and **shifted three of Unit 1's anchors**
> (`lib-session-reap.sh:286-291`, `:374`, `:548`) — re-locate them, do not trust
> the numbers here. **#3056**'s clean half landed as #3104; what remains for
> Unit 3 is `tactic-graph-execute-fresh-main-read`'s contested half
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

*Model: opus* — misclassification deletes wrong checkout

**Unit 2 — standdown clear must not race a live session.**
`.claude/skills/dispatch-propagate/scripts/lib-standdown-recheck.sh:619`,
`dispatch-graph-execute:185-200` *(from node bodies — re-locate)*. The
cleared-no-worktree branch erases a stand-down while a live session still holds
the node name, silently re-creating the deadlock the tactic removes.

> **⛔ The `strategy-*` framing is superseded, and the kind gate must NOT be
> built.** *(Corrected 2026-08-30.* This unit used to end "...the deadlock the
> tactic removes for `strategy-*` nodes, which never get a pre-provisioned
> worktree."*)*
> `intentions/tactic-standdown-clear-no-worktree-live-session.md`: ***"This
> plan's narrative supersedes the strategy-only framing"*** and ***"Do **not**
> implement the kind gate."*** The race is not kind-specific; gating on
> `strategy-*` would leave it live for every other kind that reaches the same
> branch.

*Model: opus* — race against live sessions, no kind gate

**Unit 3 — provision script test coverage.** Add script-level coverage for
`provision-node-worktree`'s worker-start gate integration (selected-phase arg,
exit 12/13 pass-through, scope-fingerprint stamp write) in
`test-provision-node-worktree.sh`.

*Model: sonnet* — test coverage with explicit cases

**Unit 4 — implicit worktree resolution.** A graph-operation wrapper that
resolves the target node worktree itself, so sessions stop restating absolute
`.claude/worktrees/<id>` paths in every Bash call.

*Model: sonnet* — wrapper resolving worktree paths

**Unit 5 — document the isolation guard properly.** The Claude Code built-in
worktree-isolation guard hard-refused **6 worker commands in one align-tactics
phase** — 75% of that phase's non-schema tool errors and all 6 of its
`policy_blocks`, at $0.84 of retry price proxy — because
`.claude/rules/sandbox.md` documents the too-complex-to-verify variant only as a
passing clause under a `git -C` heading, and frames the cd-and-command variant
as a permission-prompt cost rather than a hard refusal. Give the guard its own
section. *(Docs only — but it is the cheapest token win in this plan.)*

*Model: sonnet* — docs-only sandbox rule section

**Unit 6 — reclaim audit is blind to reasons it does not name.**
`dispatch-reclaim-audit:194`, `lib-reservation-ledger.sh:626` *(from node
bodies — re-locate)*. The RATE source greps exactly two literals —
`(dead-session-stranded)` and `(live-worker-redundant)` — so every other reason
shows up nowhere.

> **⛔ Do NOT "add a third literal to the grep".** *(Corrected 2026-08-30 — the
> unit used to be titled "blind to a fourth reason", ending "Add it." with the
> model tag "add third literal to grep".)* Two things are wrong with that.
>
> 1. **The premise undercounts: TWO reasons are uncounted, not one.** Adding
>    `spawn-handoff-expired` alone leaves the audit still blind.
> 2. **The node supersedes the literal-list approach with reason-generic
>    bucketing** — parse the reason token out of the ledger line and bucket
>    whatever it is, so a reason added later is counted without editing this
>    script. A third literal recreates the same blindness on the next reason.

*Model: sonnet* — reason-generic bucketing, not a literal list

**Unit 7 — explicit lane waits out CI.** Make the explicit-node dispatch lane
wait out in-flight CI up to the reservation TTL instead of skipping, leaving the
autonomous and `--manual` paths unchanged.

*Model: sonnet* — bounded wait in one lane

**Unit 8 — re-implement the lost deferred unit, and close the hole that lost
it.** **The diff is gone — see §"The ephemeral
Unit 4 diff is written off" for the six checks that established it** (job dir
deleted, no stash, no branch, no Unit 4
commit or revert in `origin/tactic-attention-per-tier-boost-migration`, and zero
hits across all 6 dangling blobs). Do not hunt for it.

Three parts, none time-critical:

1. **⛔ STRUCK — do NOT re-implement Unit 4 here.** This part used to read:
   "Re-implement Unit 4 from the scope preserved on
   `tactic-eval-finding-deferred-unit-diff-only-in-ephemeral-jobdir`:
   validateGraph rule 22, the two legacy compat-branch deletions in
   `validateAttention`, the now-unused `legacyTierKey`, and the `kind-kind.md`
   field-doctrine prose."
   The node itself forbids it: ***"This tactic must not touch … `legacyTierKey`
   or add validateGraph rule 22."*** This was **already ruled** —
   `plans/dispatch-rsi-author-rulings.md` row B: *"The node's own Not in scope
   section wins over the plan; that work moves to Position 12."* The plan text
   was never corrected until 2026-08-30. **That work belongs to Position 12**
   (`#3093`, `tactic-attention-per-tier-boost-migration`); do not duplicate it
   here.
2. **Make deferred-but-finished work durable by default — with the node's
   mechanism, not "no new mechanism".** *(Corrected 2026-08-30.* This part used
   to read "commit it to the branch, then revert it, so git history carries the
   diff permanently. No new mechanism."*)* The node rules a **new
   `preserve-deferred-work` script**, a **pushed tag** so the object survives
   branch deletion and gc, and a **verified `reset --hard`**. Commit-then-revert
   on the branch alone does not survive the branch being deleted, which is the
   loss this part exists to prevent.
3. **Reject an escalation whose recommendation cites a path under
   `$CLAUDE_JOB_DIR` — at `dispatch-mark-node-park`, IN-SESSION, not at the park
   writer.** *(Corrected 2026-08-30.* This part used to say "a string check where
   the park is written."*)* The node rules that `park-node` **annotates, never
   refuses** — putting an exit-3 refusal there would change a writer's contract
   from recording to gating. The refusal belongs at `dispatch-mark-node-park`,
   where the session is still live and can rewrite the recommendation.

*Model: sonnet* — parts 2 and 3 only; part 1 moves to Position 12

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

### The band derivation this PR's thresholds inherit — ratified

**No gate.** The band/residual resolution held on trust across `kind-kind`,
`strategy-rsi-delegated-prioritization` and `tactic-attention-namespaced-rank`
was **ratified on the code's ground**, and the thresholds this PR writes into
config inherit it as written.

One sub-point was **superseded rather than answered**, and it matters only if
you go looking for it: the objection that the cross-strategy inversion count was
structurally zero — and so unfalsifiable — no longer has a referent, because the
residual it described does not exist. The sort key is `(tier, band, score,
depth)`. The `success_signal` amendment that followed from this is already
landed on `strategy-rsi-delegated-prioritization`; **do not re-derive it here.**

### Context

Today `/rsi` fires only at ladder phase boundaries. This PR builds the full
trigger chain: cut points are written into config, a gate reads and compares
them, and a sweep fires on ended sessions across **both** drivers.

> **⛔ "…and the ladder evaluates at every phase boundary" is struck.**
> *(2026-08-30.)* `intentions/tactic-ladder-per-phase-evaluation.md`: ***"That is
> no longer the doctrine."*** Taken at face value, PR10 Unit 4 **re-adds the
> ungated ladder-only spawn that PR10 Unit 3 has just removed** — the two units
> would fight inside one PR. Restate Unit 4 per the node: whatever per-phase
> evaluation survives runs **through the Unit 3 sweep and behind the Unit 2
> gate**, never as a second unconditional spawn path.

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

**Unit 1 — threshold table.** Per-phase-kind cost-per-unit-of-change cut points
are written into config on the fleet pass, so the trigger gate reads a cheap
table instead of recomputing the distribution.

> **⛔ `/rsi-audit` MUST NOT BE THE WRITER — as written this unit ships a charter
> violation.** *(Corrected 2026-08-30.* The unit used to read "Have `/rsi-audit`
> write … into config".*)* `.claude/skills/rsi-audit/SKILL.md` states
> ***"Writes no routing policy, and no product files."***, and charter bound 8
> (`:204` at the time of writing — locate by content) reads as forbidding it.
> `plans/dispatch-rsi-author-rulings.md` row E agrees: *"Treated as forbidding;
> the unit needs a different writer."* `intentions/tactic-rsi-audit-threshold-table.md`
> says to resolve this **before** implementing and to move the writer if the
> bound forbids it — which it does.
>
> **Give the table its own writer** outside `/rsi-audit` (a script the audit's
> output feeds, not the audit itself), so the audit stays a pure measurement
> surface. The table's *format* is still shared with the gate design.

*Model: opus* — table format shared with gate design; writer relocated out of
`/rsi-audit`

**Unit 2 — the gate.** Gate `/rsi` on four trigger families: outcome
(unconditional), relative cost-per-unit-of-change, an absolute ceiling, and a
sampling floor — with `k`, the ceiling and `N` author-owned config. The node is
explicit that the gate does a **read-and-compare and nothing else**; keep it
that small.

*Model: sonnet* — read-and-compare only, kept small

**Unit 3 — lane-agnostic session sweep.** Replace the ladder-only
phase-boundary spawn with a sweep over ended sessions' `dispatch-stamp`
sidecars, so `/rsi` fires for phase **and** unattended-intervention sessions on
both drivers, scoped to the exact session id. `dispatch-ladder-run:124`,
`.claude/skills/dispatch-ladder/SKILL.md:365` *(from node body — re-locate)*.
Apply the gate, then spawn.

*Model: opus* — cross-driver sweep replaces spawn path

**Unit 4 — per-phase evaluation.** Make `/dispatch-ladder` evaluate at every
phase boundary — the driver spawns a fire-and-forget per-phase evaluation job
and never waits — and narrow the closing pass to cross-phase synthesis only.
`dispatch-ladder-run:677` *(from node body — re-locate; note `spawn_phase_eval`
is already called from `halt()` at `:729`)*.

*Model: opus* — narrowing closing pass needs judgment

**Unit 5 — external acceptance gate.** Gate RSI's own harness changes on an
acceptance signal outside RSI's control, and record the rate at which
self-passed changes are refuted by it. This is the safety property for
everything above: without it, the harness grades its own homework.

*Model: opus* — safety gate design left open

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

### Run before opening this PR — SATISFIED 2026-08-29

The measurement `tactic-rsi-measure-fanout-and-model-routing` required was
**taken 2026-08-29 and recorded on `strategy-recursive-self-improvement`** — on
a **30d** window, because a 14d one returns no fan-out data under the freeze.
Do not re-run it; read the recorded reading.

> **A live park contradicts this, and the PARK is the thing that is wrong.**
> `intentions/tactic-rsi-measure-fanout-and-model-routing.md` carries an
> `office_hours` recommending a redo from scratch. Verified 2026-08-30: **the
> reading did land**, on `strategy-recursive-self-improvement`. The park's
> **SCOPE is dead, not the premise — so do NOT clear this park.** Measured on
> `origin/main` 2026-08-30: `intentions/tactic-rsi-measure-fanout-and-model-routing.md`
> is `status: raw`, `phase: null`, `blocked_by: []`, and its `office_hours.reason`
> is an **invalid-state frozen-session intervention** ("The /align-tactics pass
> holding this node stopped mid-run on 2026-08-19 at an account session-usage
> limit…"), whose `recommendation` ends *"the router re-selects the node and
> /align-tactics redoes the pass from scratch."* The landed reading kills the
> node's **scope**, not that premise. Author Ruling 4 is explicitly BOUND on
> exactly this shape: *"a DEAD PREMISE is not a DEAD SCOPE … Where clear-park is
> the wrong instrument — a phase: null node whose work already shipped, which
> clear-park makes router-eligible rather than terminal — the correct act is the
> completion record (phase: done), never the clear."* Clearing here would make
> the node router-eligible and the tick would re-dispatch a measurement that has
> already shipped. **Write the completion record instead** (`phase: done`,
> citing the reading landed on `strategy-recursive-self-improvement`), as a
> Mechanism-2 `graph-commit`, and report it after the fact. Do not redo the
> measurement.

Two results bind this PR:

- Anchor the per-lens `model:` values on the **measured 1.91× opus-to-sonnet
  per-turn cost premium**, not the imported ratios (measured on configurations
  this repo does not run).
- **Set `model:` from `cost_usd`, never from `price_proxy_usd`** — the proxy
  holds price constant to isolate token count, so it ranks sonnet *above* opus
  (37827 vs 31372) and inverts the model ranking.

> **`tradition-agentic-engineering` is verified on the half this PR needs.**
> Three idioms are recorded as genuine external deference — skill/hook
> composition, subagent composition, verification-first workflows — and *context
> engineering is deliberately excluded*, recorded as convergence rather than
> deference: load-bearing in substance, but arrived at independently and
> expressed natively as `strategy-token-economy`. **Encode the three, not the
> four.**
>
> The record's remaining half — whether the reading lane's own seed selection is
> self-curating — **does not gate this PR**, but it is no longer unreachable
> inside the window. **Re-scoped 2026-08-29** by the research-lane ruling: there
> is no standalone `/rsi-research` and no schedule, so the half now asks whether
> research-sourced input stays subordinate to measurement in practice, and
> whether the seed list steers anything now that it is a source-trust filter
> rather than a crawl plan. It needs one author-invoked research-mode run of
> `/rsi-audit`, available the day PR14 Unit 3 lands — not two or three weekly
> cron firings. Revisit after the bundle lands.

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

Out of scope: re-deriving what a lens measures from scratch. This is a
re-housing.

> **⛔ "A lens whose output changes in this PR is a bug" is FALSE, and as an
> acceptance test it FAILS a correct implementation.** *(Corrected 2026-08-30;
> the identical claim in this PR's Verification section is corrected with it.)*
> The node rules three deliberate output deltas that a correct re-housing
> **must** produce: a `tool_errors` **retag**, a `phase_standup` **split**, and a
> catalog of **18 entries with 14 at fleet scope**. Those are the acceptance
> criteria. Any *other* output change is a bug; these three are the work.

*Model: opus* — structural rewrite of two skills

### Dependencies

**PR3** — the catalog's `carrier field` entries must name fields the instrument
actually emits, and PR3 both adds two lenses and corrects the stale
`dispatch-token-audit` paths. Building the catalog first would encode paths that
do not exist.

### Reuse

- **⛔ Do NOT reuse the binary scope vocabulary.** *(Corrected 2026-08-30.* This
  bullet used to read: "The scope vocabulary already exists in the instrument
  (`any-scope` / `fleet-only`, `aggregate-usage.sh:1164`, `:1463`) — the
  catalog's `scope tag` should use that vocabulary, not a new one."*)*
  `tactic-rsi-lens-catalog-decomposition` — **this PR's own node** — rules the
  **new `scope: [node, fleet]` list** at `:159-161` and explains why the binary
  tag cannot hold: four ruled lenses are `[node]`-only, fit neither `any-scope`
  nor `fleet-only`, and are exactly the ones ***"the binary vocabulary had no
  word for"***. The catalog takes the list form. See also PR3 Unit 1, where
  ratifying the binary tag is struck.
  *(Citation corrected 2026-08-30: this bullet used to attribute the ruling to
  `tactic-rsi-round-trips-lens-carrier`. That node rules the opposite — it keeps
  the binary vocabulary and refines it, saying at `:325` ***"do not invent a new
  tag vocabulary"*** and putting the bracket-tag column out of scope at `:310`.)*

### Verification

```verify
node --import tsx/esm packages/intentionsutil/scripts/validate-graph.ts intentions
```

```verify
.claude/skills/rsi-audit/scripts/test-aggregate-usage.sh
```

Manual: run `/rsi-audit 7d` before and after and diff the reports. **The diff
must contain exactly the node's three ruled deltas and nothing else**: the
`tool_errors` retag, the `phase_standup` split, and a catalog of 18 entries with
14 at fleet scope. *(Corrected 2026-08-30 — this step used to read "Lens output
must be identical; only the skill structure changes", which fails a correct
implementation. See Scope.)*

> **Sensor-name coupling:** a registered sensor's name is coupled to node prose
> **exactly**. Renaming a lens that is also a registered sensor name silently
> de-registers it. Check `read-sensors` before renaming anything.

---

# PR12 — RSI intervention core

> **In-flight overhang.** Open draft: **#2993**
> (`tactic-qa-main-park-base-cas`) — `.claude/hooks/dispatch-stop.sh` is named
> verbatim in this PR's Scope. Planned, no PR: **`tactic-dispatch-stop-backstop-comment`**
> (parked). Fold both — see §"In-flight work outside this plan".
>
> **⚠ Corrected 2026-08-30 — the comment this banner sends you to fix does not
> exist.** It used to read "one stale comment at `dispatch-stop.sh:62-63`, now
> that `graph-commit` is far-ahead-safe".
> `intentions/tactic-dispatch-stop-backstop-comment.md`'s park records that the
> comment ***"was already deleted by commit `c06c7295` … nothing remains to
> reword"***. Verified again 2026-08-30: `.claude/hooks/dispatch-stop.sh:62-63`
> carries no such comment — the only surviving mentions are the header note at
> `:17` narrating the removal and the back-reference at `:90`. Following the old
> instruction means **inventing a comment in order to fix it**. Close the node as
> a completion record against `c06c7295` and clear its park; there is no code
> change. See the matching callout in `### Nodes closed (2)`.

**Recommended model: opus** — extracting a shared core from four lanes.

### Context

Four invalid-state lanes duplicate evaluation logic. Extract the shared
evaluation core and make each lane a thin selector over **core + lens catalog +
the one write surface**, adding a variance-debugging lens and a closed
remediation list declared in its own frontmatter.

### Nodes closed (2)

- `tactic-rsi-intervention-special-cases`
- `tactic-dispatch-stop-backstop-comment` *(folded in from the overhang)*

> **⚠ THE FOLDED NODE'S TARGET NO LONGER EXISTS — close it, do not fix
> anything.** *(Corrected 2026-08-30.* This callout used to say the node is "one
> stale comment at `.claude/hooks/dispatch-stop.sh:62-63`" to be fixed in
> whichever PR touches the file first.*)*
> `intentions/tactic-dispatch-stop-backstop-comment.md` records that the comment
> ***"was already deleted by commit `c06c7295` … nothing remains to reword"***.
> Verified absent 2026-08-30. Following the old instruction means **inventing a
> comment in order to fix it**.
>
> Close the node as a completion record against `c06c7295` and clear its park.
> There is no code change and no home question.

### Scope

> **⚠ THE LANE LIST BELOW IS WRONG — the node rules FOUR lanes including
> `fix-checks`, and NOT `dispatch-node-reap`.** *(Corrected 2026-08-30.*
> `dispatch-node-reap` is a **remediation**, not a lane — folding it in extracts
> a core across a boundary the node draws deliberately. Use the node's four-lane
> list, with `fix-checks` in place of `dispatch-node-reap`.*)*

`dispatch-invalid-state`, `dispatch-diagnose-main`, `dispatch-node-reap`,
`dispatch-conflict`, `.claude/hooks/dispatch-stop.sh` *(from node body —
re-locate)*.

*Model: opus* — shared-core extraction, needs in-session decomposition

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

> **In-flight overhang.** Open draft: **#2946**
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

### Nodes closed (2)

- `tactic-dispatch-skill-rename` — **the carrier** (D3(a)). `status: raw`,
  `phase: null`, `blocked_by: []`, `office_hours: null` on `origin/main`
  2026-08-30 — live, unparked, serving `strategy-graph-native-dispatch`, and its
  roster table already claims all three renames.
- `tactic-dispatch-skill-standards-extraction` — closes as a **record**, keeping
  only the standards-extraction question, whose own body scopes extraction to
  *"only if a concrete consumer emerges"*; none has.

> **⚠ THE PARK STAYS HELD UNTIL D3 IS IN THE GRAPH, NOT MERELY IN THIS FILE.**
> Measured 2026-08-30: `tactic-dispatch-skill-standards-extraction` carries a
> non-null `office_hours` (`since: 2026-08-20`), and no node in `intentions/`
> records the carrier decision — `LC_ALL=C git grep -a -l 'dispatch-skill-rename'
> origin/main -- intentions/` returns three files, none of which does. The
> duplicate-target pair is therefore still live in the graph. The park's own
> recommendation forbids clearing it by finalizing a plan: doing so *"resolves a
> duplicate-target pair by omission, the failure mode the 2026-07-19 precedent
> (clarification 78, commit `4a83dfc1`) was ratified to prevent."* Route the
> carrier decision through the `/align` pass on `strategy-graph-native-dispatch`
> the park names, then clear. The position is **not** blocked meanwhile —
> `tactic-dispatch-skill-rename` is selectable — but this PR cannot close the
> parked node until that lands.

### Scope

> **⛔ POSITION 10 CANNOT RUN AS ORIGINALLY WRITTEN — but it is not blocked.**
> *(Corrected 2026-08-30: this callout used to call the parked node the
> position's **only** node. It is not — the rival carrier
> `tactic-dispatch-skill-rename` is `status: raw`, `phase: null`,
> `blocked_by: []`, `office_hours: null` on `origin/main`, i.e. live and
> selectable, and this PR's `### Nodes closed (2)` list now names it. What
> cannot run is the section **as written**, because it plans against the parked
> node. See the ⚠ callout directly **below** that list.)* The node this section
> names, `intentions/tactic-dispatch-skill-standards-extraction.md`, is **parked**
> (`office_hours` non-null, `since: 2026-08-20`, `phase: null`, `status: raw`,
> `session_type: requirement-discovery`) on four unrecorded premises, **the first
> of which is disqualifying on its own — a DUPLICATE CARRIER**: the serving
> strategy `strategy-graph-native-dispatch` designates
> `intentions/tactic-dispatch-skill-rename.md` as the carrier for these renames,
> that node is live (`status: raw`, `phase: null`, same serving strategy, and
> **unparked** — i.e. more selectable than the node this section names), and its
> roster table claims all three renames verbatim. The node's own recommendation:
>
> > Do NOT clear this park by finalizing a plan without the carrier decision:
> > that resolves a duplicate-target pair by omission, the failure mode the
> > 2026-07-19 precedent (clarification 78, commit `4a83dfc1`) was ratified to
> > prevent.
>
> **EXECUTOR DECISION, 2026-08-30 — the four questions are answered here**
> (recorded for ratification in `plans/dispatch-rsi-author-rulings.md`
> §"Executor decisions taken during reconciliation"). No `/align` pass is
> scheduled inside this window; these four answers unblock the position:
>
> **(a) Carrier — `tactic-dispatch-skill-rename`.** It is live, unparked, serves
> the same strategy, and its roster table already claims all three renames. It is
> the more selectable of the two and the one the strategy designates.
> `tactic-dispatch-skill-standards-extraction` **keeps only the
> standards-extraction question**, whose own body says extraction happens *"only
> if a concrete consumer emerges"* — no consumer has emerged, so that node closes
> as a record and stops claiming the renames. **This PR's `### Nodes closed` list
> must be corrected to name the carrier.**
>
> **(b) Roster — the three renames named in this section, and no more.**
> `/align-tactics` → `/dispatch-plan`, `/qa-fix` → `/dispatch-qa`, `/review-fix`
> → `/dispatch-review`. The node records a seven-entry `dispatch-<phase>`
> namespace with six outstanding; widening a repo-wide atomic rename inside a
> frozen window multiplies blast radius for no benefit. The remaining namespace
> entries are **out of scope for this window** and stay on the carrier node as
> outstanding roster rows.
>
> **(c) Transition shape — ATOMIC, no compatibility aliases.** The node's
> "compatibility aliases" have **no implementable mechanism**: a skill's identity
> is its directory name plus the `SKILL.md` frontmatter `name:` plus the Workflow
> registration `name:`, with no alias layer — so an alias means a *second, duplicate*
> skill registration, which is precisely the shadowing
> `.claude/rules/vendored-skills.md` treats as a defect. Rename atomically in one
> PR, which is what this section already says.
>
> **(d) There is no `tactic-dispatch-skill-input-contract` edge to honor —
> it was never a frontmatter `blocked_by` in the first place.** Measured
> 2026-08-30 on `origin/main`: `tactic-dispatch-skill-rename`,
> `tactic-dispatch-skill-standards-extraction` and
> `strategy-graph-native-dispatch` all carry `blocked_by: []`. Every reference is
> **prose**, carrying no frontmatter edge, so the router does not traverse it —
> it cannot block, and there is nothing to delete from the graph. It is not
> unread by tooling, though: `validateGraph` itself skips prose, but
> `validate-graph.ts` also runs `validateGraphProseRefs`
> (`packages/intentionsutil/src/schema.ts:1973`), which scans `statement`,
> `rationale`, `attention.rationale`, every `clarifications[].answer` and the
> body. A prose id fails that check only when it clears every exemption: it
> resolves to neither a live nor a **pruned** node, is not a planned forward
> reference (`mentionsRef`), and is not grandfathered by
> `packages/intentionsutil/prose-ref-baseline.json`. This id is pruned, so it
> resolves and the check passes today — the repair is prose accuracy, not a
> green-CI requirement.
> The node itself was pruned by `20b0432c` at `status: codified`,
> `phase: review`, `pr: 2923`, and its work shipped. Only the **rename** half of
> the "coordinated adjacent PRs" pair is outstanding, and that is this PR.
> *(As originally reasoned, before the measurement above: "a `blocked_by` naming
> a node that does not exist can never clear, so honoring it would deadlock the
> position permanently." The verdict stands, the reason does not — there is no
> frontmatter edge to honor or to void, so nothing was ever deadlocked.)* Do
> **not** mint the node on a plan reference alone; the citation needs past-tense
> repair, not a decision. It is listed with the other two in the index's block
> of ids cited but no longer present.

Scope: every reference to the renamed skills in skill directories, `SKILL.md`
frontmatter `name:`, all `.claude/skills/**` cross-references,
`.claude/workflows/*.js`, and `.claude/rules/*.md`.

> **`intentions/` node prose is OUT of scope.** The node rules it out directly:
>
> > **Historical `intentions/*.md` references stay OUT of scope: rewriting them
> > churns each node's `tacticScopeFingerprint` and can mis-park live sessions**
> > — a constraint `c3c229f0`'s own PR body records — **except where
> > `lint-verify-fence-paths.sh`'s ratcheted baseline would otherwise gain a
> > newly-orphaned ```verify``` fence path in a live node.**
>
> The exception is the *only* permitted `intentions/` edit: a live node whose
> ```verify``` fence would otherwise be orphaned. Measured on disk 2026-08-29,
> a blanket sweep touches **487** node files (410 match `align-tactics`, 137
> match `qa-fix`, 141 match `review-fix`; union 487) and re-fingerprints every
> one of them.
>
> **`.claude/settings.json` is also out**: measured, it carries no `align-tactics`
> / `qa-fix` / `review-fix` `allowedTools` pattern, so it is not a load-bearing
> edit site.

*Model: sonnet* — mechanical rename, exhaustive and atomic

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

Manual: grep the whole repo for each old name with `LC_ALL=C grep -a` and confirm
zero hits **outside `intentions/`**. Hits inside `intentions/` are expected and
correct — historical node prose is deliberately out of scope (see Scope). The one
class that must be zero inside `intentions/` is a ```verify``` fence path in a
**live** node that the rename would orphan; check that against
`lint-verify-fence-paths.sh`'s ratcheted baseline, which must not grow.

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
- `tactic-rsi-reprioritization-outcome-audit` — **RULED 2026-08-29,
  disposition (A) ratified as proposed**: baseline = the complement cohort
  (closed `owner: ai` tactics with no `priority_log` entry in the window);
  interval = node creation → phase-done commit date for **both** cohorts; the
  `priority_log` entry date partitions the cohorts and bounds the
  per-iteration delta but is never a start point. The ruling is recorded as a
  clarification on `strategy-rsi-delegated-prioritization` and the park is
  cleared; the node's plan is written by the `/align-tactics` finalize the
  park recommendation named.
- `tactic-rsi-research-skill` — **park CLEARED 2026-08-29**; all three owed
  rulings answered. Now `status: codified`, carrying its execution plan in its
  body, with a `blocked_by` edge onto `tactic-rsi-lane-token-attribution`.

> **Readiness (updated 2026-08-29 after the ruling):** Unit 2's ruling landed
> and its plan follows via the `/align-tactics` finalize; Unit 3 is ready to
> build; Unit 1 remains blocked on a node outside this plan — check whether
> `tactic-attention-namespaced-rank` has landed before starting, and leave
> Unit 1 open rather than blocking the PR if it has not.

### Scope

**Unit 1 — delegated attention writer.** Within-band boosts on `owner: ai`
tactics, each appended to `attributes.priority_log` with a read-before-write
anti-thrash check. `packages/intentionsutil/src/attention.ts`, `src/router.ts`,
`scripts/write-node.ts` *(from node body — re-locate)*.

*Model: opus (plan-side recommendation, NOT a ruling)* — it writes attention
under a read-before-write anti-thrash check, which is the judgement call.
*(Corrected 2026-08-30: this line used to read "ruled opus". Verified — the node
declares no model, and no ruling anywhere sources that claim. The word "ruled" is
struck rather than transcribed; see `plans/dispatch-rsi-author-rulings.md`.)*

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
> `tactic-rsi-audit-workflow-attribution.md:59` and
> `tactic-attention-namespaced-rank.md:822` while you are in the graph.
> **`tactic-rsi-research-skill` is deliberately not in that list** — its mention
> is at `:389`, inside dated draft prose its own 2026-08-20 clarification rules
> historical and forbids rewriting. Leave it alone; see §"Two stale-path
> classes".

*Model: opus* — judgment-heavy measurement semantics; plan via finalize

**Unit 3 — the research lane, folded.** **RULED 2026-08-29 — do NOT build a
standalone `/rsi-research` skill and do NOT install a weekly schedule.** The
lane is folded into `/rsi-audit` as an **opt-in subskill**, invoked by it and
deliberately absent from the user-invocable slash-command list; a
`/rsi-research` command would re-create the separate lane the ruling removes.
The external pass fires only in response to an endogenous finding own telemetry
cannot explain, and is **default-off** so a routine audit performs no external
fetch.

Ground: the serving strategy opens *"measurement, not a second orchestrator —
one shared evaluation core … every producer records findings through that one
write surface."* A weekly skill with its own schedule and outputs is
structurally a second lane. #3074 had already collapsed this family into
exactly two skills; a third would re-expand it.

Three sub-units, and the third is the one worth testing:

- **U3a — the lane parameter.** `/rsi-audit` accepts a lane selecting a named
  preset sized to a **token target** (`low`, `medium`, `full`; `medium` is the
  interactive default). This is **not** a model reasoning-effort knob, though a
  preset may set one. Validate the value; exit non-zero on anything
  unrecognized rather than defaulting.
- **U3b — the research invocation.** Preserve correction **C1** exactly: a
  headless session whose *initial user message* is the slash command,
  `claude -p "/deep-research <question>"`. `/deep-research` is a harness
  built-in marked `disable-model-invocation` — **a subskill cannot call it any
  more than a skill could.** Carries C2 (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS=0`
  in a wrapper script, never an inline `VAR=value` prefix — see
  `.claude/rules/sandbox.md`), C3 (narrow `--allowedTools`, never
  `--dangerously-skip-permissions`), C4 (`< /dev/null`), C6 (arXiv at `/abs/`),
  C7 (two bounded passes).
- **U3c — the post-processing.** Turn the returned report into
  `tactic-eval-finding-<slug>` entries via `dispatch-eval-finding`, passing
  **`--sensor rsi-research`** — distinct from the skill's own `--sensor
  rsi-audit` — and naming the endogenous finding that provoked the run. Without
  that marker a hypothesis and a measurement land on one surface
  indistinguishable, and the strategy's rule that an external finding never
  outranks a measured internal signal becomes unreadable in the data.

> **Two silent failure modes, both measured 2026-08-29 — guard both.**
> `claude --effort <bad>` prints a warning to stderr and proceeds at **default**
> effort rather than failing, so a typo in the test path yields a full-cost run
> that looks like it worked. And effort throttles reasoning depth, **not
> fan-out** — it does not obviously reduce the ~108 subagents or 25 source
> fetches a full cycle performs. A `low` lane must therefore bound *work*
> (seeds, passes, caps), not only reasoning; pair it with `--max-budget-usd` as
> a hard ceiling rather than a hint.

**Cut breadth before depth** when sizing a preset. C7 measured the ratified
nine-seed list as doing little steering, while the verification pass killed 8 of
25 claims — breadth bought less than expected, depth bought a lot. So `medium`
keeps adversarial verification **on** and cuts seeds and frontier expansion
instead.

Full axis list, lane definitions and the calibration loop are on
`tactic-rsi-research-skill` (clarifications of 2026-08-29). **Its "do not edit
`.claude/skills/rsi-audit/SKILL.md`" note is reversed by the same ruling** —
that file is now the host.

*Model: sonnet (plan-side recommendation, NOT a ruling)* — the corrections are
fully recorded on the node, so the unit is transcription rather than design.
*(Corrected 2026-08-30: this line used to read "ruled sonnet". Verified — the
node declares no model, and no ruling anywhere sources that claim. The word
"ruled" is struck rather than transcribed; see
`plans/dispatch-rsi-author-rulings.md`.)*

### Dependencies

PR3 and PR10. Unit 1 additionally depends on `tactic-attention-namespaced-rank`,
which is **outside this plan** — if it has not landed, leave Unit 1 open rather
than blocking the PR. Unit 2's ruling landed 2026-08-29 (see the readiness note
above); it ships from the plan the `/align-tactics` finalize writes into its
node. The autonomously shippable floor is **Units 2–3**, plus Unit 1 if its
external blocker has landed.

**Unit 3 additionally depends on `tactic-rsi-lane-token-attribution`** (status
`codified`, phase `implement` as of 2026-08-29), which owns correction **C5**.
That dependency is load-bearing, not incidental: a lane parameter targeting
token usage cannot be calibrated while a cycle's real cost lands in nested
`subagents/workflows/wf_*/agent-*.jsonl` under an anonymous headless session id
with no node id — there is nothing to scope the confirming measurement to. A
target you cannot measure is not a target. Recorded as a `blocked_by` edge on
the node.

**No longer required:** a `blocked_by` edge onto
`tactic-grounding-deep-research-condition-reconcile`. That precondition existed
because scheduling the lane *unattended* would cross
`strategy-complete-grounding`'s condition that `/deep-research` sourcing stays
author-invoked. The fold retires the schedule, so the condition is **satisfied
rather than narrowed**.

### Verification

```verify
npm test --prefix packages/intentionsutil
```

Manual: run the writer in dry-run against the live graph and confirm the
anti-thrash check refuses a second boost inside the same window.

---

# PR15 — `graph-commit` structural simplification

> **In-flight overhang — folded in.** All three
> class-B absorptions are now in this section, not pending:
> **`tactic-node-merge-list-removal-loss`** → **Unit 0** (numbered 0 because it
> is the one *correctness* fix here and must survive a split);
> **`tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression`**
> and **`tactic-flake-hook-tests-graph-commit-fixture-clone`** →
> §Verification. Node count 4 → 7.
>
> **Correction to the anchor warning:** #3037 is **not** absorbed into PR18 — it
> was deferred to the position-12 bundle. It still edits
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

> **RULED 2026-08-29 — PR15 SPLITS. Ship Units 0, 3 and 4. Do not write Units 1–2.**
> The revisit the 2026-08-14 disposition demanded before PR15 starts was held,
> and its answer is a split, not a go/no-go.
>
> **DEFER stands for ref-split**, so its Unit 2 rewrite still lands eventually,
> and Units 1–2 here are still subsumed by it. The ruling refuses to write code
> with a known deletion date on the hot writer path: Units 1–2 are **not
> written**, and the simplification they describe arrives with ref-split's Unit 2
> or not at all. This is deliberately *not* the accepted-cost treatment PR1's U1
> and U5 got — those had already shipped when the exposure was found, and U1 was
> the highest-severity item in the plan. Neither is true here.
>
> **What ships:** Unit 0 (the layer-2 REMOVAL fix) ships regardless — it is a
> correctness fix and already carries its own "ships anyway" note below. Units 3
> and 4 carry no ref-split exposure and were already identified as splittable.
>
> **The rider was considered and declined as a window change.** Ref-split's
> cutover can be made incremental (seed `graph-main` as a mirror, install the
> `intentions` symlink while `main` still carries the directory) and its blocker
> set should be re-cut from 23 open to the 8 with a real mechanism relation.
> Both remain true and neither is retracted — but doing them pulls a 37-blocker
> node into a window whose first ground rule is that the freeze does not lift
> until the plan is done. The re-cut is **not** thereby forbidden: it is ordinary
> post-window work, and if it happens before this position is reached, Units 1–2
> were going to be skipped anyway.
>
> **Consequence for the sequence:** PR15 no longer blocks on anything. Its
> remaining units are independent of ref-split, so position 2 carries no
> conditional hold.

### Nodes closed (5)

*Was 7. The 2026-08-29 split ruling drops Units 1–2, so the two nodes they would
have closed stay open and travel with ref-split:*
***`tactic-graph-commit-plumbing-default`*** *and*
***`tactic-graph-commit-direct-three-way-merge`***. *Neither is abandoned — both
are subsumed by ref-split's Unit 2 rewrite, which is where they now close. Add
them to the ref-split deferral set below, which grows from three nodes to five.*

- `tactic-graph-commit-invocation-classifier-bypass`
- `tactic-graph-commit-noop-shortcircuit-head-behind`
- `tactic-node-merge-list-removal-loss` *(folded in from the overhang — Unit 0 below)*
- `tactic-tactic-graph-commit-rebuild-snapshot-stale-revert-main-qa-regression` *(folded in 2026-08-20 — Verification)*
- `tactic-flake-hook-tests-graph-commit-fixture-clone` *(folded in 2026-08-20 — Verification)*

### Scope

**Unit 0 — the layer-2 field merge must be able to express a REMOVAL.**
*Folded in from the overhang, from `tactic-node-merge-list-removal-loss`.
It is numbered 0 because it is a **correctness** fix and the rest of this PR is
simplification — if PR15 is ever split or stalled on the ref-split hold, this
unit ships anyway. **PR15 did split, on 2026-08-29, and this is one of the three
units that ships.***

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

*Model: opus* — base-aware merge; silent data loss

**Unit 1 — flip the writer default to plumbing.** *NOT WRITTEN — deferred to
ref-split's Unit 2 by the 2026-08-29 ruling above. Kept here only so the ruling
names something concrete, and so ref-split's rewrite has the analysis it
subsumes. Do not implement this unit.*
`packages/intentionsutil/scripts/graph-commit:406` (verified) —
`GRAPH_COMMIT_WRITER="${GRAPH_COMMIT_WRITER:-worktree}"`. Flip the default to
`plumbing` for every caller and delete the then-inert dirty-tree pre-flight
guard, so unrelated dirt in any checkout can neither block nor corrupt a graph
write. A comment at `:875` already notes the guard is "a no-op whenever
`GRAPH_COMMIT_WRITER` is left at its `worktree` default" — that dependency
inverts once this lands, so read it before deleting.

**Unit 2 — replace the rebase with a direct three-way merge.** *NOT WRITTEN —
same ruling, same reason as Unit 1. Do not implement this unit.*
The rebase exists
**only to produce a conflict** that layer 2 then unwinds in order to call
`merge-node.ts` — a merger that already takes `--base`/`--ours`/`--theirs` as
plain paths and is git-independent (`run_merge_node()`, `graph-commit:989-995`,
verified). Call the merger directly and delete the conflict-production path.

Sequencing was fixed by the node's own rationale: this is *"the remaining
structural simplification once the plumbing default lands"*. *(The imperative
"Unit 1 before Unit 2, in this PR" is deleted as of 2026-08-30 — prose residue
inside a block the 2026-08-29 split already killed. Neither unit is written.)*

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

*Model: sonnet* — flag shape plus allowlist entry

**Unit 4 — widen the no-op short-circuit.**
`packages/intentionsutil/scripts/graph-commit:2077` and `:3643-3659` (verified).
The short-circuit fires only on strict `HEAD == origin/main` SHA equality, so a
checkout strictly **behind** `origin/main` with nothing staged still runs the
full landing cycle — holding the landing lock for no benefit even though content
parity is already proven. Fix: short-circuit on proven content parity, not SHA
identity. The `:2066` comment records that the current scoping is deliberate;
preserve the reason it gives while widening the condition.

*Model: opus* — parity proof on landing-lock path

### Dependencies

**PR1** — same file, and PR1's units are correctness fixes that should land
first so a regression here is bisectable against a known-good writer.

The ref-split decision is discharged — ruled 2026-08-29, split; PR15 no longer
blocks on anything.

### Reuse

- `.claude/rules/sandbox.md` "Command pattern matching" — the matcher rules Unit
  3 must satisfy.

*(A `run_merge_node()` reuse note for Unit 2 was removed 2026-08-29 with the
split — Unit 2 is not written.)*

### Verification

```verify
npm test --prefix packages/intentionsutil
```

```verify
.claude/skills/dispatch-propagate/scripts/run-lint.sh
```

Manual (shipped units only — Units 1–2 are not written): from a checkout reset
one commit behind `origin/main` with nothing staged, confirm the run
short-circuits without taking the landing lock (Unit 4). Confirm the
`graph-commit` invocation is auto-approved rather than prompting (Unit 3).

**Unit 0** needs a verification the suite above cannot give: a *concurrent*
removal. Construct it directly — build base/ours/theirs fixture nodes where
`ours` deletes a `blocked_by` entry and `theirs` edits an unrelated field, run
the merge, and assert the entry stays deleted. The node body's Unit 2 specifies
this as an exported `mergeNodeFiles(...)` direct-import test
(`packages/intentionsutil/test/merge-node-cli.test.ts`); prefer that to a shell
harness, because `merge-node.ts` has **zero** test coverage today and a
round-trip test is the thing actually missing.

**Two class-B `test-graph-commit.sh` defects fold into this section**
*(folded in from the overhang)*. This PR runs that suite hardest, so it is the
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
  judge this PR's shipped units.

### Closing the nodes

After merge, for each of the 5 ids set `phase: done` and
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
> `transition-node` surface. Planned, no PR:
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

- `tactic-tactic-graph-native-signal-instrument-arm-main-qa-regression` *(folded in from the overhang)*
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
> **Unit 10's park was cleared 2026-08-29 on the author's authority.** Its
> `office_hours` record carried the (1)/(2) gate-shape question, answered by
> the recorded ruling (shape (2) first, fatal in the post-merge job); the
> author authorized the clear so the batch needn't handle it. **Unit 11** is
> `owner: ai` and was never blocked.
>
> **⚠ FALSE FOR UNIT 9.** *(Corrected 2026-08-30.* This sentence used to read
> "Units 9 and 11 are `owner: ai` and were never blocked."*)*
> `intentions/tactic-validate-graph-empty-store-pass.md` is **parked since
> 2026-08-20**: *"this node's Scope reverses a contract the same merged PR
> deliberately established, and nothing in the graph rules which of the two is
> intended."* See Unit 9 in Scope for the executor decision that resolves it.

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

*Model: sonnet* — clear fix, two sanctioned options

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

*Model: sonnet* — extract byte-identical helper

**Unit 3 — `read-sensors.ts` accepts any argument, then writes.**
`packages/intentionsutil/scripts/read-sensors.ts:1719` (verified) — `main()`
parses only `process.argv.includes("--report")` and silently drops every other
argument, then runs an **unconditional write pass** against the `intentions/` of
whichever checkout the script file lives in. Fix: reject unrecognized arguments,
and add a no-write `--check` mode.

> This compounds with PR1 Unit 8: the script both ignores what you asked for and
> resolves its own tree. Land PR1 first so the tree half is already explicit.

*Model: sonnet* — arg rejection plus check mode

**Unit 4 — retire the `attributes.phase` squatter.** Backfill the 6 remaining
`phase: null` + `attributes.phase: main-qa` nodes to first-class `phase`, delete
the squatter fallback readers, and make `validate-graph` **reject** any
`attributes.phase` key so the misroute class cannot recur.

> `attributes` is `Record<string, unknown>` (`schema.ts:244`), so this is a real
> schema tightening — unlike PR4's ledger retirement. It therefore **does** trip
> the origin/main data test, which is exactly what **PR1 Unit 4** fixes. PR1
> before this unit, not optional.

*Model: opus* — schema tightening with data migration

**Unit 5 — decide the fate of `readDelegationRecordsReading`.**
`read-sensors.ts`'s `readDelegationRecordsReading` is unreachable from production
code (superseded by two per-strategy reading functions landed on
`tactic-first-sensor-pass`), but it is **the only code implementing a doctrine
rule** — excluding declined delegation records from unexercised counts for
`strategy-exercise-recovery-paths`. Deleting it silently drops the rule.

**RULED: the rule still governs —
port it, then delete the dead function.**

The ruling was made against a measurement, not a preference.
`strategy-exercise-recovery-paths`'s threshold is **absolute**: *"no record's
`last_exercised` is null, and no fired `review_trigger` is left unactioned"*.
There are 22 delegation records and one of them —
`delegation-hosted-publishing` — is `origin: declined`. Under
`kind-delegation`'s abstention doctrine a declined delegation **has no entered
path to walk**, so its `last_exercised` can never be set. The replacement
reader `readExerciseRecoveryPathsReading` counts over **all** records with no
declined-origin special-casing, which makes that absolute threshold
**permanently unsatisfiable** — not hard, impossible. The doctrine rule is
therefore not aggregate-presentation polish; it is what makes the strategy's
own signal reachable, and it has already been silently dropped.

What this unit must do, in order:

1. Port the declined-origin handling into `readExerciseRecoveryPathsReading`
   (`packages/intentionsutil/scripts/read-sensors.ts`), so declined records are
   broken out as their own class and never counted as unexercised.
2. **Correct that function's docstring**, which currently rationalizes the drop
   — *"this strategy's threshold, unlike `readDelegationRecordsReading`'s
   clarification-7 aggregate, just asks how many records have `last_exercised`
   set"*. That sentence is the reasoning the ruling overturns; leaving it in
   place invites the next reader to re-drop the rule.
3. **Retarget the two rule tests, do not delete them.**
   `packages/intentionsutil/test/delegation-records-sensor.test.ts:143-184` --
   the `describe("readDelegationRecordsReading")` block -- holds the **only two
   assertions of the declined-origin rule anywhere in the repo**: *"counts
   exercised, declined-class, and oldest last_assessed"* and *"never counts a
   declined record as unexercised (its own class)"*. The ruling affirms that
   rule still governs, so deleting its only coverage is the weakening
   `.claude/rules/test-integrity.md` forbids. Point both at
   `readExerciseRecoveryPathsReading` and update their expected strings to that
   function's format.
4. **Give the reader a canonical met-state string, then set the threshold to
   exactly that string** -- or the ruling does not close the gap.
   `deriveGap` (`packages/intentionsutil/src/sensors.ts:241-255`) is trimmed,
   case-insensitive **string equality** between `reading` and
   `success_signal.threshold` -- its own docstring says *"Equality is the only
   'met' condition -- no numeric or fuzzy parsing."* So changing the reader
   changes the reading string and nothing else; the gap on
   `strategy-exercise-recovery-paths` stays open regardless.

   **A threshold edit alone cannot fix that, and this step said it could.**
   `readExerciseRecoveryPathsReading` (`read-sensors.ts:1028-1038`) always
   returns

   ```
   exercised: <k>/<n> records; <m> null last_exercised; review_trigger firing not recorded (sensor read <YYYY-MM-DD>)
   ```

   Every reading it emits carries live counts **and the read date**, so no fixed
   threshold string can ever equal it. Rewording the threshold to exclude
   declined-origin records changes which records land in `<k>` and `<m>`; it
   does not make equality reachable. The signal stays permanently gapped.

   Measured across the graph on 2026-08-28: of 749 nodes, 68 carry a
   `success_signal`, 21 of those also carry a `reading`, and **12 of those 21
   readings embed a date** -- none of which can ever meet its threshold. Exactly
   **two** nodes in the whole graph currently meet theirs
   (`strategy-main-health`, `tactic-main-red-ac908454`), and both do it with
   date-free readings. So the equality rule is not decorative -- it works
   exactly when the reader is written to produce a canonical string, and this
   reader is not.

   The unit therefore owns **both halves**:

   - **Reader (code, this unit).** Have `readExerciseRecoveryPathsReading` emit
     a canonical, date-free string in the met state -- the shape the two
     currently-met nodes use -- reserving the counts-and-date form for the
     unmet state. Declined-origin records are excluded from the
     no-null-`last_exercised` requirement when deciding which state applies.
   - **Threshold (graph, author `/align` write on
     `strategy-exercise-recovery-paths`).** Set `success_signal.threshold` to
     **exactly** the canonical met-state string the reader now emits, byte for
     byte modulo trim and case. Author this *after* the reader lands, or copy
     it from the reader's source; do not compose it independently, because an
     independently-worded threshold is the same silent no-op this step
     originally prescribed.

   Sequence: reader first, then the threshold write. Verify by reading the node
   back and confirming `deriveGap` returns `null` -- not by inspecting the
   threshold prose.
5. Only then delete `readDelegationRecordsReading` itself. `readDelegationRecords`
   (`read-sensors.ts:917`) and `renderDelegationRecordsReport` (`:998`, reached by
   the `--report` flag at `:1739`) are **live** and must survive, along with their
   own test blocks.

> **Corrected 2026-08-28**, after the ruling was first recorded. The original
> step 3 read *"Only then delete `readDelegationRecordsReading` and its tests"*
> -- which directs a test-integrity violation on the branch this sitting
> selected, and omits the threshold amendment without which the ruling's own
> justification (the threshold is permanently unsatisfiable) goes unrepaired.
>
> **Corrected again, same day.** That first correction's step 4 said to amend
> the strategy's `success_signal.threshold`. That is not sufficient and would
> have shipped as a silent no-op: the reader embeds the read date in every
> reading, so equality with any fixed threshold is unreachable and no wording of
> the threshold changes it. Step 4 now owns the reader change that makes a
> canonical met-state string exist, with the threshold write sequenced after it.
> The general trap: **`deriveGap` equality means a date-bearing reading can
> never meet its threshold** -- 12 of the graph's 21 read signals are in that
> state today.
> The node's own park text names both constraints; the ruling text had dropped
> them.

**This unit's parked node was cleared 2026-08-29**, contrary to the agenda's
earlier claim that C2 had none: `tactic-orphaned-delegation-records-reading`,
`owner: ai`, parked since 2026-08-20. Its recommendation pre-planned both
branches; the ruling selects **branch A (still governs)**, and the park was
cleared explicitly on the author's authority citing that ruling.

**The threshold write is delegated.** The step-4 threshold half is an author
`/align` write on `strategy-exercise-recovery-paths`; the author has
authorized the batch to perform it on their behalf (2026-08-29), since its
content is fully determined — the threshold is set to *exactly* the reader's
new canonical date-free met-state string, in the reader-then-threshold order
above. No further author input is needed.

*Model: opus* — canonical reading semantics and threshold sequencing

**Unit 6 — `transition-node` scope-stale test coverage.** Add shell-level
coverage for two behaviors: (a) a scope-stale `main-qa` node transitions to
`done` rather than being demoted to `implement`; (b) the scope-fingerprint stamp
is read and refreshed at the **main-checkout root**, not the invoking PR-branch
worktree, when `transition-node` runs with cwd inside a nested
`.claude/worktrees/<id>`.

*Model: sonnet* — shell coverage, explicit behaviors

**Unit 7 — `test-park-node.sh` precondition guard.** Fail fast with a clear
"install dependencies first" error when the harness root has no `node_modules`,
instead of dangling a symlink into every clone and surfacing the missing
precondition as an opaque `tsx ERR_MODULE_NOT_FOUND` inside one unrelated-looking
case.

*Model: sonnet* — fail-fast precondition guard

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

> **⚠ THE NODE IS ALSO PARKED, INDEPENDENTLY OF #3023.** *(Added 2026-08-30 — the
> unit previously carried only the sequencing caveat and never mentioned the
> park.)* `intentions/tactic-fingerprint-stamp-sha-provenance.md` is **parked
> since 2026-08-20** on an unmade ruling: does `execution.strategy_fingerprint`
> keep its `{hash, sha}` object form, or does `sha` go? Until that is answered
> the unit is unplannable **even if #3023 lands**, because the shape decides
> whether there is a `sha` to correct at all.
>
> **EXECUTOR DECISION, 2026-08-30 (for ratification — see
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"): KEEP `{hash, sha}`.** The `sha` is the provenance half — it
> is what makes a stamp auditable against a commit, and dropping it removes the
> ability to detect the very defect this unit exists to fix. There is also no
> write site on `main` yet, so keeping the richer shape costs nothing today,
> while dropping it is an irreversible narrowing taken before any consumer
> exists. Clear the park on that axis; the unit stays carried forward behind
> #3023 for the sequencing reason above, not the shape one.

*Model: sonnet* — record post-commit sha instead, shape unchanged

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

That appears to contradict the file's own comment three lines above the guard —
`validate-graph.ts:111`, *"Validating 'nothing' is never a pass"*.

> **⛔ DO NOT MAKE AN EMPTY NAMED STORE AN ERROR. THE NODE IS PARKED, AND THE
> ORIGINAL SCOPE WOULD REQUIRE INVERTING A PASSING TEST.** *(Corrected
> 2026-08-30.* The unit used to say: "Fix: after enumeration, exit non-zero when
> the store resolved to zero nodes…"*)*
>
> `intentions/tactic-validate-graph-empty-store-pass.md` is parked since
> 2026-08-20: *"this node's Scope reverses a contract the same merged PR
> deliberately established, and nothing in the graph rules which of the two is
> intended."* The contract is real and verified:
> `packages/intentionsutil/test/reader-required-dir.test.ts` —
> `it("validates a directory the caller named, even an empty one", …)`, landed by
> PR1 itself and **currently passing**. Implementing the original scope requires
> inverting it, which `.claude/rules/test-integrity.md` forbids outright.
>
> **EXECUTOR DECISION, 2026-08-30 (for ratification — see
> `plans/dispatch-rsi-author-rulings.md` §"Executor decisions taken during
> reconciliation"): THE TEST'S CONTRACT STANDS. An existing, caller-named,
> empty store is a legitimate graph.** Two reasons beyond the test-integrity
> bar. First, the vacuous-pass class PR1 Unit 8 was chasing is **already closed**
> by its own change: a *missing* directory exits 2, so a `verify` fence run from
> the wrong cwd already fails rather than reporting a clean graph. Second, an
> empty-store error would break **graph bootstrap** — the first `validate-graph`
> run in a fresh instance repo, before any node exists, is a supported case.
>
> **Unit 9 is rescoped to the honest half, which ships:**
>
> - **Correct the comment, which is what is actually wrong.**
>   `validate-graph.ts:111` should state the real contract: a *missing* store is
>   never a pass (exit 2); an *existing, caller-named, empty* store is a
>   legitimate graph and passes.
> - **Make the emptiness impossible to misread.** Print
>   `ok — 0 nodes (store is EMPTY at <resolved absolute path>)` so an empty run
>   is visibly distinct from a populated clean run at a glance, without becoming
>   an error.
> - **No test is inverted, skipped or deleted.** Add a case pinning the new
>   output string alongside the existing assertion.
>
> Clear the park in the same write, citing this decision.

*Model: sonnet* — comment correction plus an explicit empty-store message

**Unit 10 — a node prose reword still de-registers a sensor with nothing going
red** *(PR1 residual — shape ruled below)*. PR1 Unit 2
narrowed the validator so a red sensor-registration check can no longer block
every graph write. What it did not do is give the **de-registration** case any
failing gate at all. The sensor name is coupled to node prose by exact string
match, so rewording a node silently unbinds it, and:

- `graph-validate` runs `validate-graph.ts`, which PR1 made **non-fatal** on
  precisely this condition — so it can never go red on it;
- `unit-tests.yml` declares `branches-ignore: ['graph/**']`, and
  `graph-validate` lives in that same workflow — so for a write that lands via
  a `graph/**` push, **neither job runs at all**. *(Updated 2026-08-23: `main`
  was removed from that list in #3108, so the `main` half of this gap is closed
  — but the `graph/**` half, which is the one this unit turns on, is unchanged
  and the argument below stands.)*

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
   the outage, but it detects after the fact. Its recorded cost was a **new
   workflow**, because nothing ran on a `main` push outside path-scoped
   deploys. *(That premise is dead — see the ruling below.)*

**RULED: (2) first, then (1) — and
(2) must be FATAL.**

The ordering carried from PR1's review is ratified: take the post-merge check
on `main` first as a detection floor that cannot deny a write, then (1) later
as the real write-time gate, and only once its new `origin/main` read has a
proven failure-open path. Ratifying (1) alone was **explicitly declined** — the
node's own terms say it is not sufficient to unpark, because the failure-open
behavior of that read is the whole risk.

**The added requirement is part of the ruling: (2) must FAIL the post-merge
`graph-validate` job, not warn on stderr.** This unit exists precisely because
the original brief scoped a node-scoped failure and what shipped was a warning.
Ruling (2) without stating *fatal* invites the identical under-delivery a
second time.

**(2) needs only the check, not a new workflow — verified live, not quoted.** `main` is not in `unit-tests.yml`'s `branches-ignore` (only
`graph/**` is), and `graph-validate` is a job **inside** that workflow
(`.github/workflows/unit-tests.yml:145`). Confirmed against five separate
`graph-commit` direct pushes to `main` made while verifying it — runs
`33202092698`, `33202500193`, `33203326304`, `33203688821`, `33204380154` —
every one triggered `unit-tests.yml`.

Two things the ruling does **not** change: the `graph/**` half of the blind
spot stays ignored, and `validate-graph` stays deliberately **non-fatal on the
write path**. The fatal behavior is required of the **post-merge job only**,
which is exactly what keeps the write path unable to deny.

*Model: sonnet* — ruled shape; make existing job fatal

**Unit 11 — `verify-landed`'s unknown-node arm is untested** *(PR1 residual)*.
PR1's post-merge QA exercised `verify-landed` at 0/4/4/2 and
confirmed the absent-node path returns **exit 4** rather than a false "landed".
The **exit 1** "unknown" arm was never reached — it is not reachable read-only,
so the QA pass could not cover it. This is the script every closure in this plan
uses as its second, independent verification, and an untested arm in it is an
untested arm in the bookkeeping of ~100 remaining node closures. Add shell-level
coverage that drives it deliberately.

*Model: sonnet* — shell test for known arm

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

After merge, for each of the 12 ids set `phase: done` and
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
reports nothing.

> **⛔ THE MECHANISM IN THE OLD TEXT DOES NOT EXIST.** *(Corrected 2026-08-30.*
> This unit used to read: "Surface held-for-office-hours counts to the tick's
> alarm/health signal and escalate a node held across many consecutive ticks".*)*
> `intentions/tactic-graph-auto-merge-office-hours-hold-observability.md`:
> ***"There is no tick counter to hang that on, and `dispatch-fleet-watch` does
> not run per tick at all."*** Both halves of the old instruction are
> unbuildable.
>
> **The node discharges it with a wall-clock age off `office_hours.since`,
> delivered via `dispatch-fleet-watch` predicate 6, `merge-queue-parked`.** Build
> that. A mass or stuck park then surfaces as a bounded-age alarm rather than a
> tick count.

This is the node-lane analogue of a finding this plan already accepts: the
freeze section measured the queue at **0 mergeable, 2 parked** — a state that is
currently invisible unless someone queries it by hand.

*Model: sonnet* — surface counts into existing signal

**Unit 2 — `behind` when the head is already an ancestor of `main`.** A PR head
whose commits landed out of band is currently routed into the sync arm, where the
update-branch call is an empty-diff no-op that the mergeable gate then silently
declines.

> **⚠ THE DISPOSITION IS ALREADY RULED, AND CLOSING THE PR IS OUT OF SCOPE.**
> *(Corrected 2026-08-30.* This unit used to read "Decide the correct disposition
> (most likely: recognize it as already-landed and close the PR) and implement
> it", tagged "*Model: opus* — disposition decision left open".*)*
> `intentions/tactic-graph-auto-merge-behind-arm-out-of-band.md` is
> `status: codified` with the disposition **already ruled**: emit a **visible
> `held … (already-landed)` hold**. It puts **PR-close explicitly out of scope**.
> Nothing here is left open.
>
> The old text also restated a failure model the node refutes as **mutually
> exclusive** — the two arms it described cannot both be reached. Do not
> reproduce it; read the node.

*Model: sonnet* — implement the ruled hold, no decision to make

**Unit 3 — cap the hold-alert scan cadence.**
`packages/intentionsutil/scripts/list-unclaimed-hold-alerts.ts` (`:113`, calling
`listUnclaimedHoldAlerts` from `src/hold-alerts.ts:91` — both verified). Its
full-graph `resolveAttention` scan runs on `dispatch-fleet-watch`'s **5-minute**
timer even though the predicate's own threshold is a **24-hour** age bound —
~288 redundant full-store scans/day, growing with the graph. Fix: run it on a
cadence proportional to its own threshold.

*Model: sonnet* — cadence change, verified anchors

**Unit 4 — bound the pass with a probe budget in the watcher, NOT a row cap in
the enumerator.** `dispatch-fleet-watch` predicate 5's per-pass claim-probe count
and its pushed alarm-node body grow without limit under a backlog of unclaimed
manual holds. **Do not cap rows in `listUnclaimedHoldAlerts`.**

> **The correctness trap that decides the design.** A library-level cap sits
> **before** `dispatch-fleet-watch`'s claimed-ladder filter. A cap of N can be
> filled entirely by *claimed* rows and yield **zero** findings while
> genuinely-unclaimed holds sit below the cut — a **false all-clear**. That is
> not cosmetic: predicate 5's verdict is not just an alarm, it is a *resolve* —
> a `clear` verdict sends `--resolve --kind unclaimed-hold` and **closes an
> already-open alarm node** (`dispatch-fleet-watch`, FAIL DIRECTION block near
> the `--resolve --kind` emission site). The original finding's recommendation
> is refuted; **do not ship it verbatim.**

> **The premise of the old instruction was also a category error.** `topK` is
> not an advisory row cap waiting to be made binding. In
> `packages/intentionsutil/src/hold-alerts.ts` it is a **rank cutoff on the
> source pool**: the pool of eligible/live/unparked nodes is sorted, a `cutoff`
> rank is taken at `topK - 1`, and candidates ranked past it are `continue`d.
> The emitted `alerts` array has no `slice`, no counter and no cap at any point.
> There is nothing there to "make binding".

Build instead, per the node's two units:

- **Node Unit 1 (opus)** — a per-pass probe budget
  `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES` (default 50) inside
  `dispatch-fleet-watch` predicate 5, with a **truncation-aware verdict**: when
  the budget is exhausted with rows still unprobed, the verdict is `unknown`,
  **never `clear`** — so a truncated pass can never emit `--resolve`. The
  truncation is stated in the pass output ("further enumerator rows went unprobed
  this pass (probe budget DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES=… exhausted)").
  Files: `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` and
  `test-dispatch-fleet-watch.sh` only.
- **Node Unit 2 (comment-only)** — record the deliberate non-decision in the
  library headers (`hold-alerts.ts`, `list-unclaimed-hold-alerts.ts`): name
  `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES` as the bound and say why the cap is not
  here. **No behavior change in the library.**

**Explicitly out of scope, per the node:** no `maxAlerts` field on
`HoldAlertOpts`, no truncation inside the enumerator, no `--limit` /
`--max-rows` flag.

*Model: opus* — the node rates Unit 1 opus; the verdict arm is the whole point

**Unit 5 — stop leaking scratch refs.** Sweep origin's orphaned
`refs/heads/graph/*` scratch branches, and close the reason writers keep leaking
them: cleanup is a best-effort `EXIT`-trap step that a killed or hard-failing
writer never reaches. A trap is the wrong mechanism for a guarantee — move the
sweep to the next writer's startup, where it runs unconditionally.

*Model: sonnet* — move sweep to startup

**Unit 6 — `graph-digest.ts` quality follow-ups.** Deferred from the #2865
review: add stop-word filtering to near-dup tokens, tie STORED-DEFAULTS to schema
defaults, factor the repeated table render/truncation shape, and validate that
`DigestInput` bodies/rawTexts are keyed 1:1 with nodes.

> **⚠ WRONG NODE — and this unit is under-scoped by one unit.**
> `tactic-graph-digest-tooling` was pruned by `afe270a7` at `status: codified`,
> `phase: done`, `pr: 2865`; its work shipped and
> `packages/intentionsutil/scripts/graph-digest.ts` is on `main`. **Do not mint
> it.** The deferral is carried by
> `intentions/tactic-graph-digest-quality-followups.md` — `status: codified`,
> `phase: implement`, `blocked_by: []`, `office_hours: null` on `origin/main`
> 2026-08-30 — which is **already in this PR's `### Nodes closed (6)` list
> above**. Plan Unit 6 from that node, not from this paragraph. It carries
> **five** units, and the four named here omit its Unit 3: *one cycle-safe
> reachability util, adopted in `computeSignalPath` and `tableClosure`*. Add it,
> or the node cannot close. The stale id is also cited in
> `.claude/skills/align-audit/SKILL.md` — fixed in the same commit (E22).

> **⚠ The ordering instruction here inverts the node's dependency chain, and the
> CLOSURE framing is wrong.** The governing node's Unit 4 hard-depends on its
> Unit 2, which depends on its Unit 1 — so "do the O(n²) sub-unit first" cannot
> be followed. Work the chain **1 → 2 → 4**. And CLOSURE is not an O(n²) bound
> to fix: the node records *"The output is **correct** — do not 'fix' a wrong
> answer, there isn't one."* Bound NEAR-DUP; leave CLOSURE's semantics alone.

*Model: opus* — algorithmic bounding below O(n²)

### Dependencies

**PR1** — for trustworthy node closure, as with every PR here. Nothing else;
Units 1–6 are mutually independent and may be split if the PR runs large.

Unit 1 overlaps PR5's reconciler surface only conceptually, not in code.

### Reuse

- **⛔ Do NOT reuse `topK` as a row cap.** *(Corrected 2026-08-30.* This bullet
  used to read: "`listUnclaimedHoldAlerts`'s existing `topK` option
  (`src/hold-alerts.ts:91`) — Unit 4 makes it binding rather than adding a
  parameter."*)* `topK` is a **rank cutoff on the source pool**, not an advisory
  row cap; the emitted `alerts` array has no `slice`, no counter and no cap, so
  there is nothing to "make binding". A library-level cap would sit **before**
  `dispatch-fleet-watch`'s claimed-row filter and could yield a false all-clear
  that fires `--resolve --kind unclaimed-hold` and closes a live alarm node. See
  Unit 4 in Scope, and `intentions/tactic-hold-alerts-uncapped-alert-rows.md`
  (`:259-262` out-of-scope, `:448-451` rationale). The bound Unit 4 builds is
  `DISPATCH_FLEET_WATCH_HOLD_MAX_PROBES`, in the watcher.
- `.claude/skills/dispatch-propagate/scripts/dispatch-fleet-watch` predicate 5's
  existing per-pass probe loop — Unit 4 budgets it rather than adding a second
  pass.
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

> **In-flight overhang — both settled.**
> **#3037** (`tactic-census-scripted-tick`) was to be closed and absorbed here.
> **It is not.** Reading `census-tick.ts`'s `spliceBody()` showed the defect does
> **not** survive the port — the ported function is mint-only behind an
> `existsSync` skip, i.e. it is the fix. #3037 lands at position 12, after this
> plan. **Unit 1 loses its second site**, which stays on `main` untouched;
> see the note in Unit 1.
> **#3054** (`tactic-blocked-session-invisible-to-census`) — its clean half
> landed as #3101 and the draft is closed. What remains for **Unit 4** is the
> contested half against `dispatch-fleet-alarm`; re-locate its anchors against
> today's file rather than trusting the numbers below.

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

### Nodes closed (4)

- `tactic-dispatch-conflict-substance-allowlist`
- `tactic-review-fix-porcelain-guard-script`
- `tactic-fleet-alarm-node-park-clobber-loop`
- `tactic-graph-commit-park-content-durability`

> **`tactic-autonomous-body-write-wholesale-replace` was removed from this list
> on 2026-08-30 — it is PARKED, not closed.** Six of its seven units are
> unshipped and are claimed by no PR section anywhere in this document. See Unit
> 1 in Scope. It gates no position, but closing it would drop that work out of
> the graph.

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

> **⛔ "THE NODE IS A DRAFT, NOT A PLAN" IS FALSE — AND CLOSING ON IT ERASES
> LIVE WORK.** *(Corrected 2026-08-30.* This unit used to end: "*(The node is a
> draft, not a plan: it carries the measurement and the shape of the fix but no
> verification block. Decompose before building.)*"*)*
> `intentions/tactic-autonomous-body-write-wholesale-replace.md` answers it
> directly: ***"That was true of the 2026-08-15 draft. It is **not** true of this
> node: the 2026-08-20 `/align-tactics` round finalized it to `phase: implement`
> with seven units and a Verification section."***
>
> **Six of the seven units are unshipped and appear in NO PR section.** Measured
> across all of `plans/*.md`: `node_body_write`, `dispatch-diagnose-main` and
> `dispatch-invalid-state-followup`'s `splice_body` all return zero hits. PR18
> shipped one of the node's four surfaces by a **local** contract rather than the
> shared primitive the node exists to introduce, and the copy-paste it exists to
> eliminate still sits at three sites. Closing the node on the draft claim drops
> that work out of the graph entirely.
>
> **The node is PARKED, not closed** — remove it from `### Nodes closed (5)`
> above; that list is corrected to four. Its park is **not
> executor-dischargeable**: three dispositions (split, narrow-and-mint-a-successor,
> close-as-superseded) sit in its `office_hours.recommendation`, and the closing
> batch was not authorized to pick among them.

*Model: opus* — read the node's seven units; do not treat it as a draft

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

*Model: opus* — fail-open risk in fence design

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

*Model: sonnet* — extract specified fence to script

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

**RULED: do BOTH (a) and (b), in
this unit.**

The node's own recommendation was *(a) first, then separately evaluate (b)*.
The sitting went further, on the ground that **(a) and (b) fix different halves
of the observed loop**. The cycle is mint → park → clobber → frozen worker:

- **(a)** — exclude the `tactic-fleet-alarm-<kind>` id family (or a general
  mechanically-managed marker, e.g. a dedicated `attributes` flag) from
  `router.ts`'s draft/raw candidate emission, so these nodes are never selected
  for `/align-tactics` at all. This stops the **frozen worker**, and matches the
  already-recorded contract that `--resolve` is their only terminal.
- **(b)** — make `dispatch-fleet-alarm`'s `classify()` park-aware: a node with
  `office_hours !== null` but *not* `phase: done` must not be treated as
  closed/re-mintable. This stops the **clobber**, which is the actual loss of
  park content — and (a) does not address it.

(b) is therefore not cosmetic hardening; it is the half that prevents data
loss. Ship both here rather than deferring (b) to a follow-up.

**Regression coverage required by the ruling:** assert that a
`tactic-fleet-alarm-*` node is never emitted as an `/align-tactics` candidate,
and that a park landed on one survives a subsequent re-detection. Verify by
confirming `tactic-fleet-alarm-unclaimed-hold` and
`tactic-fleet-alarm-busy-stall` no longer appear in `selectGraphTargets`'
candidate list, and that no new "worker session froze" park commits accumulate
on any `tactic-fleet-alarm-*.md`.

**This unit also has a parked node**, contrary to the agenda's earlier claim
that C3 had none: `tactic-fleet-alarm-node-park-clobber-loop`, `owner: ai`,
parked since 2026-08-04. Recording the ruling here does not clear that park.

*Model: sonnet* — both halves ruled and anchored

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
> because the node does not."

**RULED: fix the ordinary branch
only; record the delete/modify residue rather than closing it silently.**

Scope this unit to the **ordinary lost-writer branch** — carry the losing
writer's content in `office_hours.recommendation`, which lands on
`origin/main` and so is durably fixable. Do **not** expand the unit to the
delete/modify branch.

**Why the delete/modify branch is out of scope: it is a designed contract, not
a gap.** `tactic-graph-commit-delete-vs-edit-park-hardening`'s `main-qa` pass
read the current code (`graph-commit:1839-1867`, `test-graph-commit.sh:212-223`
and Case 53 at `:2089`) and found the finding text that describes it as
"resurrect the deleted node onto `origin/main` with a park attached" is
**stale**. Shipped behavior: the landed deletion always **stands** on
`origin/main`, nothing is ever auto-pushed back, and the session's edit is
re-materialized **only** as a local untracked worktree file carrying
`office_hours`, with the operator explicitly choosing **OVERRIDE** (re-run
`graph-commit` on the re-materialized file to re-land it) or **CONFIRM** (`rm`
it, since `main` already reflects the deletion).

**The residue that must be recorded**, per the ruling: that re-materialized
file is *local and untracked*, so a **reaped worktree destroys it** — the same
durability class as `SNAP_DIR`, reached by a different mechanism. Record this
on the node; do not close the branch as fully handled and do not silently widen
this unit to chase it.

**Two nodes carry this unit**, and both were parked when the ruling was made:
`tactic-graph-commit-park-content-durability` and
`tactic-graph-commit-delete-vs-edit-park-hardening` (`phase: main-qa`). Both
parks have since been cleared, so neither blocks this unit — but recording the
ruling in this plan is not the same as recording it on the nodes. Check each
node carries the ruling before closing it.

*Model: opus* — park durability on writer path

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

> **In-flight overhang.** Open draft: **#3041**
> (`tactic-clarification-citation-ids`, `router.ts` + `schema.ts`) — **absorb
> directly**. No sitting gates it: the node is `office_hours: null`,
> `owner: ai`, `phase: review`, and its park was a mechanical fleet park,
> cleared 2026-08-21. Planned-no-PR:
> **`tactic-schema-drift-guard`** — a CI guard that every field, rule, enum and
> vocabulary `schema.ts` enforces is declared on a kind node; this PR is the
> `schema.ts` PR and its first beneficiary. Keep #3093, #2856 and #3040 *out* —
> they rewrite node content in bulk and belong after the bookkeeping.

**Recommended model: opus** — Unit 1 is a schema change with a data migration
behind it, and the terminal it adds is one the router must not mistake for
`done`.

### The two derived sub-points — ruled; encode the ruled form, not the original

This PR encodes two behaviors that **Claude derived, not the author**. Both were
put to the author and dispositioned. **Unit 1 must encode the ruled wording**,
which differs from the original on the first point.

**Sub-point one — AMENDED, not ratified.** The derived rule was: a node with
`execution` non-null gets the supersession edge but **no park**. The no-park
half is **kept** — an in-flight node is not parked, so a similarity judgment
never halts live work. But the derivation omitted what the governing
clarification requires of the exception it invokes: a tactic left selectable on
doomed surface is permitted only as an explicit interim-live-risk exception
**naming its expiry event**. So:

> **A supersession edge written onto an `execution`-non-null node MUST carry its
> expiry event** — normally that in-flight PR's own merge or closure.

This converts an unbounded carve-out into a bounded exception at no behavioural
cost. **Encode the field in Unit 1, alongside `superseded_by`.** Adding it after
PR19 lands is a data migration, not an edit.

The justification originally offered for the bare no-park rule does not hold, and
is recorded here so it is not re-derived: the analogous "skipped-in-flight"
refusal is a *dedup-half* rule that refuses to **write** to an in-flight node,
which protects it and loses only an unrecorded recurrence. Withholding a park is
not the same act — the edge lands, but nothing routes a human to read it, so a
record silently replaces a signal.

**Sub-point two — RATIFIED**, with its carrier made explicit. Only a *fully*
superseded tactic demotes; per-unit doomed surface drops instead. The carrier of
a per-unit drop is **the node's own unit list** — not the edge, and not a park.
State it that way: "parks nothing" alone reads as "records nothing".

Two consequences worth stating rather than assuming:

- The creation-time check is keyed on the **new** node and does not rewrite the
  existing node's plan body, so the per-unit doomed drop still runs at
  `/align-tactics` finalization, reading the edge the creation-time check wrote.
- A doomed-unit *threshold* was considered and **declined** as an ungrounded
  magic number. Do not introduce one.

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
- `tactic-schema-drift-guard` *(folded in from the overhang)*

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
the validator — *anchors drifted, locate by content*).

> **⛔ LEAVE `STATUSES` UNCHANGED — IT IS A DECOY, NOT A GATE.** *(Corrected
> 2026-08-30.* This unit used to say "the terminal extends `STATUSES` (`:21`,
> verified: `["raw", "refining", "delegated", "codified"]`)".*)*
> `intentions/tactic-supersession-edge-and-terminal.md` says so in terms:
> ***"DECOY — do not mistake it for a gate. … This plan deliberately does NOT add
> `superseded` to it"***, and ***"leave the array unchanged"***. Extending it
> would be **inert** *and* would assert a central status enum the design rejects.

> **⚠ RULE NUMBERS: THIS PR TAKES 24 AND 25 — NOT 23 AND 24.** PR16 already took
> **rule 23** for the attributes shadow-ban, and `schema.ts` carries the
> collision warning in code at that rule (`:1812` at the time of writing —
> locate by content). Rule numbers are cross-referenced from node bodies and are
> **never reused**. The allocation is
> `plans/dispatch-rsi-author-rulings.md` row D: **PR19 takes 24 and 25; a
> Position 7 rule takes 26; rule 20 is permanently burned.**
>
> The node itself still says 23/24 in **seven** places, including a verification
> step *"Confirm the new rules are numbered 23 and 24"*. **The plan and the
> ruling govern here** — number them 24 and 25, and correct the node's
> verification step when the node is next written.

Four things this unit must settle, all of which are graph-wide:

- **The edge carries an expiry event when it lands on an in-flight node** — see
  the ruling above. This is a schema field added in the same change as
  `superseded_by`, not a follow-up: adding it later is a data migration.
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

*Model: opus* — schema change, migration, router terminal

**Unit 2 — persist `/align-tactics`' `greenfield_drops` as supersession edges.**
Instead of discarding them into the round report, write them onto the graph
through the shared creation surface. The two ruled sub-points above govern the
behavior here: an in-flight node gets the edge, **carrying its expiry event**,
and no park; only a fully superseded node is parked, and a per-unit drop is
recorded on the node's own unit list.

*Model: opus* — cross-cutting producer through write surface

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

*Model: opus* — prose matching risks false positives

### Dependencies

**PR4** — `tactic-persist-greenfield-drops` is `blocked_by`
`tactic-finding-search-all-producers`, PR4's central node: the one find-or-recur
write surface every creation site routes through. Unit 2 writes supersession
edges *through* that surface, so it is genuinely downstream.

**PR1** — shipped; Unit 4 of it is what makes Unit 1 landable atomically (above).

Unit 3 is independent of both and may land separately.

> **⚠ PR-level cycle with PR4 — PR19 SPLITS.**
> `tactic-finding-search-all-producers` (PR4's central node) is `blocked_by
> tactic-supersession-edge-and-terminal` (**this PR's Unit 1**), while
> `tactic-persist-greenfield-drops` (this PR) is `blocked_by
> tactic-finding-search-all-producers`. PR4 and PR19 therefore cannot both be
> atomic PRs in either order. The node graph is acyclic — only the PR bundling
> is not.
>
> **Executor decision 2026-08-30 (for ratification): ship Unit 1 as its own PR,
> PR19a, AHEAD of PR4.** Unit 1 is a pure `packages/intentionsutil/src/schema.ts`
> addition with no dependency on PR4's write surface. Units 2 and 3 stay behind
> PR4 as PR19b. See `plans/dispatch-rsi-sequence.md` §"Position 6" and
> §"Executor decisions taken during reconciliation" in
> `plans/dispatch-rsi-author-rulings.md`.

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

After merge, for each of the 4 ids set `phase: done` and
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

> **No gate on the `/align-audit` re-consumption question specifically.**
> `/align-audit`'s inclusion of the two engines the `/align` consolidation
> retired — the rung-5 dialectic and the `/align-strategy` improvement pass —
> was decided **against re-consumption**, the node holding that decision has
> been pruned, and its in-graph references were swept.
>
> **But six of this PR's nine nodes ARE parked**, two of them on a different,
> still-open condition — the authored-boost relation on
> `strategy-discovered-requirements` — which is exactly why Ruling 7 descoped
> Units 1 and 3. The earlier sentence "Nothing here waits on the author" is
> struck as false. Check each node's `office_hours` before planning its unit.
>
> One live consequence for this PR: the strategy-wide backlog-band breach that
> the same disposition covered was ruled **(c) accept with remediation** — the
> 35% target stands, and this sequence is itself the drain plan. Do not re-open
> the target. **(Owed transcription onto `strategy-graph-native-dispatch`.** The
> ruling is real but lives **only in the commit message of `751982b0`** —
> `git grep "accept with remediation" -- intentions/` returns zero. The
> strategy's `reading` already shows `40.5% (band ≤35%)` with no ruling attached.
> Transcribe it per Ruling 5.**)**
>
> **Note the un-park criterion says *solely*.** Of the four band-parked Position
> 9 nodes, only `tactic-align-tactics-drift-dump-office-hours` is parked
> **solely** on the band — so this ruling unparks that one and no others. The
> rest carry a second, still-open condition.

> **`tactic-retire-assessor-contract-docs` rides this PR — RULED 2026-08-29.**
> It was in no bundle, so the sequence could have run to completion without
> anyone noticing it. It rides here because PR20 already rewrites the `/align`
> skill surface its third unit edits, so the two touch the same files and review
> together; the freeze means no worker picks it up on its own.
>
> `phase: implement`, `owner: ai`, three units: retire `.claude/docs/delegability.md`,
> `.claude/docs/signal-identification.md` and their `ref-*` skills, plus
> `.claude/skills/align-audit/SKILL.md`, whose out-of-scope list still frames a
> decision settled 2026-07-23 as pending and cites a node that no longer exists.
>
> **Counting:** PR20 itself still closes the 8 nodes listed below. The *bundle*
> closes **9**. Close the rider's node with them.

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

**Unit 1 — the `/align-review` gate. ⛔ DESCOPED — DO NOT BUILD IN THIS PR.**

Author Ruling 7 (`plans/dispatch-rsi-author-rulings.md`, ANCHOR `### Ruling 7 —
Position 9 Units 1 and 3 are descoped`) rules:

> **Ruled: DESCOPE UNITS 1 AND 3**, ship the rest of Position 9. The two units
> stay parked pending the strategy and need a follow-up position later. PR20
> ships partial rather than fabricating a strategy the author has not written.

**The node is additionally parked and therefore unplannable.**
`intentions/tactic-align-review-skill.md` carries a non-null `office_hours`,
`since: 2026-08-20`, `status: raw`, `phase: null` — parked on the failed
authored-boost-of-8 condition on `strategy-discovered-requirements`, a strategy
that has not been written. Two independent stops.

**Ship PR20 as Units 2, 4, 5 plus the `tactic-retire-assessor-contract-docs`
rider.** The four deliverables below are retained as the *reference spec for the
later follow-up position only*; they are not this PR's scope.

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
> ruled out.
>
> **⛔ THE DIFF-READ GATE PREDICATE IS THE DESIGN THE AUTHOR REJECTED. Struck.**
> An earlier revision of this section carried: *"Gate predicate: the commit
> creates or modifies a `strategy-*` field other than the router-owned ones
> (`phase`, `execution`, `office_hours`, `reading`, `attention`), or creates any
> new node file."* That sentence was transcribed out of the node's **superseded
> draft item 3** and stamped with the very date that overturned it.
>
> The author ratified **option (a), the caller-declared seam**: `--review` is a
> flag the **CALLER** passes, and `graph-commit` refuses only a write that is
> *declared* under review without a valid receipt. **It never inspects the diff
> to decide whether a receipt was owed** — a diff-read predicate tries to infer
> caller identity from diff shape, and that inference is impossible.
>
> Verified counter-evidence recorded on the node: the rejected predicate would
> have refused `dispatch-eval-finding`'s own ledger write (exercised live during
> the ratifying session — it creates a new node file), `/align-tactics` node
> mints, `qa-fix` finding nodes, `dispatch-diagnose-main`'s
> `tactic-main-red-<sha>` node, and `/context-chunks` drafts.
>
> The stale sentence still sits in the node's own body; the node's 2026-08-21
> clarification is what supersedes it, and it says so: *"An implementer reading
> item 3 in isolation would build the design the author explicitly rejected."*

*Model: opus* — review gate, judgment quality core

**Unit 2 — revise `/align-strategy`'s two new Step 2 interview steps.** The 2.3
doctrinal-consistency gate and the 2.5 steelman challenge: make the gate test the
**finalized rationale and post-steelman intent** rather than the draft, record
clean passes, define its overlapping-strategies scope, and **cross-reference
rather than restate** the shared `origin/main`, question-mechanics and
tradition-record rules. The node carries a full plan (~9 KB).

*Model: opus* — wording is the mechanism

**Unit 3 — `/align` Step 6 gains a self-consistency walk** over the round's own
output. **⛔ DESCOPED — DO NOT BUILD IN THIS PR.**

Author Ruling 7 (`plans/dispatch-rsi-author-rulings.md`, §"Ruling 7 — Position 9
Units 1 and 3 are descoped") rules:

> **Ruled: DESCOPE UNITS 1 AND 3**, ship the rest of Position 9. The two units
> stay parked pending the strategy and need a follow-up position later. PR20
> ships partial rather than fabricating a strategy the author has not written.

> **And it is not a "~200 byte draft".** *(Corrected 2026-08-30.* This unit used
> to be annotated "*(Draft, ~200 bytes — decompose before building.)*"*)* Its
> node is **parked since 2026-08-21 with four planning clarifications** on it —
> parked on the authored-boost-of-8 condition on
> `strategy-discovered-requirements`, a strategy that has not been written. Two
> independent stops, exactly as with Unit 1.

*Model: n/a — descoped, not built in this PR*

**Unit 4 — pass `office_hours` into the `/align-tactics` drift payload.** The
drift agent is instructed to weigh the strategy's own `office_hours` and is never
given the field.

> **⛔ FIXING ONLY THE FOUR WORKFLOW DUMP SITES SHIPS A NO-OP THAT PASSES ITS OWN
> TEST.** *(Corrected 2026-08-30.* This unit used to read "Fix all **four dump
> sites** so the instruction and the data agree."*)*
> `intentions/tactic-align-tactics-drift-dump-office-hours.md`: ***"A plan that
> edits only the four workflow dump sites ships a change that forwards
> `undefined` on every invocation and would pass a naive grep-count assertion
> while fixing nothing."***
>
> **The old verification step WAS that assertion**, so the defect and its test
> were mutually invisible. **Use the node's full site set** — the field has to be
> read into the payload upstream of the dumps, not merely named at them — and
> **verify by asserting the value reaching the agent is non-`undefined`**, not by
> counting greps. This PR's Verification section is corrected accordingly.

*Model: opus* — full site set per the node, not the four dumps

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

*Model: opus* — durable-layer policy in skill text

**Unit 6 — `validateGraph` ordering-inversion lint.** Warn when node X's body
names node Y while `Y.blocked_by` contains X. **Warn-level, surfaced for session
disposition, never a hard fail.** *(Draft — decompose.)*

*Model: opus* — draft; needs in-session decomposition

**Unit 7 — `tactic-align-tactics-premise-preflight`. ⛔ DO NOT CLOSE IT.**
This node is a **recorded decision, not new work**: it withdraws the preflight
reorder mechanism and redirects the measured cost upstream to Units 3 and 6 —
`/align-tactics`' premise refusal is Side B of the drift review and cannot
precede the evidence its three reasoning phases consume.

> **The close is struck, on two independent grounds** *(2026-08-30)*. The unit
> used to end: "Verify Units 3 and 6 landed, record that on the node, and close
> it. **No code.**"
>
> 1. **Its stated precondition is unsatisfiable.** "Units 3 and 6 landed" cannot
>    become true in this PR: **Unit 3 is descoped by Ruling 7.**
> 2. **Retiring it today loses its evidence.** The node says retiring it puts its
>    evidence on the owed-prune candidate list — ***"do not retire it
>    unprotected"***.
>
> Leave the node open, recording that Unit 6 landed and Unit 3 is descoped, and
> route the close to the follow-up position that picks up Units 1 and 3.

*Model: sonnet* — record the partial outcome, do not close

**Unit 8 — record the "one PR per migration step" rule** *(PR1 residual)*.
PR1 Unit 4's node carried a planning-time rule that PR1 deliberately
left out of scope as `/align-tactics` doctrine rather than graph-write code, and
recommended as a follow-up node: **a data migration and the schema tightening
that rejects its pre-migration spelling cannot share a PR.** The tightening
rejects the old spelling; the migration is what removes the old spelling; put
them in one PR and the PR is red against `origin/main` data from its first
commit until its last.

Scope: **scope item 1 ONLY** — write the rule into
`.claude/skills/align-tactics/SKILL.md` as a decomposition constraint: when a
unit both migrates data and tightens the schema that validates it, split it into
two units with an explicit ordering dependency. Land it here because this PR
already owns the `/align` + `/align-tactics` SKILL text.

> **⛔ Scope item 2 is ALREADY DISCHARGED — do not carry "both halves".**
> *(Corrected 2026-08-30.)*
> `intentions/tactic-align-tactics-migration-tightening-split.md` rules scope
> item 2 already discharged and says to carry **scope item 1 only**. Building
> both re-lands work that has shipped.

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

*Model: opus* — doctrine text plus plan reconciliation

**Unit 9 — the rider, `tactic-retire-assessor-contract-docs`.** The three units
in the banner above: delete `.claude/docs/delegability.md` and
`.claude/docs/signal-identification.md`, retire their `ref-delegability` and
`ref-signal-identification` skills, and fix
`.claude/skills/align-audit/SKILL.md`'s out-of-scope list, which frames a
decision settled 2026-07-23 as pending and cites a node that no longer exists.
The node (`phase: implement`, `owner: ai`) carries any further detail; close it
with this PR's batch.

*Model: sonnet* — mechanical deletions and doc fix

### Dependencies

**PR18** — Unit 5 here is the policy half of the invariant PR18 enforces
mechanically. Not a hard block, but landing PR18 first means Unit 5 is a
redirection into an already-guarded lane rather than an unenforced convention.

**PR1** — shipped; Unit 1's `--review` flag extends `graph-commit`'s existing
`--base` content-binding pattern, which PR1 left intact.

**Must precede PR13** — see the banner above.

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

After merge, for each of the 8 ids listed above — plus
`tactic-retire-assessor-contract-docs`, the position-9 rider, if it rode this
PR — set `phase: done` and
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

All **114** in-scope tactics are assigned; none appears twice.

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
| PR14 | 3 | `attention.ts`, `router.ts`, `/rsi-audit` research subskill |
| PR15 | 2 | `graph-commit` — invocation, short-circuit (+ Unit 0 removal fix, closed under PR15) · **SPLIT 2026-08-29**: writer default and merge path deferred to ref-split |
| PR16 | 11 | `transition-node`, `park-node`/`clear-park`, `read-sensors.ts`, `validate-graph`, `verify-landed` |
| PR17 | 6 | `graph-auto-merge`, `hold-alerts.ts`, `graph-digest.ts`, scratch refs |
| **PR18** | 5 | `dispatch-eval-finding`, `dispatch-graph-census`, `/dispatch-conflict`, `/review-fix`, `router.ts`, `graph-commit` park path |
| **PR19** | 3 | `schema.ts` (`superseded_by` + terminal), `/align-tactics` drops, `lint-verify-fence-paths.sh` |
| **PR20** | 8 | **new** `/align-review` skill + `assemble-review-pack`, `graph-commit --review`, `/align` + `/align-tactics` SKILL text, `validate-graph` lint |
| measurement runs | 3 | no diff — `/rsi-audit` |
| sittings held, nodes closed 2026-08-29 | 5 | no diff — the sittings discharged the gates, and the author's 2026-08-29 disposition closed the nodes themselves (`phase: done`, `execution` null, a frontmatter clarification citing each sitting as the completion record) |
| **total — the 114** | **114** | PRs 106 + measurement 3 + sittings 5 |
| deferred | 8 | ref-split cluster (5, was 3 — +2 from the PR15 split) + scope-custody (2) + `demote-node-stale-local-read` — **outside the 114** |
| adjacent, unclaimed | 5 | `/qa-main` node lane (3) + fleet-dependent (2) — **outside the 114** |
| **the 13 surveyed-but-unassigned** | **13** | deferred 8 + adjacent 5 |
| **total accounted for** | **127** | 114 + 13 |

> **Reading the arithmetic — the rule this table has always followed.** The
> total counts the rows *above* it. `deferred` and `adjacent` sit **below** it
> and are excluded, and the surveyed-but-unassigned figure is exactly their sum.
> That rule holds at every revision of this document: 94 with 5+5=10 at Revision
> 6, 112 with 6+5=11 at Revision 7, 117 with 6+5=11 at #3098. It was never
> written down, which is how two figures drifted.
>
> **The 117 lost 3 and the 11 gained 2 on 2026-08-29.** `tactic-align-audit-legacy-review`
> was pruned from the graph by the D1 prune, so it leaves the count entirely
> (127 accounted for, down from 128). PR15's split moved 2 nodes into
> `deferred` — a move from above the line to below it, which is why the total
> falls by 2 while the surveyed figure rises by the same 2.
>
> **The five restored sittings are the reason the rows stopped summing.** Until
> 2026-08-29 this table carried `pre-PR sessions | 9`. The prune replaced it
> with `measurement runs | 3` on the grounds that the sittings were all held —
> but a sitting discharges the *gate*, not the *node*. Five of those nodes are
> still open on `origin/main` and in no `### Nodes closed` section, so dropping
> the row made them invisible rather than closed. They have their own row again.
> The ninth is the pruned node above.

**How the scope was built.** The original sweep was ledger-driven — every open
`tactic-eval-finding-*` node plus the design nodes resolving them — and was
complete on its own terms, but narrower than the subsystem. A second pass
counted open nodes serving a graph strategy
(`strategy-graph-native-dispatch`, `strategy-graph-integrity`,
`strategy-graph-drives-dispatch`, `strategy-graph-self-description`) whose
**statement** names a graph read or write path: 32 more, none of them in the
plan, creation dates spanning 2026-07-12 to 2026-08-14 — a coverage gap, not a
timing artifact. 22 were assigned (PR1, PR15, PR16, PR17); 10 were documented
and deliberately unassigned. A third pass added the `/align` charter and
supersession work (PR18, PR19, PR20). Every assigned node was re-verified
`phase: null` on `origin/main`.

> **That "10" is a 2026-08-14 reading of a figure that has moved twice since,
> and it is not a separate set from the deferred and adjacent lists below.** It
> is their sum. It became 11 on 2026-08-15 when clarification 243 moved
> `tactic-demote-node-stale-local-read` out of PR1 into `deferred`, and 13 on
> 2026-08-29 when the PR15 split moved two more. The sentence above was never
> restamped, so the document carried 10 in prose and 11 in its table for two
> weeks and the eleventh looked unaccounted for. The table is the live figure.

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
> A fourth pass censused both and routed them; with the overhang retired the
> total becomes **128** — the 114, plus the 13 the overhang absorbed, plus
> PR5a's one node, which was never in the original scope. It read 131 against
> the old 117. *(This 13 — nodes absorbed by the overhang retirement — is a
> different set from the table's 13 surveyed-but-unassigned; that the two are
> numerically equal is coincidence. Likewise this 128 counts absorbed + PR5a
> work, where the table's 127 counts surveyed-but-unassigned; they are answers
> to different questions, not a drifted pair.)*

Of the 114, **36 are on the graph read/write path** — PR1's 8, PR15's 2, PR16's
11, PR17's 6, PR18's 5, PR19's 3 and PR4's `batchIds` unit — plus PR20's
`--review` unit, which adds a receipt gate to that same writer. It is the largest
single surface in the plan, and the one every other PR's bookkeeping runs
through. It was 38 of 117 until the PR15 split moved 2 of them into the deferred
set, which this total excludes.

**Deferred, with reasons:**

- `tactic-graph-ref-split`, `tactic-graph-refsplit-blocker-audit`,
  `tactic-graph-refsplit-read-coherence`, `tactic-graph-commit-plumbing-default`
  and `tactic-graph-commit-direct-three-way-merge` — the ref-split cluster; the
  last two joined it on 2026-08-29 when PR15 split. See
  §"Decisions already taken".
- `tactic-node-scope-files-overlap-gate` — a selector feature gating
  co-dispatch; needs a running fleet to exercise. Resumption work.
- `tactic-scope-stamp-in-graph` — `office_hours`-parked. Unpark before planning.
- `tactic-demote-node-stale-local-read` — blocked behind
  `tactic-phase-evidence-fingerprint-bound` (`phase: qa`).

**Sittings held, nodes still open — inside the 114, in no PR:**
`tactic-review-sitting-code-review-lock-design`,
`tactic-review-band-derivation-ratification`,
`tactic-review-tradition-agentic-engineering` and
`tactic-review-supersession-derived-subpoints`. All four are `status: raw`,
`phase: null` on `origin/main`. Their sittings were held at the 2026-08-28
author round, which discharged the gate each one blocked — but none of the
nodes closed, and none appears in a `### Nodes closed` section. A fifth,
`tactic-align-audit-legacy-review`, was pruned from the graph outright; a
sixth, `tactic-sensor-deregistration-gate`, is counted under PR16. Close
these four deliberately or route them; do not assume the sitting closed them.

> **`tactic-review-dispatch-charter-split` is no longer in this group — it
> CLOSED on 2026-08-29 (`2c806848`).** It is now `phase: done`,
> `execution: null`, `status: raw`, with no diff and no PR: the node's
> deliverable was the sitting itself, and it records the **spec, not the
> execution**. Because it is `done`, `isOpenTactic` is false and no router loop
> can ever select it — so closing it removed the last open node that could have
> carried Position 13's work. **The execution has no carrier node**; see
> §Position 13 in `plans/dispatch-rsi-sequence.md` for what must be minted and
> for the executor decision on who mints it.

**Adjacent, surveyed and deliberately not claimed:**
`tactic-qa-main-node-terminal-declaration`, `tactic-invalid-state-rc-f1c843b1`
and `tactic-invalid-state-rc-fa3075ec` — all three are `/qa-main` node-lane paths
that write job-dir markers instead of graph state. Genuine write-integrity
defects, but `/qa-main` does not run while the sentinel holds, and they overlap
PR12's four-lane surface. Also `tactic-session-reap-authorization-durability` and
`tactic-park-cause-sensor-instrument` — both need a running fleet.

> **Why `tactic-retire-assessor-contract-docs` moved neither count.** It was
> created 2026-08-28 (`447fc27d`) as residue from the D1 prune — two weeks after
> the 2026-08-14 scope build this table counts. It was never a census member, so
> it is neither in the 114 nor in the 13, and the 2026-08-29 ruling that put it
> on PR20 correctly changed only the *bundle* count at position 9, 8 → 9. Its
> earlier "in no bundle" state was a routing gap for a post-census node, not a
> gap in this table. The plan's scope line is a dated filter, not a live census:
> nodes minted after 2026-08-14 ride a PR without joining these totals.

**What is done:** PR1 (8 nodes), the ref-split decision and the five residual
nodes it discovered, the overhang retirement, and every author gate.
**What is next:** PR18. Nothing gates it — its one `blocked_by` edge cleared
when PR1's nodes closed.
