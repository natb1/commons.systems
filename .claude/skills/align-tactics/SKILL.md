---
name: align-tactics
description: Autonomously break a recorded `strategy-*` intention node into PR-sized tactic subtrees carrying full clean-session plans, or finalize/re-plan a single frozen `tactic-*` node directly — the graph-native successor to `/plan-issue` and `/file-issue`'s epic-structuring role. Two-sided drift review, decompose to the signal, plan each claude-eligible tactic into its node body, park the rest; lands via `graph-commit`. Never files a GitHub issue; never `AskUserQuestion` mid-run.
user-invocable: true
---

# Align Tactics

`/align-tactics <strategy-node-id>` breaks a recorded strategy into the
executable tactic subtree that validates its signal this round. It supersedes
`/plan-issue` and `/file-issue`'s epic-structuring role for the graph-native
dispatch model (`intentions/strategy-graph-native-dispatch.md`): a tactic
enters execution by being decomposed and planned here — landed on
`origin/main` with `phase: implement` and a full plan in its node body — not
by becoming a GitHub issue with a `<!-- dispatch:plan -->` comment. Full spec
and coverage matrix: `intentions/tactic-graph-native-dispatch.md` §2.3 and §4.

This skill never files, edits, or closes anything on GitHub, and never runs
`gh`. Its only artifacts are `intentions/tactic-*.md` nodes (and frontmatter
edits to the serving `strategy-*.md`) landed on `origin/main` via
`graph-commit`.

It inherits along two axes, each with a part it deliberately does **not** take:

- **From the retired `/plan-issue` lane** — the drift-review substance, the
  Explore/Plan subagent fan-out, the reuse-first and design-proposals
  discipline, the plan-quality bar, the plan schema, and the autonomous
  office-hours park model. These are **no longer inherited by reference**:
  `/plan-issue` is a retirement stub (`.claude/skills/plan-issue/SKILL.md`) with
  no schema left in it. Their live homes are here and in this skill's workflow:
  - **Plan schema and quality bar** — the `PLAN BODY SCHEMA` block inlined in
    `buildPlanPrompt` (`.claude/workflows/align-tactics.js`), summarized under
    "Plan each claude-eligible tactic" in Step 1 below. That block is
    authoritative; nothing outside this repo's working tree needs to be read.
  - **Reuse-first and design-proposals discipline** —
    `.claude/rules/code-style.md` and `.claude/rules/design-proposals.md`.
  - **Autonomous office-hours park model** —
    `.claude/skills/align-tactics/references/autonomy.md`.
  - **Drift review** — `buildDriftPrompt` in the same workflow file.

  Dropped from that lane: every gh mechanic — no `dispatch-*` scripts, no
  plan-comment, no worktree-branch target parsing, no owning-PR probe. The
  target is the `<strategy-node-id>` argument; sequencing is `blocked_by`
  frontmatter edges, not a PR-precondition scan.
- **From `/align` (`.claude/skills/align/SKILL.md`)** — take
  the write path (`write-node.ts` → `assert-node-fresh` → body `Edit` →
  `graph-commit`), the
  citation of `validateGraph` rules by number, and the register. Invert the
  interaction model: `/align` is interview-driven; **`/align-tactics`
  is autonomous and never calls `AskUserQuestion`**. This inversion is the
  single biggest trap — "match the sibling" pulls the wrong way.

## Trigger and input

On-demand or router-invoked. The sole argument is a node id, either:

- `/align-tactics strategy-<slug>` — decompose a recorded strategy into its
  executable tactic subtree (Steps 1–5 below), or
- `/align-tactics tactic-<slug>` — finalize or re-plan a single **frozen**
  tactic (draft/raw, or soft-frozen — the router selects exactly the tactics
  its `frozenTacticSelectable` gate approves,
  `packages/intentionsutil/src/router.ts:496`). This is the per-node target
  path (see "Tactic target", below).

With no argument, stop and report that a node id (`strategy-<slug>` or
`tactic-<slug>`) is required — this skill never selects its own target.

## Step 0 — Claim and isolate

Before the first write, claim the target node id (strategy or tactic) and
author in its worktree — the same uniform node-id reservation discipline the
router's fan-out workers follow (`strategy-graph-native-dispatch`'s 2026-07-06
concurrency-safety clarification). Never author in the shared `main`
checkout: a concurrent session's dirty tracked file blocks this run's
`graph-commit` rebase, and a stale read races live phase state.

1. **Resolve the target node id** — the `strategy-<slug>` or `tactic-<slug>`
   argument (this skill never selects its own target).
2. **Enter the worktree — on a verified-fresh checkout.** Otherwise create
   or re-enter it, and do all authoring and the step-5 `graph-commit` from
   there. The worktree **is** the claim: the same live-session ⇔ worktree
   liveness rule the router uses, so no separate lock is needed. **Prefer
   `provision-node-worktree`**
   (`.claude/skills/dispatch-propagate/scripts/provision-node-worktree`): it
   fetches `origin/main` and cuts the worktree fresh from it, so no separate
   freshness check is needed after it. If instead this run uses native
   `EnterWorktree`, **or** re-enters an **already-existing** worktree by any
   means **other than `provision-node-worktree`**, running
   `.claude/skills/dispatch-propagate/scripts/assert-worktree-fresh` is
   **mandatory** as the very first action in that worktree — **before any
   graph read** (before any `readNode` or drift grep below). A non-zero exit
   means the checkout is stale **or** the `git fetch` itself failed; either
   way, **STOP** and freshen (`git fetch origin main && git merge
   origin/main`) before proceeding. Never treat a failed fetch as license to
   proceed on unverified state.
4. **Load the ancestry projection.** After entering the worktree, load the
   ancestry projection for the claimed node: read `.claude/ancestry-context.md`
   if `provision-node-worktree` wrote it, otherwise run `npx tsx
   packages/intentionsutil/scripts/node-ancestry.ts <node-id> --dir
   "$(pwd)/intentions"` and hold its output.

   This projection is read-only decision context for in-scope, plan-under-determined
   judgment calls; the node body remains the sole work contract (a plan that assumes
   the projection exists is still an incomplete record), and a perceived plan-vs-ancestry
   conflict parks to `office_hours` with a recommendation — never self-expanded or
   self-reduced scope.

   **Then, unconditionally, on both entry paths — run the shared mechanical
   selection-validity gate**, in the worktree, after `assert-worktree-fresh`
   and **before any graph read** (before any `readNode` call or drift grep
   below). This includes the `provision-node-worktree` path too, even though
   `provision-node-worktree` already ran `check-node-selection.ts` itself
   moments earlier: the re-run here is a redundant, idempotent ~0.7s check,
   and paying it uniformly is the point — a session that provisioned once via
   `provision-node-worktree` but re-enters later (e.g. a resumed session)
   would otherwise slip through on re-entry with no fresh gate check at all.

   ```bash
   .claude/skills/dispatch-propagate/scripts/assert-node-selection "<target-node-id>" align-tactics
   ```

   `align-tactics` is the correct `<selected-phase>` literal for **both**
   target kinds this skill handles. For a `strategy-<slug>` target,
   `check-node-selection.ts` requires the node still be `kind: strategy` at
   its native null phase and defers wholesale to a helper predicate,
   `strategyAlignSelectable`. For a `tactic-<slug>` target — draft/raw
   finalize or soft-frozen re-plan alike — the gate skips the phase-literal
   comparison and defers wholesale to `frozenTacticSelectable`, which is
   membership in the selector's own candidate list
   (`packages/intentionsutil/src/router.ts`). The selector emits an
   uncapped, fully-sorted candidate list, so a low-ranked draft is still
   admitted — ranking never causes a false exit 12.

   Route on the exit code:

   - `0` — proceed; stdout is the node's scope fingerprint (discard it here,
     Step 0 does not consume it).
   - `12` — the selection is no longer valid: the node advanced past draft
     and is not soft-frozen, was parked to `office_hours`, was resolved or
     pruned, or has incomplete blockers. **STOP.** Make **no** graph write,
     open no PR, and record the terminal disposition so the Stop hook can
     reap the job — this session did nothing and lost nothing, so reaping it
     is correct:
     ```bash
     packages/intentionsutil/scripts/mark-node-terminal "<target-node-id>" no-claim
     ```
     `no-claim` is already a validated disposition value in
     `mark-node-terminal`'s vocabulary
     (`packages/intentionsutil/scripts/mark-node-terminal:74`) — this is not
     a new value. The call is safe unconditionally: `mark-node-terminal`
     writes nothing unless this job's own name is `<target-node-id>`.
   - `13` — not reachable at this phase: the gate's scope-chained-phase
     check only applies to the `fix`/`qa`/`review` phases, not
     `align-tactics` (`SCOPE_CHAINED_PHASES = {fix, qa, review}`,
     `check-node-selection.ts:89`). Treat it as a mechanical error: **STOP**,
     make no graph write, report it, AND reap — exactly as the
     `any other non-zero` bullet does:
     ```bash
     packages/intentionsutil/scripts/mark-node-terminal "<target-node-id>" no-claim
     ```
     Reaping is not permission to continue: **STOP** first, exactly as the
     `12` and `15` bullets do. Reaping without stopping is worse than either
     failure alone — the session proceeds into Step 1's graph reads and writes
     having already declared itself terminal.

     Being "not reachable" is not a reason to skip the marker. If it ever does
     fire, a session with no terminal disposition is held by
     `dispatch-self-close` and its node becomes permanently unselectable — an
     unreachable path that leaks a job slot when reached is worse than one
     that reports and reaps.
   - `15` — unknown-freshness: the gate could not prove the snapshot is
     fresh. **STOP**, make no graph write, and record the terminal
     disposition with `mark-node-terminal "<target-node-id>" no-claim`,
     exactly as the `12` bullet above (this session did nothing and lost
     nothing, so reaping it is correct):
     ```bash
     packages/intentionsutil/scripts/mark-node-terminal "<target-node-id>" no-claim
     ```
     Do not tell the session to retry with `--allow-stale`: the override is
     an operator act on the manual `dispatch <node-id>` lane, not a
     self-serve escape for an autonomous align-tactics worker.
   - any other non-zero — mechanical error. The bullet is deliberately
     written as "any other non-zero" and NOT as literal `2`, because these do
     not share an exit code:
       - a malformed store exits `2` from `check-node-selection` itself
         (`main()` maps every throw to it);
       - an unresolvable project root exits `2` from the WRAPPER,
         `assert-node-selection:113-116` (the `exit 2` is at `:115`), before
         the gate is ever invoked;
       - **a failed `git fetch` exits `1`** (`assert-node-selection:139-142`,
         the `exit 1` at `:141`) — the common transient case, and the reason
         narrowing this bullet to `2` would silently leave it unrouted.

     **STOP.** Report the error plainly, and record the terminal disposition
     exactly as the `12` and `15` bullets do:
     ```bash
     packages/intentionsutil/scripts/mark-node-terminal "<target-node-id>" no-claim
     ```
     The same reasoning carries: this gate runs at Step 0, before any graph
     write, so a session that fails it did nothing and lost nothing — reaping
     it is correct.

     Reaping does NOT suppress the error; it is still on stderr and in the
     journal. WITHOUT the marker the failure is strictly worse than a reported
     one: `dispatch-self-close` holds the node worker alive, and
     `graph-select-target` then skips the node as `live-session` from that
     point on — permanently unselectable, permanently consuming a job slot. A
     broken environment should be loud, not silently absorbing capacity.

     A stale selection (`12`) is NOT an `office_hours` park and NOT a defect;
     a mechanical error is neither of those either — it is a broken
     environment to report plainly, per this repo's code-style convention of
     clear errors over defensive fallbacks.

   **Deliberately not gated by `assert-node-selection`** — each of these has
   a shape this gate cannot express, so a future session should not "finish
   the rollout" by wiring it in:

   - `/office-hours` — operates on an **office_hours-parked** node by
     definition; the gate's park check would reject every legitimate run.
   - `/align-strategy` — may target a strategy that doesn't exist yet (a
     new-strategy interview), and strategies carry no phase to gate on.
   - `/align-init` — has no node target at all.
   - `/grounding-research` — walks many nodes; there is no single selected
     target to gate.

## Tactic target — per-node finalize or re-plan

When the argument is a `tactic-<slug>` (not a `strategy-<slug>`), this
session operates on exactly one pre-existing frozen tactic node — the
router queued it because its `frozenTacticSelectable` gate approved it
(`packages/intentionsutil/src/router.ts:496`). There is no strategy
decomposition and no `rounds` bump in this flow; it runs the same Step 0
claim/worktree mechanics and the same Autonomy contract as the
strategy-target flow. This session reads the node's frontmatter to tell a
**draft/raw** tactic (`phase` absent) — which it **finalizes**, landing
`phase: implement` with a full plan body — from a **soft-frozen** tactic
(`phase` already in-flight but its `execution.strategy_fingerprint` entry
for one serving strategy is stale) — which it **re-plans**, reconciling the
whole node while preserving the existing in-flight `phase`. Either way, the
underlying decompose/plan judgment runs inside the Workflow
(`.claude/workflows/align-tactics.js`, invoked with `mode: "tactic"`, which
skips the `decompose` phase entirely), and the single-node result lands
through the same Step 2 writer used by the strategy-target flow. See
`references/tactic-target.md` for the full argument-construction and
disposition mechanics (`args` shape, the split-must-land-atomically
exception, and why no strategy edit is ever made from this path).

## Autonomy contract

Runs to completion without user interaction. Parks to `office_hours` — never
`AskUserQuestion` — under three conditions: requirement ambiguity, major
scope deviation, and an unverifiable blocker. Every park writes recoverable
context (reason plus a next-steps recommendation) at park time, since
session attach/resume is not a supported recovery path. See
`references/autonomy.md` for the full park-condition definitions, the
park-time recommendation convention (including today's `reason`-string
workaround pending a first-class `office_hours.recommendation` field), and
the unrecorded-context park framing.

## Idempotency

`/align-tactics` decomposes one strategy into N tactics, so idempotency is
per-tactic, not a single strategy-level marker: before planning, enumerate the
strategy's existing children with the census script

```
npx tsx packages/intentionsutil/scripts/align-tactics-census.ts <strategy-id> intentions
```

and skip any already at `phase: implement` with a landed plan; a partial prior
run resumes by planning only what's missing. The census reports each child's
`classification` (`draft` / `born-parked` / `open` / `done`), `phase`,
`statement`, body headings, and — for a born-parked child — the first line of
its `office_hours.reason`; read the classification off its output
rather than re-deriving it from a raw `phase`/`office_hours` read. See
`references/idempotency.md` for the census output contract and how to tell an
`/align`-retained draft from a born-parked child (both are
`phase`-absent, but only the latter carries `office_hours`).

## Step 1 — Build `args` and invoke the Workflow

The strategy-target decomposition — the two-sided drift review, the
decompose-to-signal judgment, and the per-tactic plan authoring — runs inside
the `align-tactics` Workflow (`.claude/workflows/align-tactics.js`), **not** on
this caller thread. The Workflow does pure subagent fan-out + JS aggregation and
touches no files, git, or graph state. This session's job around it is to
**assemble the input**, invoke the Workflow, and **land the graph writes** it
returns (Step 2). The Sonnet/Opus model tiering (the reuse hunts run on Sonnet,
the drift/decompose/plan judgment on Opus) is structural inside the Workflow —
this session no longer re-types a `model:` at each subagent callsite.

**Gather the input.** Read the strategy node's frontmatter (`readNode` via a
small `tsx` one-liner, or just read the file — only the frontmatter is
authoritative): `statement`, `rationale`, `success_signal`, `reading`,
`clarifications`, `attributes.conditions`, and `rounds`. `gap` is **not** a
stored field — it is derived on every read via `deriveGap`
(`packages/intentionsutil/src/sensors.ts`). Take the strategy's derived gap from
the `=== Serving strategy ===` block the Idempotency section's census script
prints (`npx tsx packages/intentionsutil/scripts/align-tactics-census.ts
<strategy-id> intentions`); never read it off frontmatter. Read its draft child
tactics (their bodies carry retained tactical context from `/align`)
and its existing non-draft children — the Idempotency section's census script
finds both, and its `classification` field tells a draft (`phase` absent **and**
`office_hours` unset) from a born-parked child (`phase` absent **with** `office_hours` set,
which is decided human-owned work, **not** a draft — leave it out of the input).
Dump the base manifest for every pre-existing node this round will edit
**here**, at this read, before any write — see `references/write-path.md`'s
"Capture a base manifest" section for the recipe.

**Build `args`.**

```
args = {
  mode:              "strategy",
  strategy: {
    id, statement, rationale, success_signal, reading,
    derived_gap,                              // from the census `=== Serving strategy ===` block:
                                              //   derived on read via deriveGap, never stored
    clarifications:  [ ... ],                 // the strategy's clarifications array
    conditions:      [ ... ],                 // attributes.conditions entries (Side-A drift)
    rounds:          { count, last_completed, last_aligned },
  },
  draft_tactics:     [ { id, statement, body }, ... ],   // phase-absent, office_hours-unset children only
  existing_children: [ { id, phase, on_signal_path }, ... ], // the non-draft children
  reuse_hunts:       [ { focus, scope }, ... ],          // up to 3 (default 1); omit to run one general hunt
  existing_ids:      [ ... ],   // every pre-existing real node id in the serving strategy's corpus,
                                //   for the Step-2 resolveTempRefs pass (edges to a pre-existing node pass through)
}
```

The eligibility sanity check (`office_hours` null, signal unvalidated, the
fresh-reading gate, no non-draft child already on the signal path,
`rounds.count < 2`) is the Workflow's drift phase — do **not** re-decide it here;
just supply the inputs it judges from. This check is **strategy-mode only**. A
per-node `/align-tactics <tactic-id>` run does not evaluate it — a sibling
tactic (in-flight or completed-but-unpruned) sitting on the strategy's signal
path never blocks a per-node finalize; that run's drift review judges Side A /
Side B against the one target node and parks the tactic, never the strategy.

**Invoke the Workflow tool on the registered `align-tactics` workflow**, passing
`args`. This skill is a sanctioned caller of that Workflow — no `ultracode`
keyword needed. The Workflow runs in the background and returns one structured
result:

```
result = {
  mode, drift,
  tactics:          [ ... ],   // the decomposed tactic set; each carries temp_ref, slug_hint,
                               //   kind/owner/status/serves/parent/blocked_by/validates,
                               //   claude_eligible, copy_touching, instrument, statement,
                               //   office_hours, draft_source_id, and body_markdown
                               //   (null for a tactic whose plan agent parked or died)
  plans:            [ ... ],   // one entry per claude-eligible tactic the plan phase authored
  gates:            [ ... ],   // born-parked author-approval (copy) gates, each with temp_ref,
                               //   slug_hint, serves, statement, office_hours_reason, blocks
  parks:            [ ... ],   // every park across drift/decompose/plan: {target, reason, category}
  prunes, greenfield_drops,
  findings_surfaced, findings_actionable, fixes_applied, followups_filed,
  subagents_launched, deviation, disposition,
}
```

The decomposition doctrine now lives in the Workflow's phase prompts — read
`.claude/workflows/align-tactics.js` for the full text; do **not** re-derive it
on this thread. In brief, so a fresh reader still knows *what* happens:

- **Two-sided drift review** (`buildDriftPrompt`) — Side A (a recorded
  `attributes.conditions` entry failed → park the strategy; conditions are
  human-decided) and Side B (the round's plans depend on an *unrecorded* premise
  → a **material** premise parks the strategy for author ratification, an
  **immaterial** one lands as a dated `clarifications` entry without
  interrupting). (In `mode: "tactic"`, both sides park **the target tactic**
  instead of the strategy.) Absorbs `/plan-issue`'s relevance/drift, convention-drift, and
  merged-work-overlap review, with the graph as the corpus. Every clarification
  answer carries a dated provenance clause (`validateGraph` rule 17 enforces the
  date-presence half).
- **Decompose to the signal** (`buildDecomposePrompt`) — the **minimum** tactic
  set that validates `success_signal` this round (leaf = one PR): instrument-first
  when `reading` is null (strategy clarification 3), consume each draft
  (finalize / split / merge / prune — a split lands its parent edit and new
  sibling atomically, Step 2), shape the subtree via `parent` (rule 6) and
  `blocked_by` (rules 13, 15), gate in-scope copy behind a born-parked approval
  gate (`strategy-author-approved-copy`; the gate rides in `result.gates`, its id
  wired into the copy tactic's `blocked_by`, the draft copy carried in the copy
  tactic's body), the greenfield-relevance gate (clarification 26), the
  layer-placement gate before finalizing a draft (kind-tactic's authoring test,
  `intentions/kind-tactic.md` 2026-07-21 clarification — a draft that is really a
  standing requirement stays a draft and parks),
  `validates: [<strategy-id>]` on each signal-validating tactic (rule 14;
  clarification 11), off-path work carries **no** flag (clarifications 9, 11), and
  sole-tracker recording (clarification 28 — every defect lands as a tactic,
  never a side channel).
- **Plan each claude-eligible tactic** (`buildPlanPrompt`) — a full clean-session
  plan body per the `PLAN BODY SCHEMA` block inlined in that prompt (Context,
  units of work each with Scope / Recommended model / Dependencies, Reuse,
  Verification) and its quality bar: a fresh session with ONLY the node body
  must be able to execute the plan. That block is the schema's canonical home,
  and the plan is authored on Opus to meet the bar.
  A unit delivering a chart, dashboard, or other data-viz surface loads
  `/dataviz` (the mandated guidance source) and carries its chosen form,
  validated palette, and mark/interaction specs.

This session records the outcome regardless of `disposition` — a decomposition,
a set of parks, or both. `result.deviation` is LIVE: true when any park exists or
drift said do not proceed.

## Step 2 — Apply the Workflow result

The Workflow authored no files; this session lands every graph write. The
shape of the work, in order: **mint** real node ids for the Workflow's
`temp_ref`s and rewrite edges, **dump** a base manifest for every
pre-existing node this round touches (`dump-node.ts`), write each node's
**frontmatter** (`write-node.ts`), **assert** freshness against
`origin/main` for every id about to receive a body write
(`assert-node-fresh`), `Edit` in each planned tactic's **body** (the
Workflow's `body_markdown`), **land** the whole round in one or a few
`graph-commit --base` calls — the round's **final** call through
`land-align-round --terminal <target-node-id>`, which bundles the
terminal-disposition marker into the same process as the land — then
**validate** (`validate-graph.ts`). Parks (`result.parks`) are written the same way, as
`office_hours: {reason, since}` on the target node. `graph-commit` has three
distinct exit-1 cases — a park that landed on `main` (a concurrent writer
landed first; this session's content is unlanded but preserved on disk), a
park whose own push failed (nothing on `main` at all — the parking
*announcement* prints before the push, so it does not distinguish these two),
and busy-main exhaustion (nothing landed, no park) — in every case, report and
stop rather than retry automatically. See `references/write-path.md` for the
full write-node.ts/dump-node.ts/assert-node-fresh/graph-commit mechanics,
exit-1 discrimination, park-writing, and the fingerprint/round-accounting
details (per-strategy `execution.strategy_fingerprint` map via
`strategy-fingerprint.ts`, and the strategy's
`rounds.count`/`last_completed`/`last_aligned` bookkeeping).

The round's **final** landing call goes through
`packages/intentionsutil/scripts/land-align-round --terminal <target-node-id>
...` rather than a bare `graph-commit`. That wrapper writes this session's
terminal disposition marker (`align-round`, or `park` when `graph-commit`'s
concurrent-edit fallback parked the node **and pushed that park to main**) in
the **same process** as the land. When the park itself failed to push, no
marker is written and the session stays held — same as busy-main exhaustion.
There is no separate marker step to run.

The Stop hook (`.claude/hooks/dispatch-stop.sh`) reaps this node worker's job
only on positive evidence that the pass ended — `Stop` fires on every turn
yield, not only on terminal exit, so an unmarked session is held alive instead
of reaped. Bundling the marker into the landing process is what makes that
evidence unmissable: as a separate call a turn or more later, it was skipped
whenever the session died in between, leaving the round landed on `main` with
no declared disposition for the tick's terminal-without-disposition sweep to
read (confirmed 3x in production). The wrapper's marker call is safe
unconditionally — `mark-node-terminal` writes nothing unless this job's own
name is `<target-node-id>`, so a round that lands *child* tactics cannot
authorize a reap on their behalf.

Consequently `validate-graph.ts` runs AFTER the marker, not before it. A
`validate-graph.ts` failure on an already-landed round is **reported and filed
as a follow-up**, not held as a live session: the graph is already invalid on
`main`, and holding this session open does not fix it.

## Re-evaluation mode

When invoked after a mid-flight strategy edit — the router detects a stale
`execution.strategy_fingerprint` on an open tactic and queues one
re-evaluation session (strategy clarification 10) — the session does not
decompose fresh. Instead it reads the edited strategy and every open
(non-draft, non-`done`) child in full, then amends, prunes, splits, or
confirms each against the edited substance (a **whole-node** reconciliation,
not a one-bullet patch), re-stamps only the re-evaluated strategy's entry in
each surviving tactic's `execution.strategy_fingerprint` map, and lands the
amendments via `graph-commit`. A separate, unrelated re-stamp protects each
amended tactic's own scope custody when the edit was scope-inert. Under the
router, this same reconciliation can also run as a **per-node**
`/align-tactics <tactic-id>` session targeting one soft-frozen tactic — see
"Tactic target", above. See `references/tactic-target.md` for the full
open-child-sweep mechanics, the scope-inert re-stamp procedure
(`restamp-scope-fingerprint.ts`), and how the per-node and strategy-wide
forms relate.

## Out of scope

- The router's consumption of `phase` (selection, transitions, the soft-freeze
  gate) — `tactic-graph-router-selector` / `tactic-graph-router-transitions`,
  not this skill.
- `/align` (recording the strategy under interview) — sibling skill.
- Retiring `/plan-issue` / `/file-issue` — done by
  `tactic-legacy-router-removal` Unit 2. Both SKILL.md bodies are now
  retirement stubs pointing here and at `/align`; neither works for
  gh-issue work any more (GitHub Issues are disabled repo-wide). Deleting the
  stub directories outright is not this skill's work either.
- `phase: main-qa` — it is in the spec enum (strategy clarification 22) but
  **not** in `schema.ts`'s `PHASES`, so `write-node.ts` would throw on it.
  This skill lands only `phase: implement` (and consumes drafts); needs-main
  residue rides the source tactic into `main-qa` under the router, never
  something this skill stamps.

## Verification

Prose — this is an autonomous decomposition skill; its output is graph state,
verified by re-running against a small strategy with a null `reading`:

- Round 1 includes an instrument tactic (the null-reading requirement).
- Leaves are PR-sized; each planned tactic body carries the plan schema with
  per-unit `Recommended model` tags and, where applicable, fenced ` ```verify `
  blocks.
- The written nodes pass
  `npx tsx packages/intentionsutil/scripts/validate-graph.ts intentions` (the
  store directory is a required argument, clarification 194/242) — in particular
  `serves` resolves to the strategy (rule 7), `validates` to the strategy
  (rule 14), `blocked_by` to tactics with no cycle (rules 13, 15), and no
  tactic-only field lands on a non-tactic (rule 10).
- Signal-validating tactics carry `validates: [<strategy-id>]`; off-path
  tactics carry no flag.
- The tactics and any strategy frontmatter change land atomically via
  `graph-commit` (visible on `origin/main`), and **no** `gh issue`/`gh pr`
  command ran anywhere in the flow.
